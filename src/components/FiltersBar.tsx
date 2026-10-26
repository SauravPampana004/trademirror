import React from 'react';
import { Search, Filter, RotateCcw, X, Clock, Layers } from 'lucide-react';
import { TradeFilter } from '../types/trade';

interface FiltersBarProps {
  filter: TradeFilter;
  onFilterChange: (newFilter: TradeFilter) => void;
  availableSymbols: string[];
  totalTradesCount: number;
  filteredTradesCount: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filter,
  onFilterChange,
  availableSymbols,
  totalTradesCount,
  filteredTradesCount
}) => {
  const isFiltered =
    filter.searchSymbol !== '' ||
    filter.outcome !== 'all' ||
    filter.side !== 'all' ||
    filter.timeSlot !== 'all';

  const resetFilters = () => {
    onFilterChange({
      searchSymbol: '',
      outcome: 'all',
      side: 'all',
      instrumentType: 'all',
      startDate: '',
      endDate: '',
      timeSlot: 'all'
    });
  };

  const handleQuickSymbolSelect = (sym: string) => {
    onFilterChange({
      ...filter,
      searchSymbol: filter.searchSymbol === sym ? '' : sym
    });
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Trade Execution Filters
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Showing <strong className="text-indigo-600">{filteredTradesCount}</strong> of {totalTradesCount} trades
          </span>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors self-start sm:self-auto cursor-pointer bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-200/60"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset all active filters
          </button>
        )}
      </div>

      {/* Quick Ticker Filter Pills */}
      {availableSymbols.length > 0 && (
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Quick Symbols:
          </span>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filter, searchSymbol: '' })}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              filter.searchSymbol === ''
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ALL
          </button>
          {availableSymbols.slice(0, 8).map((sym) => {
            const isSelected = filter.searchSymbol === sym;
            return (
              <button
                key={sym}
                type="button"
                onClick={() => handleQuickSymbolSelect(sym)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sym}
              </button>
            );
          })}
        </div>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Symbol Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search custom ticker..."
            value={filter.searchSymbol}
            onChange={(e) => onFilterChange({ ...filter, searchSymbol: e.target.value.toUpperCase() })}
            className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 uppercase font-bold"
          />
          {filter.searchSymbol && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filter, searchSymbol: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Outcome Filter */}
        <div>
          <select
            value={filter.outcome}
            onChange={(e) => onFilterChange({ ...filter, outcome: e.target.value as any })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-semibold cursor-pointer"
          >
            <option value="all">Outcome: All (Wins & Losses)</option>
            <option value="wins">Outcome: Winning Trades Only (&gt; $0)</option>
            <option value="losses">Outcome: Losing Trades Only (&lt; $0)</option>
            <option value="breakeven">Outcome: Breakeven Fills ($0)</option>
          </select>
        </div>

        {/* Side Filter */}
        <div>
          <select
            value={filter.side}
            onChange={(e) => onFilterChange({ ...filter, side: e.target.value as any })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-semibold cursor-pointer"
          >
            <option value="all">Direction: All Trades</option>
            <option value="BUY">Direction: BUY / Long Trades</option>
            <option value="SELL">Direction: SELL / Short Trades</option>
          </select>
        </div>

        {/* Session / Time of Day */}
        <div>
          <select
            value={filter.timeSlot}
            onChange={(e) => onFilterChange({ ...filter, timeSlot: e.target.value as any })}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-semibold cursor-pointer"
          >
            <option value="all">Session: All Market Hours</option>
            <option value="morning">Session: Market Open (09:30 – 11:30)</option>
            <option value="midday">Session: Midday Chop (11:30 – 14:00)</option>
            <option value="afternoon">Session: Afternoon / Close (14:00 – 16:00)</option>
            <option value="after_hours">Session: Extended / Pre-Post Market</option>
          </select>
        </div>
      </div>
    </div>
  );
};
