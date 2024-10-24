import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpErrorManager {
  constructor() {}

  public handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.log(error)

      console.error(
        `Backend returned code ${error.status ? error.status : 'no code'}, ` +
          `body was: ${error.message}`
      );
    }
    // return an observable with a user-facing error message
    return throwError(
      () =>
        new Error(
          `Algo salió mal; por favor intenta más tarde.\nCódigo de error: ${
            error.status ? error.status.toString() : 'Error'
          }.`
        )
    );
  }
}
