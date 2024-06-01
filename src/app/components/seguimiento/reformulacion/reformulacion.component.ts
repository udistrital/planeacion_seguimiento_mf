import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DataRequest } from 'src/app/models/dataRequest';
import { Dependencia } from 'src/app/models/dependencia';
import { EstadoPlan } from 'src/app/models/estadoPlan';
import Plan from 'src/app/models/plan';
import { Vigencia } from 'src/app/models/vigencia';
import { ImplicitAutenticationService } from 'src/app/services/implicitAutentication.service';
import { RequestManager } from 'src/app/services/requestManager.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

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

  columnasMostradas: string[] = [
    'dependencia',
    'vigencia',
    'nombre',
    'acciones',
  ];
  informacionTabla: MatTableDataSource<any>;
  inputsFiltros!: NodeListOf<HTMLInputElement>;
  planesCargadosDinamicamente = [
    {
      dependencia_nombre: 'VICERRECTORIA ACADEMICA',
      vigencia: 2202,
      nombre: 'Plan 1',
    },
    {
      dependencia_nombre: 'VICERRECTORIA ACADEMICA',
      vigencia: 2202,
      nombre: 'Plan 2',
    },
    {
      dependencia_nombre: 'FACULTAD DE INGENIERIA',
      vigencia: 2202,
      nombre: 'Plan 3',
    },
    {
      dependencia_nombre: 'VICERRECTORIA ACADEMICA',
      vigencia: 2202,
      nombre: 'Plan 4',
    },
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private formBuilder: FormBuilder,
    private request: RequestManager,
    private autenticationService: ImplicitAutenticationService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    this.formSelect = this.formBuilder.group({
      selectUnidad: new FormControl({ value: '', disabled: false }),
      selectVigencia: new FormControl({ value: '', disabled: true }),
      selectPlan: new FormControl({ value: '', disabled: true }),
    });
    this.informacionTabla = new MatTableDataSource<any>(
      this.planesCargadosDinamicamente
    );
    this.informacionTabla.filterPredicate = (data, _) => this.filtroTabla(data);
    this.informacionTabla.paginator = this.paginator;
  }
  async ngOnInit() {
    let roles: string[] = await this.autenticationService.getRole();
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
    if (
      this.rol == 'JEFE_DEPENDENCIA' ||
      this.rol == 'ASISTENTE_DEPENDENCIA' ||
      this.rol == 'JEFE_UNIDAD_PLANEACION'
    ) {
      await this.validarUnidad();
    } else {
      await this.cargarUnidades();
    }
    this.cargarVigencias();
  }

  ngAfterViewInit(): void {
    this.inputsFiltros = document.querySelectorAll('input');
    this._changeDetectorRef.markForCheck();
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
                        let unidad = dataUnidad[0]['DependenciaId'];
                        unidad['TipoDependencia'] =
                          dataUnidad[0]['TipoDependenciaId']['Id'];
                        this.unidades.push(unidad);
                        this.formSelect.get('selectUnidad')!.setValue(unidad);
                        this.onChangeUnidad(unidad);
                      }
                    });
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

  cargarVigencias() {
    Swal.fire({
      title: 'Cargando vigencias',
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
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
        },
      });
  }

  cargarPlanes() {
    Swal.fire({
      title: 'Cargando planes',
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    this.request
      .get(environment.PLANES_CRUD, `estado-plan?query=codigo_abreviacion:A_SP`)
      .subscribe({
        next: (data: DataRequest) => {
          const idCodigo: string = (data.Data[0] as EstadoPlan)._id;
          this.request
            .get(
              environment.PLANES_CRUD,
              `plan?query=activo:true,formato:false,dependencia_id:${this.unidadSeleccionada?.Id},vigencia:${this.vigenciaSeleccionada?.Id},estado_plan_id:${idCodigo}`
            )
            .subscribe({
              next: async (data: DataRequest) => {
                if (data) {
                  this.planes = [];
                  (data.Data as Plan[]).forEach((plan) => {
                    if (!this.planes.some((p) => p.nombre === plan.nombre)) {
                      this.planes = [...this.planes, plan];
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
  buscarPlan() {
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
      this.consultar({
        dependencia_nombre: this.formSelect.get('selectUnidad')?.value,
        vigencia: this.formSelect.get('selectVigencia')?.value,
        nombre: this.formSelect.get('selectPlan')?.value,
      });
    }
  }
  consultar(value: any) {
    console.log(value);
  }

  filtroTabla(seg: any) {
    let filtrosPasados: number = 0;
    const valoresAComparar = [
      seg.dependencia_nombre.toLowerCase(),
      seg.vigencia.toString(),
      seg.nombre.toLowerCase(),
    ];
    console.log(this.inputsFiltros);
    this.inputsFiltros.forEach((input, posicion) => {
      if (
        valoresAComparar[posicion].includes(input.value.trim().toLowerCase())
      ) {
        filtrosPasados++;
      }
    });
    return filtrosPasados === valoresAComparar.length;
  }

  async ajustarData(event: any) {
    // TODO: Actualizar para traer los datos pertinentes dependiendo de la dependencia
    let nombreUnidad = event.value;
    // await this.cargarPlanes(event.value);
    this.planesCargadosDinamicamente = this.planesCargadosDinamicamente.filter(
      (data) => data.dependencia_nombre === nombreUnidad
    );
    this.informacionTabla = new MatTableDataSource<any>(
      this.planesCargadosDinamicamente
    );
    this.informacionTabla.filterPredicate = (plan, _) => this.filtroTabla(plan);
    this.informacionTabla.paginator = this.paginator;
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
    // Se debe poner algún valor que no sea vacio  para que se accione el filtro la tabla
    this.informacionTabla.filter = filtro.trim().toLowerCase();
  }
}
