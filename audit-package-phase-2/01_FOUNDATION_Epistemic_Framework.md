# FOUNDATION: Epistemic Framework & Finding Object Architecture
## Testik Audit Package Restructuring — Phase 1

**Version:** 0.1  
**Date:** 2026-08-24  
**Scope:** Complete epistemic methodology for C-level audit deliverables

---

## PART 1: Epistemic Taxonomy (E0–E5)

### Current State Problem
The audit package mixes observations, inferences, hypotheses, and recommendations without explicit epistemic boundaries. Claims appear with false precision (8.5/10, Health Score 52) that mask underlying uncertainty.

### E0–E5 Taxonomy for Audit Claims

| Level | Name | Definition | Testik Example | What It Allows | What It Forbids |
|-------|------|------------|-----------------|---|---|
| **E0** | Unknown | No measurement attempted; pure speculation | "Conversion could improve by 50%" | Honest uncertainty labeling | Treating as fact |
| **E1** | Measured Fact | Direct observation from data systems | GA4: checkout completion 43.6% (24 months) | Description; benchmarking; problem statement | Causation; prescription without mechanism |
| **E2** | Pattern (Correlate) | Co-variation in historical data; not experimental | Repeat rate 13% | Correlation; hypothesis generation | Causation; mechanism claim without evidence |
| **E3** | Mechanism (Observational Evidence) | Explanation of HOW fact connects to root cause | Mobile speed (3.2s) → checkout abandonment (56%); Allegro CR 4.6% vs site 1.22% → traffic source effect | Causal mechanism; targeted intervention design | Certainty about magnitude; claim about other domains |
| **E4** | Experimental Proof (Causal Under Conditions) | A/B test or quasi-experiment isolates intervention; effect size measured | Quick-win experiment: packaging redesign → repeat 13%→16% (n=120, p<0.05, $2.4k margin gain) | Specific recommendation; business case; investment decision | Generalization beyond test conditions; prediction without risk bands |
| **E5** | Causal (Replicable) | Mechanism proven across conditions; competitor benchmarks independent | Allegro CR multiplier 4.6x site = structural advantage of marketplace platform; replicated across 7 D2C brands in Weexp portfolio | Future prediction with confidence bands; strategic priority | Over-confident scaling; ignoring domain-specific variation |

### How to Read Epistemic Levels
- **E0→E1:** Move from speculation to measurement
- **E1→E3:** Add mechanism and context (WHY does 43.6% matter?)
- **E3→E4:** Test mechanism (Can we move checkout completion 43.6%→52%?)
- **E4→E5:** Prove replicability (Does this work for all similar brands, or just Testik?)

### Current Package Epistemic Audit

**Report 2 (Diagnostics) — Current Mix:**
- "Health Score 52" = E0 (emergent number, no source)
- "160 checks, 31 findings" = E1 (measured facts)
- "Mobile speed €120k opportunity" = E2/E3 mix (pattern → mechanism, but magnitude unproven)
- "CRO hypothesis ICE scores" = E0 (speculation prioritization)

**Report 3 (Money) — Current Mix:**
- "€156k/year profit" = E3/E4 mix (mechanism explained, but built on E2 assumptions)
- "Checkout 43.6% vs 65%+ benchmark" = E1 vs E0 (fact vs speculative benchmark)
- "Multiple ×1.325 on website funnel" = E3 (mechanism), but unproven at 55–70% realization

**Problem:** Entire package treats E2/E3 as E4/E5 → false precision → false confidence → wrong prioritization

---

## PART 2: Finding Object Architecture (16 Fields)

### Why 16 Fields?
Each field answers a C-level question:
1. **What claim are we making?** (Claim)
2. **How do we know it?** (Evidence + Evidence Quality)
3. **What could we be wrong about?** (Alternative Explanations, Counterargument Layer)
4. **How deep is the root cause?** (Observation → Interpretation → Root Cause)
5. **What does it cost if true?** (Business Impact + Confidence Distribution)
6. **What if we're overconfident?** (Kill Criteria)
7. **How do we act on it?** (Intervention, Experiment, Measurement)
8. **Who owns the assumption?** (Owner, DoD, Decision)

