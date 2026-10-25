import React, { useState, useEffect } from 'react';
import {
  ImportPreviewData,
  getCityNetworkForImport,
  getSyntheticFallbackForArea,
  calculateBoundingBox,
  searchGeographicLocation,
  GeoSearchResult,
  CURATED_CITY_IMPORT_PRESETS,
  logOsmDiagnostic,
} from '../services/osmImportService';
import {
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  Compass,
  MapPin,
  Search,
  ArrowRight,
  RefreshCw,
  Info,
  ShieldAlert,
  Sparkles,
  ExternalLink,
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
  const [cityName, setCityName] = useState<string>('Selected Real-City Area');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [radiusMeters, setRadiusMeters] = useState<number>(1200);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GeoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (targetCoords) {
      setCoords(targetCoords);
    }
    if (targetLocationName) {
      setCityName(targetLocationName);
      setSearchQuery(targetLocationName);
    }
  }, [targetCoords, targetLocationName]);

  if (!isOpen) return null;

  const bbox = calculateBoundingBox(coords.lat, coords.lng, radiusMeters);

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchGeographicLocation(searchQuery);
      setSearchResults(results);
      if (results.length > 0) {
        const top = results[0];
        setCoords({ lat: top.lat, lng: top.lng });
        setCityName(top.name);
        setPreviewData(null);
        setError(null);
        logOsmDiagnostic('Place Geocoded in Modal', {
          query: searchQuery,
          selectedName: top.name,
          coords: { lat: top.lat, lng: top.lng },
          matchingCount: results.length,
        });
      } else {
        setError(`No geographic locations found for "${searchQuery}". Please try another search term or enter coordinates directly.`);
      }
    } catch (err: any) {
      setError(`Location lookup error: ${err.message || 'Failed to search places'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: GeoSearchResult) => {
    setCoords({ lat: result.lat, lng: result.lng });
    setCityName(result.name);
    setSearchQuery(result.name);
    setSearchResults([]);
    setPreviewData(null);
    setError(null);
    logOsmDiagnostic('Place Selected from Suggestions', {
      name: result.name,
      coords: { lat: result.lat, lng: result.lng },
    });
  };

  const handleFetchPreview = async (selectedPresetKey?: string) => {
    setIsLoading(true);
    setError(null);

    logOsmDiagnostic('Fetch Road Network Button Clicked', {
      selectedPresetKey: selectedPresetKey || 'none (live geographic query)',
      cityName,
      coords,
      radiusMeters,
    });

    try {
      let data: ImportPreviewData;
      if (selectedPresetKey && CURATED_CITY_IMPORT_PRESETS[selectedPresetKey]) {
        const preset = CURATED_CITY_IMPORT_PRESETS[selectedPresetKey];
        setCityName(preset.cityName);
        setCoords(preset.centerCoords);
        setRadiusMeters(preset.radiusMeters);
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
        data = await getCityNetworkForImport(cityName, coords, radiusMeters);
      }

      logOsmDiagnostic('Preview Data Loaded Successfully', {
        cityName: data.cityName,
        source: data.source,
        nodeCount: data.nodeCount,
        segmentCount: data.segmentCount,
      });
      setPreviewData(data);
    } catch (err: any) {
      console.error('Failed to import road network:', err);
      logOsmDiagnostic('Import Failed', {
        cityName,
        error: err?.message || String(err),
      });
      setError(err?.message || 'Failed to retrieve road network data for the specified bounding box.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSyntheticFallback = () => {
    setIsLoading(true);
    try {
      const data = getSyntheticFallbackForArea(
        cityName,
        coords,
        radiusMeters,
        `OSM Overpass public mirror was unreachable. Generated localized geometric benchmark grid for (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}).`
      );
      setPreviewData(data);
      setError(null);
      logOsmDiagnostic('Synthetic Fallback Generated', {
        cityName,
        nodeCount: data.nodeCount,
        segmentCount: data.segmentCount,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate synthetic grid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!previewData) return;
    logOsmDiagnostic('Import Preview Accepted by User', {
      cityName: previewData.cityName,
      source: previewData.source,
      nodeCount: previewData.nodeCount,
      segmentCount: previewData.segmentCount,
    });
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
                Universal Geographic Road Network Import
              </h2>
              <p className="text-xs text-slate-400">
                Extract OpenStreetMap road topology for any global city, town, or neighborhood into CityTwin.
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
          {/* Global Location Search Form */}
          <form onSubmit={handleLocationSearch} className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-200 block">
              Search Any Global City, Town, or Neighborhood:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Tokyo, Paris, Queens NY, Indiranagar Bengaluru..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                <span>Locate</span>
              </button>
            </div>

            {/* Search Suggestions Dropdown */}
            {searchResults.length > 1 && (
              <div className="p-2 bg-slate-900 border border-slate-700 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold px-2">Matching Locations:</span>
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-xs flex items-center justify-between"
                  >
                    <span className="font-semibold">{res.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{res.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Selected Location Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                  Target Geographic Area
                </span>
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="text-sm font-bold text-white mt-0.5 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-teal-400 focus:outline-none w-full"
                />
                <div className="text-slate-400 font-mono text-[11px] mt-1 flex items-center gap-2">
                  <span>Lat: {coords.lat.toFixed(5)}</span>
                  <span>·</span>
                  <span>Lng: {coords.lng.toFixed(5)}</span>
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

          {/* Optional Sample Curated Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Optional Sample Metropolitan Corridors:
              </span>
              <span className="text-[10px] text-slate-500">Fast 1-Click Example</span>
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
                  <span>Querying OpenStreetMap Overpass API for {cityName}...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Fetch Road Network for {cityName.split(',')[0]}</span>
                </>
              )}
            </button>
          )}

          {/* Error Message with Explicit Fallback Options */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">Import Error</strong>
                  <p className="text-[11px] leading-relaxed mt-0.5">{error}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-rose-900/60">
                <button
                  type="button"
                  onClick={() => handleFetchPreview()}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Live Query</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateSyntheticFallback}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Localized Geo-Grid (Synthetic Approximation)</span>
                </button>
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
                      Network Extracted Successfully: {previewData.cityName}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                    previewData.source === 'osm_live'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : previewData.source === 'osm_preset'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {previewData.source === 'osm_live'
                      ? 'Live OSM Query'
                      : previewData.source === 'osm_preset'
                      ? 'Verified GIS Preset'
                      : 'Synthetic Geometric Grid'}
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
                    <div className="text-[10px] text-slate-400">BPR Simulatable</div>
                  </div>
                </div>

                {/* Extracted Road Corridors Preview */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-200">
                    Key Road Corridors Detected ({previewData.majorRoads.length}):
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
                      Data &amp; Calibration Disclaimers:
                    </div>
                    {previewData.warnings.map((w, i) => (
                      <div key={i} className="text-[10px] text-amber-300/90 pl-3">
                        - {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Confirmation Box */}
                <div className="p-3 rounded-lg bg-slate-900 border border-teal-500/30 text-[11px] text-slate-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Confirmation:</strong> Confirming will load this network into Demo City, Scenario Lab, Compare Plans, and AI Assistant for live simulation. You can restore the original Demo City at any time.
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
                  <span>Confirm &amp; Load into Simulation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* OpenStreetMap Attribution Footer */}
          <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Map data © OpenStreetMap contributors, licensed under Open Database License (ODbL).</span>
            <span className="text-teal-400 font-mono">CityTwin GIS Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
