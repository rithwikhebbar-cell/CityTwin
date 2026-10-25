import { Scenario } from '../types/simulation';
import { runSimulation, getInitialScenarios } from '../simulation/engine';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

/**
 * Returns a user-scoped localStorage key so accounts on the same browser cannot leak data
 */
export function getLocalStorageKey(userId?: string | null): string {
  if (userId && typeof userId === 'string' && userId.trim()) {
    return `citytwin_scenarios_user_${userId.trim()}`;
  }
  return 'citytwin_persisted_scenarios_anon';
}

export interface ScenarioServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  isLocalFallback?: boolean;
}

/**
 * Validates that a raw object conforms to the minimal Scenario interface
 */
export function validateScenarioStructure(raw: unknown): raw is Scenario {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.description === 'string' &&
    s.interventions !== undefined &&
    typeof s.interventions === 'object'
  );
}

/**
 * Read custom scenarios saved in browser localStorage for a specific user
 */
export function getLocalStoredScenarios(userId?: string | null): Scenario[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const key = getLocalStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(validateScenarioStructure);
    }
    return [];
  } catch (e) {
    console.warn('CityTwin: Error reading from localStorage', e);
    return [];
  }
}

/**
 * Write custom scenarios to browser localStorage for a specific user
 */
export function setLocalStoredScenarios(scenarios: Scenario[], userId?: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const key = getLocalStorageKey(userId);
    // Only persist valid scenarios to user-scoped storage
    const valid = scenarios.filter(validateScenarioStructure);
    window.localStorage.setItem(key, JSON.stringify(valid));
  } catch (e) {
    console.warn('CityTwin: Error writing to localStorage', e);
  }
}

/**
 * Returns shared read-only system baseline presets (not user-owned)
 */
export function getSystemPresets(): Scenario[] {
  return getInitialScenarios();
}

/**
 * Fetch scenarios belonging to the currently authenticated user
 * Newly registered users start with an empty personal scenario repository ([])
 */
