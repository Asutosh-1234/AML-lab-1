import Header from './components/Header';
import PresetSelector from './components/PresetSelector';
import DataInput from './components/DataInput';
import RegressionPlot from './components/RegressionPlot';
import MetricsDashboard from './components/MetricsDashboard';
import { useRegression } from './hooks/useRegression';
import { PRESETS } from './constants';

export function App() {
  const {
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
  } = useRegression();

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans antialiased">
      {/* Header */}
      <Header />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Data Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <PresetSelector
              selectedPreset={selectedPreset}
              onLoadPreset={handleLoadPreset}
              presets={PRESETS}
            />

            <DataInput
              inputMode={inputMode}
              onTabChange={handleTabChange}
              points={points}
              onCellChange={handleCellChange}
              onAddRow={handleAddRow}
              onRemoveRow={handleRemoveRow}
              onClearData={handleClearData}
              rawX={rawX}
              onRawXChange={setRawX}
              rawY={rawY}
              onRawYChange={setRawY}
              onRun={runRegression}
              loading={loading}
              error={error}
            />
          </div>

          {/* Right Column: Visualizations & Metrics (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <RegressionPlot
              chartData={chartData}
              regressionResult={regressionResult}
            />

            <MetricsDashboard
              metrics={regressionResult ? regressionResult.metrics : null}
            />
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
