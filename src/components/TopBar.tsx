import React from 'react';
import { ActiveTab } from './Sidebar';
import { Scenario } from '../types/simulation';
import { RotateCcw, Plus, Activity, Layers, Download, LogOut, Home, User as UserIcon } from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { useRouter } from '../lib/router';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activeScenario: Scenario;
  onResetBaseline: () => void;
  onNewScenario: () => void;
  onExportReport: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  activeScenario,
  onResetBaseline,
  onNewScenario,
  onExportReport,
}) => {
  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'City Executive Dashboard';
      case 'city_map':
        return 'Interactive Network Simulation';
      case 'scenario_lab':
        return 'Intervention & Policy Lab';
      case 'compare_plans':
        return 'Multi-Scenario Comparative Audit';
      case 'saved_scenarios':
        return 'Saved Scenarios Repository';
      case 'assistant':
        return 'Planning Goal Assistant';
      case 'settings':
        return 'BPR Engine Calibration & Assumptions';
      default:
        return 'Urban Planning Simulator';
    }
  };

  const { user, signOut } = useAuth();
  const { navigate } = useRouter();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <header className="h-16 bg-[#080e22] border-b border-slate-800/80 px-6 flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Contextual Title & Breadcrumb */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <span className="text-sm font-bold text-white tracking-tight">
          {getBreadcrumbTitle()}
        </span>
        <span className="text-slate-500 hidden sm:inline" aria-hidden="true">·</span>
        <span className="text-xs text-slate-300 font-medium hidden sm:inline truncate max-w-xs">
          {activeScenario.name}
        </span>
      </div>

      {/* Zone 2: Navigation Links (Clean unboxed single-line links) */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard' ? 'text-teal-300 font-bold' : ''
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onSelectTab('city_map')}
          className={`hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'city_map' ? 'text-teal-300 font-bold' : ''
          }`}
        >
          Live City Grid
        </button>
        <button
          onClick={() => onSelectTab('scenario_lab')}
          className={`hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'scenario_lab' ? 'text-teal-300 font-bold' : ''
          }`}
        >
          Interventions
        </button>
        <button
          onClick={() => onSelectTab('compare_plans')}
          className={`hover:text-teal-300 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'compare_plans' ? 'text-teal-300 font-bold' : ''
          }`}
        >
          Plan Audit
        </button>
      </nav>

      {/* Zone 3: Primary Actions, User Info & Sign Out */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onResetBaseline}
          title="Reset back to unmanaged Baseline state"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Reset Baseline</span>
        </button>

        <button
          onClick={onExportReport}
          title="Export plan metrics report"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Export Plan</span>
        </button>

        <button
          onClick={() => onSelectTab('scenario_lab')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Configure Policy</span>
        </button>

        {/* Separator */}
        <div className="h-5 w-[1px] bg-slate-800 hidden sm:block"></div>

        {/* Home link */}
        <button
          onClick={() => navigate('/')}
          title="Return to CityTwin Homepage"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
        </button>

        {/* User Account & Sign Out */}
        {user && (
          <div className="flex items-center gap-2 pl-1">
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-[11px] font-medium text-slate-200 truncate max-w-[130px]" title={user.email}>
                {user.email}
              </span>
              <span className="text-[9px] text-teal-400 uppercase tracking-wider font-semibold">Municipal Planner</span>
            </div>
            <button
              onClick={handleSignOut}
              title={`Sign out (${user.email})`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
