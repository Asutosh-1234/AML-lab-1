import { RotateCcw } from 'lucide-react';

interface BulkPasteProps {
  rawX: string;
  onRawXChange: (val: string) => void;
  rawY: string;
  onRawYChange: (val: string) => void;
  onClearData: () => void;
}

export function BulkPaste({
  rawX,
  onRawXChange,
  rawY,
  onRawYChange,
  onClearData
}: BulkPasteProps) {
  return (
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
            onChange={(e) => onRawXChange(e.target.value)}
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
            onChange={(e) => onRawYChange(e.target.value)}
            rows={8}
            placeholder="2.2, 3.9, 6.1"
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
          ></textarea>
        </div>
      </div>
      <button
        type="button"
        onClick={onClearData}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50/50 transition-colors cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Clear Data Fields
      </button>
    </div>
  );
}

export default BulkPaste;
