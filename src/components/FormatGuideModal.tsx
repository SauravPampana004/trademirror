import React from 'react';
import { X, CheckCircle2, Download, HelpCircle } from 'lucide-react';
import { BALANCED_SAMPLE_TRADES } from '../data/sampleDatasets';
import { generateSampleCsvContent } from '../utils/csvParser';

interface FormatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormatGuideModal: React.FC<FormatGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const csv = generateSampleCsvContent(BALANCED_SAMPLE_TRADES.slice(0, 10));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'trademirror-sample-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">CSV Format & Column Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600 overflow-y-auto max-h-[75vh]">
          <p>
            TradeMirror uses an intelligent fuzzy column mapper that supports most common retail broker exports (Zerodha, Interactive Brokers, Robinhood, ThinkorSwim, and generic spreadsheets).
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="px-3.5 py-2.5">Field</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">Accepted Column Headers</th>
                  <th className="px-3.5 py-2.5">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">Date / Timestamp</td>
                  <td className="px-3.5 py-2.5"><span className="text-emerald-700 font-bold">Required</span></td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">Date, DateTime, Time, Timestamp, FillTime</td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px]">2026-10-01 09:42:00</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">Symbol / Ticker</td>
                  <td className="px-3.5 py-2.5"><span className="text-emerald-700 font-bold">Required</span></td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">Symbol, Ticker, Instrument, Asset, Contract</td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px]">NVDA, SPY, TSLA</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">Realized P&L</td>
                  <td className="px-3.5 py-2.5"><span className="text-emerald-700 font-bold">Required</span></td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">PnL, RealizedPnL, NetPnL, Profit, Return</td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px]">240.50, -120.00, ($150)</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">Trade Direction</td>
                  <td className="px-3.5 py-2.5"><span className="text-slate-500">Optional</span></td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">Side, Action, Type, BuySell</td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px]">BUY, SELL, Long, Short</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">Quantity & Price</td>
                  <td className="px-3.5 py-2.5"><span className="text-slate-500">Optional</span></td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">Quantity, Size, Shares, EntryPrice, ExitPrice</td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px]">100 @ $125.50</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">Fees / Commissions</td>
                  <td className="px-3.5 py-2.5"><span className="text-slate-500">Optional</span></td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">Fees, Commission, Charges</td>
                  <td className="px-3.5 py-2.5 font-mono text-[11px]">$4.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 space-y-1.5">
            <h4 className="font-bold text-indigo-950 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-indigo-600" />
              Built-in Automatic Normalization
            </h4>
            <ul className="list-disc pl-4 space-y-0.5 text-indigo-900 text-[11px]">
              <li>Strips currency symbols ($ € ₹ £) and comma separators (1,500.00) automatically.</li>
              <li>Understands accounting parenthesis for negative numbers: <code>(250.00)</code> is parsed as <code>-250.00</code>.</li>
              <li>Detects potential duplicate records and flags mixed currencies with prominent audit warnings.</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Download Sample CSV Template
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
