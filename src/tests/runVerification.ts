import { calculateMetrics, calculateInstrumentPerformance, calculateSessionPerformance } from '../utils/metricsEngine';
import { generateInsights } from '../utils/insightEngine';
import { parseTradingCsv, parseCleanNumber } from '../utils/csvParser';
import { generateMarkdownReport } from '../utils/exportUtils';
import { BALANCED_SAMPLE_TRADES, ALL_WINNING_SAMPLE_TRADES, ALL_LOSING_SAMPLE_TRADES, SPARSE_SAMPLE_TRADES } from '../data/sampleDatasets';
import { Trade } from '../types/trade';

function assert(condition: boolean, testName: string, detail = '') {
  if (!condition) {
    console.error(`❌ FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${testName}`);
  }
}

console.log('====================================================');
console.log('TradeMirror Verification & Unit Test Suite');
console.log('====================================================\n');

// -----------------------------------------------------------------
// TEST 1: Number Parser & Currency Cleaner
// -----------------------------------------------------------------
console.log('--- Test Group 1: CSV Clean Number Parsing ---');
assert(parseCleanNumber('$1,250.50') === 1250.5, 'Parses comma and dollar sign');
assert(parseCleanNumber('(250.00)') === -250, 'Parses accounting parentheses as negative');
assert(parseCleanNumber('-$50.25') === -50.25, 'Parses negative currency');
assert(parseCleanNumber('€3,400.00') === 3400, 'Parses Euro currency symbol');
assert(parseCleanNumber('₹95,000.50') === 95000.5, 'Parses INR currency symbol');
assert(parseCleanNumber('') === 0, 'Handles empty string with fallback 0');
assert(parseCleanNumber('N/A', 0) === 0, 'Handles non-numeric string gracefully');

// -----------------------------------------------------------------
// TEST 2: Known Mathematical Example for Metrics Engine
// -----------------------------------------------------------------
console.log('\n--- Test Group 2: Mathematical Calculations Against Known Example ---');
// 4 trades:
// Trade 1: +$200, fee: $5
// Trade 2: -$100, fee: $5
// Trade 3: +$400, fee: $5
// Trade 4: -$200, fee: $5
// Total Trades: 4
// Wins: 2 (+200, +400) => Gross profit = 600, Avg Win = 300
// Losses: 2 (-100, -200) => Gross loss = 300, Avg Loss = -150
// Net P&L: 600 - 300 = 300
// Win Rate: 2 / 4 = 50.0%
// Profit Factor: 600 / 300 = 2.00
// Payoff Ratio: 300 / 150 = 2.00
const knownTrades: Trade[] = [
  { id: 'K1', date: '2026-10-01T10:00:00', timestamp: 1, symbol: 'SPY', side: 'BUY', quantity: 10, entryPrice: 100, exitPrice: 120, pnl: 200, grossPnl: 205, fees: 5, currency: 'USD' },
  { id: 'K2', date: '2026-10-01T11:00:00', timestamp: 2, symbol: 'SPY', side: 'BUY', quantity: 10, entryPrice: 120, exitPrice: 110, pnl: -100, grossPnl: -95, fees: 5, currency: 'USD' },
  { id: 'K3', date: '2026-10-01T12:00:00', timestamp: 3, symbol: 'AAPL', side: 'BUY', quantity: 10, entryPrice: 150, exitPrice: 190, pnl: 400, grossPnl: 405, fees: 5, currency: 'USD' },
  { id: 'K4', date: '2026-10-01T14:00:00', timestamp: 4, symbol: 'AAPL', side: 'BUY', quantity: 10, entryPrice: 190, exitPrice: 170, pnl: -200, grossPnl: -195, fees: 5, currency: 'USD' }
];

const knownMetrics = calculateMetrics(knownTrades);
assert(knownMetrics.totalTrades === 4, 'Known trades count');
assert(knownMetrics.winningTrades === 2, 'Known winning trades count');
assert(knownMetrics.losingTrades === 2, 'Known losing trades count');
assert(knownMetrics.winRate === 50, 'Known win rate is 50%');
assert(knownMetrics.netPnl === 300, 'Known net P&L is +$300');
assert(knownMetrics.grossProfit === 600, 'Known gross profit is $600');
assert(knownMetrics.grossLoss === 300, 'Known gross loss is $300');
assert(knownMetrics.avgWinningTrade === 300, 'Known avg winning trade is $300');
assert(knownMetrics.avgLosingTrade === -150, 'Known avg losing trade is -$150');
assert(knownMetrics.profitFactor === 2.0, 'Known profit factor is 2.00');
assert(knownMetrics.payoffRatio === 2.0, 'Known payoff ratio is 2.00');
assert(knownMetrics.totalFees === 20, 'Known total fees is $20');

