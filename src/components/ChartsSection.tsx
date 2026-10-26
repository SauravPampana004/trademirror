import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import { LineChart as LineChartIcon, BarChart3, Clock } from 'lucide-react';
import { Trade, TradeMetrics } from '../types/trade';
import { calculateInstrumentPerformance, calculateSessionPerformance } from '../utils/metricsEngine';

interface ChartsSectionProps {
  trades: Trade[];
  metrics: TradeMetrics;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ trades, metrics }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'cumulative' | 'instruments' | 'timing'>('all');
  const [curveMode, setCurveMode] = useState<'cumulative' | 'daily' | 'drawdown'>('cumulative');

  const instrumentData = React.useMemo(() => calculateInstrumentPerformance(trades), [trades]);
  const sessionData = React.useMemo(() => calculateSessionPerformance(trades), [trades]);

  const curveData = metrics.cumulativePnlCurve;
  const dailyData = metrics.dailyPnlDistribution;

  // Custom Tooltip for Cumulative P&L (Clean Light Card)
  const CumulativeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.cumulativePnl >= 0;
      return (
        <div className="bg-white text-slate-900 p-3.5 rounded-xl shadow-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 font-semibold pb-1 border-b border-slate-100">
            <span>{data.date}</span>
            <span className="text-indigo-600 font-bold ml-3 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              {data.symbol}
            </span>
          </div>
          <div className="pt-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Trade Result:</span>
              <span className={`font-bold ml-2 font-mono ${data.tradePnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.tradePnl >= 0 ? '+' : ''}${data.tradePnl.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Cumulative P&L:</span>
              <span className={`font-extrabold ml-2 font-mono ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositive ? '+' : ''}${data.cumulativePnl.toFixed(2)}
              </span>
            </div>
            {data.drawdown < 0 && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Drawdown from High:</span>
                <span className="text-rose-600 font-bold font-mono">${data.drawdown.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Daily Bars (Clean Light Card)
  const DailyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.pnl >= 0;
      return (
        <div className="bg-white text-slate-900 p-3 rounded-xl shadow-xl border border-slate-200 text-xs space-y-1">
          <div className="text-slate-600 font-semibold">{data.date}</div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-500">Day Total:</span>
            <span className={`font-bold ml-3 font-mono ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? '+' : ''}${data.pnl.toFixed(2)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            {data.tradesCount} executed trade{data.tradesCount === 1 ? '' : 's'}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Instruments (Clean Light Card)
  const InstrumentTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white text-slate-900 p-3.5 rounded-xl shadow-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="font-extrabold text-sm text-indigo-700">{d.symbol}</span>
            <span className="text-slate-500 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-medium">{d.tradesCount} executions</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Net Realized P&L:</span>
              <span className={`font-bold font-mono ${d.netPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {d.netPnl >= 0 ? '+' : ''}${d.netPnl.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Win Rate:</span>
              <span className="font-bold text-slate-900 font-mono">{d.winRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expectancy / Trade:</span>
              <span className="font-semibold text-slate-700 font-mono">${d.avgPnl.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Session Timing (Clean Light Card)
  const SessionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white text-slate-900 p-3.5 rounded-xl shadow-xl border border-slate-200 text-xs space-y-1.5">
          <div className="font-bold text-sm text-slate-900">{d.label}</div>
          <div className="text-[11px] text-slate-500 pb-1 border-b border-slate-100">{d.timeRange}</div>
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Net P&L:</span>
              <span className={`font-bold font-mono ${d.netPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {d.netPnl >= 0 ? '+' : ''}${d.netPnl.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Volume:</span>
              <span className="font-semibold text-slate-800 font-mono">{d.tradesCount} executions</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Win Rate:</span>
              <span className="font-semibold text-slate-800 font-mono">{d.winRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Performance Visualizations</h3>
            <p className="text-xs text-slate-500">Real-time equity progression, symbol edges, and session curves</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Views
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cumulative')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'cumulative' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            P&L Curve
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instruments')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'instruments' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Instruments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timing')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'timing' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Time of Day
          </button>
        </div>
      </div>

      {/* Grid of charts based on activeTab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CHART 1: Cumulative P&L Curve / Daily / Drawdown */}
        {(activeTab === 'all' || activeTab === 'cumulative') && (
          <div className="lg:col-span-12 glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <LineChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {curveMode === 'cumulative' ? 'Cumulative Realized Equity Curve' : curveMode === 'daily' ? 'Daily Realized P&L Distribution' : 'Peak-to-Trough Drawdown Curve'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {curveMode === 'cumulative' ? 'Sequential capital growth across all executions' : curveMode === 'daily' ? 'Aggregated daily net profit and loss' : 'Underwater equity retracement percentage'}
                  </p>
                </div>
              </div>

              {/* Sub-mode switcher */}
              <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setCurveMode('cumulative')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    curveMode === 'cumulative' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cumulative
                </button>
                <button
                  type="button"
                  onClick={() => setCurveMode('daily')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    curveMode === 'daily' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Daily Bars
                </button>
                <button
                  type="button"
                  onClick={() => setCurveMode('drawdown')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    curveMode === 'drawdown' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Drawdown
                </button>
              </div>
            </div>

            <div className="h-68 sm:h-76 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {curveMode === 'cumulative' ? (
                  <AreaChart data={curveData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.7} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip content={<CumulativeTooltip />} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Area
                      type="monotone"
                      dataKey="cumulativePnl"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#pnlGradient)"
                    />
                  </AreaChart>
                ) : curveMode === 'daily' ? (
                  <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.7} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip content={<DailyTooltip />} />
                    <ReferenceLine y={0} stroke="#94a3b8" />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {dailyData.map((entry, index) => (
                        <Cell
                          key={`daily-cell-${index}`}
                          fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={curveData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.0} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.28} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.7} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip content={<CumulativeTooltip />} />
                    <ReferenceLine y={0} stroke="#94a3b8" />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#drawdownGradient)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: Instrument Performance */}
        {(activeTab === 'all' || activeTab === 'instruments') && (
          <div className={`${activeTab === 'all' ? 'lg:col-span-6' : 'lg:col-span-12'} glass-card rounded-2xl p-5 border border-slate-200/90 shadow-xs`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Instrument Edge & Drag</h4>
                  <p className="text-[11px] text-slate-500">Realized P&L aggregated by symbol</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {instrumentData.length} Tickers
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={instrumentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.7} />
                  <XAxis
                    dataKey="symbol"
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<InstrumentTooltip />} />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Bar dataKey="netPnl" radius={[6, 6, 0, 0]}>
                    {instrumentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.netPnl >= 0 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: Time of Day Patterns */}
        {(activeTab === 'all' || activeTab === 'timing') && (
          <div className={`${activeTab === 'all' ? 'lg:col-span-6' : 'lg:col-span-12'} glass-card rounded-2xl p-5 border border-slate-200/90 shadow-xs`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Time-of-Day Execution Curves</h4>
                  <p className="text-[11px] text-slate-500">Market Open vs Midday Chop vs Afternoon Close</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Session Breakdown
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.7} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<SessionTooltip />} />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Bar dataKey="netPnl" radius={[6, 6, 0, 0]}>
                    {sessionData.map((entry, index) => (
                      <Cell
                        key={`cell-session-${index}`}
                        fill={entry.netPnl >= 0 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
