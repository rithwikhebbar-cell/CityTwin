import React, { useState, useRef, useEffect } from 'react';
import {
  CityNode,
  RoadSegment,
  SimulationResult,
  ZoneType,
  NetworkEditTool,
} from '../types/simulation';
import { CITY_NODES, ROAD_SEGMENTS } from '../simulation/engine';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Bus,
  Trees,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Gauge,
  Clock,
  Wind,
  Layers,
  Edit3,
  MousePointer,
  PlusCircle,
  GitBranch,
  Trash2,
  RotateCcw,
  Check,
  X,
  Info,
  ShieldAlert,
  Building2,
  Move,
} from 'lucide-react';

interface CityMapProps {
  simulationResult: SimulationResult;
  nodes?: CityNode[];
  roadSegments?: RoadSegment[];
  cityName?: string;
  isImported?: boolean;
  onSelectSegment?: (segmentId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  onApplyNetworkEdits?: (nodes: CityNode[], roadSegments: RoadSegment[], cityName?: string) => void;
  onResetOriginalDemoCity?: () => void;
  onOpenScenarioLab?: () => void;
}

export const CityMap: React.FC<CityMapProps> = ({
  simulationResult,
  nodes: propNodes = CITY_NODES,
  roadSegments: propSegments = ROAD_SEGMENTS,
  cityName = 'Demo City',
  isImported = false,
  onSelectSegment,
  onSelectNode,
  onApplyNetworkEdits,
  onResetOriginalDemoCity,
  onOpenScenarioLab,
}) => {
  // Editing mode states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<NetworkEditTool>('select');
  const [draftNodes, setDraftNodes] = useState<CityNode[]>(() => propNodes);
  const [draftSegments, setDraftSegments] = useState<RoadSegment[]>(() => propSegments);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ nodes: CityNode[]; segments: RoadSegment[] }>>([]);
  const [roadStartNodeId, setRoadStartNodeId] = useState<string | null>(null);

