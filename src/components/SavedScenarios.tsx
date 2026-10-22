import React, { useState } from 'react';
import { Scenario } from '../types/simulation';
import {
  Bookmark,
  Play,
  Trash2,
  GitCompare,
  Download,
  Plus,
  MapPin,
  Database,
  Edit2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  HelpCircle,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { getInitialScenarios } from '../simulation/engine';

interface SavedScenariosProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void | Promise<void>;
  onRenameScenario?: (scenarioId: string, newName: string) => void | Promise<void>;
  onRefreshScenarios?: () => void | Promise<void>;
  onGoToCompare: (scenarioId: string) => void;
  onGoToLab: () => void;
  presets?: Scenario[];
  onLoadPreset?: (presetId: string) => void;
  isDbConnected?: boolean;
  dbSource?: 'supabase' | 'local';
  isLoading?: boolean;
  dbErrorMessage?: string | null;
}

export const SavedScenarios: React.FC<SavedScenariosProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onDeleteScenario,
  onRenameScenario,
  onRefreshScenarios,
  onGoToCompare,
  onGoToLab,
  presets = getInitialScenarios(),
  onLoadPreset,
  isDbConnected = false,
  dbSource = 'local',
  isLoading = false,
  dbErrorMessage = null,
}) => {
  const [renamingScenario, setRenamingScenario] = useState<{ id: string; name: string } | null>(null);
  const [deletingScenario, setDeletingScenario] = useState<Scenario | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copiedMigration, setCopiedMigration] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const exportScenarioJson = (scenario: Scenario) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scenario, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${scenario.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingScenario || !renamingScenario.name.trim() || !onRenameScenario) return;
    setActionInProgress(true);
    try {
      await onRenameScenario(renamingScenario.id, renamingScenario.name.trim());
      setRenamingScenario(null);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingScenario) return;
    setActionInProgress(true);
    try {
      await onDeleteScenario(deletingScenario.id);
      setDeletingScenario(null);
    } finally {
      setActionInProgress(false);
    }
  };

  const sqlMigrationCode = `-- Migration: 20261014000000_create_scenarios_table.sql
CREATE TABLE IF NOT EXISTS public.scenarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scenarios" ON public.scenarios
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own scenarios" ON public.scenarios
    FOR INSERT WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

CREATE POLICY "Users can update own scenarios" ON public.scenarios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scenarios" ON public.scenarios
    FOR DELETE USING (auth.uid() = user_id);`;

  const copyMigrationSql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedMigration(true);
    setTimeout(() => setCopiedMigration(false), 2500);
  };

  // Only display non-baseline presets in the benchmark reference section
  const benchmarkPresets = presets.filter((p) => !p.isBaseline);

  return (
    <div className="space-y-6">
      {/* Header & Status Bar */}
      <div className="bg-[#101b3b] border border-slate-700/80 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Scenario Repository
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/40">
                {scenarios.length} {scenarios.length === 1 ? 'Personal Plan' : 'Personal Plans'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Personal urban planning interventions saved to your municipal account.
            </p>
          </div>

          {/* Persistence status indicator & actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Database indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs">
              <Database className={`w-3.5 h-3.5 ${isDbConnected ? 'text-teal-400' : 'text-amber-400'}`} />
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-slate-300">Storage:</span>
                {isDbConnected ? (
                  <span className="text-teal-300 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    Supabase Cloud
                  </span>
                ) : (
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Local Browser
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowSetupModal(true)}
                className="ml-1 text-slate-400 hover:text-white"
                title="View Database Configuration"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {onRefreshScenarios && (
              <button
                onClick={onRefreshScenarios}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
                <span>Refresh</span>
              </button>
            )}

            <button
              onClick={onGoToLab}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Scenario</span>
            </button>
          </div>
        </div>

        {/* Database notice/warning banner if disconnected */}
        {!isDbConnected && (
          <div className="mt-4 p-3 rounded-lg bg-amber-950/40 border border-amber-700/60 text-xs text-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {dbErrorMessage ? (
                  <span><strong>Notice:</strong> {dbErrorMessage}</span>
                ) : (
                  <span>Using isolated local browser storage. Scenarios are safely cached and isolated to your account.</span>
                )}
              </span>
            </div>
            <button
              onClick={() => setShowSetupModal(true)}
              className="text-amber-300 hover:underline font-semibold text-xs whitespace-nowrap shrink-0"
            >
              View SQL Migration
            </button>
          </div>
        )}
      </div>

      {/* Empty State when User has 0 Saved Scenarios */}
      {scenarios.length === 0 && !isLoading && (
        <div className="bg-[#101b3b] border border-slate-700/80 rounded-xl p-10 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-teal-500/15 border border-teal-500/30 mx-auto flex items-center justify-center text-teal-300">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white tracking-tight">Your Saved Scenario Repository is Empty</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              You haven't saved any customized urban mobility plans yet. Configure adaptive signals, transit lanes, or green corridors in the Scenario Lab, or start from a benchmark below.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onGoToLab}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Open Scenario Lab
            </button>
          </div>
        </div>
      )}

      {/* User Saved Scenarios Grid */}
      {scenarios.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Your Personal Plans ({scenarios.length})
            </h3>
            <span className="text-xs text-slate-300">Click any card to load into simulation engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((sc) => {
              const isActive = sc.id === activeScenarioId;
              const { metrics } = sc.results;
              const hasCandidates = Boolean(sc.importedRealCityCandidates && sc.importedRealCityCandidates.length > 0);

              return (
                <div
                  key={sc.id}
                  className={`bg-[#0d1633] border rounded-xl p-5 flex flex-col justify-between transition-all ${
                    isActive
                      ? 'border-teal-500/70 shadow-lg ring-1 ring-teal-500/30'
                      : 'border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white tracking-tight truncate">
                            {sc.name}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] font-bold text-emerald-200 bg-emerald-950/80 border border-emerald-600 px-1.5 py-0.5 rounded">
                              Active In Lab
                            </span>
                          )}
                          {hasCandidates && (
                            <span className="text-[10px] font-mono text-cyan-200 bg-cyan-950/80 border border-cyan-700 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{sc.importedRealCityCandidates!.length} GIS {sc.importedRealCityCandidates!.length === 1 ? 'Site' : 'Sites'}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {sc.description}
                        </p>
                      </div>

                      {/* Rename Action for personal custom scenarios */}
                      {onRenameScenario && (
                        <button
                          onClick={() => setRenamingScenario({ id: sc.id, name: sc.name })}
                          className="p-1.5 text-slate-300 hover:text-teal-300 hover:bg-slate-800 rounded transition-colors shrink-0"
                          title="Rename scenario"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Metrics Pill Grid */}
                    <div className="grid grid-cols-3 gap-2 my-4 text-center">
                      <div className="p-2 bg-slate-900/80 border border-slate-700/70 rounded-lg">
                        <span className="text-[11px] text-slate-300 font-medium block">Avg Commute</span>
                        <span className="text-xs font-mono font-extrabold text-white block mt-0.5">
                          {metrics.averageTravelTimeMinutes}m
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900/80 border border-slate-700/70 rounded-lg">
                        <span className="text-[11px] text-slate-300 font-medium block">Congestion</span>
                        <span className="text-xs font-mono font-extrabold text-teal-300 block mt-0.5">
                          {metrics.congestionIndex}/100
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900/80 border border-slate-700/70 rounded-lg">
                        <span className="text-[11px] text-slate-300 font-medium block">Cap Cost</span>
                        <span className="text-xs font-mono font-extrabold text-amber-300 block mt-0.5">
                          ₹{metrics.totalCostLakhs}L
                        </span>
                      </div>
                    </div>

                    {/* Candidate GIS Sites Detail snippet if present */}
                    {hasCandidates && (
                      <div className="mb-3 p-2.5 bg-slate-900/90 rounded-lg border border-cyan-800/60 text-xs text-slate-200 space-y-1">
                        <span className="font-semibold text-cyan-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Imported Real-City Sites:</span>
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sc.importedRealCityCandidates!.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 bg-slate-800 rounded text-[11px] text-slate-200 border border-slate-600 font-medium"
                            >
                              {c.name} ({c.isSimulatable ? 'Mapped' : 'Observation'})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-700/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectScenario(sc.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-200 hover:bg-teal-500/30 border border-teal-500/40 font-semibold transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        <span>Load in Lab</span>
                      </button>

                      <button
                        onClick={() => onGoToCompare(sc.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                        title="Compare against baseline"
                      >
                        <GitCompare className="w-3.5 h-3.5 text-teal-400" />
                        <span className="hidden sm:inline">Compare</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => exportScenarioJson(sc)}
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        title="Export scenario JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingScenario(sc)}
                        className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                        title="Delete saved plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Demonstration Benchmarks Section (Clearly Separated) */}
      <div className="bg-[#101b3b] border border-slate-700/80 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/70 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              <span>System Demonstration Presets (Read-Only Reference Benchmarks)</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Standard pre-calibrated baseline models. Load into Scenario Lab anytime as a starting template.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded border border-slate-700 shrink-0">
            Shared Standards
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {benchmarkPresets.map((preset) => (
            <div
              key={preset.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/70 hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate max-w-[170px]">
                    {preset.name}
                  </h4>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    ₹{preset.results.metrics.totalCostLakhs}L
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-700/60 flex items-center justify-between">
                <div className="text-xs font-mono text-slate-200 font-medium">
                  <span className="text-teal-300 font-bold">{preset.results.metrics.averageTravelTimeMinutes}m</span> avg
                </div>

                <button
                  onClick={() => {
                    if (onLoadPreset) {
                      onLoadPreset(preset.id);
                    } else {
                      onSelectScenario(preset.id);
                    }
                    onGoToLab();
                  }}
                  className="text-xs font-bold text-teal-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>Load in Lab</span>
                  <Play className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rename Scenario Modal */}
      {renamingScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0e1738] border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Rename Scenario</h3>
            <p className="text-xs text-slate-300 mb-4">
              Update the display name of this urban planning scenario.
            </p>

            <form onSubmit={handleConfirmRename} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Scenario Name</label>
                <input
                  type="text"
                  required
                  value={renamingScenario.name}
                  onChange={(e) => setRenamingScenario({ ...renamingScenario, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRenamingScenario(null)}
                  disabled={actionInProgress}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress || !renamingScenario.name.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionInProgress ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0e1738] border border-rose-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-700 flex items-center justify-center text-rose-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Scenario Plan</h3>
                <p className="text-xs text-rose-300 font-medium">Permanent action confirmation</p>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              Are you sure you want to delete <strong className="text-white font-bold">"{deletingScenario.name}"</strong>?
              This will remove the policy interventions from your personal workspace.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingScenario(null)}
                disabled={actionInProgress}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionInProgress}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionInProgress ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase PostgreSQL Configuration & Migration Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0e1738] border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  Supabase PostgreSQL Setup &amp; Migration
                </h3>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <p>
                CityTwin uses Supabase PostgreSQL with Row-Level Security (RLS) to persist urban planning scenarios, candidate site coordinates, and municipal planner accounts.
              </p>

              <div>
                <h4 className="font-semibold text-white mb-1.5 flex items-center justify-between">
                  <span>SQL Migration (`scenarios` Table &amp; Auth RLS):</span>
                  <button
                    onClick={copyMigrationSql}
                    className="flex items-center gap-1 text-[11px] text-teal-300 hover:text-white"
                  >
                    {copiedMigration ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMigration ? 'Copied!' : 'Copy SQL'}</span>
                  </button>
                </h4>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-200 overflow-x-auto max-h-56">
                  {sqlMigrationCode}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-teal-950/40 border border-teal-800/60 text-teal-200">
                <h5 className="font-semibold text-white mb-1">To apply this in your Supabase project:</h5>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                  <li>Open your Supabase dashboard and go to the <strong>SQL Editor</strong>.</li>
                  <li>Click <strong>New query</strong> and paste the migration SQL above.</li>
                  <li>Click <strong>Run</strong>. Scenarios will automatically persist with user isolation.</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
