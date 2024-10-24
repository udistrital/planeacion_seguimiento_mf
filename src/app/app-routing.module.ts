import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { getSingleSpaExtraProviders } from 'single-spa-angular';
import { GenerarTrimestreComponent } from './components/seguimiento/generar-trimestre/generar-trimestre.component';
import { GestionComponent } from './components/seguimiento/gestion/gestion.component';
import { ListComponent } from './components/seguimiento/listar-plan-accion-anual/seguimiento.component';
import { ReformulacionComponent } from './components/seguimiento/reformulacion/reformulacion.component';
import { SolicitudComponent } from './components/seguimiento/reformulacion/solicitud/solicitud.component';

const routes: Routes = [
  { path: 'listar-plan-accion-anual', component: ListComponent },
  {
    path: 'listar-plan-accion-anual/:vigencia_id/:nombre_plan/:unidad_id',
    component: ListComponent,
  },
  {
    path: 'gestion-seguimiento/:plan_id/:trimestre',
    component: GestionComponent,
  },
  {
    path: 'generar-trimestre/:plan_id/:index/:trimestre_id',
    component: GenerarTrimestreComponent,
  },
  {
    path: 'reformulacion',
    component: ReformulacionComponent,
    // children: [],
  },
  {
    path: 'reformulacion/solicitud',
    component: SolicitudComponent,
  },
  { path: '**', redirectTo: 'listar-plan-accion-anual' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    provideRouter(routes),
    { provide: APP_BASE_HREF, useValue: '/seguimiento/' },
    getSingleSpaExtraProviders(),
    provideHttpClient(withFetch()),
  ],
})
export class AppRoutingModule {}
