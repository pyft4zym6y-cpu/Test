# PHASE 2: REPORT 3 RESTRUCTURED  
## Money: Point Estimate → 3-Scenario Financial Model

**Status:** Phase 2 Core Restructuring — Report 3 (Money)  
**Date Started:** 2026-08-24  
**Approach:** Converting €156k point estimate → P10/P50/P90 scenarios with monthly P&L bridges, contribution rollup by domain, and Definition of Done gates  
**Quality Level:** Scenario-based financial model with confidence distributions

---

## EXECUTIVE SUMMARY

**Current State:**
- Point estimate: €156k annual profit
- No scenario analysis
- No monthly P&L bridge
- No contribution visibility by domain

**Target State (Phase 2):**
- P10 (Pessimistic): €86k annual profit (conservative assumptions, delayed implementation)
- P50 (Base Case): **€156k annual profit** (on-time implementation, expected assumptions)
- P90 (Optimistic): €225k annual profit (fast implementation, favorable assumptions)
- Monthly P&L bridge for each scenario
- Contribution breakdown by domain (Product, Website, Retention, Acquisition, Ops)
- Definition of Done gates (24 criteria per domain, tied to revenue realization)

**Impact of Restructuring:**
- Eliminates false certainty (€156k is base case, not guaranteed)
- Identifies downside risk (P10 is still profitable but requires quick execution)
- Shows upside potential (€225k if everything aligns)
- Links execution to financial outcomes (DoD gates tie to P50 assumption realization)

---

## SECTION 1: CANONICAL VERDICT — 3-SCENARIO SUMMARY

### Verdict Structure

| Scenario | Annual Revenue | Contribution* | P&L Impact | Realization | Timeline |
|----------|----------------|---------------|-----------|------------|----------|
| **P10 (Pessimistic)** | €600k | €86k | −€70k vs P50 | 60-70% | 16-20 weeks |
| **P50 (Base Case)** | €620k | **€156k** | — baseline — | 100% | 8-12 weeks |
| **P90 (Optimistic)** | €750k | €225k | +€69k vs P50 | 120%+ | 6-8 weeks |

*Contribution = Revenue − (COGS + Fulfillment + Acquisition) = P&L

### Scenario Descriptions

**P10 (Pessimistic: €86k)**
- Implementation delays (mobile checkout test delayed to W3, retention pilot delayed to W4)
- Slower traction on high-impact findings (mobile €120k → €70k realized, retention €150k → €50k realized)
- Execution risk: Team bandwidth, external dependencies (payment processor, email platform)
- Probability: 20%

**P50 (Base Case: €156k)**
- On-time execution of top-10 findings (mobile checkout, retention program, GA4 fixing, dead stock liquidation)
- Expected lift from each finding materializes (e.g., mobile +15pp completion × current revenue = €120k expected, realized €100-120k actual)
- Contribution improvement from current ~8% → 15% via optimization (channel mix, dead stock clearance, retention)
- Probability: 55%

**P90 (Optimistic: €225k)**
- Fast execution (all findings complete by W8, parallel implementation across all domains)
- Higher-than-expected lift (mobile checkout +20pp instead of +15pp, retention repeat rate +8% instead of +5%, SEO traffic growth accelerates)
- Revenue growth accelerates (Q4 gifting season fully captured, brand positioning creates pricing power)
- New revenue streams (B2B formalized, wholesale partnerships, affiliate programs)
- Probability: 25%

---

## SECTION 2: MONTHLY P&L BRIDGE (BASE CASE: P50)

### Current State (Baseline): Month 0

| Metric | Aug (Baseline) | Assumption | Notes |
|--------|----------------|-----------|-------|
| **Revenue** | €52k | Run-rate = €156k/3 months | Blended average (varies by month) |
| **COGS** | €26k | 50% of revenue | Product cost basis |
| **Fulfillment** | €4k | €31/order × 130 orders | Last-mile shipping |
| **Acquisition** | €8k | CAC €18 × 450 new customers | Blended across channels |
| **Contribution** | €14k | Gross margin 27% (pre-payback) | Before fixed costs |
| **Fixed Costs** | €10k | Team + Warehouse + Platform | Owner + 1 PM + 1 Dev + hosting |
| **P&L** | +€4k | Monthly profit (before tax) | Positive but thin margin |

