import React, { useState } from 'react';
import {
  ImportPreviewData,
  getCityNetworkForImport,
  calculateBoundingBox,
  CURATED_CITY_IMPORT_PRESETS,
} from '../services/osmImportService';
import {
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  Compass,
  MapPin,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface AreaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCoords: { lat: number; lng: number } | null;
  targetLocationName: string;
  onConfirmImport: (preview: ImportPreviewData) => void;
}

export const AreaImportModal: React.FC<AreaImportModalProps> = ({
  isOpen,
  onClose,
  targetCoords,
  targetLocationName,
  onConfirmImport,
}) => {
  const [radiusMeters, setRadiusMeters] = useState<number>(1200);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);

  if (!isOpen) return null;

  const currentCoords = targetCoords || { lat: 12.9716, lng: 77.5946 };
  const currentName = targetLocationName || 'Selected Real-City Area';
  const bbox = calculateBoundingBox(currentCoords.lat, currentCoords.lng, radiusMeters);

  const handleFetchPreview = async (selectedPresetKey?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let data: ImportPreviewData;
      if (selectedPresetKey && CURATED_CITY_IMPORT_PRESETS[selectedPresetKey]) {
        const preset = CURATED_CITY_IMPORT_PRESETS[selectedPresetKey];
        data = {
          cityName: preset.cityName,
          centerCoords: preset.centerCoords,
          radiusMeters: preset.radiusMeters,
          nodeCount: preset.nodes.length,
          segmentCount: preset.roadSegments.length,
          majorRoads: preset.roadSegments.slice(0, 5).map((s) => `${s.name} (${s.lanes} lanes)`),
          majorJunctions: preset.nodes.slice(0, 5).map((n) => n.name),
          source: preset.source,
          warnings: preset.warnings,
          rawNetwork: preset,
        };
      } else {
        data = await getCityNetworkForImport(currentName, currentCoords, radiusMeters);
      }
      setPreviewData(data);
    } catch (err: any) {
      console.error('Failed to import road network:', err);
      setError(err?.message || 'Failed to retrieve road network data for the specified bounding box.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!previewData) return;
    onConfirmImport(previewData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#090e1f] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0d1633]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Import Real City Road Network
              </h2>
              <p className="text-xs text-slate-400">
                Extract OpenStreetMap road geometry and load it directly into Demo City simulation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Selected Location Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                  Target Geographic Area
                </span>
                <div className="text-sm font-bold text-white mt-0.5">{currentName}</div>
                <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                  Center: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                OSM Overpass API
              </span>
            </div>

            {/* Radius Selector */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-200 block">
                  Scoping Radius: <span className="text-teal-400 font-mono">{radiusMeters}m</span> ({(radiusMeters / 1000).toFixed(1)} km)
                </label>
                <span className="text-[10px] text-slate-400">
                  BBox: [{bbox.south}, {bbox.west}] to [{bbox.north}, {bbox.east}]
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[600, 1000, 1500, 2000].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRadiusMeters(r);
                      setPreviewData(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      radiusMeters === r
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Real-City Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Featured Pre-Normalized Metropolitan Corridors:
              </span>
              <span className="text-[10px] text-slate-500">Instant 1-Click Load</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFetchPreview('bengaluru')}
                className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-left transition-all"
              >
                <div className="font-bold text-white text-[11px]">Bengaluru</div>
                <div className="text-[10px] text-slate-400">Silk Board & ORR Hub</div>
              </button>
              <button
                type="button"
                onClick={() => handleFetchPreview('mumbai')}
                className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-left transition-all"
              >
                <div className="font-bold text-white text-[11px]">Mumbai</div>
                <div className="text-[10px] text-slate-400">BKC Commercial Core</div>
              </button>
              <button
                type="button"
                onClick={() => handleFetchPreview('london')}
                className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-left transition-all"
              >
                <div className="font-bold text-white text-[11px]">London</div>
                <div className="text-[10px] text-slate-400">Westminster Low-Emission</div>
              </button>
            </div>
          </div>

          {/* Fetch Action Button */}
          {!previewData && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleFetchPreview()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Querying OpenStreetMap Overpass API...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Fetch Road Network for {currentName.split(',')[0]}</span>
                </>
              )}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white">Import Notice</strong>
                <p className="text-[11px] leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Results Display */}
          {previewData && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span className="font-bold text-white text-sm">
                      Network Extracted Successfully
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    {previewData.source === 'osm_live' ? 'Live OSM Query' : 'Verified GIS Preset'}
                  </span>
                </div>

                {/* Counts Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                    <div className="text-lg font-bold text-teal-400 font-mono">
                      {previewData.nodeCount}
                    </div>
                    <div className="text-[10px] text-slate-400">Junction Nodes</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                    <div className="text-lg font-bold text-cyan-400 font-mono">
                      {previewData.segmentCount}
                    </div>
                    <div className="text-[10px] text-slate-400">Road Segments</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                    <div className="text-lg font-bold text-indigo-400 font-mono">
                      {(previewData.radiusMeters / 1000).toFixed(1)} km
                    </div>
                    <div className="text-[10px] text-slate-400">Survey Radius</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                    <div className="text-lg font-bold text-emerald-400 font-mono">100%</div>
                    <div className="text-[10px] text-slate-400">Simulatable</div>
                  </div>
                </div>

                {/* Extracted Road Corridors Preview */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-200">
                    Key Road Corridors Detected:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {previewData.majorRoads.map((road, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-1 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 truncate"
                      >
                        • {road}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warnings / Normalization Disclaimers */}
                {previewData.warnings.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                      Topology Normalization Notes:
                    </div>
                    {previewData.warnings.map((w, i) => (
                      <div key={i} className="text-[10px] text-amber-300/90 pl-3">
                        - {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Important Overwrite Warning */}
                <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/30 text-[11px] text-slate-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Confirmation:</strong> Confirming will load this network into Demo City for live simulation and editing. You can restore the original Demo City at any time using the <em>&quot;Restore Original Demo City&quot;</em> button.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Adjust Area / Re-query
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Confirm &amp; Load into Demo City</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
