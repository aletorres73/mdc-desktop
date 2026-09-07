export interface RemoteResultFactoryModel {
  Fabrica: string;
  Marcas: string[];
  Condiciones: Record<string, Record<string, string>>;
  ComisionBase: number;
  ComisionesSegmento: Record<string, number>;
}
