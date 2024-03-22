import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { getSingleSpaExtraProviders } from 'single-spa-angular';

// const routes: Routes = [{ path: '', component: EvaluacionComponent }];
const routes: Routes = [];

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
