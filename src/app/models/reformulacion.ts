import { Dependencia } from './dependencia';
import Plan from './plan';
import { Vigencia } from './vigencia';

export type ReformulacionAux = {
  dependencia_nombre: Dependencia;
  vigencia: Vigencia;
  plan: Plan;
};
export type Reformulacion = {
  _id: string;
  activo: boolean;
  archivos: string;
  estado_id: number;
  fecha_creacion: string;
  fecha_modificacion: Date;
  observaciones: string;
  plan_id: string;
};
