type Plan = {
  id?: string;
  dependencia_id: string;
  dependencia_nombre?: string;
  estado?: string;
  estado_id?: string;
  nombre: string;
  ultima_modificacion?: Date;
  version?: number;
  fase?: string;
  vigencia: string;
  vigencia_id?: string;
  vigencia_nombre?: string;
};

export default Plan;
