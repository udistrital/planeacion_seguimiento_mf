import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserSubscriber } from '../models/usuario';

@Injectable({
  providedIn: 'root',
})
export class ImplicitAutenticationService {
  logoutUrl: any;
  params: any;
  payload: any;
  timeActiveAlert: number = 4000;
  isLogin = false;

  private userSubject = new BehaviorSubject({} as UserSubscriber);
  public user$ = this.userSubject.asObservable();

  private menuSubject = new BehaviorSubject({});
  public menu$ = this.menuSubject.asObservable();

  private logoutSubject = new BehaviorSubject('');
  public logout$ = this.logoutSubject.asObservable();

  constructor() {
    const user: any = localStorage.getItem('user');
    this.userSubject.next(JSON.parse(atob(user)));
  }

  public getPayload(): any {
    const idToken = window.localStorage.getItem('id_token')?.split('.');
    const payload = idToken != undefined ? JSON.parse(atob(idToken[1])) : null;
    return payload;
  }

  public getRole() {
    return new Promise<string[]>((resolve) => {
      this.user$.subscribe(({ user, userService }) => {
        const roleUser = typeof user.role !== 'undefined' ? user.role : [];
        const roleUserService =
          typeof userService.role !== 'undefined' ? userService.role : [];
        const roles = roleUser
          .concat(roleUserService)
          .filter((data) => data.indexOf('/') === -1);
        resolve(roles);
      });
    });
  }

  public getDocument() {
    const rolePromise = new Promise((resolve) => {
      this.user$.subscribe((data: any) => {
        const { userService } = data;
        resolve(userService.documento);
      });
    });
    return rolePromise;
  }
}
