import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { CityMap } from './components/CityMap';
import { RealCityMap, INITIAL_REAL_CITY_CANDIDATES } from './components/RealCityMap';
import { ScenarioLab } from './components/ScenarioLab';
import { ComparePlans } from './components/ComparePlans';
import { SavedScenarios } from './components/SavedScenarios';
import { PlanningAssistant } from './components/PlanningAssistant';
import { SettingsModal } from './components/SettingsModal';
import { ValidationModal } from './components/ValidationModal';
import {
  getInitialScenarios,
  runSimulation,
  BASELINE_INTERVENTIONS,
  HOSPITAL_RELIEF_INTERVENTIONS,
  CITY_NODES,
  ROAD_SEGMENTS,
} from './simulation/engine';
import {
  Scenario,
  ScenarioInterventions,
  RealCityCandidate,
  CityNetwork,
  CityNode,
  RoadSegment,
} from './types/simulation';
import { ImportedCityNetwork, logOsmDiagnostic } from './services/osmImportService';
import { Check, AlertCircle, Globe, Layers, MapPin, Loader2, Building2 } from 'lucide-react';
import {
  loadAllScenarios,
  persistScenario,
  deleteScenarioFromStorage,
  renameScenario as renameScenarioInStorage,
} from './services/scenarioService';
import { isSupabaseConfigured, testSupabaseConnection } from './lib/supabase';
import { AuthProvider, useAuth } from './lib/authContext';
import { RouterProvider, useRouter } from './lib/router';
import { LandingPage } from './components/public/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { AuthCallback } from './components/auth/AuthCallback';

const BASELINE_DEMO_NETWORK: CityNetwork = {
  nodes: CITY_NODES,
  roadSegments: ROAD_SEGMENTS,
  cityName: 'CityTwin Benchmark Demo City',
  isImported: false,
  source: 'demo',
};

