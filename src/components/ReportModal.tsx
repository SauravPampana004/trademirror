import React, { useState } from 'react';
import { X, Printer, Copy, Check, FileText } from 'lucide-react';
import { Trade, TradeMetrics, Insight } from '../types/trade';
import { generateMarkdownReport } from '../utils/exportUtils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
  metrics: TradeMetrics;
  insights: Insight[];
  trades: Trade[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  datasetName,
  metrics,
  insights,
  trades
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownReport(datasetName, metrics, insights, trades);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNetPositive = metrics.netPnl >= 0;
  const profitFactorStr = metrics.profitFactor !== null
    ? metrics.profitFactor.toFixed(2)
    : (metrics.grossProfit > 0 ? '∞ (Zero Losses)' : '0.00');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Toolbar (hidden on print) */}
        <div className="no-print px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Executive Performance & Pattern Report</h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />}
              {copied ? 'Copied Markdown!' : 'Copy Markdown'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1 text-indigo-200" />
              Print / Save PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:space-y-4 text-slate-800">
          {/* Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">
                  Nubra Product Management Intern Assessment
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  TradeMirror Monthly Trading Intelligence
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Active Dataset: <strong className="text-slate-800">{datasetName}</strong> • Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Net Monthly Result</span>
                <span className={`text-2xl font-black font-mono ${isNetPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isNetPositive ? '+' : ''}${metrics.netPnl.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Core Metrics Table */}
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              1. Performance Summary & Execution Metrics
            </h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-slate-700">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-500">Total Executions</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 font-mono">{metrics.totalTrades} trades</td>
                    <td className="px-4 py-2.5 font-medium text-slate-500">Win Rate</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 font-mono">{metrics.winRate}% ({metrics.winningTrades}W / {metrics.losingTrades}L)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-slate-500">Net Realized P&L</td>
                    <td className={`px-4 py-2.5 font-bold font-mono ${isNetPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isNetPositive ? '+' : ''}${metrics.netPnl.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-500">Profit Factor</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 font-mono">{profitFactorStr}</td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-500">Avg Winning Trade</td>
                    <td className="px-4 py-2.5 font-semibold text-emerald-600 font-mono">+${metrics.avgWinningTrade.toFixed(2)}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-500">Avg Losing Trade</td>
                    <td className="px-4 py-2.5 font-semibold text-rose-600 font-mono">-${Math.abs(metrics.avgLosingTrade).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-slate-500">Payoff Ratio (Win/Loss)</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 font-mono">{metrics.payoffRatio !== null ? `${metrics.payoffRatio.toFixed(2)}:1` : 'N/A'}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-500">Total Fees & Commissions</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 font-mono">${metrics.totalFees.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-slate-500">Maximum Drawdown</td>
                    <td className="px-4 py-2.5 font-bold text-rose-600 font-mono">-${metrics.maxDrawdown.toFixed(2)} ({metrics.maxDrawdownPct.toFixed(1)}%)</td>
                    <td className="px-4 py-2.5 font-medium text-slate-500">Expectancy / Trade</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 font-mono">${metrics.expectancy.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Evidence-backed Insights */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Identified Evidence-Backed Patterns ({insights.length} Patterns)
            </h2>

            <div className="space-y-3">
              {insights.map((ins, index) => (
                <div key={ins.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-200/80 px-2 py-0.5 rounded">
                        Pattern #{index + 1} • {ins.tag}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Sample Size: {ins.sampleSize} trades ({ins.sampleSizePct}% of volume)
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{ins.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{ins.summary}</p>

                  {/* Supporting numbers table */}
                  <div className="grid grid-cols-3 gap-2 py-1 text-xs">
                    {ins.supportingNumbers.map((s, i) => (
                      <div key={i} className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">{s.label}</span>
                        <span className="font-extrabold text-slate-900 block font-mono">{s.value}</span>
                        {s.sublabel && <span className="text-[10px] text-slate-500 block">{s.sublabel}</span>}
                      </div>
                    ))}
                  </div>

                  {/* Limitations and Actions */}
                  <div className="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-900">
                      <strong className="block font-bold">Statistical Limitations:</strong>
                      <span>{ins.limitations}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200/80 text-indigo-950">
                      <strong className="block font-bold">Suggested Tactical Action:</strong>
                      <span>{ins.suggestedAction}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-400 flex items-center justify-between">
            <span>TradeMirror Automated Retail Trading Pattern Intelligence</span>
            <span>Confidential Assessment Audit</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="no-print px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">Ready for review presentation or print export</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
