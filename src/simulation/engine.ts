import {
  CityNode,
  RoadSegment,
  ScenarioInterventions,
  SimulationResult,
  SegmentSimulationResult,
  Scenario,
  CityNetwork,
} from '../types/simulation';

export const CITY_NODES: CityNode[] = [
  {
    id: 'hospital_junction',
    name: 'Hospital Junction',
    shortName: 'Hospital Jct',
    zone: 'healthcare',
    x: 480,
    y: 200,
    description: 'City General Trauma Center, Medical University & Emergency Ambulance Arterial',
    criticalityNote: 'Acute ambulance delays during 8-10 AM and 5-8 PM peak periods',
    baselineDelaySeconds: 145,
  },
  {
    id: 'college_road',
    name: 'College Road Hub',
    shortName: 'College Rd',
    zone: 'education',
    x: 230,
    y: 150,
    description: 'Civic Polytechnic, High Schools & Student Transit Terminal',
    criticalityNote: 'High pedestrian and bus transit demand conflicting with private commuter spillover',
    baselineDelaySeconds: 110,
  },
  {
    id: 'market_square',
    name: 'Market Square',
    shortName: 'Market Sq',
    zone: 'commercial',
    x: 640,
    y: 430,
    description: 'Central Commercial Bazaar, Heritage Wholesale Market & Retail District',
    criticalityNote: 'Freight loading conflicts, high particulate emissions and pedestrian congestion',
    baselineDelaySeconds: 135,
  },
  {
    id: 'residential_district',
    name: 'Residential District',
    shortName: 'Residential',
    zone: 'residential',
    x: 160,
    y: 450,
    description: 'Southwest High-Density Residential Apartments & Commuter Suburbs',
    criticalityNote: 'Primary morning outward commute origin; bottlenecked feeder roads',
    baselineDelaySeconds: 70,
  },
  {
    id: 'expressway_north',
    name: 'North Expressway Bypass',
    shortName: 'North Expwy',
    zone: 'highway',
    x: 430,
    y: 50,
    description: 'Elevated 4-lane perimeter highway connecting regional industrial corridors',
    criticalityNote: 'High free-flow capacity, prone to off-ramp backup onto Hospital Junction',
    baselineDelaySeconds: 40,
  },
  {
    id: 'tech_park',
    name: 'Tech Park Innovation Zone',
    shortName: 'Tech Park',
    zone: 'tech',
    x: 770,
    y: 230,
    description: 'IT Corporate Campuses, Research Labs & Major White-Collar Employment Destination',
    criticalityNote: 'High single-occupancy vehicle arrival spikes during morning rush',
    baselineDelaySeconds: 85,
  },
];

