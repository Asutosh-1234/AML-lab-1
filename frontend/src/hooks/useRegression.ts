import { useState, useEffect } from 'react';
import type { DataPoint, RegressionResponse } from '../types';
import { PRESETS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useRegression() {
  // Canonical data points state
  const [points, setPoints] = useState<DataPoint[]>([
    { id: '1', x: '1', y: '2.1' },
    { id: '2', x: '2', y: '3.8' },
    { id: '3', x: '3', y: '6.2' },
    { id: '4', x: '4', y: '8.1' },
    { id: '5', x: '5', y: '9.9' }
  ]);

  // Bulk paste textareas state
  const [rawX, setRawX] = useState<string>('1, 2, 3, 4, 5');
  const [rawY, setRawY] = useState<string>('2.1, 3.8, 6.2, 8.1, 9.9');

  // Input Mode state
  const [inputMode, setInputMode] = useState<'table' | 'paste'>('table');

  // Selected Preset
  const [selectedPreset, setSelectedPreset] = useState<string>('linear');

  // API State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [regressionResult, setRegressionResult] = useState<RegressionResponse | null>(null);

  // Parse bulk paste strings into structured data points
  const parseRawToPoints = (xStr: string, yStr: string): DataPoint[] => {
    const xParts = xStr.trim().split(/[\s,]+/).filter(Boolean);
    const yParts = yStr.trim().split(/[\s,]+/).filter(Boolean);
    const maxLen = Math.max(xParts.length, yParts.length);
    
    const newPoints: DataPoint[] = [];
    for (let i = 0; i < maxLen; i++) {
      newPoints.push({
        id: String(Date.now() + i + Math.random()),
        x: xParts[i] || '',
        y: yParts[i] || ''
      });
    }
    return newPoints;
  };

  // Keep bulk paste text inputs synchronized with structured points when switching tabs
  const handleTabChange = (mode: 'table' | 'paste') => {
    if (mode === 'paste') {
      // Sync points array -> raw X and Y texts
      const xJoined = points.map(p => p.x).filter(Boolean).join(', ');
      const yJoined = points.map(p => p.y).filter(Boolean).join(', ');
      setRawX(xJoined);
      setRawY(yJoined);
    } else {
      // Sync raw X and Y texts -> points array
      const parsedPoints = parseRawToPoints(rawX, rawY);
      if (parsedPoints.length > 0) {
        setPoints(parsedPoints);
      }
    }
    setInputMode(mode);
  };

  // Load a preset dataset
  const handleLoadPreset = (key: string) => {
    setSelectedPreset(key);
    const preset = PRESETS[key];
    if (preset) {
      setRawX(preset.x);
      setRawY(preset.y);
      const parsedPoints = parseRawToPoints(preset.x, preset.y);
      setPoints(parsedPoints);
      setRegressionResult(null);
      setError(null);
    }
  };

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
    setRawX('');
    setRawY('');
    setRegressionResult(null);
    setError(null);
  };

  // Run Regression Analysis
  const runRegression = async () => {
    setLoading(true);
    setError(null);

    let xNums: number[] = [];
    let yNums: number[] = [];

    // Parse and prepare data based on active tab
    if (inputMode === 'table') {
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
    } else {
      const xParts = rawX.trim().split(/[\s,]+/).filter(Boolean);
      const yParts = rawY.trim().split(/[\s,]+/).filter(Boolean);

      if (xParts.length !== yParts.length) {
        setError(`Mismatched list lengths: X has ${xParts.length} items, but Y has ${yParts.length} items.`);
        setLoading(false);
        return;
      }

      if (xParts.length < 2) {
        setError("You must enter at least 2 data points.");
        setLoading(false);
        return;
      }

      for (let i = 0; i < xParts.length; i++) {
        const px = parseFloat(xParts[i]);
        const py = parseFloat(yParts[i]);
        if (isNaN(px) || isNaN(py)) {
          setError(`Invalid number at position ${i + 1}. Make sure X and Y consist of valid numbers.`);
          setLoading(false);
          return;
        }
        xNums.push(px);
        yNums.push(py);
      }
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
    let xNums: number[] = [];
    let yNums: number[] = [];

    if (inputMode === 'table') {
      points.forEach(p => {
        const px = parseFloat(p.x);
        const py = parseFloat(p.y);
        if (!isNaN(px) && !isNaN(py)) {
          xNums.push(px);
          yNums.push(py);
        }
      });
    } else {
      const xParts = rawX.trim().split(/[\s,]+/).filter(Boolean);
      const yParts = rawY.trim().split(/[\s,]+/).filter(Boolean);
      const limit = Math.min(xParts.length, yParts.length);
      for (let i = 0; i < limit; i++) {
        const px = parseFloat(xParts[i]);
        const py = parseFloat(yParts[i]);
        if (!isNaN(px) && !isNaN(py)) {
          xNums.push(px);
          yNums.push(py);
        }
      }
    }

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
    rawX,
    rawY,
    setRawX,
    setRawY,
    inputMode,
    selectedPreset,
    loading,
    error,
    regressionResult,
    handleTabChange,
    handleLoadPreset,
    handleAddRow,
    handleRemoveRow,
    handleCellChange,
    handleClearData,
    runRegression,
    chartData
  };
}