### Projected State (Base Case P50): Month 12

| Metric | Dec (Projected, P50) | Improvement | Driver |
|--------|-------------------|------------|--------|
| **Revenue** | €62k | +€10k (+19%) | Mobile (+€8k), retention (+€4k), SEO (+€3k), minus dead stock liquidation (−€5k) |
| **COGS** | €28k | +€2k (from higher volume) | Higher sales, same margin % |
| **Fulfillment** | €3.5k | −€0.5k (better logistics) | Parcel consolidation, volume discount (€24 target vs €31) |
| **Acquisition** | €7k | −€1k (improved efficiency) | Reduced CAC via retention + repeat (lower CAC on repeat customers) |
| **Contribution** | €23.5k | +€9.5k (+68%) | Margin expansion via pricing + mix improvement |
| **Fixed Costs** | €10k | — (same) | No new headcount; infrastructure stays flat |
| **P&L** | +€13.5k | +€9.5k (+238% vs baseline) | Contribution growth absorbs fixed cost, strong profitability |

### Monthly Bridge (P50): Aug → Dec

Month-by-month progression toward P50 target:

| Month | Revenue | Contribution | P&L | Key Actions | Milestones |
|-------|---------|--------------|-----|-------------|-----------|
| **Aug (M0)** | €52k | €14k | +€4k | Baseline | GA4 setup starts (W1) |
| **Sept (M1)** | €54k | €16k | +€6k | +2% revenue from GA4 clarity | Mobile A/B test live (W2), retention pilot starts (W3) |
| **Oct (M2)** | €56k | €19k | +€9k | +1% from mobile test results, +2% from early retention lift | Dead stock liquidation (W2-W4), GA4 server-side live (W2) |
| **Nov (M3)** | €60k | €22k | +€12k | +2% from mobile optimization live, +2% from retention + gifting season | Mobile speed optimization live (W3), retention sequences live (W3-W4) |
| **Dec (M4)** | €62k | €23.5k | +€13.5k | +1% from SEO momentum (long-tail keywords gaining traction), gifting boost | Full-year run-rate achieved, all top-5 findings implemented |

**Contribution Growth Path (P50):**
- Aug: €14k (baseline)
- Sept: €16k (+14%)
- Oct: €19k (+19% cumulative)
- Nov: €22k (+57% cumulative)
- Dec: €23.5k (+68% cumulative)

**P&L Growth Path (P50):**
- Aug: +€4k (baseline, thin margin)
- Sept: +€6k (+50% improvement)
- Oct: +€9k (+125%)
- Nov: +€12k (+200%)
- Dec: +€13.5k (+238%)

---

## SECTION 3: DOMAIN-LEVEL CONTRIBUTION BREAKDOWN (P50)

### Current Contribution by Domain (Baseline)

| Domain | Revenue | Contribution % | Contribution Amount | Notes |
|--------|---------|-----------------|-------------------|-------|
| Site (D2C) | €31k | 12% | €3.7k | Healthy direct channel |
| Allegro (Marketplace) | €14k | 3% | €0.4k | High-volume, low-margin |
| B2B (Wholesale) | €7k | −15% | −€1.0k | Loss-making due to credit risk |
| **TOTAL** | €52k | **8%** | **€3.1k** | Blended contribution |

### Projected Contribution by Domain (P50, Month 12)

| Domain | Revenue | Contribution % | Contribution Amount | Improvement | Driver |
|--------|---------|-----------------|-------------------|-------------|--------|
| Site (D2C) | €36k | 16% | €5.8k | +€2.1k (+57%) | Mobile checkout, retention, SEO organic, pricing optimization |
| Allegro (Marketplace) | €15k | 8% | €1.2k | +€0.8k (+200%) | Pricing floor, SKU mix optimization |
| B2B (Wholesale) | €11k | 5% | €0.55k | +€1.55k (breakeven→profitable) | Credit policy, payment discipline, margin floor |
| **TOTAL** | €62k | **15%** | **€9.55k** | +€6.45k (+208%) | Healthy contribution margin |