export const ROAD_SEGMENTS: RoadSegment[] = [
  {
    id: 'seg_res_college',
    name: 'Residential — College Rd Corridor',
    fromNodeId: 'residential_district',
    toNodeId: 'college_road',
    lengthKm: 3.2,
    lanes: 2,
    baseVolumePerHour: 1680,
    baseCapacityPerHour: 1800,
    freeFlowSpeedKmh: 45,
    hasTransitCorridorPotential: true,
    hasActiveMobilityPotential: true,
    curvedVia: { x: 170, y: 290 },
  },
  {
    id: 'seg_college_hospital',
    name: 'College Rd — Hospital Arterial',
    fromNodeId: 'college_road',
    toNodeId: 'hospital_junction',
    lengthKm: 1.8,
    lanes: 2,
    baseVolumePerHour: 1950,
    baseCapacityPerHour: 1600, // Severe Bottleneck (V/C = 1.22)
    freeFlowSpeedKmh: 40,
    hasTransitCorridorPotential: true,
    hasActiveMobilityPotential: true,
    curvedVia: { x: 350, y: 155 },
  },
  {
    id: 'seg_hospital_market',
    name: 'Hospital — Market Central Link',
    fromNodeId: 'hospital_junction',
    toNodeId: 'market_square',
    lengthKm: 2.5,
    lanes: 3,
    baseVolumePerHour: 2420,
    baseCapacityPerHour: 2250,
    freeFlowSpeedKmh: 42,
    hasTransitCorridorPotential: true,
    hasActiveMobilityPotential: false,
    curvedVia: { x: 575, y: 310 },
  },
  {
    id: 'seg_res_market',
    name: 'Residential — Market Southern Ave',
    fromNodeId: 'residential_district',
    toNodeId: 'market_square',
    lengthKm: 3.6,
    lanes: 2,
    baseVolumePerHour: 1820,
    baseCapacityPerHour: 1750,
    freeFlowSpeedKmh: 40,
    hasTransitCorridorPotential: true,
    hasActiveMobilityPotential: true,
    curvedVia: { x: 400, y: 470 },
  },
  {
    id: 'seg_expressway_hospital',
    name: 'Expressway — Hospital Feeder',
    fromNodeId: 'expressway_north',
    toNodeId: 'hospital_junction',
    lengthKm: 2.4,
    lanes: 3,
    baseVolumePerHour: 2350,
    baseCapacityPerHour: 2400,
    freeFlowSpeedKmh: 55,
    hasTransitCorridorPotential: true,
    hasActiveMobilityPotential: false,
    curvedVia: { x: 470, y: 120 },
  },
  {
    id: 'seg_res_expressway',
    name: 'Residential — Expressway Link',
    fromNodeId: 'residential_district',
    toNodeId: 'expressway_north',
    lengthKm: 4.1,
    lanes: 4,
    baseVolumePerHour: 2150,
    baseCapacityPerHour: 3200,
    freeFlowSpeedKmh: 60,
    hasTransitCorridorPotential: false,
    hasActiveMobilityPotential: false,
    curvedVia: { x: 280, y: 190 },
  },
  {
    id: 'seg_hospital_tech',
    name: 'Hospital — Tech Park Diagonal',
    fromNodeId: 'hospital_junction',
    toNodeId: 'tech_park',
    lengthKm: 2.9,
    lanes: 2,
    baseVolumePerHour: 1620,
    baseCapacityPerHour: 1700,
    freeFlowSpeedKmh: 45,
    hasTransitCorridorPotential: true,
    hasActiveMobilityPotential: true,
    curvedVia: { x: 620, y: 195 },
  },
  {
    id: 'seg_market_tech',
    name: 'Market — Tech Park Eastern Ave',
    fromNodeId: 'market_square',
    toNodeId: 'tech_park',
    lengthKm: 3.4,
    lanes: 2,
    baseVolumePerHour: 1780,
    baseCapacityPerHour: 1800,
    freeFlowSpeedKmh: 42,
    hasTransitCorridorPotential: true,
    hasActiveMobilityPotential: false,
    curvedVia: { x: 730, y: 345 },
  },
];

// Documented Mathematical Constants
export const MODEL_ASSUMPTIONS = {
  bprAlpha: 0.15, // Bureau of Public Roads delay scale factor
  bprBeta: 4.0,   // Bureau of Public Roads congestion exponent
  passengerCarCO2PerKmGrams: 148, // Average Indian fleet tailpipe emissions (petrol/diesel mix)
  electricBusCO2PerKmGrams: 95,   // Grid-factor equivalent emissions for EV bus
  dieselBusCO2PerKmGrams: 820,    // Standard diesel transit bus
  averageCarOccupancy: 1.35,      // Passengers per private vehicle
  averageBusCapacity: 50,         // Nominal peak bus passenger load
  treeCanopyCO2AbsorptionKgPerHour: 0.045, // Carbon sequestered per km of dense green buffer during daylight
};

/**
 * Pure deterministic simulation engine.
 * Receives scenario interventions and returns reproducible metrics, segment flows, and cost accounts.
 */
