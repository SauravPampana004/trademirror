import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Info, AlertCircle } from 'lucide-react';
import { DataQualityIssue } from '../types/trade';

interface DataQualityBannerProps {
  issues: DataQualityIssue[];
}

export const DataQualityBanner: React.FC<DataQualityBannerProps> = ({ issues }) => {
  const [expanded, setExpanded] = useState(false);

  if (!issues || issues.length === 0) return null;

  const warningCount = issues.filter(i => i.type === 'warning').length;
  const errorCount = issues.filter(i => i.type === 'error').length;

  return (
    <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl overflow-hidden shadow-xs transition-all">
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900">
              Data Quality & Audit Notice ({issues.length} {issues.length === 1 ? 'item' : 'items'})
            </h4>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {errorCount > 0 && `${errorCount} parsing error(s) • `}
              {warningCount > 0 && `${warningCount} quality caution(s) (duplicates, missing fields, or mixed currencies)`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center space-x-1 text-xs font-bold text-amber-800 hover:text-amber-950 px-3 py-1.5 rounded-xl hover:bg-amber-100/70 transition-colors cursor-pointer"
        >
          <span>{expanded ? 'Hide Details' : 'Review Details'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-1 border-t border-amber-200/60 space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="text-xs p-3 rounded-xl bg-white border border-amber-200 text-amber-900 flex items-start space-x-2.5 shadow-3xs"
            >
              {issue.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold text-slate-900">{issue.title}: </span>
                <span className="text-slate-700">{issue.description}</span>
                {issue.sampleRows && issue.sampleRows.length > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Affected CSV rows: {issue.sampleRows.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