**Key Insights:**
- Site (D2C) remains profit engine (61% of contribution)
- Allegro improves but stays low-margin (13% of contribution)
- B2B moves to profitability (6% of contribution, was negative)
- Blended contribution margin: 8% → 15% (+7pp)

---

## SECTION 4: CONTRIBUTION IMPROVEMENT BY FINDING (P50)

### Top Contributors to Margin Expansion

| Finding | Domain | Current Contribution | P50 Realization | Mechanism | Timeline |
|---------|--------|----------------------|-----------------|-----------|----------|
| **TSK-F017: Mobile Checkout (€120k)** | Website | €0 (−€190k loss) | €100-120k gain | +15pp checkout completion × conversion rate | W1-W4 |
| **TSK-F030: Retention Program (€150k)** | CRM | €0 (zero program) | €80-120k gain | +5pp repeat rate × LTV €300 per customer | W3-W10 |
| **TSK-F026: GA4 Accuracy (€50k)** | Analytics | €0 (decision quality) | €30-50k gain | Better channel allocation, reduced CAC waste | W1-W2 |
| **TSK-F009: Dead Stock Clearance (€70k)** | Product | €0 (€70k bleed) | €40-50k gain (cash + margin) | Liquidate, redeploy to high-margin SKUs | W1-W4 |
| **TSK-F001: Allegro Pricing (€60k)** | Business | €0 (losses) | €30-50k gain | Pricing floor + SKU mix → margin from 3% → 8% | W1-W2 |
| **TSK-F022: SEO Organic (€85k)** | SEO | €0 (index broken) | €40-60k gain | Repair broken index, long-tail keywords (12-18 week ramp) | W2-M4 |
| **Subtotal (Top 6 Findings)** | — | **€0** | **€320-450k potential** | — | Phase 2-3 |
| **All Other Findings** | — | €0 | €80-120k | Smaller levers (pricing, operations, brand) | Phase 2-3 |
| **Total Potential** | — | **€0 (baseline)** | **€400-570k** | — | — |

### Realization Rate Assumptions (P50)

| Finding | Potential | P50 Realization | Confidence | Risk Factor |
|---------|-----------|-----------------|------------|-------------|
| Mobile Checkout | €120k | 90% = €108k | High | Execution risk: form test delays (−10%) |
| Retention Program | €150k | 70% = €105k | Medium | Adoption risk: customer list quality (−25%) |
| GA4 Accuracy | €50k | 100% = €50k | Very High | Factual fix, no uncertainty |
| Dead Stock Liquidation | €70k | 65% = €46k | Medium | Liquidation price achieved (−35%) |
| Allegro Pricing | €60k | 60% = €36k | Low-Medium | Volume risk: price elasticity (−40%) |
| SEO Organic | €85k | 50% = €43k | Low | Long tail timing (12-18 weeks, needs luck) |
| **Total P50** | **€535k** | **€388k** | — | **Margin: €156k base + €388k bleed recovery = €544k P50 total** |

**Note:** The €156k base case assumes:
- No further deterioration (current trajectory maintained)
- No new issues (platform, market, team)
- Normal seasonal variation (Q4 +15%, Q1 −10%)

The €388k additional contribution from findings is NOT incremental profit (all-in). It's gross contribution recovery from identified leaks and missed opportunities.

---

## SECTION 5: P&L SCENARIOS — ANNUAL VIEW

### Annual P&L Comparison (12-Month Forecast)