export function runSimulation(
  interventions: ScenarioInterventions,
  customNodes?: CityNode[],
  customSegments?: RoadSegment[]
): SimulationResult {
  const activeNodes = customNodes && customNodes.length > 0 ? customNodes : CITY_NODES;
  const activeSegments = customSegments && customSegments.length > 0 ? customSegments : ROAD_SEGMENTS;
  const { adaptiveSignals, busPriority, greenWalkways, budgetCapLakhs } = interventions;

  // 1. Calculate Costs
  let adaptiveSignalCost = 0;
  if (adaptiveSignals.enabled) {
    adaptiveSignalCost = adaptiveSignals.targetNodeIds.length * adaptiveSignals.costPerNodeLakhs;
  }

  let busPriorityCost = 0;
  if (busPriority.enabled) {
    const targetLength = activeSegments.filter((s) =>
      busPriority.targetSegmentIds.includes(s.id)
    ).reduce((sum, s) => sum + s.lengthKm, 0);

    const dedicatedLaneExtra = busPriority.dedicatedLane ? 0.6 : 0;
    busPriorityCost = targetLength * (busPriority.costPerKmLakhs + dedicatedLaneExtra);
  }

  let greenWalkwaysCost = 0;
  if (greenWalkways.enabled) {
    const targetLength = activeSegments.filter((s) =>
      greenWalkways.targetSegmentIds.includes(s.id)
    ).reduce((sum, s) => sum + s.lengthKm, 0);

    const plazaExtra = greenWalkways.pedestrianizeMarketSquare ? 1.5 : 0;
    greenWalkwaysCost = targetLength * greenWalkways.costPerKmLakhs + plazaExtra;
  }

  const totalCostLakhs = Number((adaptiveSignalCost + busPriorityCost + greenWalkwaysCost).toFixed(2));
  const remainingBudgetLakhs = Number((budgetCapLakhs - totalCostLakhs).toFixed(2));
  const isOverBudget = totalCostLakhs > budgetCapLakhs;

  // 2. Evaluate Node Junction Performance
  const nodeResults: SimulationResult['nodeResults'] = {};
  activeNodes.forEach((node) => {
    const hasAdaptive = adaptiveSignals.enabled && adaptiveSignals.targetNodeIds.includes(node.id);
    let delayReductionPercent = 0;
    if (hasAdaptive) {
      // Level 1 = 12%, Level 5 = 32% delay reduction
      delayReductionPercent = 0.08 + adaptiveSignals.optimizationLevel * 0.05;
    }

    const baseDelay = node.baselineDelaySeconds ?? (node as any).baseDelaySeconds ?? 45;
    const effectiveDelaySeconds = Math.round(baseDelay * (1 - delayReductionPercent));
    nodeResults[node.id] = {
      nodeId: node.id,
      effectiveDelaySeconds,
      delayReductionPercent: Math.round(delayReductionPercent * 100),
      hasAdaptiveSignal: hasAdaptive,
    };
  });

  // 3. Evaluate Road Segments
  const segmentResults: Record<string, SegmentSimulationResult> = {};
  let weightedTravelTimeSum = 0;
  let totalVehicleTrips = 0;
  let totalEmissionsSum = 0;
  let totalCongestionRatioSum = 0;
  let totalTransitRidersSum = 0;
  let totalActiveTripsSum = 0;

  activeSegments.forEach((seg) => {
    let effectiveVolume = seg.baseVolumePerHour;
    let effectiveCapacity = seg.baseCapacityPerHour;

    // Check if connected nodes have adaptive signals
    const fromHasAdaptive = nodeResults[seg.fromNodeId]?.hasAdaptiveSignal;
    const toHasAdaptive = nodeResults[seg.toNodeId]?.hasAdaptiveSignal;
    if (fromHasAdaptive || toHasAdaptive) {
      // Coordinated signal clearance improves effective road departure capacity by 8% to 18%
      const signalBoostFactor = 1 + (adaptiveSignals.optimizationLevel * 0.035);
      effectiveCapacity = Math.round(effectiveCapacity * signalBoostFactor);
    }

    // Check Bus Priority Corridor
    const isBusCorridor = busPriority.enabled && busPriority.targetSegmentIds.includes(seg.id);
    let transitRidership = 0;
    let busTripsPerHour = 0;

    if (isBusCorridor) {
      // Frequency: e.g. 5 min headway = 12 buses/hour
      busTripsPerHour = Math.round(60 / Math.max(3, busPriority.frequencyMin));
      // Modal shift: 14% to 26% of car passengers switch to high-speed transit
      const modalShiftPercent = 0.12 + ((15 - Math.min(15, busPriority.frequencyMin)) * 0.012);
      const divertedPassengers = Math.round(effectiveVolume * MODEL_ASSUMPTIONS.averageCarOccupancy * modalShiftPercent);
      transitRidership = divertedPassengers;

      const carsRemoved = Math.round(divertedPassengers / MODEL_ASSUMPTIONS.averageCarOccupancy);
      effectiveVolume = Math.max(300, effectiveVolume - carsRemoved);

      if (busPriority.dedicatedLane && seg.lanes >= 2) {
        // One lane reserved exclusively for bus. General capacity scales with remaining lanes but with smoother laminar flow
        const laneRatio = (seg.lanes - 1) / seg.lanes;
        effectiveCapacity = Math.round(effectiveCapacity * laneRatio * 1.12);
      }
    }

    // Check Green Walkways & Active Mobility
    const isGreenWalkway = greenWalkways.enabled && greenWalkways.targetSegmentIds.includes(seg.id);
    let activeTrips = 0;
    if (isGreenWalkway) {
      // 5% to 10% short trip active diversion
      const activeShift = 0.04 + (greenWalkways.canopyCoverageDensity * 0.014);
      activeTrips = Math.round(effectiveVolume * activeShift);
      effectiveVolume = Math.max(250, effectiveVolume - activeTrips);
    }

    // Market Square Pedestrianization special bypass effect
    if (
      greenWalkways.enabled &&
      greenWalkways.pedestrianizeMarketSquare &&
      (seg.fromNodeId === 'market_square' || seg.toNodeId === 'market_square')
    ) {
      // 35% through-traffic diverted around the square onto perimeter links
      effectiveVolume = Math.round(effectiveVolume * 0.65);
      effectiveCapacity = Math.round(effectiveCapacity * 0.85); // calm, human-scale speed limit
    }

    // Volume to Capacity Ratio
    const vcRatio = Number((effectiveVolume / effectiveCapacity).toFixed(3));

    // Bureau of Public Roads (BPR) Delay Function
    // T = T0 * (1 + alpha * (V/C)^beta)
    const freeFlowTravelTimeMinutes = (seg.lengthKm / seg.freeFlowSpeedKmh) * 60;
    const bprCongestionFactor = 1 + MODEL_ASSUMPTIONS.bprAlpha * Math.pow(vcRatio, MODEL_ASSUMPTIONS.bprBeta);
    let travelTimeMinutes = Number((freeFlowTravelTimeMinutes * bprCongestionFactor).toFixed(2));

    // Add node intersection queue delay
    const nodeQueueDelayMin = ((nodeResults[seg.toNodeId]?.effectiveDelaySeconds || 30) / 60) * 0.5;
    travelTimeMinutes = Number((travelTimeMinutes + nodeQueueDelayMin).toFixed(2));

    const delayMinutes = Math.max(0, Number((travelTimeMinutes - freeFlowTravelTimeMinutes).toFixed(2)));
    const averageSpeedKmh = Math.max(6, Number(((seg.lengthKm / (travelTimeMinutes / 60))).toFixed(1)));

    // Congestion Level Categorization
    let congestionLevel: 'low' | 'moderate' | 'critical' = 'low';
    if (vcRatio >= 1.05 || delayMinutes > 4.0) {
      congestionLevel = 'critical';
    } else if (vcRatio >= 0.75 || delayMinutes > 1.8) {
      congestionLevel = 'moderate';
    }

    // Speed-based Fuel & Emissions Multiplier
    // Speeds below 25 km/h experience steep stop-and-go emission penalties
    const speedPenalty = averageSpeedKmh < 30 ? 1 + (30 - averageSpeedKmh) * 0.03 : 1.0;
    const carVKT = effectiveVolume * seg.lengthKm;
    const carEmissionsGrams = carVKT * MODEL_ASSUMPTIONS.passengerCarCO2PerKmGrams * speedPenalty;

    // Bus emissions
    let busEmissionsGrams = 0;
    if (busTripsPerHour > 0) {
      const elecShare = busPriority.electricFleetShare / 100;
      const busVKT = busTripsPerHour * seg.lengthKm;
      const busGramFactor =
        (1 - elecShare) * MODEL_ASSUMPTIONS.dieselBusCO2PerKmGrams +
        elecShare * MODEL_ASSUMPTIONS.electricBusCO2PerKmGrams;
      busEmissionsGrams = busVKT * busGramFactor;
    }

    // Green Canopy Offset
    let greenOffsetKg = 0;
    if (isGreenWalkway) {
      greenOffsetKg = seg.lengthKm * MODEL_ASSUMPTIONS.treeCanopyCO2AbsorptionKgPerHour * greenWalkways.canopyCoverageDensity;
    }

    const netEmissionsKgCO2 = Math.max(
      10,
      Number(((carEmissionsGrams + busEmissionsGrams) / 1000 - greenOffsetKg).toFixed(1))
    );

    segmentResults[seg.id] = {
      segmentId: seg.id,
      name: seg.name,
      effectiveVolumePerHour: effectiveVolume,
      effectiveCapacityPerHour: effectiveCapacity,
      volumeToCapacityRatio: vcRatio,
      travelTimeMinutes,
      freeFlowTravelTimeMinutes: Number(freeFlowTravelTimeMinutes.toFixed(2)),
      delayMinutes,
      averageSpeedKmh,
      congestionLevel,
      emissionsKgCO2: netEmissionsKgCO2,
      transitRidershipPerHour: transitRidership,
      activeMobilityTripsPerHour: activeTrips,
      busCorridorActive: isBusCorridor,
      greenWalkwayActive: isGreenWalkway,
    };

    weightedTravelTimeSum += travelTimeMinutes * effectiveVolume;
    totalVehicleTrips += effectiveVolume;
    totalEmissionsSum += netEmissionsKgCO2;
    totalCongestionRatioSum += vcRatio;
    totalTransitRidersSum += transitRidership;
    totalActiveTripsSum += activeTrips;
  });

  // Aggregate Metrics
  const avgTravelTimeMinutes = Number(
    (weightedTravelTimeSum / Math.max(1, totalVehicleTrips)).toFixed(2)
  );

  // Congestion Index (0 - 100): Weighted network mean V/C normalized with 0.5 = 30, 1.0 = 75, 1.3 = 100
  const meanVc = activeSegments.length > 0 ? totalCongestionRatioSum / activeSegments.length : 0;
  const rawCongestion = Math.min(100, Math.max(10, Math.round(meanVc * 72)));
  const congestionIndex = rawCongestion;

  const estimatedEmissionsKgCO2 = Math.round(totalEmissionsSum);

  // Hospital Corridor travel time (Residential -> College -> Hospital or health access arterial)
  let hospitalCorridorTravelTime = 0;
  if (segmentResults['seg_res_college'] && segmentResults['seg_college_hospital']) {
    const resToCollege = segmentResults['seg_res_college'].travelTimeMinutes;
    const collegeToHospital = segmentResults['seg_college_hospital'].travelTimeMinutes;
    hospitalCorridorTravelTime = Number((resToCollege + collegeToHospital).toFixed(2));
  } else {
    const healthNodes = activeNodes.filter((n) => n.zone === 'healthcare');
    const healthSegs = activeSegments.filter(
      (s) => healthNodes.some((h) => h.id === s.fromNodeId || h.id === s.toNodeId)
    );
    if (healthSegs.length > 0) {
      hospitalCorridorTravelTime = Number(
        (healthSegs.reduce((sum, s) => sum + (segmentResults[s.id]?.travelTimeMinutes || 0), 0) / healthSegs.length).toFixed(2)
      );
    } else {
      hospitalCorridorTravelTime = avgTravelTimeMinutes;
    }
  }

  // Modal shares
  const totalCommuterDemand = totalVehicleTrips * MODEL_ASSUMPTIONS.averageCarOccupancy + totalTransitRidersSum + totalActiveTripsSum;
  const publicTransitShare = Number(((totalTransitRidersSum / Math.max(1, totalCommuterDemand)) * 100).toFixed(1));
  const activeMobilityShare = Number(((totalActiveTripsSum / Math.max(1, totalCommuterDemand)) * 100).toFixed(1));

  // Baseline comparison for cost efficiency (baseline travel time is approx 7.4 minutes)
  const baselineAvgTime = 7.42;
  const minutesSaved = Math.max(0.01, baselineAvgTime - avgTravelTimeMinutes);
  const costPerMinuteSaved = totalCostLakhs > 0 ? Number((totalCostLakhs / minutesSaved).toFixed(2)) : 0;

  return {
    metrics: {
      averageTravelTimeMinutes: avgTravelTimeMinutes,
      congestionIndex,
      estimatedEmissionsKgCO2,
      totalCostLakhs,
      remainingBudgetLakhs,
      budgetCapLakhs,
      isOverBudget,
      hospitalCorridorTravelTimeMinutes: hospitalCorridorTravelTime,
      totalActiveMobilitySharePercent: activeMobilityShare,
      publicTransitSharePercent: publicTransitShare,
      costPerMinuteSavedLakhs: costPerMinuteSaved,
    },
    segmentResults,
    nodeResults,
    calculatedAt: new Date().toISOString(),
    assumptionsApplied: MODEL_ASSUMPTIONS,
  };
}

