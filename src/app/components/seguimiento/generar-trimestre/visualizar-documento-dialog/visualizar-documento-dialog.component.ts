import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ImplicitAutenticationService } from '@udistrital/planeacion-utilidades-module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-visualizar-documento-dialog',
  templateUrl: './visualizar-documento-dialog.component.html',
  styleUrls: ['./visualizar-documento-dialog.component.scss']
})
export class VisualizarDocumentoDialogComponent implements OnInit {

  file: any;
  header = "data:application/pdf;base64,";
  rol: string | undefined;
  banderaPUI: boolean;
  observacion: string;
  observacionText: string;
  private autenticationService = new ImplicitAutenticationService();

  constructor(
    public dialogRef: MatDialogRef<VisualizarDocumentoDialogComponent>,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.getRol();
    this.observacion = data.Observacion;
    this.observacionText = this.observacion;
    this.banderaPUI = data.banderaPUI;
    this.file = this.sanitizer.bypassSecurityTrustResourceUrl(data["url"]);
    Swal.close();
  }

  ngOnInit(): void {
  }

  cerrar() {
    this.dialogRef.close({ "Id": this.data["Id"], "Observacion": this.observacion });
  }

  guardar() {
    this.dialogRef.close({ "Id": this.data["Id"], "Observacion": this.observacionText });
  }

  getRol() {
    let roles: any = this.autenticationService.getRoles();
    if (roles.__zone_symbol__value.find((x: string) => x == 'JEFE_DEPENDENCIA' || x == 'ASISTENTE_DEPENDENCIA')) {
      this.rol = 'JEFE_DEPENDENCIA';
    } else if (roles.__zone_symbol__value.find((x: string) => x == 'PLANEACION')) {
      this.rol = 'PLANEACION';
    }
  }

}