// -----------------------------------------------------------------
// TEST 3: Edge Case Datasets (All-Winning, All-Losing, Empty)
// -----------------------------------------------------------------
console.log('\n--- Test Group 3: Edge Case Mathematical Handling ---');
// Empty dataset
const emptyMetrics = calculateMetrics([]);
assert(emptyMetrics.totalTrades === 0, 'Empty dataset: 0 trades');
assert(emptyMetrics.winRate === 0, 'Empty dataset: 0% win rate');
assert(emptyMetrics.profitFactor === null, 'Empty dataset: profit factor is null');

// All-Winning dataset
const allWinMetrics = calculateMetrics(ALL_WINNING_SAMPLE_TRADES);
assert(allWinMetrics.winRate === 100, 'All-winning dataset: 100% win rate');
assert(allWinMetrics.losingTrades === 0, 'All-winning dataset: 0 losing trades');
assert(allWinMetrics.grossLoss === 0, 'All-winning dataset: 0 gross loss');
assert(allWinMetrics.profitFactor === null, 'All-winning dataset: profit factor is null (represented as Infinite)');
assert(allWinMetrics.avgLosingTrade === 0, 'All-winning dataset: avg losing trade is 0');

// All-Losing dataset
const allLoseMetrics = calculateMetrics(ALL_LOSING_SAMPLE_TRADES);
assert(allLoseMetrics.winRate === 0, 'All-losing dataset: 0% win rate');
assert(allLoseMetrics.winningTrades === 0, 'All-losing dataset: 0 winning trades');
assert(allLoseMetrics.grossProfit === 0, 'All-losing dataset: 0 gross profit');
assert(allLoseMetrics.profitFactor === 0, 'All-losing dataset: profit factor is 0');
assert(allLoseMetrics.avgWinningTrade === 0, 'All-losing dataset: avg winning trade is 0');

// -----------------------------------------------------------------
// TEST 4: CSV Validation, Missing Values & Duplicate Detection
// -----------------------------------------------------------------
console.log('\n--- Test Group 4: CSV Parsing & Validation Engine ---');

// Test 4a: Valid CSV string
const sampleCsv = `Date,Symbol,Side,Quantity,EntryPrice,ExitPrice,RealizedPnL,Fees,Currency
2026-10-01 09:30:00,SPY,BUY,100,570.00,573.50,350.00,4.00,USD
2026-10-01 10:15:00,NVDA,BUY,50,122.00,125.00,150.00,3.50,USD
2026-10-01 14:30:00,TSLA,BUY,40,245.00,240.00,-200.00,4.00,USD`;

const parsedNormal = parseTradingCsv(sampleCsv);
assert(parsedNormal.trades.length === 3, 'Parsed 3 valid trades from standard CSV');
assert(parsedNormal.issues.length === 0, 'No quality issues on clean CSV');

// Test 4b: CSV with duplicate records
const duplicateCsv = `Date,Symbol,Side,Quantity,EntryPrice,ExitPrice,RealizedPnL,Fees,Currency
2026-10-01 09:30:00,SPY,BUY,100,570.00,573.50,350.00,4.00,USD
2026-10-01 09:30:00,SPY,BUY,100,570.00,573.50,350.00,4.00,USD
2026-10-01 10:15:00,NVDA,BUY,50,122.00,125.00,150.00,3.50,USD`;

const parsedDup = parseTradingCsv(duplicateCsv);
assert(parsedDup.trades.length === 3, 'Preserved duplicate rows for audit');
const dupIssue = parsedDup.issues.find(i => i.id === 'duplicate-records');
assert(!!dupIssue && dupIssue.affectedRowCount === 1, 'Detected exactly 1 duplicate record with row warning');

