import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ListComponent } from './components/seguimiento/listar-plan-accion-anual/seguimiento.component';
import { GestionComponent } from './components/seguimiento/gestion/gestion.component';
import { GenerarTrimestreComponent } from './components/seguimiento/generar-trimestre/generar-trimestre.component';
import { VisualizarDocumentoDialogComponent } from './components/seguimiento/generar-trimestre/visualizar-documento-dialog/visualizar-documento-dialog.component';
import { EvidenciasDialogComponent } from './components/seguimiento/evidencias/evidencias-dialog.component';
import { ReformulacionComponent } from './components/seguimiento/reformulacion/reformulacion.component';
import { SolicitudComponent } from './components/seguimiento/reformulacion/solicitud/solicitud.component';
import { TranslationPaginator } from './services/translationPaginator';

@NgModule({
  declarations: [
    AppComponent,
    ListComponent,
    GestionComponent,
    GenerarTrimestreComponent,
    VisualizarDocumentoDialogComponent,
    EvidenciasDialogComponent,
    ReformulacionComponent,
    SolicitudComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatSelectModule,
    MatDialogModule,
    MatPaginatorModule,
    MatButtonToggleModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: TranslationPaginator }],
  bootstrap: [AppComponent],
})
export class AppModule {}
