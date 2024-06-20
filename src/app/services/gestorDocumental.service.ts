import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RequestManager } from './requestManager.service';
import Documento from '../models/documento';
import { GestorDocumentalMethods } from '@udistrital/planeacion-utilidades-module';

@Injectable({
  providedIn: 'root',
})
export class GestorDocumentalService {
  private gestorMethods = new GestorDocumentalMethods();
  constructor(
    private anyService: RequestManager,
    private sanitization: DomSanitizer
  ) { }

  uploadFiles(files: any[]) {
    const documentsSubject = new Subject<Documento[]>();
    const documents$ = documentsSubject.asObservable();

    const documentos: any[] = [];

    files.map(async (file) => {
      const sendFileData = [
        {
          IdTipoDocumento: file.IdDocumento,
          nombre: file.nombre,
          metadatos: file.metadatos ? file.metadatos : {},
          descripcion: file.descripcion ? file.descripcion : '',
          file: await this.gestorMethods.fileToBase64(file.file),
        },
      ];

      this.anyService
        .post(
          environment.GESTOR_DOCUMENTAL_MID,
          'document/upload',
          sendFileData
        )
        .subscribe((dataResponse: any) => {
          documentos.push(dataResponse);
          if (documentos.length === files.length) {
            documentsSubject.next(documentos);
          }
        });
    });

    return documents$;
  }

  get(files: any[]) {
    const documentsSubject = new Subject<Documento[]>();
    const documents$ = documentsSubject.asObservable();
    const documentos = files;
    let i = 0;
    files.map(async (file, index) => {
      new Promise((resolve, reject) => {
        this.anyService
          .get(environment.DOCUMENTO_SERVICE, 'documento/' + file.Id)
          .subscribe({
            next: (doc) => {
              this.anyService
                .get(
                  environment.GESTOR_DOCUMENTAL_MID,
                  'document/' + doc.Enlace
                )
                .subscribe({
                  next: async (f: any) => {
                    const url = await this.gestorMethods.getUrlFile(
                      f.file,
                      f['file:content']['mime-type']
                    );
                    documentos[index] = {
                      ...documentos[index],
                      ...{ url: url },
                      ...{
                        Documento:
                          this.sanitization.bypassSecurityTrustUrl(url),
                      },
                    };
                    i += 1;
                    if (i === files.length) {
                      documentsSubject.next(documentos);
                    }
                    resolve(true);
                  },
                  error: (error) => {
                    reject(error);
                  },
                });
            },
            error: (error) => {
              reject(error);
            },
          });
      });
    });
    return documents$;
  }

  getByUUID(uuid: string) {
    const documentsSubject = new Subject<String>();
    const documents$ = documentsSubject.asObservable();
    this.anyService
      .get(environment.GESTOR_DOCUMENTAL_MID, `document/${uuid}`)
      .subscribe({
        next: async (f) => {
          const url = await this.gestorMethods.getUrlFile(
            f.file,
            f['file:content']['mime-type']
          );
          documentsSubject.next(url);
        },
        error: (error: Error) => {
          documentsSubject.next(error.message);
        },
      });
    return documents$;
  }
}