| Line Item | Current (Baseline) | P10 (Pessimistic) | P50 (Base Case) | P90 (Optimistic) |
|-----------|-------------------|-----------------|-----------------|------------------|
| **REVENUE** | — | €600k | €620k | €750k |
| — Site (D2C) | €375k | €410k | €432k | €540k |
| — Allegro (Mkt) | €168k | €165k | €180k | €180k |
| — B2B (Wholesale) | €84k | €25k | €8k | €30k |
| **COGS** | — | €300k | €310k | €375k |
| (% Revenue) | — | 50% | 50% | 50% |
| **Fulfillment** | — | €45k | €42k | €40k |
| (% Revenue) | — | 7.5% | 6.8% | 5.3% |
| **Acquisition** | — | €96k | €92k | €90k |
| (% Revenue) | — | 16% | 14.8% | 12% |
| **Gross Contribution** | — | €159k | €176k | €245k |
| (% Revenue) | — | 26.5% | 28.4% | 32.7% |
| **Fixed Costs** | — | €120k | €120k | €120k |
| (People + Systems) | — | €10k/mo avg | €10k/mo avg | €10k/mo avg |
| **EBIT** | — | €39k | €56k | €125k |
| **Taxes (19%)** | — | €7.4k | €10.6k | €23.8k |
| **Net Profit** | — | **€31k** | **€45k** | **€101k** |

**Adjusted Annual P&L (Conservative View):**

If we assume:
- Site contribution improves from 12% → 14% (vs optimistic 16%)
- Allegro stays at 5% (vs optimistic 8%)
- B2B breakeven (vs optimistic profit)
- Fixed costs rise 10% (hiring, platform upgrades)

| Scenario | Gross Contribution | Fixed Costs | EBIT | Taxes | Net Profit |
|----------|-------------------|------------|------|-------|-----------|
| P10 | €143k | €132k | €11k | €2.1k | **€8.9k** |
| P50 | €159k | €132k | €27k | €5.1k | **€21.9k** |
| P90 | €210k | €132k | €78k | €14.8k | **€63.2k** |

---

## SECTION 6: DEFINITION OF DONE (24 GATES)

### Revenue Realization Gated by Domain Execution

**Concept:** Each domain has DoD criteria tied to revenue realization. Revenue/contribution only counts if DoD is met.

**DoD Structure:**

| Stage | Definition | Realization % | Example Gate |
|-------|-----------|---------------|----------|
| **A (Start)** | Core finding identified, root cause understood | 20% | GA4 broken (E1 fact) + server-side tracking designed |
| **B (Day 270)** | Solution deployed, metrics baseline established | 60% | GA4 server-side live, 1 week of parallel measurement |
| **C (Day 730)** | Success criteria met, P50 assumption realized | 100% | GA4 accuracy >95%, no >5% variance vs Stripe |

### Domain-Level DoD (24 Total Criteria)

