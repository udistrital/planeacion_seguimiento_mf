export type Parametro = {
  Id: number;
  Nombre: string;
  Descripcion: string;
  CodigoAbreviacion: string;
  Activo: boolean;
  NumeroOrden: number;
  FechaCreacion: string;
  FechaModificacion: string;
  TipoParametroId?: Parametro;
  ParametroPadreId?: Parametro;
  AreaTipoId?: Parametro;
};
