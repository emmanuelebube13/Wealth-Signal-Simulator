export type SignalWeights = {
  nightlight: number;
  mobile: number;
  building: number;
  population: number;
};

export type CellData = {
  id: number;
  row: number;
  col: number;
  nightlight: number;
  mobile: number;
  building: number;
  population: number;
  groundTruth: number;
};
