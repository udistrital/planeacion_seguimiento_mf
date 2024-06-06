import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { GestorDocumentalService } from 'src/app/services/gestorDocumental.service';
import { RequestManager } from 'src/app/services/requestManager.service';
import Swal from 'sweetalert2';
import { VisualizarDocumentoDialogComponent } from '../generar-trimestre/visualizar-documento-dialog/visualizar-documento-dialog.component';

const FORMATOS = [
  'application/pdf',
];

@Component({
  selector: 'app-solicitud',
  templateUrl: './solicitud.component.html',
  styleUrls: ['./solicitud.component.scss'],
})
export class SolicitudComponent {
  unidad: any;
  seguimiento: any;
  formSolicitudReformulacion: FormGroup;
  rol: string = '';
  estado: string = '';
  fileName!: string;
  archivoCodificado!: string;

  constructor(
    activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private request: RequestManager,
    public dialog: MatDialog,
    private gestorDocumental: GestorDocumentalService
  ) {
    // activatedRoute.params.subscribe((prm) => {
    //   this.planId = prm['plan_id'];
    //   this.trimestreId = prm['trimestre'];
    // });
    this.formSolicitudReformulacion = this.formBuilder.group({
      unidad: ['', Validators.required],
      estado: ['', Validators.required],
      plan: ['', Validators.required],
    });
  }

  solicitarReformulacion() {
    console.log('Finalizando revision...');
  }
  async visualizarArchivo() {
    console.log('Visualizando archivo');

    if (this.fileName != undefined) {
      this.dialog.open(VisualizarDocumentoDialogComponent, {
        width: '1200',
        minHeight: 'calc(100vh - 90px)',
        height: '80%',
        data: {
          url: 'data:application/pdf;base64,' + this.archivoCodificado,
          editable: false,
        },
      });
    } else {
      Swal.fire({
        title: 'Error en la operación',
        text: `No hay ningún archivo cargado`,
        icon: 'warning',
        showConfirmButton: false,
        timer: 2500,
      });
      // Swal.fire({
      //   title: 'Cargando información',
      //   timerProgressBar: true,
      //   showConfirmButton: false,
      //   willOpen: () => {
      //     Swal.showLoading();
      //   },
      // });

      // this.gestorDocumental.get([{ file: this.fileName }]).subscribe({
      //   next: (documento: any[]) => {
      //     const dialogRef = this.dialog.open(
      //       VisualizarDocumentoDialogComponent,
      //       {
      //         width: '1200px',
      //         minHeight: 'calc(100vh - 90px)',
      //         height: '800px',
      //         data: { ...documento[0], editable: false },
      //       }
      //     );

      //     dialogRef.afterClosed().subscribe((result) => {
      //       if (result == undefined) {
      //         return undefined;
      //       } else {
      //         for (
      //           let index = 0;
      //           index < this.dataSource.data.length;
      //           index++
      //         ) {
      //           if (this.dataSource.data[index]['Id'] == result['Id']) {
      //             this.dataSource.data[index]['Observacion'] =
      //               result['Observacion'];
      //           }
      //         }
      //       }
      //     });
      //   },

      //   error: (error: any) => {
      //     Swal.fire({
      //       title: 'Error en la operación',
      //       text: `No se pudo cargar el documento ${JSON.stringify(error)}`,
      //       icon: 'warning',
      //       showConfirmButton: false,
      //       timer: 2500,
      //     });
      //   },
      // });
    }
  }

  async onChangeArchivo(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('Archivo seleccionado:', file.name);
      if (!FORMATOS.includes(file.type)) {
        Swal.fire({
          title: 'Archivo no válido',
          text: `No se admite el tipo de archivo que seleccionó`,
          icon: 'error',
          showConfirmButton: false,
          timer: 2500,
        });
      } else {
        // Aquí puedes manejar el archivo seleccionado (por ejemplo, subirlo a un servidor)
        Swal.fire({
          title: 'Guardando documento',
          timerProgressBar: true,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });

        this.archivoCodificado = (await this.gestorDocumental.fileToBase64(
          file
        )) as string;

        const bodyRequest = {
          documento: [
            {
              IdTipoDocumento: 60,
              nombre: file.name,
              metadatos: {
                dato_a: 'Soporte planeacion',
              },
              descripcion:
                'Documento de soporte para reformulación de plan de acción',
              file: this.archivoCodificado,
              Activo: true,
            },
          ],
          // _id: this.seguimiento.id,
        };
        console.log(bodyRequest);
        this.fileName = file.name;
        Swal.close();
        // this.request
        //   .put(
        //     environment.SEGUIMIENTO_MID,
        //     `detalles/documento`,
        //     bodyRequest,
        //     this.planId + `/` + this.indexActividad + `/` + this.trimestreId
        //   )
        //   .subscribe()
      }
    } else {
      Swal.fire({
        title: 'Error en la operación',
        text: `No se pudo subir el documento`,
        icon: 'warning',
        showConfirmButton: false,
        timer: 2500,
      });
    }
  }
  activarCargarArchivo() {
    (document.getElementById('archivo') as HTMLInputElement).click();
  }
}
