import { useState, useEffect } from 'react';
import type { DataPoint, RegressionResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useRegression() {
  // Canonical table data points state
  const [points, setPoints] = useState<DataPoint[]>([
    { id: '1', x: '1.0', y: '2.1' },
    { id: '2', x: '2.0', y: '3.8' },
    { id: '3', x: '3.0', y: '6.2' },
    { id: '4', x: '4.0', y: '8.1' },
    { id: '5', x: '5.0', y: '9.9' }
  ]);

  // API State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [regressionResult, setRegressionResult] = useState<RegressionResponse | null>(null);

  // Table Row Modifiers
  const handleAddRow = () => {
    setPoints([...points, { id: String(Date.now()), x: '', y: '' }]);
  };

  const handleRemoveRow = (id: string) => {
    if (points.length <= 2) {
      setError("You need at least 2 points to run a regression.");
      return;
    }
    setPoints(points.filter(p => p.id !== id));
  };

  const handleCellChange = (id: string, field: 'x' | 'y', value: string) => {
    setPoints(points.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Clear data
  const handleClearData = () => {
    setPoints([
      { id: '1', x: '', y: '' },
      { id: '2', x: '', y: '' }
    ]);
    setRegressionResult(null);
    setError(null);
  };

  // Run Regression Analysis
  const runRegression = async () => {
    setLoading(true);
    setError(null);

    const xNums: number[] = [];
    const yNums: number[] = [];

    // Parse and validate table points
    const activePoints = points.filter(p => p.x.trim() !== '' || p.y.trim() !== '');
    if (activePoints.length < 2) {
      setError("You must enter at least 2 complete data points.");
      setLoading(false);
      return;
    }

    for (let i = 0; i < activePoints.length; i++) {
      const px = parseFloat(activePoints[i].x);
      const py = parseFloat(activePoints[i].y);
      if (isNaN(px) || isNaN(py)) {
        setError(`Invalid numeric value at row ${i + 1}. Make sure all cells are valid numbers.`);
        setLoading(false);
        return;
      }
      xNums.push(px);
      yNums.push(py);
    }

    try {
      const response = await fetch(`${API_URL}/api/regression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ x: xNums, y: yNums }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to calculate regression metrics on the backend.");
      }

      const data: RegressionResponse = await response.json();
      setRegressionResult(data);
    } catch (err: any) {
      setError(err.message || "Could not connect to the backend server. Make sure the backend is running at http://localhost:8000.");
      setRegressionResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Compile data for plotting
  const getChartData = () => {
    const xNums: number[] = [];
    const yNums: number[] = [];

    points.forEach(p => {
      const px = parseFloat(p.x);
      const py = parseFloat(p.y);
      if (!isNaN(px) && !isNaN(py)) {
        xNums.push(px);
        yNums.push(py);
      }
    });

    if (xNums.length === 0) return [];

    // Map into coordinates and sort by X to ensure line graphs connect correctly
    const dataList = xNums.map((x, i) => {
      const actualY = yNums[i];
      let predY = undefined;
      
      if (regressionResult) {
        predY = x * regressionResult.slope + regressionResult.intercept;
      }
      
      return { x, y: actualY, pred: predY };
    });

    return dataList.sort((a, b) => a.x - b.x);
  };

  const chartData = getChartData();

  // Auto-run regression on mount
  useEffect(() => {
    runRegression();
  }, []);

  return {
    points,
    loading,
    error,
    regressionResult,
    handleAddRow,
    handleRemoveRow,
    handleCellChange,
    handleClearData,
    runRegression,
    chartData
  };
}
