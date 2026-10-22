import { GoogleGenAI, Type } from '@google/genai';

// City network taxonomy constants
const CITY_NODE_IDS = [
  'hospital_junction',
  'college_road',
  'market_square',
  'residential_district',
  'expressway_north',
  'tech_park',
];

const ROAD_SEGMENT_IDS = [
  'seg_res_college',
  'seg_college_hospital',
  'seg_hospital_market',
  'seg_res_market',
  'seg_expressway_hospital',
  'seg_res_expressway',
  'seg_hospital_tech',
  'seg_market_tech',
];

const TRANSIT_CORRIDOR_SEGMENTS = [
  'seg_res_college',
  'seg_college_hospital',
  'seg_hospital_market',
  'seg_res_market',
  'seg_expressway_hospital',
  'seg_hospital_tech',
  'seg_market_tech',
];

const ACTIVE_MOBILITY_SEGMENTS = [
  'seg_res_college',
  'seg_college_hospital',
  'seg_res_market',
  'seg_hospital_tech',
];

const VALID_OBJECTIVES = [
  'congestion',
  'emissions',
  'emergency_access',
  'transit',
  'active_mobility',
  'budget_efficiency',
];

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the Vercel environment variables.');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

const PLANNING_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    goalSummary: {
      type: Type.STRING,
      description: "Concise 1-sentence description of the user's requested planning goal.",
    },
    targetLocations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "List of valid city node IDs (hospital_junction, college_road, market_square, residential_district, expressway_north, tech_park) or road segment IDs (seg_res_college, seg_college_hospital, seg_hospital_market, seg_res_market, seg_expressway_hospital, seg_res_expressway, seg_hospital_tech, seg_market_tech).",
    },
    budgetCapLakhs: {
      type: Type.NUMBER,
      description:
        "Numeric budget ceiling in Indian Rupee Lakhs (e.g. 10.0 for ₹10 lakh). If unspecified by user, provide null.",
    },
    objectives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Prioritized list of allowed objectives: 'congestion', 'emissions', 'emergency_access', 'transit', 'active_mobility', 'budget_efficiency'.",
    },
    interventions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: "Must be exactly one of: 'adaptiveSignals', 'busPriority', 'greenWalkways'.",
          },
          enabled: { type: Type.BOOLEAN },
          targetLocations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              "Node IDs for adaptiveSignals; Road segment IDs for busPriority or greenWalkways.",
          },
          parameters: {
            type: Type.OBJECT,
            properties: {
              optimizationLevel: {
                type: Type.NUMBER,
                description: "Integer from 1 to 5 for adaptive signals (1=basic, 3=corridor sync, 5=real-time green wave).",
              },
              dedicatedLane: {
                type: Type.BOOLEAN,
                description: "Whether to allocate an exclusive bus lane for busPriority.",
              },
              frequencyMin: {
                type: Type.NUMBER,
                description: "Bus peak headway in minutes (3 to 15). Lower = higher frequency.",
              },
              electricFleetShare: {
                type: Type.NUMBER,
                description: "Percentage of electric bus fleet (0 to 100).",
              },
              pedestrianizeMarketSquare: {
                type: Type.BOOLEAN,
                description: "Whether to pedestrianize Market Square bazaar plaza.",
              },
              canopyCoverageDensity: {
                type: Type.NUMBER,
                description: "Tree canopy density tier (1 to 5).",
              },
            },
          },
        },
        required: ["type", "enabled", "targetLocations"],
      },
    },
    assumptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of transparent assumptions made while interpreting the user's intent.",
    },
    clarificationNeeded: {
      type: Type.BOOLEAN,
      description:
        "True if the request is ambiguous, requests unsupported locations outside the network, or asks for unsupported mechanisms.",
    },
    clarificationQuestion: {
      type: Type.STRING,
      description:
        "A courteous, specific question explaining the constraints and asking for user clarification if clarificationNeeded is true; otherwise null.",
    },
    explanation: {
      type: Type.STRING,
      description:
        "Short 2-3 sentence explanation of why these interventions fit the goal, without fabricating numerical outcomes.",
    },
  },
  required: [
    "goalSummary",
    "targetLocations",
    "objectives",
    "interventions",
    "assumptions",
    "clarificationNeeded",
    "explanation",
  ],
};

