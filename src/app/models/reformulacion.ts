import { Dependencia } from './dependencia';
import Plan from './plan';
import { Vigencia } from './vigencia';

export type ReformulacionAux = {
  dependencia_nombre: Dependencia;
  vigencia: Vigencia;
  plan: Plan;
};