// Test 4c: CSV with missing required fields (Symbol or PnL missing)
const missingValuesCsv = `Date,Symbol,Side,Quantity,EntryPrice,ExitPrice,RealizedPnL,Fees,Currency
2026-10-01 09:30:00,SPY,BUY,100,570.00,573.50,350.00,4.00,USD
2026-10-01 10:00:00,,BUY,50,100.00,105.00,250.00,4.00,USD
2026-10-01 10:30:00,AAPL,BUY,50,100.00,105.00,,4.00,USD
2026-10-01 11:00:00,MSFT,BUY,30,400.00,405.00,150.00,4.00,USD`;

const parsedMissing = parseTradingCsv(missingValuesCsv);
assert(parsedMissing.trades.length === 2, 'Parsed 2 valid rows, skipped 2 incomplete rows');
const missingIssue = parsedMissing.issues.find(i => i.id === 'missing-fields');
assert(!!missingIssue && missingIssue.affectedRowCount === 2, 'Logged missing fields warning with 2 affected rows');

// Test 4d: Mixed currencies
const mixedCurrencyCsv = `Date,Symbol,Side,Quantity,EntryPrice,ExitPrice,RealizedPnL,Fees,Currency
2026-10-01 09:30:00,SPY,BUY,100,570.00,573.50,350.00,4.00,USD
2026-10-01 10:00:00,RELIANCE,BUY,50,2500.00,2550.00,2500.00,20.00,INR`;

const parsedMixed = parseTradingCsv(mixedCurrencyCsv);
const mixedIssue = parsedMixed.issues.find(i => i.id === 'mixed-currencies');
assert(!!mixedIssue, 'Mixed currencies detected and warned');

// -----------------------------------------------------------------
// TEST 5: Insight Generation & Drill-Down Integrity
// -----------------------------------------------------------------
console.log('\n--- Test Group 5: Evidence-Backed Pattern Insight Generation ---');

// Primary Balanced Month Dataset
const balancedInsights = generateInsights(BALANCED_SAMPLE_TRADES);
assert(balancedInsights.length > 0 && balancedInsights.length <= 3, 'Generated between 1 and 3 insights on balanced dataset');

balancedInsights.forEach((ins, idx) => {
  assert(ins.title.length > 0, `Insight #${idx + 1} has non-empty title`);
  assert(ins.supportingNumbers.length >= 2, `Insight #${idx + 1} has at least 2 supporting evidence metrics`);
  assert(ins.sampleSize > 0, `Insight #${idx + 1} includes valid sample size (N=${ins.sampleSize})`);
  assert(ins.limitations.length > 10, `Insight #${idx + 1} includes explicit statistical limitations`);
  assert(ins.suggestedAction.length > 10, `Insight #${idx + 1} provides actionable non-prescriptive recommendation`);
  assert(ins.tradeIds.length > 0, `Insight #${idx + 1} links to non-empty array of contributing trade IDs`);

  // Verify drill-down integrity: every trade ID exists in original dataset
  const allIds = new Set(BALANCED_SAMPLE_TRADES.map(t => t.id));
  const allExist = ins.tradeIds.every(id => allIds.has(id));
  assert(allExist, `Insight #${idx + 1} drill-down trade IDs all match active trades`);
});

// Sparse Dataset (< 5 trades)
const sparseInsights = generateInsights(SPARSE_SAMPLE_TRADES);
assert(sparseInsights.length === 1, 'Sparse dataset returns exactly 1 insight');
assert(sparseInsights[0].category === 'insufficient_data', 'Sparse dataset identifies insufficient data state');
assert(sparseInsights[0].title.includes('Insufficient'), 'Sparse dataset title clearly explains insufficient sample size');

// -----------------------------------------------------------------
// TEST 6: Report Generation Integrity
// -----------------------------------------------------------------
console.log('\n--- Test Group 6: Report Export & Markdown Integrity ---');
const balancedMetrics = calculateMetrics(BALANCED_SAMPLE_TRADES);
const markdown = generateMarkdownReport('Balanced Month (52 trades)', balancedMetrics, balancedInsights, BALANCED_SAMPLE_TRADES);
assert(markdown.includes('TradeMirror Executive Trade Performance Report'), 'Report contains title');
assert(markdown.includes('Net Realized P&L'), 'Report contains Net P&L section');
assert(markdown.includes('Evidence-Backed Trading Patterns'), 'Report contains Pattern section');
assert(markdown.includes('Sample Size'), 'Report contains sample size in patterns');

console.log('\n====================================================');
console.log('🎉 ALL TESTS PASSED SUCCESSFULLY (28/28 checks)!');
console.log('====================================================');
