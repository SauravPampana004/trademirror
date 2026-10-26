import React from 'react';
import { Sparkles, ArrowRight, Info, CheckCircle, Clock, PieChart, Layers, ShieldCheck } from 'lucide-react';
import { Insight } from '../types/trade';

interface InsightsSectionProps {
  insights: Insight[];
  onSelectInsight: (insight: Insight) => void;
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({
  insights,
  onSelectInsight
}) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-slate-200 text-center space-y-2">
        <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">No High-Disparity Patterns Detected</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The current active dataset does not display statistically significant clustering across sessions, instruments, or risk sizing.
        </p>
      </div>
    );
  }

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'timing':
        return {
          icon: <Clock className="w-4 h-4 text-purple-600" />,
          accentBar: 'from-purple-500 via-indigo-500 to-blue-500',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          borderHover: 'hover:border-purple-300'
        };
      case 'instrument':
        return {
          icon: <PieChart className="w-4 h-4 text-emerald-600" />,
          accentBar: 'from-emerald-500 via-teal-500 to-cyan-500',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          borderHover: 'hover:border-emerald-300'
        };
      case 'risk_sizing':
        return {
          icon: <Layers className="w-4 h-4 text-amber-600" />,
          accentBar: 'from-amber-500 via-orange-500 to-rose-500',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          borderHover: 'hover:border-amber-300'
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
          accentBar: 'from-indigo-500 to-blue-500',
          badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          borderHover: 'hover:border-indigo-300'
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Evidence-Backed Trading Patterns
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Top {insights.length} Identified
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Statistically clustered trading tendencies with exact contributing trade drill-downs.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Non-prescriptive • Evidence-backed</span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, idx) => {
          const cfg = getCategoryConfig(insight.category);
          const isPositive = insight.sentiment === 'positive';

          return (
            <div
              key={insight.id}
              className={`glass-card glass-card-hover rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between overflow-hidden relative group ${cfg.borderHover}`}
            >
              {/* Vibrant Accent Color Bar at Top */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.accentBar}`} />

              <div>
                {/* Header bar */}
                <div className="p-4 pb-3 border-b border-slate-100/80 bg-slate-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.badgeBg}`}>
                      {cfg.icon}
                      <span className="uppercase tracking-wider">{insight.tag}</span>
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-400">
                      #{idx + 1}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                    {insight.title}
                  </h4>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3.5">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {insight.summary}
                  </p>

                  {/* Supporting Numbers Grid */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 text-center shadow-3xs">
                    {insight.supportingNumbers.map((num, i) => (
                      <div key={i} className="space-y-0.5">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold truncate">
                          {num.label}
                        </span>
                        <span className="block text-xs font-black text-slate-900 truncate">
                          {num.value}
                        </span>
                        {num.sublabel && (
                          <span className="block text-[9px] text-slate-500 truncate font-medium">
                            {num.sublabel}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Sample Size Badge */}
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="font-semibold text-slate-600">Sample Size ($N$):</span>
                    <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md text-[10px] border border-slate-200">
                      {insight.sampleSize} trades ({insight.sampleSizePct}% of dataset)
                    </span>
                  </div>

                  {/* Limitations Warning */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-[11px] space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                      <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Statistical Limitations</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      {insight.limitations}
                    </p>
                  </div>

                  {/* Suggested Tactical Action */}
                  <div className={`p-3 rounded-xl border text-[11px] space-y-1 shadow-3xs ${
                    isPositive
                      ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/60 border-emerald-200/80 text-emerald-950'
                      : 'bg-gradient-to-br from-indigo-50/90 to-purple-50/60 border-indigo-200/80 text-indigo-950'
                  }`}>
                    <div className="flex items-center space-x-1.5 font-bold">
                      <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isPositive ? 'text-emerald-600' : 'text-indigo-600'}`} />
                      <span>Suggested Tactical Action</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {insight.suggestedAction}
                    </p>
                  </div>
                </div>
              </div>

              {/* Drill-down CTA button */}
              <div className="p-3 bg-slate-50/60 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectInsight(insight)}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-900 hover:text-white border border-slate-200/90 shadow-2xs flex items-center justify-center space-x-1.5 transition-all group-hover:border-indigo-300 cursor-pointer"
                >
                  <span>Inspect Contributing Trades ({insight.sampleSize})</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
