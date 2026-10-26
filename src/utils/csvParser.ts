import Papa from 'papaparse';
import { Trade, DataQualityIssue, ParseResult, TradeSide, InstrumentType } from '../types/trade';

// Helper to normalize header names
function cleanHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Clean and parse currency/number strings
export function parseCleanNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;

  let str = String(val).trim();
  // Check for accounting negative format: (123.45)
  const isAccountingNegative = /^\(.*\)$/.test(str);
  str = str.replace(/[()$,€₹£¥]/g, '').trim();

  // Remove commas used as thousands separators
  str = str.replace(/,/g, '');

  const num = parseFloat(str);
  if (isNaN(num)) return fallback;
  return isAccountingNegative ? -num : num;
}

// Infer instrument type from symbol
function inferInstrumentType(symbol: string): InstrumentType {
  const sym = symbol.toUpperCase();
  if (sym.includes('USDT') || sym.includes('BTC') || sym.includes('ETH')) return 'CRYPTO';
  if (sym.includes('CALL') || sym.includes('PUT') || /\d{6}[CP]\d+/.test(sym)) return 'OPTION';
  if (sym.startsWith('/') || sym.endsWith('=F')) return 'FUTURES';
  if (sym.includes('/') && sym.length <= 7) return 'FOREX';
  return 'EQUITY';
}

