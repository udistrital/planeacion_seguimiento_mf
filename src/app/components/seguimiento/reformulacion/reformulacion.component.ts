import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ImplicitAutenticationService } from '@udistrital/planeacion-utilidades-module';
import { DataRequest } from 'src/app/models/dataRequest';
import { Dependencia } from 'src/app/models/dependencia';
import { EstadoPlan } from 'src/app/models/estadoPlan';
import { Parametro } from 'src/app/models/parametro';
import Plan from 'src/app/models/plan';
import {
  Reformulacion,
  ReformulacionStorage,
} from 'src/app/models/reformulacion';
import { Vigencia } from 'src/app/models/vigencia';
import { RequestManager } from 'src/app/services/requestManager.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { CodigosService } from '@udistrital/planeacion-utilidades-module';

@Component({
  selector: 'app-reformulacion',
  templateUrl: './reformulacion.component.html',
  styleUrls: ['./reformulacion.component.scss'],
})
export class ReformulacionComponent implements OnInit {
  formSelect: FormGroup;

  unidades: Dependencia[] = [];
  vigencias: Vigencia[] = [];
  planes: Plan[] = [];

  rol!: string;
  unidadSeleccionada: Dependencia | undefined = undefined;
  vigenciaSeleccionada: Vigencia | undefined = undefined;
  planSeleccionado: Plan | undefined = undefined;

  columnasMostradas!: string[];
  informacionTabla: MatTableDataSource<Plan>;
  inputsFiltros!: NodeListOf<HTMLInputElement>;

  planesTabla: Plan[] = [];

  private autenticationService = new ImplicitAutenticationService();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private codigosService = new CodigosService();

  constructor(
    private formBuilder: FormBuilder,
    private request: RequestManager,
    private router: Router,
  ) {
    this.formSelect = this.formBuilder.group({
      selectUnidad: new FormControl({ value: '', disabled: false }),
      selectVigencia: new FormControl({ value: '', disabled: true }),
      selectPlan: new FormControl({ value: '', disabled: true }),
    });
    this.informacionTabla = new MatTableDataSource<any>(this.planesTabla);
    this.informacionTabla.filterPredicate = (data, _) => this.filtroTabla(data);
    this.informacionTabla.paginator = this.paginator;
  }
  async ngOnInit() {
    let roles: string[] = await this.autenticationService.getRoles();
    if (
      roles.find(
        (x: string) => x == 'JEFE_DEPENDENCIA' || x == 'ASISTENTE_DEPENDENCIA'
      )
    ) {
      this.rol = 'JEFE_DEPENDENCIA';
    } else if (roles.find((x) => x == 'PLANEACION')) {
      this.rol = 'PLANEACION';
    } else if (roles.find((x) => x == 'JEFE_UNIDAD_PLANEACION')) {
      this.rol = 'JEFE_UNIDAD_PLANEACION';
    }
    if (this.rol === 'PLANEACION') {
      this.columnasMostradas = [
        'dependencia',
        'vigencia',
        'nombre',
        'estado',
        'fecha-creacion',
        'acciones',
      ];
      await this.cargarUnidades();
      await this.cargarVigencias();
    } else {
      this.columnasMostradas = [
        'dependencia',
        'vigencia',
        'nombre',
        'acciones',
      ];
      await this.validarUnidad();
      await this.cargarVigencias();
    }
    this.cargarDatosTabla();
  }

