import { Injectable } from '@angular/core';
import { RequestManager } from './requestManager.service';
import { environment } from 'src/environments/environment';
import { DataRequest } from '../models/dataRequest';

@Injectable({
  providedIn: 'root',
})
export class CodigosEstados {
  private idPlanEstadoAvalado: string = '';
  private idSeguimientoPlanAccion: string = '';
  private idTipoPlanProyecto: string = '';
  private constructor(public request: RequestManager) {}

  public async cargarIdentificadores() {
    await new Promise((resolve, _) => {
      this.request
        .get(
          environment.PLANES_CRUD,
          `estado-plan?query=codigo_abreviacion:A_SP,activo=true`
        )
        .subscribe({
          next: (data: DataRequest) => {
            if (data.Data[0]) {
              this.idPlanEstadoAvalado = data.Data[0]._id;
              resolve(data.Data[0]._id);
            }
          },
        });
    });
    await new Promise((resolve) => {
      this.request
        .get(
          environment.PLANES_CRUD,
          `tipo-seguimiento?query=codigo_abreviacion:S_SP,activo=true`
        )
        .subscribe({
          next: (data: DataRequest) => {
            if (data.Data[0]) {
              this.idSeguimientoPlanAccion = data.Data[0]._id;
              resolve(data.Data[0]._id);
            }
          },
        });
    });
    await new Promise((resolve) => {
      this.request
        .get(
          environment.PLANES_CRUD,
          `tipo-plan?query=codigo_abreviacion:PR_SP,activo=true`
        )
        .subscribe({
          next: (data: DataRequest) => {
            if (data.Data[0]) {
              this.idTipoPlanProyecto = data.Data[0]._id;
              resolve(data.Data[0]._id);
            }
          },
        });
    });
  }

  public getIdPlanEstadoAvalado() {
    return this.idPlanEstadoAvalado;
  }

  public getIdSeguimientoPlanAccion() {
    return this.idSeguimientoPlanAccion;
  }

  public getIdTipoPlanProyecto() {
    return this.idTipoPlanProyecto;
  }
}
