import React from 'react';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../lib/authContext';
import {
  Building2,
  Sliders,
  MapPin,
  Sparkles,
  GitCompare,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
  Database,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  Car,
  Leaf,
  DollarSign,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/app');
    } else {
      navigate('/signup');
    }
  };

  const handleLogin = () => {
    if (user) {
      navigate('/app');
    } else {
      navigate('/login');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070c1e] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* 1. TOP BAR CONTRACT: 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-50 bg-[#070c1e]/90 backdrop-blur-md border-b border-slate-800/80 px-6 sm:px-10 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title wordmark, single element */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Building2 className="w-4 h-4" />
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-lg font-bold tracking-tight text-white hover:text-teal-300 transition-colors whitespace-nowrap"
          >
            CityTwin
          </button>
        </div>

        {/* Zone 2: 4-5 single-line clean text nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-teal-300 transition-colors whitespace-nowrap shrink-0"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('preview')}
            className="hover:text-teal-300 transition-colors whitespace-nowrap shrink-0"
          >
            Simulator
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-teal-300 transition-colors whitespace-nowrap shrink-0"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('methodology')}
            className="hover:text-teal-300 transition-colors whitespace-nowrap shrink-0"
          >
            Simulation Engine
          </button>
        </nav>

        {/* Zone 3: 1 primary action / login */}
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              Open Simulator
            </button>
          ) : (
            <>
              <button
                onClick={handleLogin}
                className="text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Log In
              </button>
              <button
                onClick={handleGetStarted}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Architectural Kicker (unboxed text) */}
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-teal-400">
              <span>Urban Transport Digital Twin</span>
              <span aria-hidden="true">·</span>
              <span>Deterministic Simulation Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white" style={{ textWrap: 'balance' }}>
              Design Better Cities. Before You Build Them.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              CityTwin enables municipal planners, transport authorities, and urban engineers to configure policy interventions, simulate congestion and carbon reductions using deterministic mathematical models, and audit comparative scenarios before committing public capital.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>{user ? 'Launch Simulator' : 'Start Planning Free'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToSection('preview')}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-medium text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
              >
                Explore Dashboard Preview
              </button>
            </div>

            {/* Clean Proofstrip */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Deterministic BPR Volume-Delay Math</span>
              </div>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Google Maps Real-City Spatial Handoff</span>
              </div>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Supabase PostgreSQL Scenario Persistence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT PREVIEW SECTION */}
      <section id="preview" className="py-20 md:py-24 bg-[#091024] border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Live Simulation Environment</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Interactive Network & Scenario Workspace
            </h2>
            <p className="text-sm text-slate-300">
              Real-time visualization of city nodes, corridor bottlenecks, policy parameters, and deterministic travel time recalculation.
            </p>
          </div>

          {/* Interactive UI Mockup Card */}
          <div className="rounded-xl border border-slate-800 bg-[#060b19] shadow-2xl overflow-hidden">
            {/* App Header Bar Mockup */}
            <div className="h-11 bg-[#0b132b] border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                </div>
                <span className="font-semibold text-slate-200">Hospital Junction Emergency Relief</span>
                <span aria-hidden="true">·</span>
                <span className="text-teal-400">Deterministic Engine Active</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Budget Cap: ₹15.0L</span>
                <span className="text-emerald-400 font-medium">Under Budget (₹9.6L)</span>
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Network SVG Diagram */}
              <div className="lg:col-span-7 bg-[#080e22] rounded-lg border border-slate-800/80 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <span>Corridor Topology & Congestion Levels</span>
                  </div>
                  <span className="text-xs text-slate-400">6 Nodes · 8 Arterials</span>
                </div>

                {/* SVG Visual Network */}
                <div className="relative h-64 w-full bg-[#040814] rounded-lg border border-slate-800/60 p-2 overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 500 240" fill="none">
                    {/* Road links */}
                    <line x1="80" y1="120" x2="190" y2="70" stroke="#334155" strokeWidth="3" />
                    <line x1="190" y1="70" x2="330" y2="70" stroke="#14b8a6" strokeWidth="5" strokeDasharray="4 2" />
                    <line x1="330" y1="70" x2="430" y2="120" stroke="#334155" strokeWidth="3" />
                    <line x1="80" y1="120" x2="190" y2="180" stroke="#334155" strokeWidth="3" />
                    <line x1="190" y1="180" x2="330" y2="180" stroke="#334155" strokeWidth="3" />
                    <line x1="330" y1="180" x2="430" y2="120" stroke="#334155" strokeWidth="3" />
                    <line x1="190" y1="70" x2="190" y2="180" stroke="#334155" strokeWidth="3" />
                    <line x1="330" y1="70" x2="330" y2="180" stroke="#f59e0b" strokeWidth="4" />

                    {/* Nodes */}
                    {/* Residential */}
                    <circle cx="80" cy="120" r="14" fill="#0b132b" stroke="#64748b" strokeWidth="2" />
                    <text x="80" y="148" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="500">Residential</text>

                    {/* College Rd */}
                    <circle cx="190" cy="70" r="14" fill="#0b132b" stroke="#14b8a6" strokeWidth="2" />
                    <text x="190" y="48" textAnchor="middle" fill="#14b8a6" fontSize="10" fontWeight="500">College Rd</text>

                    {/* Hospital Junction - Highlighted */}
                    <circle cx="330" cy="70" r="18" fill="#0f2937" stroke="#0d9488" strokeWidth="3" />
                    <circle cx="330" cy="70" r="8" fill="#14b8a6" />
                    <text x="330" y="46" textAnchor="middle" fill="#5eead4" fontSize="11" fontWeight="700">Hospital Junction</text>

                    {/* Tech Park */}
                    <circle cx="430" cy="120" r="14" fill="#0b132b" stroke="#64748b" strokeWidth="2" />
                    <text x="430" y="148" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="500">Tech Park</text>

                    {/* Market Square */}
                    <circle cx="190" cy="180" r="14" fill="#0b132b" stroke="#64748b" strokeWidth="2" />
                    <text x="190" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="500">Market Sq</text>

                    {/* Expressway North */}
                    <circle cx="330" cy="180" r="14" fill="#0b132b" stroke="#64748b" strokeWidth="2" />
                    <text x="330" y="206" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="500">Expressway</text>

                    {/* Dedicated Bus corridor label */}
                    <rect x="220" y="58" width="80" height="18" rx="4" fill="#080e22" stroke="#14b8a6" strokeWidth="1" />
                    <text x="260" y="70" textAnchor="middle" fill="#5eead4" fontSize="9" fontWeight="600">Transit Priority</text>
                  </svg>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Selected Corridor: <strong>College Rd ↔ Hospital Junction (1.8 km)</strong></span>
                  <span className="text-teal-400 font-medium">BPR Travel Time: 13.8 min (-4.8 min relief)</span>
                </div>
              </div>

              {/* Right Column: Key Metric Strip & Interventions */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#080e22] rounded-lg border border-slate-800/80 p-3.5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      <span>Avg City Travel</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-white">21.8 min</div>
                    <div className="text-[11px] text-emerald-400 font-medium mt-1">11.4% improvement</div>
                  </div>

                  <div className="bg-[#080e22] rounded-lg border border-slate-800/80 p-3.5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Car className="w-3.5 h-3.5 text-amber-400" />
                      <span>Congestion Index</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-300">54 / 100</div>
                    <div className="text-[11px] text-emerald-400 font-medium mt-1">-18 pts vs baseline</div>
                  </div>

                  <div className="bg-[#080e22] rounded-lg border border-slate-800/80 p-3.5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Daily CO₂ Emissions</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-white">1,220 kg</div>
                    <div className="text-[11px] text-emerald-400 font-medium mt-1">-210 kg net reduction</div>
                  </div>

                  <div className="bg-[#080e22] rounded-lg border border-slate-800/80 p-3.5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-sky-400" />
                      <span>Capital Cost</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-sky-300">₹9.6 Lakh</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">Under ₹15L Cap</div>
                  </div>
                </div>

                <div className="bg-[#080e22] rounded-lg border border-slate-800/80 p-4 space-y-2.5">
                  <div className="text-xs font-semibold text-slate-300">Configured Policy Interventions</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Adaptive Signal Coordination</span>
                      <span className="font-mono text-teal-400">Level 4 (Real-time sync)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Dedicated Bus Transit Lane</span>
                      <span className="font-mono text-teal-400">5 min headway · 40% EV</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Green Walkway Infrastructure</span>
                      <span className="font-mono text-teal-400">Tier 3 Canopy · Pedestrianized</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES SECTION (Asymmetric Bento Grid) */}
      <section id="features" className="py-20 md:py-24 max-w-6xl mx-auto px-6 sm:px-10 border-b border-slate-800/80">
        <div className="mb-14 text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Platform Capabilities</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Comprehensive Urban Simulation Architecture
          </h2>
          <p className="text-sm text-slate-300">
            Engineered for transport planners, municipal analysts, and municipal budget committees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Interactive City Maps (Spans 2 cols) */}
          <div className="md:col-span-2 bg-[#0a1128] rounded-xl border border-slate-800 p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">01. Dual-Mode Spatial Visualization</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Seamlessly toggle between a topological schematic map and a high-resolution Google Maps Real-City geospatial interface. Place real-world candidate interventions across actual municipal roads, observe bottleneck heatmaps, and hand off candidates directly into scenario calculations.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center gap-6 text-xs text-slate-400">
              <span>Google Maps JavaScript API</span>
              <span aria-hidden="true">·</span>
              <span>Geocoded Corridor Preselection</span>
              <span aria-hidden="true">·</span>
              <span>Interactive Traffic Overlays</span>
            </div>
          </div>

          {/* Card 2: AI-Assisted Planning */}
          <div className="bg-[#0a1128] rounded-xl border border-slate-800 p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">02. Planning Goal Assistant</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Formulate goals in plain English. Powered by Gemini with structured JSON schemas, the assistant maps planning briefs into concrete, valid municipal policies with fiscal budget compliance.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-800/80 text-xs text-slate-400">
              Zero invented numerical outcomes · Strict schema validation
            </div>
          </div>

          {/* Card 3: Deterministic Simulation Engine */}
          <div className="bg-[#0a1128] rounded-xl border border-slate-800 p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">03. Deterministic BPR Engine</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Built on the classical Bureau of Public Roads (BPR) volume-delay model. Identical inputs yield identical results down to the microsecond, backed by continuous programmatic assertions.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-800/80 text-xs text-slate-400">
              13 Verified Mathematical Invariants · Zero Hallucination
            </div>
          </div>

          {/* Card 4: Emissions & Congestion Audits */}
          <div className="bg-[#0a1128] rounded-xl border border-slate-800 p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">04. Congestion & Carbon Auditing</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Quantify modal split shifts from private motorized travel to electric bus transit and active walking corridors. Compute estimated daily CO₂ reductions and peak hour travel time savings.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-800/80 text-xs text-slate-400">
              Multi-modal emission coefficients · Emergency access metrics
            </div>
          </div>

          {/* Card 5: Scenario Repository & Cloud Persistence */}
          <div className="bg-[#0a1128] rounded-xl border border-slate-800 p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">05. Supabase PostgreSQL Storage</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Persist scenarios, intervention matrices, and candidate GIS sites across sessions. Integrated with secure Supabase Auth and Row-Level Security with zero-data-loss local fallback.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-800/80 text-xs text-slate-400">
              JSONB Scenarios · RLS Protected · Exportable JSON
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 md:py-24 bg-[#091024] border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="mb-14 text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Workflow</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Four Steps From Problem to Policy Plan
            </h2>
            <p className="text-sm text-slate-300">
              A disciplined, reproducible workflow for municipal teams.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#060b19] rounded-xl border border-slate-800 p-6 space-y-3">
              <div className="text-teal-400 font-mono font-bold text-xl">01</div>
              <h4 className="font-semibold text-white text-base">Select Location & Baseline</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review unmanaged traffic flows, baseline bottleneck corridors, and default commuter travel times across the municipal network.
              </p>
            </div>

            <div className="bg-[#060b19] rounded-xl border border-slate-800 p-6 space-y-3">
              <div className="text-teal-400 font-mono font-bold text-xl">02</div>
              <h4 className="font-semibold text-white text-base">Configure Interventions</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adjust adaptive signal synchronization, designate bus-only transit corridors, and expand green walkways while adhering to budget caps.
              </p>
            </div>

            <div className="bg-[#060b19] rounded-xl border border-slate-800 p-6 space-y-3">
              <div className="text-teal-400 font-mono font-bold text-xl">03</div>
              <h4 className="font-semibold text-white text-base">Simulate Outcomes</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Execute the deterministic simulation engine to compute volume-to-capacity ratios, emergency access times, and daily carbon emissions.
              </p>
            </div>

            <div className="bg-[#060b19] rounded-xl border border-slate-800 p-6 space-y-3">
              <div className="text-teal-400 font-mono font-bold text-xl">04</div>
              <h4 className="font-semibold text-white text-base">Audit & Compare Plans</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluate multiple plans side by side in the plan audit matrix, verify fiscal constraints, and export executive reports for council review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. METHODOLOGY & TECHNICAL RIGOR */}
      <section id="methodology" className="py-20 md:py-24 max-w-6xl mx-auto px-6 sm:px-10 border-b border-slate-800/80">
        <div className="bg-[#0a1128] rounded-xl border border-slate-800 p-8 sm:p-10">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Methodology & Mathematical Rigor</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Grounded in Classical Transport Engineering
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Unlike black-box simulations or probabilistic guesses, CityTwin calculates link travel times using the Bureau of Public Roads (BPR) volume-delay formulation:
            </p>
            <div className="p-4 bg-[#060b19] rounded-lg border border-slate-800 font-mono text-xs sm:text-sm text-teal-300">
              t = t₀ × [ 1 + α × (V / C)^β ]
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              where t₀ represents free-flow travel time, V is effective vehicular volume, C is dynamic segment capacity, and α = 0.15, β = 4.0 represent calibrated highway parameters. Adaptive signal optimization lowers bottleneck node impedance, transit priority diverts private passenger car equivalents, and green walkways stimulate non-motorized shifts.
            </p>
          </div>
        </div>
      </section>

      {/* 7. CLOSING CTA & FOOTER */}
      <section className="py-20 md:py-24 bg-[#070c1e] text-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight" style={{ textWrap: 'balance' }}>
            Empower Your Transport Planning Team Today
          </h2>
          <p className="text-base text-slate-300 max-w-xl mx-auto">
            Test policy interventions safely in a digital twin before spending public infrastructure funds.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="px-6 py-3.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-lg hover:shadow-teal-500/20 transition-all flex items-center gap-2"
            >
              <span>{user ? 'Open Simulator' : 'Create Account & Access Simulator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Clean Quiet Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#050916] py-10 px-6 sm:px-10 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-200">CityTwin</span>
            <span aria-hidden="true">·</span>
            <span>Municipal Urban Planning Digital Twin</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => scrollToSection('features')} className="hover:text-slate-200 transition-colors">
              Features
            </button>
            <button onClick={() => scrollToSection('preview')} className="hover:text-slate-200 transition-colors">
              Simulator
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-slate-200 transition-colors">
              Workflow
            </button>
            <button onClick={() => scrollToSection('methodology')} className="hover:text-slate-200 transition-colors">
              BPR Math
            </button>
          </div>

          <div className="text-slate-400">
            © 2026 CityTwin · Built for Municipal Planners
          </div>
        </div>
      </footer>
    </div>
  );
};