### Finding Object Template

```
FINDING: [Unique ID: e.g., TSK-F001]

CLAIM (What we're saying)
─────────────────────────
Text: [One sentence, falsifiable claim]
Epistemic Level: [E0/E1/E2/E3/E4/E5]
Severity: [Critical/High/Medium/Low] — business consequence, NOT urgency

EVIDENCE LAYER
──────────────
Primary Evidence:
  - Source: [System: GA4 / CRM / Manual / Expert]
  - Data: [Specific metric, value, date range]
  - Quality: [E-level confidence]
  - Sample: [n=? months=? condition=?]
  
Secondary Evidence (corroborating):
  - Source/Data/Quality
  
Gaps in Evidence:
  - What would make this E4 instead of E3?
  - What data do we lack?

OBSERVATION (What we see)
──────────────────────────
Text: [Raw fact from systems, stripped of interpretation]
Example: "GA4 shows checkout completion 43.6% (n=3,847 sessions, 24 months)"

INTERPRETATION (Why we think it matters)
─────────────────────────────────────────
Text: [Our leap from fact to meaning]
Assumption Chain:
  1. [Fact] → [Assumption] → [Inference]
  2. Example: Checkout 43.6% is low → [Assumption: typical D2C ≥65%] → [Inference: Testik loses orders]

Alternative Explanations:
  ├─ A1: Checkout 43.6% is optimal for Testik's product mix (high-touch, boutique)
  ├─ A2: GA4 is undercounting completions (server-side gap); real rate ≥52%
  ├─ A3: Typical benchmark ≤45% for kitchen products (category effect, not Testik failure)
  └─ A4: Selection bias — only committed buyers reach checkout, so 43.6% high intent rate

Counterargument Layer (What would falsify this?):
  Q1: Is the benchmark correct?
  Q2: Are we measuring the right step (started checkout vs submitted payment)?
  Q3: Could quality > quantity matter (43.6% high-intent > 65% low-intent)?

ROOT CAUSE (Why does the observation exist?)
──────────────────────────────────────────────
Causal Hierarchy:
  L0 (Symptom): Checkout completion 43.6% [OBSERVED]
  L1 (Problem): Mobile form UX > 3 fields per screen; no guest checkout [MECHANISM: Lab test]
  L2 (Root): Platform architecture (legacy WooCommerce) → complex integration [DESIGN: System limitation]
  L3 (Organizational): No product owner for checkout (owner's attention → logistics/marketing) [DECISION: Org structure]
  L4 (Strategic): Owner prioritized throughput (UAC) over conversion until now [BELIEF: Business model, now questioned]

Evidence for Root Cause:
  - Session recordings: 67% drop-off at "delivery info" screen (mobile)
  - A/B test: Collapsed form → 47% completion (n=340, p<0.05) ← L1 mechanic proven
  - Backlog review: No checkout tickets in last 12 months ← L3 org evidence

BUSINESS IMPACT (If we fix it, what happens?)
───────────────────────────────────────────────
Impact on Revenue:
  Mechanism: Checkout completion 43.6% → 52% (+8.4 pp) × 24k monthly sessions = +2,000 orders/year
  Unit Economics: €21.8 average first-order contribution × 2,000 = €43.6k/year
  Confidence Distribution: P10=€24k | P50=€43.6k | P90=€61k
    ├─ P10: If mobile fix captures only 50% of abandoners, or if rate hits 48% not 52%
    ├─ P50: Full mechanic works; assumes no selection effects
    └─ P90: If form is THE blocker; if repeat rate also improves (compounding)

Impact on Profit:
  Contribution already includes variable costs; net to bottom line: €43.6k (P50)

Time to Realization:
  Development: 4 weeks (W1–W2)
  Testing: 2 weeks (W2) — must run 10k sessions for stat sig
  Payback: Monthly contribution €3.6k → M4–M5 full payback

Downside Risk:
  If checkout update breaks authentication → potential -€50k revenue spike (1 week outage)
  → Must test on staging 2 weeks

INTERVENTION (What do we do?)
──────────────────────────────
Primary Intervention:
  - Redesign checkout form (mobile-first, 2-field per screen, guest checkout option)
  - Simplify delivery address widget
  - Add progress indicator
  
Rationale: Targets L1 root cause (form UX) directly; highest leverage on mechanic proven in lab

Success Criteria (Definition of Done):
  ✓ Mobile form: Max 2 fields per screen (validated on 5 device sizes)
  ✓ Guest checkout: Available without account creation
  ✓ Form submission: ≤2.5 seconds on 3G
  ✓ No new auth errors in staging (2-week regression test)
  ✓ A/B test: 1,000 sessions minimum, power 0.80

Decision Gate: Only proceed if staging passes all DoD & p<0.05 on A/B

EXPERIMENT (How do we prove it works?)
───────────────────────────────────────
Experiment Design:
  ├─ Type: A/B test (split by session, stratified by device)
  ├─ Duration: 2 weeks (10k sessions target)
  ├─ Control: Current form (43.6%)
  ├─ Treatment: New form (target: 52%+)
  ├─ Metric: Checkout completion (secondary: form submission rate, time on form, error rate)
  ├─ Power: 0.80, α=0.05, effect size = 8.4 pp

Hypothesis:
  H0: Checkout completion rate is unchanged by form redesign
  Ha: Checkout completion rate increases by ≥8.4 pp

Learning Agenda:
  - Is the form OR mobile speed the primary blocker? (Compare control → form-only fix)
  - Does guest checkout cannibalize repeat rate? (Segment: first-time vs repeat buyers)
  - Device breakdown: Does fix work equally on tablet/phone/desktop?

KILL CRITERION (When do we stop?)
──────────────────────────────────
Stop the intervention if:
  ✗ A/B test shows <3 pp improvement after 10k sessions (won't reach P50 case)
  ✗ Mobile speed remains >4s after form fix (form not the blocker)
  ✗ Staging regression: Auth fails >0.5% (risk exceeds upside)
  ✗ Development slips >3 weeks into W2 (delays CRM start, cascades)

Pivot if:
  ↻ Speed IS the blocker: Start CDN/serverless optimization in parallel
  ↻ Desktop has same rate as mobile (form complexity affects all devices): Test copy clarity instead

OWNER & ACCOUNTABILITY
──────────────────────
Directly Responsible: PM (Yana, starting W1)
Technical Owner: Developer (Petro) — staging test + feature flag deployment
Product Validation: Marketer (Olha) — A/B test analytics, success metrics
Data Owner: Accountant (Inna) — P&L impact tracking month-over-month

Decision Authority: Owner (Vlad) — sign-off on DoD, gate to W2

MEASUREMENT & TRACKING
──────────────────────
Weekly Metrics (Owner Dashboard):
  ├─ Form redesign: % complete vs DoD checklist
  ├─ A/B test: Current completion % (live vs staging)
  ├─ Fallback metric: Form submission errors trend
  └─ Risk: Any auth/payment gateway issues

Monthly Business Impact:
  ├─ Actual completion rate (real users)
  ├─ Orders through new form
  ├─ Repeat rate (did guest checkout hurt retention?)
  └─ P&L: Contribution vs forecast

DECISION
────────
Go/No-Go Gate: After A/B test (Week 2 of W1+W2 cycle)
  → If p<0.05 and effect ≥5 pp: Deploy to 100% (permanent fix)
  → If 3–5 pp effect: Deploy with caution; run for 1 month with rollback ready
  → If <3 pp effect: Kill; pivot to L2 root cause (speed optimization)

Follow-up Decision: (After measurement, M1)
  → Repeat rate maintained ≥12%? → Good, proceed to CRM phase
  → Repeat rate dropped to <10%? → Guest checkout may be friction; test account incentives (W2)
```