const SYSTEM_INSTRUCTION = `You are CityTwin AI, a senior municipal transport and urban planning advisor for a digital twin simulator.
Your role is to translate a user's natural language planning brief into structured, valid interventions that can be executed deterministically by CityTwin's calculation engine.

CITY NETWORK TAXONOMY:
1. Hub Nodes:
   - "hospital_junction": City General Trauma Center, Medical University & Emergency Ambulance Arterial.
   - "college_road": Civic Polytechnic, High Schools & Student Transit Terminal.
   - "market_square": Central Commercial Bazaar & Wholesale District.
   - "residential_district": Southwest High-Density Residential Apartments.
   - "expressway_north": Regional 4-lane perimeter highway bypass.
   - "tech_park": IT Campuses & Research Labs.

2. Road Segments (Links):
   - "seg_res_college": Residential to College Road (3.2 km, transit/active mobility).
   - "seg_college_hospital": College Road to Hospital Junction (1.8 km, critical emergency access).
   - "seg_hospital_market": Hospital to Market Central Link (2.5 km, bus corridor).
   - "seg_res_market": Residential to Market Southern Ave (3.6 km, transit/green walkway).
   - "seg_expressway_hospital": Expressway to Hospital Feeder (2.4 km).
   - "seg_res_expressway": Residential to Expressway Link (4.1 km).
   - "seg_hospital_tech": Hospital to Tech Park Diagonal (2.9 km).
   - "seg_market_tech": Market to Tech Park Eastern Ave (3.4 km).

POLICY INTERVENTIONS & UNIT COSTS (in Indian Rupee Lakhs - ₹ Lakh):
1. "adaptiveSignals": ₹1.5 Lakh per targeted node.
2. "busPriority": ₹2.2 Lakh/km (+ ₹0.6 Lakh/km if dedicatedLane).
3. "greenWalkways": ₹1.1 Lakh/km (+ ₹1.5 Lakh if pedestrianizeMarketSquare).

CRITICAL CONSTRAINTS:
- Do NOT invent or predict final numerical travel times or cost savings in your text. CityTwin's deterministic engine computes all numbers.
- If the user references locations NOT in the network, set clarificationNeeded: true.
- Return ONLY valid JSON conforming to the schema.`;

