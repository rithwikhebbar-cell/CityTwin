# CityTwin — AI-Powered Urban Planning Simulator

An interactive, deterministic urban simulation platform designed for urban planners, policy analysts, and hackathon demonstrations to test infrastructure interventions, calculate multi-variable impact (traffic latency, congestion, emissions, and budget), and compare alternative scenarios against empirical baselines.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters were confirmed during clarification and will govern the simulation interface:

- **Map Rendering Architecture**: Interactive SVG vector grid featuring animated congestion pulse vectors, clickable intersection nodes (Hospital Junction, College Road, Market Square, Residential District), directional road corridor flows, and live inspection tooltips.
- **Default Featured Scenario Preset**: **Hospital Junction Emergency Corridor Relief** (tackling the acute bottle-neck around Hospital Junction and College Road via coordinated signal timing and dedicated transit corridor within ₹10–₹15 Lakh).
- **Currency & Budget Standard**: **Indian Rupee Lakhs (₹ Lakh)** with fractional precision (e.g., ₹10.0 Lakh budget, ₹4.2 Lakh intervention expenditure, ₹5.8 Lakh remaining).

---

## 1. Overview & Core Concept

### What It Does
CityTwin simulates the systemic impacts of urban planning decisions across a connected network of arterial roads, junctions, and civic zones. Users adjust policy levers—such as adaptive signal timing, dedicated bus-priority corridors, micro-mobility pedestrian routes, and urban greening—and immediately evaluate how these interventions alter:
1. **Average Travel Time** (minutes per cross-town corridor commute).
2. **Congestion Index** (0–100 scale based on standard volume-to-capacity ratios).
3. **Estimated Emissions Index** (kg $\text{CO}_2\text{e}$ per peak-hour window).
4. **Intervention Budget & Fiscal Efficiency** (total capital expenditure, operational maintenance, and cost-per-minute saved).

### Target Audience & Persona
- **Municipal Urban Planners & Transport Engineers**: Evaluating pilot projects before capital allocation.
- **Civic Hackathon Judges & Stakeholders**: Exploring cause-and-effect relationships in a responsive digital twin.
- **City Council / Policy Analysts**: Communicating trade-offs between rapid transit expansion, active mobility, and fiscal discipline.

### Key Value
Eliminates opaque "black box" claims through a transparent, reproducible, deterministic calculation engine that exposes exact mathematical assumptions (Bureau of Public Roads volume-delay functions, modal split shifts, and fleet emission factors) without requiring complex backend servers or external API keys.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Dashboard Overview**: The user enters CityTwin and reviews aggregate citywide health indicators, active baseline metrics, the live city network state, and quick-load scenario presets.
2. **Interactive City Map**: The user inspects the city network—Hospital Junction (critical medical access hub), College Road (commuter artery), Market Square (high-density commercial center), and Residential District (origin zone). Selecting any road segment reveals volume, capacity, speed, and emission rates.
3. **Scenario Lab**: The user selects interventions (Adaptive Signal Control, Bus-Priority Transit Corridor, Walking Routes & Urban Green Buffers), adjusts parameter sliders (budget cap, implementation intensity, compliance), and triggers deterministic recalculation.
4. **Plan Comparison**: The user opens the side-by-side comparison view to inspect baseline vs. proposed changes, delta metric tiles with percentage variances, cross-district radar/bar comparisons, and an audit ledger of mathematical modeling assumptions.
5. **Saved Scenarios & Export**: The user saves custom configurations into local memory, compares multiple iterations, or loads alternative presets.
6. **Initial Planning Assistant Interface**: The user enters targeted natural-language planning goals (e.g., *"Reduce congestion around Hospital Junction within ₹10 Lakh"*). The interface parses target variables and guides the user toward matching scenario configurations with pre-configured filters.

