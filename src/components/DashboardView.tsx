import React from 'react';
import { MetricCards } from './MetricCards';
import { Scenario, CityNetwork } from '../types/simulation';
import { ActiveTab } from './Sidebar';
import { CITY_NODES, getInitialScenarios } from '../simulation/engine';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Globe,
  Compass,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardViewProps {
  currentScenario: Scenario;
  baselineScenario: Scenario;
  scenarios: Scenario[];
  onSelectTab: (tab: ActiveTab) => void;
  onLoadScenario: (scenarioId: string) => void;
  onLoadPreset?: (scenarioId: string) => void;
  onOpenRealCity?: () => void;
  userEmail?: string | null;
  activeNetwork?: CityNetwork;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentScenario,
  baselineScenario,
  scenarios,
  onSelectTab,
  onLoadScenario,
  onLoadPreset,
  onOpenRealCity,
  userEmail,
  activeNetwork,
}) => {
  const currentResult = currentScenario.results;
  const baselineResult = baselineScenario.results;

  const activeNodes = activeNetwork?.nodes || currentScenario.network?.nodes || CITY_NODES;
  const activeSegmentsCount =
    activeNetwork?.roadSegments?.length ||
    currentScenario.network?.roadSegments?.length ||
    Object.keys(currentResult.segmentResults).length;
  const cityName =
    activeNetwork?.cityName ||
    currentScenario.network?.cityName ||
    'CityTwin Benchmark Demo City';

  // Identify bottleneck corridors in current simulation
  const bottlenecks = Object.values(currentResult.segmentResults)
    .filter((s) => s.volumeToCapacityRatio >= 0.85 || s.congestionLevel === 'critical')
    .sort((a, b) => b.volumeToCapacityRatio - a.volumeToCapacityRatio);

  const presets = getInitialScenarios().filter((s) => !s.isBaseline);

  // If user has no personal saved scenarios, display the fresh onboarding workspace
  const isFreshWorkspace = scenarios.length === 0;

  if (isFreshWorkspace) {
    return (
      <div className="space-y-10 max-w-6xl mx-auto">
        {/* Welcome Onboarding Header */}
        <div className="bg-gradient-to-r from-[#0d163a] via-[#101b44] to-[#0d163a] border border-teal-500/30 rounded-2xl p-7 md:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs sm:text-sm font-semibold tracking-wide">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Personal Planning Workspace Initialized</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome to CityTwin{userEmail ? `, ${userEmail.split('@')[0]}` : ''}
            </h1>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
              Your municipal planning dashboard is clean and ready. You have no saved policy packages yet.
              Design multi-modal traffic interventions, simulate congestion outcomes with deterministic BPR physics, and build your scenario repository.
            </p>
          </div>
        </div>

        {/* 3 Prominent Quick Action Cards */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-teal-400" />
              <span>Get Started in 3 Steps</span>
            </h2>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">Select an action to launch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Action 1: Create First Simulation */}
            <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/80 hover:border-teal-500/60 rounded-2xl p-6 sm:p-7 shadow-md transition-all duration-200 flex flex-col justify-between group hover:shadow-lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform shadow-sm">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                  Create Your First Simulation
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Configure adaptive traffic signals, rapid bus priority lanes, and green active walkways. Recalculate travel times and carbon emissions deterministically.
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-700/60">
                <button
                  onClick={() => onSelectTab('scenario_lab')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors shadow-md"
                >
                  <span>Open Scenario Lab</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action 2: Explore Demo City */}
            <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/80 hover:border-cyan-500/60 rounded-2xl p-6 sm:p-7 shadow-md transition-all duration-200 flex flex-col justify-between group hover:shadow-lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform shadow-sm">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Explore Demo City
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Inspect the 4 core civic sectors (General Trauma Center, Polytechnic Hub, Central Bazaar, Tech Park) and observe live baseline vehicle queues.
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-700/60">
                <button
                  onClick={() => onSelectTab('city_map')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-600 text-sm font-semibold transition-colors shadow-md"
                >
                  <span>Explore Demo City Map</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action 3: Open Real City Map */}
            <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/80 hover:border-indigo-500/60 rounded-2xl p-6 sm:p-7 shadow-md transition-all duration-200 flex flex-col justify-between group hover:shadow-lg">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 group-hover:scale-105 transition-transform shadow-sm">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Open Real City Map
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Switch to Google Maps satellite view, inspect real-world municipal corridors, drop GIS candidate markers, and export observation data.
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-700/60">
                <button
                  onClick={() => {
                    if (onOpenRealCity) {
                      onOpenRealCity();
                    } else {
                      onSelectTab('city_map');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-600 text-sm font-semibold transition-colors shadow-md"
                >
                  <span>Open Real City Map</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Step Simulation Engine Workflow */}
        <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-md space-y-5">
          <div className="border-b border-slate-700/70 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-teal-400" />
              <span>How CityTwin Works: The Municipal Planning Lifecycle</span>
            </h3>
            <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950/90 border border-teal-700/60 px-2.5 py-1 rounded-md self-start sm:self-auto">
              BPR Physics Model 4.0
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2.5">
              <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950/90 px-2 py-0.5 rounded border border-teal-700/60 inline-block">
                Step 01
              </span>
              <h4 className="text-sm font-bold text-white">Target Bottlenecks</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Identify acute morning congestion at Hospital Junction and College Road corridors.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2.5">
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-700/60 inline-block">
                Step 02
              </span>
              <h4 className="text-sm font-bold text-white">Apply Interventions</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tune signal preemption, dedicated transit lanes, headways, and tree canopies.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2.5">
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-700/60 inline-block">
                Step 03
              </span>
              <h4 className="text-sm font-bold text-white">Deterministic Math</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Run Bureau of Public Roads equations to calculate exact travel time and emissions.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2.5">
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-700/60 inline-block">
                Step 04
              </span>
              <h4 className="text-sm font-bold text-white">Save &amp; Compare</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Persist policy packages to Supabase and audit deltas against the baseline.
              </p>
            </div>
          </div>
        </div>

        {/* Starting Benchmark Presets */}
        <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/70 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                <span>Or Start from a Demonstration Benchmark Preset</span>
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                Pre-calibrated reference packages. Loading a benchmark allows you to experiment, adjust levers, and save as your own scenario.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-200 bg-slate-800 px-3 py-1 rounded-md border border-slate-600 shrink-0 self-start sm:self-auto">
              Shared Reference
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base font-bold text-white truncate max-w-[190px]">
                      {preset.name}
                    </h4>
                    <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/50">
                      ₹{preset.results.metrics.totalCostLakhs}L
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between">
                  <div className="text-xs sm:text-sm font-mono text-slate-200">
                    <span className="text-teal-300 font-bold">{preset.results.metrics.averageTravelTimeMinutes}m</span> avg
                  </div>

                  <button
                    onClick={() => {
                      if (onLoadPreset) {
                        onLoadPreset(preset.id);
                      } else {
                        onLoadScenario(preset.id);
                      }
                      onSelectTab('scenario_lab');
                    }}
                    className="text-xs sm:text-sm font-semibold text-teal-300 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <span>Load in Lab</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active User Workspace with Saved Scenarios
  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* 4 Main KPI Cards */}
      <MetricCards
        currentResult={currentResult}
        baselineResult={baselineResult}
      />

      {/* City Overview & Mini Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City Network Overview (2 Cols) */}
        <div className="lg:col-span-2 bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/70 mb-5 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    City Network Overview
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {activeNodes.length} Core Civic Hubs · {activeSegmentsCount} Monitored Corridors · {cityName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectTab('city_map')}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors self-start sm:self-auto"
              >
                <span>Full Interactive Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Hub Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {activeNodes.slice(0, 4).map((node) => {
                const nodeRes = currentResult.nodeResults[node.id];
                return (
                  <div
                    key={node.id}
                    className="p-4 bg-slate-900/90 border border-slate-700/80 rounded-xl flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0" />
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {node.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                        {node.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm sm:text-base font-bold text-slate-100 block">
                        {nodeRes?.effectiveDelaySeconds || node.baselineDelaySeconds}s
                      </span>
                      <span className="text-xs text-teal-300 font-mono font-bold bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-700/50 inline-block mt-0.5">
                        {nodeRes?.hasAdaptiveSignal ? `-${nodeRes.delayReductionPercent}%` : 'unmanaged'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Bottleneck Alert Ledger */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-200">
                <span>Critical Corridor Watchlist:</span>
                <span className="font-mono text-slate-300 font-medium">{bottlenecks.length} links under heavy load</span>
              </div>

              <div className="space-y-2">
                {bottlenecks.length === 0 ? (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-700/50 rounded-xl text-xs sm:text-sm text-emerald-200 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>All corridors flowing smoothly. Volume-to-capacity ratios below 0.85.</span>
                  </div>
                ) : (
                  bottlenecks.slice(0, 3).map((seg) => (
                    <div
                      key={seg.segmentId}
                      className="p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs sm:text-sm gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {seg.congestionLevel === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-100 truncate">{seg.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono shrink-0">
                        <span className="text-slate-300 font-medium">{seg.averageSpeedKmh} km/h</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded border text-xs sm:text-sm ${
                            seg.congestionLevel === 'critical'
                              ? 'text-rose-300 bg-rose-950/80 border-rose-700/60'
                              : 'text-amber-300 bg-amber-950/80 border-amber-700/60'
                          }`}
                        >
                          V/C: {seg.volumeToCapacityRatio}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm text-slate-300">
            <span>Hospital Emergency Arterial Priority:</span>
            <span className="font-mono font-bold text-teal-300 text-sm">
              {currentResult.metrics.hospitalCorridorTravelTimeMinutes} min cross-corridor transit
            </span>
          </div>
        </div>

        {/* Goal Assistant Callout & Quick Controls (1 Col) */}
        <div className="space-y-6">
          {/* Planning Assistant Card */}
          <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-teal-500/40 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Planning Goal Assistant
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Synthesize natural language objectives into verified policy levers:
              <em className="text-teal-200 block mt-2 font-medium bg-teal-950/40 p-2.5 rounded-lg border border-teal-800/50 not-italic text-xs sm:text-sm">
                "Reduce congestion around the hospital within a budget of ₹10 lakh."
              </em>
            </p>

            <button
              onClick={() => onSelectTab('assistant')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors shadow-md"
            >
              <span>Open Goal Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Intervention Levers Card */}
          <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/80 rounded-2xl p-6 shadow-md space-y-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
              Active Interventions
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-700/80">
                <span className="text-slate-300 font-medium">Adaptive Signals:</span>
                <span className={`font-mono font-bold ${
                  currentScenario.interventions.adaptiveSignals.enabled ? 'text-teal-300' : 'text-slate-400'
                }`}>
                  {currentScenario.interventions.adaptiveSignals.enabled
                    ? `${currentScenario.interventions.adaptiveSignals.targetNodeIds.length} Nodes`
                    : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-700/80">
                <span className="text-slate-300 font-medium">Bus Priority Corridor:</span>
                <span className={`font-mono font-bold ${
                  currentScenario.interventions.busPriority.enabled ? 'text-cyan-300' : 'text-slate-400'
                }`}>
                  {currentScenario.interventions.busPriority.enabled
                    ? `${currentScenario.interventions.busPriority.targetSegmentIds.length} Corridors`
                    : 'Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-700/80">
                <span className="text-slate-300 font-medium">Green Walkways:</span>
                <span className={`font-mono font-bold ${
                  currentScenario.interventions.greenWalkways.enabled ? 'text-emerald-300' : 'text-slate-400'
                }`}>
                  {currentScenario.interventions.greenWalkways.enabled
                    ? `${currentScenario.interventions.greenWalkways.targetSegmentIds.length} Corridors`
                    : 'Disabled'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('scenario_lab')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors shadow-sm"
            >
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>Adjust Scenario Levers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Your Saved Scenarios Section */}
      <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/70 mb-5 gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Your Saved Policy Packages</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/40">
                {scenarios.length} {scenarios.length === 1 ? 'Plan' : 'Plans'}
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Select any scenario to load into the simulation engine.
            </p>
          </div>

          <button
            onClick={() => onSelectTab('saved_scenarios')}
            className="text-xs sm:text-sm font-semibold text-teal-300 hover:text-teal-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>Repository View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {scenarios.map((sc) => {
            const isActive = sc.id === currentScenario.id;
            return (
              <div
                key={sc.id}
                onClick={() => onLoadScenario(sc.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-950/40 border-teal-500/80 shadow-md ring-1 ring-teal-500/40'
                    : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm sm:text-base font-bold text-white truncate max-w-[150px]">
                    {sc.name}
                  </h4>
                  {isActive ? (
                    <span className="text-xs font-semibold text-teal-200 bg-teal-900/90 px-2 py-0.5 rounded border border-teal-600">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs sm:text-sm font-mono font-bold text-amber-300">
                      ₹{sc.results.metrics.totalCostLakhs}L
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mb-3.5 leading-relaxed">
                  {sc.tagline || sc.description}
                </p>
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-200 border-t border-slate-700/70 pt-2.5 font-medium">
                  <span>{sc.results.metrics.averageTravelTimeMinutes}m avg</span>
                  <span className="text-teal-300 font-bold">{sc.results.metrics.congestionIndex}/100</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
