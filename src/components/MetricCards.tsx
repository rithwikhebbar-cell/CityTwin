import React from 'react';
import { SimulationResult } from '../types/simulation';
import {
  Clock,
  Activity,
  CloudFog,
  Coins,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface MetricCardsProps {
  currentResult: SimulationResult;
  baselineResult: SimulationResult;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  currentResult,
  baselineResult,
}) => {
  const cur = currentResult.metrics;
  const base = baselineResult.metrics;

  // Travel time delta
  const travelDelta = Number((cur.averageTravelTimeMinutes - base.averageTravelTimeMinutes).toFixed(2));
  const travelDeltaPercent = Number(((travelDelta / base.averageTravelTimeMinutes) * 100).toFixed(1));

  // Congestion delta
  const congestionDelta = cur.congestionIndex - base.congestionIndex;

  // Emissions delta
  const emissionsDelta = cur.estimatedEmissionsKgCO2 - base.estimatedEmissionsKgCO2;
  const emissionsDeltaPercent = Number(((emissionsDelta / base.estimatedEmissionsKgCO2) * 100).toFixed(1));

  // Budget calculations
  const budgetUtilizationPercent = Math.min(
    100,
    Math.round((cur.totalCostLakhs / Math.max(0.1, cur.budgetCapLakhs)) * 100)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {/* 1. Average Travel Time Card */}
      <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/70 hover:border-teal-500/50 rounded-2xl p-6 shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Average Travel Time</span>
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-sm">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl lg:text-4xl font-extrabold font-mono tracking-tight text-white tabular-nums">
            {cur.averageTravelTimeMinutes}
          </span>
          <span className="text-sm text-slate-300 font-mono font-semibold">min</span>
        </div>
        <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            {travelDelta < 0 ? (
              <span className="text-emerald-300 flex items-center font-mono font-bold text-xs sm:text-sm">
                <TrendingDown className="w-4 h-4 mr-1 text-emerald-400" />
                {Math.abs(travelDelta)}m ({Math.abs(travelDeltaPercent)}%)
              </span>
            ) : travelDelta > 0 ? (
              <span className="text-rose-400 flex items-center font-mono font-bold text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 mr-1 text-rose-400" />
                +{travelDelta}m (+{travelDeltaPercent}%)
              </span>
            ) : (
              <span className="text-slate-300 font-mono font-medium">Baseline match</span>
            )}
          </div>
          <span className="text-xs text-slate-300 font-medium">vs {base.averageTravelTimeMinutes}m base</span>
        </div>
      </div>

      {/* 2. Congestion Index Card */}
      <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/70 hover:border-cyan-500/50 rounded-2xl p-6 shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Congestion Index</span>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl lg:text-4xl font-extrabold font-mono tracking-tight text-white tabular-nums">
            {cur.congestionIndex}
          </span>
          <span className="text-sm text-slate-300 font-mono font-semibold">/ 100</span>
          <span
            className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-md tracking-wide ${
              cur.congestionIndex < 45
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
                : cur.congestionIndex < 70
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                : 'bg-rose-950/80 text-rose-300 border border-rose-600/60'
            }`}
          >
            {cur.congestionIndex < 45 ? 'Low Flow' : cur.congestionIndex < 70 ? 'Moderate' : 'Severe'}
          </span>
        </div>
        <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            {congestionDelta < 0 ? (
              <span className="text-emerald-300 font-bold text-xs sm:text-sm">
                {congestionDelta} pts relief
              </span>
            ) : congestionDelta > 0 ? (
              <span className="text-rose-400 font-bold text-xs sm:text-sm">
                +{congestionDelta} pts increase
              </span>
            ) : (
              <span className="text-slate-300 font-medium">Baseline load</span>
            )}
          </div>
          <span className="text-xs text-slate-300 font-medium">Network V/C</span>
        </div>
      </div>

      {/* 3. Estimated Emissions Index Card */}
      <div className="bg-gradient-to-b from-[#121d3f] to-[#0c1532] border border-slate-700/70 hover:border-emerald-500/50 rounded-2xl p-6 shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Estimated Emissions</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-sm">
            <CloudFog className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl lg:text-4xl font-extrabold font-mono tracking-tight text-white tabular-nums">
            {cur.estimatedEmissionsKgCO2.toLocaleString()}
          </span>
          <span className="text-sm text-slate-300 font-mono font-semibold">kg CO₂e</span>
        </div>
        <div className="mt-4 pt-3.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            {emissionsDelta < 0 ? (
              <span className="text-emerald-300 flex items-center font-mono font-bold text-xs sm:text-sm">
                <TrendingDown className="w-4 h-4 mr-1 text-emerald-400" />
                {Math.abs(emissionsDelta)} kg ({Math.abs(emissionsDeltaPercent)}%)
              </span>
            ) : emissionsDelta > 0 ? (
              <span className="text-rose-400 flex items-center font-mono font-bold text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 mr-1 text-rose-400" />
                +{emissionsDelta} kg (+{emissionsDeltaPercent}%)
              </span>
            ) : (
              <span className="text-slate-300 font-mono font-medium">Baseline level</span>
            )}
          </div>
          <span className="text-xs text-slate-300 font-medium">Peak 2-hr</span>
        </div>
      </div>

      {/* 4. Intervention Budget Card */}
      <div className={`rounded-2xl p-6 shadow-md transition-all duration-200 border ${
        cur.isOverBudget
          ? 'border-rose-600/80 bg-gradient-to-b from-rose-950/30 to-[#0c1532]'
          : 'bg-gradient-to-b from-[#121d3f] to-[#0c1532] border-slate-700/70 hover:border-amber-500/50'
      }`}>
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Intervention Budget</span>
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-sm ${
            cur.isOverBudget
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}>
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl lg:text-4xl font-extrabold font-mono tracking-tight text-white tabular-nums">
              ₹{cur.totalCostLakhs}
            </span>
            <span className="text-sm text-slate-300 font-mono font-semibold">Lakh</span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            Cap: ₹{cur.budgetCapLakhs}L
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="h-2.5 w-full bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className={`h-full transition-all duration-300 ${
                cur.isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-teal-500 to-teal-400'
              }`}
              style={{ width: `${budgetUtilizationPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            {cur.isOverBudget ? (
              <span className="text-rose-400 flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Deficit: ₹{Math.abs(cur.remainingBudgetLakhs)} Lakh
              </span>
            ) : (
              <span className="text-slate-200 flex items-center gap-1 font-mono font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                ₹{cur.remainingBudgetLakhs}L remaining
              </span>
            )}
            <span className="font-mono text-slate-200 font-bold">{budgetUtilizationPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