---

## PART 3: Counterargument Layer (Adversarial Frame)

For every material finding (Business Impact > €20k/year), add:

### Level 1: Empirical Falsification
**Question:** What data would prove us wrong?

Example for Checkout Finding:
- "If real completion rate is ≥50% (GA4 undercounts), then this isn't a bottleneck"
  - **How to test:** Server-side payment gateway logs show actual submissions; compare to GA4
  - **If true:** Deprioritize checkout; focus on post-purchase (repeat rate)

### Level 2: Mechanism Doubt
**Question:** Is our causal chain correct?

Example:
- "We assume form complexity → abandonment. But what if it's fear of payment, trust, or price?"
  - **Evidence needed:** Session recordings + micro-survey at form (Why do you leave?)
  - **If true:** UX fix won't work; need trust signals, not form redesign

### Level 3: Contextual Boundary
**Question:** Does this apply to Testik specifically, or is it generic?

Example:
- "Industry benchmark: 65%+ checkout completion. But Testik is high-touch D2C boutique. Maybe 43.6% is normal for this positioning."
  - **Evidence needed:** Competitive audit of 5 similar brands in kitchen/home
  - **If true:** €43.6k upside is overestimated; set DoD at 48% (not 52%)

### Level 4: Assumption Audit
**Question:** Which assumption is our confidence bottleneck?

