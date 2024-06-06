export type DependenciaTipoDependencia = {
  Id: number;
  TipoDependenciaId: TipoDependencia;
  DependenciaId: Dependencia;
};

export type Dependencia = {
  Id: number;
  Nombre: string;
  TelefonoDependencia: string;
  CorreoElectronico: string;
  DependenciaTipoDependencia: null | DependenciaTipoDependencia;
  TipoDependencia?: number | TipoDependencia;
};

export type TipoDependencia = {
  Id: number;
  Nombre: string;
};