### Visual Identity & Theme
- **Dominant Neutral Canvas (60%)**: Deep dark navy (`#0B132B` canvas background, `#111D3E` card surfaces, `#1C2B54` subtle borders).
- **Structural Surfaces (30%)**: Slate and indigo container boundaries (`#1E293B`, `#243356`) with clean hairline dividers (`1px solid rgba(255,255,255,0.08)`). Zero nested card clutter.
- **Accent Budget (10%)**:
  - *Primary Action & Focus*: Vibrant Teal (`#14B8A6`) and Electric Cyan (`#06B6D4`).
  - *Congestion Levels*:
    - **Free Flow (0–39)**: Emerald (`#10B981`) with `● Low` indicator.
    - **Moderate Flow (40–69)**: Amber (`#F59E0B`) with `▲ Moderate` indicator.
    - **Severe Gridlock (70–100)**: Coral Red (`#EF4444`) with `■ Critical` indicator.
  - *Public Transit / Bus Corridor*: Cobalt Blue (`#3B82F6`).
  - *Active Mobility / Green Space*: Jade Green (`#059669`).
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` (font weight 600/700, tight tracking, balanced line wrapping).
  - Body & Labels: `DM Sans` / `Plus Jakarta Sans` (font weight 400/500, 14px–16px).
  - Metrics & Tabular Data: Monospace tabular numerals (`font-mono tabular-nums`) for jitter-free counters, currency sums, and coordinates.
- **Top Bar Contract**:
  - Zone 1: `CityTwin` wordmark with subtle civic geometry glyph.
  - Zone 2: Navigation tabs (`Dashboard`, `City Map`, `Scenario Lab`, `Compare Plans`, `Saved Scenarios`, `Settings`).
  - Zone 3: Single primary action (`New Scenario` / `Export Plan Report`).

---

## 3. Key Product Decisions & Trade-Offs

### 1. Deterministic Calculation Engine (BPR Urban Formula)
- **Chosen Approach**: Implemented as pure, side-effect-free TypeScript functions in `src/simulation/engine.ts`. Uses the standard Bureau of Public Roads (BPR) link-performance formula:
  $$T = T_0 \cdot \left(1 + \alpha \cdot \left(\frac{V}{C}\right)^\beta\right)$$
  where $T_0$ is free-flow travel time, $V$ is traffic volume, $C$ is road capacity, $\alpha = 0.15$, and $\beta = 4.0$. Interventions directly modulate parameters (e.g., adaptive signals boost effective junction capacity $C$ by $18\%$; bus-priority corridor reduces private vehicle volume $V$ by shifting $15\%$ of passenger demand to high-occupancy transit while allocating $1$ lane).
- **Why**: Delivers instant, mathematically sound, 100% reproducible results with no network latency or model hallucinations.
- **Alternatives Considered**: Opaque rule-based approximations (insufficient for urban planning hackathons) or heavy WebAssembly simulation engines (unnecessary bundle weight and complexity).

### 2. Interactive SVG Map vs Canvas Particle System
- **Chosen Approach**: Scalable, high-density SVG vector map featuring crisp bezier road ribbons, animated dashed transit pulses, clickable junction hubs, district polygons, and vehicle density particle animations.
- **Why**: SVG provides native DOM accessibility, crisp vector scaling across retina displays, precise mouse events for hover/click inspections, and zero memory leaks.

### 3. Transparent Modeling Assumptions & Boundary Conditions
- **Chosen Approach**: The simulation explicitly exposes every constant, unit, and formula in an "Assumptions & Formulas" inspection modal and comparison ledger. Clear disclaimers communicate synthetic calibration.
- **Why**: Builds user trust and demonstrates engineering rigor for hackathon evaluation.

### 4. Planning Goal Assistant Interface
- **Chosen Approach**: Dedicated conversational goal formulation card with structured parameter extraction preview (Target Node: Hospital Junction, Budget Ceiling: ₹10.0 Lakh, Objective: Congestion Minimization). Clear state indicators acknowledge the assistant is ready for future LLM integration while offering one-click goal matching to lab configurations.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CityTwin Web Application                       │
├────────────────────────────────┬───────────────────────────────────────┤
│ Top Bar Navigation & Actions   │ Active Scenario Context & Budget State│
├────────────────────────────────┴───────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────┐     ┌───────────────────────────────────┐ │
│  │     Interactive Map     │     │           Scenario Lab            │ │
│  │  • Hospital Junction    │     │  • Adaptive Signal Timings        │ │
│  │  • College Road Corrid. │     │  • Bus Priority Transit Lanes     │ │
│  │  • Market Square Hub    │ ◄───┤  • Pedestrian & Urban Greening    │ │
│  │  • Residential District │     │  • Capital Budget Allocation (₹)  │ │
│  │  • Road Capacity Vectors│     │  • Policy Intensity Controls      │ │
│  └────────────┬────────────┘     └─────────────────┬─────────────────┘ │
│               │                                    │                   │
│               ▼                                    ▼                   │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                Deterministic Simulation Engine                    │ │
│  │  • BPR Volume-Delay Travel Time Function: T = T0 * (1 + a*(V/C)^b)│ │
│  │  • Modal Shift Dynamics (Transit / Active Mobility Conversion)     │ │
│  │  • Tiered Emissions Calculation (kg CO2e / Peak Period)           │ │
│  │  • Budget Consumption & Fiscal Feasibility Verification           │ │
│  └──────────────────────────────────┬────────────────────────────────┘ │
│                                     │                                  │
│                                     ▼                                  │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     Comparison & Metrics Grid                     │ │
│  │  • Baseline vs. Proposed Scenario Variance (Δ Travel Time, Δ CO2) │ │
│  │  • SVG Comparative Bar & Radar Visualizations                     │ │
│  │  • Segment-by-Segment Bottleneck Diagnostic Breakdown             │ │
│  │  • Natural Language Planning Goal Parser & Pre-fill               │ │
│  └──────────────────────────────────└───┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Models (`src/types/simulation.ts`)

- `CityNode`: Identified intersection/district with name, geographic coordinates $(x, y)$, zone type (`healthcare`, `education`, `commercial`, `residential`), and baseline delay.
- `RoadSegment`: Directed edge connecting two nodes, with length (km), lanes, free-flow speed (km/h), baseline volume (vehicles/hour), baseline capacity, and surface classification.
- `InterventionConfig`:
  - `adaptiveSignals`: Boolean switch, target nodes (`hospital_junction`, `market_square`, etc.), budget cost (₹ Lakhs).
  - `busPriorityCorridor`: Boolean switch, target roads (`college_road_main`, `market_connector`), dedicated lane allocation, budget cost.
  - `greenWalkways`: Boolean switch, active mobility kilometer allocation, urban tree canopy index, budget cost.
  - `budgetCap`: Maximum permissible expenditure in ₹ Lakhs.
- `SimulationResult`:
  - `totalTravelTimeMinutes`: Average cross-city peak commute time.
  - `citywideCongestionIndex`: 0–100 weighted network score.
  - `totalEmissionsKgCO2`: Estimated peak-period emissions.
  - `totalCostLakhs`: Sum of active intervention capital expenses.
  - `segmentResults`: Per-segment travel time, congestion level (`low`, `moderate`, `critical`), and vehicle throughput.
  - `isOverBudget`: Boolean validation flag.
- `Scenario`: Named collection with ID, name, description, intervention settings, simulation results, and timestamp.

---

## 5. Verification & Test Plan

1. **Unit Testing Simulation Logic**: Verify BPR formulas and modal shift math with automated TypeScript assertions:
   - Identical inputs must yield identical decimal outputs.
   - Enabling adaptive signal control on Hospital Junction must lower travel delay and raise corridor capacity by $18\%$.
   - Exceeding ₹10 Lakh budget cap must correctly trigger `isOverBudget: true`.
2. **Interactive Map Verification**: Verify all 4 primary hubs and connecting roads render clearly, respond to mouse clicks, display hover tooltips with accurate metrics, and reflect color shifts according to simulation outputs.
3. **Scenario Controls & Comparison Verification**: Toggling any intervention must re-evaluate the model in real time ($<10\text{ms}$), update the metric cards, and show clean difference deltas on the comparison tab.
4. **Build Verification**: Run `compile_applet` and `lint_applet` to confirm zero compilation warnings or type errors.
