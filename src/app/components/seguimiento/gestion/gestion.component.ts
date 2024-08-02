import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ImplicitAutenticationService, ServiceCookies } from '@udistrital/planeacion-utilidades-module';
import { navigateToUrl } from 'single-spa';
import Indicador from 'src/app/models/indicador';
import { Notificaciones } from 'src/app/services/notificaciones';
import { RequestManager } from 'src/app/services/requestManager.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion',
  templateUrl: './gestion.component.html',
  styleUrls: ['./gestion.component.scss'],
})
export class GestionComponent implements OnInit {
  displayedColumns: string[] = ['idactividad', 'index', 'dato', 'activo', 'gestion'];
  dataSource: MatTableDataSource<any>;
  planId: string = '';
  trimestreId: string = '';
  unidad: any;
  vigencia: any;
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
  codigoNotificacion: string = '';

  private autenticationService = new ImplicitAutenticationService();
  private serviceCookies = new ServiceCookies();

  constructor(
    activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private request: RequestManager,
    private notificacionesService: Notificaciones,
    private router: Router,
  ) {
    activatedRoute.params.subscribe((prm) => {
      this.planId = prm['plan_id'];
      this.trimestreId = prm['trimestre'];
      this.loadDataSeguimiento();
    });
    this.dataSource = new MatTableDataSource<any>();
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
    const listaCookie = this.serviceCookies.getCookie("estadoLista");
    if (listaCookie != undefined) {
      this.estadoLista = true;
    }
  }

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

