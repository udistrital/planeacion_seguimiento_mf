import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})

export class VerificarFormulario {
  private formData = new BehaviorSubject<any[]>([]);
  formData$ = this.formData.asObservable();

  // Estado para regresar a la lista de planes pendientes en seguimiento
  private estadoLista = new BehaviorSubject<boolean>(false);
  estadoLista$ = this.estadoLista.asObservable();

  setFormData(data: any, vigencia: any, unidad: any) {
    const currentFormData = this.formData.getValue();
    currentFormData.push(data)
    currentFormData.push(vigencia)
    currentFormData.push(unidad)
    this.formData.next(currentFormData);
  }

  cleanFormData() {
    this.formData.next([]);
  }

  setEstadoLista(estado: boolean) {
    this.estadoLista.next(estado);
  }
}