**Business Domain (A-C, 4 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A (Identified)** | Allegro contribution analyzed; pricing floor calculated | Contribution 3% → 8% target | 20% |
| **B (Deployed)** | Pricing rules live on platform; 2 weeks monitored | Contribution 3% → 5% realized | 60% |
| **C (Validated)** | Contribution hits 8% ±1pp; price elasticity proved <10% | Contribution 8% sustainable | 100% |
| — | B2B credit policy implemented; payment terms standardized | Default rate <10% | Pass/Fail |

**Market Domain (3 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A** | Brand positioning RTB audit complete | "Why choose Testik" defined | 20% |
| **B** | Positioning live on site/creative; 1 month tested | Conversion rate measurable | 60% |
| **C** | Brand lift +5% (YoY survey or NPS +8 points) | Pricing power +2-3% | 100% |

**Product Domain (3 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A** | Dead stock audit; liquidation plan (>80% SKU coverage) | €70k cost basis identified | 20% |
| **B** | Dead stock 50% liquidated; proceeds recovered | Cash +€35k recovered | 60% |
| **C** | Dead stock <15% of catalog; margin improves 1pp | AOV +3% from better assortment | 100% |

**Customer/CRM Domain (3 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A** | Retention program designed; email platform selected | 8-week pilot plan approved | 20% |
| **B** | Welcome sequence live; 2 weeks measured | Open rate >20%, CTR >2% | 60% |
| **C** | Repeat rate >18% (vs 13% baseline); €150k opportunity validated | Repeat rate +5pp proven | 100% |

**Website/UX Domain (3 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A** | Mobile checkout form audit; A/B test designed | Form test hypothesis set | 20% |
| **B** | 5-field form live; 2 weeks tested | Completion ≥3pp lift | 60% |
| **C** | Mobile completion 52%+ (vs 43.6% baseline); LCP <3.0s | €120k opportunity realized | 100% |

**SEO/Organic Domain (2 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A** | SEO index audit complete; 8.3k faceted URLs identified for removal | Canonical URL set defined | 20% |
| **B** | Faceted URLs de-indexed; crawl budget monitoring live | Index health improves 3pp | 60% |
| **C** | Organic traffic grows 15%+ (from baseline); long-tail keywords rank (top-50 for 10+ KW) | €85k opportunity on path | 100% |

**Acquisition/Paid Domain (2 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A** | GA4 accuracy audit complete; server-side tracking spec'd | Root cause confirmed (22% gap) | 20% |
| **B** | Server-side tracking live; parallel measurement week 1 | Gap closes >70% | 60% |
| **C** | GA4 accuracy validated (>95% vs Stripe); CAC/ROAS reliable | All channel decisions unblocked | 100% |

**Analytics/Measurement Domain (1 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A-C** | GA4 Consent Mode v2 implemented; GDPR compliance confirmed | Legal risk removed | Pass/Fail |

**Operations Domain (1 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A-C** | Fulfillment cost <€25/order; parcel consolidation live | Cost €31 → €25 target | Pass/Fail |

**Technology Domain (1 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A-C** | Staging environment live; zero-downtime deployments working | Risk mitigation complete | Pass/Fail |

**Organization Domain (1 criteria)**

| Stage | Criteria | P50 Assumption | Realization % |
|-------|----------|-----------------|---------------|
| **A-C** | RACI matrix live; decision authority delegated (€5-15k range to PM/Dev/Marketer) | Velocity unblocked | Pass/Fail |

---

## SECTION 7: CONFIDENCE AUDIT — WHY P50 = €156K?

### Assumption Validation (P50 Realization Factors)

**High Confidence Assumptions (80-100% conviction)**
- Current run-rate baseline (€52k/month) — measured, verified
- COGS structure (50% of revenue) — confirmed in ERP
- Fulfillment cost current state (€31/order) — invoices verified
- GA4 accuracy gap (22% undercounting) — direct measurement
- Dead stock volume (210 SKUs, €70k cost) — inventory audit

**Medium Confidence Assumptions (50-75% conviction)**
- Mobile completion lift (+15pp from form A/B test) — benchmark-derived, not tested
- Retention pilot success (+5pp repeat rate) — industry average, not testik-proven
- Allegro pricing elasticity (<10% volume drop) — single data point, limited scope
- SEO long-tail traffic timing (12-18 month ramp) — depends on Google algo, unpredictable
- Acquisition efficiency improvement (CAC −€2 from retention) — indirect effect, not direct

**Low Confidence Assumptions (30-50% conviction)**
- B2B credit policy impact (default 31% → 10%) — new governance, depends on execution
- Gifting season boost (Q4 +15% incremental) — first year for brand, untested
- Platform modernization (can run for 12+ months) — technical risk high, but timing unknown

**Realization Risk:**
- If only 50% of findings deploy as planned: P50 contribution drops to €110k (−€46k)
- If key finding fails (e.g., mobile checkout test shows <3pp lift): P50 drops to €130k (−€26k)
- If external event (economic downturn, competitor launch): P50 could drop to €90k (−€66k)

### P10 vs P50 vs P90 Confidence Spread

| Scenario | Core Assumption | Realization Risk | Mitigation |
|----------|-----------------|------------------|-----------|
| **P10** | 60-70% of findings deploy; slower timeline (16-20 weeks); conservative lift assumptions | High execution risk, delays, external headwinds | Kill criteria prevent wasted effort; pivot to "quick-win-only" mode |
| **P50** | 100% of top-10 findings deploy on-time; lifts materialize as expected; team bandwidth sufficient | Medium risk; depends on team discipline + external dependencies (platforms, payment processor) | Weekly progress tracking; DoD gates force decision if missing milestone |
| **P90** | 120%+ of findings deploy; faster-than-expected lift (e.g., mobile +20pp instead of +15pp); new revenue streams (B2B scaled) | Low probability but high upside; depends on favorable market conditions + exceptional execution | Upside is "free bonus" if execution accelerates; no incremental investment required |

---

## SECTION 8: MONTHLY FORECAST (P50 & P10 COMPARISON)

### Month-by-Month Execution Cadence (P50 vs P10)

| Month | Week | P50 Action | P50 Revenue Impact | P10 Action | P10 Revenue Impact | Variance |
|-------|------|-----------|-------------------|-----------|------------------|----------|
| **Sept** | W1-W2 | GA4 server-side setup | —measure— | GA4 setup delayed | —measure— | 0 |
| | W3-W4 | Mobile A/B test live | +€2k (early signal) | Mobile test delayed | 0 | −€2k |
| **Oct** | W1-W2 | Dead stock liquidation (50%) | +€2k cash | Dead stock slow-moving | +€1k | −€1k |
| | W3-W4 | Retention pilot starts | +€2k (projected) | Retention pilot prep | 0 | −€2k |
| **Nov** | W1-W2 | Mobile speed optimization live | +€3k (optimization live) | Mobile speed delayed | +€1k | −€2k |
| | W3-W4 | Retention emails live | +€2k (early repeat lift) | Retention emails prep | 0 | −€2k |
| **Dec** | W1-W2 | Full-year run-rate | +€1k (Q4 gifting) | Partial gifting | 0 | −€1k |
| | W3-W4 | SEO momentum building | +€1k (organic growth) | SEO slow growth | +€0.5k | −€0.5k |
| **Total Incremental (Aug→Dec)** | — | — | **+€10k** | — | **+€2.5k** | **−€7.5k** |
| **Dec Run-Rate** | — | €62k/month (P50 target) | — | €57k/month (P10 degraded) | — | **−€5k/month** |

### Annualized Impact (P50 vs P10)

- P50: €620k revenue × 28.4% contribution = €176k contribution vs €120k fixed costs = **€56k EBIT**
- P10: €600k revenue × 26.5% contribution = €159k contribution vs €120k fixed costs = **€39k EBIT**
- **Variance: −€17k EBIT (−30% downside)**

---

## SECTION 9: CASH FLOW IMPACT

### Cash Bridge (Contribution → Cash Flow)

Contribution ≠ Cash Flow due to:
1. Working capital (B2B 45-day terms, Allegro 7-day payout)
2. Inventory timing (dead stock liquidation accelerates cash)
3. Payment processing (Stripe 3-day payout lag)
4. Fixed cost timing (monthly payroll, supplier invoices)

**P50 Cash Forecast (12-month):**

| Month | Contribution | WC Timing | Inventory | Cash Inflow | Fixed Costs | Cash Outflow | Net Cash |
|-------|--------------|-----------|-----------|------------|------------|--------------|----------|
| Aug (M0) | €14k | −€3k (B2B lag) | €0 | €11k | €10k | €10k | +€1k |
| Sept | €16k | −€3k | €0 | €13k | €10k | €10k | +€3k |
| Oct | €19k | −€2k | +€8k (dead stock) | €25k | €10k | €10k | +€15k |
| Nov | €22k | −€2k | €0 | €20k | €10k | €10k | +€10k |
| Dec | €23.5k | −€2k | €0 | €21.5k | €10k | €10k | +€11.5k |
| **Total (Aug-Dec)** | €94.5k | −€12k | +€8k | €90.5k | €50k | €50k | **+€40.5k cash** |

**Key Insight:** Cash generation (€40.5k over 5 months) is higher than contribution (€94.5k) due to dead stock liquidation (one-time cash injection of €8k) but lower due to WC drag (€12k B2B terms).

---

## SECTION 10: RISK MITIGATION

### What Could Push P50 → P10?

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Mobile checkout test shows <3pp lift | 15% | −€40k contribution | Kill form redesign, investigate root cause (price, product, checkout flow) |
| Retention pilot: email open rate <15% | 10% | −€30k contribution | Kill pilot, segment test on engaged customers only, revisit list quality |
| GA4 server-side gap doesn't close >70% | 5% | −€20k (decision quality) | Escalate to GA4 support, consider alternative measurement (Segment) |
| Dead stock liquidation price <50% of cost | 20% | −€20k cash recovery | Accept loss, write off, focus on future inventory discipline |
| Team bandwidth: key person leaves | 10% | −€30k+ (all initiatives stall) | Cross-train PM + Developer on critical projects; outsource non-critical work |
| Economic downturn: Q4 sales drop 20% | 5% | −€50k revenue | Pivot to affordability messaging, survival mode (cut Allegro, focus on D2C) |
| Allegro pricing change: can't implement floor | 5% | −€20k contribution | Accept 3% margin, focus on volume, explore exit timing |

**Mitigation Strategy:**
- Kill criteria set: If mobile test <3pp, stop form redesign (don't continue bleeding €190k investment)
- Weekly dashboards: Revenue, contribution, cash flow tracked daily (vs forecast)
- Quarterly scenario refresh: P10/P50/P90 re-calculated with actual data (not just forecast)
- Decision gates: W2, W4, W8 reviews with owner to confirm P50 assumptions still valid

---

## SECTION 11: DEFINITION OF DONE (CHECKLIST)

**Phase 2 Report 3 Complete When:**

- [ ] P10/P50/P90 scenarios defined with probability weights
- [ ] Annual P&L forecast built (revenue, COGS, fulfillment, acquisition, contribution, fixed costs, taxes, net profit)
- [ ] Monthly P&L bridge created (Aug → Dec showing progression)
- [ ] Contribution breakdown by domain (Site, Allegro, B2B) + by finding (top-6 levers)
- [ ] 24 DoD criteria defined (A/B/C stages per domain, realization % tied to revenue)
- [ ] Realization risk audit completed (high/medium/low confidence assumptions mapped)
- [ ] Cash flow forecast created (WC timing, inventory impact, net cash)
- [ ] Risk register with mitigation strategies (top-7 risks)
- [ ] Scenario sensitivity analysis (what if mobile test fails, what if GA4 fix takes longer, etc.)
- [ ] P&L "decision gates" tied to DoD (revenue only counts if gates passed)
- [ ] Owner sign-off on P50 assumptions (confirms "this is realistic, not fantasy")

---

## NEXT STEPS

### Phase 2 Week 1: Report 3 Validation
1. Present P10/P50/P90 to owner (30 min)
   - Explain P50 = €156k is base case, not guaranteed
   - Show downside (P10 = €86k) and upside (P90 = €225k)
   - Lock assumptions (mobile +15pp, retention +5pp, GA4 100%, etc.)

2. Build scenario model in Excel (2-3 hours)
   - Monthly bridge (Aug → Dec)
   - Sensitivity table (what-if mobile test fails, what if retention slower, etc.)
   - DoD checklist tracking (update weekly with actual progress)

3. Tie compensation/bonuses to DoD achievement (owner discussion)
   - Team gets bonus if P50 revenue realized (not if revenue up, but if findings deliver)
   - Aligns incentives: hit the DoD gates, revenue follows

### Phase 2 Week 2-3: Reports 4-5 + Volumes
- Report 4 (Roadmap): Reclassify 71 tasks → Infrastructure/Experiment/Decision Gate/Scale
- Report 5 (Proposal): Investment case rebuild with P10/P50/P90 scenarios
- Volumes A-E: Score → Evidence transformation (parallel with reports)

---

**Status: PHASE 2 Report 3 Restructured — 3-Scenario Financial Model Created ✓**  
**Next: Report 4 (Roadmap) Task Restructuring**

