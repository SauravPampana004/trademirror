import React from 'react';
import { X, Download, Filter, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { Insight, Trade } from '../types/trade';
import { calculateMetrics } from '../utils/metricsEngine';
import { exportTradesToCsv } from '../utils/exportUtils';

interface InsightDrillDownModalProps {
  insight: Insight | null;
  allTrades: Trade[];
  onClose: () => void;
}

export const InsightDrillDownModal: React.FC<InsightDrillDownModalProps> = ({
  insight,
  allTrades,
  onClose
}) => {
  if (!insight) return null;

  // Filter the exact trades contributing to this insight
  const tradeIdSet = new Set(insight.tradeIds);
  const subsetTrades = allTrades.filter(t => tradeIdSet.has(t.id));
  const subsetMetrics = calculateMetrics(subsetTrades);

  const handleExportSubset = () => {
    exportTradesToCsv(subsetTrades, `trademirror-${insight.id}-trades.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  {insight.tag}
                </span>
                <span className="text-xs text-slate-500">• Drill-down Analysis</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{insight.title}</h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportSubset}
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Export Subset CSV
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subset Executive Metrics Ribbon */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px] font-semibold">Subset Trades</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">{subsetTrades.length}</span>
            <span className="text-[10px] text-slate-400 ml-1">({insight.sampleSizePct}% of total)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px] font-semibold">Subset Net P&L</span>
            <span className={`text-base font-extrabold font-mono ${subsetMetrics.netPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {subsetMetrics.netPnl >= 0 ? '+' : ''}${subsetMetrics.netPnl.toFixed(2)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px] font-semibold">Subset Win Rate</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">{subsetMetrics.winRate}%</span>
            <span className="text-[10px] text-slate-400 ml-1">({subsetMetrics.winningTrades}W / {subsetMetrics.losingTrades}L)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px] font-semibold">Subset Expectancy</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">${subsetMetrics.expectancy.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 ml-1">/ trade</span>
          </div>
        </div>

        {/* Scrollable Trades Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Listing all <strong>{subsetTrades.length}</strong> trades linked to this trading pattern</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5 font-semibold">Trade ID</th>
                  <th className="px-3.5 py-2.5 font-semibold">Date & Time</th>
                  <th className="px-3.5 py-2.5 font-semibold">Symbol</th>
                  <th className="px-3.5 py-2.5 font-semibold">Side</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right">Qty</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right">Entry</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right">Exit</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right">Net P&L</th>
                  <th className="px-3.5 py-2.5 font-semibold">Notes / Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {subsetTrades.map((t) => {
                  const isWin = t.pnl > 0;
                  const isLoss = t.pnl < 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2 font-mono text-[11px] text-slate-400">{t.id}</td>
                      <td className="px-3.5 py-2 text-slate-800">
                        {t.date.replace('T', ' ').slice(0, 16)}
                      </td>
                      <td className="px-3.5 py-2 font-bold text-slate-900">{t.symbol}</td>
                      <td className="px-3.5 py-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.side === 'BUY'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {t.side}
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono">{t.quantity}</td>
                      <td className="px-3.5 py-2 text-right font-mono">${t.entryPrice.toFixed(2)}</td>
                      <td className="px-3.5 py-2 text-right font-mono">${t.exitPrice.toFixed(2)}</td>
                      <td className="px-3.5 py-2 text-right font-bold font-mono">
                        <span className={`inline-flex items-center space-x-0.5 ${
                          isWin ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                          {isWin && <TrendingUp className="w-3 h-3 inline mr-0.5" />}
                          {isLoss && <TrendingDown className="w-3 h-3 inline mr-0.5" />}
                          <span>{t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}</span>
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-slate-500 text-[11px] max-w-[200px] truncate" title={t.notes || ''}>
                        {t.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Drill-down powered by TradeMirror Deterministic Pattern Clustering</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
