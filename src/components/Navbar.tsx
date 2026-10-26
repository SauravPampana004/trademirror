import React from 'react';
import { LineChart, Upload, FileText, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { SAMPLE_DATASETS, SampleDatasetOption } from '../data/sampleDatasets';

interface NavbarProps {
  activeDatasetName: string;
  onSelectSampleDataset: (dataset: SampleDatasetOption) => void;
  onOpenUploadModal: () => void;
  onOpenReportModal: () => void;
  onResetData: () => void;
  totalTrades: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeDatasetName,
  onSelectSampleDataset,
  onOpenUploadModal,
  onOpenReportModal,
  onResetData,
  totalTrades
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/30">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">TradeMirror</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Nubra PM Intern
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Monthly Retail Trading Pattern Intelligence</p>
            </div>
          </div>

          {/* Action Center */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Dataset Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0 shadow-xs shadow-emerald-500/50" />
                <span className="max-w-[120px] sm:max-w-[180px] truncate">{activeDatasetName}</span>
                <span className="ml-1 text-slate-400">({totalTrades})</span>
                <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-76 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 overflow-hidden">
                  <div className="px-3.5 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Sample Dataset</p>
                  </div>
                  {SAMPLE_DATASETS.map((ds) => {
                    const isSelected = ds.name === activeDatasetName;
                    return (
                      <button
                        key={ds.id}
                        type="button"
                        onClick={() => {
                          onSelectSampleDataset(ds);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs flex items-start justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50/70 text-slate-900 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div className="pr-2">
                          <div className="flex items-center space-x-1.5">
                            <span>{ds.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">
                              {ds.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ds.description}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                  <div className="pt-2 border-t border-slate-100 px-3.5 py-2 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenUploadModal();
                        setDropdownOpen(false);
                      }}
                      className="text-xs text-indigo-600 font-bold hover:underline flex items-center cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      Upload your own CSV...
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span className="hidden sm:inline">Upload</span> CSV
            </button>

            {/* Export Report Button */}
            <button
              type="button"
              onClick={onOpenReportModal}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-200" />
              Executive Report
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={onResetData}
              title="Reset to default sample"
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
