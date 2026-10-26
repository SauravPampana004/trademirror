import { Trade, Insight } from '../types/trade';
import { calculateMetrics } from './metricsEngine';

/**
 * Evaluates the active dataset and produces up to 3 evidence-backed,
 * mathematically sound trading pattern insights with sample size, limitations,
 * exact contributing trade IDs, and non-prescriptive actionable suggestions.
 */
export function generateInsights(trades: Trade[]): Insight[] {
  if (!trades || trades.length === 0) {
    return [];
  }

  const totalTrades = trades.length;

  // Case 1: Insufficient sample size (< 5 trades)
  if (totalTrades < 5) {
    return [
      {
        id: 'insufficient-data',
        category: 'insufficient_data',
        title: 'Insufficient Sample Size for Statistical Clustering',
        tag: 'Data Quality & Sample Size',
        sentiment: 'neutral',
        impactScore: 10,
        summary: `Current dataset contains only ${totalTrades} trade${totalTrades === 1 ? '' : 's'}. Statistically reliable pattern detection requires a larger sample to distinguish deliberate execution edge from market variance.`,
        supportingNumbers: [
          { label: 'Sample Size', value: `${totalTrades} trades`, sublabel: 'Recommended: ≥ 15' },
          { label: 'Confidence', value: 'Low', sublabel: 'Small sample vulnerability' },
          { label: 'Variance Risk', value: 'High', sublabel: 'Susceptible to single-trade outliers' }
        ],
        sampleSize: totalTrades,
        sampleSizePct: 100,
        tradeIds: trades.map(t => t.id),
        limitations: 'With fewer than 5 trades, standard deviation and win rate estimates have wide confidence intervals and high susceptibility to noise.',
        suggestedAction: 'Import or log at least 15–20 completed trades over standard market sessions before making process adjustments.'
      }
    ];
  }

  const candidates: Insight[] = [];
  const overallMetrics = calculateMetrics(trades);

  // -------------------------------------------------------------
  // PATTERN 1: Time of Day / Session Disparity
  // -------------------------------------------------------------
  const morningTrades: Trade[] = [];
  const middayTrades: Trade[] = [];
  const afternoonTrades: Trade[] = [];

  trades.forEach(t => {
    const d = new Date(t.timestamp);
    const hour = d.getHours() + d.getMinutes() / 60;
    if (hour >= 9.5 && hour < 11.5) {
      morningTrades.push(t);
    } else if (hour >= 11.5 && hour < 14.0) {
      middayTrades.push(t);
    } else if (hour >= 14.0 && hour <= 16.5) {
      afternoonTrades.push(t);
    }
  });

  if (afternoonTrades.length >= 4 && morningTrades.length >= 4) {
    const morningMetrics = calculateMetrics(morningTrades);
    const afternoonMetrics = calculateMetrics(afternoonTrades);

    // If afternoon performance is noticeably worse than morning
    if (afternoonMetrics.netPnl < morningMetrics.netPnl && afternoonMetrics.winRate < morningMetrics.winRate) {
      const pnlDiff = morningMetrics.netPnl - afternoonMetrics.netPnl;
      const winRateDiff = morningMetrics.winRate - afternoonMetrics.winRate;

      candidates.push({
        id: 'insight-session-afternoon-drag',
        category: 'timing',
        title: 'Late Session Performance Decay (14:00 – 16:00)',
        tag: 'Session Timing Bias',
        sentiment: 'warning',
        impactScore: 85 + Math.min(Math.abs(pnlDiff) / 100, 15),
        summary: `Trades executed between 14:00 and 16:00 underperformed morning sessions (09:30–11:30) by $${pnlDiff.toFixed(2)}, recording a ${winRateDiff.toFixed(1)}% lower win rate.`,
        supportingNumbers: [
          { label: 'Afternoon P&L', value: `$${afternoonMetrics.netPnl.toFixed(2)}`, sublabel: `${afternoonMetrics.winRate.toFixed(1)}% Win Rate` },
          { label: 'Morning P&L', value: `$${morningMetrics.netPnl.toFixed(2)}`, sublabel: `${morningMetrics.winRate.toFixed(1)}% Win Rate` },
          { label: 'Afternoon Sample', value: `${afternoonTrades.length} trades`, sublabel: `${((afternoonTrades.length / totalTrades) * 100).toFixed(0)}% of total volume` }
        ],
        sampleSize: afternoonTrades.length,
        sampleSizePct: Number(((afternoonTrades.length / totalTrades) * 100).toFixed(1)),
        tradeIds: afternoonTrades.map(t => t.id),
        limitations: 'Calculated over the current monthly window. Late-day macro economic releases (e.g. FOMC, bond auctions) or intraday market trend reversals may influence results independently of trader discipline.',
        suggestedAction: 'Consider establishing a strict "no new entries after 14:00" rule for the next 20 trades to observe whether net monthly expectancy improves.'
      });
    }
  }

  // -------------------------------------------------------------
  // PATTERN 2: Loss Sizing Asymmetry (Risk / Reward Execution)
  // -------------------------------------------------------------
  if (overallMetrics.losingTrades >= 3 && overallMetrics.winningTrades >= 3) {
    const absAvgLoss = Math.abs(overallMetrics.avgLosingTrade);
    const avgWin = overallMetrics.avgWinningTrade;

    // Check if average loss is noticeably larger than average win
    if (absAvgLoss > avgWin * 1.25) {
      const ratio = (absAvgLoss / avgWin).toFixed(2);
      // Identify the outsized losing trades (losses larger than 1.5x avg win)
      const outsizedLossTrades = trades.filter(t => t.pnl < 0 && Math.abs(t.pnl) >= avgWin * 1.3);

      candidates.push({
        id: 'insight-loss-sizing-asymmetry',
        category: 'risk_sizing',
        title: 'Loss Sizing Asymmetry Relative to Average Wins',
        tag: 'Risk Management & Payoff',
        sentiment: 'warning',
        impactScore: 80 + Math.min(Number(ratio) * 5, 20),
        summary: `Average losing trade ($${absAvgLoss.toFixed(2)}) is ${ratio}x larger than average winning trade ($${avgWin.toFixed(2)}), creating an asymmetric hurdle for overall profitability.`,
        supportingNumbers: [
          { label: 'Avg Losing Trade', value: `-$${absAvgLoss.toFixed(2)}`, sublabel: `${overallMetrics.losingTrades} losing trades` },
          { label: 'Avg Winning Trade', value: `+$${avgWin.toFixed(2)}`, sublabel: `${overallMetrics.winningTrades} winning trades` },
          { label: 'Payoff Ratio', value: `${(avgWin / absAvgLoss).toFixed(2)}:1`, sublabel: 'Target benchmark ≥ 1.0:1' }
        ],
        sampleSize: overallMetrics.losingTrades,
        sampleSizePct: Number(((overallMetrics.losingTrades / totalTrades) * 100).toFixed(1)),
        tradeIds: (outsizedLossTrades.length > 0 ? outsizedLossTrades : trades.filter(t => t.pnl < 0)).map(t => t.id),
        limitations: 'Does not infer emotional or psychological intent from P&L alone. Market gaps, slippage in illiquid hours, or volatility spikes can amplify loss sizing.',
        suggestedAction: 'Review pre-trade risk brackets and verify whether trailing stops or fixed dollar stop-losses are being consistently executed at planned levels.'
      });
    } else if (avgWin > absAvgLoss * 1.25) {
      // Positive risk/reward pattern!
      const ratio = (avgWin / absAvgLoss).toFixed(2);
      const winningTrades = trades.filter(t => t.pnl > 0);

      candidates.push({
        id: 'insight-positive-asymmetry',
        category: 'risk_sizing',
        title: 'Favorable Risk/Reward Asymmetry (Avg Win > Avg Loss)',
        tag: 'Edge Preservation',
        sentiment: 'positive',
        impactScore: 78,
        summary: `Average winning trade ($${avgWin.toFixed(2)}) is ${ratio}x your average loss ($${absAvgLoss.toFixed(2)}), allowing the portfolio to maintain positive expectancy even through drawdowns.`,
        supportingNumbers: [
          { label: 'Avg Winning Trade', value: `+$${avgWin.toFixed(2)}`, sublabel: 'Strong upside capture' },
          { label: 'Avg Losing Trade', value: `-$${absAvgLoss.toFixed(2)}`, sublabel: 'Controlled downside' },
          { label: 'Payoff Ratio', value: `${ratio}:1`, sublabel: 'Favorable asymmetry' }
        ],
        sampleSize: winningTrades.length,
        sampleSizePct: Number(((winningTrades.length / totalTrades) * 100).toFixed(1)),
        tradeIds: winningTrades.map(t => t.id),
        limitations: 'Favorable payoff ratios can contract quickly if market volatility regime shifts or if profit targets are widened during consolidation.',
        suggestedAction: 'Maintain current take-profit mechanics and avoid narrowing profit targets in trending market phases.'
      });
    }
  }

  // -------------------------------------------------------------
  // PATTERN 3: Instrument Performance Disparity
  // -------------------------------------------------------------
  const symbolMap = new Map<string, Trade[]>();
  trades.forEach(t => {
    const list = symbolMap.get(t.symbol) || [];
    list.push(t);
    symbolMap.set(t.symbol, list);
  });

  const symbolMetricsList: Array<{ symbol: string; trades: Trade[]; netPnl: number; winRate: number }> = [];
  symbolMap.forEach((symTrades, sym) => {
    if (symTrades.length >= 3) {
      const m = calculateMetrics(symTrades);
      symbolMetricsList.push({
        symbol: sym,
        trades: symTrades,
        netPnl: m.netPnl,
        winRate: m.winRate
      });
    }
  });

  if (symbolMetricsList.length >= 2) {
    symbolMetricsList.sort((a, b) => b.netPnl - a.netPnl);
    const topSymbol = symbolMetricsList[0];
    const bottomSymbol = symbolMetricsList[symbolMetricsList.length - 1];

    if (topSymbol.netPnl > 0 && bottomSymbol.netPnl < 0) {
      candidates.push({
        id: 'insight-instrument-concentration',
        category: 'instrument',
        title: `Instrument Edge Disparity (${topSymbol.symbol} vs ${bottomSymbol.symbol})`,
        tag: 'Instrument Specialization',
        sentiment: 'warning',
        impactScore: 82 + Math.min(Math.abs(bottomSymbol.netPnl) / 100, 15),
        summary: `Strong positive edge in ${topSymbol.symbol} (+$${topSymbol.netPnl.toFixed(2)}, ${topSymbol.winRate.toFixed(1)}% win rate across ${topSymbol.trades.length} trades) was substantially offset by net losses in ${bottomSymbol.symbol} (-$${Math.abs(bottomSymbol.netPnl).toFixed(2)} across ${bottomSymbol.trades.length} trades).`,
        supportingNumbers: [
          { label: `${topSymbol.symbol} P&L`, value: `+$${topSymbol.netPnl.toFixed(2)}`, sublabel: `${topSymbol.winRate.toFixed(1)}% Win Rate (${topSymbol.trades.length} tr)` },
          { label: `${bottomSymbol.symbol} P&L`, value: `-$${Math.abs(bottomSymbol.netPnl).toFixed(2)}`, sublabel: `${bottomSymbol.winRate.toFixed(1)}% Win Rate (${bottomSymbol.trades.length} tr)` },
          { label: 'Net Drag', value: `$${(topSymbol.netPnl + bottomSymbol.netPnl).toFixed(2)}`, sublabel: 'Combined balance' }
        ],
        sampleSize: bottomSymbol.trades.length + topSymbol.trades.length,
        sampleSizePct: Number((((bottomSymbol.trades.length + topSymbol.trades.length) / totalTrades) * 100).toFixed(1)),
        tradeIds: [...bottomSymbol.trades.map(t => t.id), ...topSymbol.trades.map(t => t.id)],
        limitations: `Limited monthly sampling (${bottomSymbol.trades.length} trades in ${bottomSymbol.symbol}) means idiosyncratic earnings announcements or sector rotations may account for the divergence rather than ticker incompatibility.`,
        suggestedAction: `Consider lowering position size or requiring stricter technical confirmation before executing trades in ${bottomSymbol.symbol}.`
      });
    }
  }

  // -------------------------------------------------------------
  // PATTERN 4: Directional Side Bias (Long vs Short)
  // -------------------------------------------------------------
  const buyTrades = trades.filter(t => t.side === 'BUY');
  const sellTrades = trades.filter(t => t.side === 'SELL');

  if (buyTrades.length >= 4 && sellTrades.length >= 4) {
    const buyMetrics = calculateMetrics(buyTrades);
    const sellMetrics = calculateMetrics(sellTrades);
    const winRateSpread = Math.abs(buyMetrics.winRate - sellMetrics.winRate);

    if (winRateSpread >= 25) {
      const favoredSide = buyMetrics.winRate > sellMetrics.winRate ? 'BUY (Long)' : 'SELL (Short)';
      const unfavoredSide = buyMetrics.winRate > sellMetrics.winRate ? 'SELL (Short)' : 'BUY (Long)';
      const unfavoredTrades = buyMetrics.winRate > sellMetrics.winRate ? sellTrades : buyTrades;
      const favoredMetrics = buyMetrics.winRate > sellMetrics.winRate ? buyMetrics : sellMetrics;
      const unfavoredMetrics = buyMetrics.winRate > sellMetrics.winRate ? sellMetrics : buyMetrics;

      candidates.push({
        id: 'insight-side-bias',
        category: 'side_bias',
        title: `Directional Asymmetry: ${favoredSide} Outperforming ${unfavoredSide}`,
        tag: 'Directional Bias',
        sentiment: unfavoredMetrics.netPnl < 0 ? 'warning' : 'neutral',
        impactScore: 75 + winRateSpread * 0.4,
        summary: `${favoredSide} positions achieved a ${favoredMetrics.winRate.toFixed(1)}% win rate ($${favoredMetrics.netPnl.toFixed(2)} P&L), whereas ${unfavoredSide} trades posted only ${unfavoredMetrics.winRate.toFixed(1)}% ($${unfavoredMetrics.netPnl.toFixed(2)} P&L).`,
        supportingNumbers: [
          { label: `${favoredSide} Win Rate`, value: `${favoredMetrics.winRate.toFixed(1)}%`, sublabel: `$${favoredMetrics.netPnl.toFixed(2)} net` },
          { label: `${unfavoredSide} Win Rate`, value: `${unfavoredMetrics.winRate.toFixed(1)}%`, sublabel: `$${unfavoredMetrics.netPnl.toFixed(2)} net` },
          { label: 'Sample Spread', value: `${winRateSpread.toFixed(1)}%`, sublabel: 'Execution disparity' }
        ],
        sampleSize: unfavoredTrades.length,
        sampleSizePct: Number(((unfavoredTrades.length / totalTrades) * 100).toFixed(1)),
        tradeIds: unfavoredTrades.map(t => t.id),
        limitations: 'Directional performance is strongly correlated with underlying index trend direction during the recorded period.',
        suggestedAction: `Audit short-side setups to confirm whether market trend alignment filters are being applied before taking countertrend positions.`
      });
    }
  }

  // -------------------------------------------------------------
  // PATTERN 5: Fee & Commission Friction
  // -------------------------------------------------------------
  if (overallMetrics.grossProfit > 0 && overallMetrics.totalFees > 0) {
    const feeImpactPct = (overallMetrics.totalFees / overallMetrics.grossProfit) * 100;
    if (feeImpactPct >= 10) {
      candidates.push({
        id: 'insight-fee-friction',
        category: 'risk_sizing',
        title: 'Fee and Slippage Drag on Gross Earnings',
        tag: 'Cost Structure',
        sentiment: feeImpactPct >= 20 ? 'warning' : 'neutral',
        impactScore: 70 + Math.min(feeImpactPct, 20),
        summary: `Brokerage fees and exchange commissions totaled $${overallMetrics.totalFees.toFixed(2)}, consuming ${feeImpactPct.toFixed(1)}% of gross realized profits ($${overallMetrics.grossProfit.toFixed(2)}).`,
        supportingNumbers: [
          { label: 'Total Fees Paid', value: `$${overallMetrics.totalFees.toFixed(2)}`, sublabel: `${feeImpactPct.toFixed(1)}% of gross profit` },
          { label: 'Avg Fee / Trade', value: `$${(overallMetrics.totalFees / totalTrades).toFixed(2)}`, sublabel: `${totalTrades} total trades` },
          { label: 'Net Retention', value: `${(100 - feeImpactPct).toFixed(1)}%`, sublabel: 'Realized edge retained' }
        ],
        sampleSize: totalTrades,
        sampleSizePct: 100,
        tradeIds: trades.map(t => t.id),
        limitations: 'Fee rates depend on broker fee tiers, contract multipliers, and exchange routing choices.',
        suggestedAction: 'Review trade frequency on small target gains where fixed ticket fees disproportionately lower net expectancy.'
      });
    }
  }

  // -------------------------------------------------------------
  // Fallback: If fewer than 1 candidate emerged (e.g. all-winning or all-losing)
  // -------------------------------------------------------------
  if (candidates.length === 0) {
    if (overallMetrics.winRate === 100) {
      candidates.push({
        id: 'insight-all-winning',
        category: 'risk_sizing',
        title: 'Uninterrupted Winning Streak (Zero Realized Losses)',
        tag: 'Streak Distribution',
        sentiment: 'positive',
        impactScore: 90,
        summary: `All ${totalTrades} trades in the selected dataset were closed profitably, resulting in an infinite profit factor and $${overallMetrics.netPnl.toFixed(2)} net P&L.`,
        supportingNumbers: [
          { label: 'Win Rate', value: '100.0%', sublabel: 'Zero realized losses' },
          { label: 'Net P&L', value: `+$${overallMetrics.netPnl.toFixed(2)}`, sublabel: 'Consistent upside' },
          { label: 'Avg Win', value: `+$${overallMetrics.avgWinningTrade.toFixed(2)}`, sublabel: `${totalTrades} trades` }
        ],
        sampleSize: totalTrades,
        sampleSizePct: 100,
        tradeIds: trades.map(t => t.id),
        limitations: '100% win rates are statistical anomalies over extended horizons. Without observing losing trade execution, maximum drawdown tolerance cannot yet be quantified.',
        suggestedAction: 'Document the exact setup criteria used during this streak to test whether edge persists under varying market regimes.'
      });
    } else if (overallMetrics.winRate === 0) {
      candidates.push({
        id: 'insight-all-losing',
        category: 'risk_sizing',
        title: 'Consecutive Drawdown Cluster (Zero Winning Trades)',
        tag: 'Drawdown Cluster',
        sentiment: 'warning',
        impactScore: 95,
        summary: `The dataset recorded 0 winning trades across ${totalTrades} executions, resulting in a -$${Math.abs(overallMetrics.netPnl).toFixed(2)} drawdown.`,
        supportingNumbers: [
          { label: 'Win Rate', value: '0.0%', sublabel: '0 winning trades' },
          { label: 'Net Drawdown', value: `-$${Math.abs(overallMetrics.netPnl).toFixed(2)}`, sublabel: 'Total capital drag' },
          { label: 'Avg Loss', value: `-$${Math.abs(overallMetrics.avgLosingTrade).toFixed(2)}`, sublabel: `${totalTrades} trades` }
        ],
        sampleSize: totalTrades,
        sampleSizePct: 100,
        tradeIds: trades.map(t => t.id),
        limitations: 'Small losing streaks may be caused by adverse regime change (e.g. sharp trend change while trading mean-reversion) rather than flawed core strategy.',
        suggestedAction: 'Pause live trading temporarily and paper-trade the next 10 executions to isolate whether entry criteria or market conditions are causing the drawdown.'
      });
    }
  }

  // Sort by impact score and take top 3
  candidates.sort((a, b) => b.impactScore - a.impactScore);
  return candidates.slice(0, 3);
}