export async function loadAllScenarios(userId?: string | null): Promise<{
  scenarios: Scenario[];
  source: 'supabase' | 'local';
  error?: string;
}> {
  const cleanUserId = typeof userId === 'string' && userId.trim() ? userId.trim() : null;

  // Unauthenticated requests must NEVER query the cloud database for scenarios
  if (!cleanUserId) {
    return {
      scenarios: [],
      source: 'supabase',
      error: 'User is not authenticated.',
    };
  }

  const client = getSupabaseClient();

  if (!client || !isSupabaseConfigured()) {
    // Supabase not configured: load strictly user-scoped local storage for this user ID
    const localCustom = getLocalStoredScenarios(cleanUserId);
    return {
      scenarios: localCustom,
      source: 'local',
      error: 'Supabase credentials not configured. Using user-scoped local storage.',
    };
  }

  try {
    // Query strictly filtered by the authenticated user's ID
    const { data, error } = await client
      .from('scenarios')
      .select('*')
      .eq('user_id', cleanUserId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('CityTwin Supabase fetch error:', error);
      const localCustom = getLocalStoredScenarios(cleanUserId);
      const isMissingTable =
        error.code === 'PGRST205' ||
        error.message.toLowerCase().includes('could not find the table') ||
        error.message.toLowerCase().includes('schema cache');
      const tableHint = isMissingTable
        ? ' (Table "scenarios" not found. Run migration in supabase/migrations/20261015000000_strict_account_isolation_rls.sql).'
        : '';
      return {
        scenarios: localCustom,
        source: 'local',
        error: `Supabase query error: ${error.message}${tableHint} Fallback to user-scoped local storage.`,
      };
    }

    if (!data || data.length === 0) {
      // User has 0 scenarios in Supabase. Check this user's isolated local storage only
      const localCustom = getLocalStoredScenarios(cleanUserId);
      return {
        scenarios: localCustom,
        source: 'supabase',
      };
    }

    // Parse returned DB rows belonging to this user
    const dbScenarios: Scenario[] = [];
    for (const row of data) {
      let scData: unknown = row.data;
      if (typeof scData === 'string') {
        try {
          scData = JSON.parse(scData);
        } catch {
          continue;
        }
      }

      if (validateScenarioStructure(scData)) {
        // Enforce deterministic simulation recalculation so the engine remains source of truth
        const recalculated = runSimulation(
          scData.interventions,
          scData.network?.nodes,
          scData.network?.roadSegments
        );
        dbScenarios.push({
          ...scData,
          id: row.id,
          name: row.name || scData.name,
          results: recalculated,
          network: scData.network,
          updatedAt: row.updated_at || scData.updatedAt || new Date().toISOString(),
          importedRealCityCandidates: scData.importedRealCityCandidates || [],
          userId: cleanUserId,
        });
      }
    }

    // Sync to user-scoped local storage cache
    setLocalStoredScenarios(dbScenarios, cleanUserId);

    return {
      scenarios: dbScenarios,
      source: 'supabase',
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('CityTwin Supabase connection exception:', err);
    const localCustom = getLocalStoredScenarios(cleanUserId);
    return {
      scenarios: localCustom,
      source: 'local',
      error: `Network exception connecting to Supabase: ${errMsg}`,
    };
  }
}

/**
 * Save or update a scenario in Supabase PostgreSQL and cache in user-scoped local storage
 */
export async function persistScenario(
  scenario: Scenario,
  explicitUserId?: string | null
): Promise<ScenarioServiceResult<Scenario>> {
  // Validate scenario integrity
  if (!validateScenarioStructure(scenario)) {
    return {
      success: false,
      error: 'Invalid scenario data structure: missing required parameters.',
    };
  }

  // Always keep deterministic simulation fresh
  const freshlyCalculated = runSimulation(
    scenario.interventions,
    scenario.network?.nodes,
    scenario.network?.roadSegments
  );
  const scenarioToSave: Scenario = {
    ...scenario,
    results: freshlyCalculated,
    updatedAt: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  let currentUserId: string | null = (explicitUserId && explicitUserId.trim()) || null;
  if (!currentUserId && client) {
    try {
      const {
        data: { session },
      } = await client.auth.getSession();
      currentUserId = session?.user?.id ?? null;
    } catch {
      // Ignore auth getSession error
    }
  }

  if (currentUserId) {
    scenarioToSave.userId = currentUserId;
  }

  // If Supabase is not configured, save locally in user-scoped storage (or anon only if truly unauthenticated)
  if (!client || !isSupabaseConfigured()) {
    saveToLocalStorage(scenarioToSave, currentUserId);
    return {
      success: true,
      data: scenarioToSave,
      isLocalFallback: true,
      error: 'Saved to local browser storage only (Supabase environment variables not configured).',
    };
  }

  try {
    if (!currentUserId) {
      saveToLocalStorage(scenarioToSave, null);
      return {
        success: true,
        data: scenarioToSave,
        isLocalFallback: true,
        error: 'Saved to local browser storage only (Sign in required for cloud database synchronization).',
      };
    }

    const upsertPayload: Record<string, unknown> = {
      id: scenarioToSave.id,
      name: scenarioToSave.name,
      data: scenarioToSave,
      updated_at: scenarioToSave.updatedAt,
      user_id: currentUserId,
    };

    const { error } = await client.from('scenarios').upsert(
      upsertPayload,
      { onConflict: 'id' }
    );

    if (error) {
      console.error('CityTwin: Supabase write failed:', error);
      // Do NOT falsely claim success. Save locally to prevent data loss, but report error truthfully
      saveToLocalStorage(scenarioToSave, currentUserId);
      const isMissingTable =
        error.code === 'PGRST205' ||
        error.message.toLowerCase().includes('could not find the table');
      const tableHint = isMissingTable
        ? ' (Table "scenarios" not found. Run migration in supabase/migrations/20261015000000_strict_account_isolation_rls.sql).'
        : '';
      return {
        success: false,
        error: `Supabase write failed: ${error.message}${tableHint} (Cached in user-scoped local browser storage to prevent data loss).`,
      };
    }

    // Success in Supabase! Also mirror locally for this user
    saveToLocalStorage(scenarioToSave, currentUserId);
    return {
      success: true,
      data: scenarioToSave,
      isLocalFallback: false,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    saveToLocalStorage(scenarioToSave, currentUserId || explicitUserId);
    return {
      success: false,
      error: `Supabase write exception: ${errMsg} (Cached in local storage).`,
    };
  }
}

/**
 * Rename an existing scenario in Supabase and local storage
 */
export async function renameScenario(
  scenarioId: string,
  newName: string,
  currentScenario: Scenario,
  userId?: string | null
): Promise<ScenarioServiceResult<Scenario>> {
  const trimmed = newName.trim();
  if (!trimmed) {
    return { success: false, error: 'Scenario name cannot be empty.' };
  }

  const updated: Scenario = {
    ...currentScenario,
    name: trimmed,
    updatedAt: new Date().toISOString(),
  };

  return persistScenario(updated, userId);
}

/**
 * Delete a scenario from Supabase PostgreSQL and local storage
 */
export async function deleteScenarioFromStorage(
  scenarioId: string,
  userId?: string | null
): Promise<ScenarioServiceResult> {
  const cleanUserId = typeof userId === 'string' && userId.trim() ? userId.trim() : null;
  const client = getSupabaseClient();

  // Remove from user-scoped local storage
  try {
    const local = getLocalStoredScenarios(cleanUserId);
    setLocalStoredScenarios(
      local.filter((s) => s.id !== scenarioId),
      cleanUserId
    );
  } catch (e) {
    console.warn('Error deleting from localStorage:', e);
  }

  if (!client || !isSupabaseConfigured() || !cleanUserId) {
    return {
      success: true,
      isLocalFallback: true,
    };
  }

  try {
    const { error } = await client
      .from('scenarios')
      .delete()
      .eq('id', scenarioId)
      .eq('user_id', cleanUserId);
    if (error) {
      return {
        success: false,
        error: `Failed to delete scenario from Supabase: ${error.message}`,
      };
    }
    return { success: true, isLocalFallback: false };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Supabase delete exception: ${errMsg}`,
    };
  }
}

/**
 * Helper to update user-scoped local storage copy
 */
function saveToLocalStorage(scenario: Scenario, userId?: string | null): void {
  try {
    const existing = getLocalStoredScenarios(userId);
    const index = existing.findIndex((s) => s.id === scenario.id);
    if (index >= 0) {
      existing[index] = scenario;
    } else {
      existing.unshift(scenario);
    }
    setLocalStoredScenarios(existing, userId);
  } catch (e) {
    console.warn('CityTwin: Local storage save failed', e);
  }
}
