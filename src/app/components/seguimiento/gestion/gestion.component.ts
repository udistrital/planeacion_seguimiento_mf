import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { navigateToUrl } from 'single-spa';
import Indicador from 'src/app/models/indicador';
import { ImplicitAutenticationService } from 'src/app/services/implicitAutentication.service';
import { RequestManager } from 'src/app/services/requestManager.service';
import { VerificarFormulario } from 'src/app/services/verificarFormulario.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion',
  templateUrl: './gestion.component.html',
  styleUrls: ['./gestion.component.scss'],
})
export class GestionComponent implements OnInit {
  displayedColumns: string[] = ['index', 'dato', 'activo', 'gestion'];
  dataSource: MatTableDataSource<any>;
  planId: string = '';
  trimestreId: string = '';
  unidad: any;
  seguimiento: any;
  formGestionSeguimiento: FormGroup;
  dataActividad: any;
  rol: string = '';
  indicadores: Indicador[] = [{ index: 1, dato: '', activo: false }];
  metas: Indicador[] = [{ index: 1, dato: '', activo: false }];
  indexActividad: string = '';
  fechaModificacion: string = '';
  trimestre: any;
  trimestres: any[] = [];
  allActividades: any[] = [];
  estado: string = '';
  estadoLista: boolean = false;

  constructor(
    activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private request: RequestManager,
    private autenticationService: ImplicitAutenticationService,
    private router: Router,
    private verificarFormulario: VerificarFormulario
  ) {
    activatedRoute.params.subscribe((prm) => {
      this.planId = prm['plan_id'];
      this.trimestreId = prm['trimestre'];
    });
    this.dataSource = new MatTableDataSource<any>();
    this.loadDataSeguimiento();
    this.formGestionSeguimiento = this.formBuilder.group({
      unidad: ['', Validators.required],
      estado: ['', Validators.required],
      plan: ['', Validators.required],
      actividad: ['', Validators.required],
      lineamiento: ['', Validators.required],
      meta_estrategica: ['', Validators.required],
      estrategia: ['', Validators.required],
      tarea: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.getRol();
    const listaCookie = this.verificarFormulario.getCookie("estadoLista");
    if (listaCookie != undefined) {
      this.estadoLista = true;
    }
  }

  ngAfterViewInit() {
    Swal.fire({
      title: 'Cargando información',
      timerProgressBar: true,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });
  }

  ngOnDestroy() {
    const listaCookie = this.verificarFormulario.getCookie("estadoLista");
    this.estadoLista = false;
    if (listaCookie != undefined) {
      this.verificarFormulario.deleteCookie("estadoLista");
    }
  }

  getRol() {
    let roles: any = this.autenticationService.getRole();
    if (
      roles.__zone_symbol__value.find(
        (x: string) => x == 'JEFE_DEPENDENCIA' || x == 'ASISTENTE_DEPENDENCIA'
      )
    ) {
      this.rol = 'JEFE_DEPENDENCIA';
    } else if (
      roles.__zone_symbol__value.find((x: string) => x == 'PLANEACION')
    ) {
      this.rol = 'PLANEACION';
    } else if (
      roles.__zone_symbol__value.find(
        (x: string) => x == 'JEFE_UNIDAD_PLANEACION'
      )
    ) {
      this.rol = 'JEFE_UNIDAD_PLANEACION';
    }
  }

  backClicked() {
    if (this.estadoLista == true) {
      navigateToUrl('/pendientes/seguimiento');
    } else {
      this.router.navigate(['listar-plan-accion-anual/']);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadDataSeguimiento() {
    Swal.fire({
      title: 'Cargando información',
      timerProgressBar: true,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });
    this.request
      .get(
        environment.SEGUIMIENTO_MID,
        `seguimiento/${this.planId}/${this.trimestreId}/estado`
      )
      .subscribe({
        next: async (data: any) => {
          if (data) {
            this.seguimiento = data.Data;
            this.estado = this.seguimiento.estado_seguimiento_id.nombre;
            await this.loadUnidad(this.seguimiento.plan_id.dependencia_id);
          }
        },
        error: (error) => {
          Swal.fire({
            title: 'Error en la operación',
            text: `No se encontraron datos registrados ${JSON.stringify(
              error
            )}`,
            icon: 'warning',
            showConfirmButton: false,
            timer: 2500,
          });
        },
      });
  }

  loadUnidad(dependencia_id: string) {
    this.request
      .get(environment.OIKOS_SERVICE, `dependencia?query=Id:${dependencia_id}`)
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.unidad = data[0];
            this.formGestionSeguimiento
              .get('plan')!
              .setValue(this.seguimiento.plan_id.nombre);
            this.formGestionSeguimiento
              .get('unidad')!
              .setValue(this.unidad.Nombre);
            this.formGestionSeguimiento
              .get('estado')!
              .setValue(this.seguimiento.estado_seguimiento_id.nombre);
            this.loadActividades();
          }
        },
        error: (error) => {
          Swal.fire({
            title: 'Error en la operación',
            text: `No se encontraron datos registrados ${JSON.stringify(
              error
            )}`,
            icon: 'warning',
            showConfirmButton: false,
            timer: 2500,
          });
        },
      });
  }

