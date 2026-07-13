export interface DataPoint {
  id: string;
  x: string;
  y: string;
}

export interface RegressionMetrics {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
}

export interface RegressionResponse {
  slope: number;
  intercept: number;
  predictions: number[];
  metrics: RegressionMetrics;
}

export interface Preset {
  name: string;
  x: string;
  y: string;
}
