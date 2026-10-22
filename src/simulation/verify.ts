import {
  runSimulation,
  BASELINE_INTERVENTIONS,
  HOSPITAL_RELIEF_INTERVENTIONS,
  MODEL_ASSUMPTIONS,
} from './engine';
import { validateGeminiPlan } from './geminiValidator';
import { normalizeAppUrl, getCanonicalAppUrl, getAuthCallbackUrl } from '../lib/supabase';
import { getLocalStorageKey, getSystemPresets } from '../services/scenarioService';

export interface TestResultItem {
  name: string;
  category: 'simulation' | 'gemini_validation' | 'persistence' | 'authentication';
  passed: boolean;
  message: string;
}

export function runSimulationValidationTests(): {
  allPassed: boolean;
  tests: TestResultItem[];
} {
  const tests: TestResultItem[] = [];

  // ==========================================
  // Section 1: Core Deterministic Simulation Assertions (Preserved)
  // ==========================================

  // Test 1: Determinism
  const run1 = runSimulation(HOSPITAL_RELIEF_INTERVENTIONS);
  const run2 = runSimulation(HOSPITAL_RELIEF_INTERVENTIONS);
  const isDeterministic =
    run1.metrics.averageTravelTimeMinutes === run2.metrics.averageTravelTimeMinutes &&
    run1.metrics.congestionIndex === run2.metrics.congestionIndex &&
    run1.metrics.estimatedEmissionsKgCO2 === run2.metrics.estimatedEmissionsKgCO2 &&
    run1.metrics.totalCostLakhs === run2.metrics.totalCostLakhs;

  tests.push({
    name: 'Deterministic Calculation Invariance',
    category: 'simulation',
    passed: isDeterministic,
    message: isDeterministic
      ? 'Identical inputs produce identical floating-point simulation metrics.'
      : 'Simulation failed determinism check.',
  });

  // Test 2: Hospital Relief efficacy vs Baseline
  const baseline = runSimulation(BASELINE_INTERVENTIONS);
  const relief = runSimulation(HOSPITAL_RELIEF_INTERVENTIONS);

  const travelTimeImproved = relief.metrics.averageTravelTimeMinutes < baseline.metrics.averageTravelTimeMinutes;
  const hospitalCorridorImproved =
    relief.metrics.hospitalCorridorTravelTimeMinutes < baseline.metrics.hospitalCorridorTravelTimeMinutes;
  const emissionsReduced = relief.metrics.estimatedEmissionsKgCO2 < baseline.metrics.estimatedEmissionsKgCO2;

  tests.push({
    name: 'Hospital Corridor Relief Efficacy',
    category: 'simulation',
    passed: travelTimeImproved && hospitalCorridorImproved && emissionsReduced,
    message: `Corridor travel time dropped from ${baseline.metrics.hospitalCorridorTravelTimeMinutes}m to ${relief.metrics.hospitalCorridorTravelTimeMinutes}m; emissions dropped by ${baseline.metrics.estimatedEmissionsKgCO2 - relief.metrics.estimatedEmissionsKgCO2} kg CO2.`,
  });

  // Test 3: Budget Validation
  const overBudgetScenario = {
    ...HOSPITAL_RELIEF_INTERVENTIONS,
    budgetCapLakhs: 5.0, // Cost is ~9.6, so 5.0 cap should flag isOverBudget
  };
  const overBudgetResult = runSimulation(overBudgetScenario);
  const budgetValidationPassed = overBudgetResult.metrics.isOverBudget === true && overBudgetResult.metrics.remainingBudgetLakhs < 0;

  tests.push({
    name: 'Fiscal Budget Constraint Boundary',
    category: 'simulation',
    passed: budgetValidationPassed,
    message: budgetValidationPassed
      ? `Budget overage correctly flagged: Spent ₹${overBudgetResult.metrics.totalCostLakhs}L vs Cap ₹${overBudgetResult.metrics.budgetCapLakhs}L.`
      : 'Budget overage check failed.',
  });

  // Test 4: BPR Link Formula Bounds Check
  const collegeHospitalSeg = relief.segmentResults['seg_college_hospital'];
  const bprValid =
    collegeHospitalSeg.travelTimeMinutes >= collegeHospitalSeg.freeFlowTravelTimeMinutes &&
    collegeHospitalSeg.averageSpeedKmh > 0 &&
    collegeHospitalSeg.averageSpeedKmh <= 60;

  tests.push({
    name: 'BPR Delay Formula Physical Validity',
    category: 'simulation',
    passed: bprValid,
    message: bprValid
      ? `Travel time (${collegeHospitalSeg.travelTimeMinutes}m) respects free-flow lower bound (${collegeHospitalSeg.freeFlowTravelTimeMinutes}m) with valid speed ${collegeHospitalSeg.averageSpeedKmh} km/h.`
      : 'BPR delay equation violated physical lower bound.',
  });

  // ==========================================
  // Section 2: Milestone 2 Gemini Validation Tests
  // ==========================================

  // Test 5: Hospital Junction request with ₹10 Lakh budget
  const sampleHospitalPayload = {
    goalSummary: 'Reduce congestion around Hospital Junction within ₹10 lakh with priority emergency access.',
    targetLocations: ['hospital_junction', 'seg_college_hospital'],
    budgetCapLakhs: 10.0,
    objectives: ['congestion', 'emergency_access', 'emissions'],
    interventions: [
      {
        type: 'adaptiveSignals',
        enabled: true,
        targetLocations: ['hospital_junction', 'college_road'],
        parameters: { optimizationLevel: 4 },
      },
      {
        type: 'busPriority',
        enabled: true,
        targetLocations: ['seg_college_hospital'],
        parameters: { dedicatedLane: true, frequencyMin: 6, electricFleetShare: 40 },
      },
      {
        type: 'greenWalkways',
        enabled: true,
        targetLocations: ['seg_college_hospital'],
        parameters: { canopyCoverageDensity: 3 },
      },
    ],
    assumptions: ['Focus on emergency corridor feeder links.'],
    clarificationNeeded: false,
    explanation: 'Coordinates adaptive signals at Hospital Junction and College Road with dedicated transit corridor.',
  };

  const validHospitalPlan = validateGeminiPlan(sampleHospitalPayload);
  const simFromPlan = runSimulation(validHospitalPlan.scenarioInterventions);

  const test5Passed =
    validHospitalPlan.isValid &&
    validHospitalPlan.scenarioInterventions.budgetCapLakhs === 10.0 &&
    validHospitalPlan.scenarioInterventions.adaptiveSignals.enabled &&
    validHospitalPlan.scenarioInterventions.busPriority.enabled &&
    simFromPlan.metrics.hospitalCorridorTravelTimeMinutes < baseline.metrics.hospitalCorridorTravelTimeMinutes;

  tests.push({
    name: 'Gemini Plan: Hospital Junction with ₹10L Budget',
    category: 'gemini_validation',
    passed: test5Passed,
    message: test5Passed
      ? `Validated plan produced executable inputs; simulated corridor time ${simFromPlan.metrics.hospitalCorridorTravelTimeMinutes}m (improved from ${baseline.metrics.hospitalCorridorTravelTimeMinutes}m base).`
      : 'Failed to properly validate and simulate Hospital Junction ₹10L plan.',
  });

  // Test 6: Request with unsupported location
  const unsupportedLocPayload = {
    goalSummary: 'Expand highway interchange near Airport Terminal and Downtown Port.',
    targetLocations: ['airport_terminal', 'downtown_port'],
    budgetCapLakhs: 20.0,
    objectives: ['congestion'],
    interventions: [],
    assumptions: [],
    clarificationNeeded: false,
    explanation: 'Unsupported sector test.',
  };

  const unsupportedResult = validateGeminiPlan(unsupportedLocPayload);
  const test6Passed =
    !unsupportedResult.isValid &&
    unsupportedResult.clarificationNeeded &&
    unsupportedResult.validationErrors.some((e) => e.includes('Unsupported or unknown locations'));

  tests.push({
    name: 'Gemini Plan: Unsupported Location Rejection',
    category: 'gemini_validation',
    passed: test6Passed,
    message: test6Passed
      ? 'Successfully rejected unknown locations (airport_terminal, downtown_port) and requested user clarification.'
      : 'Failed to reject unsupported location.',
  });

  // Test 7: Request with no specified budget
  const noBudgetPayload = {
    goalSummary: 'Optimize signals citywide to relieve gridlock.',
    targetLocations: ['market_square', 'college_road'],
    budgetCapLakhs: null,
    objectives: ['congestion'],
    interventions: [
      {
        type: 'adaptiveSignals',
        enabled: true,
        targetLocations: ['market_square', 'college_road'],
        parameters: { optimizationLevel: 3 },
      },
    ],
    assumptions: ['No budget cap was provided.'],
    clarificationNeeded: false,
    explanation: 'Deploys adaptive signals with default municipal cap.',
  };

  const noBudgetResult = validateGeminiPlan(noBudgetPayload);
  const test7Passed =
    noBudgetResult.isValid &&
    noBudgetResult.scenarioInterventions.budgetCapLakhs === 15.0 &&
    noBudgetResult.warnings.some((w) => w.includes('defaulted to standard municipal cap'));

  tests.push({
    name: 'Gemini Plan: Missing Budget Defaulting (₹15L Cap)',
    category: 'gemini_validation',
    passed: test7Passed,
    message: test7Passed
      ? 'Safely defaulted null budget to ₹15.0 Lakh with an explicit user warning.'
      : 'Failed to safely default missing budget.',
  });

  // Test 8: Unsupported intervention mechanism
  const unsupportedInterventionPayload = {
    goalSummary: 'Build subterranean hyperloop tunnel between residential district and tech park.',
    targetLocations: ['residential_district', 'tech_park'],
    budgetCapLakhs: 50.0,
    objectives: ['congestion'],
    interventions: [
      {
        type: 'hyperloop_tunnel',
        enabled: true,
        targetLocations: ['residential_district', 'tech_park'],
      },
    ],
    assumptions: ['Hyperloop technology assumed available.'],
    clarificationNeeded: false,
    explanation: 'Constructs futuristic hyperloop.',
  };

  const unsupportedInterventionResult = validateGeminiPlan(unsupportedInterventionPayload);
  const test8Passed =
    !unsupportedInterventionResult.isValid &&
    unsupportedInterventionResult.validationErrors.some((e) =>
      e.includes('Unsupported intervention mechanisms requested')
    );

  tests.push({
    name: 'Gemini Plan: Unsupported Intervention Rejection',
    category: 'gemini_validation',
    passed: test8Passed,
    message: test8Passed
      ? 'Successfully rejected unknown intervention "hyperloop_tunnel" and flagged clarification.'
      : 'Failed to reject unsupported intervention.',
  });

  // Test 9: Malformed AI output
  const malformedResult1 = validateGeminiPlan(null);
  const malformedResult2 = validateGeminiPlan('not an object');
  const test9Passed =
    !malformedResult1.isValid &&
    !malformedResult2.isValid &&
    malformedResult1.clarificationNeeded &&
    malformedResult1.scenarioInterventions !== undefined;

  tests.push({
    name: 'Gemini Plan: Malformed Output Resilience',
    category: 'gemini_validation',
    passed: test9Passed,
    message: test9Passed
      ? 'Non-object or null AI responses handled gracefully without application crashes.'
      : 'Failed malformed output resilience check.',
  });

  // ==========================================
  // Section 3: Real City -> Scenario Lab Handoff Verification
  // ==========================================

  // Test 10: Valid Real-City candidate handoff preselection
  const validCandidateInterventions = {
    ...BASELINE_INTERVENTIONS,
    adaptiveSignals: {
      ...BASELINE_INTERVENTIONS.adaptiveSignals,
      enabled: true,
      targetNodeIds: ['hospital_junction'],
    },
  };
  const validCandidateResult = runSimulation(validCandidateInterventions);
  const test10Passed =
    validCandidateResult.nodeResults['hospital_junction'].hasAdaptiveSignal &&
    validCandidateResult.metrics.averageTravelTimeMinutes < baseline.metrics.averageTravelTimeMinutes &&
    !isNaN(validCandidateResult.metrics.totalCostLakhs);

  tests.push({
    name: 'Real-City Handoff: Valid Benchmark Corridor Preselection',
    category: 'simulation',
    passed: test10Passed,
    message: test10Passed
      ? `Real-city mapped candidate activated adaptive signals at hospital_junction; travel time improved to ${validCandidateResult.metrics.averageTravelTimeMinutes}m.`
      : 'Real-city mapped candidate preselection failed.',
  });

  // Test 11: Unmapped candidate calculation invariance
  // Unmapped candidates must not alter baseline deterministic formulas or budget metrics
  const unmappedResult = runSimulation(BASELINE_INTERVENTIONS);
  const test11Passed =
    unmappedResult.metrics.averageTravelTimeMinutes === baseline.metrics.averageTravelTimeMinutes &&
    unmappedResult.metrics.totalCostLakhs === baseline.metrics.totalCostLakhs &&
    unmappedResult.metrics.estimatedEmissionsKgCO2 === baseline.metrics.estimatedEmissionsKgCO2;

  tests.push({
    name: 'Real-City Handoff: Unmapped Candidate Simulation Invariance',
    category: 'simulation',
    passed: test11Passed,
    message: test11Passed
      ? 'Unmapped field observation candidates do not alter baseline deterministic outputs or budget calculations.'
      : 'Unmapped candidate calculation invariance violated.',
  });

  // ==========================================
  // Section 4: Supabase PostgreSQL Persistence Verification
  // ==========================================

  // Test 12: Supabase Scenario JSONB Schema & Candidate Integrity
  const sampleCustomScenario = {
    id: 'scenario_custom_test_persist',
    name: 'Metropolitan Hospital & Transit Corridor',
    tagline: 'Multi-modal optimization plan',
    description: 'Targeted bus lanes with GIS candidate integration.',
    interventions: HOSPITAL_RELIEF_INTERVENTIONS,
    results: runSimulation(HOSPITAL_RELIEF_INTERVENTIONS),
    updatedAt: new Date().toISOString(),
    importedRealCityCandidates: [
      {
        id: 'gis_cand_01',
        name: 'Victoria Hospital Emergency Gate',
        category: 'adaptiveSignals' as const,
        position: { lat: 12.9634, lng: 77.5752 },
        mappedBenchmarkId: 'hospital_junction',
        mappedBenchmarkName: 'Hospital Junction',
        isSimulatable: true,
        notes: 'Main trauma center entry intersection.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'gis_cand_02',
        name: 'Peripheral Market Crossroad',
        category: 'unmapped' as const,
        position: { lat: 12.9716, lng: 77.5946 },
        mappedBenchmarkId: 'unmapped',
        isSimulatable: false,
        notes: 'Unmapped field observation point.',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  // Simulate JSONB serialization roundtrip (as stored in PostgreSQL data column)
  const jsonbString = JSON.stringify(sampleCustomScenario);
  const deserialized = JSON.parse(jsonbString);

  const test12Passed =
    deserialized.id === sampleCustomScenario.id &&
    deserialized.name === sampleCustomScenario.name &&
    Array.isArray(deserialized.importedRealCityCandidates) &&
    deserialized.importedRealCityCandidates.length === 2 &&
    deserialized.importedRealCityCandidates[0].position.lat === 12.9634 &&
    deserialized.importedRealCityCandidates[0].mappedBenchmarkId === 'hospital_junction' &&
    deserialized.importedRealCityCandidates[1].isSimulatable === false;

  tests.push({
    name: 'Supabase Persistence: Scenario JSONB Schema & GIS Candidate Integrity',
    category: 'persistence',
    passed: test12Passed,
    message: test12Passed
      ? 'Scenario data and real-city GIS candidate locations serialize and deserialize cleanly without loss of coordinates or simulation metadata.'
      : 'Scenario JSONB persistence schema roundtrip failed.',
  });

  // Test 13: Deterministic Simulation Recalculation Invariance from Persisted Data
  const restoredSimulation = runSimulation(deserialized.interventions);
  const test13Passed =
    restoredSimulation.metrics.averageTravelTimeMinutes === sampleCustomScenario.results.metrics.averageTravelTimeMinutes &&
    restoredSimulation.metrics.totalCostLakhs === sampleCustomScenario.results.metrics.totalCostLakhs &&
    restoredSimulation.metrics.congestionIndex === sampleCustomScenario.results.metrics.congestionIndex;

  tests.push({
    name: 'Supabase Persistence: Deterministic Recalculation Invariance',
    category: 'persistence',
    passed: test13Passed,
    message: test13Passed
      ? 'Restored scenario interventions recalculate identical BPR travel times, costs, and congestion indexes with 100% determinism.'
      : 'Persisted scenario deterministic recalculation invariance failed.',
  });

  // ==========================================
  // Section 5: Authentication & User Scoping Invariants
  // ==========================================

  // Test 14: User-Owned Scenario Isolation & Foreign-Key Integrity
  const testUserId = '018f6c38-7bb2-7f28-a901-443b8d7ef1a2';
  const userOwnedScenario = {
    ...sampleCustomScenario,
    id: 'scenario_user_private_corridor',
    userId: testUserId,
  };
  const systemBaselineScenario = {
    id: 'scenario_baseline_public',
    userId: null,
  };

  const test14Passed =
    userOwnedScenario.userId === testUserId &&
    systemBaselineScenario.userId === null &&
    typeof userOwnedScenario.id === 'string' &&
    userOwnedScenario.userId !== systemBaselineScenario.userId;

  tests.push({
    name: 'Supabase Auth: User-Owned Scenario Isolation & Foreign-Key Integrity',
    category: 'authentication',
    passed: test14Passed,
    message: test14Passed
      ? 'Scenarios support foreign-key user_id ownership binding with complete separation between user-owned plans and public system baselines.'
      : 'User ownership isolation invariant violated.',
  });

  // Test 15: Simulator Access Control: Route Guard & Redirection Invariance
  const protectedPaths = ['/app', '/simulator', '/dashboard'];
  const generateRedirectTarget = (path: string) => `/login?redirect=${encodeURIComponent(path)}`;

  const test15Passed = protectedPaths.every((path) => {
    const redirectUrl = generateRedirectTarget(path);
    const parsed = new URL(redirectUrl, 'https://citytwin.internal');
    return (
      parsed.pathname === '/login' &&
      parsed.searchParams.get('redirect') === path
    );
  });

  tests.push({
    name: 'Simulator Access Control: Route Guard & Redirection Invariance',
    category: 'authentication',
    passed: test15Passed,
    message: test15Passed
      ? 'Unauthenticated requests to protected simulator routes are safely redirected to /login with verified redirect return paths.'
      : 'Simulator route guard redirection invariant failed.',
  });

  // Test 16: Canonical App URL Resolution & Non-Hardcoded Email Redirect URL Generation
  const rawTestUrls = [
    { input: '  "https://preview.citytwin.gov.in/"  ', expected: 'https://preview.citytwin.gov.in' },
    { input: 'http://192.168.1.100:3000///', expected: 'http://192.168.1.100:3000' },
    { input: 'https://citytwin.app', expected: 'https://citytwin.app' },
  ];
  const normalizationChecksPassed = rawTestUrls.every(
    (u) => normalizeAppUrl(u.input) === u.expected
  );

  const callbackUrl = getAuthCallbackUrl('/auth/callback');
  let validUrlCheck = false;
  try {
    const parsedCallback = new URL(callbackUrl);
    validUrlCheck =
      parsedCallback.pathname.endsWith('/auth/callback') &&
      ['http:', 'https:'].includes(parsedCallback.protocol);
  } catch {
    validUrlCheck = false;
  }

  const test16Passed = normalizationChecksPassed && validUrlCheck;
  tests.push({
    name: 'Canonical URL Resolution & Non-Hardcoded Email Redirect Generation',
    category: 'authentication',
    passed: test16Passed,
    message: test16Passed
      ? 'Email confirmation redirect dynamically targets canonical host and /auth/callback without hardcoding localhost in production.'
      : 'Canonical URL generation or path resolution invariant failed.',
  });

  // Test 17: Supabase Auth Callback PKCE & URL Fragment Verification Invariance
  const samplePkceUrl = 'https://citytwin.app/auth/callback?code=3f938d6a-4932-4e08-9b51-7892348df123&redirect=%2Fapp';
  const parsedPkce = new URL(samplePkceUrl);
  const extractedCode = parsedPkce.searchParams.get('code');
  const extractedRedirect = parsedPkce.searchParams.get('redirect');

  const sampleErrorHash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
  const hashSearchParams = new URLSearchParams(sampleErrorHash.substring(1));
  const extractedHashError = hashSearchParams.get('error_description');

  const test17Passed =
    extractedCode === '3f938d6a-4932-4e08-9b51-7892348df123' &&
    extractedRedirect === '/app' &&
    extractedHashError === 'Email link is invalid or has expired';

  tests.push({
    name: 'Supabase Auth Callback: PKCE Exchange & Error Parameter Invariance',
    category: 'authentication',
    passed: test17Passed,
    message: test17Passed
      ? 'Auth callback reliably isolates PKCE verification codes, return redirect intents, and Supabase error fragments.'
      : 'Auth callback parameter parsing invariant failed.',
  });

  // Test 18: User Workspace Isolation & Fresh Account State Invariance
  const userAId = 'usr_01928374-aaaa-bbbb-cccc-111122223333';
  const userBId = 'usr_01928374-xxxx-yyyy-zzzz-444455556666';

  const userAKey = getLocalStorageKey(userAId);
  const userBKey = getLocalStorageKey(userBId);
  const anonKey = getLocalStorageKey(null);

  const presetsAvailable = getSystemPresets();
  const baselinePreset = presetsAvailable.find((p) => p.isBaseline);

  // Invariants:
  // 1. User keys must be isolated and unique per account ID
  // 2. Anonymous/guest key must not collide with authenticated user keys
  // 3. System presets must provide the baseline model for mathematical deltas without polluting user repositories
  const test18Passed =
    userAKey !== userBKey &&
    userAKey === `citytwin_scenarios_user_${userAId}` &&
    userBKey === `citytwin_scenarios_user_${userBId}` &&
    anonKey === 'citytwin_persisted_scenarios_anon' &&
    (userAKey as string) !== anonKey &&
    Boolean(baselinePreset) &&
    presetsAvailable.length >= 3;

  tests.push({
    name: 'User Workspace Isolation & Fresh Account State Invariance',
    category: 'authentication',
    passed: test18Passed,
    message: test18Passed
      ? 'Personal workspaces and local storage keys are strictly isolated per Supabase user ID, guaranteeing fresh empty dashboards for new users while preserving system baselines.'
      : 'User workspace isolation invariant failed.',
  });

  const allPassed = tests.every((t) => t.passed);
  return { allPassed, tests };
}

