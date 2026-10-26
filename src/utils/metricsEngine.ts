import { Trade, TradeMetrics } from '../types/trade';

/**
 * Calculates core trading performance metrics from a set of trades.
 * Pure mathematical implementation handling edge cases (0 trades, 0 losses, 0 wins).
 */
export function calculateMetrics(trades: Trade[]): TradeMetrics {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      lossRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      netPnl: 0,
      totalFees: 0,
      avgWinningTrade: 0,
      avgLosingTrade: 0,
      profitFactor: null,
      payoffRatio: null,
      largestWin: 0,
      largestLoss: 0,
      maxDrawdown: 0,
      maxDrawdownPct: 0,
      expectancy: 0,
      dailyPnlDistribution: [],
      cumulativePnlCurve: []
    };
  }

  // Sort chronologically by timestamp
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;

  let grossProfit = 0;
  let grossLoss = 0; // accumulated as positive sum of losses
  let totalFees = 0;
  let netPnl = 0;

  let largestWin = 0;
  let largestLoss = 0; // negative or 0

  sorted.forEach(t => {
    const tradeNetPnl = t.pnl; // trade net P&L
    netPnl += tradeNetPnl;
    totalFees += (t.fees || 0);

    if (tradeNetPnl > 0.0001) {
      winningTrades++;
      grossProfit += tradeNetPnl;
      if (tradeNetPnl > largestWin) largestWin = tradeNetPnl;
    } else if (tradeNetPnl < -0.0001) {
      losingTrades++;
      const absLoss = Math.abs(tradeNetPnl);
      grossLoss += absLoss;
      if (tradeNetPnl < largestLoss) largestLoss = tradeNetPnl;
    } else {
      breakevenTrades++;
    }
  });

  const totalTrades = sorted.length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (losingTrades / totalTrades) * 100 : 0;

  const avgWinningTrade = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLosingTrade = losingTrades > 0 ? -(grossLoss / losingTrades) : 0;

  // Profit Factor = Gross Profit / Gross Loss
  // If no losses, profit factor is null (represented as Infinity / No Losses)
  let profitFactor: number | null = null;
  if (grossLoss > 0.0001) {
    profitFactor = Number((grossProfit / grossLoss).toFixed(2));
  } else if (grossProfit > 0) {
    profitFactor = null; // Infinite
  } else {
    profitFactor = 0;
  }

  // Payoff Ratio = Avg Win / abs(Avg Loss)
  let payoffRatio: number | null = null;
  if (avgLosingTrade < -0.0001 && avgWinningTrade > 0) {
    payoffRatio = Number((avgWinningTrade / Math.abs(avgLosingTrade)).toFixed(2));
  }

  const expectancy = totalTrades > 0 ? netPnl / totalTrades : 0;

  // Cumulative P&L curve & Drawdown
  let runningPnl = 0;
  let peakPnl = 0;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;

  const cumulativePnlCurve = sorted.map((t) => {
    runningPnl += t.pnl;
    if (runningPnl > peakPnl) {
      peakPnl = runningPnl;
    }
    const currentDrawdown = peakPnl - runningPnl; // positive drawdown amount
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
      if (peakPnl > 0) {
        maxDrawdownPct = (maxDrawdown / peakPnl) * 100;
      }
    }

    return {
      date: t.date.slice(0, 10),
      timestamp: t.timestamp,
      tradePnl: t.pnl,
      cumulativePnl: Number(runningPnl.toFixed(2)),
      drawdown: Number((-currentDrawdown).toFixed(2)),
      symbol: t.symbol
    };
  });

  // Daily aggregated distribution
  const dailyMap = new Map<string, { pnl: number; count: number }>();
  sorted.forEach(t => {
    const day = t.date.slice(0, 10);
    const existing = dailyMap.get(day) || { pnl: 0, count: 0 };
    dailyMap.set(day, {
      pnl: existing.pnl + t.pnl,
      count: existing.count + 1
    });
  });

  const dailyPnlDistribution = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      pnl: Number(data.pnl.toFixed(2)),
      tradesCount: data.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate: Number(winRate.toFixed(1)),
    lossRate: Number(lossRate.toFixed(1)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    netPnl: Number(netPnl.toFixed(2)),
    totalFees: Number(totalFees.toFixed(2)),
    avgWinningTrade: Number(avgWinningTrade.toFixed(2)),
    avgLosingTrade: Number(avgLosingTrade.toFixed(2)),
    profitFactor,
    payoffRatio,
    largestWin: Number(largestWin.toFixed(2)),
    largestLoss: Number(largestLoss.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(1)),
    expectancy: Number(expectancy.toFixed(2)),
    dailyPnlDistribution,
    cumulativePnlCurve
  };
}

