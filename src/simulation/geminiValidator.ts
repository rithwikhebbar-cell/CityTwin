import {
  GeminiPlanningResponse,
  ValidatedPlanningResult,
  ScenarioInterventions,
  OptimizationObjective,
  CityNode,
  RoadSegment,
} from '../types/simulation';
import { CITY_NODES, ROAD_SEGMENTS, BASELINE_INTERVENTIONS } from './engine';

export const VALID_NODE_IDS = CITY_NODES.map((n) => n.id);
export const VALID_SEGMENT_IDS = ROAD_SEGMENTS.map((s) => s.id);
export const VALID_OBJECTIVES: OptimizationObjective[] = [
  'congestion',
  'emissions',
  'emergency_access',
  'transit',
  'active_mobility',
  'budget_efficiency',
];

/**
 * Validates and converts a structured Gemini planning response into concrete CityTwin scenario inputs.
 * Strictly verifies locations against active network topology, numerical boundaries, supported intervention types,
 * and flexible municipal budget rules (supporting lakhs and multi-crore allocations).
 */
export function validateGeminiPlan(
  raw: any,
  customNodes?: CityNode[],
  customSegments?: RoadSegment[],
  maxBudgetSafetyCap: number = 1000000
): ValidatedPlanningResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const activeNodes = customNodes && customNodes.length > 0 ? customNodes : CITY_NODES;
  const activeSegments = customSegments && customSegments.length > 0 ? customSegments : ROAD_SEGMENTS;
  const validNodeIds = activeNodes.map((n) => n.id);
  const validSegmentIds = activeSegments.map((s) => s.id);

  // 1. Malformed payload check
  if (!raw || typeof raw !== 'object') {
    return {
      rawResponse: {
        goalSummary: 'Malformed plan',
        targetLocations: [],
        budgetCapLakhs: 15.0,
        objectives: ['congestion'],
        interventions: [],
        assumptions: ['Payload was not an object'],
        clarificationNeeded: true,
        clarificationQuestion: 'Could you rephrase your planning goal? The previous model response was malformed.',
        explanation: 'The request could not be processed due to a structural error.',
      },
      scenarioInterventions: { ...BASELINE_INTERVENTIONS },
      validationErrors: ['Received non-object or null response from AI model.'],
      warnings: [],
      isValid: false,
      clarificationNeeded: true,
      clarificationQuestion: 'Could you rephrase your planning goal? The previous model response was malformed.',
    };
  }

  // 2. Validate goal summary and explanation
  const goalSummary = typeof raw.goalSummary === 'string' && raw.goalSummary.trim()
    ? raw.goalSummary.trim()
    : 'Urban Planning Intervention';
  const explanation = typeof raw.explanation === 'string' && raw.explanation.trim()
    ? raw.explanation.trim()
    : 'Synthesized policy package for the specified civic corridor.';

  // 3. Validate target locations
  const rawLocations = Array.isArray(raw.targetLocations) ? raw.targetLocations : [];
  const targetLocations: string[] = [];
  const unsupportedLocations: string[] = [];

  rawLocations.forEach((loc: any) => {
    if (typeof loc === 'string') {
      const cleanLoc = loc.trim().toLowerCase();
      // Match exact ID or loose node/road name in active network
      const matchedNode = activeNodes.find(
        (n) =>
          n.id === cleanLoc ||
          n.name.toLowerCase().includes(cleanLoc) ||
          cleanLoc.includes(n.id) ||
          (n.shortName && n.shortName.toLowerCase().includes(cleanLoc))
      );
      const matchedSeg = activeSegments.find(
        (s) => s.id === cleanLoc || s.name.toLowerCase().includes(cleanLoc) || cleanLoc.includes(s.id)
      );

      if (matchedNode) {
        if (!targetLocations.includes(matchedNode.id)) targetLocations.push(matchedNode.id);
      } else if (matchedSeg) {
        if (!targetLocations.includes(matchedSeg.id)) targetLocations.push(matchedSeg.id);
      } else {
        unsupportedLocations.push(loc);
      }
    }
  });

  if (unsupportedLocations.length > 0) {
    const availableNames = activeNodes.slice(0, 5).map((n) => n.name).join(', ');
    errors.push(
      `Unsupported or unknown locations: ${unsupportedLocations.join(', ')}. Available hubs in active city network: ${availableNames}.`
    );
  }

  // 4. Validate budget with flexible municipal ceiling (up to Crores)
  let budgetCapLakhs = 15.0;
  if (raw.budgetCapLakhs !== null && raw.budgetCapLakhs !== undefined) {
    const parsedBudget = Number(raw.budgetCapLakhs);
    if (isNaN(parsedBudget) || parsedBudget <= 0) {
      warnings.push(`Invalid non-positive budget "${raw.budgetCapLakhs}" received; defaulted to standard municipal cap of ₹15.0 Lakh.`);
      budgetCapLakhs = 15.0;
    } else if (parsedBudget > maxBudgetSafetyCap) {
      warnings.push(`Budget cap of ₹${parsedBudget}L exceeds maximum municipal allocation safety cap (₹${maxBudgetSafetyCap}L); clamped.`);
      budgetCapLakhs = maxBudgetSafetyCap;
    } else {
      budgetCapLakhs = Number(parsedBudget.toFixed(2));
    }
  } else {
    warnings.push('No explicit budget cap specified in goal; defaulted to standard municipal cap of ₹15.0 Lakh.');
  }

  // 5. Validate objectives
  const rawObjectives = Array.isArray(raw.objectives) ? raw.objectives : [];
  const objectives: OptimizationObjective[] = [];
  rawObjectives.forEach((obj: any) => {
    if (typeof obj === 'string') {
      const normalized = obj.toLowerCase().trim() as OptimizationObjective;
      if (VALID_OBJECTIVES.includes(normalized)) {
        if (!objectives.includes(normalized)) objectives.push(normalized);
      }
    }
  });
  if (objectives.length === 0) {
    objectives.push('congestion');
  }

  // 6. Validate Interventions and construct ScenarioInterventions
  const scenarioInterventions: ScenarioInterventions = {
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
      frequencyMin: 6,
      electricFleetShare: 30,
      costPerKmLakhs: 2.2,
    },
    greenWalkways: {
      enabled: false,
      targetSegmentIds: [],
      pedestrianizeMarketSquare: false,
      canopyCoverageDensity: 3,
      costPerKmLakhs: 1.1,
    },
    budgetCapLakhs,
  };

  const rawInterventions = Array.isArray(raw.interventions) ? raw.interventions : [];
  const recognizedInterventionTypes = ['adaptiveSignals', 'busPriority', 'greenWalkways'];
  const unknownInterventionTypes: string[] = [];

  rawInterventions.forEach((item: any) => {
    if (!item || typeof item !== 'object') return;
    const rawType = String(item.type || '').trim();

    // Map synonymous terms from LLM
    let normalizedType = rawType;
    const lowerType = rawType.toLowerCase();
    if (lowerType.includes('signal') || lowerType.includes('adaptive')) {
      normalizedType = 'adaptiveSignals';
    } else if (lowerType.includes('bus') || lowerType.includes('transit')) {
      normalizedType = 'busPriority';
    } else if (lowerType.includes('green') || lowerType.includes('walk') || lowerType.includes('pedestrian')) {
      normalizedType = 'greenWalkways';
    }

    if (!recognizedInterventionTypes.includes(normalizedType)) {
      unknownInterventionTypes.push(rawType);
      return;
    }

    if (normalizedType === 'adaptiveSignals') {
      const enabled = Boolean(item.enabled);
      let nodes = Array.isArray(item.targetLocations) ? item.targetLocations : [];
      nodes = nodes
        .map((loc: string) => {
          const clean = String(loc).toLowerCase().trim();
          const match = activeNodes.find(
            (n) =>
              n.id === clean ||
              n.name.toLowerCase().includes(clean) ||
              clean.includes(n.id) ||
              (n.shortName && n.shortName.toLowerCase().includes(clean))
          );
          return match?.id;
        })
        .filter((id: string | undefined): id is string => Boolean(id) && validNodeIds.includes(id!));

      let optLevel = 3;
      if (item.parameters && typeof item.parameters.optimizationLevel === 'number') {
        const rawOpt = item.parameters.optimizationLevel;
        optLevel = rawOpt <= 1.0 && rawOpt > 0
          ? Math.max(1, Math.min(5, Math.round(rawOpt * 5)))
          : Math.max(1, Math.min(5, Math.round(rawOpt)));
      }

      scenarioInterventions.adaptiveSignals = {
        enabled,
        targetNodeIds: nodes,
        optimizationLevel: optLevel,
        costPerNodeLakhs: 1.5,
      };
    } else if (normalizedType === 'busPriority') {
      const enabled = Boolean(item.enabled);
      let segs = Array.isArray(item.targetLocations) ? item.targetLocations : [];
      segs = segs
        .map((loc: string) => {
          const clean = String(loc).toLowerCase().trim();
          const match = activeSegments.find(
            (s) => s.id === clean || s.name.toLowerCase().includes(clean) || clean.includes(s.id)
          );
          return match?.id;
        })
        .filter((id: string | undefined): id is string => {
          if (!id) return false;
          const road = activeSegments.find((s) => s.id === id);
          return Boolean(road && (road.hasTransitCorridorPotential || activeSegments.length <= 4));
        });

      let dedicatedLane = false;
      let frequencyMin = 6;
      let electricFleetShare = 30;

      if (item.parameters && typeof item.parameters === 'object') {
        if (typeof item.parameters.dedicatedLane === 'boolean') {
          dedicatedLane = item.parameters.dedicatedLane;
        }
        if (typeof item.parameters.frequencyMin === 'number') {
          frequencyMin = Math.max(3, Math.min(15, Math.round(item.parameters.frequencyMin)));
        }
        if (typeof item.parameters.electricFleetShare === 'number') {
          electricFleetShare = Math.max(0, Math.min(100, Math.round(item.parameters.electricFleetShare)));
        }
      }

      scenarioInterventions.busPriority = {
        enabled,
        targetSegmentIds: segs,
        dedicatedLane,
        frequencyMin,
        electricFleetShare,
        costPerKmLakhs: 2.2,
      };
    } else if (normalizedType === 'greenWalkways') {
      const enabled = Boolean(item.enabled);
      let segs = Array.isArray(item.targetLocations) ? item.targetLocations : [];
      segs = segs
        .map((loc: string) => {
          const clean = String(loc).toLowerCase().trim();
          const match = activeSegments.find(
            (s) => s.id === clean || s.name.toLowerCase().includes(clean) || clean.includes(s.id)
          );
          return match?.id;
        })
        .filter((id: string | undefined): id is string => {
          if (!id) return false;
          const road = activeSegments.find((s) => s.id === id);
          return Boolean(road && (road.hasActiveMobilityPotential || activeSegments.length <= 4));
        });

      let pedestrianizeMarketSquare = false;
      let canopyCoverageDensity = 3;

      if (item.parameters && typeof item.parameters === 'object') {
        if (typeof item.parameters.pedestrianizeMarketSquare === 'boolean') {
          pedestrianizeMarketSquare = item.parameters.pedestrianizeMarketSquare;
        }
        if (typeof item.parameters.canopyCoverageDensity === 'number') {
          canopyCoverageDensity = Math.max(1, Math.min(5, Math.round(item.parameters.canopyCoverageDensity)));
        }
      }

      scenarioInterventions.greenWalkways = {
        enabled,
        targetSegmentIds: segs,
        pedestrianizeMarketSquare,
        canopyCoverageDensity,
        costPerKmLakhs: 1.1,
      };
    }
  });

  if (unknownInterventionTypes.length > 0) {
    errors.push(
      `Unsupported intervention mechanisms requested: ${unknownInterventionTypes.join(
        ', '
      )}. CityTwin currently models adaptive traffic signals, bus-priority corridors, and walking/green buffers.`
    );
  }

  // 7. Validate assumptions and clarifications
  const assumptions = Array.isArray(raw.assumptions)
    ? raw.assumptions.filter((a: any) => typeof a === 'string')
    : [];

  const rawClarificationNeeded = Boolean(raw.clarificationNeeded);
  const clarificationQuestion = typeof raw.clarificationQuestion === 'string' && raw.clarificationQuestion.trim()
    ? raw.clarificationQuestion.trim()
    : null;

  // Decide if clarification or invalid
  const needsClarification = rawClarificationNeeded || errors.length > 0;
  const computedClarificationQuestion =
    clarificationQuestion ||
    (errors.length > 0
      ? `We detected unsupported elements: ${errors.join(' ')} Which supported corridors or policy controls would you like to target?`
      : null);

  const cleanResponse: GeminiPlanningResponse = {
    goalSummary,
    targetLocations,
    budgetCapLakhs,
    objectives,
    interventions: rawInterventions.filter((i: any) => recognizedInterventionTypes.includes(i?.type)),
    assumptions,
    clarificationNeeded: needsClarification,
    clarificationQuestion: computedClarificationQuestion,
    explanation,
  };

  return {
    rawResponse: cleanResponse,
    scenarioInterventions,
    validationErrors: errors,
    warnings,
    isValid: errors.length === 0 && !needsClarification,
    clarificationNeeded: needsClarification,
    clarificationQuestion: computedClarificationQuestion,
  };
}
