import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  GestorDocumentalMethods,
  ImplicitAutenticationService,
} from '@udistrital/planeacion-utilidades-module';
import {
  Reformulacion,
  ReformulacionStorage,
} from 'src/app/models/reformulacion';
import { RequestManager } from 'src/app/services/requestManager.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { VisualizarDocumentoDialogComponent } from '../../generar-trimestre/visualizar-documento-dialog/visualizar-documento-dialog.component';
import { Parametro } from 'src/app/models/parametro';
import { DataRequest } from 'src/app/models/dataRequest';
import { GestorDocumentalService } from 'src/app/services/gestorDocumental.service';
import { Router } from '@angular/router';
import { CodigosService } from '@udistrital/planeacion-utilidades-module';

const FORMATOS = ['application/pdf'];

@Component({
  selector: 'app-solicitud',
  templateUrl: './solicitud.component.html',
  styleUrls: ['./solicitud.component.scss'],
})
export class SolicitudComponent implements OnInit {
  unidad: any;
  formVisualizacionPlan: FormGroup;
  rol: string = '';
  fileName!: string;
  archivoCodificado: string = '';
  observaciones: string = '';
  reformulacionStorage: ReformulacionStorage;
  reformulacionActual!: Reformulacion;
  estado!: Parametro;

  private gestorMethods = new GestorDocumentalMethods();
  private autenticationService = new ImplicitAutenticationService();

  ID_ESTADO_APROBADO = '';
  ID_ESTADO_RECHAZADO = '';
  ID_ESTADO_FORMULADO = '';

  private codigosService = new CodigosService();

  constructor(
    private formBuilder: FormBuilder,
    private request: RequestManager,
    public dialog: MatDialog,
    private gestorDocumental: GestorDocumentalService,
    private router: Router
  ) {
    let reformulacionData = localStorage.getItem('reformulacion');
    if (!reformulacionData) {
      this.router.navigate(['reformulacion']);
    }
    this.reformulacionStorage = JSON.parse(
      localStorage.getItem('reformulacion')!
    ) as ReformulacionStorage;
    localStorage.removeItem('reformulacion');

    this.formVisualizacionPlan = this.formBuilder.group({
      unidad: [
        this.reformulacionStorage.dependencia || '',
        Validators.required,
      ],
      estado: ['', Validators.required],
      plan: [this.reformulacionStorage.plan || '', Validators.required],
      vigencia: [this.reformulacionStorage.vigencia],
    });
  }
  async ngOnInit() {
    const roles: string[] = await this.autenticationService.getRoles();
    if (roles.find((x: string) => x == 'PLANEACION')) {
      this.rol = 'PLANEACION';
    } else if (roles.find((x: string) => x == 'ASISTENTE_PLANEACION')) {
      this.rol = 'ASISTENTE_PLANEACION';
    } else if (roles.find((x: string) => x == 'JEFE_DEPENDENCIA')) {
      this.rol = 'JEFE_DEPENDENCIA';
    } else if (roles.find((x: string) => x == 'ASISTENTE_DEPENDENCIA')) {
      this.rol = 'ASISTENTE_DEPENDENCIA';
    }

    this.ID_ESTADO_APROBADO = await this.codigosService.getId('PARAMETROS_SERVICE', 'parametro', 'RPA-A');
    this.ID_ESTADO_RECHAZADO = await this.codigosService.getId('PARAMETROS_SERVICE','parametro','RPA-R');
    this.ID_ESTADO_FORMULADO = await this.codigosService.getId('PARAMETROS_SERVICE','parametro','RPA-F');

    if (this.reformulacionStorage.reformulacion) {
      this.cargarReformulacion(this.reformulacionStorage.reformulacion);
    } else {
      this.request
        .get(
          environment.PLANES_CRUD,
          `reformulacion?query=plan_id:${this.reformulacionStorage.plan_id},activo:true`
        )
        .subscribe({
          next: async (data: DataRequest) => {
            if ((data?.Data as Reformulacion[]).length > 0) {
              this.cargarReformulacion(data.Data[0]);
            } else {
              this.formVisualizacionPlan.get('estado')!.setValue('Habilitado');
            }
          },
        });
    }
  }

