import React from 'react';
import { MODEL_ASSUMPTIONS } from '../simulation/engine';
import { BookOpen, Cpu, ShieldCheck, FileSpreadsheet, AlertCircle } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#101b3b] border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Simulation Engine Specifications & Formulas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent mathematical calibration, constants, and modeling limits.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-200/90 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Synthetic Data Disclaimer:</strong> CityTwin operates on calibrated synthetic baseline traffic and emission vectors designed for urban planning hackathons, exploratory policy tests, and multi-variable optimization. Calculations are 100% deterministic and reproducible, but represent illustrative models rather than empirical ground-truth sensors.
          </p>
        </div>
      </div>

      {/* Formulas & Constants Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BPR Delay Function */}
        <div className="bg-[#0d1633] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-teal-400">
            <Cpu className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              1. Bureau of Public Roads (BPR) Equation
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            The travel time $T$ on any road segment of length $L$ is calculated using the canonical link-performance function:
          </p>
          <div className="p-3 bg-[#080e22] rounded-lg font-mono text-xs text-teal-300 border border-slate-800">
            T = T₀ · [ 1 + α · (V / C)^β ]
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
            <li><strong className="text-slate-200">T₀ (Free-flow time):</strong> (Length / Free-flow Speed) × 60</li>
            <li><strong className="text-slate-200">α (Alpha coefficient):</strong> {MODEL_ASSUMPTIONS.bprAlpha}</li>
            <li><strong className="text-slate-200">β (Beta exponent):</strong> {MODEL_ASSUMPTIONS.bprBeta}</li>
            <li><strong className="text-slate-200">V / C:</strong> Ratio of active vehicle volume to effective throughput capacity.</li>
          </ul>
        </div>

        {/* Modal Split Dynamics */}
        <div className="bg-[#0d1633] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-400">
            <FileSpreadsheet className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              2. Transit Modal Shift Model
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Bus corridor interventions divert passenger car occupants into high-capacity public transit:
          </p>
          <div className="p-3 bg-[#080e22] rounded-lg font-mono text-xs text-blue-300 border border-slate-800">
            Shift = 12% + (15 - Headway) · 1.2%
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
            <li><strong className="text-slate-200">Average Car Occupancy:</strong> {MODEL_ASSUMPTIONS.averageCarOccupancy} passengers / vehicle</li>
            <li><strong className="text-slate-200">Nominal Bus Capacity:</strong> {MODEL_ASSUMPTIONS.averageBusCapacity} passengers during peak periods</li>
            <li><strong className="text-slate-200">Dedicated Busway Effect:</strong> Protects transit speed from car queues while laminarizing non-bus traffic.</li>
          </ul>
        </div>

        {/* Tailpipe Emissions Calibration */}
        <div className="bg-[#0d1633] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              3. Emission Factors & Congestion Penalty
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Carbon output is calculated per vehicle-kilometer-traveled (VKT) and scaled by vehicle velocity:
          </p>
          <div className="p-3 bg-[#080e22] rounded-lg font-mono text-xs text-emerald-300 border border-slate-800">
            CO₂ = VKT · Rate · [ 1 + max(0, 30 - Speed) · 0.03 ]
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
            <li><strong className="text-slate-200">Passenger Car Fleet Rate:</strong> {MODEL_ASSUMPTIONS.passengerCarCO2PerKmGrams} g CO₂/km</li>
            <li><strong className="text-slate-200">Standard Diesel Bus Rate:</strong> {MODEL_ASSUMPTIONS.dieselBusCO2PerKmGrams} g CO₂/km</li>
            <li><strong className="text-slate-200">Electric Transit Bus Rate:</strong> {MODEL_ASSUMPTIONS.electricBusCO2PerKmGrams} g CO₂/km (grid emissions)</li>
            <li><strong className="text-slate-200">Urban Tree Canopy Sink:</strong> {MODEL_ASSUMPTIONS.treeCanopyCO2AbsorptionKgPerHour} kg CO₂ / km / hour offset.</li>
          </ul>
        </div>

        {/* Budget & Fiscal Units */}
        <div className="bg-[#0d1633] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <BookOpen className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              4. Budgeting & Indian Rupee Standards
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            All fiscal capital envelopes are denominated in Indian Rupee Lakhs (₹ Lakh):
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
            <li><strong className="text-slate-200">1 Lakh (₹1.0L):</strong> ₹100,000 INR</li>
            <li><strong className="text-slate-200">Adaptive Signal:</strong> ₹1.5 Lakh per junction hub</li>
            <li><strong className="text-slate-200">Busway Corridor:</strong> ₹2.2 Lakh / km (+ ₹0.6L/km for dedicated lane barriers)</li>
            <li><strong className="text-slate-200">Green Walkways:</strong> ₹1.1 Lakh / km (+ ₹1.5L for Market Square pedestrian plaza).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
