import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Sliders,
  GitCompare,
  Bookmark,
  Sparkles,
  Settings,
  ShieldCheck,
  Building2,
  TrendingDown,
  AlertCircle,
  LogOut,
  Globe,
} from 'lucide-react';
import { Scenario } from '../types/simulation';
import { useAuth } from '../lib/authContext';
import { useRouter } from '../lib/router';

export type ActiveTab =
  | 'dashboard'
  | 'city_map'
  | 'scenario_lab'
  | 'compare_plans'
  | 'saved_scenarios'
  | 'assistant'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activeScenario: Scenario;
  onOpenValidationModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeScenario,
  onOpenValidationModal,
}) => {
  const { user, signOut } = useAuth();
  const { navigate } = useRouter();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'city_map', label: 'Interactive City Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'scenario_lab', label: 'Scenario Lab', icon: <Sliders className="w-4 h-4" /> },
    { id: 'compare_plans', label: 'Compare Plans', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'saved_scenarios', label: 'Saved Scenarios', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'assistant', label: 'Planning Assistant', icon: <Sparkles className="w-4 h-4" />, badge: 'v1.0' },
    { id: 'settings', label: 'Model Assumptions', icon: <Settings className="w-4 h-4" /> },
  ];

  const { metrics } = activeScenario.results;

  return (
    <aside className="w-64 bg-[#0b132b] border-r border-slate-800 flex flex-col shrink-0 select-none min-h-screen">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">CityTwin</span>
              <span className="text-[10px] font-mono text-teal-400 font-semibold bg-teal-950/60 border border-teal-800/60 px-1.5 py-0.2 rounded">SIM</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">Urban Policy Sandbox</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
          Simulation Studio
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isActive ? 'text-teal-400' : 'text-slate-400'}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Verification & Math Proofs Button */}
        <div className="pt-4 mt-3 border-t border-slate-800/60">
          <button
            onClick={onOpenValidationModal}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-teal-300 hover:bg-slate-800/40 border border-transparent hover:border-slate-800 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="truncate">Verify Simulation Math</span>
          </button>
        </div>
      </nav>

      {/* Active Scenario Quick Glance Footer */}
      <div className="p-4 border-t border-slate-700/80 bg-[#070d1e]">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-300 font-medium">Active Plan</span>
          <span className="font-mono text-xs text-teal-300 font-semibold truncate max-w-[120px]" title={activeScenario.name}>
            {activeScenario.name}
          </span>
        </div>

        {/* Budget Bar */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Spent: ₹{metrics.totalCostLakhs}L</span>
            <span className={`font-mono font-medium ${metrics.isOverBudget ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
              Cap: ₹{metrics.budgetCapLakhs}L
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                metrics.isOverBudget ? 'bg-rose-500' : 'bg-teal-500'
              }`}
              style={{
                width: `${Math.min(100, (metrics.totalCostLakhs / Math.max(1, metrics.budgetCapLakhs)) * 100)}%`,
              }}
            />
          </div>
          {metrics.isOverBudget && (
            <div className="flex items-center gap-1 text-xs text-rose-400 pt-0.5 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Budget exceeded by ₹{Math.abs(metrics.remainingBudgetLakhs)}L</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-center">
          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-700/70">
            <div className="text-[11px] text-slate-300 font-medium">Avg Travel</div>
            <div className="text-xs font-mono font-bold text-slate-100">
              {metrics.averageTravelTimeMinutes}m
            </div>
          </div>
          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-700/70">
            <div className="text-[11px] text-slate-300 font-medium">Congestion</div>
            <div className="text-xs font-mono font-bold text-teal-300">
              {metrics.congestionIndex}/100
            </div>
          </div>
        </div>

        {/* User Account Strip */}
        {user && (
          <div className="pt-3 mt-3 border-t border-slate-700/80 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-slate-100 truncate" title={user.email}>
                {user.email}
              </div>
              <button
                onClick={() => navigate('/')}
                className="text-[11px] text-teal-300 hover:text-white transition-colors flex items-center gap-1 font-medium mt-0.5"
              >
                <Globe className="w-3 h-3" />
                <span>Public Site</span>
              </button>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out of CityTwin"
              className="p-1.5 rounded text-rose-300 hover:text-white hover:bg-rose-950/60 border border-transparent hover:border-rose-800 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
