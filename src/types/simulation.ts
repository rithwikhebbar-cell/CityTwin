export type ZoneType = 'healthcare' | 'education' | 'commercial' | 'residential' | 'highway' | 'tech';

export type CongestionLevel = 'low' | 'moderate' | 'critical';

export interface CityNode {
  id: string;
  name: string;
  shortName: string;
  zone: ZoneType;
  x: number;
  y: number;
  description: string;
  criticalityNote?: string;
  baselineDelaySeconds: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  lengthKm: number;
  lanes: number;
  baseVolumePerHour: number; // vehicles/hour
  baseCapacityPerHour: number; // vehicles/hour capacity
  freeFlowSpeedKmh: number;
  hasTransitCorridorPotential: boolean;
  hasActiveMobilityPotential: boolean;
  curvedVia?: { x: number; y: number };
}

export interface AdaptiveSignalsConfig {
  enabled: boolean;
  targetNodeIds: string[];
  optimizationLevel: number; // 1 to 5 (e.g. 3 = standard, 5 = full adaptive green wave)
  costPerNodeLakhs: number;
}

export interface BusPriorityConfig {
  enabled: boolean;
  targetSegmentIds: string[];
  dedicatedLane: boolean; // if true, claims a general lane for bus-only
  frequencyMin: number; // bus headway: 4 - 15 mins
  electricFleetShare: number; // 0 - 100%
  costPerKmLakhs: number;
}

export interface GreenWalkwaysConfig {
  enabled: boolean;
  targetSegmentIds: string[];
  pedestrianizeMarketSquare: boolean;
  canopyCoverageDensity: number; // 1 to 5
  costPerKmLakhs: number;
}

export interface ScenarioInterventions {
  adaptiveSignals: AdaptiveSignalsConfig;
  busPriority: BusPriorityConfig;
  greenWalkways: GreenWalkwaysConfig;
  budgetCapLakhs: number;
}

export interface SegmentSimulationResult {
  segmentId: string;
  name: string;
  effectiveVolumePerHour: number;
  effectiveCapacityPerHour: number;
  volumeToCapacityRatio: number;
  travelTimeMinutes: number;
  freeFlowTravelTimeMinutes: number;
  delayMinutes: number;
  averageSpeedKmh: number;
  congestionLevel: CongestionLevel;
  emissionsKgCO2: number;
  transitRidershipPerHour: number;
  activeMobilityTripsPerHour: number;
  busCorridorActive: boolean;
  greenWalkwayActive: boolean;
}

export interface SimulationMetrics {
  averageTravelTimeMinutes: number;
  congestionIndex: number; // 0 - 100 normalized index
  estimatedEmissionsKgCO2: number;
  totalCostLakhs: number;
  remainingBudgetLakhs: number;
  budgetCapLakhs: number;
  isOverBudget: boolean;
  hospitalCorridorTravelTimeMinutes: number;
  totalActiveMobilitySharePercent: number;
  publicTransitSharePercent: number;
  costPerMinuteSavedLakhs: number;
}

export interface SimulationResult {
  metrics: SimulationMetrics;
  segmentResults: Record<string, SegmentSimulationResult>;
  nodeResults: Record<string, {
    nodeId: string;
    effectiveDelaySeconds: number;
    delayReductionPercent: number;
    hasAdaptiveSignal: boolean;
  }>;
  calculatedAt: string;
  assumptionsApplied: {
    bprAlpha: number;
    bprBeta: number;
    passengerCarCO2PerKmGrams: number;
    electricBusCO2PerKmGrams: number;
    dieselBusCO2PerKmGrams: number;
    treeCanopyCO2AbsorptionKgPerHour: number;
  };
}

export type CandidateInterventionCategory =
  | 'adaptiveSignals'
  | 'busPriority'
  | 'greenWalkways'
  | 'emergencyRoute'
  | 'unmapped';

export interface RealCityCandidate {
  id: string;
  name: string;
  category: CandidateInterventionCategory;
  position: { lat: number; lng: number };
  address?: string;
  mappedBenchmarkId: string; // e.g. 'hospital_junction', 'seg_college_hospital', or 'unmapped'
  mappedBenchmarkName?: string;
  isSimulatable: boolean; // true if mapped to valid benchmark node or road segment
  notes: string;
  createdAt: string;
  appliedAt?: string;
}

export interface CityNetwork {
  nodes: CityNode[];
  roadSegments: RoadSegment[];
  cityName: string;
  isImported: boolean;
  importedAt?: string;
  source?: 'demo' | 'osm_live' | 'osm_preset';
  centerCoords?: { lat: number; lng: number };
  radiusMeters?: number;
  originalNodesCount?: number;
  originalSegmentsCount?: number;
  updatedAt?: string;
}

export type NetworkEditTool = 'select' | 'add_node' | 'add_road' | 'delete';

export interface Scenario {
  id: string;
  name: string;
  tagline: string;
  description: string;
  isBaseline?: boolean;
  isPreset?: boolean;
  interventions: ScenarioInterventions;
  results: SimulationResult;
  updatedAt: string;
  importedRealCityCandidates?: RealCityCandidate[];
  network?: CityNetwork;
  userId?: string;
}

export interface PlanningGoalPrompt {
  id: string;
  rawText: string;
  parsedTargetNode?: string;
  parsedBudgetLimitLakhs?: number;
  parsedPrimaryObjective?: 'congestion' | 'emissions' | 'transit' | 'cost';
  matchedPresetId?: string;
}

export type OptimizationObjective =
  | 'congestion'
  | 'emissions'
  | 'emergency_access'
  | 'transit'
  | 'active_mobility'
  | 'budget_efficiency';

export interface AIInterventionPlan {
  type: 'adaptiveSignals' | 'busPriority' | 'greenWalkways';
  enabled: boolean;
  targetLocations: string[]; // Node IDs for signals, Segment IDs for bus/green
  parameters?: {
    optimizationLevel?: number; // 1-5
    dedicatedLane?: boolean;
    frequencyMin?: number; // 3-15
    electricFleetShare?: number; // 0-100
    pedestrianizeMarketSquare?: boolean;
    canopyCoverageDensity?: number; // 1-5
  };
}

export interface GeminiPlanningResponse {
  goalSummary: string;
  targetLocations: string[];
  budgetCapLakhs: number | null;
  objectives: OptimizationObjective[];
  interventions: AIInterventionPlan[];
  assumptions: string[];
  clarificationNeeded: boolean;
  clarificationQuestion?: string | null;
  explanation: string;
}

export interface ValidatedPlanningResult {
  rawResponse: GeminiPlanningResponse;
  scenarioInterventions: ScenarioInterventions;
  validationErrors: string[];
  warnings: string[];
  isValid: boolean;
  clarificationNeeded: boolean;
  clarificationQuestion?: string | null;
}