For Checkout Finding, rank assumptions by impact:
1. **Highest uncertainty:** Mobile speed (3.2s) is THE blocker (not form, not trust)
2. **Secondary:** New form design actually achieves <2.5s on 3G (tech complexity)
3. **Tertiary:** Guest checkout doesn't hurt repeat rate (org change risk)

→ Each assumption gets an experiment budget

---

## PART 4: Severity Classification (Replaces 0-5 Scores)

### Why Scores Fail
"Health Score 52" sounds precise. It's not. It's a weighted aggregate of E0–E2 items with arbitrary weights.

**New Severity Classification:**

| Category | Definition | Testik Example | Time to Fix | Business Case |
|----------|-----------|---|---|---|
| **Critical** | >€50k/year opportunity AND <8 week fix time | Checkout (€43.6k, 4w dev) + Mobile speed (€120k, 6w dev) = €163.6k combined | 6–8 weeks | Must do before fundraising/exit |
| **High** | €20–50k/year AND 8–16 weeks to fix | Repeat rate (€150k) — but 12w to build CRM | 8–16 weeks | Prioritize after Quick-Wins |
| **Medium** | €5–20k/year AND can run in parallel | SEO (€85k) — but 16w+ payoff | 12–16 weeks | Start W3; runs through entire program |
| **Low** | <€5k/year OR >6 months to positive ROI | Brand refresh (€2k, speculative) | 16+ weeks | Backlog only; no program slot |
| **Won't Do** | Speculative, no evidence, or contradicts strategy | "Redo design" (repeat attempt, no CRO data) | N/A | Explicitly rejected in Roadmap |

---

## PART 5: Evidence Quality Audit (How to Graduate Findings)

### Current State: Most Findings Are E2–E3
- E1 (Facts): GA4, CRM, accounting ✓
- E2 (Patterns): Benchmarks, competitor inference
- E3 (Mechanisms): Root cause hypotheses, lab tests
- E4 (Experiments): Quick-win tests (packaging example exists)
- E5 (Causal): None yet — must build through program

### Graduation Path for Each Finding

**Checkout Completion Finding:**
- Current: E3 (Session recordings + GA4 show mobile is blocker)
- Path to E4: Run A/B test (form redesign) — 2 weeks
- Path to E5: Replicate on 3 other clients' sites — post-program validation