  cargarDatosTabla() {
    Swal.fire({
      title: 'Cargando planes',
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    this.planesTabla = [];
    if (this.rol !== 'PLANEACION') {
      this.unidades.forEach((unidad: Dependencia) => {
        this.request
          .get(
            environment.PLANES_CRUD,
            `estado-plan?query=codigo_abreviacion:A_SP`
          )
          .subscribe({
            next: (data: DataRequest) => {
              const idCodigo: string = (data.Data[0] as EstadoPlan)._id;
              this.request
                .get(
                  environment.PLANES_CRUD,
                  `plan?query=activo:true,formato:false,dependencia_id:${unidad.Id},estado_plan_id:${idCodigo}`
                )
                .subscribe({
                  next: async (data: DataRequest) => {
                    if (data) {
                      (data.Data as Plan[]).forEach((plan) => {
                        if (
                          !this.planesTabla.some(
                            (p) =>
                              p.nombre === plan.nombre &&
                              p.dependencia_id === plan.dependencia_id &&
                              p.vigencia === plan.vigencia
                          )
                        ) {
                          plan.dependencia_nombre = this.unidades.find(
                            (u) => u.Id.toString() === plan.dependencia_id
                          )!.Nombre;
                          const vigencia = this.vigencias.find(
                            (v) => v.Id.toString() === plan.vigencia?.toString()
                          )!;
                          if (vigencia) {
                            plan.vigencia_nombre = vigencia.Nombre;
                            this.planesTabla.push(plan);
                          }
                        }
                      });
                      Swal.close();
                      if (this.planesTabla.length !== 0) {
                        this.informacionTabla = new MatTableDataSource<Plan>(
                          this.planesTabla
                        );
                        this.informacionTabla.filterPredicate = (plan, _) =>
                          this.filtroTabla(plan);
                        this.informacionTabla.paginator = this.paginator;
                      }
                    }
                  },
                  error: (error) => {
                    Swal.close();
                    console.error(error);
                    Swal.fire({
                      title: 'Error en la operación',
                      text: `No se encontraron planes registrados`,
                      icon: 'warning',
                      showConfirmButton: false,
                      timer: 2500,
                    });
                  },
                });
            },
          });
      });
    } else {
      this.request
        .get(
          environment.PLANES_CRUD,
          `reformulacion?sortby=fecha_modificacion&order=desc`
        )
        .subscribe({
          next: async (data: DataRequest) => {
            if (data) {
              const reformulaciones = data.Data as Reformulacion[];
              let estadosReformulacion: Parametro[] = [];
              for (const reformulacion of reformulaciones) {
                await new Promise<Plan>((resolve) => {
                  this.request
                    .get(
                      environment.PLANES_CRUD,
                      `plan/${reformulacion.plan_id}`
                    )
                    .subscribe({
                      next: (data: DataRequest) => {
                        if (data.Data) {
                          let planAux: Plan = data.Data;
                          planAux.dependencia_nombre = this.unidades.find(
                            (u) => u.Id.toString() === planAux.dependencia_id
                          )!.Nombre;
                          const vigencia = this.vigencias.find(
                            (v) =>
                              v.Id.toString() === planAux.vigencia?.toString()
                          )!;
                          if (vigencia) {
                            planAux.vigencia_nombre = vigencia.Nombre;
                            let estado = estadosReformulacion.find(
                              (e) => e.Id === reformulacion.estado_id
                            );
                            if (!estado) {
                              this.request
                                .get(
                                  environment.PARAMETROS_SERVICE,
                                  `parametro/${reformulacion.estado_id}`
                                )
                                .subscribe({
                                  next: (data) => {
                                    estado = data.Data as Parametro;
                                    estadosReformulacion.push(estado);
                                    reformulacion.estado_nombre = estado.Nombre;
                                  },
                                });
                            } else {
                              reformulacion.estado_nombre = estado.Nombre;
                            }
                            planAux.reformulacion = reformulacion;
                            this.planesTabla.push(planAux);
                            resolve(planAux);
                          }
                        }
                      },
                    });
                });
              }
              Swal.close();
              if (this.planesTabla.length !== 0) {
                this.informacionTabla = new MatTableDataSource<Plan>(
                  this.planesTabla
                );
                this.informacionTabla.filterPredicate = (plan, _) =>
                  this.filtroTabla(plan);
                this.informacionTabla.paginator = this.paginator;
              } else {
                console.log('Datos vacios');
                console.log(this.planesTabla);
              }
              Swal.close();
            }
          },
          error: (err) => {
            console.error(err);
            Swal.close();
            Swal.fire({
              title: 'Error en la operación',
              text: `No se encontraron unidades registradas`,
              icon: 'warning',
              showConfirmButton: false,
              timer: 2500,
            });
          },
        });
    }
  }

  async validarUnidad() {
    Swal.fire({
      title: 'Validando unidad',
      timerProgressBar: true,
      showConfirmButton: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });
    await new Promise((resolve) => {
      this.autenticationService.user$.subscribe((data: any) => {
        this.request
          .get(
            environment.TERCEROS_SERVICE,
            `datos_identificacion/?query=Numero:${data['userService']['documento']}`
          )
          .subscribe((datosInfoTercero: any) => {
            this.request
              .get(
                environment.FORMULACION_MID,
                `formulacion/tercero/${datosInfoTercero[0].TerceroId.Id}`
              )
              .subscribe((vinculacion: any) => {
                for (let aux = 0; aux < vinculacion.Data.length; aux++) {
                  this.request
                    .get(
                      environment.OIKOS_SERVICE,
                      `dependencia_tipo_dependencia?query=DependenciaId:` +
                        vinculacion.Data[aux]['DependenciaId']
                    )
                    .subscribe((dataUnidad: any) => {
                      if (dataUnidad) {
                        let unidad = dataUnidad[0][
                          'DependenciaId'
                        ] as Dependencia;
                        unidad['TipoDependencia'] =
                          dataUnidad[0]['TipoDependenciaId']['Id'];
                        if (!this.unidades.find((u) => u.Id === unidad.Id)) {
                          this.unidades.push(unidad);
                        }
                      }
                    });
                }
                if (this.unidades.length > 0) {
                  this.formSelect
                    .get('selectUnidad')!
                    .setValue(this.unidades[0]);
                }
                Swal.close();
                resolve('Operación Exitosa');
              });
          });
      });
    });
  }

  async cargarUnidades() {
    Swal.fire({
      title: 'Cargando unidades',
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    return new Promise<Dependencia[]>((resolve, reject) => {
      this.request
        .get(environment.FORMULACION_MID, `formulacion/unidades`)
        .subscribe({
          next: (data: DataRequest) => {
            if (data) {
              this.unidades = data.Data as Dependencia[];
              Swal.close();
              resolve(this.unidades);
            }
          },
          error: (error) => {
            console.error(error);
            Swal.close();
            Swal.fire({
              title: 'Error en la operación',
              text: `No se encontraron unidades registradas`,
              icon: 'warning',
              showConfirmButton: false,
              timer: 2500,
            });
            reject(error);
          },
        });
    });
  }

  async cargarVigencias() {
    Swal.fire({
      title: 'Cargando vigencias',
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    return new Promise((resolve, reject) => {
      this.request
        .get(
          environment.PARAMETROS_SERVICE,
          `periodo?query=CodigoAbreviacion:VG,activo:true`
        )
        .subscribe({
          next: (data: DataRequest) => {
            if (data) {
              this.vigencias = data.Data as Vigencia[];
              Swal.close();
              resolve(this.vigencias);
            }
          },
          error: (error) => {
            console.error(error);
            Swal.close();
            Swal.fire({
              title: 'Error en la operación',
              text: `No se encontraron vigencias registradas`,
              icon: 'warning',
              showConfirmButton: false,
              timer: 2500,
            });
            reject(error);
          },
        });
    });
  }

  async cargarPlanes() {
    Swal.fire({
      title: 'Cargando planes',
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.request
      .get(
        environment.PLANES_CRUD,
        `plan?query=activo:true,formato:false,dependencia_id:${
          this.unidadSeleccionada?.Id
        },vigencia:${
          this.vigenciaSeleccionada?.Id
        },estado_plan_id:${await this.codigosService.getId('PLANES_CRUD', 'estado-plan', 'A_SP')}`
      )
      .subscribe({
        next: async (data: DataRequest) => {
          if (data) {
            this.planes = [];
            (data.Data as Plan[]).forEach((plan) => {
              if (!this.planes.some((p) => p.nombre === plan.nombre)) {
                this.planes.push(plan);
              }
            });
            Swal.close();
            if (this.planes.length === 0) {
              Swal.fire({
                title:
                  'No se lograron obtener planes avalados para la unidad y la vigencia',
                icon: 'info',
                showConfirmButton: false,
                timer: 2500,
              });
            }
          }
        },
        error: (error) => {
          Swal.close();
          console.error(error);
          Swal.fire({
            title: 'Error en la operación',
            text: `No se encontraron planes registrados`,
            icon: 'warning',
            showConfirmButton: false,
            timer: 2500,
          });
        },
      });
  }

  onChangeUnidad(unidad: Dependencia) {
    this.unidadSeleccionada = unidad;
    if (unidad) {
      this.formSelect.get('selectVigencia')?.enable();
      if (this.vigenciaSeleccionada) {
        this.onChangeVigencia(this.vigenciaSeleccionada);
      }
    } else {
      this.formSelect.get('selectVigencia')?.reset();
      this.formSelect.get('selectVigencia')?.disable();
      this.onChangeVigencia(undefined);
    }
  }

  onChangeVigencia(vigencia: Vigencia | undefined) {
    this.vigenciaSeleccionada = vigencia;
    if (vigencia) {
      this.formSelect.get('selectPlan')?.enable();
      this.cargarPlanes();
    } else {
      this.formSelect.get('selectPlan')?.disable();
    }
    this.formSelect.get('selectPlan')?.reset();
    this.planSeleccionado = undefined;
    this.planes = [];
  }

  onChangePlan(plan: Plan) {
    this.planSeleccionado = plan;
  }

  consultar(planTraido?: Plan) {
    if (planTraido) {
      const dependencia = this.unidades.find(
        (u) => u.Id.toString() === planTraido.dependencia_id
      )!;
      const vigencia = this.vigencias.find(
        (v) => v.Id.toString() === planTraido.vigencia
      )!;

      localStorage.setItem(
        'reformulacion',
        JSON.stringify({
          dependencia: dependencia.Nombre,
          vigencia: vigencia.Nombre,
          plan: planTraido.nombre,
          plan_id: planTraido._id,
          // reformulacion_id: planTraido.reformulacion
          //   ? planTraido.reformulacion?._id
          //   : undefined,
          reformulacion: planTraido.reformulacion,
        } as ReformulacionStorage)
      );
      this.router.navigate(['reformulacion', 'solicitud']);
    } else {
      let faltanPorSeleccionar = 0;
      if (!this.unidadSeleccionada) {
        faltanPorSeleccionar += 1;
      }
      if (!this.vigenciaSeleccionada) {
        faltanPorSeleccionar += 1;
      }
      if (!this.planSeleccionado) {
        faltanPorSeleccionar += 1;
      }
      if (faltanPorSeleccionar > 0) {
        Swal.fire({
          title: 'Error en la operación',
          text: `Falta${
            faltanPorSeleccionar > 1 ? 'n' : ''
          } ${faltanPorSeleccionar} campo${
            faltanPorSeleccionar > 1 ? 's' : ''
          } por diligenciar`,
          icon: 'warning',
          showConfirmButton: false,
          timer: 2500,
        });
      } else {
        localStorage.setItem(
          'plan_reformulacion',
          JSON.stringify({
            dependencia_nombre: this.formSelect.get('selectUnidad')?.value,
            vigencia: this.formSelect.get('selectVigencia')?.value,
            plan: this.formSelect.get('selectPlan')?.value,
          })
        );
        this.router.navigate(['reformulacion', 'solicitud']);
      }
    }
  }

  filtroTabla(p: Plan) {
    if (!this.inputsFiltros) {
      this.inputsFiltros = document.querySelectorAll('th > input');
    }
    let filtrosPasados: number = 0;
    let valoresAComparar: string[];
    if (this.rol !== 'PLANEACION') {
      valoresAComparar = [
        p.dependencia_nombre!.toLowerCase(),
        p.vigencia_nombre!.toLowerCase(),
        p.nombre.toLowerCase(),
      ];
    } else {
      function agregarCero(valor: number): string {
        return valor < 10 ? `0${valor}` : valor.toString();
      }
      const fecha = new Date(p.reformulacion!.fecha_creacion);
      valoresAComparar = [
        p.dependencia_nombre!,
        p.vigencia_nombre!,
        p.nombre,
        p.reformulacion!.estado_nombre!,
        `${agregarCero(fecha.getDate())}/${agregarCero(
          fecha.getMonth() + 1
        )}/${fecha.getFullYear()}`,
      ];
    }
    this.inputsFiltros.forEach((input, posicion) => {
      if (
        valoresAComparar[posicion]
          .toLowerCase()
          .includes(input.value.trim().toLowerCase())
      ) {
        filtrosPasados++;
      }
    });
    return filtrosPasados === valoresAComparar.length;
  }

  aplicarFiltro(event: Event) {
    let filtro: string = (event.target as HTMLInputElement).value;
    if (filtro === '') {
      this.inputsFiltros.forEach((input) => {
        if (input.value !== '') {
          filtro = input.value;
          return;
        }
      });
    }
    // Se debe poner algún valor que no sea vacio para que se accione el filtro de la tabla
    this.informacionTabla.filter = filtro.trim().toLowerCase();
  }
}
