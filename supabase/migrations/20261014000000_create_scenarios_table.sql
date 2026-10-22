-- CityTwin Urban Planning Simulator - Milestone 4: Supabase PostgreSQL Persistence
-- Migration: 20261014000000_create_scenarios_table.sql
-- Description: Creates the 'scenarios' table to persist urban planning scenarios,
-- policy interventions, deterministic simulation outcomes, and imported GIS candidate sites.

-- 1. Create Scenarios Table
CREATE TABLE IF NOT EXISTS public.scenarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Add Informative Column Comments
COMMENT ON TABLE public.scenarios IS 'Persisted CityTwin urban planning scenarios and real-city GIS candidates.';
COMMENT ON COLUMN public.scenarios.id IS 'Unique identifier for the scenario (e.g., scenario_hospital_relief, scenario_custom_...).';
COMMENT ON COLUMN public.scenarios.name IS 'Display name of the urban policy plan.';
COMMENT ON COLUMN public.scenarios.data IS 'JSONB payload conforming to CityTwin Scenario interface (interventions, metrics, results, importedRealCityCandidates).';
COMMENT ON COLUMN public.scenarios.created_at IS 'UTC timestamp when the scenario was first created.';
COMMENT ON COLUMN public.scenarios.updated_at IS 'UTC timestamp when the scenario was last updated.';

-- 3. Create Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_scenarios_updated_at ON public.scenarios(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_name ON public.scenarios(name);
CREATE INDEX IF NOT EXISTS idx_scenarios_data_gin ON public.scenarios USING GIN (data);

-- 4. Automatic Timestamp Update Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_scenarios_updated_at ON public.scenarios;
CREATE TRIGGER set_scenarios_updated_at
    BEFORE UPDATE ON public.scenarios
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Row-Level Security (RLS) Configuration
-- CityTwin is currently an open municipal planning simulation suite without mandatory individual user accounts.
-- RLS is enabled to ensure controlled access, with explicit public policies.
-- If user authentication is added in future milestones, policies can be restricted to auth.uid().
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read scenarios" ON public.scenarios;
CREATE POLICY "Public read scenarios"
    ON public.scenarios
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public insert scenarios" ON public.scenarios;
CREATE POLICY "Public insert scenarios"
    ON public.scenarios
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public update scenarios" ON public.scenarios;
CREATE POLICY "Public update scenarios"
    ON public.scenarios
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete scenarios" ON public.scenarios;
CREATE POLICY "Public delete scenarios"
    ON public.scenarios
    FOR DELETE
    USING (true);
