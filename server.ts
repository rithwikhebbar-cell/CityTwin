import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { validateGeminiPlan } from './src/simulation/geminiValidator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
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
              "Node IDs for adaptiveSignals (e.g. hospital_junction, college_road); Road segment IDs for busPriority or greenWalkways (e.g. seg_college_hospital).",
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
   - "hospital_junction": City General Trauma Center, Medical University & Emergency Ambulance Arterial (acute peak delays, critical emergency access).
   - "college_road": Civic Polytechnic, High Schools & Student Transit Terminal (high transit demand).
   - "market_square": Central Commercial Bazaar & Wholesale District (freight, emissions, high pedestrian density).
   - "residential_district": Southwest High-Density Residential Apartments (primary morning commute origin).
   - "expressway_north": Regional 4-lane perimeter highway bypass.
   - "tech_park": IT Campuses & Research Labs (major white-collar employment destination).

2. Road Segments (Links):
   - "seg_res_college": Residential to College Road (3.2 km, 2 lanes, potential for transit and active mobility).
   - "seg_college_hospital": College Road to Hospital Junction (1.8 km, 2 lanes, ACUTE BOTTLENECK, critical for hospital emergency access).
   - "seg_hospital_market": Hospital to Market Central Link (2.5 km, 3 lanes, potential for bus corridor).
   - "seg_res_market": Residential to Market Southern Ave (3.6 km, 2 lanes, potential for transit and green walkway).
   - "seg_expressway_hospital": Expressway to Hospital Feeder (2.4 km, 3 lanes, transit potential).
   - "seg_res_expressway": Residential to Expressway Link (4.1 km, 4 lanes).
   - "seg_hospital_tech": Hospital to Tech Park Diagonal (2.9 km, 2 lanes, transit and active mobility potential).
   - "seg_market_tech": Market to Tech Park Eastern Ave (3.4 km, 2 lanes, transit potential).

POLICY INTERVENTIONS & UNIT COSTS (in Indian Rupee Lakhs - ₹ Lakh):
1. "adaptiveSignals":
   - Cost: ₹1.5 Lakh per targeted node.
   - Target locations: Node IDs only (e.g. ["hospital_junction", "college_road"]).
   - Parameters: optimizationLevel (1 to 5).
2. "busPriority":
   - Cost: ₹2.2 Lakh/km (+ ₹0.6 Lakh/km if dedicatedLane is true).
   - Target locations: Segment IDs with transit potential (e.g. ["seg_college_hospital", "seg_hospital_market"]).
   - Parameters: dedicatedLane (boolean), frequencyMin (3 to 15 mins), electricFleetShare (0 to 100%).
3. "greenWalkways":
   - Cost: ₹1.1 Lakh/km (+ ₹1.5 Lakh if pedestrianizeMarketSquare is true).
   - Target locations: Segment IDs with active mobility potential (e.g. ["seg_college_hospital", "seg_res_college", "seg_res_market"]).
   - Parameters: pedestrianizeMarketSquare (boolean), canopyCoverageDensity (1 to 5).

BUDGETING RULES:
- If user specifies a budget like "₹10 lakh", set budgetCapLakhs: 10.0. Carefully configure interventions so the estimated total cost fits within this ceiling!
  - Example for ₹10 Lakh on Hospital:
    * adaptiveSignals on ["hospital_junction", "college_road"] = 2 * 1.5 = ₹3.0 Lakh
    * busPriority on ["seg_college_hospital"] (1.8 km * 2.8 with dedicated lane) = ~₹5.04 Lakh
    * greenWalkways on ["seg_college_hospital"] (1.8 km * 1.1) = ~₹1.98 Lakh
    * Total = ~₹10.02 Lakh (fits within/around ₹10.0 Lakh budget!).
- If user does not specify a budget, set budgetCapLakhs to null.

CRITICAL CONSTRAINTS:
- Do NOT invent or predict final numerical travel times (e.g. "will reduce travel time by 4.2 minutes"), exact emission tons, or cost savings in your text. CityTwin's deterministic simulation engine computes all numbers.
- If the user references locations NOT in the city network (e.g. "Airport", "Seaport", "Downtown South"), or asks for unsupported interventions (e.g. "monorail", "hyperloop", "tolls"), set clarificationNeeded: true and provide a clarificationQuestion explaining what is supported.
- Return ONLY valid JSON conforming to the schema.`;

function buildSystemInstruction(cityContext?: {
  cityName?: string;
  nodes?: Array<any>;
  roadSegments?: Array<any>;
  budgetCapLakhs?: number;
}): string {
  if (!cityContext || !cityContext.nodes || cityContext.nodes.length === 0) {
    return SYSTEM_INSTRUCTION;
  }

  const cityName = cityContext.cityName || 'Active City';
  const nodesList = cityContext.nodes
    .map((n) => `   - "${n.id}": ${n.name} (zone: ${n.zone || 'urban'}, delay: ${n.baselineDelaySeconds || 90}s)`)
    .join('\n');
  const segsList = (cityContext.roadSegments || [])
    .map(
      (s) =>
        `   - "${s.id}": ${s.name} (${s.lengthKm} km, ${s.lanes} lanes, transit: ${Boolean(s.hasTransitCorridorPotential)}, green: ${Boolean(s.hasActiveMobilityPotential)})`
    )
    .join('\n');

  return `You are CityTwin AI, a senior municipal transport and urban planning advisor for a digital twin simulator.