/**
 * Breakdown trades by instrument / symbol
 */
export interface InstrumentPerformance {
  symbol: string;
  tradesCount: number;
  netPnl: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number | null;
  avgPnl: number;
}

export function calculateInstrumentPerformance(trades: Trade[]): InstrumentPerformance[] {
  const map = new Map<string, Trade[]>();
  trades.forEach(t => {
    const list = map.get(t.symbol) || [];
    list.push(t);
    map.set(t.symbol, list);
  });

  const results: InstrumentPerformance[] = [];
  map.forEach((symbolTrades, symbol) => {
    const metrics = calculateMetrics(symbolTrades);
    results.push({
      symbol,
      tradesCount: symbolTrades.length,
      netPnl: metrics.netPnl,
      winRate: metrics.winRate,
      grossProfit: metrics.grossProfit,
      grossLoss: metrics.grossLoss,
      profitFactor: metrics.profitFactor,
      avgPnl: metrics.expectancy
    });
  });

  return results.sort((a, b) => b.netPnl - a.netPnl);
}

/**
 * Time of day breakdown (Morning, Midday, Afternoon/Close, After Hours)
 */
export interface SessionPerformance {
  sessionKey: 'morning' | 'midday' | 'afternoon' | 'after_hours';
  label: string;
  timeRange: string;
  tradesCount: number;
  netPnl: number;
  winRate: number;
  profitFactor: number | null;
}

export function calculateSessionPerformance(trades: Trade[]): SessionPerformance[] {
  const sessions: Record<string, Trade[]> = {
    morning: [],
    midday: [],
    afternoon: [],
    after_hours: []
  };

  trades.forEach(t => {
    const dateObj = new Date(t.timestamp);
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();
    const timeValue = hour + minute / 60;

    if (timeValue >= 9.5 && timeValue < 11.5) {
      sessions.morning.push(t);
    } else if (timeValue >= 11.5 && timeValue < 14.0) {
      sessions.midday.push(t);
    } else if (timeValue >= 14.0 && timeValue <= 16.0) {
      sessions.afternoon.push(t);
    } else {
      sessions.after_hours.push(t);
    }
  });

  const sessionConfigs: Array<{
    key: 'morning' | 'midday' | 'afternoon' | 'after_hours';
    label: string;
    range: string;
  }> = [
    { key: 'morning', label: 'Market Open', range: '09:30 – 11:30' },
    { key: 'midday', label: 'Midday Chop', range: '11:30 – 14:00' },
    { key: 'afternoon', label: 'Afternoon / Close', range: '14:00 – 16:00' },
    { key: 'after_hours', label: 'Extended Hours', range: 'Pre/Post Market' }
  ];

  return sessionConfigs.map(cfg => {
    const sessionTrades = sessions[cfg.key];
    const metrics = calculateMetrics(sessionTrades);
    return {
      sessionKey: cfg.key,
      label: cfg.label,
      timeRange: cfg.range,
      tradesCount: sessionTrades.length,
      netPnl: metrics.netPnl,
      winRate: metrics.winRate,
      profitFactor: metrics.profitFactor
    };
  });
}
