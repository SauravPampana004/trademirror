import React, { useState, useMemo } from 'react';
import { Sliders, TrendingUp, Sparkles, ShieldCheck, Check, Clock, AlertTriangle, Layers, RotateCcw } from 'lucide-react';
import { Trade } from '../types/trade';
import { calculateMetrics } from '../utils/metricsEngine';

interface WhatIfSimulatorProps {
  trades: Trade[];
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ trades }) => {
  const [avoidAfternoon, setAvoidAfternoon] = useState(false);
  const [capOutlierLosses, setCapOutlierLosses] = useState(false);
  const [excludeLaggingSymbol, setExcludeLaggingSymbol] = useState(false);

  // Baseline metrics from original active trades
  const baseMetrics = useMemo(() => calculateMetrics(trades), [trades]);

  // Find the single worst performing symbol in the active dataset
  const worstSymbol = useMemo(() => {
    const symbolMap = new Map<string, number>();
    trades.forEach(t => {
      symbolMap.set(t.symbol, (symbolMap.get(t.symbol) || 0) + t.pnl);
    });
    let minSym = '';
    let minPnl = 0;
    symbolMap.forEach((pnl, sym) => {
      if (pnl < minPnl) {
        minPnl = pnl;
        minSym = sym;
      }
    });
    return { symbol: minSym, pnl: minPnl };
  }, [trades]);

  // Calculate simulated dataset
  const simulatedTrades = useMemo(() => {
    let result = [...trades];

    // Rule 1: Avoid trades after 14:00
    if (avoidAfternoon) {
      result = result.filter(t => {
        const d = new Date(t.timestamp);
        const hour = d.getHours() + d.getMinutes() / 60;
        return hour < 14.0;
      });
    }

    // Rule 2: Exclude lagging symbol
    if (excludeLaggingSymbol && worstSymbol.symbol) {
      result = result.filter(t => t.symbol !== worstSymbol.symbol);
    }

    // Rule 3: Cap outlier losses at 1.5x of baseline average win
    if (capOutlierLosses && baseMetrics.avgWinningTrade > 0) {
      const maxAllowedLoss = baseMetrics.avgWinningTrade * 1.5;
      result = result.map(t => {
        if (t.pnl < -maxAllowedLoss) {
          return {
            ...t,
            pnl: -maxAllowedLoss,
            grossPnl: -maxAllowedLoss + (t.fees || 0)
          };
        }
        return t;
      });
    }

    return result;
  }, [trades, avoidAfternoon, excludeLaggingSymbol, capOutlierLosses, worstSymbol, baseMetrics]);

  const simMetrics = useMemo(() => calculateMetrics(simulatedTrades), [simulatedTrades]);

  const pnlDelta = simMetrics.netPnl - baseMetrics.netPnl;
  const winRateDelta = simMetrics.winRate - baseMetrics.winRate;
  const isAnyRuleActive = avoidAfternoon || capOutlierLosses || excludeLaggingSymbol;

  const resetAll = () => {
    setAvoidAfternoon(false);
    setCapOutlierLosses(false);
    setExcludeLaggingSymbol(false);
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs relative overflow-hidden">
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute -right-20 -top-20 w-72 h-72 bg-gradient-to-br from-indigo-200/25 via-purple-100/15 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Pattern Action Simulator & Counterfactual Calculator
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                Interactive What-If
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Test how applying actionable guardrails based on your 3 identified patterns would impact your bottom line.
            </p>
          </div>
        </div>

        {isAnyRuleActive && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors self-start sm:self-auto bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset Guardrails
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Guardrail Toggles (Left 7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Toggle Execution Guardrails:
          </p>

          {/* Toggle 1: Avoid Afternoon */}
          <button
            type="button"
            onClick={() => setAvoidAfternoon(!avoidAfternoon)}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
              avoidAfternoon
                ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-3xs'
            }`}
          >
            <div className="flex items-start space-x-3 pr-2">
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${avoidAfternoon ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">
                    Rule 1: Eliminate Afternoon Entries (14:00 – 16:00)
                  </span>
                  {avoidAfternoon && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.2 rounded-full border border-indigo-200">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Protects capital from late-session chop and reversal fatigue identified in Pattern #1.
                </p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-1 border transition-colors ${
              avoidAfternoon ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
            }`}>
              {avoidAfternoon && <Check className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Toggle 2: Cap Outlier Losses */}
          <button
            type="button"
            onClick={() => setCapOutlierLosses(!capOutlierLosses)}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
              capOutlierLosses
                ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-3xs'
            }`}
          >
            <div className="flex items-start space-x-3 pr-2">
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${capOutlierLosses ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">
                    Rule 2: Enforce Strict Stop-Loss (Cap at 1.5× Avg Win)
                  </span>
                  {capOutlierLosses && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.2 rounded-full border border-indigo-200">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Caps maximum single-trade loss at ${baseMetrics.avgWinningTrade > 0 ? (baseMetrics.avgWinningTrade * 1.5).toFixed(0) : '300'}, preventing asymmetric risk blowouts.
                </p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-1 border transition-colors ${
              capOutlierLosses ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
            }`}>
              {capOutlierLosses && <Check className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* Toggle 3: Exclude Lagging Symbol */}
          {worstSymbol.symbol && (
            <button
              type="button"
              onClick={() => setExcludeLaggingSymbol(!excludeLaggingSymbol)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between cursor-pointer ${
                excludeLaggingSymbol
                  ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-3xs'
              }`}
            >
              <div className="flex items-start space-x-3 pr-2">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${excludeLaggingSymbol ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">
                      Rule 3: Pause Lagging Symbol ({worstSymbol.symbol})
                    </span>
                    {excludeLaggingSymbol && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/90 px-2 py-0.2 rounded-full border border-indigo-200">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Temporarily sizes down or steps aside from {worstSymbol.symbol} (which generated -${Math.abs(worstSymbol.pnl).toFixed(0)} drag).
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-1 border transition-colors ${
                excludeLaggingSymbol ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {excludeLaggingSymbol && <Check className="w-3.5 h-3.5" />}
              </div>
            </button>
          )}
        </div>

        {/* Real-time Projected Comparison Card (Right 5 cols) - Styled for Clean Light Fintech */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 border border-indigo-200/90 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100/80">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center">
                <Sparkles className="w-4 h-4 text-indigo-600 mr-1.5" />
                Simulated Edge Impact
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white text-indigo-700 font-bold border border-indigo-200 shadow-3xs font-mono">
                {simulatedTrades.length} of {trades.length} trades
              </span>
            </div>

            {/* Projected P&L display */}
            <div className="mt-4">
              <span className="text-xs text-slate-500 block font-semibold">Projected Net Realized P&L</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${simMetrics.netPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {simMetrics.netPnl >= 0 ? '+' : ''}${simMetrics.netPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500 font-bold">USD</span>
              </div>

              {/* Delta Tag */}
              <div className="mt-2.5 flex items-center space-x-2">
                <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full font-mono ${
                  pnlDelta >= 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  {pnlDelta >= 0 ? '+' : ''}${pnlDelta.toFixed(2)} ({baseMetrics.netPnl !== 0 ? `${((pnlDelta / Math.abs(baseMetrics.netPnl)) * 100).toFixed(1)}%` : 'N/A'})
                </span>
                <span className="text-[11px] text-slate-500 font-medium">vs actual P&L</span>
              </div>
            </div>

            {/* Comparison Metrics */}
            <div className="mt-5 pt-4 border-t border-indigo-100/80 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-3xs">
                <span className="text-slate-500 block text-[11px] font-semibold">Win Rate</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5 font-mono">
                  <span className="text-base font-black text-slate-900">{simMetrics.winRate}%</span>
                  {winRateDelta !== 0 && (
                    <span className={`text-[11px] font-bold ${winRateDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ({winRateDelta >= 0 ? '+' : ''}{winRateDelta.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-3xs">
                <span className="text-slate-500 block text-[11px] font-semibold">Profit Factor</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5 font-mono">
                  <span className="text-base font-black text-slate-900">
                    {simMetrics.profitFactor !== null ? simMetrics.profitFactor.toFixed(2) : '∞'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans">
                    (was {baseMetrics.profitFactor !== null ? baseMetrics.profitFactor.toFixed(2) : '∞'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-100/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center font-medium text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 mr-1" />
              Evidence-grounded counterfactual
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Zero fabrication</span>
          </div>
        </div>
      </div>
    </div>
  );
};
