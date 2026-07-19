import { Play, AlertTriangle } from 'lucide-react';
import type { DataPoint } from '../types';
import TableEditor from './TableEditor';

interface DataInputProps {
  points: DataPoint[];
  onCellChange: (id: string, field: 'x' | 'y', value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onClearData: () => void;
  onRun: () => void;
  loading: boolean;
  error: string | null;
}

export function DataInput({
  points,
  onCellChange,
  onAddRow,
  onRemoveRow,
  onClearData,
  onRun,
  loading,
  error
}: DataInputProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden p-5">
      {/* Title */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Input Data Points</h2>
      </div>

      <TableEditor
        points={points}
        onCellChange={onCellChange}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
        onClearData={onClearData}
      />

      {/* Run Buttons & Status */}
      <div className="mt-5 pt-5 border-t border-slate-100">
        <button
          type="button"
          onClick={onRun}
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
  );
}

export default DataInput;
