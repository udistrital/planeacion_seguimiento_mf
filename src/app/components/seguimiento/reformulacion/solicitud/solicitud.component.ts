import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { GestorDocumentalMethods } from '@udistrital/planeacion-utilidades-module';
import { RequestManager } from 'src/app/services/requestManager.service';
import Swal from 'sweetalert2';
import { VisualizarDocumentoDialogComponent } from '../../generar-trimestre/visualizar-documento-dialog/visualizar-documento-dialog.component';
import { environment } from 'src/environments/environment';
import { ReformulacionAux } from 'src/app/models/reformulacion';

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
  estado: string = '';
  fileName!: string;
  archivoCodificado: string = '';
  observaciones: string = '';
  planTraido: ReformulacionAux;
  private gestorMethods = new GestorDocumentalMethods();

  constructor(
    private formBuilder: FormBuilder,
    private request: RequestManager,
    public dialog: MatDialog
  ) {
    this.planTraido = JSON.parse(
      localStorage.getItem('plan_reformulacion')!
    ) as ReformulacionAux;
    this.formVisualizacionPlan = this.formBuilder.group({
      unidad: [
        this.planTraido.dependencia_nombre.Nombre || '',
        Validators.required,
      ],
      estado: [this.planTraido.plan.estado_plan_id || '', Validators.required],
      plan: [this.planTraido.plan.nombre || '', Validators.required],
      vigencia: [this.planTraido.vigencia.Nombre],
    });
  }
  ngOnInit() {
    this.request
      .get(
        environment.PLANES_CRUD,
        `estado-plan?query=_id:${this.planTraido.plan.estado_plan_id}`
      )
      .subscribe({
        next: (data) => {
          if (data.Data) {
            this.formVisualizacionPlan
              .get('estado')!
              .setValue(data.Data[0].nombre);
          }
        },
      });
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
                IdTipoDocumento: 60,
                nombre: this.fileName,
                metadatos: {
                  dato_a: 'Soporte planeacion',
                },
                descripcion:
                  'Documento de soporte para reformulación de plan de acción',
                file: this.archivoCodificado,
                Activo: true,
              },
            ],
            plan: this.planTraido.plan,
            observaciones: this.observaciones,
          };
          // environment.SEGUIMIENTO_MID,
          // `detalles/documento`,
          this.request
            .post(
              environment.PRUEBAS,
              `reformulacion`,
              bodyRequest
            )
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
          setTimeout(() => {}, 4000);
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
      this.dialog.open(VisualizarDocumentoDialogComponent, {
        width: '1200',
        minHeight: 'calc(100vh - 90px)',
        height: '80%',
        data: {
          url: 'data:application/pdf;base64,' + this.archivoCodificado,
          editable: false,
          Observacion: this.observaciones,
        },
      });
      // this.gestorDocumental.get([{ file: this.fileName }]).subscribe({
      //   next: (documento: any[]) => {
      //     const dialogRef = this.dialog.open(
      //       VisualizarDocumentoDialogComponent,
      //       {
      //         width: '1200px',
      //         minHeight: 'calc(100vh - 90px)',
      //         height: '800px',
      //         data: { ...documento[0], editable: false },
      //       }
      //     );

      //     dialogRef.afterClosed().subscribe((result) => {
      //       if (result == undefined) {
      //         return undefined;
      //       } else {
      //         for (
      //           let index = 0;
      //           index < this.dataSource.data.length;
      //           index++
      //         ) {
      //           if (this.dataSource.data[index]['Id'] == result['Id']) {
      //             this.dataSource.data[index]['Observacion'] =
      //               result['Observacion'];
      //           }
      //         }
      //       }
      //     });
      //   },
      //   error: (error: any) => {
      //     Swal.fire({
      //       title: 'Error en la operación',
      //       text: `No se pudo cargar el documento ${JSON.stringify(error)}`,
      //       icon: 'warning',
      //       showConfirmButton: false,
      //       timer: 2500,
      //     });
      //   },
      // });
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
}
