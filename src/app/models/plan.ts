import { Reformulacion } from './reformulacion';

type PlanResumido = {
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

export type Plan = {
  _id: string;
  activo: boolean;
  aplicativo_id: string;
  dependencia_id: string;
  descripcion: string;
  estado_plan_id: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  formato: boolean;
  formato_id: string;
  nombre: string;
  nueva_estructura: boolean;
  padre_plan_id: string;
  tipo_plan_id: string;
  vigencia: string;
  reformulacion?: boolean;
};


export default PlanResumido;
