import React, { useState } from 'react';
import { DollarSign, Activity, Percent, Scale, TrendingUp, TrendingDown, Award, Sparkles, ShieldCheck } from 'lucide-react';
import { TradeMetrics } from '../types/trade';

interface KpiGridProps {
  metrics: TradeMetrics;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ metrics }) => {
  const [currencySymbol, setCurrencySymbol] = useState<'$' | '₹' | '€'>('$');
  const isNetPositive = metrics.netPnl >= 0;

  // Format Profit Factor safely
  const formatProfitFactor = () => {
    if (metrics.profitFactor === null) {
      if (metrics.grossProfit > 0 && metrics.grossLoss === 0) {
        return '∞ (Zero Losses)';
      }
      return 'N/A';
    }
    return metrics.profitFactor.toFixed(2);
  };

  const pfValue = metrics.profitFactor || 0;
  const pfColor = pfValue >= 1.5 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : pfValue >= 1.0 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';

  return (
    <div className="space-y-3">
      {/* Currency & Quick Toggle Bar */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 mr-1.5" />
          Core Executive Metrics & Risk Architecture
        </span>
        <div className="flex items-center space-x-1 p-0.5 bg-slate-100/90 rounded-lg border border-slate-200/80 text-xs">
          <span className="text-[10px] text-slate-400 font-medium px-1.5">Currency:</span>
          {(['$', '₹', '€'] as const).map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => setCurrencySymbol(sym)}
              className={`w-5 h-5 rounded font-bold text-[11px] transition-colors ${
                currencySymbol === sym
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Net Realized P&L */}
        <div className="lg:col-span-2 glass-card glass-card-hover rounded-2xl p-5 border border-slate-200/90 relative overflow-hidden group">
          {/* Subtle gradient glow in top right */}
          <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity ${
            isNetPositive ? 'bg-emerald-400/15' : 'bg-rose-400/15'
          }`} />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Net Realized P&L
            </span>
            <div className={`p-2 rounded-xl shadow-xs ${
              isNetPositive
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-rose-500/20'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isNetPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {isNetPositive ? '+' : ''}{currencySymbol}{metrics.netPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Net</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span className="text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded-md">
              Wins: +{currencySymbol}{metrics.grossProfit.toFixed(0)}
            </span>
            <span className="text-rose-700 font-semibold bg-rose-50/80 px-2 py-0.5 rounded-md">
              Losses: -{currencySymbol}{metrics.grossLoss.toFixed(0)}
            </span>
            <span className="text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md">
              Fees: {currencySymbol}{metrics.totalFees.toFixed(0)}
            </span>
          </div>
        </div>

        {/* 2. Total Trades & Breakdown */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Trades
              </span>
              <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {metrics.totalTrades}
              </span>
              <span className="text-xs text-slate-400 font-medium">fills</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
              {metrics.winningTrades}W
            </span>
            <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
              {metrics.losingTrades}L
            </span>
            <span className="text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
              {metrics.breakevenTrades}BE
            </span>
          </div>
        </div>

        {/* 3. Win Rate */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Win Rate
              </span>
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {metrics.winRate}%
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(metrics.winRate, 100)}%` }}
              />
              <div
                className="bg-rose-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(metrics.lossRate, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>Loss: {metrics.lossRate}%</span>
              <span>Exp: +{currencySymbol}{metrics.expectancy.toFixed(1)}/tr</span>
            </div>
          </div>
        </div>

        {/* 4. Profit Factor */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Profit Factor
              </span>
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-md shadow-amber-500/20">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatProfitFactor()}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Benchmark ≥ 1.5</span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${pfColor}`}>
              {pfValue >= 1.5 ? 'Strong Edge' : pfValue >= 1.0 ? 'Marginal' : 'Negative'}
            </span>
          </div>
        </div>

        {/* 5. Avg Win vs Avg Loss (Payoff) */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Payoff Ratio
              </span>
              <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center font-medium">
                  <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" /> Avg Win:
                </span>
                <span className="font-bold text-emerald-600">+{currencySymbol}{metrics.avgWinningTrade.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center font-medium">
                  <TrendingDown className="w-3 h-3 text-rose-500 mr-1" /> Avg Loss:
                </span>
                <span className="font-bold text-rose-600">-{currencySymbol}{Math.abs(metrics.avgLosingTrade).toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Ratio (W/L):</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
              {metrics.payoffRatio !== null ? `${metrics.payoffRatio.toFixed(2)}:1` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
