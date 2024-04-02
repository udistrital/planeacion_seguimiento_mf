import TipoDocumento from './tipo_documento';

type Documento = {
  Descripcion: string;
  Enlace: string;
  Id: number;
  Metadatos: string;
  Nombre: string;
  Activo: boolean;
  TipoDocumento: TipoDocumento;
};
export default Documento;