  loadActividades() {
    this.request
      .get(
        environment.SEGUIMIENTO_MID,
        `actividades/` + this.seguimiento._id
      )
      .subscribe({
        next: (data: any) => {
          if (data) {
            for (let index = 0; index < data.Data.length; index++) {
              const actividad = data.Data[index];
              if (actividad.estado.nombre == 'Con observaciones') {
                data.Data[index].estado.color = 'conObservacion';
              }
              if (actividad.estado.nombre == 'Actividad avalada') {
                data.Data[index].estado.color = 'avalada';
              }
            }
            this.dataSource.data = data.Data;
            this.allActividades = this.dataSource.data;
            Swal.close();
          }
        },
        error: (error) => {
          Swal.fire({
            title: 'Error en la operación',
            text: `No se encontraron datos registrados ${JSON.stringify(
              error
            )}`,
            icon: 'warning',
            showConfirmButton: false,
            timer: 2500,
          });
        },
      });
  }

  reportar() {
    Swal.fire({
      title: 'Enviar Reporte',
      text: `¿Confirma que desea enviar el reporte de seguimiento al Plan de Acción para su etapa de revisión por parte de la Oficina Asesora de Planeación y Control?`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      showCancelButton: true,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          this.request
            .put(
              environment.SEGUIMIENTO_MID,
              `reportes/seguimiento`,
              '{}',
              this.seguimiento._id
            )
            .subscribe((data: any) => {
              if (data) {
                if (data.Success) {
                  Swal.fire({
                    title: 'El reporte se ha enviado satisfactoriamente',
                    icon: 'success',
                  }).then((result) => {
                    if (result.value) {
                      this.loadDataSeguimiento();
                    }
                  });
                } else {
                  let message: string = '<b>ID - Actividad</b><br/>';
                  let actividades: any = data.Data.actividades;
                  let llaves: string[] = Object.keys(actividades);
                  for (let llave of llaves) {
                    message += llave + ' - ' + actividades[llave] + '<br/>';
                  }

                  if (this.estado != 'Con observaciones') {
                    Swal.fire({
                      title: 'Debe reportar las siguientes actividades:',
                      icon: 'error',
                      showConfirmButton: true,
                      html: message,
                    });
                  } else {
                    Swal.fire({
                      title:
                        'Debe revisar las observaciones de las siguientes actividades:',
                      icon: 'error',
                      showConfirmButton: true,
                      html: message,
                    });
                  }
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

  finalizarRevision() {
    Swal.fire({
      title: 'Finalizar revisión',
      text: `¿Confirma que desea finalizar la revisión del seguimiento al Plan de Acción?`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      showCancelButton: true,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          this.request
            .put(
              environment.SEGUIMIENTO_MID,
              `seguimiento`,
              '{}',
              this.seguimiento._id + '/revision'
            )
            .subscribe((data: any) => {
              if (data) {
                if (data.Success) {
                  Swal.fire({
                    title: 'El reporte se ha enviado satisfactoriamente',
                    icon: 'success',
                  }).then((result) => {
                    if (result.value) {
                      this.loadDataSeguimiento();
                    }
                  });
                } else {
                  let message: string = '<b>ID - Actividad</b><br/>';
                  let actividades: any = data.Data.actividades;
                  let llaves: string[] = Object.keys(actividades);
                  for (let llave of llaves) {
                    message += llave + ' - ' + actividades[llave] + '<br/>';
                  }

                  Swal.fire({
                    title: 'Actividades sin revisar',
                    icon: 'error',
                    showConfirmButton: true,
                    html:
                      'Debe avalar o realizar las observaciones a las siguientes actividades:<br/>' +
                      message,
                  });
                }
              }
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Finalizalización de revisión cancelada',
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

  revisar(row: any) {
    let auxFecha = new Date();
    let auxFechaCol = auxFecha.toLocaleString('en-US', {
      timeZone: 'America/Mexico_City',
    });
    let strFechaHoy = new Date(auxFechaCol).toISOString();
    let fechaHoy = new Date(strFechaHoy);
    let fechaInicio = new Date(
      this.seguimiento.periodo_seguimiento_id['fecha_inicio'].replace('Z', '')
    );
    let fechaFin = new Date(
      this.seguimiento.periodo_seguimiento_id['fecha_fin'].replace('Z', '')
    );

    if (
      (fechaHoy >= fechaInicio && fechaHoy <= fechaFin) ||
      row.estado.nombre == 'Actividad avalada' ||
      this.rol == 'PLANEACION'
    ) {
      this.router.navigate([
        `generar-trimestre/${this.planId}/${row.index}/${this.seguimiento.periodo_seguimiento_id['_id']}`,
      ]);
    } else {
      Swal.fire({
        title: 'Error en la operación',
        text: `Está intentando acceder al seguimiento por fuera de las fechas establecidas`,
        icon: 'warning',
        showConfirmButton: true,
        timer: 10000,
      });
    }
  }

  loadTrimestre(periodo_id: string, row: any) {
    this.request
      .get(
        environment.PARAMETROS_SERVICE,
        `parametro_periodo?query=Id:${periodo_id}`
      )
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.trimestre = data.Data[data.Data.length - 1];
            this.trimestres.push(this.trimestre.ParametroId);
            this.request
              .get(
                environment.PLANES_CRUD,
                `seguimiento?query=activo:true,plan_id:` +
                this.planId +
                `,periodo_seguimiento_id:` +
                this.trimestre.Id
              )
              .subscribe(
                (data: any) => {
                  if (data.Data.length != 0) {
                    let seguimiento = data.Data[0];
                    let auxFecha = new Date();
                    let auxFechaCol = auxFecha.toLocaleString('en-US', {
                      timeZone: 'America/Mexico_City',
                    });
                    let strFechaHoy = new Date(auxFechaCol).toISOString();
                    let fechaHoy = new Date(strFechaHoy);
                    let fechaInicio = new Date(
                      seguimiento['fecha_inicio'].replace('Z', '')
                    );
                    let fechaFin = new Date(
                      seguimiento['fecha_fin'].replace('Z', '')
                    );
                    if (fechaHoy >= fechaInicio && fechaHoy <= fechaFin) {
                      this.router.navigate([
                        'generar-trimestre/' +
                        this.planId +
                        '/' +
                        row.index +
                        '/' +
                        this.trimestre.Id,
                      ]);
                    } else {
                      Swal.fire({
                        title: 'Error en la operación',
                        text: `Está intentando acceder al seguimiento por fuera de las fechas establecidas`,
                        icon: 'warning',
                        showConfirmButton: true,
                        timer: 10000,
                      });
                    }
                  }
                },
                (error) => {
                  Swal.fire({
                    title: 'Error en la operación',
                    text: `No se encontraron datos registrados ${JSON.stringify(
                      error
                    )}`,
                    icon: 'warning',
                    showConfirmButton: false,
                    timer: 2500,
                  });
                }
              );
          }
        },
        error: (error) => {
          Swal.fire({
            title: 'Error en la operación',
            text: `No se encontraron datos registrados ${JSON.stringify(
              error
            )}`,
            icon: 'warning',
            showConfirmButton: false,
            timer: 2500,
          });
        },
      });
  }

  OnPageChange(event: PageEvent) {
    let startIndex = event.pageIndex * event.pageSize;
    let endIndex = startIndex + event.pageSize;
    if (endIndex > this.allActividades.length) {
      endIndex = this.allActividades.length;
    }
    this.dataSource.data = this.allActividades.slice(startIndex, endIndex);
    this.dataSource.data.length = this.allActividades.length;
  }

  iniciarRevision() {
    Swal.fire({
      title: 'Iniciar Revisión',
      text: `Esta a punto de iniciar la revisión para este Plan`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      showCancelButton: true,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          this.seguimiento.estado_seguimiento_id = '622ba46d16511e32535c326b';
          this.request
            .put(
              environment.PLANES_CRUD,
              `seguimiento`,
              this.seguimiento,
              this.seguimiento._id
            )
            .subscribe((data: any) => {
              if (data) {
                Swal.fire({
                  title: 'Seguimiento en revisión',
                  icon: 'success',
                }).then((result) => {
                  if (result.value) {
                    this.loadDataSeguimiento();
                  }
                });
              }
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Inicio de revisión cancelado',
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

  verificarRevision() {
    Swal.fire({
      title: 'Verificar revisión',
      text: `¿Confirma que desea verificar la revisión del seguimiento al Plan de Acción?`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      showCancelButton: true,
    }).then(
      (result) => {
        if (result.isConfirmed) {
          this.request
            .put(
              environment.SEGUIMIENTO_MID,
              `seguimiento/verificacion`,
              '{}',
              this.seguimiento._id
            )
            .subscribe((data: any) => {
              if (data) {
                if (data.Success) {
                  Swal.fire({
                    title: 'El reporte se ha enviado satisfactoriamente',
                    icon: 'success',
                  }).then((result) => {
                    if (result.value) {
                      this.loadDataSeguimiento();
                    }
                  });
                } else {
                  let message: string = '<b>ID - Actividad</b><br/>';
                  let actividades: any = data.Data.actividades;
                  let llaves: string[] = Object.keys(actividades);
                  for (let llave of llaves) {
                    message += llave + ' - ' + actividades[llave] + '<br/>';
                  }

                  if (this.estado != 'Con observaciones') {
                    Swal.fire({
                      title: 'Debe reportar las siguientes actividades:',
                      icon: 'error',
                      showConfirmButton: true,
                      html: message,
                    });
                  } else {
                    Swal.fire({
                      title:
                        'Debe revisar las observaciones de las siguientes actividades:',
                      icon: 'error',
                      showConfirmButton: true,
                      html: message,
                    });
                  }
                }
              }
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire({
            title: 'Verificación de revisión cancelada',
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
}