// -------------------------------------------------------------
// Preconfigured Scenarios
// -------------------------------------------------------------

export const BASELINE_INTERVENTIONS: ScenarioInterventions = {
  adaptiveSignals: {
    enabled: false,
    targetNodeIds: [],
    optimizationLevel: 3,
    costPerNodeLakhs: 1.5,
  },
  busPriority: {
    enabled: false,
    targetSegmentIds: [],
    dedicatedLane: false,
    frequencyMin: 10,
    electricFleetShare: 15,
    costPerKmLakhs: 2.2,
  },
  greenWalkways: {
    enabled: false,
    targetSegmentIds: [],
    pedestrianizeMarketSquare: false,
    canopyCoverageDensity: 2,
    costPerKmLakhs: 1.1,
  },
  budgetCapLakhs: 15.0,
};

export const HOSPITAL_RELIEF_INTERVENTIONS: ScenarioInterventions = {
  adaptiveSignals: {
    enabled: true,
    targetNodeIds: ['hospital_junction', 'college_road'],
    optimizationLevel: 4,
    costPerNodeLakhs: 1.5, // 2 nodes = ₹3.0 Lakh
  },
  busPriority: {
    enabled: true,
    targetSegmentIds: ['seg_college_hospital', 'seg_hospital_market'],
    dedicatedLane: true,
    frequencyMin: 6,
    electricFleetShare: 40,
    costPerKmLakhs: 2.2, // ~4.3 km = ~₹5.2 Lakh
  },
  greenWalkways: {
    enabled: true,
    targetSegmentIds: ['seg_college_hospital'],
    pedestrianizeMarketSquare: false,
    canopyCoverageDensity: 4,
    costPerKmLakhs: 1.1, // 1.8 km = ~₹2.0 Lakh
  },
  budgetCapLakhs: 12.0,
};