  // Active elements
  const currentNodes = isEditing ? draftNodes : propNodes;
  const currentSegments = isEditing ? draftSegments : propSegments;

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(() =>
    currentSegments[0]?.id || null
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Canvas zoom & layers
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showBusLayer, setShowBusLayer] = useState<boolean>(true);
  const [showGreenLayer, setShowGreenLayer] = useState<boolean>(true);
  const [showDistricts, setShowDistricts] = useState<boolean>(true);

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Confirmation modals
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    type: 'node' | 'segment';
    id: string;
    name: string;
    connectedSegmentNames?: string[];
  }>({ isOpen: false, type: 'node', id: '', name: '' });

  const [confirmResetModal, setConfirmResetModal] = useState<boolean>(false);

  // Keep draft in sync if external props change while NOT editing
  useEffect(() => {
    if (!isEditing) {
      setDraftNodes(propNodes);
      setDraftSegments(propSegments);
      setHasUnsavedChanges(false);
      setHistory([]);
      if (
        selectedSegmentId &&
        !propSegments.some((s) => s.id === selectedSegmentId)
      ) {
        setSelectedSegmentId(propSegments[0]?.id || null);
      }
      if (selectedNodeId && !propNodes.some((n) => n.id === selectedNodeId)) {
        setSelectedNodeId(null);
      }
    }
  }, [propNodes, propSegments, isEditing]);

  const { segmentResults = {}, nodeResults = {} } = simulationResult;

  // Push snapshot to undo history
  const pushHistory = (newNodes: CityNode[], newSegs: RoadSegment[]) => {
    setHistory((prev) => [...prev.slice(-15), { nodes: draftNodes, segments: draftSegments }]);
    setDraftNodes(newNodes);
    setDraftSegments(newSegs);
    setHasUnsavedChanges(true);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setDraftNodes(last.nodes);
    setDraftSegments(last.segments);
    setHasUnsavedChanges(true);
  };

  const handleStartEdit = () => {
    setDraftNodes(JSON.parse(JSON.stringify(propNodes)));
    setDraftSegments(JSON.parse(JSON.stringify(propSegments)));
    setHistory([]);
    setHasUnsavedChanges(false);
    setActiveTool('select');
    setRoadStartNodeId(null);
    setValidationErrors([]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('Discard unsaved network edits and revert to the saved city?')) {
        return;
      }
    }
    setDraftNodes(propNodes);
    setDraftSegments(propSegments);
    setHasUnsavedChanges(false);
    setHistory([]);
    setRoadStartNodeId(null);
    setValidationErrors([]);
    setIsEditing(false);
  };

  const validateDraftNetwork = (nodes: CityNode[], segs: RoadSegment[]): string[] => {
    const errs: string[] = [];
    if (nodes.length < 2) {
      errs.push('Network must contain at least 2 junction hubs.');
    }
    if (segs.length < 1) {
      errs.push('Network must contain at least 1 road segment.');
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    if (nodeIds.size !== nodes.length) {
      errs.push('Duplicate junction IDs detected.');
    }

    const segIds = new Set(segs.map((s) => s.id));
    if (segIds.size !== segs.length) {
      errs.push('Duplicate road segment IDs detected.');
    }

    for (const seg of segs) {
      if (!nodeIds.has(seg.fromNodeId) || !nodeIds.has(seg.toNodeId)) {
        errs.push(`Road "${seg.name}" connects to a missing junction node.`);
      }
      if (seg.fromNodeId === seg.toNodeId) {
        errs.push(`Road "${seg.name}" cannot connect a junction to itself.`);
      }
      if (seg.lanes < 1) {
        errs.push(`Road "${seg.name}" must have at least 1 lane.`);
      }
      if (seg.lengthKm <= 0) {
        errs.push(`Road "${seg.name}" length must be greater than 0.`);
      }
      if (seg.baseCapacityPerHour <= 0) {
        errs.push(`Road "${seg.name}" capacity must be positive.`);
      }
    }

    return errs;
  };

  const handleApplyEdits = () => {
    const errs = validateDraftNetwork(draftNodes, draftSegments);
    if (errs.length > 0) {
      setValidationErrors(errs);
      return;
    }

    setValidationErrors([]);
    setIsEditing(false);
    setHasUnsavedChanges(false);
    onApplyNetworkEdits?.(draftNodes, draftSegments, cityName);
  };

  const handleSegmentClick = (segId: string) => {
    setSelectedSegmentId(segId);
    setSelectedNodeId(null);
    onSelectSegment?.(segId);
  };

  const handleNodeClick = (nodeId: string) => {
    if (isEditing && activeTool === 'add_road') {
      if (!roadStartNodeId) {
        setRoadStartNodeId(nodeId);
      } else if (roadStartNodeId === nodeId) {
        setRoadStartNodeId(null);
      } else {
        // Connect roadStartNodeId to nodeId
        const exists = draftSegments.some(
          (s) =>
            (s.fromNodeId === roadStartNodeId && s.toNodeId === nodeId) ||
            (s.fromNodeId === nodeId && s.toNodeId === roadStartNodeId)
        );
        if (exists) {
          alert('A road segment already connects these two junctions.');
          setRoadStartNodeId(null);
          return;
        }

        const fromNode = draftNodes.find((n) => n.id === roadStartNodeId)!;
        const toNode = draftNodes.find((n) => n.id === nodeId)!;
        const distPx = Math.sqrt(
          Math.pow(fromNode.x - toNode.x, 2) + Math.pow(fromNode.y - toNode.y, 2)
        );
        const lengthKm = Math.max(0.4, Number((distPx / 150).toFixed(1)));

        const newSeg: RoadSegment = {
          id: `seg_custom_${Date.now()}`,
          name: `${fromNode.shortName} — ${toNode.shortName} Link`,
          fromNodeId: roadStartNodeId,
          toNodeId: nodeId,
          lengthKm,
          lanes: 2,
          baseVolumePerHour: 1600,
          baseCapacityPerHour: 1800,
          freeFlowSpeedKmh: 45,
          hasTransitCorridorPotential: true,
          hasActiveMobilityPotential: true,
        };

        pushHistory(draftNodes, [...draftSegments, newSeg]);
        setSelectedSegmentId(newSeg.id);
        setSelectedNodeId(null);
        setRoadStartNodeId(null);
      }
      return;
    }

    setSelectedNodeId(nodeId);
    setSelectedSegmentId(null);
    onSelectNode?.(nodeId);
  };

  // Convert client SVG coordinates
  const getSvgPoint = (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 470, y: 270 };
    const cursor = pt.matrixTransform(matrix.inverse());
    return {
      x: Math.round(Math.max(30, Math.min(910, cursor.x))),
      y: Math.round(Math.max(30, Math.min(510, cursor.y))),
    };
  };

  // Canvas click to add node
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isEditing) return;
    if (activeTool !== 'add_node') return;

    // Check if target is background
    const target = e.target as HTMLElement;
    if (target.tagName !== 'svg' && target.tagName !== 'rect') return;

    const { x, y } = getSvgPoint(e);
    const nodeNum = draftNodes.length + 1;
    const newNode: CityNode = {
      id: `node_custom_${Date.now()}`,
      name: `Junction ${nodeNum} Hub`,
      shortName: `Jct ${nodeNum}`,
      zone: 'commercial',
      x,
      y,
      description: `Newly planned municipal intersection hub at coordinates (${x}, ${y}).`,
      baselineDelaySeconds: 90,
    };

    pushHistory([...draftNodes, newNode], draftSegments);
    setSelectedNodeId(newNode.id);
    setSelectedSegmentId(null);
  };

  // Dragging nodes
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (!isEditing || activeTool !== 'select') return;
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedSegmentId(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !isEditing) return;
    const { x, y } = getSvgPoint(e);

    setDraftNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x, y } : n))
    );
    setHasUnsavedChanges(true);
  };

  const handleCanvasMouseUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }
  };

  // Selected item references
  const selectedSegment = selectedSegmentId
    ? currentSegments.find((s) => s.id === selectedSegmentId) || null
    : null;
  const selectedSegmentResult = selectedSegmentId
    ? segmentResults[selectedSegmentId] || null
    : null;

  const selectedNode = selectedNodeId
    ? currentNodes.find((n) => n.id === selectedNodeId) || null
    : null;
  const selectedNodeResult = selectedNodeId
    ? nodeResults[selectedNodeId] || null
    : null;

  // Path helper for roads (curved or straight)
  const getSegmentPath = (seg: RoadSegment) => {
    const from = currentNodes.find((n) => n.id === seg.fromNodeId);
    const to = currentNodes.find((n) => n.id === seg.toNodeId);

    if (!from || !to) return '';

    if (seg.curvedVia) {
      return `M ${from.x} ${from.y} Q ${seg.curvedVia.x} ${seg.curvedVia.y} ${to.x} ${to.y}`;
    }
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  };

  // Node color helper
  const getNodeColor = (node: CityNode) => {
    switch (node.zone) {
      case 'healthcare':
        return { bg: '#0d9488', border: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)' };
      case 'education':
        return { bg: '#2563eb', border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' };
      case 'commercial':
        return { bg: '#d97706', border: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' };
      case 'residential':
        return { bg: '#7c3aed', border: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' };
      case 'tech':
        return { bg: '#0891b2', border: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' };
      default:
        return { bg: '#475569', border: '#64748b', glow: 'rgba(100, 116, 139, 0.4)' };
    }
  };

  const getCongestionColor = (level?: 'low' | 'moderate' | 'critical') => {
    switch (level) {
      case 'critical':
        return {
          stroke: '#ef4444',
          bg: 'bg-rose-950/70',
          text: 'text-rose-400',
          border: 'border-rose-800',
          label: 'Critical',
        };
      case 'moderate':
        return {
          stroke: '#f59e0b',
          bg: 'bg-amber-950/70',
          text: 'text-amber-400',
          border: 'border-amber-800',
          label: 'Moderate',
        };
      case 'low':
      default:
        return {
          stroke: '#10b981',
          bg: 'bg-emerald-950/70',
          text: 'text-emerald-400',
          border: 'border-emerald-800',
          label: 'Low',
        };
    }
  };

  // Delete element handlers
  const promptDeleteNode = (node: CityNode) => {
    const connected = draftSegments.filter(
      (s) => s.fromNodeId === node.id || s.toNodeId === node.id
    );
    setConfirmDeleteModal({
      isOpen: true,
      type: 'node',
      id: node.id,
      name: node.name,
      connectedSegmentNames: connected.map((s) => s.name),
    });
  };

  const promptDeleteSegment = (seg: RoadSegment) => {
    setConfirmDeleteModal({
      isOpen: true,
      type: 'segment',
      id: seg.id,
      name: seg.name,
    });
  };

  const handleConfirmDelete = () => {
    const { type, id } = confirmDeleteModal;
    if (type === 'node') {
      const nextNodes = draftNodes.filter((n) => n.id !== id);
      const nextSegs = draftSegments.filter(
        (s) => s.fromNodeId !== id && s.toNodeId !== id
      );
      pushHistory(nextNodes, nextSegs);
      setSelectedNodeId(null);
    } else {
      const nextSegs = draftSegments.filter((s) => s.id !== id);
      pushHistory(draftNodes, nextSegs);
      setSelectedSegmentId(null);
    }
    setConfirmDeleteModal({ isOpen: false, type: 'node', id: '', name: '' });
  };

  // Inline property updates
  const updateSelectedNode = (updates: Partial<CityNode>) => {
    if (!selectedNodeId || !isEditing) return;
    const next = draftNodes.map((n) =>
      n.id === selectedNodeId ? { ...n, ...updates } : n
    );
    setDraftNodes(next);
    setHasUnsavedChanges(true);
  };

  const updateSelectedSegment = (updates: Partial<RoadSegment>) => {
    if (!selectedSegmentId || !isEditing) return;
    const next = draftSegments.map((s) =>
      s.id === selectedSegmentId ? { ...s, ...updates } : s
    );
    setDraftSegments(next);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="bg-[#0b132b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col xl:flex-row relative">
      {/* Map Canvas Section */}
      <div className="flex-1 relative flex flex-col min-h-[540px] bg-[#070d20]">
        {/* Top Control Bar: Mode Toggle, Layers, and Tools */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Left: Mode Banner & Tools */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            {!isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit City Network</span>
                </button>

                {onResetOriginalDemoCity && (
                  <button
                    type="button"
                    onClick={() => setConfirmResetModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors flex items-center gap-1.5"
                    title="Restore baseline Demo City topology"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reset to Baseline Demo City</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 bg-[#090e1f]/95 backdrop-blur-md p-1 rounded-xl border border-teal-500/50 shadow-2xl">
                <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-teal-500/30">
                  Editing Network
                </span>

                {/* Tool Selection Buttons */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool('select');
                    setRoadStartNodeId(null);
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                    activeTool === 'select'
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Select & Move Junctions (Drag nodes on canvas)"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Select / Move</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool('add_node');
                    setRoadStartNodeId(null);
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                    activeTool === 'add_node'
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Click anywhere on canvas to place a new junction hub"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Junction</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTool('add_road');
                    setRoadStartNodeId(null);
                  }}
                  className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                    activeTool === 'add_road'
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Click first junction, then click second junction to connect them with a road"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Road</span>
                </button>

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Undo last edit"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Apply and Cancel */}
                <div className="flex items-center gap-1 pl-1 border-l border-slate-700 ml-1">
                  <button
                    type="button"
                    onClick={handleApplyEdits}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Edits</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Layers and Zoom */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Layer Toggles */}
            <div className="hidden sm:flex items-center gap-1 bg-[#0d1633]/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setShowBusLayer(!showBusLayer)}
                className={`p-1.5 rounded transition-colors ${
                  showBusLayer ? 'text-blue-400 bg-blue-500/15' : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Bus Corridors"
              >
                <Bus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowGreenLayer(!showGreenLayer)}
                className={`p-1.5 rounded transition-colors ${
                  showGreenLayer ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Green Walkways"
              >
                <Trees className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowDistricts(!showDistricts)}
                className={`p-1.5 rounded transition-colors ${
                  showDistricts ? 'text-teal-400 bg-teal-500/15' : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Districts"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-[#0d1633]/90 backdrop-blur-md p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                title="Zoom In"
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                title="Zoom Out"
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                title="Reset Zoom"
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div className="absolute top-16 left-4 right-4 z-30 p-3 rounded-xl bg-rose-950/95 border border-rose-800 text-rose-300 text-xs shadow-2xl backdrop-blur-md space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Network Integrity Issues (Resolve before applying):
            </div>
            {validationErrors.map((err, i) => (
              <div key={i} className="pl-5 text-[11px]">• {err}</div>
            ))}
          </div>
        )}

        {/* Informative Guidance Banner during specific tools */}
        {isEditing && (
          <div className="absolute bottom-12 left-4 z-10 pointer-events-none">
            <div className="px-3 py-1.5 rounded-full bg-[#090e1f]/90 border border-teal-500/40 text-[11px] text-teal-300 shadow-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              {activeTool === 'select' && (
                <span>Drag any junction to reposition it on the canvas; click roads or junctions to edit attributes.</span>
              )}
              {activeTool === 'add_node' && (
                <span>Click anywhere on the grid canvas to place a new junction hub.</span>
              )}
              {activeTool === 'add_road' && (
                <span>
                  {roadStartNodeId
                    ? 'Click the second junction to complete the road segment.'
                    : 'Click the starting junction node.'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* SVG City Vector Canvas */}
        <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden select-none">
          <svg
            viewBox="0 0 940 540"
            className="w-full h-auto max-h-[580px] transition-transform duration-200"
            style={{
              transform: `scale(${zoomLevel})`,
              cursor:
                isEditing && activeTool === 'add_node'
                  ? 'crosshair'
                  : isEditing && activeTool === 'add_road'
                  ? 'pointer'
                  : 'default',
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            <defs>
              <pattern id="cityGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#132042" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="1" fill="#1e3060" />
              </pattern>

              <style>{`
                @keyframes flowMotion {
                  to { stroke-dashoffset: -40; }
                }
                .flow-active {
                  animation: flowMotion 1.8s linear infinite;
                }
                .flow-bus {
                  animation: flowMotion 1.2s linear infinite;
                }
              `}</style>
            </defs>

            {/* Base Background Grid */}
            <rect width="940" height="540" fill="#070d20" />
            <rect width="940" height="540" fill="url(#cityGrid)" />

            {/* District Boundary Polygons (only on default demo city) */}
            {showDistricts && !isImported && (
              <g opacity="0.30">
                <path d="M 80 380 L 260 370 L 250 510 L 90 520 Z" fill="#6366f1" stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4" />
                <text x="110" y="500" fill="#a5b4fc" fontSize="10" fontWeight="600">RESIDENTIAL SECTOR</text>

                <path d="M 160 90 L 320 80 L 310 220 L 170 210 Z" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 4" />
                <text x="180" y="110" fill="#93c5fd" fontSize="10" fontWeight="600">ACADEMIC CAMPUS ZONE</text>

                <path d="M 410 140 L 580 130 L 560 270 L 420 260 Z" fill="#0d9488" stroke="#14b8a6" strokeWidth="1" strokeDasharray="4 4" />
                <text x="430" y="155" fill="#5eead4" fontSize="10" fontWeight="600">HEALTHCARE ARTERIAL HUB</text>

                <path d="M 570 360 L 740 350 L 720 500 L 560 490 Z" fill="#d97706" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" />
                <text x="590" y="480" fill="#fcd34d" fontSize="10" fontWeight="600">MARKET &amp; BAZAAR DISTRICT</text>

                <path d="M 710 160 L 870 150 L 860 300 L 715 310 Z" fill="#0891b2" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
                <text x="730" y="180" fill="#67e8f9" fontSize="10" fontWeight="600">TECH INNOVATION HUB</text>
              </g>
            )}

            {/* City Title watermark in top-right */}
            <text x="915" y="45" textAnchor="end" fill="#334155" fontSize="14" fontWeight="800" letterSpacing="1">
              {cityName.toUpperCase()}
            </text>

            {/* Road Bed (Dark underlying road tracks) */}
            <g>
              {currentSegments.map((seg) => {
                const isSelected = selectedSegmentId === seg.id;
                const pathStr = getSegmentPath(seg);
                if (!pathStr) return null;
                const roadWidth = seg.lanes * 5.5 + 4;

                return (
                  <path
                    key={`bed-${seg.id}`}
                    d={pathStr}
                    fill="none"
                    stroke={isSelected ? '#38bdf8' : '#141d38'}
                    strokeWidth={isSelected ? roadWidth + 6 : roadWidth + 4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={isSelected ? 0.9 : 1}
                  />
                );
              })}
            </g>

            {/* Simulated Congestion Flow Stream */}
            <g>
              {currentSegments.map((seg) => {
                const res = segmentResults[seg.id];
                const cong = getCongestionColor(res?.congestionLevel);
                const isSelected = selectedSegmentId === seg.id;
                const pathStr = getSegmentPath(seg);
                if (!pathStr) return null;
                const roadWidth = seg.lanes * 4.5;

                return (
                  <g
                    key={`flow-${seg.id}`}
                    className="cursor-pointer group"
                    onClick={() => handleSegmentClick(seg.id)}
                  >
                    {/* Underlying colored congestion band */}
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={cong.stroke}
                      strokeWidth={isSelected ? roadWidth + 3 : roadWidth}
                      strokeOpacity={isSelected ? 0.95 : 0.65}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Animated moving vehicle flow dashes (hidden during active edit drag for performance) */}
                    {!isEditing && (
                      <path
                        d={pathStr}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeDasharray="6 14"
                        className="flow-active"
                        strokeOpacity={0.8}
                        strokeLinecap="round"
                      />
                    )}

                    {/* Bus Corridor Overlay */}
                    {showBusLayer && res?.busCorridorActive && (
                      <path
                        d={pathStr}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3.5"
                        strokeDasharray="10 8"
                        className="flow-bus"
                        strokeOpacity={0.9}
                        strokeLinecap="round"
                      />
                    )}

                    {/* Green Walkway Canopy Buffer Overlay */}
                    {showGreenLayer && res?.greenWalkwayActive && (
                      <path
                        d={pathStr}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="7"
                        strokeDasharray="3 7"
                        strokeOpacity={0.45}
                        strokeLinecap="round"
                      />
                    )}

                    {/* Transparent Click Target Area */}
                    <path
                      d={pathStr}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="28"
                      className="hover:stroke-teal-400/20"
                    />
                  </g>
                );
              })}
            </g>

            {/* Intersection Hub Nodes */}
            <g>
              {currentNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isStartNode = roadStartNodeId === node.id;
                const nodeRes = nodeResults[node.id];
                const colors = getNodeColor(node);

                return (
                  <g
                    key={`node-${node.id}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeClick(node.id);
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  >
                    {/* Ring for Add Road Start Node */}
                    {isStartNode && (
                      <circle
                        r="28"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="animate-spin"
                        style={{ transformOrigin: '0 0', animationDuration: '6s' }}
                      />
                    )}

                    {/* Pulsing signal halo if adaptive signal active */}
                    {nodeRes?.hasAdaptiveSignal && !isEditing && (
                      <circle
                        r="24"
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        className="animate-spin"
                        style={{ transformOrigin: '0 0', animationDuration: '9s' }}
                      />
                    )}

                    {/* Outer glow circle */}
                    <circle
                      r={isSelected ? 18 : 15}
                      fill={colors.bg}
                      stroke={isSelected ? '#ffffff' : colors.border}
                      strokeWidth={isSelected ? 3 : 2}
                      filter="drop-shadow(0px 2px 6px rgba(0,0,0,0.6))"
                    />

                    {/* Node Core Center Dot */}
                    <circle r="5" fill="#ffffff" />

                    {/* Node Text Label */}
                    <text
                      x="0"
                      y={node.y > 300 ? 28 : -22}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="700"
                      filter="drop-shadow(0px 1px 3px rgba(0,0,0,0.8))"
                    >
                      {node.shortName}
                    </text>

                    {/* Node Status Sub-label */}
                    <text
                      x="0"
                      y={node.y > 300 ? 41 : -9}
                      textAnchor="middle"
                      fill={nodeRes?.hasAdaptiveSignal ? '#5eead4' : '#94a3b8'}
                      fontSize="9.5"
                      fontFamily="JetBrains Mono"
                      fontWeight="500"
                    >
                      {nodeRes?.hasAdaptiveSignal
                        ? `SIGNAL: -${nodeRes.delayReductionPercent}% DELAY`
                        : `${nodeRes?.effectiveDelaySeconds || node.baselineDelaySeconds}s delay`}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Bottom Legend Bar */}
        <div className="bg-[#091128] border-t border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-300">Congestion:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Low (V/C &lt; 0.75)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-amber-500 inline-block" />
              <span>Moderate (0.75–1.05)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-rose-500 inline-block" />
              <span>Critical (&gt; 1.05)</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5 text-blue-300">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-400 inline-block" />
              <span>Transit Priority Lane</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-4 h-0.5 border-t-2 border-dotted border-emerald-400 inline-block" />
              <span>Green Walkway Buffer</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-300">
              <span className="w-2 h-2 rounded-full border border-teal-400 inline-block" />
              <span>Adaptive Signal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Inspector & Property Editor Panel */}
      <div className="w-full xl:w-88 bg-[#0d1633] border-t xl:border-t-0 xl:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Edit3 className="w-4 h-4 text-amber-400" />
              ) : (
                <Crosshair className="w-4 h-4 text-teal-400" />
              )}
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                {isEditing ? 'Network Editor' : 'Corridor Telemetry'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {isEditing ? 'Edit Mode Active' : 'Live Inspection'}
            </span>
          </div>

          {/* EDITING MODE: Selected Node Editor */}
          {isEditing && selectedNode && (
            <div className="space-y-3.5 bg-slate-900/80 p-3.5 rounded-xl border border-teal-500/40 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  Editing Junction
                </span>
                <button
                  type="button"
                  onClick={() => promptDeleteNode(selectedNode)}
                  className="px-2 py-0.5 rounded text-[10px] bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Full Junction Name</label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => updateSelectedNode({ name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Short Label</label>
                  <input
                    type="text"
                    value={selectedNode.shortName}
                    maxLength={16}
                    onChange={(e) => updateSelectedNode({ shortName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Zone Type</label>
                  <select
                    value={selectedNode.zone}
                    onChange={(e) => updateSelectedNode({ zone: e.target.value as ZoneType })}
                    className="w-full px-2 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs focus:border-teal-400 focus:outline-none"
                  >
                    <option value="commercial">Commercial</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="residential">Residential</option>
                    <option value="highway">Highway</option>
                    <option value="tech">Tech</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Position X</label>
                  <input
                    type="number"
                    min={30}
                    max={910}
                    value={selectedNode.x}
                    onChange={(e) => updateSelectedNode({ x: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs font-mono focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Position Y</label>
                  <input
                    type="number"
                    min={30}
                    max={510}
                    value={selectedNode.y}
                    onChange={(e) => updateSelectedNode({ y: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs font-mono focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Baseline Unmanaged Delay (Seconds)
                </label>
                <input
                  type="number"
                  min={20}
                  max={300}
                  value={selectedNode.baselineDelaySeconds}
                  onChange={(e) =>
                    updateSelectedNode({ baselineDelaySeconds: Math.max(20, Number(e.target.value)) })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs font-mono focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* EDITING MODE: Selected Road Segment Editor */}
          {isEditing && selectedSegment && (
            <div className="space-y-3.5 bg-slate-900/80 p-3.5 rounded-xl border border-cyan-500/40 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Editing Road Segment
                </span>
                <button
                  type="button"
                  onClick={() => promptDeleteSegment(selectedSegment)}
                  className="px-2 py-0.5 rounded text-[10px] bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Road Corridor Name</label>
                <input
                  type="text"
                  value={selectedSegment.name}
                  onChange={(e) => updateSelectedSegment({ name: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">From Junction</label>
                  <select
                    value={selectedSegment.fromNodeId}
                    onChange={(e) => updateSelectedSegment({ fromNodeId: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    {draftNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.shortName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">To Junction</label>
                  <select
                    value={selectedSegment.toNodeId}
                    onChange={(e) => updateSelectedSegment({ toNodeId: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs focus:border-cyan-400 focus:outline-none"
                  >
                    {draftNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Length (km)</label>
                  <input
                    type="number"
                    step={0.1}
                    min={0.2}
                    value={selectedSegment.lengthKm}
                    onChange={(e) =>
                      updateSelectedSegment({ lengthKm: Math.max(0.1, Number(e.target.value)) })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Lanes Count</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={selectedSegment.lanes}
                    onChange={(e) =>
                      updateSelectedSegment({ lanes: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Capacity (vph)</label>
                  <input
                    type="number"
                    step={50}
                    min={200}
                    value={selectedSegment.baseCapacityPerHour}
                    onChange={(e) =>
                      updateSelectedSegment({
                        baseCapacityPerHour: Math.max(200, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Demand Vol (vph)</label>
                  <input
                    type="number"
                    step={50}
                    min={100}
                    value={selectedSegment.baseVolumePerHour}
                    onChange={(e) =>
                      updateSelectedSegment({
                        baseVolumePerHour: Math.max(100, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedSegment.hasTransitCorridorPotential}
                    onChange={(e) =>
                      updateSelectedSegment({ hasTransitCorridorPotential: e.target.checked })
                    }
                    className="rounded bg-black border-slate-700 text-teal-500 focus:ring-0"
                  />
                  <span>Transit Corridor Potential</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedSegment.hasActiveMobilityPotential}
                    onChange={(e) =>
                      updateSelectedSegment({ hasActiveMobilityPotential: e.target.checked })
                    }
                    className="rounded bg-black border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span>Active Mobility / Walkway Potential</span>
                </label>
              </div>
            </div>
          )}

          {/* VIEW MODE: Segment Telemetry View */}
          {!isEditing && selectedSegment && selectedSegmentResult && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {selectedSegment.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{selectedSegment.lengthKm} km</span>
                  <span>·</span>
                  <span>{selectedSegment.lanes} Lanes</span>
                  <span>·</span>
                  <span
                    className={`font-mono font-medium ${
                      selectedSegmentResult.congestionLevel === 'critical'
                        ? 'text-rose-400'
                        : selectedSegmentResult.congestionLevel === 'moderate'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    V/C: {selectedSegmentResult.volumeToCapacityRatio}
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  selectedSegmentResult.congestionLevel === 'critical'
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    : selectedSegmentResult.congestionLevel === 'moderate'
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                    : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {selectedSegmentResult.congestionLevel === 'critical' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span className="font-medium">
                    Flow State: {selectedSegmentResult.congestionLevel.toUpperCase()}
                  </span>
                </div>
                <span className="font-mono text-[11px]">
                  {selectedSegmentResult.averageSpeedKmh} km/h
                </span>
              </div>

              {/* Metric Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-900/70 border border-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-teal-400" />
                    Travel Time
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                    {selectedSegmentResult.travelTimeMinutes} min
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Free flow: {selectedSegmentResult.freeFlowTravelTimeMinutes}m
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/70 border border-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    Throughput
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                    {selectedSegmentResult.effectiveVolumePerHour} vph
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Cap: {selectedSegmentResult.effectiveCapacityPerHour} vph
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/70 border border-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-emerald-400" />
                    Segment CO₂
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                    {selectedSegmentResult.emissionsKgCO2} kg
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Peak hour</div>
                </div>

                <div className="p-2.5 bg-slate-900/70 border border-slate-800/80 rounded-lg">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Bus className="w-3 h-3 text-blue-400" />
                    Transit Riders
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
                    {selectedSegmentResult.transitRidershipPerHour} pax/h
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {selectedSegmentResult.busCorridorActive ? 'Dedicated Busway' : 'Mixed Traffic'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE: Node Telemetry View */}
          {!isEditing && selectedNode && selectedNodeResult && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">{selectedNode.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedNode.description}</p>
                {selectedNode.criticalityNote && (
                  <p className="text-[11px] text-amber-300/90 mt-2 bg-amber-950/30 p-2 rounded border border-amber-800/40">
                    {selectedNode.criticalityNote}
                  </p>
                )}
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Intersection Delay:</span>
                  <span className="font-mono font-bold text-slate-100">
                    {selectedNodeResult.effectiveDelaySeconds}s
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Baseline Unmanaged:</span>
                  <span className="font-mono text-slate-400">
                    {selectedNode.baselineDelaySeconds}s
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Adaptive Signal Control:</span>
                  <span
                    className={`font-mono font-medium ${
                      selectedNodeResult.hasAdaptiveSignal ? 'text-teal-400' : 'text-slate-400'
                    }`}
                  >
                    {selectedNodeResult.hasAdaptiveSignal
                      ? `-${selectedNodeResult.delayReductionPercent}% Delay`
                      : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!selectedSegment && !selectedNode && (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Crosshair className="w-8 h-8 text-slate-600 mx-auto" />
              <p>
                {isEditing
                  ? 'Click a junction or road segment above to edit attributes, or use the toolbar to place new infrastructure.'
                  : 'Click any road segment or junction node on the vector map to inspect flow velocity, queue delays, and emissions.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>{currentNodes.length} Hubs · {currentSegments.length} Roads</span>
          {hasUnsavedChanges && (
            <span className="text-amber-400 font-medium">Unsaved Edits</span>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Deletion */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#090e1f] border border-rose-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white">
                Confirm Deletion of {confirmDeleteModal.type === 'node' ? 'Junction' : 'Road'}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-white">&quot;{confirmDeleteModal.name}&quot;</strong>?
            </p>

            {confirmDeleteModal.connectedSegmentNames &&
              confirmDeleteModal.connectedSegmentNames.length > 0 && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900 text-xs text-rose-300 space-y-1.5">
                  <span className="font-semibold block">
                    Warning: The following {confirmDeleteModal.connectedSegmentNames.length} connected road(s) will also be removed:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {confirmDeleteModal.connectedSegmentNames.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmDeleteModal({ isOpen: false, type: 'node', id: '', name: '' })
                }
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                Delete {confirmDeleteModal.type === 'node' ? 'Junction' : 'Road'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resetting Demo City */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#090e1f] border border-cyan-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white">Restore Baseline Demo City</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Reset the active network back to the original baseline Demo City (Hospital Junction, College Road, Market Square corridors)? Any unsaved modifications or imported real-city topology will be replaced.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmResetModal(false);
                  onResetOriginalDemoCity?.();
                }}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-colors"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
