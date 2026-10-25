import React, { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Search,
  MapPin,
  Sliders,
  Bus,
  Trees,
  AlertTriangle,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  Compass,
  ArrowRight,
  Info,
  RefreshCw,
  ExternalLink,
  Download,
  Layers,
} from 'lucide-react';
import { CITY_NODES, ROAD_SEGMENTS } from '../simulation/engine';
import { SimulationResult, RealCityCandidate, CandidateInterventionCategory, CityNode, RoadSegment } from '../types/simulation';
import { AreaImportModal } from './AreaImportModal';
import { ImportedCityNetwork, ImportPreviewData } from '../services/osmImportService';

export const DEFAULT_CITY_PRESETS = [
  {
    name: 'Bengaluru, India',
    coords: { lat: 12.9716, lng: 77.5946 },
    zoom: 13,
    description: 'High-density tech corridors & Ring Road bottleneck analysis',
  },
  {
    name: 'Mumbai, India',
    coords: { lat: 19.076, lng: 72.8777 },
    zoom: 13,
    description: 'BKC commercial core & coastal transit arterials',
  },
  {
    name: 'London, UK',
    coords: { lat: 51.5074, lng: -0.1278 },
    zoom: 13,
    description: 'Congestion charging zone & active travel low-emission corridors',
  },
  {
    name: 'Singapore',
    coords: { lat: 1.3521, lng: 103.8198 },
    zoom: 13,
    description: 'ERP electronic tolling & transit-first island planning',
  },
  {
    name: 'New York, USA',
    coords: { lat: 40.7128, lng: -74.006 },
    zoom: 13,
    description: 'Manhattan grid & midtown bus priority transit lanes',
  },
];

export const INITIAL_REAL_CITY_CANDIDATES: RealCityCandidate[] = [
  {
    id: 'site-blr-1',
    name: 'Silk Board Junction Bottleneck',
    category: 'adaptiveSignals',
    position: { lat: 12.9176, lng: 77.6238 },
    address: 'Hosur Road, Central Silk Board, Bengaluru',
    mappedBenchmarkId: 'hospital_junction',
    mappedBenchmarkName: 'Hospital Junction (Emergency Arterial)',
    isSimulatable: true,
    notes: 'Candidate for AI-adaptive dynamic green wave cycle optimization.',
    createdAt: '2026-10-14T03:00:00Z',
  },
  {
    id: 'site-blr-2',
    name: 'Outer Ring Road Bus Transit Corridors',
    category: 'busPriority',
    position: { lat: 12.9352, lng: 77.6946 },
    address: 'ORR Tech Corridor, Bellandur, Bengaluru',
    mappedBenchmarkId: 'seg_college_hospital',
    mappedBenchmarkName: 'College Road to Hospital Junction Link',
    isSimulatable: true,
    notes: 'Candidate dedicated BRT lane with 5-minute peak electric bus headway.',
    createdAt: '2026-10-14T03:05:00Z',
  },
  {
    id: 'site-blr-3',
    name: 'Cubbon Park Civic Green Promenade',
    category: 'greenWalkways',
    position: { lat: 12.9763, lng: 77.5929 },
    address: 'Kasturba Road, Cubbon Park, Bengaluru',
    mappedBenchmarkId: 'seg_res_college',
    mappedBenchmarkName: 'Residential to College Road Link',
    isSimulatable: true,
    notes: 'Pedestrian boulevard with high canopy density offset.',
    createdAt: '2026-10-14T03:10:00Z',
  },
  {
    id: 'site-blr-4',
    name: 'Koramangala 80ft Road Field Site',
    category: 'unmapped',
    position: { lat: 12.9345, lng: 77.625 },
    address: '80 Feet Road, 4th Block, Koramangala, Bengaluru',
    mappedBenchmarkId: 'unmapped',
    mappedBenchmarkName: 'Unmapped Observational Field Location',
    isSimulatable: false,
    notes: 'Real-world field observation point for GIS survey; unmapped to benchmark simulation network.',
    createdAt: '2026-10-14T03:15:00Z',
  },
];

export interface RealCityMapProps {
  simulationResult: SimulationResult;
  candidateSites: RealCityCandidate[];
  onAddCandidateSite: (site: RealCityCandidate) => void;
  onDeleteCandidateSite: (siteId: string) => void;
  onSendCandidateToLab: (site: RealCityCandidate) => void;
  importedCandidates?: RealCityCandidate[];
  onOpenScenarioLab?: () => void;
  onImportNetworkToDemoCity?: (network: ImportedCityNetwork) => void;
  activeNetworkCityName?: string;
  nodes?: CityNode[];
  roadSegments?: RoadSegment[];
}

