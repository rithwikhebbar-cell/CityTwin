# CityTwin Supabase PostgreSQL Persistence & Authentication Setup

This guide details how to configure Supabase PostgreSQL persistence and Supabase Auth for CityTwin scenarios, municipal user accounts, and imported real-city GIS candidates.

## 1. Quick Setup in Supabase Dashboard

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard) and open or select your project.
2. In the left navigation, click on **SQL Editor**.
3. **Step 1 - Scenarios Table**: Click **New query**, paste the entire contents of `supabase/migrations/20261014000000_create_scenarios_table.sql`, and click **Run**.
4. **Step 2 - User Ownership & Auth RLS**: Click **New query**, paste the entire contents of `supabase/migrations/20261014000001_add_user_ownership_and_auth_rls.sql`, and click **Run**.
5. Confirm that the `scenarios` table is created in your **Table Editor** with columns:
   - `id` (text, primary key)
   - `name` (text)
   - `data` (jsonb)
   - `user_id` (uuid, foreign key referencing auth.users)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

---

## 2. Authentication & Email Redirect Configuration (Fixing ERR_CONNECTION_REFUSED on Mobile)

### Why ERR_CONNECTION_REFUSED Happens on Mobile Devices
When developing locally:
1. The development computer hosts the CityTwin server on its local port (e.g., `http://localhost:3000`).
2. If `emailRedirectTo` is not passed or if the Supabase project has `Site URL` set to `http://localhost:3000`, Supabase sends an email confirmation link that redirects to `http://localhost:3000/auth/callback`.
3. When the user taps that link on their physical mobile phone:
   - The phone tries to reach `localhost:3000` on the **phone itself** (loopback `127.0.0.1`), NOT the development computer.
   - Because no web server is running on the phone, the phone's browser immediately reports `ERR_CONNECTION_REFUSED`.

### Supabase Dashboard URL Configuration

In your Supabase project dashboard, navigate to **Authentication** -> **URL Configuration**:

1. **Site URL**:
   - **For Production**: Set to your canonical deployed domain (e.g. `https://citytwin.yourdomain.com`).
   - **For Local Development**: Set to `http://localhost:3000`.

2. **Redirect URLs (Allow list)**:
   Add each of the following URLs that match your environments:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
   - **For Mobile Testing on Local Network (LAN)**:
     `http://<YOUR_COMPUTER_LOCAL_IP>:3000/auth/callback` (e.g., `http://192.168.1.100:3000/auth/callback`)
   - **For Tunneling (ngrok/Cloudflare)**:
     `https://<your-tunnel-subdomain>.ngrok-free.app/auth/callback`
   - **For Production Deployed Environment**:
     `https://<your-production-domain>/auth/callback`
     `https://<your-production-domain>/**`

3. Click **Save Changes**.

### How to Test Email Confirmation During Local Development

Choose one of three supported methods:

- **Method A (Easiest - Local Machine)**:
  Open the confirmation email on the **same computer** where the development server is running (`http://localhost:3000`). Clicking the link will open `http://localhost:3000/auth/callback`, which exchanges the session and redirects into the simulator dashboard.

- **Method B (Mobile Testing via Local Wi-Fi / LAN)**:
  1. Find your development machine's local IP address (e.g., `192.168.1.100` via `ifconfig` or `ipconfig`).
  2. Set `VITE_APP_URL="http://192.168.1.100:3000"` in your `.env` file.
  3. Ensure your dev server listens on all interfaces (e.g., `--host 0.0.0.0`).
  4. Add `http://192.168.1.100:3000/auth/callback` to the Supabase Dashboard **Redirect URLs**.
  5. Connect your mobile phone to the same Wi-Fi network and register.

- **Method C (Production or Staging Deployment)**:
  1. Deploy CityTwin to your public hosting environment (e.g., Google Cloud Run, Vercel, Render).
  2. Set `VITE_APP_URL="https://your-app-domain.com"` in your production environment variables.
  3. Add `https://your-app-domain.com/auth/callback` to Supabase **Redirect URLs** and set it as **Site URL**.

---

## 3. Environment Variables Configuration

In your Supabase project dashboard, navigate to **Project Settings** -> **API**. Find:
- **Project URL** (e.g. `https://your-project-ref.supabase.co`) — *do NOT append `/rest/v1`*
- **Project API Keys** -> `anon` / `publishable` key (e.g. `sb_publishable_...` or JWT anon key)

Configure these in your `.env` file:

```bash
# Supabase PostgreSQL & Auth Credentials
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-publishable-key"

# Canonical App URL (Used for Supabase Auth confirmation emailRedirectTo)
# In production, set to your live domain e.g. https://citytwin.yourdomain.com
VITE_APP_URL="http://localhost:3000"
```

> **Security Note**: Never expose the `service_role` secret or database password in frontend environment variables. Only use the public/publishable `anon` key.

---

## 4. Access Model & Row-Level Security (RLS)

- Row-Level Security (RLS) is strictly enabled on the `scenarios` table.
- Municipal planners can only view, edit, or delete scenarios associated with their account (`auth.uid() = user_id`).
- Pre-seeded system benchmark scenarios (where `user_id IS NULL`) are readable by all authenticated planners as reference baselines.
- The simulator interface is fully protected: unauthenticated visitors at `/app` or `/simulator` are automatically redirected to `/login`.

---

## 5. Fallback Architecture

If Supabase is unreachable or unconfigured, CityTwin provides a seamless local storage fallback with transparent indicators in the Scenario Repository, ensuring zero loss of scenario interventions or candidate sites.
