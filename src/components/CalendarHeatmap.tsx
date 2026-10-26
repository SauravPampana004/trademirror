import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Trade } from '../types/trade';

interface CalendarHeatmapProps {
  trades: Trade[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  trades,
  selectedDate,
  onSelectDate
}) => {
  // Aggregate trades by YYYY-MM-DD
  const dailyData = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number; trades: Trade[] }>();
    trades.forEach(t => {
      const dateKey = t.date.slice(0, 10);
      const existing = map.get(dateKey) || { pnl: 0, count: 0, trades: [] };
      existing.pnl += t.pnl;
      existing.count += 1;
      existing.trades.push(t);
      map.set(dateKey, existing);
    });
    return map;
  }, [trades]);

  // Derive month & year from the first trade in dataset (or current date)
  const { year, month, daysInMonth, startDayOfWeek, monthName } = useMemo(() => {
    if (trades.length === 0) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        daysInMonth: 31,
        startDayOfWeek: 0,
        monthName: 'Current'
      };
    }
    const firstDate = new Date(trades[0].timestamp);
    const yr = firstDate.getFullYear();
    const m = firstDate.getMonth();
    const dInMonth = new Date(yr, m + 1, 0).getDate();
    const sDay = new Date(yr, m, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const mName = firstDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    return {
      year: yr,
      month: m,
      daysInMonth: dInMonth,
      startDayOfWeek: sDay,
      monthName: mName
    };
  }, [trades]);

  // Overall Month Statistics
  const stats = useMemo(() => {
    let greenDays = 0;
    let redDays = 0;
    let bestDay = { date: '', pnl: -Infinity };
    let worstDay = { date: '', pnl: Infinity };
    let totalPnl = 0;

    dailyData.forEach((val, date) => {
      totalPnl += val.pnl;
      if (val.pnl > 0.0001) {
        greenDays++;
        if (val.pnl > bestDay.pnl) bestDay = { date, pnl: val.pnl };
      } else if (val.pnl < -0.0001) {
        redDays++;
        if (val.pnl < worstDay.pnl) worstDay = { date, pnl: val.pnl };
      }
    });

    const activeDays = greenDays + redDays;
    const greenDayPct = activeDays > 0 ? (greenDays / activeDays) * 100 : 0;

    return {
      activeDays,
      greenDays,
      redDays,
      greenDayPct: greenDayPct.toFixed(0),
      bestDay: bestDay.pnl !== -Infinity ? bestDay : null,
      worstDay: worstDay.pnl !== Infinity ? worstDay : null,
      avgDailyPnl: activeDays > 0 ? totalPnl / activeDays : 0
    };
  }, [dailyData]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Construct calendar grid cells
  const calendarCells = useMemo(() => {
    const cells = [];
    // Padding before 1st of month
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ dayNumber: null, dateKey: '' });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      cells.push({ dayNumber: d, dateKey });
    }
    return cells;
  }, [year, month, daysInMonth, startDayOfWeek]);

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Daily P&L Calendar Heatmap
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {monthName}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive session consistency. Click any day to isolate its executions in the audit table.
            </p>
          </div>
        </div>

        {/* Quick Month Metrics Pills */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{stats.greenDays} Green Days ({stats.greenDayPct}%)</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-1 font-bold">
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            <span>{stats.redDays} Red Days</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-1.5">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400 uppercase">
          {daysOfWeek.map(d => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell, idx) => {
            if (!cell.dayNumber) {
              return <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-xl bg-slate-50/40 border border-transparent" />;
            }

            const dayRecord = dailyData.get(cell.dateKey);
            const isSelected = selectedDate === cell.dateKey;
            const hasTrades = !!dayRecord && dayRecord.count > 0;
            const isWin = hasTrades && dayRecord.pnl > 0.0001;
            const isLoss = hasTrades && dayRecord.pnl < -0.0001;

            // Background styles based on P&L magnitude
            let bgClass = 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700';
            if (isWin) {
              if (dayRecord.pnl >= 250) {
                bgClass = 'bg-emerald-100/80 hover:bg-emerald-200/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs';
              } else {
                bgClass = 'bg-emerald-50/90 hover:bg-emerald-100 border-emerald-200 text-emerald-900 font-semibold';
              }
            } else if (isLoss) {
              if (dayRecord.pnl <= -250) {
                bgClass = 'bg-rose-100/80 hover:bg-rose-200/80 border-rose-300 text-rose-950 font-bold shadow-2xs';
              } else {
                bgClass = 'bg-rose-50/90 hover:bg-rose-100 border-rose-200 text-rose-900 font-semibold';
              }
            }

            if (isSelected) {
              bgClass += ' ring-2 ring-indigo-500 ring-offset-2 border-indigo-500';
            }

            return (
              <button
                key={cell.dateKey}
                type="button"
                onClick={() => {
                  if (hasTrades) {
                    onSelectDate(isSelected ? '' : cell.dateKey);
                  }
                }}
                disabled={!hasTrades}
                className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between text-left transition-all relative ${bgClass} ${
                  !hasTrades ? 'opacity-35 cursor-default' : 'cursor-pointer hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold text-slate-500">
                    {cell.dayNumber}
                  </span>
                  {hasTrades && (
                    <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-white/70 text-slate-600 shadow-3xs font-mono">
                      {dayRecord.count} tr
                    </span>
                  )}
                </div>

                {hasTrades ? (
                  <div className="truncate">
                    <span className={`text-[11px] sm:text-xs font-bold block truncate font-mono ${
                      isWin ? 'text-emerald-700' : isLoss ? 'text-rose-700' : 'text-slate-600'
                    }`}>
                      {dayRecord.pnl >= 0 ? '+' : ''}${Math.round(dayRecord.pnl)}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-300">—</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center space-x-3">
          {stats.bestDay && (
            <div className="flex items-center space-x-1 text-emerald-700 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Best Day: {stats.bestDay.date.slice(5)} (+${stats.bestDay.pnl.toFixed(0)})</span>
            </div>
          )}
          {stats.worstDay && (
            <div className="flex items-center space-x-1 text-rose-700 font-bold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Worst Day: {stats.worstDay.date.slice(5)} (-${Math.abs(stats.worstDay.pnl).toFixed(0)})</span>
            </div>
          )}
        </div>

        {selectedDate && (
          <button
            type="button"
            onClick={() => onSelectDate('')}
            className="text-xs text-indigo-600 hover:underline font-bold self-start sm:self-auto cursor-pointer"
          >
            Clear Date Filter ({selectedDate})
          </button>
        )}
      </div>
    </div>
  );
};
