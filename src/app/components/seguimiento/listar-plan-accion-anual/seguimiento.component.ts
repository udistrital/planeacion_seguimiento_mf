import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent,
} from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import Plan from 'src/app/models/Plan';
import Trimestre from 'src/app/models/Trimestre';
import { ImplicitAutenticationService } from 'src/app/services/implicit_autentication.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { RequestManager } from '../../../services/requestManager.service';
import { UserService } from '../../../services/userService.service';

@Component({
  selector: 'app-seguimiento',
  templateUrl: './seguimiento.component.html',
  styleUrls: ['./seguimiento.component.scss'],
})
export class ListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'unidad',
    'vigencia',
    'estado',
    'periodo',
    'seguimiento',
  ];
  displayedColumnsPL: string[] = [
    'unidad',
    'vigencia',
    'estado',
    'periodo',
    'seguimiento',
  ];
  dataSource: MatTableDataSource<any>;
  planes: any[] = [];
  allPlanes: any[] = [];
  unidades: any[] = [];
  auxUnidades: any[] = [];
  auxPlanes: any[] = [];
  auxEstadosPlanes: any[] = [];
  auxEstadosSeguimientos: any[] = [];
  auxPeriodos: any[] = [];
  trimestres: Trimestre[] = [
    {} as Trimestre,
    {} as Trimestre,
    {} as Trimestre,
    {} as Trimestre,
  ];

  unidadSelected: boolean;
  unidad: any = { nombre: '' };
  vigencias: any[] = [];
  vigenciaSelected: boolean = false;
  vigencia: any;
  plan: any;
  rol: string = '';
  periodoHabilitado: boolean = false;
  formFechas: FormGroup;
  formPlanes: FormGroup;
  formSelect: FormGroup;
  @ViewChild(MatPaginator) paginator: MatPaginator = new MatPaginator(
    new MatPaginatorIntl(),
    ChangeDetectorRef.prototype
  );

  constructor(
    public dialog: MatDialog,
    private request: RequestManager,
    private router: Router,
    private autenticationService: ImplicitAutenticationService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {
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
    this.unidadSelected = false;
    this.dataSource = new MatTableDataSource<any>();
    this.formFechas = this.formBuilder.group({
      selectVigencia: null,
      fecha1: null,
      fecha2: null,
      fecha3: null,
      fecha4: null,
      fecha5: null,
      fecha6: null,
      fecha7: null,
      fecha8: null,
    });
    this.formPlanes = this.formBuilder.group({
      selectPlan: null,
    });
    this.formSelect = this.formBuilder.group({
      selectUnidad: [''],
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  async ngOnInit() {
    await this.loadPeriodos();
    if (
      this.rol == 'JEFE_DEPENDENCIA' ||
      this.rol == 'ASISTENTE_DEPENDENCIA' ||
      this.rol == 'JEFE_UNIDAD_PLANEACION'
    ) {
      await this.validarUnidad();
    }
    // listar-plan-accion-anual/:vigencia_id/:nombre_plan/:unidad_id
    this.activatedRoute.params.subscribe(async (prm) => {
      let vigencia_id = prm['vigencia_id'];
      let nombre = prm['nombre_plan'];
      let dependencia_id = prm['unidad_id'];
      if (
        dependencia_id != undefined &&
        vigencia_id != undefined &&
        nombre != undefined
      ) {
        this.cargarPlan({
          dependencia_id,
          vigencia_id,
          nombre,
        } as Plan);
      }
    });
  }

  async loadPeriodos() {
    Swal.fire({
      title: 'Cargando períodos de la vigencia',
      timerProgressBar: true,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });
    await new Promise((resolve, reject) => {
      this.request
        .get(
          environment.PARAMETROS_SERVICE,
          `periodo?query=CodigoAbreviacion:VG,activo:true`
        )
        .subscribe({
          next: (data: any) => {
            if (data) {
              this.vigencias = data.Data;
              Swal.close();
              resolve(this.vigencias);
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
            reject(error);
          },
        });
    });
  }

  async validarUnidad() {
    await new Promise((resolve) => {
      this.userService.user$.subscribe((data: any) => {
        this.request
          .get(
            environment.TERCEROS_SERVICE,
            `datos_identificacion/?query=Numero:` +
              data['userService']['documento']
          )
          .subscribe((datosInfoTercero: any) => {
            this.request
              .get(
                environment.PLANES_MID,
                `formulacion/vinculacion_tercero/` +
                  datosInfoTercero[0].TerceroId.Id
              )
              .subscribe((vinculacion: any) => {
                this.request
                  .get(
                    environment.OIKOS_SERVICE,
                    `dependencia_tipo_dependencia?query=DependenciaId:` +
                      vinculacion['Data']['DependenciaId']
                  )
                  .subscribe((dataUnidad: any) => {
                    if (dataUnidad) {
                      let unidad = dataUnidad[0]['DependenciaId'];
                      unidad['TipoDependencia'] =
                        dataUnidad[0]['TipoDependenciaId']['Id'];

                      this.unidades.push(unidad);
                      this.auxUnidades.push(unidad);
                      const controlUnidad = this.formSelect.get('selectUnidad');
                      if (controlUnidad !== null) {
                        controlUnidad.setValue(unidad);
                      }
                      this.onChangeU(unidad);
                      resolve(unidad);
                    }
                  });
              });
          });
      });
    });
  }

  async cargarPlan(planACargar: Plan) {
    await this.onChangeV(
      this.obtenerElemento(
        this.vigencias,
        'Id',
        this.formFechas,
        'selectVigencia',
        Number(planACargar.vigencia_id)
      )
    );
    await this.onChangeP(
      this.obtenerElemento(
        this.auxPlanes,
        'nombre',
        this.formPlanes,
        'selectPlan',
        planACargar.nombre
      )
    );
    this.dataSource.filter = planACargar.nombre;
    this.dataSource.filterPredicate = (plan, _) => {
      return (
        plan['nombre'] === planACargar.nombre &&
        planACargar.dependencia_id === plan['dependencia_id']
      );
    };
  }

  async onChangeV(vigencia: any) {
    this.limpiarCampoFechas();
    this.vigencia = vigencia;
    this.dataSource.data = this.planes;
    this.dataSource.filter = ''; // Quita los filtros de la tabla
    this.auxPlanes = [];
    this.plan = undefined;
    if (
      !(
        this.vigencia == undefined ||
        (this.plan == undefined && this.vigencia == undefined)
      )
    ) {
      if (this.rol != undefined && this.rol == 'PLANEACION') {
        await this.loadPlanes('vigencia');
      } else {
        await this.loadPlanes('unidad');
      }
    }
  }
  limpiarCampoFechas() {
    for (let index = 1; index < 7; index++) {
      this.formFechas.get(`fecha${index}`)!.setValue(null);
    }
  }
  async loadPlanes(tipo: string) {
    Swal.fire({
      title: 'Cargando información',
      timerProgressBar: true,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });

    this.auxEstadosPlanes = [];

    if (tipo == 'unidad') {
      await new Promise((resolve, reject) => {
        this.request
          .get(
            environment.PLANES_CRUD,
            `plan?query=activo:true,estado_plan_id:6153355601c7a2365b2fb2a1,vigencia:${this.vigencia.Id},dependencia_id:${this.unidad.Id}`
          )
          .subscribe({
            next: async (data: any) => {
              if (data?.Data.length != 0) {
                data.Data.sort(function (a: any, b: any) {
                  return b.vigencia - a.vigencia;
                });
                this.planes = data.Data;
                await this.getEstados();
                await this.getVigencias();
                this.dataSource.data = this.planes;
                this.allPlanes = this.dataSource.data;
                await this.loadFechas();
                this.OnPageChange({ length: 0, pageIndex: 0, pageSize: 5 });
                Swal.close();
                resolve(true);
              } else {
                this.unidadSelected = false;
                this.dataSource.data = this.planes;
                this.vigencia = undefined;
                this.limpiarCampoFechas();
                Swal.fire({
                  title: 'No se encontraron planes',
                  icon: 'error',
                  text: `No se encontraron planes para realizar el seguimiento`,
                  showConfirmButton: false,
                  timer: 3500,
                });
                Swal.close();
                reject(false);
              }
            },
            error: (error) => {
              Swal.close();
              Swal.fire({
                title: 'Error en la operación',
                text: 'No se encontraron datos registrados',
                icon: 'warning',
                showConfirmButton: false,
                timer: 2500,
              });
              reject(error);
            },
          });
      });
    } else if (tipo == 'vigencia') {
      await new Promise((resolve, reject) => {
        this.request
          .get(
            environment.PLANES_CRUD,
            `plan?query=activo:true,estado_plan_id:6153355601c7a2365b2fb2a1,vigencia:${this.vigencia.Id}`
          )
          .subscribe({
            next: async (data: any) => {
              if (data) {
                if (data.Data.length != 0) {
                  data.Data.sort(function (a: any, b: any) {
                    return b.vigencia - a.vigencia;
                  });
                  this.planes = data.Data;
                  this.planes.forEach((plan) => {
                    let bandera = true;
                    this.auxPlanes.forEach((auxplan) => {
                      if (auxplan.nombre == plan.nombre) {
                        bandera = false;
                      }
                    });
                    if (bandera) {
                      this.auxPlanes.push(plan);
                    }
                  });
                  await this.loadFechas();
                  this.dataSource.data = this.planes;
                  this.allPlanes = this.dataSource.data;
                  this.OnPageChange({ length: 0, pageIndex: 0, pageSize: 5 });
                  Swal.close();
                  resolve(true);
                } else {
                  this.unidadSelected = false;
                  Swal.close();
                  Swal.fire({
                    title: 'No se encontraron planes',
                    icon: 'error',
                    text: `No se encontraron planes para realizar el seguimiento`,
                    showConfirmButton: false,
                    timer: 2500,
                  });
                  reject();
                }
              }
            },
            error: (error) => {
              Swal.close();
              Swal.fire({
                title: 'Error en la operación',
                text: 'No se encontraron datos registrados',
                icon: 'warning',
                showConfirmButton: false,
                timer: 2500,
              });
              reject(error);
            },
          });
      });
    }
  }
  async loadFechas() {
    if (this.vigencia) {
      Swal.fire({
        title: 'Cargando períodos',
        timerProgressBar: true,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });
      await new Promise((resolve, reject) => {
        this.request
          .get(
            environment.PLANES_MID,
            `seguimiento/get_periodos/` + this.vigencia.Id
          )
          .subscribe({
            next: async (data: any) => {
              if (data) {
                if (data.Data != '' && data.Data != null) {
                  let periodos = data.Data;
                  if (periodos.length > 0) {
                    this.trimestres = [
                      {} as Trimestre,
                      {} as Trimestre,
                      {} as Trimestre,
                      {} as Trimestre,
                    ];
                    for (let i = 0; i < periodos.length; i++) {
                      await new Promise((resolve, reject) => {
                        this.request
                          .get(
                            environment.PLANES_CRUD,
                            `periodo-seguimiento?query=tipo_seguimiento_id:61f236f525e40c582a0840d0,periodo_id:` +
                              periodos[i].Id
                          )
                          .subscribe({
                            next: async (data: any) => {
                              if (data?.Data != '') {
                                let seguimiento = data.Data[0];

                                let fechaInicio = new Date(
                                  seguimiento['fecha_inicio'].replace('Z', '')
                                );
                                let fechaFin = new Date(
                                  seguimiento['fecha_fin'].replace('Z', '')
                                );

                                const fechaControlAux1 = this.formFechas.get(
                                  `fecha${i * 2 + 1}`
                                );
                                const fechaControlAux2 = this.formFechas.get(
                                  `fecha${i * 2 + 2}`
                                );
                                if (
                                  fechaControlAux1 !== null &&
                                  fechaControlAux1 !== undefined
                                ) {
                                  fechaControlAux1.setValue(
                                    fechaInicio.toLocaleDateString()
                                  );
                                }
                                if (
                                  fechaControlAux2 !== null &&
                                  fechaControlAux2 !== undefined
                                ) {
                                  fechaControlAux2.setValue(
                                    fechaFin.toLocaleDateString()
                                  );
                                }
                                this.trimestres[i] = {
                                  id: seguimiento._id,
                                  fecha_inicio: fechaInicio,
                                  fecha_fin: fechaFin,
                                };

                                if (
                                  Object.keys(this.trimestres[0]).length !==
                                    0 &&
                                  Object.keys(this.trimestres[1]).length !==
                                    0 &&
                                  Object.keys(this.trimestres[2]).length !==
                                    0 &&
                                  Object.keys(this.trimestres[3]).length !== 0
                                ) {
                                  let datos = this.allPlanes.filter(
                                    (plan) =>
                                      plan.vigencia == this.vigencia.Nombre
                                  );

                                  this.dataSource.data = datos;
                                  if (
                                    (this.rol != undefined &&
                                      this.rol == 'JEFE_DEPENDENCIA') ||
                                    this.rol == 'JEFE_UNIDAD_PLANEACION'
                                  ) {
                                    await this.evaluarFechasPlan();
                                  }
                                }
                                resolve(true);
                              } else {
                                Swal.fire({
                                  title: 'Error en la operación',
                                  text: `No se encontraron datos registrados`,
                                  icon: 'warning',
                                  showConfirmButton: false,
                                  timer: 2500,
                                });
                                this.limpiarCampoFechas();
                                reject();
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
                              this.limpiarCampoFechas();
                              reject(error);
                            },
                          });
                      });
                    }
                    Swal.close();
                    resolve(true);
                  } else {
                    Swal.fire({
                      title: 'Error en la operación',
                      text: `No se encuentran tirmestres habilitados para esta vigencia`,
                      icon: 'warning',
                      showConfirmButton: false,
                      timer: 2500,
                    });
                    this.limpiarCampoFechas();
                    reject();
                  }
                } else {
                  Swal.fire({
                    title: 'Error en la operación',
                    text: `No se encontraron trimestres para esta vigencia`,
                    icon: 'warning',
                    showConfirmButton: false,
                    timer: 2500,
                  });
                  this.limpiarCampoFechas();
                  reject();
                }
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
              reject(error);
            },
          });
      });
    } else {
      this.limpiarCampoFechas();
    }
  }
  searchP(value: string): any[] {
    let filtro = value.toLowerCase();
    if (this.planes != undefined) {
      return this.planes.filter((plan) =>
        plan.nombre.toLowerCase().includes(filtro)
      );
    }
    return [];
  }
  async onChangeP(plan: any) {
    this.plan = plan;
    if (plan == undefined) {
      this.dataSource.data = [];
    } else {
      this.dataSource.data = this.searchP(plan.nombre);
      if (this.rol != undefined && this.rol == 'PLANEACION') {
        await this.getUnidades();
        await this.getEstados();
        await this.getVigencias();
        await this.evaluarFechasPlan();
      }
    }
    this.allPlanes = this.dataSource.data;
    this.dataSource.filter = '';
    this.OnPageChange({ length: 0, pageIndex: 0, pageSize: 5 });
  }
  onChangeU(unidad: any) {
    this.dataSource.data = [];
    if (unidad == undefined) {
      this.unidadSelected = false;
    } else {
      this.unidadSelected = true;
      this.unidad = unidad;
    }
    this.allPlanes = this.dataSource.data;
  }
  async getUnidades() {
    return await new Promise((resolve, reject) => {
      for (let i = 0; i < this.planes.length; i++) {
        this.request
          .get(
            environment.OIKOS_SERVICE,
            `dependencia?query=Id:` + this.planes[i].dependencia_id
          )
          .subscribe({
            next: (data: any) => {
              if (data) {
                let unidad: any = data[0];
                this.planes[i].unidad = unidad.Nombre;
              }
            },
            error: (error) => {
              Swal.fire({
                title: 'Error en la operación',
                text: 'No se encontraron datos registrados',
                icon: 'warning',
                showConfirmButton: false,
                timer: 2500,
              });
              reject(error);
            },
          });
      }
      resolve(true);
    });
  }

  async getEstados() {
    for (let i = 0; i < this.planes.length; i++) {
      if (
        this.auxEstadosPlanes.some((estado) => {
          estado._id != this.planes[i].estado_plan_id;
        }) ||
        this.auxEstadosPlanes.length == 0
      ) {
        this.auxEstadosPlanes.push({ _id: this.planes[i].estado_plan_id });
        await new Promise((resolve, reject) => {
          this.request
            .get(
              environment.PLANES_CRUD,
              `estado-plan?query=_id:` + this.planes[i].estado_plan_id
            )
            .subscribe({
              next: (data: any) => {
                if (data) {
                  let estado: any = data.Data[0];
                  this.auxEstadosPlanes[
                    this.auxEstadosPlanes.findIndex(
                      (estadoInt) => estadoInt._id == estado._id
                    )
                  ] = estado;
                  resolve(true);
                }
              },
              error: (error) => {
                Swal.fire({
                  title: 'Error en la operación',
                  text: 'No se encontraron datos registrados',
                  icon: 'warning',
                  showConfirmButton: false,
                  timer: 2500,
                });
                reject(false);
              },
            });
        });
      }
    }

    for (let i = 0; i < this.planes.length; i++) {
      this.planes[i].estado = this.auxEstadosPlanes.find(
        (estado) => estado._id == this.planes[i].estado_plan_id
      ).nombre;
    }
  }

  async getVigencias() {
    return new Promise((resolve, reject) => {
      this.request
        .get(
          environment.PARAMETROS_SERVICE,
          `periodo?query=Id:` + this.planes[0].vigencia
        )
        .subscribe({
          next: (data: any) => {
            if (data) {
              let vigencia: any = data.Data[0];
              for (let index = 0; index < this.planes.length; index++) {
                this.planes[index].vigencia = vigencia.Nombre;
              }
              resolve(data);
            }
          },
          error: (error) => {
            Swal.fire({
              title: 'Error en la operación',
              text: 'No se encontraron datos registrados',
              icon: 'warning',
              showConfirmButton: false,
              timer: 2500,
            });
            reject(error);
          },
        });
    });
  }
  onKeyP(value: string) {
    if (value === '') {
      this.auxPlanes = this.planes;
    } else {
      this.auxPlanes = this.searchP(value);
    }
  }
  async evaluarFechasPlan() {
    Swal.fire({
      title: 'Evaluando fechas',
      text: '',
      timerProgressBar: true,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });

    this.auxEstadosSeguimientos = [];

    // for (let index = 0; index < this.dataSource.data.length; index++) {
    //   const plan = this.dataSource.data[index];

    //   for (
    //     let posicionTrimestre = 0;
    //     posicionTrimestre < this.trimestres.length;
    //     posicionTrimestre++
    //   ) {
    //     const trimestre = this.trimestres[posicionTrimestre];
    this.dataSource.data.map(async (plan: any, index) => {
      this.trimestres.map(
        async (trimestre: Trimestre, posicionTrimestre: number) => {
          await new Promise(async (resolve, reject) => {
            this.request
              .get(
                environment.PLANES_CRUD,
                `seguimiento?query=activo:true,tipo_seguimiento_id:61f236f525e40c582a0840d0,plan_id:${plan._id},periodo_seguimiento_id:${trimestre.id}`
              )
              .subscribe(async (data: any) => {
                if (data.Data.length != 0) {
                  let estadoTemp;
                  if (
                    this.auxEstadosSeguimientos.length > 0 &&
                    this.auxEstadosSeguimientos.some(
                      (estado) =>
                        estado.id == data.Data[0].estado_seguimiento_id
                    )
                  ) {
                    estadoTemp = this.auxEstadosSeguimientos.find(
                      (estado) =>
                        estado.id == data.Data[0].estado_seguimiento_id
                    ).nombre;
                  } else {
                    await new Promise((resolve, reject) => {
                      this.request
                        .get(
                          environment.PLANES_CRUD,
                          `estado-seguimiento/` +
                            data.Data[0].estado_seguimiento_id
                        )
                        .subscribe((estado: any) => {
                          if (estado && estado.Data != null) {
                            estadoTemp = estado.Data.nombre;
                            this.auxEstadosSeguimientos.push({
                              id: estado.Data._id,
                              nombre: estado.Data.nombre,
                            });
                            resolve(true);
                          } else {
                            Swal.fire({
                              title: 'Error en la operación',
                              text: `No se encontraron datos de estado`,
                              icon: 'warning',
                              showConfirmButton: false,
                              timer: 2500,
                            });
                            reject(false);
                          }
                        });
                    });
                  }

                  let auxFecha = new Date();
                  let auxFechaCol = auxFecha.toLocaleString('en-US', {
                    timeZone: 'America/Mexico_City',
                  });
                  let strFechaHoy = new Date(auxFechaCol).toISOString();
                  let fechaHoy = new Date(strFechaHoy);

                  if (estadoTemp == 'Reporte Avalado') {
                    this.dataSource.data[index][
                      `t${posicionTrimestre + 1}class`
                    ] = 'verde';
                    this.dataSource.data[index]['estado'] = estadoTemp;
                  } else if (
                    fechaHoy >= trimestre['fecha_inicio'] &&
                    fechaHoy <= trimestre['fecha_fin']
                  ) {
                    this.dataSource.data[index][
                      `t${posicionTrimestre + 1}class`
                    ] = 'amarillo';
                    this.dataSource.data[index]['estado'] = estadoTemp;
                  } else {
                    this.dataSource.data[index][
                      `t${posicionTrimestre + 1}class`
                    ] = 'gris';
                  }
                  this.dataSource.data[index][
                    `t${posicionTrimestre + 1}estado`
                  ] = estadoTemp;
                  this.allPlanes = this.dataSource.data;
                  resolve(true);
                } else {
                  reject();
                }
              });
          });
          //   }
          // }
        }
      );
    });
    Swal.close();
  }
  /**
   * Obtiene el elemento filtrado por los valores dados y actualiza su campo respectivo
   * @param arreglo Lista de elementos en los cuales se va a buscar un elemento teniendo en cuenta un parametro de busqueda y el valor esperado
   * @param parametroFiltro parametro de busqueda por el cual se buscará
   * @param form formulario asociado al desplegable de la interfaz
   * @param selectFormulario select relacionado al formulario de el elemento
   * @param valor valor por el cual se filtrará
   * @returns elemento que cumpla con los valores dados
   */
  obtenerElemento(
    arreglo: any[],
    parametroFiltro: string,
    form: FormGroup,
    selectFormulario: string,
    valor: string | number
  ): any {
    let elementos = arreglo.filter(
      (elemento) => elemento[parametroFiltro] == valor
    );
    if (elementos.length > 0) {
      form.get(selectFormulario)!.setValue(elementos[0]);
      return elementos[0];
    }
  }
  OnPageChange(event: PageEvent) {
    let startIndex = event.pageIndex * event.pageSize;
    let endIndex = startIndex + event.pageSize;
    if (endIndex > this.allPlanes.length) {
      endIndex = this.allPlanes.length;
    }
    this.dataSource.data = this.allPlanes.slice(startIndex, endIndex);
    this.dataSource.data.length = this.allPlanes.length;
  }
  onTrimestreChange(trimestre: string, id: any) {
    let index = this.dataSource.data.findIndex((row) => row._id == id);
    if (this.vigencia) {
      this.dataSource.data[index]['estado'] =
        this.dataSource.data[index][`${trimestre.toLowerCase()}estado`];
    }
    this.dataSource.data[index]['trimestre'] = trimestre;
  }
  gestionSeguimiento(plan: any) {
    if (plan.trimestre != undefined) {
      this.router.navigate([
        'gestion-seguimiento/' + plan._id + '/' + plan.trimestre,
      ]);
    } else {
      Swal.fire({
        title: 'Seleccione el trimestre',
        text: `Por favor seleccione el trimestre al cual desea hacer seguimiento del plan ${plan.nombre} con vigencia ${plan.vigencia}`,
        icon: 'warning',
        showConfirmButton: false,
        timer: 5000,
      });
    }
  }
}
