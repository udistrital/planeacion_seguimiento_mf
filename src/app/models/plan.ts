import { Reformulacion } from './reformulacion';

type Plan = {
  _id: string;
  dependencia_id: string;
  dependencia_nombre?: string;
  estado_id?: string;
  estado_plan_id?: string;
  nombre: string;
  ultima_modificacion?: string;
  fecha_creacion?: string;
  version?: number;
  fase?: string;
  vigencia: string;
  vigencia_id?: string;
  vigencia_nombre?: string;
  reformulacion?: Reformulacion;
};

export default Plan;