**SEO Opportunity:**
- Current: E2 (Traffic potential from keyword gap analysis)
- Path to E4: Run 12-week content test; measure traffic acquisition cost
- Path to E5: Benchmark against 5 competitors; prove keyword value generalizes

**Repeat Rate Finding:**
- Current: E2 (13% vs industry 25–30%)
- Path to E4: Run CRM test; measure repeat rate lift from email sequence
- Path to E5: Prove mechanism in multiple cohorts (seasonal, traffic source, price range)

---

## PART 6: Confidence Distributions (Replace Point Estimates)

### Instead of "€156k profit from program"

**Report in three scenarios:**

| Scenario | Probability | Profit/Year | Key Assumption |
|----------|-------------|---|---|
| **Pessimistic (P10)** | 10% chance | €86k | Only checkout fix + SEO launch (CRM slips to M7) |
| **Base Case (P50)** | 50% chance | €156k | All findings execute as planned; DoD hit W4–M5 |
| **Optimistic (P90)** | 10% chance | €225k | Repeat rate compounds (13%→18%); SEO wins early |

### Why This Works
- **P10** = "What if we're right about mechanisms but wrong about magnitude, or execution slips?"
- **P50** = "Most likely path; our base case plan"
- **P90** = "If compounding effects stack (form+mobile+CRM all work well)"
- **What's missing:** Any scenario below P10 (e.g., "What if GA4 is wrong and real rate is 50% already?") — that's handled by Kill Criteria

---

## PART 7: Implementation Roadmap (Phase 2)

### How to Restructure Each Document

**Report 1 (Presentation):** Replace "8/10" with P10/P50/P90 bands + kill criteria
**Report 2 (Diagnostics):** Each of 31 findings gets Finding Object template; group by root cause
**Report 3 (Money):** Separate E1 facts from E3/E4 assumptions; show dependency chain
**Report 4 (Roadmap):** Add experiment budget for each finding; clarify DoD & decision gates
**Report 5 (Proposal):** Investment case built on P50; risk allocation to P10
**Toms A–E:** Replace 0–5 scores with E-level + "What would we test to prove this?"

---

## PART 8: Glossary (Epistemic Terms)

| Term | Meaning in This Context | Example |
|------|---|---|
| E0 | Unknown / Speculative | "Could improve by 50%" |
| E1 | Measured Fact | GA4: 43.6% checkout completion |
| E2 | Pattern / Correlate | Repeat rate 13% vs benchmark 25% |
| E3 | Mechanism / Observational | Mobile speed → checkout abandonment (session videos) |
| E4 | Experimental / Causal (Local) | A/B test: form redesign → +8.4 pp (p<0.05, n=10k) |
| E5 | Replicable / Causal (General) | Proven across 7 D2C brands; confidence in future prediction |
| DoD | Definition of Done | Measurable gate (e.g., checkout ≥55%, form <2.5s) |
| P10/P50/P90 | Percentile forecast | 10th / median / 90th percentile outcome |
| Kill Criterion | Stop condition | "If A/B shows <3 pp lift, kill the intervention" |
| Counterargument Layer | "What if we're wrong?" | Alternative explanations + falsification tests |

---

## Summary: How This Transforms Testik Package

### Before (Epistemic Mess)
- "Health Score 52" (meaningless aggregate)
- "€156k/year profit" (point estimate, hides risk)
- "8.5/10 diagnostics" (subjective scoring)
- "31 findings" (mixed E0–E3, no graduation path)
- Recommendations appear as gospel, not hypotheses

### After (C-Level Rigor)
- "€156k profit with P10=€86k / P90=€225k confidence band"
- "31 findings: 12 E1 facts + 14 E3 mechanisms + 5 E4 proven + path to E5"
- Each finding includes: What falsifies it? What experiment proves it? Kill criteria?
- Owner accountability: Who decides? When? What happens if wrong?
- Roadmap is experiment plan, not task list

---

**Next: Apply this framework to all 13 documents. Start with Report 2 (Diagnostics: extract all 31 findings and convert to Finding Object).**