Your role is to translate a user's natural language planning brief into structured, valid interventions for the active city: "${cityName}".

ACTIVE CITY NETWORK TAXONOMY:
1. Hub Nodes:
${nodesList}

2. Road Segments (Links):
${segsList}

POLICY INTERVENTIONS & UNIT COSTS (in Indian Rupee Lakhs - ₹ Lakh):
1. "adaptiveSignals":
   - Cost: ₹1.5 Lakh per targeted node.
   - Target locations: Node IDs from the active city network above.
   - Parameters: optimizationLevel (1 to 5).
2. "busPriority":
   - Cost: ₹2.2 Lakh/km (+ ₹0.6 Lakh/km if dedicatedLane is true).
   - Target locations: Segment IDs from the active city network above that have transit potential.
   - Parameters: dedicatedLane (boolean), frequencyMin (3 to 15 mins), electricFleetShare (0 to 100%).
3. "greenWalkways":
   - Cost: ₹1.1 Lakh/km.
   - Target locations: Segment IDs from the active city network above that have active mobility potential.
   - Parameters: pedestrianizeMarketSquare (boolean), canopyCoverageDensity (1 to 5).

BUDGETING RULES:
- If user specifies a budget like "₹10 lakh" or "₹1 Cr" (100 Lakhs), set budgetCapLakhs to the numeric value in Lakhs (e.g. 10.0, 100.0, 500.0). CityTwin supports budgets from small pilots (₹5L) to multi-crore civic projects.
- If user does not specify a budget, set budgetCapLakhs to null.

CRITICAL CONSTRAINTS:
- Do NOT invent or predict final numerical travel times (e.g. "will reduce travel time by 4.2 minutes"), exact emission tons, or cost savings in your text. CityTwin's deterministic simulation engine computes all numbers.
- If the user references locations NOT in the active city network above, set clarificationNeeded: true and provide a clarificationQuestion explaining what is supported.
- Target ONLY valid node IDs and segment IDs from the active city network taxonomy above.
- Return ONLY valid JSON conforming to the schema.`;
}

// API endpoint for planning assistant
app.post('/api/planning-assistant', async (req, res) => {
  const { prompt, cityContext } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({
      success: false,
      error: 'A non-empty planning prompt is required.',
    });
  }

  try {
    const ai = getGenAIClient();
    const activeSystemInstruction = buildSystemInstruction(cityContext);

    // Models to try in order (gemini-3.1-flash-lite for instant response, gemini-3.8-flash fallback)
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError: any = null;
    let responseText: string | undefined;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt.trim(),
          config: {
            systemInstruction: activeSystemInstruction,
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

    // Validate the response using our rigorous domain validator tailored to active city nodes and segments
    const validatedPlan = validateGeminiPlan(
      parsedJson,
      cityContext?.nodes,
      cityContext?.roadSegments
    );

    return res.json({
      success: true,
      plan: validatedPlan,
    });
  } catch (err: any) {
    console.error('Error in /api/planning-assistant:', err);
    const errorMessage = err?.message || 'Internal server error while processing planning goal.';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CityTwin Urban Simulation Server',
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Dev vs Prod static/Vite mounting
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: disableHmr ? true : { server: httpServer },
        ws: disableHmr ? false : { server: httpServer },
        hmr: !disableHmr,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // If HMR is explicitly disabled via DISABLE_HMR env, gracefully acknowledge WebSocket upgrade requests
    // from Vite client to prevent "WebSocket closed without opened" unhandled rejections
    if (disableHmr) {
      httpServer.on('upgrade', async (req, socket) => {
        const key = req.headers['sec-websocket-key'];
        if (key && typeof key === 'string') {
          const crypto = await import('crypto');
          const acceptKey = crypto
            .createHash('sha1')
            .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
            .digest('base64');
          const proto = req.headers['sec-websocket-protocol'] || '';
          const protoHeader = proto ? `Sec-WebSocket-Protocol: ${proto}\r\n` : '';
          const headers = [
            'HTTP/1.1 101 Switching Protocols',
            'Upgrade: websocket',
            'Connection: Upgrade',
            `Sec-WebSocket-Accept: ${acceptKey}`,
          ];
          socket.write(headers.join('\r\n') + '\r\n' + protoHeader + '\r\n');
        } else {
          socket.destroy();
        }
      });
    }
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`CityTwin server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CityTwin server:', err);
  process.exit(1);
});
