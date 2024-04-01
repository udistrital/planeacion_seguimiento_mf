import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { RequestManager } from './requestManager.service';
import Documento from '../models/documento';

@Injectable({
  providedIn: 'root',
})
export class GestorDocumentalService {
  constructor(
    private anyService: RequestManager,
    private sanitization: DomSanitizer
  ) {}

  getUrlFile(base64: any, minetype: any) {
    return new Promise<string>((resolve) => {
      const url = `data:${minetype};base64,${base64}`;
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'File name', { type: minetype });
          const url = URL.createObjectURL(file);
          resolve(url);
        });
    });
  }

  fileToBase64(file: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result!.toString().replace(/^data:(.*,)?/, '');
        if (encoded.length % 4 > 0) {
          encoded += '='.repeat(4 - (encoded.length % 4));
        }
        resolve(encoded);
      };
      reader.onerror = (error) => reject(error);
    });
  }

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
          file: await this.fileToBase64(file.file),
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
                    const url = await this.getUrlFile(
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
          const url = await this.getUrlFile(
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
