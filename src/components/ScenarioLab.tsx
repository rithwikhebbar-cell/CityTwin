import React, { useState } from 'react';
import {
  ScenarioInterventions,
  SimulationResult,
  Scenario,
  RealCityCandidate,
  CityNode,
  RoadSegment,
} from '../types/simulation';
import { CITY_NODES, ROAD_SEGMENTS } from '../simulation/engine';
import {
  Sliders,
  Bus,
  Trees,
  TrafficCone,
  Coins,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  ArrowRight,
  Sparkles,
  Info,
  MapPin,
  Globe,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

interface ScenarioLabProps {
  interventions: ScenarioInterventions;
  onChangeInterventions: (newInterventions: ScenarioInterventions) => void;
  simulationResult: SimulationResult;
  baselineResult: SimulationResult;
  scenarios: Scenario[];
  activeScenario?: Scenario;
  nodes?: CityNode[];
  roadSegments?: RoadSegment[];
  cityName?: string;
  onLoadPreset: (scenarioId: string) => void;
  onSaveScenario: (name: string, description: string, overwriteExistingId?: string) => void;
  onGoToCompare: () => void;
  importedCandidates?: RealCityCandidate[];
  onRemoveImportedCandidate?: (candidateId: string) => void;
  onReapplyCandidate?: (candidate: RealCityCandidate) => void;
  onGoToRealCity?: () => void;
}

export const ScenarioLab: React.FC<ScenarioLabProps> = ({
  interventions,
  onChangeInterventions,
  simulationResult,
  baselineResult,
  scenarios,
  activeScenario,
  nodes = CITY_NODES,
  roadSegments = ROAD_SEGMENTS,
  cityName = 'CityTwin Benchmark Demo City',
  onLoadPreset,
  onSaveScenario,
  onGoToCompare,
  importedCandidates = [],
  onRemoveImportedCandidate,
  onReapplyCandidate,
  onGoToRealCity,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMode, setSaveMode] = useState<'update' | 'new'>('new');
  const [scenarioName, setScenarioName] = useState('My Urban Plan');
  const [scenarioDescription, setScenarioDescription] = useState('Custom multi-modal policy package.');

  const isCustomActiveScenario = Boolean(
    activeScenario && !activeScenario.isBaseline && !activeScenario.isPreset
  );

  const { adaptiveSignals, busPriority, greenWalkways, budgetCapLakhs } = interventions;
  const { metrics } = simulationResult;

  // Deduplicate scenarios at data-source level while preserving genuinely distinct presets
  const deduplicatedScenarios = React.useMemo(() => {
    const list: Scenario[] = [];
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();

    for (const sc of scenarios) {
      if (!sc || !sc.id) continue;
      if (seenIds.has(sc.id)) continue;

      const normName = (sc.shortName || sc.name || '').trim().toLowerCase();
      const cityKey = (sc.network?.cityName || '').trim().toLowerCase();
      const dedupeKey = `${normName}__${cityKey}`;

      if (seenKeys.has(dedupeKey)) continue;

      seenIds.add(sc.id);
      seenKeys.add(dedupeKey);
      list.push(sc);
    }
    return list;
  }, [scenarios]);

  // Check for unavailable network elements in active configuration vs current active network
  const activeTargetNodeIds = adaptiveSignals.enabled ? adaptiveSignals.targetNodeIds : [];
  const activeTargetSegmentIds = [
    ...(busPriority.enabled ? busPriority.targetSegmentIds : []),
    ...(greenWalkways.enabled ? greenWalkways.targetSegmentIds : []),
  ];

  const unavailableNodeIds = activeTargetNodeIds.filter((id) => !nodes.some((n) => n.id === id));
  const unavailableSegmentIds = activeTargetSegmentIds.filter((id) => !roadSegments.some((s) => s.id === id));
  const hasTopologyMismatch = unavailableNodeIds.length > 0 || unavailableSegmentIds.length > 0;

  // Toggle helpers
  const handleToggleSignals = () => {
    const defaultTargets = nodes.slice(0, 2).map((n) => n.id);
    onChangeInterventions({
      ...interventions,
      adaptiveSignals: {
        ...adaptiveSignals,
        enabled: !adaptiveSignals.enabled,
        targetNodeIds: !adaptiveSignals.enabled && adaptiveSignals.targetNodeIds.length === 0
          ? defaultTargets
          : adaptiveSignals.targetNodeIds,
      },
    });
  };

  const handleToggleSignalNode = (nodeId: string) => {
    const current = adaptiveSignals.targetNodeIds;
    const next = current.includes(nodeId)
      ? current.filter((id) => id !== nodeId)
      : [...current, nodeId];
    onChangeInterventions({
      ...interventions,
      adaptiveSignals: {
        ...adaptiveSignals,
        targetNodeIds: next,
      },
    });
  };

  const handleToggleBusPriority = () => {
    const defaultTargets = roadSegments.slice(0, 2).map((s) => s.id);
    onChangeInterventions({
      ...interventions,
      busPriority: {
        ...busPriority,
        enabled: !busPriority.enabled,
        targetSegmentIds: !busPriority.enabled && busPriority.targetSegmentIds.length === 0
          ? defaultTargets
          : busPriority.targetSegmentIds,
      },
    });
  };

  const handleToggleBusSegment = (segId: string) => {
    const current = busPriority.targetSegmentIds;
    const next = current.includes(segId)
      ? current.filter((id) => id !== segId)
      : [...current, segId];
    onChangeInterventions({
      ...interventions,
      busPriority: {
        ...busPriority,
        targetSegmentIds: next,
      },
    });
  };

  const handleToggleGreenWalkways = () => {
    const defaultTargets = roadSegments.slice(0, 2).map((s) => s.id);
    onChangeInterventions({
      ...interventions,
      greenWalkways: {
        ...greenWalkways,
        enabled: !greenWalkways.enabled,
        targetSegmentIds: !greenWalkways.enabled && greenWalkways.targetSegmentIds.length === 0
          ? defaultTargets
          : greenWalkways.targetSegmentIds,
      },
    });
  };

  const handleToggleGreenSegment = (segId: string) => {
    const current = greenWalkways.targetSegmentIds;
    const next = current.includes(segId)
      ? current.filter((id) => id !== segId)
      : [...current, segId];
    onChangeInterventions({
      ...interventions,
      greenWalkways: {
        ...greenWalkways,
        targetSegmentIds: next,
      },
    });
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim()) return;
    const overwriteId = isCustomActiveScenario && saveMode === 'update' ? activeScenario?.id : undefined;
    onSaveScenario(scenarioName.trim(), scenarioDescription.trim(), overwriteId);
    setShowSaveModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Preconfigured Hackathon Presets & Scenario Selector */}
      <div className="bg-[#101b3b] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Preconfigured Hackathon Presets
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-teal-500/15 text-teal-300 border border-teal-500/30">
                City: {cityName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select calibrated baseline policy models. Selecting any preset atomically updates network topology, target junctions, corridors, and budget allocation.
            </p>
          </div>

          {activeScenario && (
            <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/80">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">
                Active Plan: <strong className="text-teal-300">{activeScenario.shortName || activeScenario.name}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Responsive Grid of Compact Preset Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {deduplicatedScenarios.map((sc) => {
            const isSelected = activeScenario?.id === sc.id;
            const displayName =
              sc.shortName ||
              (sc.name.length > 22 ? `${sc.name.slice(0, 20)}…` : sc.name);
            const budget = sc.interventions?.budgetCapLakhs ?? 15;
            const isRegionalModel = Boolean(sc.network && sc.network.isImported);

            // Contextual category badge
            let categoryLabel = 'Benchmark';
            let categoryColor = 'bg-slate-800 text-slate-300 border-slate-700';
            if (sc.id === 'scenario_baseline') {
              categoryLabel = 'Reference';
              categoryColor = 'bg-slate-800/80 text-slate-400 border-slate-700';
            } else if (sc.id === 'scenario_hospital_relief') {
              categoryLabel = 'Healthcare';
              categoryColor = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
            } else if (sc.id === 'scenario_transit_priority') {
              categoryLabel = 'Rapid BRT';
              categoryColor = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
            } else if (sc.id === 'scenario_green_active') {
              categoryLabel = 'Active Travel';
              categoryColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
            } else if (sc.id === 'scenario_transit_modeshare') {
              categoryLabel = 'Mode-Share';
              categoryColor = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
            } else if (sc.id === 'scenario_dharmasthala_model' || isRegionalModel) {
              categoryLabel = 'Pilgrim Hub';
              categoryColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
            }

            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => onLoadPreset(sc.id)}
                title={`${sc.name} — ${sc.description || sc.tagline}`}
                aria-label={`Load preset ${sc.name}`}
                className={`relative flex flex-col justify-between text-left p-3.5 rounded-xl border transition-all duration-200 group cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-teal-950/70 to-slate-900 border-teal-400 text-white shadow-xl shadow-teal-500/10 ring-1 ring-teal-400/50 scale-[1.01]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                {/* Header row inside card */}
                <div className="flex items-center justify-between w-full mb-2 gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${categoryColor}`}>
                    {categoryLabel}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-300/90">
                    ₹{budget}L
                  </span>
                </div>

                {/* Preset Display Name & Short Description */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    )}
                    <h3 className={`text-xs font-bold tracking-tight line-clamp-1 ${
                      isSelected ? 'text-teal-200' : 'text-slate-100 group-hover:text-white'
                    }`}>
                      {displayName}
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {sc.description || sc.tagline}
                  </p>
                </div>

                {/* Footer status row */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] w-full">
                  <span className={`font-semibold flex items-center gap-1.5 ${
                    isSelected ? 'text-teal-300' : 'text-slate-500 group-hover:text-slate-300'
                  }`}>
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Apply Preset</span>
                    )}
                  </span>
                  {isSelected && (
                    <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-mono text-[9px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Prominent Active Scenario Detail & Synchronization Bar */}
        {activeScenario && (
          <div className="mt-2 p-3.5 rounded-xl bg-slate-900/90 border border-teal-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs shadow-inner">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Active Preset
                </span>
                <h4 className="font-bold text-white text-sm tracking-tight">
                  {activeScenario.name}
                </h4>
                <span className="text-slate-400 text-xs hidden sm:inline">
                  • {activeScenario.tagline}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed max-w-3xl">
                {activeScenario.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-slate-800 text-[11px] text-slate-300 font-mono">
                Budget: <strong className="text-amber-300 font-bold">₹{budgetCapLakhs}L</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-slate-800 text-[11px] text-slate-300 font-mono">
                Network: <strong className="text-teal-300 font-bold">{cityName}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Network Element Mismatch Warning (if active preset targets missing junctions/corridors) */}
        {hasTopologyMismatch && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-white text-xs">
                  Network Element Mismatch Detected ({unavailableNodeIds.length + unavailableSegmentIds.length} Unmatched Target{unavailableNodeIds.length + unavailableSegmentIds.length === 1 ? '' : 's'})
                </span>
                <p className="text-[11px] text-amber-300/90 mt-0.5">
                  The active policy targets junction IDs ({unavailableNodeIds.join(', ') || 'none'}) or corridor IDs ({unavailableSegmentIds.join(', ') || 'none'}) that are not in the current network (<strong>{cityName}</strong>).
                  {activeScenario?.network && activeScenario.network.cityName !== cityName && (
                    <> This plan was designed for <strong>{activeScenario.network.cityName}</strong>.</>
                  )}
                </p>
              </div>
            </div>

            {activeScenario?.network && (
              <button
                type="button"
                onClick={() => onLoadPreset(activeScenario.id)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-semibold text-xs whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Synchronize to {activeScenario.network.cityName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dedicated Section: Imported Real-City Candidates */}
      {importedCandidates && importedCandidates.length > 0 ? (
        <div className="bg-[#0b132b] border border-teal-500/40 rounded-xl p-5 space-y-4 shadow-xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Imported Real-City Candidates
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[10px] font-semibold border border-teal-500/30">
                    {importedCandidates.length} Active {importedCandidates.length === 1 ? 'Site' : 'Sites'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Real-world GIS locations imported from Google Maps Platform for policy simulation &amp; feasibility audit.
                </p>
              </div>
            </div>

            {onGoToRealCity && (
              <button
                type="button"
                onClick={onGoToRealCity}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-700 hover:border-teal-500/40 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Manage in Real City Map</span>
              </button>
            )}
          </div>

          {/* Network Mapping Notice */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400">
              <strong className="text-slate-200">Simulation Integrity:</strong> Validated benchmark mappings automatically activate their respective deterministic calculation controls below. Unmapped locations are tracked as field observations without generating fabricated simulation metrics.
            </p>
          </div>

          {/* Candidate Site Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {importedCandidates.map((candidate) => {
              return (
                <div
                  key={candidate.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-2.5 ${
                    candidate.isSimulatable
                      ? 'bg-slate-900/80 border-teal-500/40 shadow-sm'
                      : 'bg-slate-900/50 border-amber-500/30'
                  }`}
                >
                  {/* Card Title & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-sm tracking-tight">{candidate.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {candidate.position.lat.toFixed(4)}, {candidate.position.lng.toFixed(4)}
                      </div>
                    </div>

                    {onRemoveImportedCandidate && (
                      <button
                        type="button"
                        onClick={() => onRemoveImportedCandidate(candidate.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Remove from active scenario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Intervention Category Tag */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                      {candidate.category === 'adaptiveSignals' && <Sliders className="w-3 h-3 text-amber-400" />}
                      {candidate.category === 'busPriority' && <Bus className="w-3 h-3 text-sky-400" />}
                      {candidate.category === 'greenWalkways' && <Trees className="w-3 h-3 text-emerald-400" />}
                      {candidate.category === 'emergencyRoute' && <ShieldCheck className="w-3 h-3 text-teal-400" />}
                      <span>
                        {candidate.category === 'adaptiveSignals'
                          ? 'Adaptive Signals'
                          : candidate.category === 'busPriority'
                          ? 'Bus Priority BRT'
                          : candidate.category === 'greenWalkways'
                          ? 'Green Walkways'
                          : candidate.category === 'emergencyRoute'
                          ? 'Emergency Arterial Feeder'
                          : 'Field Observation'}
                      </span>
                    </span>

                    {candidate.isSimulatable ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Simulation Active</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Unmapped (Field Observation)</span>
                      </span>
                    )}
                  </div>

                  {/* Benchmark Mapping Explanation */}
                  <div className="p-2.5 rounded-lg bg-black/40 text-[11px] text-slate-300 border border-slate-800/80 space-y-1">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">
                      Benchmark Corridor Mapping
                    </div>
                    {candidate.isSimulatable ? (
                      <div className="text-teal-300 font-medium">
                        Mapped to: <span className="font-semibold text-white">{candidate.mappedBenchmarkName || candidate.mappedBenchmarkId}</span>
                      </div>
                    ) : (
                      <div className="text-amber-300/90 italic">
                        Unmapped to benchmark network — observational field site. Quantitative simulation results are not fabricated.
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {candidate.notes && (
                    <div className="text-[11px] text-slate-400 italic">
                      &quot;{candidate.notes}&quot;
                    </div>
                  )}

                  {/* Sync / Reapply Button */}
                  {candidate.isSimulatable && onReapplyCandidate && (
                    <button
                      type="button"
                      onClick={() => onReapplyCandidate(candidate)}
                      className="w-full py-1.5 px-3 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-sync Intervention Controls</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-[#0b132b]/60 border border-dashed border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <span>No real-city candidate sites imported yet. Explore real-world locations in Google Maps and click &quot;Send to Scenario Lab&quot; to test candidate policies.</span>
          </div>
          {onGoToRealCity && (
            <button
              type="button"
              onClick={onGoToRealCity}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Explore Real City</span>
            </button>
          )}
        </div>
      )}

      {/* Main Grid: Controls + Live Fiscal Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Policy Levers */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Adaptive Signal Optimization Card */}
          <div className={`bg-[#0d1633] border rounded-xl p-5 transition-all ${
            adaptiveSignals.enabled ? 'border-teal-500/40 shadow-sm' : 'border-slate-800/80 opacity-90'
          }`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  adaptiveSignals.enabled
                    ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  <TrafficCone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    1. Adaptive Traffic Signal Optimization
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dynamic cycle allocation and green wave coordination across critical bottlenecks.
                  </p>
                </div>
              </div>

              {/* Master Switch */}
              <button
                onClick={handleToggleSignals}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  adaptiveSignals.enabled ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    adaptiveSignals.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {adaptiveSignals.enabled && (
              <div className="space-y-4 pt-3 border-t border-slate-800">
                {/* Target Nodes Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Target Junction Hubs (₹1.5 Lakh per junction):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {nodes.map((node) => {
                      const isTargeted = adaptiveSignals.targetNodeIds.includes(node.id);
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => handleToggleSignalNode(node.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition-colors ${
                            isTargeted
                              ? 'bg-teal-950/60 text-teal-300 border-teal-500/50'
                              : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className="truncate">{node.shortName}</span>
                          {isTargeted && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optimization Level Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300">
                      Sensor Sensitivity & Green-Wave Level:
                    </span>
                    <span className="font-mono text-teal-400 font-semibold">
                      Level {adaptiveSignals.optimizationLevel} (up to +{adaptiveSignals.optimizationLevel * 4}% capacity)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={adaptiveSignals.optimizationLevel}
                    onChange={(e) =>
                      onChangeInterventions({
                        ...interventions,
                        adaptiveSignals: {
                          ...adaptiveSignals,
                          optimizationLevel: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-teal-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Level 1: Basic Loop</span>
                    <span>Level 3: Corridor Sync</span>
                    <span>Level 5: Real-Time Wave</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Bus Priority Transit Corridor Card */}
          <div className={`bg-[#0d1633] border rounded-xl p-5 transition-all ${
            busPriority.enabled ? 'border-blue-500/40 shadow-sm' : 'border-slate-800/80 opacity-90'
          }`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  busPriority.enabled
                    ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    2. Bus-Priority Transit Corridor
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dedicated busways, high-frequency headways, and electric fleet transit shift.
                  </p>
                </div>
              </div>

              {/* Master Switch */}
              <button
                onClick={handleToggleBusPriority}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  busPriority.enabled ? 'bg-blue-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    busPriority.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {busPriority.enabled && (
              <div className="space-y-4 pt-3 border-t border-slate-800">
                {/* Target Corridors */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Designated Transit Road Segments (₹2.2 Lakh/km):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(roadSegments.some((s) => s.hasTransitCorridorPotential)
                      ? roadSegments.filter((s) => s.hasTransitCorridorPotential)
                      : roadSegments
                    ).map((seg) => {
                      const isTargeted = busPriority.targetSegmentIds.includes(seg.id);
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => handleToggleBusSegment(seg.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition-colors ${
                            isTargeted
                              ? 'bg-blue-950/60 text-blue-200 border-blue-500/50'
                              : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <span className="block truncate font-semibold text-slate-200">{seg.name}</span>
                            <span className="text-[10px] text-slate-400">{seg.lengthKm} km · {seg.lanes} lanes</span>
                          </div>
                          {isTargeted && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dedicated Lane Allocation Toggle */}
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Enforce Exclusive Bus Lane
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Guarantees uninterrupted transit velocity (+₹0.6L/km for barriers/paint).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={busPriority.dedicatedLane}
                    onChange={(e) =>
                      onChangeInterventions({
                        ...interventions,
                        busPriority: {
                          ...busPriority,
                          dedicatedLane: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                  />
                </div>

                {/* Service Headway & Electric Fleet Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300">Peak Bus Headway:</span>
                      <span className="font-mono text-blue-400 font-semibold">
                        Every {busPriority.frequencyMin} min
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="15"
                      step="1"
                      value={busPriority.frequencyMin}
                      onChange={(e) =>
                        onChangeInterventions({
                          ...interventions,
                          busPriority: {
                            ...busPriority,
                            frequencyMin: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-blue-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300">Electric Bus Share:</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {busPriority.electricFleetShare}% EV
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={busPriority.electricFleetShare}
                      onChange={(e) =>
                        onChangeInterventions({
                          ...interventions,
                          busPriority: {
                            ...busPriority,
                            electricFleetShare: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Walking Routes & Green Buffers Card */}
          <div className={`bg-[#0d1633] border rounded-xl p-5 transition-all ${
            greenWalkways.enabled ? 'border-emerald-500/40 shadow-sm' : 'border-slate-800/80 opacity-90'
          }`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  greenWalkways.enabled
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  <Trees className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    3. Walking Routes & Urban Green Space
                  </h3>
                  <p className="text-xs text-slate-400">
                    Protected pedestrian sidewalks, urban tree canopies, and commercial pedestrianization.
                  </p>
                </div>
              </div>

              {/* Master Switch */}
              <button
                onClick={handleToggleGreenWalkways}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  greenWalkways.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    greenWalkways.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {greenWalkways.enabled && (
              <div className="space-y-4 pt-3 border-t border-slate-800">
                {/* Target Segments */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Active Mobility Corridors (₹1.1 Lakh/km):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(roadSegments.some((s) => s.hasActiveMobilityPotential)
                      ? roadSegments.filter((s) => s.hasActiveMobilityPotential)
                      : roadSegments
                    ).map((seg) => {
                      const isTargeted = greenWalkways.targetSegmentIds.includes(seg.id);
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => handleToggleGreenSegment(seg.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border text-left flex items-center justify-between transition-colors ${
                            isTargeted
                              ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/50'
                              : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <span className="block truncate font-semibold text-slate-200">{seg.name}</span>
                            <span className="text-[10px] text-slate-400">{seg.lengthKm} km path</span>
                          </div>
                          {isTargeted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pedestrianize Market Square */}
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Pedestrianize Market Square Bazaar Plaza (+₹1.5 Lakh)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Diverts 35% through-traffic around historic shopping quarter into a pedestrian haven.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={greenWalkways.pedestrianizeMarketSquare}
                    onChange={(e) =>
                      onChangeInterventions({
                        ...interventions,
                        greenWalkways: {
                          ...greenWalkways,
                          pedestrianizeMarketSquare: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                {/* Tree Canopy Density Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Tree Canopy & Shading Density:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      Density Tier {greenWalkways.canopyCoverageDensity}/5
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={greenWalkways.canopyCoverageDensity}
                    onChange={(e) =>
                      onChangeInterventions({
                        ...interventions,
                        greenWalkways: {
                          ...greenWalkways,
                          canopyCoverageDensity: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Sparse Planters</span>
                    <span>Continuous Canopy</span>
                    <span>Full Bioswale & Parklet</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Live Fiscal Calculation & Action Deck */}
        <div className="space-y-5">
          {/* Budget Constraint Card */}
          <div className="bg-[#101b3b] border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Fiscal Budget Envelope
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Capital Limit</span>
            </div>

            {/* Flexible Municipal Budget Ceiling Input */}
            <div className="mb-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Municipal Budget Allocation:</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-white text-sm block">
                    {budgetCapLakhs >= 100
                      ? `₹${(budgetCapLakhs / 100).toFixed(2)} Cr`
                      : `₹${budgetCapLakhs.toFixed(1)} Lakh`}
                  </span>
                  {budgetCapLakhs >= 100 && (
                    <span className="text-[10px] text-teal-400 font-mono">
                      ({budgetCapLakhs.toFixed(1)} Lakhs)
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Scale Presets */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                {[
                  { label: '₹10L', val: 10 },
                  { label: '₹25L', val: 25 },
                  { label: '₹50L', val: 50 },
                  { label: '₹1 Cr', val: 100 },
                  { label: '₹5 Cr', val: 500 },
                  { label: '₹10 Cr', val: 1000 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() =>
                      onChangeInterventions({
                        ...interventions,
                        budgetCapLakhs: preset.val,
                      })
                    }
                    className={`py-1 px-1 rounded text-[10px] font-mono font-semibold transition-colors border ${
                      budgetCapLakhs === preset.val
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Direct Numerical Input & Range Slider */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-400 text-[11px] font-mono shrink-0">₹ Lakhs:</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={budgetCapLakhs}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed) && parsed > 0) {
                      onChangeInterventions({
                        ...interventions,
                        budgetCapLakhs: Number(parsed.toFixed(2)),
                      });
                    }
                  }}
                  className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <input
                  type="range"
                  min="1"
                  max={Math.max(50, Math.ceil(budgetCapLakhs * 1.5))}
                  step={budgetCapLakhs > 100 ? 5 : 0.5}
                  value={budgetCapLakhs}
                  onChange={(e) =>
                    onChangeInterventions({
                      ...interventions,
                      budgetCapLakhs: Number(e.target.value),
                    })
                  }
                  className="flex-1 accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  Signal Optimization:
                </span>
                <span className="font-mono">
                  {adaptiveSignals.enabled
                    ? `₹${(adaptiveSignals.targetNodeIds.length * adaptiveSignals.costPerNodeLakhs).toFixed(2)}L`
                    : '₹0.00L'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Bus Corridor Infrastructure:
                </span>
                <span className="font-mono">
                  {busPriority.enabled
                    ? `₹${(
                        roadSegments.filter((s) => busPriority.targetSegmentIds.includes(s.id)).reduce(
                          (sum, s) => sum + s.lengthKm,
                          0
                        ) *
                        (busPriority.costPerKmLakhs + (busPriority.dedicatedLane ? 0.6 : 0))
                      ).toFixed(2)}L`
                    : '₹0.00L'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Green Walkways & Plazas:
                </span>
                <span className="font-mono">
                  {greenWalkways.enabled
                    ? `₹${(
                        roadSegments.filter((s) => greenWalkways.targetSegmentIds.includes(s.id)).reduce(
                          (sum, s) => sum + s.lengthKm,
                          0
                        ) *
                          greenWalkways.costPerKmLakhs +
                        (greenWalkways.pedestrianizeMarketSquare ? 1.5 : 0)
                      ).toFixed(2)}L`
                    : '₹0.00L'}
                </span>
              </div>

              {/* Total Spent vs Cap */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm font-semibold">
                <span className="text-white">Total Intervention Cost:</span>
                <span className={`font-mono ${metrics.isOverBudget ? 'text-rose-400' : 'text-teal-300'}`}>
                  ₹{metrics.totalCostLakhs} Lakh
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Remaining Cushion:</span>
                <span
                  className={`font-mono font-medium ${
                    metrics.isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {metrics.isOverBudget
                    ? `-₹${Math.abs(metrics.remainingBudgetLakhs)}L (Deficit)`
                    : `+₹${metrics.remainingBudgetLakhs}L`}
                </span>
              </div>
            </div>

            {/* Over-budget Warning */}
            {metrics.isOverBudget && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Budget Constraint Exceeded</span>
                  Reduce corridor coverage or raise budget cap before council submission.
                </div>
              </div>
            )}
          </div>

          {/* Impact Quick Check Card */}
          <div className="bg-[#101b3b] border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Projected System Impact
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hospital Corridor Delay:</span>
                <span className="font-mono font-bold text-white">
                  {metrics.hospitalCorridorTravelTimeMinutes} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Public Transit Mode Share:</span>
                <span className="font-mono font-bold text-blue-300">
                  {metrics.publicTransitSharePercent}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Mobility Mode Share:</span>
                <span className="font-mono font-bold text-emerald-300">
                  {metrics.totalActiveMobilitySharePercent}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Fiscal Efficiency:</span>
                <span className="font-mono text-teal-400">
                  {metrics.costPerMinuteSavedLakhs > 0
                    ? `₹${metrics.costPerMinuteSavedLakhs}L / min saved`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={() => setShowSaveModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-teal-400" />
                <span>Save As Named Plan</span>
              </button>

              <button
                onClick={onGoToCompare}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors"
              >
                <span>Compare With Baseline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Scenario Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0e1738] border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Save Urban Plan</h3>
            <p className="text-xs text-slate-400 mb-4">
              Persist this policy configuration and imported real-city GIS sites.
            </p>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              {isCustomActiveScenario && (
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">Save Target Mode</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSaveMode('update');
                        setScenarioName(activeScenario?.name || scenarioName);
                      }}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        saveMode === 'update'
                          ? 'bg-teal-500/20 border-teal-500/60 text-white font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Update Active Plan</span>
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5 truncate">
                        Avoid duplicate scenarios
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSaveMode('new');
                        setScenarioName(`${activeScenario?.name || 'Plan'} (Copy)`);
                      }}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        saveMode === 'new'
                          ? 'bg-teal-500/20 border-teal-500/60 text-white font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Save As New Copy</span>
                      <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                        Creates distinct record
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g. Hospital Corridor Pilot 2026"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={scenarioDescription}
                  onChange={(e) => setScenarioDescription(e.target.value)}
                  placeholder="Policy intent, key corridor focus, or budget assumptions..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
