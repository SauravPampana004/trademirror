import React, { useState, useMemo } from 'react';
import { Download, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Trade } from '../types/trade';
import { exportTradesToCsv } from '../utils/exportUtils';

interface TradeHistoryTableProps {
  trades: Trade[];
}

type SortField = 'date' | 'symbol' | 'side' | 'quantity' | 'entryPrice' | 'pnl' | 'fees';
type SortDirection = 'asc' | 'desc';

export const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({ trades }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'side':
          comparison = a.side.localeCompare(b.side);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'entryPrice':
          comparison = a.entryPrice - b.entryPrice;
          break;
        case 'pnl':
          comparison = a.pnl - b.pnl;
          break;
        case 'fees':
          comparison = (a.fees || 0) - (b.fees || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [trades, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(Math.ceil(sortedTrades.length / pageSize), 1);
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedTrades.slice(startIndex, startIndex + pageSize);
  }, [sortedTrades, currentPage, pageSize]);

  const handleExport = () => {
    exportTradesToCsv(sortedTrades, 'trademirror-filtered-history.csv');
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 inline ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 inline ml-1" />
    );
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/50">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Trade Execution Audit History
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            {trades.length} trade records in active dataset
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Page size dropdown */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shadow-3xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px]">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Date & Time {renderSortIndicator('date')}
              </th>
              <th
                onClick={() => handleSort('symbol')}
                className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Symbol {renderSortIndicator('symbol')}
              </th>
              <th
                onClick={() => handleSort('side')}
                className="px-4 py-3 font-bold cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Side {renderSortIndicator('side')}
              </th>
              <th
                onClick={() => handleSort('quantity')}
                className="px-4 py-3 font-bold text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Qty {renderSortIndicator('quantity')}
              </th>
              <th
                onClick={() => handleSort('entryPrice')}
                className="px-4 py-3 font-bold text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Entry {renderSortIndicator('entryPrice')}
              </th>
              <th className="px-4 py-3 font-bold text-right">
                Exit
              </th>
              <th
                onClick={() => handleSort('pnl')}
                className="px-4 py-3 font-bold text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Net P&L {renderSortIndicator('pnl')}
              </th>
              <th
                onClick={() => handleSort('fees')}
                className="px-4 py-3 font-bold text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                Fees {renderSortIndicator('fees')}
              </th>
              <th className="px-4 py-3 font-bold">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedTrades.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-xs font-medium">
                  No trades match the current filter criteria.
                </td>
              </tr>
            ) : (
              paginatedTrades.map((t) => {
                const isWin = t.pnl > 0.0001;
                const isLoss = t.pnl < -0.0001;
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-700">
                      {t.date.replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="px-4 py-2.5 font-black text-slate-900">
                      {t.symbol}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.side === 'BUY'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {t.side}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-800 font-mono">
                      {t.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700 font-mono">
                      ${t.entryPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700 font-mono">
                      ${t.exitPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-extrabold font-mono">
                      <span className={`inline-flex items-center space-x-0.5 ${
                        isWin ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-600'
                      }`}>
                        {isWin && <TrendingUp className="w-3.5 h-3.5 inline mr-0.5" />}
                        {isLoss && <TrendingDown className="w-3.5 h-3.5 inline mr-0.5" />}
                        <span>{t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600 font-mono">
                      ${(t.fees || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-[11px] max-w-[200px] truncate" title={t.notes || ''}>
                      {t.notes || '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing{' '}
          <span className="font-bold text-slate-900">
            {sortedTrades.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-bold text-slate-900">
            {Math.min(currentPage * pageSize, sortedTrades.length)}
          </span>{' '}
          of <span className="font-bold text-slate-900">{sortedTrades.length}</span> entries
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 py-0.5 font-bold text-slate-800">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