  ngOnDestroy() {
    const listaCookie = this.serviceCookies.getCookie("estadoLista");
    this.estadoLista = false;
    if (listaCookie != undefined) {
      this.serviceCookies.deleteCookie("estadoLista");
    }
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

  enviarNotificacion() {
    if (this.codigoNotificacion != "") {
      // Bifurcación en estado En revisión JU
      if (this.codigoNotificacion === 'SERJU') {
        const estadoPlanMap: any = { 'Revisión Verificada con Observaciones': "SERJU1", 'Revisión Verificada': "SERJU2" };
        this.codigoNotificacion = estadoPlanMap[this.estado];
      }

      // Bifurcación en estado 'En revisión OAPC'
      if (this.codigoNotificacion === "SEROAPC") {
        const estadoPlanMap: any = { 'Con observaciones': "SEROAPC1", 'Reporte Avalado': "SEROAPC2" };
        this.codigoNotificacion = estadoPlanMap[this.estado];
      }

      let datos = {
        codigo: this.codigoNotificacion,
        id_unidad: this.unidad.Id,
        nombre_unidad: this.unidad.Nombre,
        nombre_plan: this.seguimiento.plan_id.nombre,
        nombre_vigencia: this.vigencia.Nombre,
        trimestre: this.trimestreId
      }
      this.codigoNotificacion = "";
      this.notificacionesService.enviarNotificacion(datos)
    }
  }

  loadDataSeguimiento() {
    Swal.fire({
      title: 'Cargando información',
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
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
            this.planId = this.planId;
            this.estado = this.seguimiento.estado_seguimiento_id.nombre;
            await this.loadUnidad(this.seguimiento.plan_id.dependencia_id);
            this.loadVigencia(this.seguimiento.plan_id.vigencia)
            this.enviarNotificacion();
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

  loadVigencia(vigencia_id: any) {
    this.request.get(environment.PARAMETROS_SERVICE, `periodo?query=CodigoAbreviacion:VG,Id:${vigencia_id},activo:true`)
      .subscribe(
        (data: any) => {
          if (data) {
            this.vigencia = data.Data[0];
          }
        }, (error) => { }
      )
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
    this.request.get(environment.SEGUIMIENTO_MID, `actividades/` + this.seguimiento._id).subscribe((data: any) => {
      if (data) {
        data.Data.forEach((actividad: any, index: number) => {
          if (actividad.estado.nombre === "Con observaciones") {
            actividad.estado.color = "conObservacion";
          } else if (actividad.estado.nombre === "Actividad avalada" || actividad.estado.nombre === "Actividad Verificada") {
            actividad.estado.color = "avalada";
          }
        });
        this.dataSource.data = data.Data;
        Swal.close();
      }
    }, (error) => {
      Swal.fire({
        title: 'Error en la operación',
        text: `No se encontraron datos registrados ${JSON.stringify(error)}`,
        icon: 'warning',
        showConfirmButton: false,
        timer: 2500
      });
    });
  }

  reportar() {
    Swal.fire({
      title: 'Enviar Reporte',
      text: `¿Confirma que desea enviar el reporte de seguimiento para su etapa de verificación por parte del Jefe de Dependencia?`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      allowOutsideClick: false,
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
                  if (this.estado == 'En reporte') {
                    this.codigoNotificacion = "SER"; // NOTIFICACION(SER)
                  } else if (this.estado == 'Revisión Verificada con Observaciones') {
                    this.codigoNotificacion = "SRVCO"; // NOTIFICACION(SRVCO)
                  } else if (this.estado == 'Con observaciones') {
                    this.codigoNotificacion = "SCO"; // NOTIFICACION(SCO)
                  }
                  Swal.fire({
                    title: 'El reporte se ha enviado satisfactoriamente',
                    icon: 'success',
                  }).then((result) => {
                    if (result.value) {
                      this.loadDataSeguimiento();
                    }
                  });
                } else {
                  Swal.fire({
                    title: 'Error en la operación',
                    icon: 'error',
                    text: `${JSON.stringify(data.Message)}`,
                    showConfirmButton: false,
                    timer: 2500
                  })
                }
              }
            }, (error: any) => {
              let DataError = error.error;
              let message: string = '<b>ID - Actividad</b><br/>';
              let mensajeActividades: any = JSON.parse(DataError.Message);
              let actividades: any = mensajeActividades.actividades;
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

  finalizarRevisionJefeDependencia() {
    Swal.fire({
      title: 'Finalizar revisión',
      text: `¿Confirma que desea finalizar la revisión del seguimiento al Plan de Acción?`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.request.put(environment.SEGUIMIENTO_MID, `seguimiento/revision_jefe_dependencia`, "{}", this.seguimiento._id).subscribe((data: any) => {
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
                  'Debe verificar o realizar las observaciones a las siguientes actividades:<br/>' +
                  message,
              });
            }
          }
        }, (error: any) => {
          let DataError = error.error;
          let message: string = '<b>ID - Actividad</b><br/>';
          let mensajeActividades: any = JSON.parse(DataError.Message);
          let actividades: any = mensajeActividades.actividades;
          let llaves: string[] = Object.keys(actividades);
          for (let llave of llaves) {
            message += llave + ' - ' + actividades[llave] + '<br/>';
          }

          Swal.fire({
            title: 'Actividades sin revisar',
            icon: 'error',
            showConfirmButton: true,
            html:
              'Debe verificar o realizar las observaciones a las siguientes actividades:<br/>' +
              message,
          });
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Finalizalización de revisión cancelada',
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

  async finalizarRevision() {
    if (await this.validacionActividades() && this.rol === 'ASISTENTE_PLANEACION') {
      /* Si todas las actividades están avaladas y el rol es ASISTENTE_PLANEACION
      NO se puede finalizar la revisión (Avalar Reporte) debe hacerlo el rol PLANEACION. */
      Swal.fire({
        title: 'Finalización de revisión cancelada',
        text: `Solo el JEFE_PLANEACION puede avalar el reporte de seguimiento`,
        icon: 'error',
        showConfirmButton: false,
        timer: 3500
      });
      return;
    }
    Swal.fire({
      title: 'Finalizar revisión',
      text: `¿Confirma que desea finalizar la revisión del seguimiento al Plan de Acción?`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      allowOutsideClick: false,
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
                  this.codigoNotificacion = "SEROAPC"; // NOTIFICACION(SEROAPC)
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
            }, (error: any) => {
              let DataError = error.error;
              let message: string = '<b>ID - Actividad</b><br/>';
              let mensajeActividades: any = JSON.parse(DataError.Message);
              let actividades: any = mensajeActividades.actividades;
              let llaves: string[] = Object.keys(actividades);
              for (let llave of llaves) {
                message += llave + ' - ' + actividades[llave] + '<br/>';
              }

              Swal.fire({
                title: 'Actividades sin revisar',
                icon: 'error',
                showConfirmButton: true,
                html:
                  'Debe verificar o realizar las observaciones a las siguientes actividades:<br/>' +
                  message,
              });
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
      (this.rol == 'PLANEACION' || this.rol == 'ASISTENTE_PLANEACION')
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
        allowOutsideClick: false,
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
                        allowOutsideClick: false,
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

  iniciarRevisionJefeUnidad() {
    Swal.fire({
      title: 'Iniciar Revisión',
      text: `Esta a punto de iniciar la revisión para este Plan`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.request.get(environment.PLANES_CRUD, `estado-seguimiento?query=activo:true,codigo_abreviacion:RJU`).subscribe((data: any) => {
          if (data) {
            this.seguimiento.estado_seguimiento_id = data.Data[0]._id;;
            this.request.put(environment.PLANES_CRUD, `seguimiento`, this.seguimiento, this.seguimiento._id).subscribe((data: any) => {
              if (data) {
                Swal.fire({
                  title: 'Seguimiento en revisión',
                  icon: 'success',
                }).then((result) => {
                  if (result.value) {
                    this.loadDataSeguimiento();
                  }
                })
              }
            })
          }
        })
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: 'Inicio de revisión cancelado',
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

  iniciarRevision() {
    Swal.fire({
      title: 'Iniciar Revisión',
      text: `Esta a punto de iniciar la revisión para este Plan`,
      icon: 'warning',
      confirmButtonText: `Continuar`,
      cancelButtonText: `Cancelar`,
      allowOutsideClick: false,
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
                this.codigoNotificacion = "SRV"; // NOTIFICACION(SRV)
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
      allowOutsideClick: false,
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
                      allowOutsideClick: false,
                      html: message,
                    });
                  } else {
                    Swal.fire({
                      title:
                        'Debe revisar las observaciones de las siguientes actividades:',
                      icon: 'error',
                      showConfirmButton: true,
                      allowOutsideClick: false,
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

  getShortenedPlanId(): string {
    return this.planId ? this.planId.substring(0, 6) : '';
  }

  async validacionActividades() {
    let actividades = this.allActividades;
    console.log(actividades);
    let aux = true;
    let actividadAvalada: any;
    await new Promise((resolve) => {
      this.request
        .get(
          environment.PLANES_CRUD,
          `estado-seguimiento?query=codigo_abreviacion:AAV,activo:true`
        ).subscribe((data: any) => {
          if (data?.Data) {
            actividadAvalada = data.Data[0]
            resolve(actividadAvalada);
          }
        });
    });
    actividades.forEach(actividad => {
      if (actividad.estado.id != actividadAvalada._id) {
        aux = false;
      }
    });
    return aux;
  }
}
