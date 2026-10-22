import React, { useState } from 'react';
import {
  ScenarioInterventions,
  SimulationResult,
  Scenario,
  RealCityCandidate,
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

  // Toggle helpers
  const handleToggleSignals = () => {
    onChangeInterventions({
      ...interventions,
      adaptiveSignals: {
        ...adaptiveSignals,
        enabled: !adaptiveSignals.enabled,
        targetNodeIds: !adaptiveSignals.enabled && adaptiveSignals.targetNodeIds.length === 0
          ? ['hospital_junction', 'college_road']
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
    onChangeInterventions({
      ...interventions,
      busPriority: {
        ...busPriority,
        enabled: !busPriority.enabled,
        targetSegmentIds: !busPriority.enabled && busPriority.targetSegmentIds.length === 0
          ? ['seg_college_hospital', 'seg_hospital_market']
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
    onChangeInterventions({
      ...interventions,
      greenWalkways: {
        ...greenWalkways,
        enabled: !greenWalkways.enabled,
        targetSegmentIds: !greenWalkways.enabled && greenWalkways.targetSegmentIds.length === 0
          ? ['seg_college_hospital', 'seg_res_college']
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
      {/* Top Banner: Quick Presets Bar */}
      <div className="bg-[#101b3b] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Preconfigured Hackathon Presets
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Load targeted baseline configurations or design custom policy interventions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => onLoadPreset(sc.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                sc.id === 'scenario_hospital_relief'
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/40 hover:bg-teal-500/25'
                  : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>
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
                    {CITY_NODES.map((node) => {
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
                    {ROAD_SEGMENTS.filter((s) => s.hasTransitCorridorPotential).map((seg) => {
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
                    {ROAD_SEGMENTS.filter((s) => s.hasActiveMobilityPotential).map((seg) => {
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

            {/* Editable Budget Cap Input */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300">Municipal Budget Ceiling:</span>
                <span className="font-mono font-bold text-white text-sm">
                  ₹{budgetCapLakhs.toFixed(1)} Lakh
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="0.5"
                value={budgetCapLakhs}
                onChange={(e) =>
                  onChangeInterventions({
                    ...interventions,
                    budgetCapLakhs: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>₹5.0 Lakh</span>
                <span>₹15.0 Lakh</span>
                <span>₹25.0 Lakh</span>
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
                        ROAD_SEGMENTS.filter((s) => busPriority.targetSegmentIds.includes(s.id)).reduce(
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
                        ROAD_SEGMENTS.filter((s) => greenWalkways.targetSegmentIds.includes(s.id)).reduce(
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