export const TRANSIT_PRIORITY_INTERVENTIONS: ScenarioInterventions = {
  adaptiveSignals: {
    enabled: true,
    targetNodeIds: ['hospital_junction', 'market_square', 'college_road'],
    optimizationLevel: 5,
    costPerNodeLakhs: 1.5, // 3 nodes = ₹4.5 Lakh
  },
  busPriority: {
    enabled: true,
    targetSegmentIds: ['seg_res_college', 'seg_college_hospital', 'seg_hospital_market'],
    dedicatedLane: true,
    frequencyMin: 4,
    electricFleetShare: 75,
    costPerKmLakhs: 2.2,
  },
  greenWalkways: {
    enabled: false,
    targetSegmentIds: [],
    pedestrianizeMarketSquare: false,
    canopyCoverageDensity: 1,
    costPerKmLakhs: 1.1,
  },
  budgetCapLakhs: 16.0,
};

export const GREEN_ACTIVE_INTERVENTIONS: ScenarioInterventions = {
  adaptiveSignals: {
    enabled: true,
    targetNodeIds: ['market_square'],
    optimizationLevel: 3,
    costPerNodeLakhs: 1.5,
  },
  busPriority: {
    enabled: false,
    targetSegmentIds: [],
    dedicatedLane: false,
    frequencyMin: 8,
    electricFleetShare: 30,
    costPerKmLakhs: 2.2,
  },
  greenWalkways: {
    enabled: true,
    targetSegmentIds: ['seg_res_college', 'seg_res_market', 'seg_hospital_tech'],
    pedestrianizeMarketSquare: true,
    canopyCoverageDensity: 5,
    costPerKmLakhs: 1.1,
  },
  budgetCapLakhs: 14.0,
};

