export type TradeSide = 'BUY' | 'SELL';

export type InstrumentType = 'EQUITY' | 'OPTION' | 'FUTURES' | 'CRYPTO' | 'FOREX';

export interface Trade {
  id: string;
  date: string; // ISO string or standardized YYYY-MM-DD HH:mm:ss
  timestamp: number; // epoch ms for accurate sorting & time math
  symbol: string;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number; // Net P&L or realized P&L
  grossPnl: number;
  fees: number;
  currency: string;
  durationMinutes?: number;
  instrumentType?: InstrumentType;
  rawRowIndex?: number;
  notes?: string;
}

export interface TradeMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // percentage, e.g. 62.5
  lossRate: number; // percentage
  grossProfit: number;
  grossLoss: number; // positive number representing total losses
  netPnl: number;
  totalFees: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  profitFactor: number | null; // null if grossLoss === 0 or totalTrades === 0
  payoffRatio: number | null; // avgWinningTrade / avgLosingTrade
  largestWin: number;
  largestLoss: number; // negative number
  maxDrawdown: number;
  maxDrawdownPct: number;
  expectancy: number; // average P&L per trade
  dailyPnlDistribution: { date: string; pnl: number; tradesCount: number }[];
  cumulativePnlCurve: { date: string; timestamp: number; tradePnl: number; cumulativePnl: number; drawdown: number; symbol: string }[];
}

export type InsightCategory = 
  | 'timing' 
  | 'instrument' 
  | 'risk_sizing' 
  | 'holding_time' 
  | 'day_of_week'
  | 'side_bias'
  | 'insufficient_data';

export interface Insight {
  id: string;
  category: InsightCategory;
  title: string;
  tag: string;
  sentiment: 'positive' | 'negative' | 'warning' | 'neutral';
  impactScore: number;
  summary: string;
  supportingNumbers: {
    label: string;
    value: string;
    sublabel?: string;
  }[];
  sampleSize: number;
  sampleSizePct: number;
  tradeIds: string[];
  limitations: string;
  suggestedAction: string;
}

export interface DataQualityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  affectedRowCount?: number;
  sampleRows?: number[];
}

export interface ParseResult {
  trades: Trade[];
  issues: DataQualityIssue[];
  currencies: string[];
  totalRawRows: number;
  skippedRows: number;
}

export interface TradeFilter {
  searchSymbol: string;
  outcome: 'all' | 'wins' | 'losses' | 'breakeven';
  side: 'all' | 'BUY' | 'SELL';
  instrumentType: string;
  startDate: string;
  endDate: string;
  timeSlot: 'all' | 'morning' | 'midday' | 'afternoon' | 'after_hours';
}
