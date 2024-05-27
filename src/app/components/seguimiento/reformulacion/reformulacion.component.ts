import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-reformulacion',
  templateUrl: './reformulacion.component.html',
  styleUrls: ['./reformulacion.component.scss'],
})
export class ReformulacionComponent {
  formSelect: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.formSelect = this.formBuilder.group({
      selectUnidad: [''],
      selectVigencia: [''],
      selectPlan: [''],
    });
  }
  onChangeUnidad(evento: Event) {
    console.log(evento);
  }
  onChangePlan(evento: Event) {
    console.log(evento);
  }
  onChangeVigencia(evento: Event) {
    console.log(evento);
  }
  buscarPlan() {
    console.log('Buscando plan...');
  }
}
