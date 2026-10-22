-- CityTwin Urban Planning Simulator - Milestone 6: Strict Account Isolation RLS
-- Migration: 20261015000000_strict_account_isolation_rls.sql
-- Description: Hardens Row-Level Security (RLS) on public.scenarios to enforce 100% strict
-- account isolation. Prevents leaking unowned/legacy records across user dashboards.
-- Does NOT delete existing user data or reset the database.

-- 1. Ensure user_id column exists and references auth.users
ALTER TABLE public.scenarios 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ensure performance index on user_id exists
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON public.scenarios(user_id);

-- 3. Update Informative Column Comment
COMMENT ON COLUMN public.scenarios.user_id IS 'Supabase auth UUID of the municipal planner who owns this scenario. Required for personal scenario persistence.';

-- 4. Enable Row Level Security (idempotent)
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- 5. Drop prior policies that permitted unconstrained NULL user_id access
DROP POLICY IF EXISTS "Public read scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Public insert scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Public update scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Public delete scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can read own or public scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can insert own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can update own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can read own scenarios" ON public.scenarios;

-- 6. Strict Account Isolation Policies

-- SELECT: Authenticated users can ONLY read scenarios where user_id matches their own auth.uid()
CREATE POLICY "Users can read own scenarios"
    ON public.scenarios
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id
    );

-- INSERT: Authenticated users can ONLY insert scenarios with user_id bound to their own auth.uid()
CREATE POLICY "Users can insert own scenarios"
    ON public.scenarios
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id
    );

-- UPDATE: Authenticated users can ONLY update their own scenarios, and cannot change user_id
CREATE POLICY "Users can update own scenarios"
    ON public.scenarios
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id
    );

-- DELETE: Authenticated users can ONLY delete their own scenarios
CREATE POLICY "Users can delete own scenarios"
    ON public.scenarios
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL 
        AND auth.uid() = user_id
    );