export const TRANSIT_MODESHARE_INTERVENTIONS: ScenarioInterventions = {
  adaptiveSignals: {
    enabled: true,
    targetNodeIds: ['hospital_junction', 'market_square', 'college_road', 'residential_district'],
    optimizationLevel: 5,
    costPerNodeLakhs: 1.5,
  },
  busPriority: {
    enabled: true,
    targetSegmentIds: ['seg_res_college', 'seg_college_hospital', 'seg_hospital_market', 'seg_res_market'],
    dedicatedLane: true,
    frequencyMin: 4,
    electricFleetShare: 90,
    costPerKmLakhs: 2.2,
  },
  greenWalkways: {
    enabled: false,
    targetSegmentIds: [],
    pedestrianizeMarketSquare: false,
    canopyCoverageDensity: 2,
    costPerKmLakhs: 1.1,
  },
  budgetCapLakhs: 25.0,
};

// Dharmasthala Authentic Pilgrimage Network & Interventions
export const DHARMASTHALA_NODES: CityNode[] = [
  {
    id: 'node_dharmasthala_temple',
    name: 'Manjunatha Swamy Temple Circle',
    shortName: 'Temple Circle',
    zone: 'commercial',
    x: 480,
    y: 180,
    description: 'Central temple circle, queue line approach and pedestrian sanctum buffer.',
    criticalityNote: 'Acute pilgrim vehicular congestion and pedestrian crossing conflicts during peak darshan hours',
    baselineDelaySeconds: 155,
  },
  {
    id: 'node_dharmasthala_bus_stand',
    name: 'KSRTC Central Bus Stand Hub',
    shortName: 'Bus Stand',
    zone: 'highway',
    x: 230,
    y: 360,
    description: 'Inter-district regional bus terminal, private tourist coach staging and pilgrim arrival.',
    criticalityNote: 'Mass bus arrivals causing bottlenecking at the primary town entrance gateway',
    baselineDelaySeconds: 120,
  },
  {
    id: 'node_dharmasthala_netravati',
    name: 'Netravati River Holy Ghatta',
    shortName: 'Netravati Ghat',
    zone: 'residential',
    x: 720,
    y: 370,
    description: 'Sacred riverfront bathing ghats and peripheral parking access.',
    criticalityNote: 'High pedestrian walking volume towards temple complex along riverbanks',
    baselineDelaySeconds: 80,
  },
  {
    id: 'node_dharmasthala_annapoorna',
    name: 'Annapoorna Mass Dining Hall Hub',
    shortName: 'Annapoorna Hall',
    zone: 'commercial',
    x: 520,
    y: 440,
    description: 'Daily community dining hall serving over 30,000 pilgrims with heavy pedestrian flows.',
    criticalityNote: 'Intense pedestrian movement between main shrine and dining complex',
    baselineDelaySeconds: 100,
  },
];

