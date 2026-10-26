import React, { useState, useRef } from 'react';
import { Upload, X, Download, AlertTriangle, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { parseTradingCsv, generateSampleCsvContent } from '../utils/csvParser';
import { BALANCED_SAMPLE_TRADES } from '../data/sampleDatasets';
import { ParseResult } from '../types/trade';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmUpload: (result: ParseResult, fileName: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onConfirmUpload
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const result = parseTradingCsv(text);
        setParseResult(result);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDownloadSampleTemplate = () => {
    const csv = generateSampleCsvContent(BALANCED_SAMPLE_TRADES.slice(0, 10));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'trademirror-sample-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasFatalError = parseResult?.issues.some(i => i.type === 'error');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Upload Monthly Trade History</h3>
            <p className="text-xs text-slate-500">Processed 100% locally in your browser. No data leaves your machine.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 border border-indigo-100 shadow-3xs">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {fileName ? fileName : 'Click to browse or drop your trading CSV here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports Zerodha, Interactive Brokers, Robinhood, ThinkorSwim, and custom CSV exports
            </p>
          </div>

          {/* Validation preview if parsed */}
          {parseResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="font-bold text-slate-800">{fileName}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-600 font-semibold font-mono">
                  <span>{parseResult.trades.length} valid trades</span>
                  <span>•</span>
                  <span>{parseResult.totalRawRows} rows total</span>
                </div>
              </div>

              {/* Issues/warnings */}
              {parseResult.issues.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {parseResult.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                        issue.type === 'error'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                        issue.type === 'error' ? 'text-rose-600' : 'text-amber-600'
                      }`} />
                      <div>
                        <span className="font-bold">{issue.title}: </span>
                        <span>{issue.description}</span>
                        {issue.sampleRows && issue.sampleRows.length > 0 && (
                          <div className="mt-0.5 text-[11px] opacity-80 font-mono">
                            Affected rows: {issue.sampleRows.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Validation passed! All {parseResult.trades.length} trades parsed cleanly.</span>
                </div>
              )}
            </div>
          )}

          {/* Sample template & guide download */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Need a formatted CSV template?</span>
            <button
              type="button"
              onClick={handleDownloadSampleTemplate}
              className="inline-flex items-center font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download Sample CSV
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parseResult || hasFatalError || parseResult.trades.length === 0}
            onClick={() => {
              if (parseResult && !hasFatalError) {
                onConfirmUpload(parseResult, fileName);
                onClose();
              }
            }}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <span>Analyze Dataset</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
