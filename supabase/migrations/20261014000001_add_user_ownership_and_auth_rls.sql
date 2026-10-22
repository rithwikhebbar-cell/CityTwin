-- CityTwin Urban Planning Simulator - Milestone 5: User Ownership & Supabase Auth RLS
-- Migration: 20261014000001_add_user_ownership_and_auth_rls.sql
-- Description: Adds user_id foreign key referencing auth.users(id) to associate scenarios
-- with authenticated municipal planner accounts, and configures Row-Level Security (RLS)
-- so users only access and modify their own scenarios while retaining access to system baselines.

-- 1. Add user_id column referencing Supabase auth.users
ALTER TABLE public.scenarios 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add performance index on user_id
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON public.scenarios(user_id);

-- 3. Informative Column Comment
COMMENT ON COLUMN public.scenarios.user_id IS 'Supabase auth UUID of the municipal planner who owns this scenario. NULL indicates a public benchmark/baseline scenario.';

-- 4. Upgrade Row-Level Security (RLS) Policies

-- Drop legacy open policies if they exist
DROP POLICY IF EXISTS "Public read scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Public insert scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Public update scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Public delete scenarios" ON public.scenarios;

DROP POLICY IF EXISTS "Users can read own or public scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can insert own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can update own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON public.scenarios;

-- SELECT: Users can read scenarios they created (user_id = auth.uid()) OR public system baselines (user_id IS NULL)
CREATE POLICY "Users can read own or public scenarios"
    ON public.scenarios
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR user_id IS NULL
    );

-- INSERT: Authenticated users can create scenarios assigned to their account (auth.uid() = user_id)
-- Also allow unassigned/local sync if anonymous (user_id IS NULL)
CREATE POLICY "Users can insert own scenarios"
    ON public.scenarios
    FOR INSERT
    WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR (auth.uid() IS NULL AND user_id IS NULL)
    );

-- UPDATE: Users can only modify scenarios that belong to them
CREATE POLICY "Users can update own scenarios"
    ON public.scenarios
    FOR UPDATE
    USING (
        auth.uid() = user_id
        OR (auth.uid() IS NULL AND user_id IS NULL)
    )
    WITH CHECK (
        auth.uid() = user_id
        OR (auth.uid() IS NULL AND user_id IS NULL)
    );

-- DELETE: Users can only delete scenarios that belong to them
CREATE POLICY "Users can delete own scenarios"
    ON public.scenarios
    FOR DELETE
    USING (
        auth.uid() = user_id
        OR (auth.uid() IS NULL AND user_id IS NULL)
    );