  private cargarReformulacion(ref: Reformulacion) {
    this.reformulacionActual = ref;
    this.observaciones = this.reformulacionActual.observaciones;
    this.request
      .get(
        environment.PARAMETROS_SERVICE,
        `parametro/${this.reformulacionActual.estado_id}`
      )
      .subscribe({
        next: (data: DataRequest) => {
          this.estado = data.Data;
          console.log('this.estado', this.estado);
          this.formVisualizacionPlan
            .get('estado')!
            .setValue(this.estado.Nombre);
        },
      });
    console.log(this.reformulacionActual.archivos);
    this.fileName = JSON.parse(this.reformulacionActual.archivos)[
      'documentos'
    ][0]['nombre'];
    console.log(JSON.parse(this.reformulacionActual.archivos)['documentos'][0]);
  }
  solicitarReformulacion() {
    if (this.archivoCodificado !== '') {
      Swal.fire({
        title: '¿Desea cargar la solicitud de reformulación?',
        icon: 'question',
        confirmButtonText: `Sí`,
        cancelButtonText: `No`,
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Solicitud en proceso',
            timerProgressBar: true,
            showConfirmButton: false,
            willOpen: () => {
              Swal.showLoading();
            },
          });
          const bodyRequest = {
            documento: [
              {
                IdTipoDocumento: 87,
                nombre: this.fileName,
                metadatos: {
                  dato_a: 'Soporte planeacion',
                },
                descripcion: `Documento de soporte para reformulación para el plan de acción con ID ${this.reformulacionStorage.plan_id}`,
                file: this.archivoCodificado,
                Activo: true,
              },
            ],
            plan_id: this.reformulacionStorage.plan_id,
            observaciones: this.observaciones,
          };
          this.request
            .post(environment.SEGUIMIENTO_MID, `reformulacion`, bodyRequest)
            .subscribe({
              next: (data) => {
                if (data) {
                  Swal.close();
                  Swal.fire({
                    title: 'Solicitud realizada',
                    text: 'La petición de reformulación ha sido recibida y será procesada por la Oficina de Planeación.',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 2500,
                  });
                }
              },
              error: (error) => {
                console.error(error);
                Swal.close();
                Swal.fire({
                  title: 'Error en la operación',
                  text: 'No fue posible realizar la solicitud.',
                  icon: 'error',
                  showConfirmButton: false,
                  timer: 2500,
                });
              },
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Solicitud de reformulación cancelada',
            icon: 'error',
            showConfirmButton: false,
            timer: 2500,
          });
        }
      });
    } else {
      if (this.archivoCodificado === '') {
        Swal.fire({
          title: 'Ingrese Evidencias',
          icon: 'error',
          showConfirmButton: false,
          timer: 2500,
        });
      }
    }
  }
  async visualizarArchivo() {
    if (this.fileName != undefined) {
      if (!this.estado) {
        this.dialog.open(VisualizarDocumentoDialogComponent, {
          width: '80%',
          minHeight: 'calc(100vh - 90px)',
          height: '80%',
          data: {
            url: 'data:application/pdf;base64,' + this.archivoCodificado,
            editable: false,
            Observacion: this.observaciones,
          },
        });
      } else {
        this.gestorDocumental
          .get(JSON.parse(this.reformulacionActual.archivos)['documentos'])
          .subscribe({
            next: (documento: any[]) => {
              this.dialog.open(VisualizarDocumentoDialogComponent, {
                width: '80%',
                minHeight: 'calc(100vh - 90px)',
                height: '80%',
                data: { ...documento[0], editable: false },
              });
            },
            error: (error) => {
              Swal.fire({
                title: 'Error en la operación',
                text: `No se pudo cargar el documento ${JSON.stringify(error)}`,
                icon: 'warning',
                showConfirmButton: false,
                timer: 2500,
              });
            },
          });
      }
    } else {
      Swal.fire({
        title: 'Error en la operación',
        text: `No hay ningún archivo cargado`,
        icon: 'warning',
        showConfirmButton: false,
        timer: 2500,
      });
    }
  }

  async onChangeArchivo(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!FORMATOS.includes(file.type)) {
        Swal.fire({
          title: 'Archivo no válido',
          text: `No se admite el tipo de archivo que seleccionó`,
          icon: 'error',
          showConfirmButton: false,
          timer: 2500,
        });
      } else {
        Swal.fire({
          title: `Desea guardar el archivo ${file.name}?`,
          icon: 'info',
          confirmButtonText: `Sí`,
          cancelButtonText: `No`,
          showCancelButton: true,
        }).then(
          async (result) => {
            if (result.isConfirmed) {
              Swal.close();
              Swal.fire({
                title: 'Guardando documento',
                timerProgressBar: true,
                showConfirmButton: false,
                willOpen: () => {
                  Swal.showLoading();
                },
              });

              this.fileName = file.name;
              this.archivoCodificado = (await this.gestorMethods.fileToBase64(
                file
              )) as string;

              Swal.close();
              Swal.fire({
                title: 'Documento guardado con éxito',
                icon: 'success',
                timer: 2500,
              });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              Swal.fire({
                title: 'No se guardó el archivo',
                icon: 'info',
                showConfirmButton: false,
                timer: 2500,
              });
            }
          },
          (error) => {
            console.error(error);
            Swal.fire({
              title: 'Error en la operación',
              icon: 'error',
              showConfirmButton: false,
              timer: 2500,
            });
          }
        );
      }
    } else {
      Swal.fire({
        title: 'Error en la operación',
        text: `No se pudo subir el documento`,
        icon: 'warning',
        showConfirmButton: false,
        timer: 2500,
      });
    }
  }
  activarCargarArchivo() {
    (document.getElementById('archivo') as HTMLInputElement).click();
  }

  actualizarReformulacion(activo: boolean, estado_id: number) {
    this.request
      .put(
        environment.PLANES_CRUD,
        'reformulacion',
        {
          ...this.reformulacionActual,
          activo,
          estado_id,
        } as Reformulacion,
        this.reformulacionActual._id
      )
      .subscribe({
        next: (data) => {
          if (data) {
            Swal.fire({
              title: `Reformulación ${
                estado_id.toString() === this.ID_ESTADO_APROBADO
                  ? 'Aprobada'
                  : 'Rechazada'
              }`,
              text: 'La reformulación ha sido procesada exitosamente.',
              icon: 'success',
              showConfirmButton: false,
              timer: 2500,
            }).then(() => {
              window.location.reload();
            });
          }
        },
      });
  }
  aprobarReformulacion() {
    this.actualizarReformulacion(
      false,
      Number.parseInt(this.ID_ESTADO_APROBADO)
    );
  }
  rechazarReformulacion() {
    this.actualizarReformulacion(
      false,
      Number.parseInt(this.ID_ESTADO_RECHAZADO)
    );
  }
}
