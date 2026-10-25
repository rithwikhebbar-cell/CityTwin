import React, { useState } from 'react';
import { Scenario, SegmentSimulationResult } from '../types/simulation';
import { ROAD_SEGMENTS, MODEL_ASSUMPTIONS } from '../simulation/engine';
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  Clock,
  Activity,
  CloudFog,
  Coins,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  BarChart3,
  BookOpen,
} from 'lucide-react';

interface ComparePlansProps {
  scenarios: Scenario[];
  activeScenario: Scenario;
}

export const ComparePlans: React.FC<ComparePlansProps> = ({
  scenarios,
  activeScenario,
}) => {
  const baselineScenario = scenarios.find((s) => s.isBaseline) || scenarios[0];
  const [scenarioAId, setScenarioAId] = useState<string>(baselineScenario.id);
  const [scenarioBId, setScenarioBId] = useState<string>(activeScenario.id);
  const [showAssumptionDrawer, setShowAssumptionDrawer] = useState<boolean>(false);

  const planA = scenarios.find((s) => s.id === scenarioAId) || baselineScenario;
  const planB = scenarios.find((s) => s.id === scenarioBId) || activeScenario;

  const metA = planA.results.metrics;
  const metB = planB.results.metrics;

  // Deltas (Plan B vs Plan A)
  const deltaTravelTime = Number((metB.averageTravelTimeMinutes - metA.averageTravelTimeMinutes).toFixed(2));
  const deltaTravelPercent = Number(((deltaTravelTime / Math.max(0.1, metA.averageTravelTimeMinutes)) * 100).toFixed(1));

  const deltaCongestion = metB.congestionIndex - metA.congestionIndex;

  const deltaEmissions = metB.estimatedEmissionsKgCO2 - metA.estimatedEmissionsKgCO2;
  const deltaEmissionsPercent = Number(((deltaEmissions / Math.max(1, metA.estimatedEmissionsKgCO2)) * 100).toFixed(1));

  const deltaHospitalCorridor = Number((metB.hospitalCorridorTravelTimeMinutes - metA.hospitalCorridorTravelTimeMinutes).toFixed(2));

  const comparedSegments = planB.network?.roadSegments || planA.network?.roadSegments || ROAD_SEGMENTS;

  // Max travel time for chart scaling
  const maxSegTravelTime = Math.max(
    ...comparedSegments.map((s) =>
      Math.max(
        planA.results.segmentResults[s.id]?.travelTimeMinutes || 0,
        planB.results.segmentResults[s.id]?.travelTimeMinutes || 0
      )
    ),
    10
  );

  return (
    <div className="space-y-6">
      {/* Plan Selectors Bar */}
      <div className="bg-[#101b3b] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Plan Comparison Dashboard
              </h2>
              <p className="text-xs text-slate-400">
                Auditing systemic changes between baseline and proposed interventions.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAssumptionDrawer(!showAssumptionDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-400" />
            <span>{showAssumptionDrawer ? 'Hide Assumptions' : 'Model Assumptions & Formulas'}</span>
          </button>
        </div>

        {/* Dual Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Plan A (Reference / Baseline):
            </label>
            <select
              value={scenarioAId}
              onChange={(e) => setScenarioAId(e.target.value)}
              className="w-full bg-[#0b132b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            >
              {scenarios.map((s) => (
                <option key={`a-${s.id}`} value={s.id}>
                  {s.name} {s.isBaseline ? '(Baseline)' : ''}
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-400 mt-2 truncate">
              {planA.tagline}
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-teal-500/40 rounded-lg">
            <label className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider block mb-1.5">
              Plan B (Proposed Interventions):
            </label>
            <select
              value={scenarioBId}
              onChange={(e) => setScenarioBId(e.target.value)}
              className="w-full bg-[#0b132b] border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            >
              {scenarios.map((s) => (
                <option key={`b-${s.id}`} value={s.id}>
                  {s.name} {s.id === activeScenario.id ? '(Current Lab)' : ''}
                </option>
              ))}
            </select>
            <div className="text-[11px] text-teal-300/80 mt-2 truncate">
              {planB.tagline}
            </div>
          </div>
        </div>
      </div>

      {/* Delta KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Travel Time Delta */}
        <div className="bg-[#0e1738] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between mb-1">
            <span>Avg Travel Time Change</span>
            <Clock className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {metB.averageTravelTimeMinutes}m
            </span>
            <span className="text-xs text-slate-400">from {metA.averageTravelTimeMinutes}m</span>
          </div>
          <div className="mt-2 text-xs font-mono font-medium">
            {deltaTravelTime < 0 ? (
              <span className="text-emerald-400 flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
                {Math.abs(deltaTravelTime)} min saved ({Math.abs(deltaTravelPercent)}%)
              </span>
            ) : deltaTravelTime > 0 ? (
              <span className="text-rose-400 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                +{deltaTravelTime} min slower (+{deltaTravelPercent}%)
              </span>
            ) : (
              <span className="text-slate-400">No net variance</span>
            )}
          </div>
        </div>

        {/* Congestion Delta */}
        <div className="bg-[#0e1738] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between mb-1">
            <span>Congestion Score Delta</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {metB.congestionIndex}
            </span>
            <span className="text-xs text-slate-400">vs {metA.congestionIndex} / 100</span>
          </div>
          <div className="mt-2 text-xs font-mono font-medium">
            {deltaCongestion < 0 ? (
              <span className="text-emerald-400 flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
                {deltaCongestion} points network relief
              </span>
            ) : deltaCongestion > 0 ? (
              <span className="text-rose-400 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                +{deltaCongestion} points increased friction
              </span>
            ) : (
              <span className="text-slate-400">Identical network load</span>
            )}
          </div>
        </div>

        {/* Emissions Delta */}
        <div className="bg-[#0e1738] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between mb-1">
            <span>Peak Period CO₂ Delta</span>
            <CloudFog className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              {metB.estimatedEmissionsKgCO2.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">kg CO₂</span>
          </div>
          <div className="mt-2 text-xs font-mono font-medium">
            {deltaEmissions < 0 ? (
              <span className="text-emerald-400 flex items-center">
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
                {Math.abs(deltaEmissions)} kg avoided ({Math.abs(deltaEmissionsPercent)}%)
              </span>
            ) : deltaEmissions > 0 ? (
              <span className="text-rose-400 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                +{deltaEmissions} kg (+{deltaEmissionsPercent}%)
              </span>
            ) : (
              <span className="text-slate-400">Baseline parity</span>
            )}
          </div>
        </div>

        {/* Capital Expenditure & Cost per Minute */}
        <div className="bg-[#0e1738] border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between mb-1">
            <span>Intervention Capital & Cost/Min</span>
            <Coins className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">
              ₹{metB.totalCostLakhs}
            </span>
            <span className="text-xs text-slate-400">Lakh (Rem: ₹{metB.remainingBudgetLakhs}L)</span>
          </div>
          <div className="mt-2 text-xs font-mono text-teal-300">
            {metB.costPerMinuteSavedLakhs > 0
              ? `₹${metB.costPerMinuteSavedLakhs} Lakh / min saved`
              : 'Zero capital expenditure'}
          </div>
        </div>
      </div>

      {/* Model Assumptions Drawer (Collapsible) */}
      {showAssumptionDrawer && (
        <div className="bg-[#0b142f] border border-teal-500/30 rounded-xl p-5 text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              <h3 className="font-bold text-white text-sm">
                Documented Mathematical Model Assumptions & Formulas
              </h3>
            </div>
            <span className="text-[11px] font-mono text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
              Synthetic Hackathon Model
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed text-slate-300">
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <h4 className="font-semibold text-white mb-1">1. Link Performance (BPR Function)</h4>
              <p className="text-slate-400 mb-2">
                Standard Bureau of Public Roads volume-delay formulation:
              </p>
              <div className="p-2 bg-slate-950 font-mono text-teal-300 rounded text-xs mb-2">
                T = T₀ · [ 1 + α · (V / C)^β ]
              </div>
              <p className="text-[11px] text-slate-400">
                Where α = {MODEL_ASSUMPTIONS.bprAlpha}, β = {MODEL_ASSUMPTIONS.bprBeta}, and T₀ is free-flow travel time.
                Adaptive traffic signals boost downstream exit capacity C by 12% to 20%.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <h4 className="font-semibold text-white mb-1">2. Modal Split & Transit Diversion</h4>
              <p className="text-slate-400 mb-2">
                Commuters diverted from private vehicles to high-capacity buses:
              </p>
              <div className="p-2 bg-slate-950 font-mono text-blue-300 rounded text-xs mb-2">
                Shift % = 12% + (15 - Headway) · 1.2%
              </div>
              <p className="text-[11px] text-slate-400">
                Each 50-passenger peak bus removes approximately 37 passenger cars ({MODEL_ASSUMPTIONS.averageCarOccupancy} passengers/car), freeing road capacity.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <h4 className="font-semibold text-white mb-1">3. Tailpipe Emissions & Speed Penalty</h4>
              <p className="text-slate-400 mb-2">
                Congested stop-and-go speeds (&lt; 25 km/h) penalize fuel consumption:
              </p>
              <div className="p-2 bg-slate-950 font-mono text-emerald-300 rounded text-xs mb-2">
                CO₂ = VKT · 148 g/km · [ 1 + max(0, 30 - Speed) · 0.03 ]
              </div>
              <p className="text-[11px] text-slate-400">
                Electric buses emit {MODEL_ASSUMPTIONS.electricBusCO2PerKmGrams} g/km grid-equivalent vs {MODEL_ASSUMPTIONS.dieselBusCO2PerKmGrams} g/km for diesel buses.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <h4 className="font-semibold text-white mb-1">4. Disclaimer & Scope</h4>
              <p className="text-[11px] text-slate-400">
                This digital twin uses synthetic baseline flows calibrated for hackathon demonstrations.
                Results are deterministic, transparent, and reproducible for policy comparison, but should not be cited as empirical ground-truth municipal measurements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Corridor Travel Time Comparison Chart (SVG Grouped Bars) */}
      <div className="bg-[#101b3b] border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Corridor Peak Travel Time Comparison (Minutes)
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-600 inline-block" />
              <span className="text-slate-400">Plan A: {planA.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-500 inline-block" />
              <span className="text-teal-300 font-medium">Plan B: {planB.name}</span>
            </div>
          </div>
        </div>

        {/* SVG Grouped Horizontal Bars */}
        <div className="pt-4 space-y-3">
          {comparedSegments.map((seg) => {
            const resA = planA.results.segmentResults[seg.id];
            const resB = planB.results.segmentResults[seg.id];

            const timeA = resA?.travelTimeMinutes || 0;
            const timeB = resB?.travelTimeMinutes || 0;
            const delta = Number((timeB - timeA).toFixed(2));

            const pctA = Math.min(100, (timeA / maxSegTravelTime) * 100);
            const pctB = Math.min(100, (timeB / maxSegTravelTime) * 100);

            return (
              <div key={`comp-bar-${seg.id}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
                    {seg.name}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">{timeA}m</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="font-bold text-teal-300">{timeB}m</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        delta < 0 ? 'text-emerald-400' : delta > 0 ? 'text-rose-400' : 'text-slate-500'
                      }`}
                    >
                      ({delta > 0 ? `+${delta}` : delta}m)
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  {/* Plan A bar */}
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 rounded-full transition-all duration-300"
                      style={{ width: `${pctA}%` }}
                    />
                  </div>
                  {/* Plan B bar */}
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${pctB}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Segment-by-Segment Audit Table */}
      <div className="bg-[#101b3b] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Corridor-by-Corridor Diagnostic Audit
          </h3>
          <p className="text-xs text-slate-400">
            Comparing link capacity, vehicle velocity, and emissions output.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b132b] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Corridor Segment</th>
                <th className="py-3 px-3 font-semibold text-right">Length</th>
                <th className="py-3 px-3 font-semibold text-right">Plan A V/C</th>
                <th className="py-3 px-3 font-semibold text-right">Plan B V/C</th>
                <th className="py-3 px-3 font-semibold text-right">Avg Speed</th>
                <th className="py-3 px-3 font-semibold text-right">CO₂ Delta</th>
                <th className="py-3 px-4 font-semibold text-center">Status Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {ROAD_SEGMENTS.map((seg) => {
                const resA = planA.results.segmentResults[seg.id];
                const resB = planB.results.segmentResults[seg.id];

                const co2Delta = Number((resB.emissionsKgCO2 - resA.emissionsKgCO2).toFixed(1));

                return (
                  <tr key={`row-${seg.id}`} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">
                      {seg.name}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {seg.lengthKm} km
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {resA.volumeToCapacityRatio}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-teal-300">
                      {resB.volumeToCapacityRatio}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {resA.averageSpeedKmh} → {resB.averageSpeedKmh} km/h
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold ${
                      co2Delta < 0 ? 'text-emerald-400' : co2Delta > 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {co2Delta > 0 ? `+${co2Delta}` : co2Delta} kg
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          resB.congestionLevel === 'low'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                            : resB.congestionLevel === 'moderate'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                        }`}
                      >
                        {resB.congestionLevel.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
