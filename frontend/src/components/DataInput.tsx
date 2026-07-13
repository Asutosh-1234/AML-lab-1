import { FileText, Table, Play, AlertTriangle } from 'lucide-react';
import type { DataPoint } from '../types';
import TableEditor from './TableEditor';
import BulkPaste from './BulkPaste';

interface DataInputProps {
  inputMode: 'table' | 'paste';
  onTabChange: (mode: 'table' | 'paste') => void;
  points: DataPoint[];
  onCellChange: (id: string, field: 'x' | 'y', value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onClearData: () => void;
  rawX: string;
  onRawXChange: (val: string) => void;
  rawY: string;
  onRawYChange: (val: string) => void;
  onRun: () => void;
  loading: boolean;
  error: string | null;
}

export function DataInput({
  inputMode,
  onTabChange,
  points,
  onCellChange,
  onAddRow,
  onRemoveRow,
  onClearData,
  rawX,
  onRawXChange,
  rawY,
  onRawYChange,
  onRun,
  loading,
  error
}: DataInputProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-slate-200/80 bg-slate-50/55 p-1.5">
        <button
          type="button"
          id="tab-table"
          onClick={() => onTabChange('table')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
          onClick={() => onTabChange('paste')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
          <TableEditor
            points={points}
            onCellChange={onCellChange}
            onAddRow={onAddRow}
            onRemoveRow={onRemoveRow}
            onClearData={onClearData}
          />
        ) : (
          <BulkPaste
            rawX={rawX}
            onRawXChange={onRawXChange}
            rawY={rawY}
            onRawYChange={onRawYChange}
            onClearData={onClearData}
          />
        )}

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
    </div>
  );
}

export default DataInput;
