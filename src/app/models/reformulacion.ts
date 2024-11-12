export type ReformulacionStorage = {
  dependencia: string;
  vigencia: string;
  plan_id: string;
  plan: string;
  reformulacion?: Reformulacion;
};
export type Reformulacion = {
  _id: string;
  activo: boolean;
  archivos: string;
  estado_id: number;
  estado_nombre?: string;
  fecha_creacion: string;
  fecha_modificacion: Date;
  observaciones: string;
  plan_id: string;
  periodo: string;
};
