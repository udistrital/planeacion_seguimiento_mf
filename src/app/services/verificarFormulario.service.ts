import { Injectable } from '@angular/core'
import { environment } from 'src/environments/environment';
import * as CryptoJS from 'crypto-js'

@Injectable({
  providedIn: 'root'
})

export class VerificarFormulario {
  getCookie(name: string): string | undefined {
    const value = '; ' + document.cookie;
    const parts = value.split('; ' + name + '=');

    if (parts.length == 2) {
      let encrypValue = parts.pop()?.split(';').shift()!;
      return this.desencriptar(encrypValue, environment.SECRET_KEY)
    }
    return undefined
  }

  deleteCookie(name: string) {
    const date = new Date();
    // Set the expiration date in the past
    date.setTime(date.getTime() - 1);
    document.cookie = name + '=; expires=' + date.toUTCString() + '; path=/';
  }

  desencriptar(textoEncriptado: string, clave: string): string {
    const bytes = CryptoJS.AES.decrypt(textoEncriptado, clave);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