export const DHARMASTHALA_ROAD_SEGMENTS: RoadSegment[] = [
  {
    id: 'seg_dharmasthala_bus_temple',
    name: 'Car Street Transit Spine (Bus Stand to Temple)',
    fromNodeId: 'node_dharmasthala_bus_stand',
    toNodeId: 'node_dharmasthala_temple',
    lengthKm: 1.8,
    lanes: 2,
    baseVolumePerHour: 1850,
    baseCapacityPerHour: 1600,
    freeFlowSpeedKmh: 35,
    hasTransitCorridorPotential: true,
    hasActiveMobilityPotential: true,
    curvedVia: { x: 330, y: 240 },
  },
  {
    id: 'seg_dharmasthala_netravati_temple',
    name: 'Netravati River Pilgrim Walkway',
    fromNodeId: 'node_dharmasthala_netravati',
    toNodeId: 'node_dharmasthala_temple',
    lengthKm: 2.2,
    lanes: 2,
    baseVolumePerHour: 1300,
    baseCapacityPerHour: 1500,
    freeFlowSpeedKmh: 40,
    hasTransitCorridorPotential: true,
    hasActiveMobilityPotential: true,
    curvedVia: { x: 620, y: 250 },
  },
  {
    id: 'seg_dharmasthala_temple_annapoorna',
    name: 'Temple to Annapoorna Dining Hall Pedestrian Link',
    fromNodeId: 'node_dharmasthala_temple',
    toNodeId: 'node_dharmasthala_annapoorna',
    lengthKm: 0.9,
    lanes: 2,
    baseVolumePerHour: 1450,
    baseCapacityPerHour: 1300,
    freeFlowSpeedKmh: 30,
    hasTransitCorridorPotential: false,
    hasActiveMobilityPotential: true,
    curvedVia: { x: 510, y: 310 },
  },
  {
    id: 'seg_dharmasthala_bus_annapoorna',
    name: 'Bus Stand to Annapoorna Southern Feeder',
    fromNodeId: 'node_dharmasthala_bus_stand',
    toNodeId: 'node_dharmasthala_annapoorna',
    lengthKm: 1.6,
    lanes: 2,
    baseVolumePerHour: 1150,
    baseCapacityPerHour: 1400,
    freeFlowSpeedKmh: 40,
    hasTransitCorridorPotential: true,
    hasActiveMobilityPotential: false,
    curvedVia: { x: 370, y: 420 },
  },
];

export const DHARMASTHALA_NETWORK: CityNetwork = {
  nodes: DHARMASTHALA_NODES,
  roadSegments: DHARMASTHALA_ROAD_SEGMENTS,
  cityName: 'Dharmasthala Pilgrimage & Transit Corridor',
  isImported: true,
  source: 'osm_preset',
  centerCoords: { lat: 12.9564, lng: 75.3789 },
  radiusMeters: 1800,
  originalNodesCount: 4,
  originalSegmentsCount: 4,
  updatedAt: '2026-10-24T00:00:00Z',
};

export const DHARMASTHALA_INTERVENTIONS: ScenarioInterventions = {
  adaptiveSignals: {
    enabled: true,
    targetNodeIds: ['node_dharmasthala_temple', 'node_dharmasthala_bus_stand'],
    optimizationLevel: 4,
    costPerNodeLakhs: 1.5,
  },
  busPriority: {
    enabled: true,
    targetSegmentIds: ['seg_dharmasthala_bus_temple'],
    dedicatedLane: true,
    frequencyMin: 4,
    electricFleetShare: 70,
    costPerKmLakhs: 2.2,
  },
  greenWalkways: {
    enabled: true,
    targetSegmentIds: ['seg_dharmasthala_netravati_temple', 'seg_dharmasthala_temple_annapoorna'],
    pedestrianizeMarketSquare: true,
    canopyCoverageDensity: 4,
    costPerKmLakhs: 1.1,
  },
  budgetCapLakhs: 20.0,
};

export const BENCHMARK_DEMO_NETWORK: CityNetwork = {
  nodes: CITY_NODES,
  roadSegments: ROAD_SEGMENTS,
  cityName: 'CityTwin Benchmark Demo City',
  isImported: false,
  source: 'demo',
};