function SimulatorApp() {
  const { user } = useAuth();
  const currentUserId = user?.id || null;

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mapMode, setMapMode] = useState<'demo' | 'real'>('demo');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Active City Network (defaults to baseline demo city, can be edited or imported from real cities)
  const [activeNetwork, setActiveNetwork] = useState<CityNetwork>(BASELINE_DEMO_NETWORK);

  // System benchmark presets (read-only reference benchmarks)
  const systemPresets = useMemo(() => getInitialScenarios(), []);
  const baselineScenario = useMemo(
    () => systemPresets.find((s) => s.isBaseline) || systemPresets[0],
    [systemPresets]
  );

  // Personal user scenarios: newly registered users start with []
  const [userScenarios, setUserScenarios] = useState<Scenario[]>([]);

  // Persistence status state
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [dbSource, setDbSource] = useState<'supabase' | 'local'>('local');
  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);

  // Lifted Real City Candidate Sites (persistent across mode and tab changes)
  const [candidateSites, setCandidateSites] = useState<RealCityCandidate[]>(() => INITIAL_REAL_CITY_CANDIDATES);

  // Active scenario imported real-city candidates
  const [importedCandidates, setImportedCandidates] = useState<RealCityCandidate[]>(() => []);

  // Active scenario selection: defaults to baseline reference for a fresh workspace
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario_baseline');

  const activeScenario = useMemo(() => {
    return (
      userScenarios.find((s) => s.id === activeScenarioId) ||
      systemPresets.find((s) => s.id === activeScenarioId) ||
      baselineScenario
    );
  }, [userScenarios, systemPresets, activeScenarioId, baselineScenario]);

  const [currentInterventions, setCurrentInterventions] = useState<ScenarioInterventions>(
    () => activeScenario.interventions
  );

  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Recalculate simulation result dynamically whenever current interventions or network topology change
  const currentSimulationResult = useMemo(() => {
    return runSimulation(currentInterventions, activeNetwork.nodes, activeNetwork.roadSegments);
  }, [currentInterventions, activeNetwork]);

  // Active scenario synced with live calculated metrics, network topology, and imported candidates
  const activeScenarioWithLiveResult: Scenario = useMemo(() => {
    return {
      ...activeScenario,
      interventions: currentInterventions,
      results: currentSimulationResult,
      importedRealCityCandidates: importedCandidates,
      network: activeNetwork,
    };
  }, [activeScenario, currentInterventions, currentSimulationResult, importedCandidates, activeNetwork]);

  // Authoritative deduplicated list of available presets and personal scenarios
  const availableScenarios = useMemo(() => {
    const list: Scenario[] = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    // 1. Authoritative system presets first (stable IDs)
    for (const preset of systemPresets) {
      if (!seenIds.has(preset.id)) {
        seenIds.add(preset.id);
        seenNames.add(preset.name.trim().toLowerCase());
        list.push(preset);
      }
    }

    // 2. Personal user scenarios (deduplicating accidental duplicate saves)
    for (const sc of userScenarios) {
      if (seenIds.has(sc.id)) continue;
      const normName = sc.name.trim().toLowerCase();
      // If a user scenario has exact same name as a preset and no custom user id, skip duplicate
      if (seenNames.has(normName) && !sc.userId) continue;

      seenIds.add(sc.id);
      seenNames.add(normName);
      list.push(sc);
    }

    return list;
  }, [systemPresets, userScenarios]);

  // Comparison scenarios list with live result for active scenario
  const comparePlansScenarios = useMemo(() => {
    return availableScenarios.map((s) =>
      s.id === activeScenario.id ? activeScenarioWithLiveResult : s
    );
  }, [availableScenarios, activeScenario.id, activeScenarioWithLiveResult]);

  // Stale request prevention token ref
  const activeFetchIdRef = useRef<number>(0);

  // Load user-scoped scenarios on mount or when user account changes
  useEffect(() => {
    activeFetchIdRef.current += 1;
    const fetchId = activeFetchIdRef.current;

    // Reset in-memory state on account switch or logout so data cannot flash
    setUserScenarios([]);
    setActiveScenarioId('scenario_baseline');
    setCurrentInterventions(BASELINE_INTERVENTIONS);
    setImportedCandidates([]);
    setActiveNetwork(BASELINE_DEMO_NETWORK);

    if (!user) {
      return;
    }

    const initPersistence = async () => {
      setIsDbLoading(true);
      const configured = isSupabaseConfigured();
      if (configured) {
        const testRes = await testSupabaseConnection();
        if (activeFetchIdRef.current === fetchId) {
          setIsDbConnected(testRes.connected);
          if (!testRes.connected) {
            setDbErrorMessage(testRes.message);
          }
        }
      } else {
        if (activeFetchIdRef.current === fetchId) {
          setIsDbConnected(false);
          setDbErrorMessage(null);
        }
      }

      const loadRes = await loadAllScenarios(user.id);
      // Discard stale responses from prior users or cancelled fetches
      if (activeFetchIdRef.current === fetchId) {
        setDbSource(loadRes.source);
        setUserScenarios(loadRes.scenarios);

        if (loadRes.scenarios.length > 0) {
          // Returning user with saved scenarios: load the most recent one
          const first = loadRes.scenarios[0];
          setActiveScenarioId(first.id);
          setCurrentInterventions(first.interventions);
          setImportedCandidates(first.importedRealCityCandidates || []);
          setActiveNetwork(first.network || BASELINE_DEMO_NETWORK);
        } else {
          // Freshly registered user: start with clean unmanaged baseline
          setActiveScenarioId('scenario_baseline');
          setCurrentInterventions(BASELINE_INTERVENTIONS);
          setImportedCandidates([]);
          setActiveNetwork(BASELINE_DEMO_NETWORK);
        }

        if (loadRes.error && configured) {
          setDbErrorMessage(loadRes.error);
        }
        setIsDbLoading(false);
      }
    };

    initPersistence();
  }, [user?.id]);

  // Listen to Google Maps quota exceeded events (Tier 1 & 2 Quota Defense)
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Switch / Load a user scenario or system preset atomically
  const handleLoadScenario = (scenarioId: string) => {
    const target =
      userScenarios.find((s) => s.id === scenarioId) ||
      systemPresets.find((s) => s.id === scenarioId);
    if (!target) return;

    setActiveScenarioId(target.id);
    const clonedInterventions: ScenarioInterventions = JSON.parse(JSON.stringify(target.interventions));
    setCurrentInterventions(clonedInterventions);
    setImportedCandidates(
      target.importedRealCityCandidates
        ? JSON.parse(JSON.stringify(target.importedRealCityCandidates))
        : []
    );
    if (target.network) {
      setActiveNetwork(JSON.parse(JSON.stringify(target.network)));
    } else {
      setActiveNetwork(BASELINE_DEMO_NETWORK);
    }
    showToast(`Loaded "${target.name}" into simulation engine.`);
  };

  // Explicitly load a system benchmark preset into Scenario Lab
  const handleLoadPreset = (presetId: string) => {
    handleLoadScenario(presetId);
  };

  // Reset to clean Baseline state
  const handleResetBaseline = () => {
    setActiveScenarioId('scenario_baseline');
    setCurrentInterventions(BASELINE_INTERVENTIONS);
    setImportedCandidates([]);
    setActiveNetwork(BASELINE_DEMO_NETWORK);
    showToast('Reset to Baseline City Network conditions.');
  };

  // Refresh scenarios from database / user storage
  const handleRefreshScenarios = async () => {
    if (!user) return;
    setIsDbLoading(true);
    const configured = isSupabaseConfigured();
    if (configured) {
      const testRes = await testSupabaseConnection();
      setIsDbConnected(testRes.connected);
      if (!testRes.connected) setDbErrorMessage(testRes.message);
    }
    const loadRes = await loadAllScenarios(user.id);
    setDbSource(loadRes.source);
    setUserScenarios(loadRes.scenarios);
    setIsDbLoading(false);
    showToast(
      loadRes.source === 'supabase'
        ? 'Refreshed scenarios from Supabase PostgreSQL.'
        : 'Refreshed scenarios from local storage.'
    );
  };

  // Apply edited network from CityMap (Demo City Edit Mode)
  const handleApplyNetworkEdits = (
    newNodes: CityNode[],
    newSegments: RoadSegment[],
    newCityName?: string
  ) => {
    setActiveNetwork((prev) => ({
      ...prev,
      nodes: newNodes,
      roadSegments: newSegments,
      cityName: newCityName || prev.cityName,
      updatedAt: new Date().toISOString(),
    }));
    showToast(`Applied network edits to ${newCityName || activeNetwork.cityName}. Simulation updated.`);
  };

  // Reset to original Demo City network
  const handleResetOriginalDemoCity = () => {
    setActiveNetwork(BASELINE_DEMO_NETWORK);
    showToast('Restored baseline Demo City road network.');
  };

  // Import real city network into Demo City
  const handleImportNetworkToDemoCity = (imported: ImportedCityNetwork) => {
    logOsmDiagnostic('Active Network Updating in App State', {
      cityName: imported.cityName,
      source: imported.source,
      nodeCount: imported.nodes.length,
      segmentCount: imported.roadSegments.length,
      centerCoords: imported.centerCoords,
      radiusMeters: imported.radiusMeters,
    });

    const newNetwork: CityNetwork = {
      nodes: imported.nodes,
      roadSegments: imported.roadSegments,
      cityName: imported.cityName,
      isImported: true,
      importedAt: imported.importedAt,
      source: imported.source,
      centerCoords: imported.centerCoords,
      radiusMeters: imported.radiusMeters,
      originalNodesCount: imported.originalNodesCount,
      originalSegmentsCount: imported.originalSegmentsCount,
      updatedAt: new Date().toISOString(),
    };
    setActiveNetwork(newNetwork);
    setMapMode('demo');
    setActiveTab('city_map');
    showToast(`Successfully imported ${imported.cityName} (${imported.roadSegments.length} corridors) into Demo City!`);

    logOsmDiagnostic('Active Network Updated Successfully', {
      cityName: newNetwork.cityName,
      mapMode: 'demo',
      activeTab: 'city_map',
    });
  };

  // Save customized scenario (supports updating active scenario or creating new copy)
  const handleSaveScenario = async (
    name: string,
    description: string,
    existingIdToUpdate?: string
  ) => {
    const isUpdate = Boolean(existingIdToUpdate);
    const targetId = existingIdToUpdate || `scenario_user_${Date.now()}`;

    const scenarioToPersist: Scenario = {
      id: targetId,
      name,
      tagline: isUpdate ? activeScenario.tagline : 'Custom Municipal Policy Intervention',
      description,
      interventions: currentInterventions,
      results: currentSimulationResult,
      updatedAt: new Date().toISOString(),
      importedRealCityCandidates: importedCandidates,
      network: activeNetwork,
      isBaseline: false,
      isPreset: false,
      userId: currentUserId || undefined,
    };

    setIsDbLoading(true);
    const res = await persistScenario(scenarioToPersist, currentUserId);
    setIsDbLoading(false);

    if (!res.success) {
      // Truthful error reporting: never claim database write success on failure!
      showToast(`Database write error: ${res.error || 'Failed to persist scenario'}`);
      setDbErrorMessage(res.error || 'Database write error');
      return;
    }

    // Success in persistence: update personal scenario list
    setUserScenarios((prev) => {
      const idx = prev.findIndex((s) => s.id === targetId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = scenarioToPersist;
        return copy;
      }
      return [scenarioToPersist, ...prev];
    });

    setActiveScenarioId(targetId);

    if (res.isLocalFallback) {
      showToast(`Saved "${name}" locally (Configure Supabase for cloud sync).`);
    } else {
      showToast(`Saved "${name}" to your workspace.`);
    }
  };

  // Rename scenario
  const handleRenameScenario = async (scenarioId: string, newName: string) => {
    const target = userScenarios.find((s) => s.id === scenarioId);
    if (!target) return;

    setIsDbLoading(true);
    const res = await renameScenarioInStorage(scenarioId, newName, target, currentUserId);
    setIsDbLoading(false);

    if (!res.success) {
      showToast(`Rename failed: ${res.error}`);
      return;
    }

    setUserScenarios((prev) =>
      prev.map((s) => (s.id === scenarioId ? { ...s, name: newName.trim() } : s))
    );
    showToast(`Renamed scenario to "${newName.trim()}".`);
  };

  // Delete custom scenario
  const handleDeleteScenario = async (scenarioId: string) => {
    setIsDbLoading(true);
    const res = await deleteScenarioFromStorage(scenarioId, currentUserId);
    setIsDbLoading(false);

    if (!res.success) {
      showToast(`Failed to delete: ${res.error}`);
      return;
    }

    setUserScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
    if (activeScenarioId === scenarioId) {
      setActiveScenarioId('scenario_baseline');
      setCurrentInterventions(BASELINE_INTERVENTIONS);
      setImportedCandidates([]);
    }
    showToast('Scenario removed from repository.');
  };


  // Export Plan Report
  const handleExportReport = () => {
    const reportData = {
      app: 'CityTwin Urban Planning Simulator',
      planName: activeScenario.name,
      exportedAt: new Date().toISOString(),
      metrics: currentSimulationResult.metrics,
      interventions: currentInterventions,
      corridorResults: currentSimulationResult.segmentResults,
      assumptions: currentSimulationResult.assumptionsApplied,
      importedRealCityCandidates: importedCandidates,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeScenario.name.toLowerCase().replace(/\s+/g, '_')}_audit.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported report for "${activeScenario.name}".`);
  };

  // Real-City Candidate Site Handlers
  const handleAddCandidateSite = (site: RealCityCandidate) => {
    setCandidateSites((prev) => [site, ...prev]);
    showToast(`Pinned "${site.name}" as real-world candidate site.`);
  };

  const handleDeleteCandidateSite = (siteId: string) => {
    setCandidateSites((prev) => prev.filter((s) => s.id !== siteId));
    showToast('Candidate site pin removed.');
  };

  // Handoff: Send Candidate Site to Scenario Lab
  const handleSendCandidateToLab = (candidate: RealCityCandidate) => {
    // 1. Avoid duplicate entries in imported candidates list
    setImportedCandidates((prev) => {
      const exists = prev.some((c) => c.id === candidate.id);
      if (exists) {
        return prev.map((c) => (c.id === candidate.id ? candidate : c));
      }
      return [candidate, ...prev];
    });

    // 2. Validate benchmark mapping against active network
    const validNode = activeNetwork.nodes.find((n) => n.id === candidate.mappedBenchmarkId);
    const validSeg = activeNetwork.roadSegments.find((s) => s.id === candidate.mappedBenchmarkId);
    const isValidMapping = Boolean(validNode || validSeg) && candidate.mappedBenchmarkId !== 'unmapped';

    // 3. Preselect corresponding simulation intervention when mapping is valid
    if (isValidMapping) {
      setCurrentInterventions((prev) => {
        const next = { ...prev };
        if (candidate.category === 'adaptiveSignals') {
          if (validNode) {
            next.adaptiveSignals = {
              ...next.adaptiveSignals,
              enabled: true,
              targetNodeIds: next.adaptiveSignals.targetNodeIds.includes(validNode.id)
                ? next.adaptiveSignals.targetNodeIds
                : [...next.adaptiveSignals.targetNodeIds, validNode.id],
            };
          } else if (validSeg) {
            const endpoints = [validSeg.fromNodeId, validSeg.toNodeId];
            next.adaptiveSignals = {
              ...next.adaptiveSignals,
              enabled: true,
              targetNodeIds: Array.from(new Set([...next.adaptiveSignals.targetNodeIds, ...endpoints])),
            };
          }
        } else if (candidate.category === 'busPriority') {
          if (validSeg) {
            next.busPriority = {
              ...next.busPriority,
              enabled: true,
              targetSegmentIds: next.busPriority.targetSegmentIds.includes(validSeg.id)
                ? next.busPriority.targetSegmentIds
                : [...next.busPriority.targetSegmentIds, validSeg.id],
            };
          } else if (validNode) {
            const transitSegs = activeNetwork.roadSegments.filter(
              (s) => (s.fromNodeId === validNode.id || s.toNodeId === validNode.id) && s.hasTransitCorridorPotential
            ).map((s) => s.id);
            if (transitSegs.length > 0) {
              next.busPriority = {
                ...next.busPriority,
                enabled: true,
                targetSegmentIds: Array.from(new Set([...next.busPriority.targetSegmentIds, ...transitSegs])),
              };
            }
          }
        } else if (candidate.category === 'greenWalkways') {
          if (validSeg) {
            next.greenWalkways = {
              ...next.greenWalkways,
              enabled: true,
              targetSegmentIds: next.greenWalkways.targetSegmentIds.includes(validSeg.id)
                ? next.greenWalkways.targetSegmentIds
                : [...next.greenWalkways.targetSegmentIds, validSeg.id],
            };
          } else if (validNode) {
            const greenSegs = activeNetwork.roadSegments.filter(
              (s) => (s.fromNodeId === validNode.id || s.toNodeId === validNode.id) && s.hasActiveMobilityPotential
            ).map((s) => s.id);
            if (greenSegs.length > 0) {
              next.greenWalkways = {
                ...next.greenWalkways,
                enabled: true,
                targetSegmentIds: Array.from(new Set([...next.greenWalkways.targetSegmentIds, ...greenSegs])),
              };
            }
          }
        } else if (candidate.category === 'emergencyRoute') {
          if (validSeg) {
            next.busPriority = {
              ...next.busPriority,
              enabled: true,
              dedicatedLane: true,
              targetSegmentIds: next.busPriority.targetSegmentIds.includes(validSeg.id)
                ? next.busPriority.targetSegmentIds
                : [...next.busPriority.targetSegmentIds, validSeg.id],
            };
          } else if (validNode) {
            next.adaptiveSignals = {
              ...next.adaptiveSignals,
              enabled: true,
              targetNodeIds: next.adaptiveSignals.targetNodeIds.includes(validNode.id)
                ? next.adaptiveSignals.targetNodeIds
                : [...next.adaptiveSignals.targetNodeIds, validNode.id],
            };
          }
        }
        return next;
      });

      showToast(`Candidate "${candidate.name}" added to Scenario Lab. Simulation controls preselected!`);
    } else {
      showToast(`Candidate "${candidate.name}" added to Scenario Lab as unmapped field observation.`);
    }

    // 4. Navigate directly to Scenario Lab view
    setActiveTab('scenario_lab');
  };

  const handleRemoveImportedCandidate = (candidateId: string) => {
    setImportedCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    showToast('Removed candidate from active scenario.');
  };

  // When goal assistant extracts parameters and user clicks apply
  const handleApplyGoalScenario = (
    newInterventions: ScenarioInterventions,
    planName?: string,
    planDescription?: string
  ) => {
    setCurrentInterventions(newInterventions);

    if (planName) {
      const generatedId = `scenario_ai_${Date.now()}`;
      const newPlanResult = runSimulation(
        newInterventions,
        activeNetwork.nodes,
        activeNetwork.roadSegments
      );
      const newScenario: Scenario = {
        id: generatedId,
        name: planName.length > 38 ? `${planName.slice(0, 35)}...` : planName,
        tagline: 'Gemini-Synthesized Urban Plan',
        description: planDescription || 'Synthesized using server-side Gemini 3.8 Flash.',
        interventions: newInterventions,
        results: newPlanResult,
        updatedAt: new Date().toISOString(),
        network: activeNetwork,
        userId: currentUserId || undefined,
      };
      persistScenario(newScenario, currentUserId);
      setUserScenarios((prev) => [newScenario, ...prev]);
      setActiveScenarioId(generatedId);
      showToast(`Applied and saved plan "${newScenario.name}".`);
    } else {
      showToast('Applied goal parameters to Scenario Lab.');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080d1a] text-slate-100 antialiased flex-col">
      {/* Google Maps Quota Reached Banner (Required by Client-Side Quota Defense) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm shrink-0">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeScenario={activeScenarioWithLiveResult}
          onOpenValidationModal={() => setValidationModalOpen(true)}
        />

        {/* Main Viewport */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Bar Header */}
          <TopBar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            activeScenario={activeScenarioWithLiveResult}
            onResetBaseline={handleResetBaseline}
            onNewScenario={() => {
              setActiveTab('scenario_lab');
              handleResetBaseline();
            }}
            onExportReport={handleExportReport}
          />

          {/* Dynamic Main Content Container */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                currentScenario={activeScenarioWithLiveResult}
                baselineScenario={baselineScenario}
                scenarios={userScenarios}
                onSelectTab={setActiveTab}
                onLoadScenario={(id) => {
                  handleLoadScenario(id);
                  setActiveTab('scenario_lab');
                }}
                onLoadPreset={(id) => {
                  handleLoadPreset(id);
                  setActiveTab('scenario_lab');
                }}
                onOpenRealCity={() => {
                  setMapMode('real');
                  setActiveTab('city_map');
                }}
                userEmail={user?.email}
                activeNetwork={activeNetwork}
              />
            )}

            {activeTab === 'city_map' && (
              <div className="space-y-4">
                {/* Header with Mode Toggle: Demo City vs Real City */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#090e1f] p-3.5 rounded-2xl border border-slate-800 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white tracking-tight">
                        {mapMode === 'demo' ? 'City Network Live Vector Map' : 'Real City Geospatial GIS Exploration'}
                      </h2>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                        mapMode === 'demo' ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {mapMode === 'demo' ? 'BPR Simulation Engine' : 'Google Maps Platform'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {mapMode === 'demo'
                        ? 'Hospital Junction, College Road, Market Square corridors with live deterministic traffic flow.'
                        : 'Search global metropolitan networks and pin candidate intervention sites with real-world satellite imagery.'}
                    </p>
                  </div>

                  {/* Mode Toggle Button Group */}
                  <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shrink-0 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setMapMode('demo')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        mapMode === 'demo'
                          ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-slate-950 shadow-md'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Demo City (Vector Grid)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapMode('real')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        mapMode === 'real'
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Real City (Google Maps)</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Rendering of Map Modes */}
                {mapMode === 'demo' ? (
                  <CityMap
                    simulationResult={currentSimulationResult}
                    nodes={activeNetwork.nodes}
                    roadSegments={activeNetwork.roadSegments}
                    cityName={activeNetwork.cityName}
                    isImported={activeNetwork.isImported}
                    onApplyNetworkEdits={handleApplyNetworkEdits}
                    onResetOriginalDemoCity={handleResetOriginalDemoCity}
                    onOpenScenarioLab={() => setActiveTab('scenario_lab')}
                  />
                ) : (
                  <RealCityMap
                    simulationResult={currentSimulationResult}
                    candidateSites={candidateSites}
                    onAddCandidateSite={handleAddCandidateSite}
                    onDeleteCandidateSite={handleDeleteCandidateSite}
                    onSendCandidateToLab={handleSendCandidateToLab}
                    importedCandidates={importedCandidates}
                    onOpenScenarioLab={() => setActiveTab('scenario_lab')}
                    onImportNetworkToDemoCity={handleImportNetworkToDemoCity}
                    activeNetworkCityName={activeNetwork.cityName}
                    nodes={activeNetwork.nodes}
                    roadSegments={activeNetwork.roadSegments}
                  />
                )}
              </div>
            )}

          {activeTab === 'scenario_lab' && (
            <ScenarioLab
              interventions={currentInterventions}
              onChangeInterventions={setCurrentInterventions}
              simulationResult={currentSimulationResult}
              baselineResult={baselineScenario.results}
              scenarios={availableScenarios}
              activeScenario={activeScenarioWithLiveResult}
              onLoadPreset={handleLoadScenario}
              onSaveScenario={handleSaveScenario}
              onGoToCompare={() => setActiveTab('compare_plans')}
              importedCandidates={importedCandidates}
              onRemoveImportedCandidate={handleRemoveImportedCandidate}
              onReapplyCandidate={handleSendCandidateToLab}
              onGoToRealCity={() => {
                setActiveTab('city_map');
                setMapMode('real');
              }}
              nodes={activeNetwork.nodes}
              roadSegments={activeNetwork.roadSegments}
              cityName={activeNetwork.cityName}
            />
          )}

          {activeTab === 'compare_plans' && (
            <ComparePlans
              scenarios={comparePlansScenarios}
              activeScenario={activeScenarioWithLiveResult}
            />
          )}

          {activeTab === 'saved_scenarios' && (
            <SavedScenarios
              scenarios={userScenarios.map((s) =>
                s.id === activeScenario.id ? activeScenarioWithLiveResult : s
              )}
              activeScenarioId={activeScenarioId}
              onSelectScenario={(id) => {
                handleLoadScenario(id);
                setActiveTab('scenario_lab');
              }}
              onDeleteScenario={handleDeleteScenario}
              onRenameScenario={handleRenameScenario}
              onRefreshScenarios={handleRefreshScenarios}
              presets={systemPresets}
              onLoadPreset={(id) => {
                handleLoadPreset(id);
                setActiveTab('scenario_lab');
              }}
              isDbConnected={isDbConnected}
              dbSource={dbSource}
              isLoading={isDbLoading}
              dbErrorMessage={dbErrorMessage}
              onGoToCompare={(id) => {
                handleLoadScenario(id);
                setActiveTab('compare_plans');
              }}
              onGoToLab={() => setActiveTab('scenario_lab')}
            />
          )}

          {activeTab === 'assistant' && (
            <PlanningAssistant
              onApplyGoalScenario={handleApplyGoalScenario}
              onGoToLab={() => setActiveTab('scenario_lab')}
              activeNetwork={activeNetwork}
              currentInterventions={currentInterventions}
              currentSimulationResult={currentSimulationResult}
            />
          )}

          {activeTab === 'settings' && <SettingsModal />}
        </main>
      </div>
      </div>

      {/* Math Verification Suite Modal */}
      <ValidationModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0e1738] border border-teal-500/40 text-teal-200 text-xs shadow-xl animate-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

function AppRouter() {
  const { path, navigate } = useRouter();
  const { user, loading } = useAuth();

  // Root public route: Landing Page
  if (path === '/') {
    return <LandingPage />;
  }

  // Authentication routes
  if (path === '/login') {
    return <LoginPage />;
  }

  if (path === '/signup') {
    return <SignupPage />;
  }

  if (path === '/auth/callback') {
    return <AuthCallback />;
  }

  // Protected Simulator routes (/app, /simulator, /dashboard, etc.)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070c1e] text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
          <Building2 className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
          <span>Restoring municipal session...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated, redirect to /login with return path
  if (!user) {
    navigate(`/login?redirect=${encodeURIComponent(path)}`, { replace: true });
    return (
      <div className="min-h-screen bg-[#070c1e] text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
          <span>Redirecting to authentication...</span>
        </div>
      </div>
    );
  }

  // Authenticated access: Render full CityTwin Simulator
  return <SimulatorApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppRouter />
      </RouterProvider>
    </AuthProvider>
  );
}
