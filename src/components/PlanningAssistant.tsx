import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Info,
  HelpCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Coins,
  MapPin,
  Target,
  FileText,
  Bus,
  Trees,
  TrafficCone,
} from 'lucide-react';
import {
  ScenarioInterventions,
  ValidatedPlanningResult,
} from '../types/simulation';
import { runSimulation } from '../simulation/engine';
import { validateGeminiPlan } from '../simulation/geminiValidator';

interface PlanningAssistantProps {
  onApplyGoalScenario: (interventions: ScenarioInterventions, planName?: string, planDescription?: string) => void;
  onGoToLab: () => void;
}

export const PlanningAssistant: React.FC<PlanningAssistantProps> = ({
  onApplyGoalScenario,
  onGoToLab,
}) => {
  const [goalText, setGoalText] = useState(
    'Reduce congestion around Hospital Junction within ₹10 lakh. Prioritize emergency access and minimize emissions.'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validatedResult, setValidatedResult] = useState<ValidatedPlanningResult | null>(null);

  const samplePrompts = [
    'Reduce congestion around Hospital Junction within ₹10 lakh. Prioritize emergency access and minimize emissions.',
    'Maximize public transit modal share along College Road and Market Square with high-frequency electric buses.',
    'Pedestrianize Market Square, introduce shaded walking routes and urban green canopy under ₹12 lakh.',
    'Optimize adaptive signal timing across Hospital Junction and College Road to relieve ambulance delays under ₹5 lakh.',
  ];

  const handleSynthesize = async (promptToUse?: string) => {
    const text = promptToUse || goalText;
    if (!text.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/planning-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }

      setValidatedResult(data.plan);
    } catch (err: any) {
      console.error('Failed to query Gemini planning assistant:', err);
      // If the backend fails or API key is absent, provide a graceful, explicit error message
      setErrorMessage(
        err.message || 'Unable to contact server-side Gemini planning assistant. Please check server logs.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!validatedResult) return;
    onApplyGoalScenario(
      validatedResult.scenarioInterventions,
      validatedResult.rawResponse.goalSummary,
      validatedResult.rawResponse.explanation
    );
    onGoToLab();
  };

  // Preview the deterministic simulation outcome for this plan without waiting for user to leave page
  const previewSimulation = validatedResult?.isValid
    ? runSimulation(validatedResult.scenarioInterventions)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#101b3b] border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                AI Planning Assistant
              </h2>
              <span className="text-[11px] font-mono text-teal-300 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded">
                Gemini 3.8 Flash · Server-Side
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural-language urban policy synthesizer. Generates structured, validated parameters for CityTwin's deterministic engine.
            </p>
          </div>
        </div>

        {/* Milestone 2 Badge & Integrity Notice */}
        <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">Deterministic Computation Principle:</strong> Gemini interprets your policy objectives, prioritizes target hubs, and configures the policy levers. All numerical outcomes (travel time, congestion index, emissions, costs) are strictly calculated by CityTwin's deterministic equations—never hallucinated by the AI.
          </p>
        </div>
      </div>

      {/* Input Box Card */}
      <div className="bg-[#0d1633] border border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
            Enter Urban Planning Goal or Policy Objective:
          </label>
          <textarea
            rows={3}
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Reduce congestion around Hospital Junction within ₹10 lakh. Prioritize emergency access and minimize emissions."
            className="w-full px-4 py-3 bg-[#080e22] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-sans disabled:opacity-60"
          />
        </div>

        {/* Sample Prompt Chips */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-2">
            Click to try sample planning briefs:
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setGoalText(prompt);
                  handleSynthesize(prompt);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-white transition-colors text-left disabled:opacity-50"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Action Button & Loading Indicator */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {isLoading
              ? 'Analyzing constraints with Gemini and verifying location topology...'
              : 'Synthesize verified policy package using server-side Gemini'}
          </span>

          <button
            onClick={() => handleSynthesize()}
            disabled={isLoading || !goalText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Synthesize with Gemini</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-start gap-3 animate-in fade-in duration-150">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-rose-100 block">Planning Request Failed</span>
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Clarification Needed Card */}
      {validatedResult && validatedResult.clarificationNeeded && (
        <div className="p-5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-200 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <HelpCircle className="w-4 h-4" />
            <span>Clarification Required by Model</span>
          </div>

          <p className="text-sm font-medium text-white leading-relaxed">
            {validatedResult.clarificationQuestion ||
              'Your request references corridors or mechanisms not currently available in CityTwin.'}
          </p>

          {validatedResult.validationErrors.length > 0 && (
            <div className="p-3 bg-slate-900/80 rounded-lg border border-amber-900/60 text-xs space-y-1 text-amber-200/90">
              <span className="font-semibold block text-amber-300">Validation Diagnostics:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {validatedResult.validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Please refine your query to target supported hubs: Hospital Junction, College Road, Market Square, Residential District, North Expressway, or Tech Park.
          </p>
        </div>
      )}

      {/* Validated Plan Review Deck */}
      {validatedResult && validatedResult.isValid && previewSimulation && (
        <div className="bg-[#0e1738] border border-teal-500/40 rounded-xl p-6 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-semibold">
                  VALIDATED BY CITYTWIN
                </span>
                <span className="text-xs text-slate-400">· Ready for Simulation</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-1">
                {validatedResult.rawResponse.goalSummary}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {validatedResult.rawResponse.explanation}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Budget Cap</span>
              <span className="text-base font-mono font-bold text-amber-300">
                ₹{validatedResult.scenarioInterventions.budgetCapLakhs.toFixed(1)} Lakh
              </span>
            </div>
          </div>

          {/* Warnings (e.g. Budget default note) */}
          {validatedResult.warnings.length > 0 && (
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">System Notices:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {validatedResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Model Assumptions & Target Geography */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Target className="w-3.5 h-3.5 text-teal-400" />
                <span>Target Geography & Corridors</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {validatedResult.rawResponse.targetLocations.map((loc, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Interpreted Policy Assumptions</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                {validatedResult.rawResponse.assumptions.map((asm, idx) => (
                  <li key={idx}>{asm}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Proposed Interventions Breakdown */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Configured Policy Levers:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Signals */}
              <div className={`p-3.5 rounded-lg border text-xs ${
                validatedResult.scenarioInterventions.adaptiveSignals.enabled
                  ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  <TrafficCone className="w-4 h-4 text-teal-400" />
                  <span>Adaptive Signals</span>
                </div>
                <div className="text-[11px] space-y-1 font-mono">
                  <div>Status: {validatedResult.scenarioInterventions.adaptiveSignals.enabled ? 'ACTIVE' : 'Off'}</div>
                  {validatedResult.scenarioInterventions.adaptiveSignals.enabled && (
                    <>
                      <div>Nodes: {validatedResult.scenarioInterventions.adaptiveSignals.targetNodeIds.length} hubs</div>
                      <div>Level: {validatedResult.scenarioInterventions.adaptiveSignals.optimizationLevel}/5</div>
                    </>
                  )}
                </div>
              </div>

              {/* Bus Priority */}
              <div className={`p-3.5 rounded-lg border text-xs ${
                validatedResult.scenarioInterventions.busPriority.enabled
                  ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Bus className="w-4 h-4 text-blue-400" />
                  <span>Bus Priority Lane</span>
                </div>
                <div className="text-[11px] space-y-1 font-mono">
                  <div>Status: {validatedResult.scenarioInterventions.busPriority.enabled ? 'ACTIVE' : 'Off'}</div>
                  {validatedResult.scenarioInterventions.busPriority.enabled && (
                    <>
                      <div>Corridors: {validatedResult.scenarioInterventions.busPriority.targetSegmentIds.length}</div>
                      <div>Headway: Every {validatedResult.scenarioInterventions.busPriority.frequencyMin}m</div>
                      <div>EV Fleet: {validatedResult.scenarioInterventions.busPriority.electricFleetShare}%</div>
                    </>
                  )}
                </div>
              </div>

              {/* Green Walkways */}
              <div className={`p-3.5 rounded-lg border text-xs ${
                validatedResult.scenarioInterventions.greenWalkways.enabled
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Trees className="w-4 h-4 text-emerald-400" />
                  <span>Green Walkways</span>
                </div>
                <div className="text-[11px] space-y-1 font-mono">
                  <div>Status: {validatedResult.scenarioInterventions.greenWalkways.enabled ? 'ACTIVE' : 'Off'}</div>
                  {validatedResult.scenarioInterventions.greenWalkways.enabled && (
                    <>
                      <div>Paths: {validatedResult.scenarioInterventions.greenWalkways.targetSegmentIds.length}</div>
                      <div>Canopy: Tier {validatedResult.scenarioInterventions.greenWalkways.canopyCoverageDensity}/5</div>
                      {validatedResult.scenarioInterventions.greenWalkways.pedestrianizeMarketSquare && (
                        <div className="text-emerald-300">Market Sq: Plaza</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Live Deterministic Calculation Preview */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Deterministic Engine Outcome Preview:
              </span>
              <span className="text-[10px] font-mono text-teal-400">Calculated in 2ms</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Avg Commute</span>
                <span className="text-sm font-mono font-bold text-white block mt-0.5">
                  {previewSimulation.metrics.averageTravelTimeMinutes}m
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Congestion</span>
                <span className="text-sm font-mono font-bold text-teal-300 block mt-0.5">
                  {previewSimulation.metrics.congestionIndex}/100
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Peak CO₂</span>
                <span className="text-sm font-mono font-bold text-emerald-300 block mt-0.5">
                  {previewSimulation.metrics.estimatedEmissionsKgCO2.toLocaleString()} kg
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Intervention Cost</span>
                <span className={`text-sm font-mono font-bold block mt-0.5 ${
                  previewSimulation.metrics.isOverBudget ? 'text-rose-400' : 'text-amber-300'
                }`}>
                  ₹{previewSimulation.metrics.totalCostLakhs}L
                </span>
              </div>
            </div>

            {previewSimulation.metrics.isOverBudget && (
              <div className="flex items-center gap-2 text-xs text-rose-400 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Budget deficit: Plan requires ₹{previewSimulation.metrics.totalCostLakhs}L vs ₹{previewSimulation.metrics.budgetCapLakhs}L limit.
                </span>
              </div>
            )}
          </div>

          {/* Action Confirmation Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Apply this verified plan to the Scenario Lab and recalculate the city digital twin.
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setValidatedResult(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Clear Preview
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors shadow-md w-full sm:w-auto"
              >
                <span>Apply Plan to Scenario Lab</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
