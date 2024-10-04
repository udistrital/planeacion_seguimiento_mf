type Indicador = {
  index: number;
  dato: string;
  activo: boolean;
  nombre?: string;
  formula?: string;
  meta?: string;
  reporteNumerador?: string;
  reporteDenominador?: string;
  detalleReporte?: string;
  observaciones_dependencia?: string;
  observaciones_planeacion?: string;
};
export default Indicador;
