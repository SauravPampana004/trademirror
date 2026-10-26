import React, { useState, useMemo } from 'react';
import { BALANCED_SAMPLE_TRADES, SampleDatasetOption } from './data/sampleDatasets';
import { Trade, TradeFilter, DataQualityIssue, ParseResult, Insight } from './types/trade';
import { calculateMetrics } from './utils/metricsEngine';
import { generateInsights } from './utils/insightEngine';
import { Navbar } from './components/Navbar';
import { KpiGrid } from './components/KpiGrid';
import { InsightsSection } from './components/InsightsSection';
import { ChartsSection } from './components/ChartsSection';
import { CalendarHeatmap } from './components/CalendarHeatmap';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { FiltersBar } from './components/FiltersBar';
import { TradeHistoryTable } from './components/TradeHistoryTable';
import { DataQualityBanner } from './components/DataQualityBanner';
import { UploadModal } from './components/UploadModal';
import { InsightDrillDownModal } from './components/InsightDrillDownModal';
import { ReportModal } from './components/ReportModal';
import { FormatGuideModal } from './components/FormatGuideModal';
import { HelpCircle, ShieldCheck, Sliders, Calendar } from 'lucide-react';

export function App() {
  // Primary datasets
  const [activeTrades, setActiveTrades] = useState<Trade[]>(BALANCED_SAMPLE_TRADES);
  const [datasetName, setDatasetName] = useState<string>('Active Month (52 trades)');
  const [qualityIssues, setQualityIssues] = useState<DataQualityIssue[]>([]);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  // Advanced features view state: 'calendar' | 'whatif' | 'both'
  const [advancedView, setAdvancedView] = useState<'calendar' | 'whatif' | 'both'>('both');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');

  // Filters state
  const [filter, setFilter] = useState<TradeFilter>({
    searchSymbol: '',
    outcome: 'all',
    side: 'all',
    instrumentType: 'all',
    startDate: '',
    endDate: '',
    timeSlot: 'all'
  });

  // Filter application
  const filteredTrades = useMemo(() => {
    return activeTrades.filter(t => {
      // 0. Calendar specific date filter
      if (selectedCalendarDate && t.date.slice(0, 10) !== selectedCalendarDate) {
        return false;
      }

      // 1. Symbol search
      if (filter.searchSymbol && !t.symbol.toUpperCase().includes(filter.searchSymbol.toUpperCase())) {
        return false;
      }
      // 2. Outcome
      if (filter.outcome === 'wins' && t.pnl <= 0.0001) return false;
      if (filter.outcome === 'losses' && t.pnl >= -0.0001) return false;
      if (filter.outcome === 'breakeven' && Math.abs(t.pnl) > 0.0001) return false;

      // 3. Side
      if (filter.side !== 'all' && t.side !== filter.side) return false;

      // 4. Session / Time slot
      if (filter.timeSlot !== 'all') {
        const d = new Date(t.timestamp);
        const hour = d.getHours() + d.getMinutes() / 60;
        if (filter.timeSlot === 'morning' && !(hour >= 9.5 && hour < 11.5)) return false;
        if (filter.timeSlot === 'midday' && !(hour >= 11.5 && hour < 14.0)) return false;
        if (filter.timeSlot === 'afternoon' && !(hour >= 14.0 && hour <= 16.5)) return false;
        if (filter.timeSlot === 'after_hours' && (hour >= 9.5 && hour <= 16.5)) return false;
      }

      return true;
    });
  }, [activeTrades, filter, selectedCalendarDate]);

  // Dynamic calculations from filtered dataset
  const dynamicMetrics = useMemo(() => {
    return calculateMetrics(filteredTrades);
  }, [filteredTrades]);

  // Dynamic insights derived from current dataset
  const dynamicInsights = useMemo(() => {
    return generateInsights(filteredTrades);
  }, [filteredTrades]);

  // Unique symbols for filter dropdown / autocomplete
  const availableSymbols = useMemo(() => {
    const set = new Set<string>();
    activeTrades.forEach(t => set.add(t.symbol));
    return Array.from(set).sort();
  }, [activeTrades]);

  // Handlers
  const handleSelectSample = (sample: SampleDatasetOption) => {
    setActiveTrades(sample.trades);
    setDatasetName(sample.name);
    setQualityIssues([]);
    setSelectedCalendarDate('');
    setFilter({
      searchSymbol: '',
      outcome: 'all',
      side: 'all',
      instrumentType: 'all',
      startDate: '',
      endDate: '',
      timeSlot: 'all'
    });
  };

  const handleConfirmUpload = (result: ParseResult, fileName: string) => {
    setActiveTrades(result.trades);
    setDatasetName(`Uploaded: ${fileName}`);
    setQualityIssues(result.issues);
    setSelectedCalendarDate('');
    setFilter({
      searchSymbol: '',
      outcome: 'all',
      side: 'all',
      instrumentType: 'all',
      startDate: '',
      endDate: '',
      timeSlot: 'all'
    });
  };

  const handleResetData = () => {
    setActiveTrades(BALANCED_SAMPLE_TRADES);
    setDatasetName('Active Month (52 trades)');
    setQualityIssues([]);
    setSelectedCalendarDate('');
    setFilter({
      searchSymbol: '',
      outcome: 'all',
      side: 'all',
      instrumentType: 'all',
      startDate: '',
      endDate: '',
      timeSlot: 'all'
    });
  };

  return (
    <div className="min-h-screen text-slate-900 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <Navbar
        activeDatasetName={datasetName}
        onSelectSampleDataset={handleSelectSample}
        onOpenUploadModal={() => setIsUploadOpen(true)}
        onOpenReportModal={() => setIsReportOpen(true)}
        onResetData={handleResetData}
        totalTrades={activeTrades.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        {/* Quality Alerts Banner (shown if issues detected in CSV) */}
        {qualityIssues.length > 0 && (
          <DataQualityBanner issues={qualityIssues} />
        )}

        {/* Dashboard Title & Quick Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Trading Performance & Pattern Intelligence
              </h1>
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-3xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Live Dynamic Math
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Analyzing <strong className="text-slate-800">{filteredTrades.length}</strong> trades in active view ({datasetName}).
              {selectedCalendarDate && (
                <span className="ml-2 font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Filtered to date: {selectedCalendarDate}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80 transition-colors cursor-pointer shadow-3xs"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              CSV Format Guide
            </button>
          </div>
        </div>

        {/* 1. Executive KPI Grid */}
        <section aria-label="Executive Metrics">
          <KpiGrid metrics={dynamicMetrics} />
        </section>

        {/* 2. Top 3 Evidence-Backed Pattern Insights */}
        <section aria-label="Trading Patterns">
          <InsightsSection
            insights={dynamicInsights}
            onSelectInsight={(ins) => setSelectedInsight(ins)}
          />
        </section>

        {/* 3. What-If Simulator & Calendar Heatmap Suite */}
        <section aria-label="Pattern Simulation and Calendar">
          <div className="space-y-4">
            {/* View Switcher Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Tactical Playbook & Calendar
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Interactive behavioral tools
                </span>
              </div>

              <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => setAdvancedView('both')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    advancedView === 'both' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Both Tools
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancedView('whatif')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    advancedView === 'whatif' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 mr-1" />
                  What-If Simulator
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancedView('calendar')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    advancedView === 'calendar' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  Calendar Heatmap
                </button>
              </div>
            </div>

            {/* Components based on advancedView */}
            <div className="space-y-4">
              {(advancedView === 'both' || advancedView === 'whatif') && (
                <WhatIfSimulator trades={filteredTrades} />
              )}
              {(advancedView === 'both' || advancedView === 'calendar') && (
                <CalendarHeatmap
                  trades={activeTrades}
                  selectedDate={selectedCalendarDate}
                  onSelectDate={(d) => setSelectedCalendarDate(d)}
                />
              )}
            </div>
          </div>
        </section>

        {/* 4. Recharts Performance Visualizations */}
        <section aria-label="Performance Visualizations">
          <ChartsSection trades={filteredTrades} metrics={dynamicMetrics} />
        </section>

        {/* 5. Filter Controls */}
        <section aria-label="Trade Filters">
          <FiltersBar
            filter={filter}
            onFilterChange={setFilter}
            availableSymbols={availableSymbols}
            totalTradesCount={activeTrades.length}
            filteredTradesCount={filteredTrades.length}
          />
        </section>

        {/* 6. Trade Audit History Table */}
        <section aria-label="Trade History Table">
          <TradeHistoryTable trades={filteredTrades} />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white/80 backdrop-blur-md py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            <span className="font-extrabold text-slate-900">TradeMirror</span>
            <span>• Built for Nubra Product Management Intern Assignment</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400 font-medium">
            <span>100% In-Browser Privacy</span>
            <span>•</span>
            <span>Deterministic Pattern Clustering</span>
            <span>•</span>
            <span>Zero Fabricated Math</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onConfirmUpload={handleConfirmUpload}
      />

      <InsightDrillDownModal
        insight={selectedInsight}
        allTrades={filteredTrades}
        onClose={() => setSelectedInsight(null)}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        datasetName={datasetName}
        metrics={dynamicMetrics}
        insights={dynamicInsights}
        trades={filteredTrades}
      />

      <FormatGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}

export default App;
