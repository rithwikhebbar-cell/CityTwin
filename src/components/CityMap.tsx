import React, { useState } from 'react';
import {
  CityNode,
  RoadSegment,
  SimulationResult,
  SegmentSimulationResult,
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
  ChevronRight,
} from 'lucide-react';

interface CityMapProps {
  simulationResult: SimulationResult;
  onSelectSegment?: (segmentId: string) => void;
  onSelectNode?: (nodeId: string) => void;
}

export const CityMap: React.FC<CityMapProps> = ({
  simulationResult,
  onSelectSegment,
  onSelectNode,
}) => {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>('seg_college_hospital');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showBusLayer, setShowBusLayer] = useState<boolean>(true);
  const [showGreenLayer, setShowGreenLayer] = useState<boolean>(true);
  const [showDistricts, setShowDistricts] = useState<boolean>(true);

  const { segmentResults, nodeResults } = simulationResult;

  const handleSegmentClick = (segId: string) => {
    setSelectedSegmentId(segId);
    setSelectedNodeId(null);
    onSelectSegment?.(segId);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedSegmentId(null);
    onSelectNode?.(nodeId);
  };

  const selectedSegment = selectedSegmentId
    ? ROAD_SEGMENTS.find((s) => s.id === selectedSegmentId)
    : null;
  const selectedSegmentResult = selectedSegmentId
    ? segmentResults[selectedSegmentId]
    : null;

  const selectedNode = selectedNodeId
    ? CITY_NODES.find((n) => n.id === selectedNodeId)
    : null;
  const selectedNodeResult = selectedNodeId
    ? nodeResults[selectedNodeId]
    : null;

  // Path helper for curved roads
  const getSegmentPath = (seg: RoadSegment) => {
    const from = CITY_NODES.find((n) => n.id === seg.fromNodeId)!;
    const to = CITY_NODES.find((n) => n.id === seg.toNodeId)!;

    if (seg.curvedVia) {
      return `M ${from.x} ${from.y} Q ${seg.curvedVia.x} ${seg.curvedVia.y} ${to.x} ${to.y}`;
    }
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  };

  // Node icon / badge color
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

  return (
    <div className="bg-[#0b132b] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col xl:flex-row">
      {/* Map Canvas Section */}
      <div className="flex-1 relative flex flex-col min-h-[520px] bg-[#070d20]">
        {/* Layer Controls Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-[#0d1633]/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 text-slate-400 font-medium">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Layers:</span>
          </div>
          <button
            onClick={() => setShowBusLayer(!showBusLayer)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              showBusLayer
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Bus Corridors</span>
          </button>
          <button
            onClick={() => setShowGreenLayer(!showGreenLayer)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              showGreenLayer
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            <span>Green Walkways</span>
          </button>
          <button
            onClick={() => setShowDistricts(!showDistricts)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              showDistricts
                ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>Districts</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-[#0d1633]/90 backdrop-blur-md p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
            title="Zoom In"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
            title="Zoom Out"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            title="Reset Zoom"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* SVG City Vector Canvas */}
        <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden select-none">
          <svg
            viewBox="0 0 940 540"
            className="w-full h-auto max-h-[560px] transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <defs>
              {/* Grid Background Pattern */}
              <pattern id="cityGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#132042" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="1" fill="#1e3060" />
              </pattern>

              {/* Linear Gradient for Green Buffers */}
              <linearGradient id="greenBufferGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
              </linearGradient>

              {/* Transit Pulse Dash Animation */}
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

            {/* District Boundary Polygons (when enabled) */}
            {showDistricts && (
              <g opacity="0.35">
                {/* Residential District Shading */}
                <path
                  d="M 80 380 L 260 370 L 250 510 L 90 520 Z"
                  fill="#6366f1"
                  stroke="#818cf8"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text x="110" y="500" fill="#a5b4fc" fontSize="10" fontFamily="Plus Jakarta Sans" fontWeight="600">
                  RESIDENTIAL SECTOR
                </text>

                {/* College & Educational Zone */}
                <path
                  d="M 160 90 L 320 80 L 310 220 L 170 210 Z"
                  fill="#3b82f6"
                  stroke="#60a5fa"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text x="180" y="110" fill="#93c5fd" fontSize="10" fontFamily="Plus Jakarta Sans" fontWeight="600">
                  ACADEMIC CAMPUS ZONE
                </text>

                {/* Healthcare District */}
                <path
                  d="M 410 140 L 580 130 L 560 270 L 420 260 Z"
                  fill="#0d9488"
                  stroke="#14b8a6"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text x="430" y="155" fill="#5eead4" fontSize="10" fontFamily="Plus Jakarta Sans" fontWeight="600">
                  HEALTHCARE ARTERIAL HUB
                </text>

                {/* Commercial Market District */}
                <path
                  d="M 570 360 L 740 350 L 720 500 L 560 490 Z"
                  fill="#d97706"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text x="590" y="480" fill="#fcd34d" fontSize="10" fontFamily="Plus Jakarta Sans" fontWeight="600">
                  MARKET & BAZAAR DISTRICT
                </text>

                {/* Tech Park */}
                <path
                  d="M 710 160 L 870 150 L 860 300 L 715 310 Z"
                  fill="#0891b2"
                  stroke="#06b6d4"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text x="730" y="180" fill="#67e8f9" fontSize="10" fontFamily="Plus Jakarta Sans" fontWeight="600">
                  TECH INNOVATION HUB
                </text>
              </g>
            )}

            {/* Road Bed (Dark underlying road tracks) */}
            <g>
              {ROAD_SEGMENTS.map((seg) => {
                const isSelected = selectedSegmentId === seg.id;
                const pathStr = getSegmentPath(seg);
                const roadWidth = seg.lanes * 5.5 + 4;

                return (
                  <path
                    key={`bed-${seg.id}`}
                    d={pathStr}
                    fill="none"
                    stroke={isSelected ? '#334155' : '#141d38'}
                    strokeWidth={roadWidth + 4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}
            </g>

            {/* Simulated Congestion Flow Stream */}
            <g>
              {ROAD_SEGMENTS.map((seg) => {
                const res = segmentResults[seg.id];
                const cong = getCongestionColor(res?.congestionLevel);
                const isSelected = selectedSegmentId === seg.id;
                const pathStr = getSegmentPath(seg);
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

                    {/* Animated moving vehicle flow dashes */}
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

                    {/* Bus Corridor Overlay (if active & enabled) */}
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
              {CITY_NODES.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const nodeRes = nodeResults[node.id];
                const colors = getNodeColor(node);

                return (
                  <g
                    key={`node-${node.id}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onClick={() => handleNodeClick(node.id)}
                  >
                    {/* Pulsing signal halo if adaptive signal active */}
                    {nodeRes?.hasAdaptiveSignal && (
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
                      fontFamily="Plus Jakarta Sans"
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

      {/* Side Telemetry Inspection Flyout Panel */}
      <div className="w-full xl:w-80 bg-[#0d1633] border-t xl:border-t-0 xl:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Corridor Telemetry
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Live Inspection</span>
          </div>

          {/* Segment Details View */}
          {selectedSegment && selectedSegmentResult && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {selectedSegment.name}
                  </h3>
                </div>
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

              {/* Active Interventions on this link */}
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                  Link Policies Active
                </span>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-blue-400" />
                    Bus Priority Lane
                  </span>
                  <span className={`font-mono text-[11px] ${selectedSegmentResult.busCorridorActive ? 'text-blue-400 font-semibold' : 'text-slate-400'}`}>
                    {selectedSegmentResult.busCorridorActive ? 'ACTIVE' : 'Off'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Trees className="w-3.5 h-3.5 text-emerald-400" />
                    Green Walkway Buffer
                  </span>
                  <span className={`font-mono text-[11px] ${selectedSegmentResult.greenWalkwayActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    {selectedSegmentResult.greenWalkwayActive ? 'ACTIVE' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Node Details View */}
          {selectedNode && selectedNodeResult && (
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
            <div className="py-12 text-center text-xs text-slate-400">
              Click any road segment or junction node on the map to inspect flow velocity, queue delays, and emissions.
            </div>
          )}
        </div>

        {/* Quick hint at bottom */}
        <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Click road or node to inspect</span>
          <span className="font-mono text-teal-400">8 corridors</span>
        </div>
      </div>
    </div>
  );
};