export function parseTradingCsv(csvContent: string): ParseResult {
  const issues: DataQualityIssue[] = [];
  const trades: Trade[] = [];
  const currenciesSet = new Set<string>();

  if (!csvContent || !csvContent.trim()) {
    issues.push({
      id: 'empty-file',
      type: 'error',
      title: 'Empty File',
      description: 'The uploaded file does not contain any readable CSV content.'
    });
    return { trades: [], issues, currencies: [], totalRawRows: 0, skippedRows: 0 };
  }

  const parsed = Papa.parse<Record<string, any>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false
  });

  if (parsed.errors && parsed.errors.length > 0) {
    const errorMessages = parsed.errors.slice(0, 3).map(e => `Row ${e.row ?? '?'}: ${e.message}`).join('; ');
    issues.push({
      id: 'csv-syntax-warning',
      type: 'warning',
      title: 'CSV Formatting Anomalies',
      description: `Parser detected formatting warnings: ${errorMessages}`
    });
  }

  const rawRows = parsed.data;
  if (!rawRows || rawRows.length === 0) {
    issues.push({
      id: 'no-rows',
      type: 'error',
      title: 'No Data Rows Found',
      description: 'The file contains a header or empty rows, but no trade records.'
    });
    return { trades: [], issues, currencies: [], totalRawRows: 0, skippedRows: 0 };
  }

  // Find column mapping by examining keys in the first row
  const firstRowKeys = Object.keys(rawRows[0] || {});
  const headerMap: Record<string, string> = {};

  firstRowKeys.forEach(originalKey => {
    const cleaned = cleanHeader(originalKey);
    headerMap[cleaned] = originalKey;
  });

  // Candidate column matchers
  const getCol = (candidates: string[]): string | undefined => {
    for (const c of candidates) {
      if (headerMap[c]) return headerMap[c];
    }
    // Partial substring match if exact not found
    for (const c of candidates) {
      const match = Object.keys(headerMap).find(k => k.includes(c));
      if (match) return headerMap[match];
    }
    return undefined;
  };

  const colDate = getCol(['date', 'datetime', 'time', 'timestamp', 'tradedate', 'filltime', 'executedat']);
  const colTime = getCol(['time', 'tradetime']);
  const colSymbol = getCol(['symbol', 'ticker', 'instrument', 'asset', 'contract', 'name']);
  const colSide = getCol(['side', 'action', 'type', 'buysell', 'direction', 'bs']);
  const colQty = getCol(['quantity', 'qty', 'shares', 'size', 'contracts', 'volume', 'lots']);
  const colPrice = getCol(['entryprice', 'price', 'fillprice', 'avgprice', 'buyprice', 'costprice']);
  const colExitPrice = getCol(['exitprice', 'closeprice', 'sellprice']);
  const colPnl = getCol(['pnl', 'netpnl', 'realizedpnl', 'profit', 'gainloss', 'return', 'netprofit']);
  const colGrossPnl = getCol(['grosspnl', 'grossprofit']);
  const colFees = getCol(['fees', 'fee', 'commission', 'commissions', 'charges', 'brokerage']);
  const colCurrency = getCol(['currency', 'ccy']);
  const colNotes = getCol(['notes', 'comments', 'remarks', 'strategy']);

  if (!colDate && !colSymbol && !colPnl) {
    issues.push({
      id: 'missing-headers',
      type: 'error',
      title: 'Unrecognized CSV Header Format',
      description: 'Could not detect required columns (Date, Symbol/Ticker, P&L). Please verify the CSV header row conforms to standard trading exports.'
    });
    return { trades: [], issues, currencies: [], totalRawRows: rawRows.length, skippedRows: rawRows.length };
  }

  // Row inspection and parsing
  const seenSignatures = new Set<string>();
  let duplicateCount = 0;
  const duplicateRows: number[] = [];
  const missingFieldRows: number[] = [];
  let skippedRows = 0;

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // header is row 1
    const rawDate = colDate ? String(row[colDate] || '').trim() : '';
    const rawTime = (colTime && colTime !== colDate) ? String(row[colTime] || '').trim() : '';
    const rawSymbol = colSymbol ? String(row[colSymbol] || '').trim().toUpperCase() : '';
    const rawPnl = colPnl ? row[colPnl] : undefined;

    // Check mandatory fields
    if (!rawSymbol || rawPnl === undefined || rawPnl === null || rawPnl === '') {
      missingFieldRows.push(rowNum);
      skippedRows++;
      return;
    }

    // Parse date & timestamp
    let dateTimeStr = rawDate;
    if (rawTime && !rawDate.includes(':')) {
      dateTimeStr = `${rawDate} ${rawTime}`;
    }

    let parsedDate = new Date(dateTimeStr);
    if (isNaN(parsedDate.getTime())) {
      // Try replacing slashes with dashes or parsing date part
      parsedDate = new Date(dateTimeStr.replace(/\//g, '-'));
    }
    // Fallback if still invalid
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date(); // fallback to current date with warning
    }

    const timestamp = parsedDate.getTime();
    const isoDate = parsedDate.toISOString();

    // Side
    let side: TradeSide = 'BUY';
    if (colSide) {
      const sideRaw = String(row[colSide] || '').toUpperCase();
      if (sideRaw.includes('SELL') || sideRaw === 'S' || sideRaw === 'SHORT') {
        side = 'SELL';
      }
    }

    const quantity = Math.abs(parseCleanNumber(colQty ? row[colQty] : 1, 1));
    const entryPrice = parseCleanNumber(colPrice ? row[colPrice] : 0, 0);
    const exitPrice = parseCleanNumber(colExitPrice ? row[colExitPrice] : entryPrice, entryPrice);
    const pnl = parseCleanNumber(rawPnl, 0);
    const fees = Math.abs(parseCleanNumber(colFees ? row[colFees] : 0, 0));
    const grossPnl = colGrossPnl ? parseCleanNumber(row[colGrossPnl], pnl + fees) : (pnl + fees);
    const currency = colCurrency ? String(row[colCurrency] || 'USD').trim().toUpperCase() : 'USD';
    const notes = colNotes ? String(row[colNotes] || '').trim() : undefined;

    currenciesSet.add(currency);

    // Duplicate detection signature
    const signature = `${parsedDate.toISOString().slice(0, 16)}|${rawSymbol}|${side}|${quantity}|${entryPrice}|${pnl}`;
    if (seenSignatures.has(signature)) {
      duplicateCount++;
      duplicateRows.push(rowNum);
    } else {
      seenSignatures.add(signature);
    }

    trades.push({
      id: `TRD-IMP-${String(trades.length + 1).padStart(4, '0')}`,
      date: isoDate,
      timestamp,
      symbol: rawSymbol,
      side,
      quantity,
      entryPrice,
      exitPrice,
      pnl,
      grossPnl,
      fees,
      currency,
      durationMinutes: 30,
      instrumentType: inferInstrumentType(rawSymbol),
      rawRowIndex: rowNum,
      notes
    });
  });

  // Generate validation issues
  if (duplicateCount > 0) {
    issues.push({
      id: 'duplicate-records',
      type: 'warning',
      title: 'Potential Duplicate Trades Detected',
      description: `Detected ${duplicateCount} trade record${duplicateCount > 1 ? 's' : ''} sharing identical timestamp, symbol, side, quantity, and P&L. They have been preserved for audit accuracy.`,
      affectedRowCount: duplicateCount,
      sampleRows: duplicateRows.slice(0, 5)
    });
  }

  if (missingFieldRows.length > 0) {
    issues.push({
      id: 'missing-fields',
      type: 'warning',
      title: 'Incomplete Rows Skipped',
      description: `Skipped ${missingFieldRows.length} row${missingFieldRows.length > 1 ? 's' : ''} missing required Symbol or P&L values.`,
      affectedRowCount: missingFieldRows.length,
      sampleRows: missingFieldRows.slice(0, 5)
    });
  }

  const currencies = Array.from(currenciesSet);
  if (currencies.length > 1) {
    issues.push({
      id: 'mixed-currencies',
      type: 'warning',
      title: 'Mixed Currencies Detected',
      description: `Your CSV contains trades denominated in multiple currencies (${currencies.join(', ')}). Calculations are aggregated directly without foreign exchange conversion rates applied.`,
      affectedRowCount: trades.length
    });
  }

  if (trades.length === 0) {
    issues.push({
      id: 'zero-trades-parsed',
      type: 'error',
      title: 'No Valid Trades Extracted',
      description: 'Could not extract valid trade rows from the provided file.'
    });
  }

  return {
    trades,
    issues,
    currencies,
    totalRawRows: rawRows.length,
    skippedRows
  };
}

/**
 * Generates sample CSV string for users to download as a template
 */
export function generateSampleCsvContent(trades: Trade[]): string {
  const headers = ['Date', 'Symbol', 'Side', 'Quantity', 'EntryPrice', 'ExitPrice', 'RealizedPnL', 'Fees', 'Currency', 'Notes'];
  const rows = trades.map(t => [
    t.date,
    t.symbol,
    t.side,
    t.quantity,
    t.entryPrice.toFixed(2),
    t.exitPrice.toFixed(2),
    t.pnl.toFixed(2),
    t.fees.toFixed(2),
    t.currency,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
