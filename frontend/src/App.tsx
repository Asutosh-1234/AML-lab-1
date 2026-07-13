import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Play,
  Plus,
  Trash2,
  HelpCircle,
  BarChart2,
  LineChart,
  FileText,
  Table,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface DataPoint {
  id: string;
  x: string;
  y: string;
}

interface RegressionMetrics {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
}

interface RegressionResponse {
  slope: number;
  intercept: number;
  predictions: number[];
  metrics: RegressionMetrics;
}

interface Preset {
  name: string;
  x: string;
  y: string;
}

const PRESETS: Record<string, Preset> = {
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
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

  // Auto-run regression once on initial load (since we have default data)
  useEffect(() => {
    runRegression();
  }, []);

  // Format regression line equation
  const getEquationText = () => {
    if (!regressionResult) return '';
    const m = regressionResult.slope.toFixed(4);
    const b = regressionResult.intercept;
    const sign = b >= 0 ? '+' : '-';
    const absB = Math.abs(b).toFixed(4);
    return `y = ${m}x ${sign} ${absB}`;
  };

  // Compile data for Recharts composed chart
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
      
      // Calculate predicted Y using slope/intercept if result is available
      if (regressionResult) {
        predY = x * regressionResult.slope + regressionResult.intercept;
      }
      
      return { x, y: actualY, pred: predY };
    });

    return dataList.sort((a, b) => a.x - b.x);
  };

  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans antialiased">
      {/* Navbar / Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-md shadow-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">RegressLab</h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">Interactive Linear Regression & Residual Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              FastAPI Connected
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Data Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Presets Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Load Preset Data</h2>
              </div>
              <select
                id="preset-select"
                value={selectedPreset}
                onChange={(e) => handleLoadPreset(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 rounded-lg py-2.5 px-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Form Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-slate-200/80 bg-slate-50/55 p-1.5">
                <button
                  type="button"
                  id="tab-table"
                  onClick={() => handleTabChange('table')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    inputMode === 'table'
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  Table Editor
                </button>
                <button
                  type="button"
                  id="tab-paste"
                  onClick={() => handleTabChange('paste')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                    inputMode === 'paste'
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Bulk Paste
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5">
                {inputMode === 'table' ? (
                  <div className="space-y-4">
                    <div className="max-h-80 overflow-y-auto border border-slate-150 rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 px-4 text-center w-12">#</th>
                            <th className="py-2.5 px-3">X Value</th>
                            <th className="py-2.5 px-3">Y Value</th>
                            <th className="py-2.5 px-4 text-center w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {points.map((point, index) => (
                            <tr key={point.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-4 text-center text-xs font-medium text-slate-400">
                                {index + 1}
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  value={point.x}
                                  onChange={(e) => handleCellChange(point.id, 'x', e.target.value)}
                                  placeholder="e.g. 1.0"
                                  className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500/30 rounded px-2.5 py-1 text-sm outline-none font-mono"
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  value={point.y}
                                  onChange={(e) => handleCellChange(point.id, 'y', e.target.value)}
                                  placeholder="e.g. 2.0"
                                  className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500/30 rounded px-2.5 py-1 text-sm outline-none font-mono"
                                />
                              </td>
                              <td className="py-2 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(point.id)}
                                  className="p-1 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-md transition-colors"
                                  title="Delete Row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add New Row
                      </button>
                      <button
                        type="button"
                        onClick={handleClearData}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50/50 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear All
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Enter values separated by commas, spaces, or newlines. Make sure the number of items in both lists is equal.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="raw-x-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          X Coordinates
                        </label>
                        <textarea
                          id="raw-x-input"
                          value={rawX}
                          onChange={(e) => setRawX(e.target.value)}
                          rows={8}
                          placeholder="1.0, 2.0, 3.0"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                        ></textarea>
                      </div>
                      <div>
                        <label htmlFor="raw-y-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Y Coordinates
                        </label>
                        <textarea
                          id="raw-y-input"
                          value={rawY}
                          onChange={(e) => setRawY(e.target.value)}
                          rows={8}
                          placeholder="2.2, 3.9, 6.1"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                        ></textarea>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearData}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50/50 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Clear Data Fields
                    </button>
                  </div>
                )}

                {/* Run Buttons & Status */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={runRegression}
                    disabled={loading}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold text-white shadow-md transition-all select-none cursor-pointer ${
                      loading
                        ? 'bg-blue-400 cursor-not-allowed shadow-none'
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/20 hover:shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Fitting Model...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        Run Regression
                      </>
                    )}
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold leading-none mb-1">Configuration Error</h4>
                      <p className="text-xs font-medium leading-relaxed">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Visualizations & Metrics (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visualizer Card */}
            <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-none">Regression Fit Plot</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Actual values vs fitted line</p>
                  </div>
                </div>
                
                {/* Equation Display */}
                {regressionResult && (
                  <div className="px-3.5 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block leading-none mb-1">Model Equation</span>
                    <span className="text-sm font-mono font-bold text-blue-800">{getEquationText()}</span>
                  </div>
                )}
              </div>

              {/* Chart Plot */}
              <div className="h-96 w-full flex items-center justify-center">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 10, right: 10, bottom: 20, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="x"
                        type="number"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        stroke="#cbd5e1"
                        label={{ value: 'Independent Variable (X)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                      />
                      <YAxis
                        type="number"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        stroke="#cbd5e1"
                        label={{ value: 'Dependent Variable (Y)', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-950/95 text-white border border-slate-800 rounded-lg p-3 shadow-lg font-sans text-xs space-y-1.5">
                                <p className="font-bold border-b border-slate-800 pb-1 mb-1 font-mono">Point Details</p>
                                <p className="flex justify-between gap-6"><span>X:</span> <span className="font-mono text-slate-300">{Number(data.x).toFixed(4)}</span></p>
                                <p className="flex justify-between gap-6"><span>Observed Y:</span> <span className="font-mono text-slate-300">{Number(data.y).toFixed(4)}</span></p>
                                {data.pred !== undefined && (
                                  <>
                                    <p className="flex justify-between gap-6 text-emerald-400"><span>Fitted Y:</span> <span className="font-mono">{Number(data.pred).toFixed(4)}</span></p>
                                    <p className="flex justify-between gap-6 text-rose-400"><span>Residual:</span> <span className="font-mono">{Number(data.y - data.pred).toFixed(4)}</span></p>
                                  </>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 'medium' }} />
                      <Scatter
                        name="Actual Data (Observed)"
                        dataKey="y"
                        fill="#2563eb"
                        shape="circle"
                        radius={6}
                      />
                      {regressionResult && (
                        <Line
                          name="Fitted Regression Line"
                          dataKey="pred"
                          stroke="#ef4444"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={false}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl max-w-sm">
                    <LineChart className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">No Plot Available</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Please enter data points and run regression to visualize the scatter plot and fitted regression line.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Metrics Dashboard Grid */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Evaluation Metrics</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Metric R2 */}
                <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-4.5 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">R-squared (R²)</span>
                    <div className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors cursor-help" />
                      <span className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] py-1 px-2.5 rounded shadow-md leading-normal w-48 opacity-0 group-hover:opacity-100 transition-all z-10">
                        Proportion of the variance in Y that is predictable from X. Values closer to 1.0 indicate a better fit.
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
                      {regressionResult ? regressionResult.metrics.r2.toFixed(4) : '—'}
                    </span>
                    {regressionResult && (
                      <span className={`text-[10px] font-bold ${
                        regressionResult.metrics.r2 > 0.8 ? 'text-emerald-600 bg-emerald-50' : regressionResult.metrics.r2 > 0.4 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50'
                      } px-1.5 py-0.5 rounded`}>
                        {regressionResult.metrics.r2 > 0.8 ? 'Strong' : regressionResult.metrics.r2 > 0.4 ? 'Moderate' : 'Weak'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-semibold">Coefficient of determination</span>
                </div>

                {/* Metric MAE */}
                <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-4.5 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">MAE</span>
                    <div className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors cursor-help" />
                      <span className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] py-1 px-2.5 rounded shadow-md leading-normal w-48 opacity-0 group-hover:opacity-100 transition-all z-10">
                        Mean Absolute Error: Average magnitude of the absolute residuals (errors).
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
                      {regressionResult ? regressionResult.metrics.mae.toFixed(4) : '—'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-semibold">Mean Absolute Error</span>
                </div>

                {/* Metric MSE */}
                <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-4.5 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">MSE</span>
                    <div className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors cursor-help" />
                      <span className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] py-1 px-2.5 rounded shadow-md leading-normal w-48 opacity-0 group-hover:opacity-100 transition-all z-10">
                        Mean Squared Error: Average of squared residuals. Heavily penalizes larger outline errors.
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
                      {regressionResult ? regressionResult.metrics.mse.toFixed(4) : '—'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-semibold">Mean Squared Error</span>
                </div>

                {/* Metric RMSE */}
                <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-4.5 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">RMSE</span>
                    <div className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors cursor-help" />
                      <span className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] py-1 px-2.5 rounded shadow-md leading-normal w-48 opacity-0 group-hover:opacity-100 transition-all z-10">
                        Root Mean Squared Error: The square root of the MSE, representing standard deviation of residuals.
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
                      {regressionResult ? regressionResult.metrics.rmse.toFixed(4) : '—'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-semibold">Root Mean Squared Error</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto border-t border-slate-200 mt-16 px-6 py-6 text-center text-xs text-slate-400 font-semibold">
        <p>RegressLab &copy; {new Date().getFullYear()} — Built with FastAPI, Vite, React & Recharts</p>
      </footer>
    </div>
  );
}

export default App;
