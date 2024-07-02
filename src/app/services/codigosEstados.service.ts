import { Injectable } from '@angular/core';
import { RequestManager } from './requestManager.service';
import { environment } from 'src/environments/environment';
import { DataRequest } from '../models/dataRequest';

@Injectable({
  providedIn: 'root',
})
export class CodigosEstados {
  private consultasCodigos: {
    [key: string]: { [key: string]: { [key: string]: string } };
  } = {
    PLANES_CRUD: {
      'estado-plan': {
        A_SP: '',
      },
      'tipo-plan': {
        PR_SP: '',
      },
      'tipo-seguimiento': { S_SP: '' },
    },
    PARAMETROS_SERVICE: {
      parametro: {
        'RPA-A': '',
        'RPA-R': '',
        'RPA-F': '',
      },
    },
  };

  constructor(private request: RequestManager) {}

  /**
   * Obtener el Id cargado previamente
   * @param ruta nombre de la variable como se encuentra en environment
   * @param endpoint endpoint al que se apunta en el API
   * @param abreviacion codigo de abreviación del objeto al que se le obtendra el id
   * @returns codigo del objeto
   */
  public async getId(ruta: string, endpoint: string, abreviacion: string) {
    if (this.consultasCodigos[ruta][endpoint][abreviacion] === '') {
      this.consultasCodigos[ruta][endpoint][abreviacion] =
        await new Promise<string>((resolve) => {
          if (ruta == 'PLANES_CRUD') {
            this.request
              .get(
                environment.PLANES_CRUD,
                `${endpoint}?query=codigo_abreviacion:${abreviacion},activo:true`
              )
              .subscribe({
                next: (data: DataRequest) => {
                  if (data.Data[0]) {
                    data.Data[0]._id;
                    resolve(data.Data[0]._id);
                  }
                },
              });
          } else if (ruta == 'PARAMETROS_SERVICE') {
            this.request
              .get(
                environment.PARAMETROS_SERVICE,
                `${endpoint}?query=CodigoAbreviacion:${abreviacion},Activo:true`
              )
              .subscribe({
                next: (data: DataRequest) => {
                  if (data.Data[0]) {
                    resolve(data.Data[0].Id.toString());
                  }
                },
              });
          }
        });
    }
    return this.consultasCodigos[ruta][endpoint][abreviacion];
  }
}
