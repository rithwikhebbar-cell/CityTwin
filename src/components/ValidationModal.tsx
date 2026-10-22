import React, { useState } from 'react';
import { runSimulationValidationTests } from '../simulation/verify';
import { ShieldCheck, CheckCircle2, XCircle, RotateCcw, X, Cpu } from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testResults, setTestResults] = useState(() => runSimulationValidationTests());

  if (!isOpen) return null;

  const handleRerun = () => {
    setTestResults(runSimulationValidationTests());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0e1738] border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Deterministic Engine Verification Suite
              </h3>
              <p className="text-xs text-slate-400">
                In-browser mathematical integrity and assertion check.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Result Banner */}
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            testResults.allPassed
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResults.allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <span className="font-bold block">
                {testResults.allPassed
                  ? `All ${testResults.tests.length} Engineering Invariants Verified`
                  : 'Assertion Failures Detected'}
              </span>
              <span className="text-[11px] opacity-80">
                Simulation determinism, Gemini boundaries, GIS handoff, and Supabase schema integrity.
              </span>
            </div>
          </div>
          <button
            onClick={handleRerun}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs transition-colors shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Re-verify</span>
          </button>
        </div>

        {/* Individual Tests List grouped by category */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              1. Deterministic Simulation Invariants ({testResults.tests.filter((t) => t.category === 'simulation').length} Tests)
            </span>
            <div className="space-y-2">
              {testResults.tests
                .filter((t) => t.category === 'simulation')
                .map((t, idx) => (
                  <div
                    key={`sim-${idx}`}
                    className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{t.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          t.passed
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {t.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <p className="text-slate-200 font-mono text-xs leading-relaxed">
                      {t.message}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider block mb-1.5">
              2. Gemini Structured Output & Boundary Validation ({testResults.tests.filter((t) => t.category === 'gemini_validation').length} Tests)
            </span>
            <div className="space-y-2">
              {testResults.tests
                .filter((t) => t.category === 'gemini_validation')
                .map((t, idx) => (
                  <div
                    key={`gemini-${idx}`}
                    className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{t.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          t.passed
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {t.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <p className="text-slate-200 font-mono text-xs leading-relaxed">
                      {t.message}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block mb-1.5">
              3. Supabase PostgreSQL Persistence Invariants ({testResults.tests.filter((t) => t.category === 'persistence').length} Tests)
            </span>
            <div className="space-y-2">
              {testResults.tests
                .filter((t) => t.category === 'persistence')
                .map((t, idx) => (
                  <div
                    key={`persist-${idx}`}
                    className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{t.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          t.passed
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {t.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <p className="text-slate-200 font-mono text-xs leading-relaxed">
                      {t.message}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block mb-1.5">
              4. Supabase Authentication & Redirection Invariants ({testResults.tests.filter((t) => t.category === 'authentication').length} Tests)
            </span>
            <div className="space-y-2">
              {testResults.tests
                .filter((t) => t.category === 'authentication')
                .map((t, idx) => (
                  <div
                    key={`auth-${idx}`}
                    className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{t.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          t.passed
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {t.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <p className="text-slate-200 font-mono text-xs leading-relaxed">
                      {t.message}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            Pure TypeScript · Bureau of Public Roads (BPR) 1964
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
