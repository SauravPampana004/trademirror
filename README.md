# TradeMirror 📈

> **Nubra Product Management Intern Assignment**  
> *Helping retail traders analyze monthly trade history and extract up to three actionable, evidence-backed trading patterns.*

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.x-22c55e)](https://recharts.org/)
[![Tests Passed](https://img.shields.io/badge/Unit%20Tests-28%2F28%20Passed-10b981)]()

---

## 🎯 Executive Summary & PM Thesis

Retail traders often suffer from **analysis paralysis** or rely on unverified emotional narratives (e.g., *"I had a bad day because of market manipulation"*). 

**TradeMirror** addresses this problem by serving as an objective, evidence-grounded trading reflection engine. It transforms raw monthly execution logs into:
1. **Accurate Core KPIs**: Net Realized P&L, Total Trades, Win Rate, Profit Factor, Average Win / Average Loss, and Payoff Ratio.
2. **Dynamic Visualizations**: Cumulative P&L curves, instrument edge rankings, and time-of-day execution performance.
3. **Up to Three Evidence-Backed Trading Patterns**: Mathematically grounded patterns with explicit sample sizes ($N$), statistical limitations, contributing trade drill-downs, and non-prescriptive tactical experiments.
4. **Interactive Counterfactual "What-If" Simulator**: Allows traders to test guardrails derived directly from their patterns (e.g. *"What if I cut out afternoon trades?"*) and see projected P&L improvements in real time.
5. **Daily P&L Calendar Heatmap**: Monthly day-by-day P&L tiles with green/red consistency metrics and 1-click date filtering.
6. **Privacy-First In-Browser Processing**: 100% of data is parsed, validated, and computed locally in the client session without transmitting financial records to third-party servers.

---

## ✨ Core Features & Technical Implementation

### 1. Upload & Deterministic Sample Datasets
- **Instant Exploration**: Preloaded with a realistic 52-trade monthly active retail history (Equities across `AAPL`, `SPY`, `NVDA`, `TSLA`, `MSFT`, `AMD`).
- **Edge Case Pre-Sets**:
  - `Active Month (52 trades)`: Primary balanced dataset with afternoon decay and loss-sizing patterns.
  - `All-Winning Streak (14 trades)`: Tests zero-loss condition (Profit factor: $\infty$ / "No losses", 100% win rate).
  - `Drawdown Run (12 trades)`: Tests zero-win condition (0% win rate, 0.00 profit factor).
  - `Sparse Sample (3 trades)`: Demonstrates graceful degradation and explicit "Insufficient Data for Statistical Clustering" state.
- **Robust CSV Parser**: Built on PapaParse with fuzzy column header matching for Zerodha, Interactive Brokers, Robinhood, ThinkorSwim, and generic spreadsheets.

### 2. Mathematical Integrity & Zero-Denominator Safety
All calculations are pure, deterministic functions (`calculateMetrics` in `src/utils/metricsEngine.ts`):
- **Net P&L**: $\sum (\text{Gross P\&L}) - \sum (\text{Fees})$
- **Win Rate**: $(\text{Winning Trades} / \text{Total Trades}) \times 100$
- **Profit Factor**: $\text{Gross Profit} / \text{Gross Loss}$. Handled safely when Gross Loss $= 0$ (returns `null`, rendered as $\infty$ with explanation).
- **Payoff Ratio**: $\text{Average Winning Trade} / |\text{Average Losing Trade}|$
- **Max Drawdown**: Peak-to-trough equity retracement with percentage tracking.

### 3. Up to Three Evidence-Backed Trading Patterns
The algorithm (`src/utils/insightEngine.ts`) evaluates candidate execution biases and surfaces the top 3 statistically significant patterns:
1. **Session Timing Disparity**: Identifies afternoon decay (e.g., 14:00–16:00 chop vs. 09:30–11:30 morning edge).
2. **Loss Sizing Asymmetry**: Detects when average losses exceed average wins ($> 1.25\times$), highlighting the trades responsible.
3. **Instrument Specialization vs. Overtrading**: Identifies winning instrument clusters (e.g. SPY/AAPL) vs. lagging momentum instruments (e.g. TSLA/AMD).
4. **Directional Side Bias**: Evaluates Long vs. Short performance disparities.
5. **Fee & Commission Friction**: Flags when ticket fees exceed 10–20% of gross profits.

> **PM Ethics Guardrail**: Insights **never** infer emotional discipline from P&L alone, nor do they make speculative buy/sell recommendations. Each insight explicitly displays sample size ($N$), sample volume percentage, potential confounding variables (e.g., FOMC macro releases, sector volatility), and non-prescriptive testing actions.

### 4. Interactive Counterfactual "What-If" Simulator
- Allows traders to test guardrails based on their patterns:
  - 🔘 *Eliminate Afternoon Entries (14:00 - 16:00)*
  - 🔘 *Enforce Strict Stop-Loss (Cap at 1.5x Avg Win)*
  - 🔘 *Pause Lagging Symbol (e.g. TSLA/AMD)*
- Real-time comparison: Actual Net P&L vs. Simulated Net P&L with delta metrics and win rate changes.

### 5. Monthly Daily P&L Calendar Heatmap
- Day-by-day green/red tiles for the active month showing realized return and execution count.
- Best day & worst day callouts.
- Green Day ratio indicator (e.g. 15 Green Days / 75% consistency).
- Click any day to isolate its executions in the trade history audit log.

### 6. Interactive Drill-Down & Filters
- Click on any insight card to open a full drill-down modal displaying the exact contributing trades, subset win rate, and 1-click **Export Subset CSV** button.
- Live quick-ticker filter pills (`ALL`, `SPY`, `NVDA`, `TSLA`, `AAPL`, `MSFT`, `AMD`) + outcome and session filters.

### 7. Executive Report Export
- **Print & PDF Mode**: Specially formatted `@media print` clean layout.
- **Markdown Export**: 1-click copy formatted executive summary to clipboard.
- **CSV Export**: Filtered or subset trade exports.

---

## 🚀 Getting Started

```bash
# Navigate to the project directory
cd trademirror

# Start Vite development server
npm run dev

# Run the automated 28-point verification test suite
npm test

# Build production bundle
npm run build
```

---

## 🧪 Test Suite Results (28/28 Passed)

Run `npm test` to verify calculations against known mathematical benchmarks:

| Test Group | Test Cases | Status |
| :--- | :--- | :--- |
| **Group 1: CSV Clean Parsing** | Currency symbols ($ € ₹ £), parentheses negatives `(250.00)`, comma numbers `1,250.50` | ✅ PASS |
| **Group 2: Mathematical Correctness** | Known 4-trade dataset (Hand-verified P&L, Win Rate, Profit Factor, Payoff Ratio) | ✅ PASS |
| **Group 3: Edge Cases** | All-winning (100% win rate), All-losing (0% win rate), Empty dataset | ✅ PASS |
| **Group 4: CSV Validation** | Missing values, duplicate row signatures, mixed currency alerts | ✅ PASS |
| **Group 5: Insight Engine & Drill-Down** | Top 3 ranking, evidence fields, sample size, limitations, valid trade IDs | ✅ PASS |
| **Group 6: Report Generation** | Executive report generation, markdown formatting, accuracy | ✅ PASS |

---

*TradeMirror was designed and built as an end-to-end product for Nubra's Product Management Intern assessment.*