function validatePlan(raw: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

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
      scenarioInterventions: {
        adaptiveSignals: { enabled: false, targetNodeIds: [], optimizationLevel: 3, costPerNodeLakhs: 1.5 },
        busPriority: { enabled: false, targetSegmentIds: [], dedicatedLane: false, frequencyMin: 6, electricFleetShare: 30, costPerKmLakhs: 2.2 },
        greenWalkways: { enabled: false, targetSegmentIds: [], pedestrianizeMarketSquare: false, canopyCoverageDensity: 3, costPerKmLakhs: 1.1 },
        budgetCapLakhs: 15.0,
      },
      validationErrors: ['Received non-object or null response from AI model.'],
      warnings: [],
      isValid: false,
      clarificationNeeded: true,
      clarificationQuestion: 'Could you rephrase your planning goal? The previous model response was malformed.',
    };
  }

  const goalSummary = typeof raw.goalSummary === 'string' && raw.goalSummary.trim()
    ? raw.goalSummary.trim()
    : 'Urban Planning Intervention';
  const explanation = typeof raw.explanation === 'string' && raw.explanation.trim()
    ? raw.explanation.trim()
    : 'Synthesized policy package for the specified civic corridor.';

  const rawLocations = Array.isArray(raw.targetLocations) ? raw.targetLocations : [];
  const targetLocations: string[] = [];
  const unsupportedLocations: string[] = [];

  rawLocations.forEach((loc: any) => {
    if (typeof loc === 'string') {
      const cleanLoc = loc.trim().toLowerCase();
      const matchedNode = CITY_NODE_IDS.find((id) => id === cleanLoc || cleanLoc.includes(id));
      const matchedSeg = ROAD_SEGMENT_IDS.find((id) => id === cleanLoc || cleanLoc.includes(id));
      if (matchedNode) {
        if (!targetLocations.includes(matchedNode)) targetLocations.push(matchedNode);
      } else if (matchedSeg) {
        if (!targetLocations.includes(matchedSeg)) targetLocations.push(matchedSeg);
      } else {
        unsupportedLocations.push(loc);
      }
    }
  });

  if (unsupportedLocations.length > 0) {
    errors.push(`Unsupported or unknown locations: ${unsupportedLocations.join(', ')}.`);
  }

  let budgetCapLakhs = 15.0;
  if (raw.budgetCapLakhs !== null && raw.budgetCapLakhs !== undefined) {
    const parsedBudget = Number(raw.budgetCapLakhs);
    if (!isNaN(parsedBudget) && parsedBudget > 0) {
      budgetCapLakhs = Math.min(50.0, Number(parsedBudget.toFixed(2)));
    }
  }

  const rawObjectives = Array.isArray(raw.objectives) ? raw.objectives : [];
  const objectives = rawObjectives
    .filter((o: any) => typeof o === 'string' && VALID_OBJECTIVES.includes(o.toLowerCase().trim()))
    .map((o: string) => o.toLowerCase().trim());
  if (objectives.length === 0) objectives.push('congestion');

  const scenarioInterventions = {
    adaptiveSignals: { enabled: false, targetNodeIds: [] as string[], optimizationLevel: 3, costPerNodeLakhs: 1.5 },
    busPriority: { enabled: false, targetSegmentIds: [] as string[], dedicatedLane: false, frequencyMin: 6, electricFleetShare: 30, costPerKmLakhs: 2.2 },
    greenWalkways: { enabled: false, targetSegmentIds: [] as string[], pedestrianizeMarketSquare: false, canopyCoverageDensity: 3, costPerKmLakhs: 1.1 },
    budgetCapLakhs,
  };

  const rawInterventions = Array.isArray(raw.interventions) ? raw.interventions : [];
  rawInterventions.forEach((item: any) => {
    if (!item || typeof item !== 'object') return;
    const type = String(item.type || '').trim().toLowerCase();

    if (type.includes('signal') || type.includes('adaptive')) {
      const targetNodeIds = (Array.isArray(item.targetLocations) ? item.targetLocations : [])
        .filter((loc: string) => CITY_NODE_IDS.includes(loc));
      scenarioInterventions.adaptiveSignals = {
        enabled: Boolean(item.enabled),
        targetNodeIds,
        optimizationLevel: Math.max(1, Math.min(5, Math.round(Number(item.parameters?.optimizationLevel) || 3))),
        costPerNodeLakhs: 1.5,
      };
    } else if (type.includes('bus') || type.includes('transit')) {
      const targetSegmentIds = (Array.isArray(item.targetLocations) ? item.targetLocations : [])
        .filter((loc: string) => TRANSIT_CORRIDOR_SEGMENTS.includes(loc));
      scenarioInterventions.busPriority = {
        enabled: Boolean(item.enabled),
        targetSegmentIds,
        dedicatedLane: Boolean(item.parameters?.dedicatedLane),
        frequencyMin: Math.max(3, Math.min(15, Math.round(Number(item.parameters?.frequencyMin) || 6))),
        electricFleetShare: Math.max(0, Math.min(100, Math.round(Number(item.parameters?.electricFleetShare) || 30))),
        costPerKmLakhs: 2.2,
      };
    } else if (type.includes('green') || type.includes('walk') || type.includes('pedestrian')) {
      const targetSegmentIds = (Array.isArray(item.targetLocations) ? item.targetLocations : [])
        .filter((loc: string) => ACTIVE_MOBILITY_SEGMENTS.includes(loc));
      scenarioInterventions.greenWalkways = {
        enabled: Boolean(item.enabled),
        targetSegmentIds,
        pedestrianizeMarketSquare: Boolean(item.parameters?.pedestrianizeMarketSquare),
        canopyCoverageDensity: Math.max(1, Math.min(5, Math.round(Number(item.parameters?.canopyCoverageDensity) || 3))),
        costPerKmLakhs: 1.1,
      };
    }
  });

  const needsClarification = Boolean(raw.clarificationNeeded) || errors.length > 0;
  const computedClarificationQuestion =
    raw.clarificationQuestion ||
    (errors.length > 0
      ? `We detected unsupported elements: ${errors.join(' ')} Which supported corridors or policy controls would you like to target?`
      : null);

  return {
    rawResponse: {
      goalSummary,
      targetLocations,
      budgetCapLakhs,
      objectives,
      interventions: rawInterventions,
      assumptions: Array.isArray(raw.assumptions) ? raw.assumptions : [],
      clarificationNeeded: needsClarification,
      clarificationQuestion: computedClarificationQuestion,
      explanation,
    },
    scenarioInterventions,
    validationErrors: errors,
    warnings,
    isValid: errors.length === 0 && !needsClarification,
    clarificationNeeded: needsClarification,
    clarificationQuestion: computedClarificationQuestion,
  };
}

// Helper to parse JSON body from Vercel Serverless Function request
async function parseBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'healthy',
      endpoint: '/api/planning-assistant',
      service: 'CityTwin AI Planning Assistant Serverless Function',
      geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const body = await parseBody(req);
  const prompt = body?.prompt;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({
      success: false,
      error: 'A non-empty planning prompt is required.',
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      success: false,
      error: 'GEMINI_API_KEY is not configured in Vercel environment variables. Please add GEMINI_API_KEY to your Vercel project settings.',
    });
  }

  try {
    const ai = getGenAIClient();
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError: any = null;
    let responseText: string | undefined;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt.trim(),
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: PLANNING_RESPONSE_SCHEMA,
            temperature: 0.2,
          },
        });

        responseText = response.text;
        if (responseText) {
          break;
        }
      } catch (apiErr: any) {
        lastError = apiErr;
        console.warn(`Model ${modelName} encountered error:`, apiErr?.message || apiErr);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Gemini model returned empty response after retries.');
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(responseText.trim());
    } catch (parseErr: any) {
      throw new Error(`Failed to parse structured JSON from model: ${parseErr.message}`);
    }

    const validatedResult = validatePlan(parsedJson);

    return res.status(200).json({
      success: true,
      plan: validatedResult,
    });
  } catch (err: any) {
    console.error('Error in /api/planning-assistant:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error while processing planning goal.',
    });
  }
}
