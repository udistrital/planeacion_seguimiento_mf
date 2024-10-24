import { Location, registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { GestorDocumentalService } from 'src/app/services/gestorDocumental.service';
import { GestorDocumentalMethods } from '@udistrital/planeacion-utilidades-module';
import { ImplicitAutenticationService } from '@udistrital/planeacion-utilidades-module';
import { RequestManager } from 'src/app/services/requestManager.service';
import { Notificaciones } from "src/app/services/notificaciones";
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { EvidenciasDialogComponent } from '../evidencias/evidencias-dialog.component';
import * as bigInt from 'big-integer';

@Component({
  selector: 'app-generar-trimestre',
  templateUrl: './generar-trimestre.component.html',
  styleUrls: ['./generar-trimestre.component.scss'],
})
export class GenerarTrimestreComponent implements OnInit, AfterViewInit {
  columnasIndicadores: string[] = [
    'nombre',
    'formula',
    'meta',
    'reporteNumerador',
    'reporteDenominador',
    'detalleReporte',
    'observaciones',
  ];
  datosIndicadores: any[] = [];
  columnasResultados: string[] = [
    'indicador',
    'indicadorAcumulado',
    'avanceAcumulado',
    'brechaExistente',
  ];
  datosResultados: MatTableDataSource<any>;
  displayedColumns: string[] = [
    'id',
    'unidad',
    'estado',
    'vigencia',
    'periodo',
    'seguimiento',
    'observaciones',
    'enviar',
  ];
  dataSource: MatTableDataSource<any>;
  selectedFiles: any;
  datosCualitativo: any = {
    reporte: '',
    productos: '',
    dificultades: '',
    observaciones_planeacion: '',
    observaciones_dependencia: ''
  };
  formCualitativo: FormGroup;
  FORMATOS = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/msword',
    'application/pdf',
    'audio/x-m4a',
    'audio/webm',
    'audio/x-wav',
    'audio/ogg',
    'audio/aac',
    'image/png',
    'image/jpeg',
  ];

  @ViewChild('MatPaginatorIndicadores') paginatorIndicadores: MatPaginator =
    new MatPaginator(new MatPaginatorIntl(), ChangeDetectorRef.prototype);
  @ViewChild('MatPaginatorResultados') paginatorResultados: MatPaginator =
    new MatPaginator(new MatPaginatorIntl(), ChangeDetectorRef.prototype);

  rol: string = '';
  planId: string = '';
  plan: string = '';
  indexActividad: string = '';
  trimestreId: string = '';
  codigoTrimestre: string = '';
  formGenerarTrimestre: FormGroup;
  indicadores: File[] = [];
  documentos: any[] = [];
  indicadorSelected: boolean;
  seguimiento: any = {
    informacion: '',
    estado: '',
    cualitativo: '',
    cuantitativo: '',
    evidencia: '',
  };
  indicadorActivo: string = '';
  documentoSeleccionado: File | undefined;
  trimestre: string = '';
  trimestreAbr: string = '';
  auxDocumentos: string[] = [];
  generalData: any = {};
  generalDatar: any = {};
  listIndicadores: any = {};
  textoDeInput: string = '';
  mostrarObservaciones: boolean;
  documentoPlaneacion: any;
  estadoActividad: string = '';
  estadoSeguimiento: string = '';
  estados: any[] = [];
  readonlyFormulario: boolean = true;
  readonlyObservacion: boolean = true;
  unidad: string = '';
  vigencia: any;
  numeradorOriginal: number[] = [];
  denominadorOriginal: number[] = [];
  calcular: boolean = true;
  abrirDocs: boolean = true;
  txtObservaciones: string = '';
  txtPlaceHolderObservaciones: string = '';
  codigoNotificacion: string = "";
  id_actividad: any;
  ObservacionesPlaneacion?: boolean;
  ObservacionesDependencia?: boolean;

  private gestorMethods = new GestorDocumentalMethods();
  private autenticationService = new ImplicitAutenticationService();

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private router: Router,
    private request: RequestManager,
    private notificacionesService: Notificaciones,
    private gestorDocumental: GestorDocumentalService,
    private _location: Location,
    public dialog: MatDialog
  ) {
    this.datosResultados = new MatTableDataSource();
    this.dataSource = new MatTableDataSource();
    this.activatedRoute.params.subscribe((prm) => {
      this.planId = prm['plan_id'];
      this.indexActividad = prm['index'];
      this.trimestreId = prm['trimestre_id'];
    });
    this.getRol();
    this.loadData();
    this.loadTrimestre();
    this.loadEstados();
    registerLocaleData(es);
    this.formGenerarTrimestre = this.formBuilder.group({
      indicador: ['', Validators.required],
      avancePeriodo: ['', Validators.required],
      avanceAcumulado: ['', Validators.required],
      producto: ['', Validators.required],
      evidencia: ['', Validators.required],
      logros: ['', Validators.required],
      dificultades: ['', Validators.required],
      observaciones: ['', Validators.required],
      documentos: [''],
      autor: [''],
      observacionesP: [''],
      estadoActividad: [''],
    });
    this.formCualitativo = this.formBuilder.group(this.datosCualitativo);
    this.indicadorSelected = false;
    this.mostrarObservaciones = false;
    this.ObservacionesPlaneacion = false;
    this.ObservacionesDependencia = false;
  }

  ngOnInit(): void { }

  ngAfterViewInit() {
    Swal.fire({
      title: 'Cargando información',
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });
  }

  getRol() {
    let roles: any = this.autenticationService.getRoles();
    if (
      roles.__zone_symbol__value.find((x: string) => x == 'JEFE_DEPENDENCIA')
    ) {
      this.rol = 'JEFE_DEPENDENCIA';
    } else if (
      roles.__zone_symbol__value.find((x: string) => x == 'ASISTENTE_DEPENDENCIA')
    ) {
      this.rol = 'ASISTENTE_DEPENDENCIA';
    } else if (
      roles.__zone_symbol__value.find((x: string) => x == 'PLANEACION')
    ) {
      this.rol = 'PLANEACION';
    } else if (
      roles.__zone_symbol__value.find((x: string) => x == 'ASISTENTE_PLANEACION')
    ) {
      this.rol = 'ASISTENTE_PLANEACION';
    }
  }

  loadTrimestre() {
    this.request
      .get(environment.PLANES_CRUD, `periodo-seguimiento/` + this.trimestreId)
      .subscribe(
        (data: any) => {
          if (data) {
            let periodoId = data.Data.periodo_id;

            this.request
              .get(
                environment.PARAMETROS_SERVICE,
                `parametro_periodo?query=Id:` + periodoId
              )
              .subscribe(
                (data: any) => {
                  if (data) {
                    this.trimestre = data.Data[0].ParametroId.Nombre;
                    this.codigoTrimestre = data.Data[0].ParametroId.CodigoAbreviacion;
                    this.vigencia = data.Data[0].PeriodoId
                  }
                },
                (error) => {
                  Swal.fire({
                    title: 'Error en la operación',
                    text: `No se encontraron datos del trimestre`,
                    icon: 'warning',
                    showConfirmButton: false,
                    timer: 2500,
                  });
                }
              );
          }
        },
        (error) => {
          Swal.fire({
            title: 'Error en la operación',
            text: `No se encontraron datos del periodo`,
            icon: 'warning',
            showConfirmButton: false,
            timer: 2500,
          });
        }
      );
  }

  loadEstados() {
    this.request.get(environment.PLANES_CRUD, `estado-seguimiento`).subscribe(
      (data: any) => {
        if (data.Data.length != 0) {
          this.estados = data.Data;
        }
      },
      (error) => {
        Swal.fire({
          title: 'Error en la operación',
          text: `No se encontraron datos del estado}`,
          icon: 'warning',
          showConfirmButton: false,
          timer: 2500,
        });
      }
    );
  }

  verificarFormulario() {
    if (this.rol === 'PLANEACION' || this.rol === 'ASISTENTE_PLANEACION') {
      if (
        this.estadoActividad === 'Actividad en reporte' ||
        this.estadoActividad === 'Sin reporte'
      ) {
        this.readonlyFormulario = true;
        this.readonlyObservacion = true;
        this.mostrarObservaciones = false;
      } else if (
        this.estadoActividad === 'Actividad reportada' ||
        this.estadoActividad === 'Con observaciones' ||
        this.estadoActividad === 'Actividad Verificada'
      ) {
        this.readonlyFormulario = true;
        this.readonlyObservacion = !(
          this.estadoSeguimiento === 'En revisión OAPC'
        );
        this.mostrarObservaciones = true;
        this.ObservacionesPlaneacion = false;
        this.ObservacionesDependencia = true;
      } else if (
        this.estadoActividad === 'Actividad avalada' ||
        this.estadoActividad === 'Actividad Verificada'
      ) {
        this.readonlyFormulario = true;
        this.readonlyObservacion = true;
        this.mostrarObservaciones = true;
        this.ObservacionesPlaneacion = true;
        this.ObservacionesDependencia = false;
      }
      if (this.estadoSeguimiento === 'En revisión OAPC') {
        this.readonlyFormulario = true;
        this.readonlyObservacion = false;
        this.mostrarObservaciones = true;
        this.ObservacionesPlaneacion = true;
        this.ObservacionesDependencia = false;
      }
    } else if (this.rol == 'JEFE_DEPENDENCIA') {
      if (
        this.estadoActividad === 'Actividad en reporte' ||
        this.estadoActividad === 'Habilitado' ||
        this.estadoActividad === 'Sin reporte'
      ) {
        this.readonlyFormulario = false;
        this.readonlyObservacion = true;
        this.mostrarObservaciones = false;
      } else if (this.estadoActividad === 'Actividad reportada') {
        this.readonlyFormulario = true;
        if (this.estadoSeguimiento === 'En revisión JU') {
          this.readonlyObservacion = !(this.estadoSeguimiento === 'En revisión JU');
          this.mostrarObservaciones = true;
          this.ObservacionesDependencia = true;
          this.ObservacionesPlaneacion = false;
        } else {
          this.readonlyObservacion = true;
          this.mostrarObservaciones = false;
        }
      } else if (this.estadoActividad === 'Con observaciones') {
        if (
          this.estadoSeguimiento === 'Con observaciones' ||
          this.estadoSeguimiento === 'Revisión Verificada con Observaciones'
        ) {
          this.readonlyFormulario = false;
        } else {
          this.readonlyFormulario = true;
        }
        if (this.estadoSeguimiento === 'En revisión JU') {
          this.readonlyObservacion = !(this.estadoSeguimiento === 'En revisión JU');
          this.mostrarObservaciones = true;
          this.ObservacionesDependencia = true;
          this.ObservacionesPlaneacion = false;
        } else {
          this.readonlyObservacion = true;
          this.mostrarObservaciones = true;
          this.ObservacionesDependencia = true;
          this.ObservacionesPlaneacion = false;
        }
      } else if (
        this.estadoActividad === 'Actividad avalada' ||
        this.estadoActividad === 'Actividad Verificada'
      ) {
        this.readonlyFormulario = true;
        this.readonlyObservacion = true;
        this.mostrarObservaciones = true;
        this.ObservacionesDependencia = true;
        this.ObservacionesPlaneacion = false;
      }
    } else if (this.rol == 'ASISTENTE_DEPENDENCIA') {
      if (
        this.estadoActividad === 'Actividad en reporte' ||
        this.estadoActividad === 'Habilitado' ||
        this.estadoActividad === 'Sin reporte'
      ) {
        this.readonlyFormulario = false;
        this.readonlyObservacion = true;
        this.mostrarObservaciones = false;
      } else if (this.estadoActividad === 'Actividad reportada') {
        this.readonlyFormulario = true;
        this.readonlyObservacion = true;
        this.mostrarObservaciones = false;
      } else if (this.estadoActividad === 'Con observaciones') {
        if (
          this.estadoSeguimiento === 'Con observaciones' ||
          this.estadoSeguimiento === 'Revisión Verificada con Observaciones'
        ) {
          this.readonlyFormulario = false;
        } else {
          this.readonlyFormulario = true;
        }
        this.readonlyObservacion = true;
        this.mostrarObservaciones = true;
        if (this.estadoSeguimiento === 'Con observaciones') {
          this.ObservacionesPlaneacion = true;
          this.ObservacionesDependencia = false;
        } else if (this.estadoSeguimiento === 'Revisión Verificada con Observaciones') {
          this.ObservacionesPlaneacion = false;
          this.ObservacionesDependencia = true;
        }
      } else if (
        this.estadoActividad === 'Actividad avalada' ||
        this.estadoActividad === 'Actividad Verificada'
      ) {
        this.readonlyFormulario = true;
        this.readonlyObservacion = true;
        this.mostrarObservaciones = true;
        if (this.estadoSeguimiento === 'Actividad avalada') {
          this.ObservacionesPlaneacion = true;
          this.ObservacionesDependencia = false;
        } else if (this.estadoSeguimiento === 'Actividad Verificada') {
          this.ObservacionesPlaneacion = false;
          this.ObservacionesDependencia = true;
        }
      }
    }

    if (this.estadoSeguimiento === 'Habilitado' || this.estadoSeguimiento === 'En reporte' || this.estadoSeguimiento === 'Enviado a revisión' || this.estadoSeguimiento === 'En revisión JU' || this.estadoSeguimiento === 'Revisión Verificada' || this.estadoSeguimiento === 'Revisión Verificada con Observaciones') {
      this.txtObservaciones = 'Observaciones Jefe Dependencia'
      this.txtPlaceHolderObservaciones = '* Observaciones realizadas por parte del Jefe de Dependencia para el componente cualitativo.'
    } else if (this.estadoSeguimiento === 'Con observaciones' || this.estadoSeguimiento === 'En revisión OAPC' || this.estadoSeguimiento === 'Reporte Avalado') {
      this.txtObservaciones = 'Observaciones Oficina Asesora de Planeación y Control'
      this.txtPlaceHolderObservaciones = '* Observaciones realizadas desde la OAPC a la unidad para el componente cualitativo.'
    }
  }

  backClicked() {
    this.router.navigate([
      'gestion-seguimiento/' +
      this.planId +
      '/' +
      this.codigoTrimestre,
    ]);
  }

  onSeeDocumentos() {
    if (this.abrirDocs) {
      const dialogRef = this.dialog.open(EvidenciasDialogComponent, {
        width: '80%',
        height: '55%',
        data: [
          this.documentos,
          this.readonlyFormulario,
          this.readonlyObservacion,
          this.unidad,
        ],
      });

      dialogRef.afterClosed().subscribe((documentos) => {
        if (
          documentos != undefined &&
          JSON.stringify(this.documentos) != JSON.stringify(documentos)
        ) {
          let documentoPorSubir = {
            documento: null,
            evidencia: documentos,
            unidad:
              this.rol != 'PLANEACION',
            _id: this.seguimiento.id,
          };

          Swal.fire({
            title: 'Guardando cambios',
            timerProgressBar: true,
            showConfirmButton: false,
            allowOutsideClick: false,
            willOpen: () => {
              Swal.showLoading();
            },
          });
          this.request
            .put(
              environment.SEGUIMIENTO_MID,
              `detalles/documento`,
              documentoPorSubir,
              this.planId + `/` + this.indexActividad + `/` + this.trimestreId
            )
            .subscribe(
              (data: any) => {
                if (data) {
                  this.documentos = data.Data.seguimiento;
                  this.seguimiento.evidencia = this.documentos;
                  this.estadoActividad = data.Data.estadoActividad.nombre;
                  this.verificarFormulario();
                  Swal.fire({
                    title: 'Documento(s) actualizado(s)',
                    text: `Revise el campo de soportes para visualizar o eliminar`,
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 2000,
                  });
                }
              },
              (error) => {
                Swal.fire({
                  title: 'Error en la operación',
                  text: `No se pudo aplicar los cambios`,
                  icon: 'warning',
                  showConfirmButton: false,
                  timer: 2500,
                });
              }
            );
        }
      });
    }
  }

  onChangeV(value: any) {
    console.log(value);
  }

  async onChangeDocumento(event: any) {
    if (event != undefined) {
      let aux = event.target.files[0];
      if (!this.FORMATOS.includes(aux.type)) {
        Swal.fire({
          title: 'Archivo no válido',
          text: `No se admite el tipo de archivo que seleccionó`,
          icon: 'error',
          showConfirmButton: false,
          timer: 2500,
        });
      } else {
        const found = this.documentos.find(
          (element) => element.nombre == aux.name && element.Activo
        );
        if (found == undefined) {
          Swal.fire({
            title: 'Guardando documento',
            timerProgressBar: true,
            showConfirmButton: false,
            allowOutsideClick: false,
            willOpen: () => {
              Swal.showLoading();
            },
          });

          let documento = [
            {
              IdTipoDocumento: 60,
              nombre: aux.name,
              metadatos: {
                dato_a: 'Soporte planeacion',
              },
              descripcion:
                'Documento de soporte para seguimiento de plan de acción',
              file: await this.gestorMethods.fileToBase64(aux),
              Activo: true,
            },
          ];

          let documentoPorSubir = {
            documento: documento,
            evidencia: this.documentos,
            unidad:
              this.rol != 'PLANEACION',
            _id: this.seguimiento.id,
          };

          this.request
            .put(
              environment.SEGUIMIENTO_MID,
              `detalles/documento`,
              documentoPorSubir,
              this.planId + `/` + this.indexActividad + `/` + this.trimestreId
            )
            .subscribe(
              (data: any) => {
                if (data) {
                  this.estadoActividad = data.Data.estadoActividad.nombre;
                  this.documentos = data.Data.seguimiento;
                  this.seguimiento.evidencia = this.documentos;
                  this.verificarFormulario();

                  Swal.fire({
                    title: 'Documento Cargado',
                    text: `Revise el campo de soportes para visualizar o eliminar`,
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 2000,
                  });
                }
              },
              (error) => {
                this.documentos.pop();
                Swal.fire({
                  title: 'Error en la operación',
                  text: `No se pudo subir el documento2`,
                  icon: 'warning',
                  showConfirmButton: false,
                  timer: 2500,
                });
              }
            );
        } else {
          Swal.fire({
            title: 'Error en la operación',
            text: `Ya existe un documento con el mismo nombre`,
            icon: 'warning',
            showConfirmButton: false,
            timer: 2000,
          });
        }
      }
    } else {
      Swal.fire({
        title: 'Error en la operación',
        text: `No se pudo subir el documento1`,
        icon: 'warning',
        showConfirmButton: false,
        timer: 2500,
      });
    }
  }

  setCodigoNotificacion() {
    if (this.estadoSeguimiento == 'Habilitado') {
      this.codigoNotificacion = "SH"; // NOTIFICACION(SH)
    } else if (this.estadoSeguimiento == 'Revisión Verificada con Observaciones') {
      this.codigoNotificacion = "SRVCO"; // NOTIFICACION(SRVCO)
    } else if (this.estadoSeguimiento == "Con observaciones") {
      this.codigoNotificacion = "SCO"; // NOTIFICACION(SCO)
    }
  }

  enviarNotificacion() {
    if (this.codigoNotificacion != "") {
      let datos = {
        codigo: this.codigoNotificacion,
        nombre_unidad: this.unidad,
        nombre_plan: this.plan,
        nombre_vigencia: this.vigencia.Nombre,
        trimestre: this.codigoTrimestre
      }
      this.codigoNotificacion = "";
      this.notificacionesService.enviarNotificacion(datos);
    }
  }

  async loadData() {
    Swal.fire({
      title: 'Cargando información',
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      willOpen: () => {
        Swal.showLoading();
      },
    })
    await this.request.get(environment.SEGUIMIENTO_MID, `seguimiento/` + this.planId + `/` + this.indexActividad + `/` + this.trimestreId).subscribe(async (data: any) => {
      if (data.Data != '') {
        this.seguimiento = data.Data;
        this.unidad = this.seguimiento.informacion.unidad;
        this.plan = this.seguimiento.informacion.nombre;
        this.id_actividad = this.seguimiento.id_actividad;
        this.documentos = JSON.parse(JSON.stringify(data.Data.evidencia));
        this.datosIndicadores = data.Data.cuantitativo.indicadores;
        this.datosResultados = JSON.parse(JSON.stringify(data.Data.cuantitativo.resultados));

        this.numeradorOriginal = [];
        this.denominadorOriginal = [];
        let resultados = JSON.parse(JSON.stringify(data.Data.cuantitativo.indicadores));
        resultados.forEach((indicador: any) => {
          this.numeradorOriginal.push(indicador.reporteNumerador ? indicador.reporteNumerador : 0);
          this.denominadorOriginal.push(indicador.reporteDenominador ? indicador.reporteDenominador : 0);
        });

        this.datosCualitativo = data.Data.cualitativo;

        this.estadoActividad = this.seguimiento.estado.nombre;
        this.estadoSeguimiento = this.seguimiento.estadoSeguimiento;
        this.verificarFormulario();
        this.enviarNotificacion();

        if (this.estadoActividad != "Sin reporte") {
          if (this.rol == "JEFE_DEPENDENCIA" || this.rol == "ASISTENTE_DEPENDENCIA") {
            if (this.datosCualitativo.observaciones_dependencia == "" || this.datosCualitativo.observaciones_dependencia == undefined || this.datosCualitativo.observaciones_dependencia == "Sin observación") {
              this.datosCualitativo.observaciones_dependencia = ""
            } else {
              this.mostrarObservaciones = true;
            }
          } else if (this.rol == "PLANEACION" || this.rol == "ASISTENTE_PLANEACION") {
            if (this.datosCualitativo.observaciones_planeacion == "" || this.datosCualitativo.observaciones_planeacion == undefined || this.datosCualitativo.observaciones_planeacion == "Sin observación") {
              this.datosCualitativo.observaciones_planeacion = ""
            } else {
              this.mostrarObservaciones = true;
            }
          }
        }

        this.trimestreAbr = data.Data.informacion.trimestre;
        if (data.Data.informacion.trimestre != "T1") {
          this.calcular = true;

          if (this.datosResultados.data[0].indicador != 0) {
            this.calcular = false;
          }
        }

        for (let index = 0; index < this.datosIndicadores.length; index++) {
          const indicador = this.datosIndicadores[index];
          if (this.estadoActividad != "Sin reporte") {
            if ((indicador.observaciones_planeacion == "" || indicador.observaciones_planeacion == undefined) && (this.rol != "JEFE_DEPENDENCIA" && this.rol != "ASISTENTE_DEPENDENCIA")) {
              this.datosIndicadores[index].observaciones_planeacion = "";
            }
          }
        }

        if (this.documentos == null) {
          this.documentos = [];
        }

        for (let index = 0; index < this.documentos.length; index++) {
          const documento = this.documentos[index];
          if (this.estadoActividad != "Sin reporte") {
            if (documento.Observacion == "") {
              this.documentos[index].Observacion = "";
            } else {
              this.mostrarObservaciones = true;
            }
          }
        }

        Swal.close();
      }
    }, (error) => {
      console.error(error)
      Swal.close();
      Swal.fire({
        title: 'Error en la operación',
        text: `No se encontraron datos registrados`,
        icon: 'warning',
        showConfirmButton: false,
        timer: 2500
      })
    })
  }

  guardarCualitativo() {
    var mensaje = `¿Desea guardar la información del componente cualitativo?`;
    if (this.rol === 'PLANEACION' || this.rol === 'ASISTENTE_PLANEACION') {
      mensaje = `¿Desea avalar la actividad?`;
      if (this.verificarObservaciones()) {
        mensaje = `¿Desea guardar las observaciones del componente cualitativo?`;
      }
    }

    Swal.fire({
      title: 'Guardar seguimiento',
      text: mensaje,
      icon: 'warning',
      confirmButtonText: `Sí`,
      cancelButtonText: `No`,
      showCancelButton: true,
      allowOutsideClick: false,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          let cualitativoBody = {
            _id: this.seguimiento.id,
            informacion: this.seguimiento.informacion,
            evidencias: this.seguimiento.evidencia,
            cualitativo: this.seguimiento.cualitativo,
            cuantitativo: this.seguimiento.cuantitativo,
            dependencia: this.rol == 'JEFE_DEPENDENCIA',
          };
          this.request
            .put(
              environment.SEGUIMIENTO_MID, `detalles/cualitativo`, cualitativoBody,
              this.planId + `/` + this.indexActividad + `/` + this.trimestreId
            )
            .subscribe(
              (data: any) => {
                if (data) {
                  this.setCodigoNotificacion();
                  Swal.fire({
                    title: 'Información de seguimiento actualizada',
                    text: 'El seguimiento del componente cualitativo se ha guardado satisfactoriamente',
                    icon: 'success',
                  }).then((res) => {
                    this.loadData();
                  });
                }
              },
              (error) => {
                Swal.fire({
                  title: 'Error en la operación',
                  text: `No fue posible guardar el seguimiento`,
                  icon: 'error',
                  showConfirmButton: false,
                  timer: 2500,
                });
              }
            );
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Generación de seguimiento cancelado',
            icon: 'error',
            showConfirmButton: false,
            timer: 2500,
          });
        }
      },
      (error) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500,
        });
      }
    );
  }

  guardarCuantitativo() {
    var mensaje = `¿Desea guardar la información del componente cuantitativo?`;
    if (this.rol === 'PLANEACION' || this.rol === 'ASISTENTE_PLANEACION') {
      mensaje = `¿Desea avalar la actividad?`;
      if (this.verificarObservaciones()) {
        mensaje = `¿Desea guardar las observaciones del componente cuantitativo?`;
      }
    }

    Swal.fire({
      title: 'Guardar seguimiento',
      text: mensaje,
      icon: 'warning',
      confirmButtonText: `Sí`,
      cancelButtonText: `No`,
      showCancelButton: true,
      allowOutsideClick: false,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          this.request
            .put(
              environment.SEGUIMIENTO_MID,
              `detalles/cuantitativo`,
              {
                _id: this.seguimiento.id,
                informacion: this.seguimiento.informacion,
                evidencias: this.seguimiento.evidencia,
                cualitativo: this.seguimiento.cualitativo,
                cuantitativo: this.seguimiento.cuantitativo,
                dependencia: this.rol == 'JEFE_DEPENDENCIA',
              },
              this.planId + `/` + this.indexActividad + `/` + this.trimestreId
            )
            .subscribe(
              (data: any) => {
                if (data) {
                  this.setCodigoNotificacion();
                  Swal.fire({
                    title: 'Información de seguimiento actualizada',
                    text: 'El seguimiento del componente cuantitativo se ha guardado satisfactoriamente',
                    icon: 'success',
                  }).then((res) => {
                    this.loadData();
                  });
                }
              },
              (error) => {
                Swal.fire({
                  title: 'Error en la operación',
                  text: `No fue posible guardar el seguimiento`,
                  icon: 'error',
                  showConfirmButton: false,
                  timer: 2500,
                });
              }
            );
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Generación de seguimiento cancelado',
            icon: 'error',
            showConfirmButton: false,
            timer: 2500,
          });
        }
      },
      (error) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500,
        });
      }
    );
  }

  guardarSeguimiento() {
    Swal.fire({
      title: 'Guardar seguimiento',
      text: `¿Desea guardar todos los componentes del seguimiento?`,
      icon: 'warning',
      confirmButtonText: `Sí`,
      cancelButtonText: `No`,
      showCancelButton: true,
      allowOutsideClick: false,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          this.request
            .put(
              environment.SEGUIMIENTO_MID,
              `seguimiento`,
              this.seguimiento,
              this.planId + `/` + this.indexActividad + `/` + this.trimestreId
            )
            .subscribe(
              (data: any) => {
                if (data) {
                  this.setCodigoNotificacion();
                  Swal.fire({
                    title: 'Información de seguimiento actualizada',
                    text: 'El seguimiento se ha guardado satisfactoriamente',
                    icon: 'success',
                  }).then((res) => {
                    this.loadData();
                  });
                }
              },
              (error) => {
                Swal.fire({
                  title: 'Error en la operación',
                  text: `No fue posible guardar el seguimiento`,
                  icon: 'error',
                  showConfirmButton: false,
                  timer: 2500,
                });
              }
            );
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Generación de seguimiento cancelado',
            icon: 'error',
            showConfirmButton: false,
            timer: 2500,
          });
        }
      },
      (error) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500,
        });
      }
    );
  }

  generarReporte() {
    Swal.fire({
      title: 'Generar Reporte',
      text: `Esta a punto de generar el reporte para la revisión del seguimiento.`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      showCancelButton: true,
      allowOutsideClick: false,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          let mod = {
            SeguimientoId: this.seguimiento._id,
          };

          this.request
            .put(
              environment.SEGUIMIENTO_MID,
              `reportes/actividad`,
              mod,
              this.indexActividad
            )
            .subscribe((data: any) => {
              if (data) {
                if (data.Success) {
                  this.setCodigoNotificacion();
                  Swal.fire({
                    title: 'Seguimiento Generado',
                    icon: 'success',
                  }).then((result) => {
                    if (result.value) {
                      this.loadData();
                    }
                  });
                } else {
                  Swal.fire({
                    title: 'No es posible generar el reporte',
                    icon: 'error',
                    showConfirmButton: false,
                    text: data.Data.motivo,
                    timer: 4000,
                  });
                }
              }
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Generación de reporte cancelada',
            icon: 'error',
            showConfirmButton: false,
            timer: 2500,
          });
        }
      },
      (error) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500,
        });
      }
    );
  }

  aprobarReporte() {
    Swal.fire({
      title: 'Aprobar Reporte',
      text: `Esta a punto de aprobar este reporte de seguimiento`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      showCancelButton: true,
      allowOutsideClick: false,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          const auxEstado = this.estados.find(
            (element) => element.nombre === 'Aprobado para evaluación'
          );
          let mod = {
            estado_seguimiento_id: auxEstado._id,
          };
          this.seguimiento.estado_plan_id = auxEstado._id;
          this.request
            .put(
              environment.PLANES_CRUD,
              `seguimiento`,
              mod,
              this.seguimiento._id
            )
            .subscribe((data: any) => {
              if (data) {
                Swal.fire({
                  title: 'Reporte Aprobado',
                  icon: 'success',
                }).then((result) => {
                  if (result.value) {
                    this.verificarFormulario();
                  }
                });
              }
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Aprobación cancelada',
            icon: 'error',
            showConfirmButton: false,
            timer: 2500,
          });
        }
      },
      (error) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500,
        });
      }
    );
  }

  ajustarReporte() {
    Swal.fire({
      title: 'Reenviar Reporte',
      text: `Desea enviar este reporte con los ajustes realizados`,
      icon: 'warning',
      confirmButtonText: `Sí`,
      cancelButtonText: `No`,
      showCancelButton: true,
      allowOutsideClick: false,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          const auxEstado = this.estados.find(
            (element) => element.nombre === 'Ajustado'
          );
          let mod = {
            estado_seguimiento_id: auxEstado._id,
          };
          this.seguimiento.estado_plan_id = auxEstado._id;
          this.request
            .put(
              environment.PLANES_CRUD,
              `seguimiento`,
              mod,
              this.seguimiento._id
            )
            .subscribe((data: any) => {
              if (data) {
                Swal.fire({
                  title: 'Reporte reenviado correctamente',
                  icon: 'success',
                }).then((result) => {
                  if (result.value) {
                    this.verificarFormulario();
                  }
                });
              }
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Ajustes de reporte cancelados',
            icon: 'error',
            showConfirmButton: false,
            timer: 2500,
          });
        }
      },
      (error) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500,
        });
      }
    );
  }

  calcularResultado() {
    for (let index = 0; index < this.datosIndicadores.length; index++) {
      const indicador = this.datosIndicadores[index];

      if (indicador.reporteDenominador != null && indicador.reporteNumerador != null) {
        let denominador = parseFloat(indicador.reporteDenominador);
        let numerador = parseFloat(indicador.reporteNumerador);
        const meta = parseFloat(this.datosIndicadores[index].meta);
        this.calcular = false;

        if (denominador == 0.0) {
          if (numerador == 0.0) {
            if (indicador.denominador === "Denominador variable") {
              denominador = 100;
              numerador = 100;
              this.datosResultados.data[index].indicadorAcumulado = 1 * 0.25;
              this.datosResultados.data[index].acumuladoNumerador = this.datosResultados.data[index].acumuladoNumerador;
              this.datosResultados.data[index].acumuladoDenominador = this.datosResultados.data[index].acumuladoDenominador;
              this.datosResultados.data[index].indicador = numerador / denominador;
              var metaEvaluada = meta / 100;
              this.datosResultados.data[index].avanceAcumulado = (this.datosResultados.data[index].indicadorAcumulado / metaEvaluada);

              if (indicador.tendencia == "Creciente") {
                if (this.datosResultados.data[index].indicadorAcumulado > metaEvaluada) {
                  this.datosResultados.data[index].brechaExistente = 0;
                } else {
                  this.datosResultados.data[index].brechaExistente = metaEvaluada - this.datosResultados.data[index].avanceAcumulado;
                }
              } else {
                if (this.datosResultados.data[index].indicadorAcumulado < metaEvaluada) {
                  this.datosResultados.data[index].brechaExistente = 0;
                } else {
                  this.datosResultados.data[index].brechaExistente = this.datosResultados.data[index].avanceAcumulado - metaEvaluada;
                }
              }

              this.seguimiento.cuantitativo.resultados[index] = this.datosResultados.data[index];
            } else {
              Swal.fire({
                title: 'Error en la operación',
                text: `No es posible la división entre cero para denominador fijo`,
                icon: 'warning',
                showConfirmButton: false,
                timer: 3500
              });
              indicador.reporteDenominador = null;
              indicador.reporteNumerador = null;
            }
          } else {
            Swal.fire({
              title: 'Error en la operación',
              text: `No es posible la división entre cero`,
              icon: 'warning',
              showConfirmButton: false,
              timer: 3500
            });
          }
        } else {
          if (this.trimestreAbr == "T1") {
            this.datosResultados.data[index].indicadorAcumulado = 0;
            this.datosResultados.data[index].acumuladoNumerador = 0;
            this.datosResultados.data[index].acumuladoDenominador = 0;
            this.datosResultados.data[index].indicador = 0;
            this.datosResultados.data[index].avanceAcumulado = 0;
            this.datosResultados.data[index].brechaExistente = 0;
            this.numeradorOriginal = [];
            this.denominadorOriginal = [];
            this.calcular = true;
          }
          this.calcularBase(indicador, denominador, numerador, meta, index, false);
        }
      } else {
        Swal.fire({
          title: 'Error en la operación',
          text: `Los datos de numerador y denominador no pueden estar vacíos`,
          icon: 'warning',
          showConfirmButton: false,
          timer: 2500
        });
      }
    }
  }

  calcularBase(indicador: any, denominador: number, numerador: number, meta: number, index: number, ceros: boolean) {
    this.datosResultados.data[index].divisionCero = false;
    let esDenominadorFijo = indicador.denominador !== "Denominador variable"
    if (!Number.isNaN(denominador) && !Number.isNaN(numerador)) {
      this.datosIndicadores[index].reporteDenominador = denominador;
      this.datosIndicadores[index].reporteNumerador = numerador;

      if (!this.calcular) {
        this.datosResultados.data[index].acumuladoNumerador -= this.numeradorOriginal[index];
        if (!esDenominadorFijo) {
          this.datosResultados.data[index].acumuladoDenominador -= this.denominadorOriginal[index];
        }
        this.datosResultados.data[index].indicadorAcumulado -= this.datosResultados.data[index].indicador;
        this.datosResultados.data[index].indicador = 0;
      }

      this.datosResultados.data[index].acumuladoNumerador += numerador;
      if (esDenominadorFijo) {
        this.datosResultados.data[index].acumuladoDenominador = denominador;
      } else {
        this.datosResultados.data[index].acumuladoDenominador += denominador;
      }

      if (this.datosResultados.data[index].divisionCero && ceros) {
        this.datosResultados.data[index].indicador = 0;
      } else if (denominador != 0) {
        let auxiliarDenominador = numerador / denominador;
        if (this.datosIndicadores[index].unidad == "Unidad") {
          this.datosResultados.data[index].indicador = Math.round(auxiliarDenominador);
        } else {
          this.datosResultados.data[index].indicador = Math.round(auxiliarDenominador * 10_000) / 10_000;
        }
      } else {
        this.datosResultados.data[index].indicador = this.datosIndicadores[index].unidad == "Unidad" ? meta : meta / 100;
      }

      if (this.datosResultados.data[index].acumuladoDenominador != 0) {
        let auxiliarIndicadorAcumulado = this.datosResultados.data[index].acumuladoNumerador / this.datosResultados.data[index].acumuladoDenominador
        if (this.datosIndicadores[index].unidad == 'Unidad') {
          this.datosResultados.data[index].indicadorAcumulado = Math.round(auxiliarIndicadorAcumulado * 100) / 100;
        } else {
          this.datosResultados.data[index].indicadorAcumulado = Math.round(auxiliarIndicadorAcumulado * 10_000) / 10_000;
        }
      } else {
        this.datosResultados.data[index].indicadorAcumulado = this.datosIndicadores[index].unidad == 'Unidad' ? meta : meta / 100;
      }
      if (!esDenominadorFijo) {
        this.datosResultados.data[index].indicadorAcumulado = this.datosResultados.data[index].indicadorAcumulado * 0.25;
      }
      let indicadorAcumulado = this.datosResultados.data[index].indicadorAcumulado;
      let auxiliarMeta = this.datosIndicadores[index].unidad == "Unidad" || this.datosIndicadores[index].unidad == "Tasa" ? meta : meta / 100;
      // Las multiplicaciones y divisiones por mil o 10 mil son para formatear los datos a una cantidad de decimales fijos
      if (indicador.tendencia == "Creciente") {
        this.datosResultados.data[index].avanceAcumulado =
          this.datosIndicadores[index].unidad == 'Unidad' ||
            this.datosIndicadores[index].unidad == 'Tasa'
            ? Math.round((indicadorAcumulado / auxiliarMeta) * 1_000) / 1_000
            : Math.round((indicadorAcumulado / auxiliarMeta) * 10_000) / 10_000;
        this.datosResultados.data[index].brechaExistente =
          indicadorAcumulado > auxiliarMeta
            ? 0
            : Math.round((auxiliarMeta - this.datosResultados.data[index].avanceAcumulado) * 10_000) / 10_000;
      } else if (indicador.tendencia == "Decreciente") {
        let auxiliarAvance = (auxiliarMeta - indicadorAcumulado) / auxiliarMeta;
        this.datosResultados.data[index].avanceAcumulado =
          Math.round(
            (1 + (indicadorAcumulado < auxiliarMeta ? auxiliarAvance : -auxiliarAvance)) * 10_000
          ) / 10_000;
        this.datosResultados.data[index].brechaExistente =
          indicadorAcumulado < auxiliarMeta
            ? 0
            : Math.round((this.datosResultados.data[index].avanceAcumulado - auxiliarMeta) * 10_000) / 10_000;
      }
      this.seguimiento.cuantitativo.resultados[index] = this.datosResultados.data[index];
    }
    this.numeradorOriginal[index] = numerador;
    this.denominadorOriginal[index] = denominador;
    indicador.reporteDenominador = String(denominador);
    indicador.reporteNumerador = String(numerador);
  }

  onEnter() {
    this.abrirDocs = false;
  }

  offEnter() {
    this.abrirDocs = true;
  }

  guardarRevisionJefeDependencia() {
    var mensaje = `¿Desea verificar la actividad?`
    if (this.verificarObservaciones()) {
      mensaje = `¿Desea enviar las observaciones realizadas para este reporte?`
    }

    Swal.fire({
      title: 'Guardar seguimiento',
      text: mensaje,
      icon: 'warning',
      confirmButtonText: `Sí`,
      cancelButtonText: `No`,
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.request.put(environment.SEGUIMIENTO_MID, `actividades/revision_jefe_dependencia`, this.seguimiento, this.planId + `/` + this.indexActividad + `/` + this.trimestreId).subscribe((data: any) => {
          if (data) {
            this.setCodigoNotificacion();
            if (data.Data.Observación) {
              Swal.fire({
                title: 'Información de seguimiento actualizada',
                text: 'Las observaciones hechas al seguimiento se ha guardado satisfactoriamente',
                icon: 'success'
              }).then(res => {
                this.loadData();
              });
            } else {
              Swal.fire({
                title: 'Información de seguimiento actualizada',
                text: 'La actividad ha sido verificada satisfactoriamente',
                icon: 'success'
              }).then(res => {
                this.loadData();
              });
            }
          }
        }, (error) => {
          Swal.fire({
            title: 'Error en la operación',
            text: `No fue posible guardar el seguimiento`,
            icon: 'error',
            showConfirmButton: false,
            timer: 2500
          });
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Generación de seguimiento cancelado',
          icon: 'error',
          showConfirmButton: false,
          timer: 2500
        })
      }
    }),
      (error: any) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500
        })
      }
  }

  guardarRevision() {
    var mensaje = `¿Desea avalar la actividad?`;
    if (this.verificarObservaciones()) {
      mensaje = `¿Desea enviar las observaciones realizadas para este reporte?`;
    }

    Swal.fire({
      title: 'Guardar seguimiento',
      text: mensaje,
      icon: 'warning',
      confirmButtonText: `Sí`,
      cancelButtonText: `No`,
      showCancelButton: true,
      allowOutsideClick: false,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          this.request
            .put(
              environment.SEGUIMIENTO_MID,
              `actividades/revision`,
              this.seguimiento,
              this.planId + `/` + this.indexActividad + `/` + this.trimestreId
            )
            .subscribe({
              next: (data: any) => {
                if (data) {
                  this.setCodigoNotificacion();
                  if (data.Data.Observación) {
                    Swal.fire({
                      title: 'Información de seguimiento actualizada',
                      text: 'Las observaciones hechas al seguimiento se ha guardado satisfactoriamente',
                      icon: 'success',
                    }).then((res) => {
                      this.loadData();
                    });
                  } else {
                    Swal.fire({
                      title: 'Información de seguimiento actualizada',
                      text: 'La actividad ha sido avalada satisfactoriamente',
                      icon: 'success',
                    }).then((res) => {
                      this.loadData();
                    });
                  }
                }
              },
              error: (error) => {
                Swal.fire({
                  title: 'Error en la operación',
                  text: `No fue posible guardar el seguimiento`,
                  icon: 'error',
                  showConfirmButton: false,
                  timer: 2500,
                });
              },
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Generación de seguimiento cancelado',
            icon: 'error',
            showConfirmButton: false,
            timer: 2500,
          });
        }
      },
      (error) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500,
        });
      }
    );
  }

  verificarObservaciones() {
    if (this.rol === 'PLANEACION' || this.rol === 'ASISTENTE_PLANEACION') {
      if (
        this.seguimiento.cualitativo.observaciones_planeacion != "" &&
        this.seguimiento.cualitativo.observaciones_planeacion != "Sin observación" &&
        this.seguimiento.cualitativo.observaciones_planeacion != undefined
      ) {
        return true;
      }

      for (let index = 0; index < this.seguimiento.cuantitativo.indicadores.length; index++) {
        const indicador = this.seguimiento.cuantitativo.indicadores[index];
        if (
          indicador.observaciones_planeacion != "" &&
          indicador.observaciones_planeacion != "Sin observación" &&
          indicador.observaciones_planeacion != undefined
        ) {
          return true;
        }
      }

      for (let index = 0; index < this.seguimiento.evidencia.length; index++) {
        const evidencia = this.seguimiento.evidencia[index];
        if (
          evidencia.Observacion != "" &&
          evidencia.Observacion != "Sin observación" &&
          evidencia.Observacion != undefined
        ) {
          return true;
        }
      }

      return false;
    } else if (this.rol === 'JEFE_DEPENDENCIA' || this.rol === 'ASISTENTE_DEPENDENCIA') {
      if (
        this.seguimiento.cualitativo.observaciones_dependencia != "" &&
        this.seguimiento.cualitativo.observaciones_dependencia != "Sin observación" &&
        this.seguimiento.cualitativo.observaciones_dependencia != undefined
      ) {
        return true;
      }

      for (let index = 0; index < this.seguimiento.cuantitativo.indicadores.length; index++) {
        const indicador = this.seguimiento.cuantitativo.indicadores[index];
        if (
          indicador.observaciones_dependencia != "" &&
          indicador.observaciones_dependencia != "Sin observación" &&
          indicador.observaciones_dependencia != undefined
        ) {
          return true;
        }
      }

      for (let index = 0; index < this.seguimiento.evidencia.length; index++) {
        const evidencia = this.seguimiento.evidencia[index];
        if (
          evidencia.Observacion != "" &&
          evidencia.Observacion != "Sin observación" &&
          evidencia.Observacion != undefined
        ) {
          return true;
        }
      }

      return false
    }
    return false
  }

  retornarRevisionJefeDependencia() {
    Swal.fire({
      title: 'Retornar estado',
      text: `¿Desea retornar la actividad al estado Actividad reportada?`,
      icon: 'warning',
      confirmButtonText: `Sí`,
      cancelButtonText: `No`,
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.request.put(environment.SEGUIMIENTO_MID, `actividades/retornar_jefe_dependencia`, this.seguimiento, this.planId + `/` + this.indexActividad + `/` + this.trimestreId).subscribe((data: any) => {
          if (data) {
            this.setCodigoNotificacion();
            Swal.fire({
              title: 'Información de seguimiento actualizada',
              text: 'Se ha actualizado el estado de la actividad satisfactoriamente',
              icon: 'success'
            }).then(res => {
              this.loadData();
            });
          }
        }, (error) => {
          Swal.fire({
            title: 'Error en la operación',
            text: `No fue posible retornar el estado`,
            icon: 'error',
            showConfirmButton: false,
            timer: 2500
          });
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Cambio de estado cancelado',
          icon: 'error',
          showConfirmButton: false,
          timer: 2500
        })
      }
    }),
      (error: any) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500
        })
      }
  }

  retornarRevision() {
    Swal.fire({
      title: 'Retornar estado',
      text: `¿Desea retornar la actividad al estado Actividad reportada?`,
      icon: 'warning',
      confirmButtonText: `Sí`,
      cancelButtonText: `No`,
      showCancelButton: true,
      allowOutsideClick: false,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          this.request
            .put(
              environment.SEGUIMIENTO_MID,
              `actividades/retornar`,
              this.seguimiento,
              this.planId + `/` + this.indexActividad + `/` + this.trimestreId
            )
            .subscribe(
              (data: any) => {
                if (data) {
                  this.setCodigoNotificacion();
                  Swal.fire({
                    title: 'Información de seguimiento actualizada',
                    text: 'Se ha actualizado el estado de la actividad satisfactoriamente',
                    icon: 'success',
                  }).then((res) => {
                    this.loadData();
                  });
                }
              },
              (error: any) => {
                Swal.fire({
                  title: 'Error en la operación',
                  text: `No fue posible retornar el estado`,
                  icon: 'error',
                  showConfirmButton: false,
                  timer: 2500,
                });
              }
            );
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Cambio de estado cancelado',
            icon: 'error',
            showConfirmButton: false,
            timer: 2500,
          });
        }
      },
      (error) => {
        Swal.fire({
          title: 'Error en la operación',
          icon: 'error',
          text: `${JSON.stringify(error)}`,
          showConfirmButton: false,
          timer: 2500,
        });
      }
    );
  }

  getShortenedPlanId(): string {
    return this.planId ? this.planId.substring(0, 6) : '';
  }
}