// Map Controls & Search Sub-Component
function MapSearchAndControls({
  onSelectLocation,
  activeSearchQuery,
  setActiveSearchQuery,
}: {
  onSelectLocation: (loc: { lat: number; lng: number }, name: string) => void;
  activeSearchQuery: string;
  setActiveSearchQuery: (q: string) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSearchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      if (placesLib && placesLib.Place) {
        // Modern Places API (New) searchByText compliant with zero-legacy mandate
        const request = {
          textQuery: activeSearchQuery.trim(),
          fields: ['displayName', 'location', 'formattedAddress'],
        };
        const { places } = await placesLib.Place.searchByText(request);

        if (places && places.length > 0 && places[0].location) {
          const loc = places[0].location;
          const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
          const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
          const coords = { lat, lng };
          const name = places[0].displayName || places[0].formattedAddress || activeSearchQuery;

          map?.panTo(coords);
          map?.setZoom(14);
          onSelectLocation(coords, name);
          setIsSearching(false);
          return;
        }
      }

      // Fallback: check city presets
      const matchedPreset = DEFAULT_CITY_PRESETS.find((p) =>
        p.name.toLowerCase().includes(activeSearchQuery.toLowerCase())
      );
      if (matchedPreset) {
        map?.panTo(matchedPreset.coords);
        map?.setZoom(matchedPreset.zoom);
        onSelectLocation(matchedPreset.coords, matchedPreset.name);
        setIsSearching(false);
        return;
      }

      setSearchError('Place not found. Try searching a major city or landmark.');
    } catch (err: any) {
      console.warn('Place search notice:', err?.message || err);
      // Fallback check
      const matchedPreset = DEFAULT_CITY_PRESETS.find((p) =>
        p.name.toLowerCase().includes(activeSearchQuery.toLowerCase())
      );
      if (matchedPreset) {
        map?.panTo(matchedPreset.coords);
        map?.setZoom(matchedPreset.zoom);
        onSelectLocation(matchedPreset.coords, matchedPreset.name);
      } else {
        setSearchError('Unable to resolve location. Please try a different query.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex flex-col md:flex-row gap-2 max-w-4xl pointer-events-none">
      <div className="pointer-events-auto flex-1">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={activeSearchQuery}
            onChange={(e) => setActiveSearchQuery(e.target.value)}
            placeholder="Search real-world city, arterial road, or landmark..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-[#090e1f]/95 backdrop-blur-md border border-slate-700/80 text-white text-xs md:text-sm placeholder-slate-400 shadow-2xl focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40"
          />
          <Search className="w-4 h-4 text-teal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-[#090e1f] font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
          >
            {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Explore'}
          </button>
        </form>
        {searchError && (
          <div className="mt-1.5 px-3 py-1 rounded-lg bg-rose-950/90 border border-rose-800 text-rose-300 text-xs shadow-lg backdrop-blur-sm">
            {searchError}
          </div>
        )}
      </div>

      {/* Preset Quick Links */}
      <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {DEFAULT_CITY_PRESETS.slice(0, 3).map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => {
              setActiveSearchQuery(preset.name);
              map?.panTo(preset.coords);
              map?.setZoom(preset.zoom);
              onSelectLocation(preset.coords, preset.name);
            }}
            className="px-2.5 py-2 rounded-lg bg-[#090e1f]/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-all flex items-center gap-1 shadow-md"
          >
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>{preset.name.split(',')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function RealCityMap({
  candidateSites,
  onAddCandidateSite,
  onDeleteCandidateSite,
  onSendCandidateToLab,
  importedCandidates = [],
  onOpenScenarioLab,
  onImportNetworkToDemoCity,
  activeNetworkCityName,
  nodes = CITY_NODES,
  roadSegments = ROAD_SEGMENTS,
}: RealCityMapProps) {
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const activeNodes = nodes && nodes.length > 0 ? nodes : CITY_NODES;
  const activeSegments = roadSegments && roadSegments.length > 0 ? roadSegments : ROAD_SEGMENTS;

  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');
  const [activeSiteForInfo, setActiveSiteForInfo] = useState<RealCityCandidate | null>(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('Bengaluru, India');
  const [isAreaImportModalOpen, setIsAreaImportModalOpen] = useState(false);

  // New site form state
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteCategory, setNewSiteCategory] = useState<CandidateInterventionCategory>('adaptiveSignals');
  const [newSiteMappedBenchmark, setNewSiteMappedBenchmark] = useState(activeNodes[0]?.id || 'hospital_junction');
  const [newSiteNotes, setNewSiteNotes] = useState('');

  // Handle map click
  const handleMapClick = (ev: any) => {
    if (!ev.detail?.latLng) return;
    const lat = typeof ev.detail.latLng.lat === 'function' ? ev.detail.latLng.lat() : ev.detail.latLng.lat;
    const lng = typeof ev.detail.latLng.lng === 'function' ? ev.detail.latLng.lng() : ev.detail.latLng.lng;
    const coords = { lat, lng };

    setSelectedCoord(coords);
    setSelectedLocationName(`Target Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setNewSiteName(`Candidate Site @ ${lat.toFixed(3)}, ${lng.toFixed(3)}`);
    setActiveSiteForInfo(null);
  };

  // Save new candidate site
  const handleSaveCandidateSite = (autoSendToLab: boolean = false) => {
    if (!selectedCoord) return;

    const validNode = activeNodes.find((n) => n.id === newSiteMappedBenchmark);
    const validSeg = activeSegments.find((s) => s.id === newSiteMappedBenchmark);
    const isSimulatable = Boolean(validNode || validSeg) && newSiteMappedBenchmark !== 'unmapped';
    const mappedBenchmarkName = validNode
      ? validNode.name
      : validSeg
      ? `${validSeg.name} (${validSeg.lengthKm} km)`
      : 'Unmapped Observational Field Location';

    const newSite: RealCityCandidate = {
      id: `site-custom-${Date.now()}`,
      name: newSiteName.trim() || `Candidate Intervention @ ${selectedCoord.lat.toFixed(3)}`,
      category: newSiteCategory,
      position: selectedCoord,
      address: selectedLocationName,
      mappedBenchmarkId: newSiteMappedBenchmark,
      mappedBenchmarkName,
      isSimulatable,
      notes: newSiteNotes.trim() || 'Scouted for municipal feasibility audit.',
      createdAt: new Date().toISOString(),
    };

    onAddCandidateSite(newSite);
    setActiveSiteForInfo(newSite);
    setIsAddingSite(false);
    setNewSiteNotes('');

    if (autoSendToLab) {
      onSendCandidateToLab(newSite);
    }
  };

  const getCategoryColor = (category: CandidateInterventionCategory) => {
    switch (category) {
      case 'adaptiveSignals':
        return { bg: '#f59e0b', border: '#b45309', glyph: '#fff', label: 'Adaptive Signal Hub' };
      case 'busPriority':
        return { bg: '#0284c7', border: '#0369a1', glyph: '#fff', label: 'Bus Priority Corridor' };
      case 'greenWalkways':
        return { bg: '#10b981', border: '#047857', glyph: '#fff', label: 'Active Green Walkway' };
      case 'emergencyRoute':
        return { bg: '#14b8a6', border: '#0f766e', glyph: '#fff', label: 'Emergency Arterial Feeder' };
      case 'unmapped':
      default:
        return { bg: '#64748b', border: '#475569', glyph: '#fff', label: 'Observational Field Location' };
    }
  };

  // If Maps API key is not configured
  if (!mapsApiKey || mapsApiKey === 'MY_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="relative rounded-2xl bg-[#090e1f] border border-amber-500/30 p-8 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[500px]">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Google Maps API Key Required
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Real City exploration mode uses the Google Maps JavaScript API to visualize real-world street topology and pin candidate intervention sites.
          </p>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left space-y-1 font-mono text-[11px] text-teal-300">
            <div>Configure key in .env:</div>
            <div className="text-slate-400">VITE_GOOGLE_MAPS_API_KEY=&quot;YOUR_KEY_HERE&quot;</div>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          CityTwin&apos;s deterministic simulation engine continues to operate fully in <span className="text-teal-300 font-semibold">Demo City Mode</span> without requiring external services.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simulation Integrity Architecture Banner */}
      <div className="rounded-xl bg-gradient-to-r from-teal-950/40 via-cyan-950/30 to-blue-950/40 border border-teal-500/30 p-3.5 text-xs text-slate-300 shadow-lg flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-teal-200">
              Real-City GIS Exploration &amp; Candidate Site Scoping
            </span>
            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono border border-teal-500/30">
              Observational Sandbox
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Google Maps Platform renders real-world urban satellite and road geometry for candidate policy site exploration. Because live municipal traffic telemetry varies by municipality, CityTwin evaluates intervention impact deterministically using its calibrated Bureau of Public Roads (BPR) benchmark model.
          </p>
        </div>
      </div>

      {/* Main Map + Sidebar Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[650px]">
        {/* Google Maps Container */}
        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-slate-800 bg-[#060a14] shadow-2xl h-full">
          <APIProvider
            apiKey={mapsApiKey}
            libraries={['places', 'marker', 'geometry']}
          >
            {/* Search and Quick Presets */}
            <MapSearchAndControls
              activeSearchQuery={activeSearchQuery}
              setActiveSearchQuery={setActiveSearchQuery}
              onSelectLocation={(loc, name) => {
                setSelectedCoord(loc);
                setSelectedLocationName(name);
                setNewSiteName(`Candidate Site: ${name.split(',')[0]}`);
              }}
            />

            {/* Official @vis.gl/react-google-maps Map with mandatory mapId and attribution */}
            <Map
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              defaultCenter={{ lat: 12.9716, lng: 77.5946 }} // Bengaluru tech hub by default
              defaultZoom={13}
              gestureHandling="greedy"
              disableDefaultUI={false}
              onClick={handleMapClick}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Render Saved Candidate Intervention Sites */}
              {candidateSites.map((site) => {
                const colors = getCategoryColor(site.category);
                return (
                  <AdvancedMarker
                    key={site.id}
                    position={site.position}
                    onClick={() => {
                      setActiveSiteForInfo(site);
                      setSelectedCoord(site.position);
                      setSelectedLocationName(site.name);
                    }}
                    title={site.name}
                  >
                    <Pin
                      background={colors.bg}
                      borderColor={colors.border}
                      glyphColor={colors.glyph}
                      scale={1.15}
                    />
                  </AdvancedMarker>
                );
              })}

              {/* Active Clicked Point Marker */}
              {selectedCoord && !candidateSites.some((s) => s.position.lat === selectedCoord.lat && s.position.lng === selectedCoord.lng) && (
                <AdvancedMarker position={selectedCoord}>
                  <Pin background="#06b6d4" borderColor="#0891b2" glyphColor="#ffffff" scale={1.25} />
                </AdvancedMarker>
              )}

              {/* InfoWindow for Active Selected Site */}
              {activeSiteForInfo && (
                <InfoWindow
                  position={activeSiteForInfo.position}
                  onCloseClick={() => setActiveSiteForInfo(null)}
                >
                  <div className="p-2 max-w-xs text-slate-900 font-sans space-y-1.5">
                    <div className="font-bold text-sm text-slate-900">{activeSiteForInfo.name}</div>
                    <div className="text-[11px] text-slate-600">{activeSiteForInfo.address}</div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                        {getCategoryColor(activeSiteForInfo.category).label}
                      </span>
                      {activeSiteForInfo.isSimulatable ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                          Simulation Ready
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-700">
                          Observational
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-700 italic border-l-2 border-teal-500 pl-2">
                      &quot;{activeSiteForInfo.notes}&quot;
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono pt-1">
                      Mapped Benchmark: <span className="font-semibold text-slate-700">{activeSiteForInfo.mappedBenchmarkName || activeSiteForInfo.mappedBenchmarkId}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSendCandidateToLab(activeSiteForInfo)}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Send to Scenario Lab</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>

          {/* Floating Instructions Pill */}
          <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
            <div className="px-3 py-1.5 rounded-full bg-[#090e1f]/90 backdrop-blur-md border border-slate-700/80 text-[11px] text-slate-300 shadow-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>Click any street or intersection to inspect &amp; tag candidate sites</span>
            </div>
          </div>
        </div>

        {/* Right Scoping & Telemetry Panel */}
        <div className="lg:col-span-1 flex flex-col h-full bg-[#090e1f] rounded-2xl border border-slate-800 p-4 space-y-4 overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-400" />
                Candidate Site Scoping
              </h3>
              <p className="text-[11px] text-slate-400">
                {candidateSites.length} real-world intervention points
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {onImportNetworkToDemoCity && (
                <button
                  type="button"
                  onClick={() => setIsAreaImportModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-1"
                  title="Import selected real-city road network directly into Demo City"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Import to Demo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddingSite(!isAddingSite)}
                className="p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs transition-colors flex items-center gap-1"
                title="Add candidate site from selected coordinate"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pin</span>
              </button>
            </div>
          </div>

          {/* Active Site Details or Selected Coordinate Details */}
          {activeSiteForInfo ? (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-teal-500/50 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">
                  Inspected Candidate Site
                </span>
                {importedCandidates.some((c) => c.id === activeSiteForInfo.id) ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ✓ In Scenario Lab
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800">
                    Candidate Pin
                  </span>
                )}
              </div>

              <div>
                <div className="text-xs font-bold text-white truncate">{activeSiteForInfo.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {activeSiteForInfo.position.lat.toFixed(5)}, {activeSiteForInfo.position.lng.toFixed(5)}
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getCategoryColor(activeSiteForInfo.category).bg }}
                />
                <span className="text-[11px] text-slate-200 font-medium">
                  {getCategoryColor(activeSiteForInfo.category).label}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-slate-800/80 text-[10px] space-y-1">
                <div className="text-slate-400 uppercase font-semibold">CityTwin Simulation Mapping:</div>
                {activeSiteForInfo.isSimulatable ? (
                  <div className="text-teal-300 font-medium">
                    Mapped: <span className="font-semibold text-white">{activeSiteForInfo.mappedBenchmarkName || activeSiteForInfo.mappedBenchmarkId}</span>
                  </div>
                ) : (
                  <div className="text-amber-300 italic">
                    Unmapped field observation (no simulated metrics fabricated).
                  </div>
                )}
              </div>

              {activeSiteForInfo.notes && (
                <div className="text-[10px] text-slate-400 italic line-clamp-2">
                  &quot;{activeSiteForInfo.notes}&quot;
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <button
                  type="button"
                  onClick={() => onSendCandidateToLab(activeSiteForInfo)}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>
                    {importedCandidates.some((c) => c.id === activeSiteForInfo.id)
                      ? 'Re-Sync with Scenario Lab'
                      : 'Send to Scenario Lab'}
                  </span>
                </button>

                {importedCandidates.some((c) => c.id === activeSiteForInfo.id) && onOpenScenarioLab && (
                  <button
                    type="button"
                    onClick={onOpenScenarioLab}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-medium text-xs transition-colors flex items-center justify-center gap-1 border border-slate-700"
                  >
                    <span>Open Scenario Lab</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                {onImportNetworkToDemoCity && (
                  <button
                    type="button"
                    onClick={() => setIsAreaImportModalOpen(true)}
                    className="w-full py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Import Network Around Pin</span>
                  </button>
                )}
              </div>
            </div>
          ) : selectedCoord ? (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Target Inspection Point
                </span>
                <span className="text-[10px] font-mono text-cyan-400">GIS Selected</span>
              </div>
              <div className="text-xs font-semibold text-white truncate">
                {selectedLocationName || 'Selected Coordinate'}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 bg-black/40 p-2 rounded-lg">
                <div>
                  <span className="text-slate-500">Lat: </span>
                  {selectedCoord.lat.toFixed(5)}
                </div>
                <div>
                  <span className="text-slate-500">Lng: </span>
                  {selectedCoord.lng.toFixed(5)}
                </div>
              </div>

              {!isAddingSite && (
                <div className="space-y-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingSite(true)}
                    className="w-full py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pin as Candidate Intervention</span>
                  </button>
                  {onImportNetworkToDemoCity && (
                    <button
                      type="button"
                      onClick={() => setIsAreaImportModalOpen(true)}
                      className="w-full py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Import Area into Demo City</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-1">
              <Compass className="w-6 h-6 text-slate-600 mx-auto" />
              <div className="text-xs text-slate-400 font-medium">No Point Selected</div>
              <p className="text-[11px] text-slate-500">
                Click on the map or search a city above to inspect coordinates.
              </p>
            </div>
          )}

          {/* Add Site Form */}
          {isAddingSite && selectedCoord && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveCandidateSite(false);
              }}
              className="p-3.5 rounded-xl bg-slate-900 border border-teal-500/40 space-y-3"
            >
              <div className="text-xs font-bold text-teal-300 flex items-center justify-between">
                <span>Configure Candidate Policy</span>
                <button
                  type="button"
                  onClick={() => setIsAddingSite(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Site Label</label>
                <input
                  type="text"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="e.g. Silk Board Junction Relief"
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Intervention Category</label>
                <select
                  value={newSiteCategory}
                  onChange={(e) => setNewSiteCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-400"
                >
                  <option value="adaptiveSignals">🚦 Adaptive Signal Junction</option>
                  <option value="busPriority">🚌 Bus Priority Corridor (BRT)</option>
                  <option value="greenWalkways">🌳 Active Green Walkway</option>
                  <option value="emergencyRoute">🏥 Emergency Corridor Feeder</option>
                  <option value="unmapped">🔍 Field Observation (GIS Geometry Only)</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">CityTwin Simulation Link</label>
                  <span className="text-[9px] text-teal-400">BPR Model Link</span>
                </div>
                <select
                  value={newSiteMappedBenchmark}
                  onChange={(e) => setNewSiteMappedBenchmark(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-400 font-mono"
                >
                  <option value="unmapped">⚠️ None / Unmapped (Field Observation Only)</option>
                  <optgroup label="Active Hub Nodes (Signals / Priority)">
                    {activeNodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Active Road Segments (Transit / Walkways)">
                    {activeSegments.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.lengthKm} km)</option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-400">
                  {newSiteMappedBenchmark === 'unmapped'
                    ? 'Candidate will be stored for observation without generating fabricated simulation metrics.'
                    : 'Candidate will automatically activate deterministic BPR calculations for this network corridor.'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Planning Notes</label>
                <textarea
                  value={newSiteNotes}
                  onChange={(e) => setNewSiteNotes(e.target.value)}
                  placeholder="Notes on turning radius, lane geometry, or transit frequency..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-400 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveCandidateSite(false)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Pin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCandidateSite(true)}
                  className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1"
                >
                  <span>Save &amp; Send to Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* Candidate Sites List */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Active Candidate Sites</span>
              {importedCandidates.length > 0 && onOpenScenarioLab && (
                <button
                  type="button"
                  onClick={onOpenScenarioLab}
                  className="text-teal-400 hover:text-teal-300 font-normal flex items-center gap-1"
                >
                  <span>{importedCandidates.length} in Lab</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {candidateSites.map((site) => {
                const colorInfo = getCategoryColor(site.category);
                const isInLab = importedCandidates.some((c) => c.id === site.id);
                return (
                  <div
                    key={site.id}
                    className={`p-2.5 rounded-xl border transition-all text-xs cursor-pointer ${
                      activeSiteForInfo?.id === site.id
                        ? 'bg-slate-800/90 border-teal-500/60 shadow-md ring-1 ring-teal-500/30'
                        : isInLab
                        ? 'bg-slate-900/80 border-teal-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                    onClick={() => {
                      setActiveSiteForInfo(site);
                      setSelectedCoord(site.position);
                      setSelectedLocationName(site.name);
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-semibold text-white truncate">{site.name}</div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCandidateSite(site.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                        title="Remove candidate pin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: colorInfo.bg }}
                      />
                      <span className="text-[10px] text-slate-300 truncate">{colorInfo.label}</span>
                      {site.isSimulatable ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-teal-500/15 text-teal-300 border border-teal-500/30 ml-auto shrink-0">
                          Simulatable
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800 text-slate-400 border border-slate-700 ml-auto shrink-0">
                          Unmapped
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      {site.notes}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-mono">
                        {site.position.lat.toFixed(3)}, {site.position.lng.toFixed(3)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendCandidateToLab(site);
                        }}
                        className={`px-2 py-1 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-sm ${
                          isInLab
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                            : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40'
                        }`}
                        title="Send candidate to Scenario Lab"
                      >
                        <span>{isInLab ? '✓ In Lab' : 'Send to Lab'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Real City Road Network Area Import Modal */}
      {onImportNetworkToDemoCity && (
        <AreaImportModal
          isOpen={isAreaImportModalOpen}
          onClose={() => setIsAreaImportModalOpen(false)}
          targetCoords={
            selectedCoord ||
            DEFAULT_CITY_PRESETS.find((p) =>
              p.name.toLowerCase().includes(activeSearchQuery.toLowerCase())
            )?.coords || { lat: 12.9716, lng: 77.5946 }
          }
          targetLocationName={selectedLocationName || activeSearchQuery || 'Real City Area'}
          onConfirmImport={(preview) => {
            onImportNetworkToDemoCity(preview.rawNetwork);
          }}
        />
      )}
    </div>
  );
}
