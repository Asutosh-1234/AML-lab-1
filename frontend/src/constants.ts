import type { Preset } from './types';

export const PRESETS: Record<string, Preset> = {
  linear: {
    name: "Strong Linear Relationship",
    x: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10",
    y: "2.1, 3.8, 6.2, 8.1, 9.9, 12.2, 13.8, 16.1, 17.9, 20.2"
  },
  noisy: {
    name: "Linear with Significant Noise",
    x: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10",
    y: "3.5, 1.8, 7.2, 4.5, 9.1, 6.2, 11.8, 8.5, 14.2, 11.1"
  },
  negative: {
    name: "Negative Correlation",
    x: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10",
    y: "19.5, 18.2, 15.8, 14.1, 12.2, 9.9, 8.1, 6.2, 3.8, 2.1"
  },
  perfect: {
    name: "Perfect Fit (y = 2.5x - 3)",
    x: "2, 4, 6, 8, 10",
    y: "2, 7, 12, 17, 22"
  },
  constant: {
    name: "Zero Slope (Horizontal)",
    x: "1, 2, 3, 4, 5",
    y: "4.5, 4.5, 4.5, 4.5, 4.5"
  },
  invalid_vertical: {
    name: "Vertical Line (Fails Validation)",
    x: "5, 5, 5, 5, 5",
    y: "1, 2, 3, 4, 5"
  }
};