// Initial Scenarios Store
export function getInitialScenarios(): Scenario[] {
  const baselineResults = runSimulation(BASELINE_INTERVENTIONS, CITY_NODES, ROAD_SEGMENTS);
  const hospitalReliefResults = runSimulation(HOSPITAL_RELIEF_INTERVENTIONS, CITY_NODES, ROAD_SEGMENTS);
  const transitPriorityResults = runSimulation(TRANSIT_PRIORITY_INTERVENTIONS, CITY_NODES, ROAD_SEGMENTS);
  const greenActiveResults = runSimulation(GREEN_ACTIVE_INTERVENTIONS, CITY_NODES, ROAD_SEGMENTS);
  const transitModeShareResults = runSimulation(TRANSIT_MODESHARE_INTERVENTIONS, CITY_NODES, ROAD_SEGMENTS);
  const dharmasthalaResults = runSimulation(DHARMASTHALA_INTERVENTIONS, DHARMASTHALA_NODES, DHARMASTHALA_ROAD_SEGMENTS);

  return [
    {
      id: 'scenario_baseline',
      shortName: 'Baseline Network',
      name: 'Baseline City Network',
      tagline: 'Current Unmanaged Peak-Hour Conditions',
      description: 'Zero intervention state with acute bottlenecking at Hospital Junction and College Road. High emissions and vehicle queuing.',
      isBaseline: true,
      isPreset: true,
      interventions: BASELINE_INTERVENTIONS,
      results: baselineResults,
      updatedAt: new Date().toISOString(),
      network: BENCHMARK_DEMO_NETWORK,
    },
    {
      id: 'scenario_hospital_relief',
      shortName: 'Hospital Relief',
      name: 'Hospital Junction Emergency Relief',
      tagline: 'Featured Preset: Targeted Healthcare Corridor Optimization',
      description: 'Coordinated adaptive signals at Hospital & College hubs paired with a dedicated transit lane and shaded emergency buffer. Conforms to ₹10–₹12 Lakh municipal budget.',
      isPreset: true,
      interventions: HOSPITAL_RELIEF_INTERVENTIONS,
      results: hospitalReliefResults,
      updatedAt: new Date().toISOString(),
      network: BENCHMARK_DEMO_NETWORK,
    },
    {
      id: 'scenario_transit_priority',
      shortName: 'Rapid Transit Spine',
      name: 'Rapid Transit Spine',
      tagline: 'High-Frequency Bus Priority Corridor',
      description: 'Full 4-minute headway rapid electric bus corridor along major employment spine with signal preemption at all central junctions.',
      isPreset: true,
      interventions: TRANSIT_PRIORITY_INTERVENTIONS,
      results: transitPriorityResults,
      updatedAt: new Date().toISOString(),
      network: BENCHMARK_DEMO_NETWORK,
    },
    {
      id: 'scenario_green_active',
      shortName: 'Green Mobility',
      name: 'Ecological & Active Streets',
      tagline: 'Market Square Pedestrianization & Green Buffers',
      description: 'Pedestrianized commercial bazaar with dense urban tree canopies and protected micro-mobility routes diverting short vehicle trips.',
      isPreset: true,
      interventions: GREEN_ACTIVE_INTERVENTIONS,
      results: greenActiveResults,
      updatedAt: new Date().toISOString(),
      network: BENCHMARK_DEMO_NETWORK,
    },
    {
      id: 'scenario_transit_modeshare',
      shortName: 'Transit Mode-Share',
      name: 'Transit Mode-Share Maximizer',
      tagline: 'Aggressive Bus Fleet Electrification & Modal Shift',
      description: 'Electrified high-capacity transit network with signal preemption across major corridors maximizing daily public commuter share.',
      isPreset: true,
      interventions: TRANSIT_MODESHARE_INTERVENTIONS,
      results: transitModeShareResults,
      updatedAt: new Date().toISOString(),
      network: BENCHMARK_DEMO_NETWORK,
    },
    {
      id: 'scenario_dharmasthala_model',
      shortName: 'Dharmasthala Urban Model',
      name: 'Dharmasthala Pilgrimage & Transit Corridor',
      tagline: 'High-Capacity Pilgrim Transit & Temple Pedestrianization',
      description: 'Dedicated electric shuttles from KSRTC Bus Stand to Temple Circle paired with Netravati River greenway and pedestrianized temple spine.',
      isPreset: true,
      interventions: DHARMASTHALA_INTERVENTIONS,
      results: dharmasthalaResults,
      updatedAt: new Date().toISOString(),
      network: DHARMASTHALA_NETWORK,
    },
  ];
}
