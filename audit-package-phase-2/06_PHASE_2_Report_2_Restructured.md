# PHASE 2: REPORT 2 RESTRUCTURED
## Diagnostics: 12 Audits → 31 Finding Objects (Epistemic Framework)

**Status:** Phase 2 Core Restructuring — Report 2 (Diagnostics)  
**Date Started:** 2026-08-24  
**Approach:** Converting each finding from current PDF format → 16-field Finding Object with E-levels, confidence distributions (P10/P50/P90), counterargument layers, kill criteria, and experiment plans  
**Quality Level:** E1-E3 findings with structured decision frameworks

---

## AUDIT DOMAIN STRUCTURE

| Audit | Chapter | Current Findings | Status |
|-------|---------|------------------|--------|
| Context & Ownership | 2.01 | 2 | ✓ In progress |
| Business: Model & Economics | 2.04 | 4 | ✓ In progress |
| Market: Positioning & Brand | 2.05 | 5 | ✓ In progress |
| Product: Assortment & Pricing | 2.06 | 4 | ✓ In progress |
| Customer: Segments & Retention | 2.07 | 4 | ✓ In progress |
| Website: UX & Conversion | 2.08 | 6 | ✓ In progress |
| SEO/GEO: Organic Visibility | 2.09 | 4 | ✓ In progress |
| Acquisition: Paid Channels | 2.10 | 4 | ✓ In progress |
| CRM/Retention: Database & Flows | 2.11 | 4 | ✓ In progress |
| Analytics: Data & Decisions | 2.12 | 3 | ✓ In progress |
| Operations: Warehouse & Fulfillment | 2.13 | 4 | ✓ In progress |
| Technology: Platform & Infrastructure | 2.14 | 4 | ✓ In progress |
| Organization: Team & Authority | 2.15 | 4 | ✓ In progress |
| **TOTAL** | | **31** | **→ 31 objects** |

---

## SECTION 2.04: BUSINESS AUDIT (4 FINDINGS)

### Finding TSK-F001: Allegro Channel Unprofitable

**FINDING OBJECT FIELDS:**

**1. Claim (Core Statement)**
"D2C business model on Allegro platform channel generates negative contribution due to high platform commission (Allegro 3%, B2B wholesalers cut 45 days), while contribution site-wide is 12% post-ads. Allegro represents 100% of marketplace revenue but creates margin pressure that masks profitability."

**2. Evidence Quality Level: E2 (Pattern, Measured)**
- ✓ Verified: iUnit-economics site analysis (contribution 12% post-ads) 
- ✓ Verified: Allegro contribution 3% + B2B terms (45-day payment delay)
- ✓ Verified: Channel-specific cash flow analysis (€60k + €70k bleed forecast)
- Source Data: SAC from search (€18 CAC new vs €21.8), payback = 1 purchase, does not align with Allegro 3% contribution
- Weakness: Attribution model not validated; could be self-selection bias in Allegro customers vs site

**3. Observation (What We See)**
- Site contribution: 12% (average across all channels post-ads)
- Allegro contribution: 3% (platform takes fee, but also accounts for poor SKU performance)
- B2B contribution: −18% (−€9-14k loss; dead stock on B2B side, payment terms 45 days cash outflow impact)
- Allegro/Marketplace mix: 45% of orders, 20% of revenue by margin
- CAC for Allegro channel vs site: SAC €18 (payback 1 purchase on site vs −€2.5 on Allegro)

**4. Interpretation (Why It Matters)**
Allegro acts as a low-margin, high-volume channel that finances platform operations but destroys shareholder value. The 3% contribution does not cover:
- Overhead allocation (€X warehouse + fulfillment labor per order)
- Marketing efficiency (CAC €18 vs contribution €1.5/order on Allegro = payback >12 purchases vs 1 purchase on site)
- Working capital (45-day payment terms = €60k cash bleed over Q4 forecast)

**5. Root Cause Analysis**

| Level | Root Cause | Evidence |
|-------|-----------|----------|
| L0 | Low contribution on Allegro channel | 3% contribution vs 12% site average |
| L1 | High platform commission + poor unit economics | Allegro takes 3%, B2B wholesalers 45-day terms, SKU-level data shows bottom 50% SKUs lose money |
| L2 | Product mix: bottom 50% SKUs (60% of Allegro volume) have negative margin | Cost-plus pricing without knowledge of full cost structure; Allegro buyers skew toward price-sensitive, low-margin SKUs |
| L3 | No contribution accountability at channel level; pricing rules set site-wide without channel-specific floors | Pricing set 12-month in advance by iUnit; no real-time margin management; no channel rules |

**6. Business Impact: Confidence Distribution**

| Scenario | P-Level | Assumption | Impact | Probability |
|----------|---------|-----------|--------|-------------|
| Pessimistic | P10 | Allegro becomes platform-only channel; cut to €0 revenue | Lose 45% of orders, −€125k annually (but save fulfillment) | 15% |
| Base Case | P50 | Keep Allegro, improve contribution from 3% → 8% via pricing rules + SKU mix | €60k + €70k recovery (one-time Q4 cash bleed) | 50% |
| Optimistic | P90 | Allegro 3% → 12% (site parity) via full product audit + selective SKU deprecation | €156k annual contribution (margin recovers to site average) | 25% |

**Business Impact Summary:** P10=€0k, **P50=€60k**, P90=€156k (€70k immediate, €86k structural)

**7. Severity Classification: CRITICAL**
- **Why Critical:** >€50k opportunity, channel-level decision in <8 weeks
- **Decision Gate:** W2 (pricing rules live) + W4 (SKU mix analysis)
- **Ownership:** Owner + WEEXP (accountant) + PM

**8. Counterargument Layer (4 Alternative Explanations)**

**A1: Allegro is volume play; contribution will improve at scale**
- Test: Is contribution improving month-on-month? (Hypothesis: improvement trend vs flat or down)
- Falsification: If contribution stays flat 3% through October → kill scale hypothesis
- Evidence to gather: MoM contribution rate Sept → Oct → Nov

**A2: Attribution is wrong; Allegro customers aren't really generating 3%, they're just buying lower-margin SKUs we'd sell elsewhere anyway**
- Test: Isolate "same customer, same SKU" cohort: Allegro buyer vs site buyer on identical product
- Falsification: If site-only customers on same bottom-50 SKUs also show 3-5% contribution → attribution correct
- Evidence to gather: SKU-level contribution by channel (Allegro vs site vs B2B)

**A3: Problem is temporary; Q4 inventory clearance is dragging margin down (will normalize in Q1)**
- Test: Compare Q3 contribution (12 months back) vs Q4 contribution now
- Falsification: If Q3 Allegro was also 3% → problem is structural not seasonal
- Evidence to gather: YoY contribution curve (Q4-2025 vs Q4-2024)

**A4: Allegro rules our portfolio; cutting it kills 45% volume and doesn't solve unit economics (need both pricing AND product redesign)**
- Test: Run 2×2 experiment: pricing rules (low vs high floor) × product mix (all SKUs vs top-100 only)
- Falsification: If high-floor + top-100 = negative volume change AND contribution stays low → Allegro is platform for price-seekers only
- Evidence to gather: Pricing elasticity by Allegro segment; willingness to pay by tier

---

### Finding TSK-F002: B2B Without Rules

**FINDING OBJECT FIELDS:**

**1. Claim**
"B2B wholesale channel (Allegro API + direct orders) has zero documented pricing logic, no minimum order quantities, no payment terms policy. Result: 14 customers, majority orders <€200, 31% default on payment within 30 days = €9-14k loss. Currently propping up via individual order-level haggling, no systematic governance."

**2. Evidence Quality Level: E1 (Measured Fact)**
- ✓ Verified: 14 active B2B customers (Allegro + direct)
- ✓ Verified: 31% default/late payment rate (>30 days) across 45-day terms
- ✓ Verified: Average order €200 (14 customers, −25% forecasted loss vs €200 sales = collection cost > €0 profit)
- Source: ERP data (payment records), CRM (customer list), iUnit-economics
- Note: No formal B2B pricing or credit policy exists (order-by-order negotiation)

**3. Observation**
- B2B customer base: 14 entities
- Payment discipline: 69% on-time, 31% late >30 days → implies credit risk = €25-45k annualized
- Minimum order: None documented (range €50-€2,000)
- Payment terms: 45 days (negotiated per customer, not standardized)
- Contribution: −€9-14k (loss-making)
- Collection cost: ≈€1-2k per customer per year (manual follow-ups)

**4. Interpretation**
B2B is treated as "opportunistic channel" rather than systematic business. Payment terms (45 days) + high default rate (31%) + low order size (€200 avg) + zero credit policy = working capital trap. Each new B2B customer added increases default risk without vetting.

**5. Root Cause Analysis**

| Level | Root Cause | Evidence |
|-------|-----------|----------|
| L0 | B2B channel unprofitable due to credit risk | 31% default, collection cost inefficient |
| L1 | No B2B pricing, credit, or MOQ policy | Orders negotiated individually; payment terms ad-hoc |
| L2 | B2B channel not resourced; no credit analyst role; payment follows invoice-email cadence | "Если горит" protocol — pay only if owner calls |
| L3 | Founder treats B2B as side-business; no strategic role; priorities on site/Allegro D2C | Owner mindset: "B2B is too much overhead, focus on growth" |

**6. Business Impact**

| Scenario | P-Level | Assumption | Impact |
|----------|---------|-----------|--------|
| Pessimistic | P10 | Cut B2B entirely (kill 14 customers) | Save €2k collection cost, lose €200-400 monthly revenue = break-even |
| Base Case | P50 | Implement credit policy (MOQ €300, payment 15-day max, credit limit €2k per customer) | Reduce default to 10%, save €12k annually in collection |
| Optimistic | P90 | B2B becomes managed channel (credit vetting, 30-day terms, €500 MOQ) | €9-14k loss → €3-5k profit (credit risk managed) |

**Business Impact: P10=€0k, P50=−€6k (save vs current bleed), P90=€5k**

**7. Severity: HIGH**
- Why High: €9-14k annual loss, policy can be implemented in 4-7 days
- Decision Gate: W1 (policy drafted), W2 (live with vetting)
- Ownership: Owner + Accountant

**8. Counterargument Layer**

**A1: B2B default rate of 31% is reasonable for wholesale; shouldn't kill channel**
- Test: Industry benchmark for wholesale 30-day default (answer: ~5-8% for EU, 15% for risky sectors)
- Falsification: If testik portfolio is lower-risk B2B vs benchmark → tolerate 31% as cost of growth
- Evidence: Industry KPI from SBA/Dun & Bradstreet data

**A2: Low order size (€200 avg) is temporary; scaling will improve unit economics**
- Test: Trend of B2B order size over 12 months
- Falsification: If avg order size flat or declining → channel doesn't scale
- Evidence: Order size curve (last 12 mo vs forecast)

---

### Finding TSK-F003: No Financial Model

**FINDING OBJECT FIELDS:**

**1. Claim**
"Forecast model for Q4 (Oct-Dec) is ad-hoc: SAC-based planning without scenario analysis. Decisions about pricing, spend, inventory are made without "what-if" financial model. Result: €50k cash outflow surprises (B2B 45-day terms + inventory carry), forecasts miss by >20%, no downside scenarios built."

**2. Evidence Quality Level: E1 (Measured Fact)**
- ✓ Verified: No Excel model for Q4 (only SAC spreadsheet)
- ✓ Verified: Forecast vs actual delta >20% month-on-month
- ✓ Verified: Cash flow surprises on B2B terms (45 day payout vs 7 day cost outlay)
- Source: Accountant notes, interview with owner; historical forecast vs actual

**3. Observation**
- Current forecast: iUnit-economics SAC model (revenue = SAC × 1 purchase payback assumption)
- Scenario modeling: None (point estimate only)
- Cash flow modeling: None (revenue projections don't account for payment terms, inventory carry)
- Historical accuracy: Forecast vs actual ±25% month-on-month

**4. Interpretation**
Business is "driving blind" on cash. Pricing decisions, spend approvals, and inventory buys are made based on revenue targets, not on cash scenario analysis. High payment-term channels (B2B, Allegro with 7-day payout) create cash timing mismatches that aren't visible in P&L.

**5. Root Cause**

| Level | Root Cause |
|-------|-----------|
| L0 | No scenario financial model for Q4 |
| L1 | Forecasting done via SAC/payback, not integrated P&L + cash flow |
| L2 | No financial analyst; accountant does tax/reporting, not planning |
| L3 | Owner mindset: "Revenue is the metric; cash flow is accounting detail" |

**6. Business Impact: P10=€0k (baseline), P50=€50k (cash flow risk mitigation), P90=€150k (better decision-making)**

**7. Severity: HIGH**
- Why High: €50k cash outflow already forecasted; model prevents bleed in Q4 + future quarters
- Decision Gate: W2 (model built), W3 (shared with owner)
- Ownership: Accountant + PM

---

### Finding TSK-F004: No Profitability Path at Allegro Pricing

**FINDING OBJECT FIELDS:**

**1. Claim**
"At current Allegro pricing model (iUnit + 3% commission), D2C profitability is capped. Contribution of 3% does not cover fixed costs. Business cannot reach break-even without: (A) pricing floor on Allegro, (B) fixed cost reduction (warehouse rationalization), or (C) exit Allegro. All require Q4-2026 decision."

**2. Evidence Quality Level: E2 (Pattern)**
- ✓ Contribution analysis: 3% on Allegro vs 12% site-wide
- ✓ Fixed cost (FTE + warehouse): €X/month (from internal data)
- ✓ Contribution margin after fixed cost: Negative on Allegro, breakeven on site

**3. Business Impact: P10=€0k (no change), P50=€60-80k (pricing + mix), P90=€200k (full restructure)**

**7. Severity: CRITICAL**
- Timeline: Q4 2026 decision point
- Ownership: Owner + Accountant

---

## SECTION 2.05: MARKET AUDIT (5 FINDINGS)

### Finding TSK-F005: Market Positioning (No RTB)

**FINDING OBJECT FIELDS:**

**1. Claim**
"Market positioning for 'eco-conscious posture' is not differentiated vs competitors. Brand search +9%/yr vs competitor 4.6%, but brand owns no unique positioning (no RTB = reason-to-believe). Result: brand is name-only; price is the only lever. Competitors already own positioning in delivery, selection, sustainability."

**2. Evidence Quality Level: E2 (Pattern)**
- Search index by competitor: Top-20 SKUs show +9% year-over-year brand trend
- Price index vs competitors: testik is at parity (no premium for eco-positioning)
- Brand positioning test: RTB score from brand audit = 0/5 (no documented reason-to-believe vs competitors)
- Source: Brand search audit, competitor positioning analysis

**3. Business Impact: P10=€0k, P50=€15-25k (via content strategy + brand), P90=€50k (full brand lift)**

**7. Severity: HIGH**
- Why High: Affects pricing power and customer LTV; brand fix is 8-12 week content project
- Decision Gate: W2 (positioning defined), W4 (content calendar live)
- Ownership: Marketer + WEEXP

---

### Finding TSK-F006: Care Content Opportunity

**FINDING OBJECT FIELDS:**

**1. Claim**
"Competitor '9k care articles' cluster is proven SEO tactic; testik has 0 care articles. Opportunity: launch 50-60 care/educational articles (low-competition keywords in "care" space) to capture SEO traffic and build brand authority. Forecasted: +€15-25k annual revenue from organic."

**2. Evidence Quality Level: E3 (Mechanism Proven, Magnitude TBD)**
- ✓ Verified: Competitor has 9,000 articles in "care" cluster
- ✓ Verified: Search volume in care keywords (12 mo data)
- ✓ Verified: Competitor ranking + traffic per article (via GSC, Ahrefs)
- Uncertain: Conversion rate from care article → purchase for testik (competitor has higher brand trust)
- Source: SEO competitive analysis, GSC audit

**3. Business Impact: P10=€5k, P50=€15-25k, P90=€50k (if brand authority compounds)**

**7. Severity: HIGH**
- Timeline: 8-12 week content build
- Ownership: Content team + SEO

---

### Finding TSK-F007: Delivery Threshold Issue (€35-50 cost)

**FINDING OBJECT FIELDS:**

**1. Claim**
"Free shipping threshold (€0 for all) vs benchmark (€35-50 recommended) means testik subsidizes delivery cost for orders <€50. Low-value orders (28%) ship at loss: €50 order = €40 cost + €10 contribution = ship at €-30 margin. Fix: €50 minimum, or €8 delivery fee on orders <€50."

**2. Evidence Quality Level: E2 (Pattern)**
- Orders <€50: 28% of total orders
- Delivery cost for <€50 order: ~€40 (parcel shop, fuel surcharge)
- Contribution after delivery: −€30 per order
- Source: Fulfillment cost audit, historical order data

**3. Business Impact: P10=€5-10k (conservative), P50=€15-25k, P90=€30k (full pricing**

**7. Severity: MEDIUM**
- Why Medium: Revenue risk (customer acceptance of fee), but cost is real
- Timeline: 2-week A/B test
- Ownership: Marketer + Ops

---

### Finding TSK-F008: TM Protection (EUIPO Risk)

**FINDING OBJECT FIELDS:**

**1. Claim**
"testik trademark not protected in EUIPO registry. Risk: competitor registration or brand dilution in EU markets. Solution: EUIPO registration (€250/class, 8-week filing + approval). This is defensive; no revenue impact but legal risk."

**2. Evidence Quality Level: E1 (Fact)**
- No EUIPO TM registration found for "testik"
- Competitors already own similar marks
- Recommendation: File UA + EUIPO class 3,16

**3. Business Impact: P10=€0k (risk mitigation), P50=€50k (legal defense cost if unregistered), P90=€100k (brand recovery)**

**7. Severity: HIGH (Legal)**
- Timeline: 1-2 weeks to file
- Ownership: Founder + Legal

---

## SECTION 2.06: PRODUCT AUDIT (4 FINDINGS)

### Finding TSK-F009: Dead Stock (210 SKUs, €70k Bleed)

**FINDING OBJECT FIELDS:**

**1. Claim**
"64 SKUs frozen by company; 210 additional SKUs in dead stock (no sales 180+ days). Dead stock value: €70k (cost basis). Frozen SKUs represent 33% of catalog but generate 0 sales. Action: liquidate bottom-50 SKUs (cost-based inventory write-off €50-70k), reinvest in top-100 catalog (proven sellers)."

**2. Evidence Quality Level: E1 (Measured Fact)**
- ✓ Verified: 210 SKU count (ERP, no sales 180+ days)
- ✓ Verified: €70k cost basis (accounting ledger)
- ✓ Verified: Top-20 SKU = 58% of virality, A-group stable performance
- Source: ERP inventory audit, sales data

**3. Business Impact: P10=€0k (write-off as sunk), P50=€25-40k (liquidation proceeds), P90=€70k (inventory space recovery)**

**4. Observation**
- Dead stock SKU count: 210 (33% of total)
- Frozen SKU count: 64 (not for sale, sitting in warehouse)
- Value: €70k cost basis
- Cost to carry: €12 per SKU per month (storage + handling)
- Elasticity experiment: +5% to -8% price on selected SKUs shows price-demand relationship (can be used for clearance)

**5. Root Cause**

| Level | Root Cause |
|-------|-----------|
| L0 | €70k dead stock |
| L1 | No systematic SKU lifecycle management; cost-plus pricing without knowledge of demand elasticity |
| L2 | Buying logic: replenish based on "gut" (top 20 SKU = stable), not on forecasted demand or clearance logic |
| L3 | No product manager role; buying by founder on ad-hoc basis; no data-driven inventory rationalization |

**6. Business Impact: P10=€0k (sunk cost), P50=€25-40k (liquidation value), P90=€70k (full space recovery + reinvestment)**

**7. Severity: CRITICAL**
- Why Critical: €70k immediate cash outflow for warehouse space; opportunity to reinvest in proven SKUs
- Timeline: 2-4 weeks (liquidation clearance sales)
- Ownership: PM + Marketer + Accountant

**8. Counterargument Layer**

**A1: Dead stock will sell eventually; don't liquidate at loss**
- Test: Historical sell-through curve for low-velocity SKUs (12-month trend)
- Falsification: If sell-through <2/month and declining → sunk cost, liquidate
- Evidence: Sell-through rate by SKU tier

**A2: Dead stock is seasonal; Q4 demand spike will clear inventory**
- Test: Compare Q4 2024 (same period last year) vs Q4 2025 (dead stock was live)
- Falsification: If Q4 2024 also didn't sell these SKUs → not seasonal
- Evidence: YoY sales curve for dead stock SKUs

**A3: Cost of carrying €70k dead stock (€12/month × 210 SKU = €2.5k) is acceptable vs potential loss on clearance**
- Test: Calculate break-even liquidation price vs carry cost over 12 months
- Falsification: If clearance price covers carry cost within 3 months → liquidate immediately
- Evidence: Liquidation pricing strategy

---

### Finding TSK-F010: Elasticity Testing Needed

**FINDING OBJECT FIELDS:**

**1. Claim**
"Price elasticity unknown. Experiments show +5% price → -8% volume (elastic demand), but tests limited to top-30 SKUs. Action: expand elasticity testing to all categories to optimize pricing. Estimated upside: €25-40k (if ability to raise prices on inelastic categories)."

**2. Evidence Quality Level: E3 (Mechanism Proven, Magnitude Unproven)**
- Natural experiments: +5% price on 30 SKUs = −2% volume, +2.1k/unit (contribution elasticity)
- Limited to high-velocity SKUs only; no testing on mid-tier or dead stock
- Source: Pricing audit, historical pricing changes

**3. Business Impact: P10=€5k, P50=€25-40k, P90=€60k (if ability to raise prices elasticity-based)**

---

### Finding TSK-F011: Cross-Sell Not Used

**FINDING OBJECT FIELDS:**

**1. Claim**
"Cross-sell pairs analysis shows 23% correlation between top-performing SKU pairs, but platform (WooCommerce) has no cross-sell logic. Opportunity: implement cross-sell rules (+ RDP strategy) to increase AOV +11% on paired purchases. Forecasted: €15-25k annual increase."

**2. Evidence Quality Level: E3 (Mechanism Proven)**
- Analysis: Shoppers buying SKU-A also buy SKU-B in 23% of orders
- PDP rules: +11% cross-sell adoption vs baseline (natural co-purchase rate)
- Recommendation: Add "frequently bought together" logic to product pages

**3. Business Impact: P10=€5k, P50=€15-25k, P90=€40k**

---

### Finding TSK-F012: Attribute Data Quality (54% Complete)

**FINDING OBJECT FIELDS:**

**1. Claim**
"Product attribute data (size, material, care instructions) is 54% complete. Missing attributes block proper filtering, search, and machine learning on product recommendations. Action: audit and complete missing attributes (−36 p.p. target = 90% complete). Estimated impact: €3-5k (search accuracy, filtering UX)."

**2. Evidence Quality Level: E2 (Pattern)**
- Attribute completeness: 54% across 210+ SKUs
- Missing attributes: Size, material, care instructions (most common)
- Impact: Search accuracy, filtering functionality
- Source: Product data audit

**3. Business Impact: P10=€1k, P50=€3-5k, P90=€10k**

---

## SECTION 2.07: CUSTOMER AUDIT (4 FINDINGS)

### Finding TSK-F013: Customer Drops Out (1.15x Multiplier)

**FINDING OBJECT FIELDS:**

**1. Claim**
"Customer cohort analysis (by acquisition channel + first purchase date) shows 1.15x repeat rate in first 90 days, then sharp drop to 4% repeat in months 3-6. Root cause: post-purchase engagement is zero (no welcome email sequence, no retention program). High churn = €150k opportunity cost (41k customer base × 13% repeat rate vs 25-30% benchmark)."

**2. Evidence Quality Level: E2 (Pattern)**
- ✓ Verified: CRM repeat rate = 13% (365-day repeat rate)
- ✓ Verified: Benchmark 25-30% repeat rate (industry standard for D2C)
- ✓ Verified: No email flows post-purchase (welcome sequence missing)
- ✓ Verified: 41k customer base; 14k active; 27k dormant >90 days

**3. Business Impact: P10=€50k, P50=€150k, P90=€250k**

**4. Counterargument Layer**

**A1: Repeat rate of 13% is reasonable for product category (non-consumable)**
- Test: Benchmark repeat rate for similar D2C product categories
- Falsification: If benchmark is 25-30% for non-consumable → testik is underperforming

**A2: Root cause is product quality, not retention marketing**
- Test: Survey post-purchase (NPS, likelihood to repurchase)
- Falsification: If NPS is high (>40) and repurchase likelihood is high (>4/5) but actual repeat is 13% → retention marketing issue

**A3: Cohort is skewed by one-time buyers (gift purchases, trial); repeaters have higher LTV**
- Test: Segment by purchase intent (gift vs personal); track LTV separately
- Falsification: If repeater LTV is low or segment is small → retention issue is real

---

### Finding TSK-F014: Segmentation Not in Place

**FINDING OBJECT FIELDS:**

**1. Claim**
"CRM has no documented customer segmentation. Result: marketing campaigns treat all 41k customers the same (no email list, no segment-specific messaging). Solution: RFM-based segmentation (Recency/Frequency/Monetary) + behavioral segments to unlock targeted retention campaigns. Estimated upside: €80k (via targeted re-activation of dormant customers)."

**2. Evidence Quality Level: E2 (Pattern)**
- ✓ Verified: No CRM segmentation rules
- ✓ Verified: Broadcast email only (no segment-based campaigns)
- ✓ Verified: 27k dormant customers (no purchase >90 days)

**3. Business Impact: P10=€20k, P50=€80k, P90=€120k**

---

### Finding TSK-F015: Post-Purchase Experience

**FINDING OBJECT FIELDS:**

**1. Claim**
"Post-purchase experience is minimal: order confirmation + shipment tracking only. No post-delivery engagement (thank you email, product care tips, repurchase offer). Result: customer journey ends at delivery; no value-add phase. Solution: 3-touch email sequence post-delivery (day 1, 7, 30) with care content + loyalty offer. Estimated impact: €10-15k annual repeat lift."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€5k, P50=€10-15k, P90=€25k**

---

### Finding TSK-F016: First-Time Buyer Onboarding

**FINDING OBJECT FIELDS:**

**1. Claim**
"First-time buyers (cohort repeat <0.5x norm) lack structured onboarding. Post-purchase, they receive no education on product care, sizing, or brand story. Solution: automated onboarding email (day 1 = sizing/fit, day 3 = care tips, day 7 = brand story + community invite). Estimated impact: €5-10k via improved fit/care satisfaction."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€2k, P50=€5-10k, P90=€15k**

---

## SECTION 2.08: WEBSITE AUDIT (6 FINDINGS)

### Finding TSK-F017: Mobile Checkout Speed + Form Friction

**FINDING OBJECT FIELDS:**

**1. Claim**
"Mobile checkout completion 43.6% vs desktop 65%+ → 5,180 monthly visitors × 74% mobile traffic = 2,920 abandons/month. Root cause: mobile LCP 4.6s + 5-field form without autofill + PDP layout (cramped on mobile). Fixing speed + form = €120k annual recovery (based on +15pp completion lift assumption). One-time cost: €190k-€235k (WooCommerce rebuild + form redesign + WebP optimization)."

**2. Evidence Quality Level: E3 (Mechanism Proven, Magnitude Unproven)**
- ✓ Verified: Mobile completion 43.6% (GA4 data), desktop 65%+ (benchmark)
- ✓ Verified: Mobile LCP 4.6s (CrUX, target 2.5s)
- ✓ Verified: Form fields (9 fields, no autofill, no progress indicator)
- Uncertain: Impact of form reduction alone (could be +5pp or +15pp depending on drop-off reason)
- Source: GA4 session recording analysis, CrUX data, form friction audit

**3. Business Impact: P10=€35k, P50=€120k, P90=€180k**

**4. Experiment Design**

**Phase 1: Form A/B Test (W1-W2, 2 weeks)**
- Control: Current 9-field form
- Variant: 5-field form (optional address fields removed, auto-address lookup)
- Metric: Checkout completion rate (goal: +5pp minimum)
- Success Criteria: Completion +3pp at p<0.05 confidence

**Phase 2: Speed Optimization (W2-W3, 3 weeks)**
- Actions: WebP + CDN, form-field lazy-load, GTM deferral
- Metric: LCP, CLS, FID
- Success Criteria: LCP <3.0s, CLS <0.1

**5. Kill Criteria**
- Form test <3pp lift → kill form redesign (root cause is not friction)
- Speed optimization cannot achieve LCP <2.8s → re-evaluate WooCommerce architecture (consider Shopify migration)
- If combined test <8pp completion lift → kill project; pursue other channels

**6. Counterargument Layer**

**A1: Mobile traffic quality is lower (browsers, less likely to convert); shouldn't optimize mobile-specific**
- Test: Segment mobile traffic by device type (smartphone vs tablet); check conversion rate
- Falsification: If smartphone has same CAC but lower CVR → is it quality or UX issue?
- Evidence: Device-level CVR analysis

**A2: Form friction is not the primary drop-off reason; users abandon for price, shipping cost, or payment method**
- Test: Session replay analysis on abandoned carts (drop-off reason distribution)
- Falsification: If <20% drop at form stage → form redesign not the lever
- Evidence: Heatmap + session recording data

**A3: LCP of 4.6s is acceptable for mobile; competitive sites have similar performance**
- Test: Competitor LCP benchmark (Bayward, Asos, etc. for same category)
- Falsification: If competitors are <2.5s → testik is outlier and worth fixing
- Evidence: CrUX data for competitor domains

**7. Severity: CRITICAL**
- Why Critical: €120k opportunity, <€50k cost, ROI = 2.4x, fixes in 4 weeks
- Timeline: W1 form test, W2-W3 speed optimization, W4 launch
- Ownership: PM (Yana) + Developer (Petro) + WEEXP (designer)

**8. Definition of Done**
- ✓ Form A/B test live and running (W1)
- ✓ Form variant: 5-field version in production (W2)
- ✓ Speed optimization: LCP <3.0s measured (W3)
- ✓ Combined test: Completion >=46% (baseline 43.6% + 2.4pp form + 1pp speed) (W4)
- ✓ Revenue impact: Track weekly completion rate + AOV for 4 weeks post-launch

**9. Measurement Plan**
- Weekly: Completion rate, form drop-off by field, LCP
- Monthly: AOV, repeat customer acquisition cost via checkout channel
- Decision Gate: W4 (end of test) — if <8pp lift, kill project

---

### Finding TSK-F018: PDP Credibility Gaps

**FINDING OBJECT FIELDS:**

**1. Claim**
"Product detail page (PDP) missing credibility signals: no customer reviews (WooCommerce plugin not installed), no product warranty/guarantee messaging, no 3rd-party badges (certification, material proof). Result: visitors lack trust signals to offset premium price positioning. Fix: add reviews plugin + warranty messaging + certification badges. Estimated impact: €50-100k (via improved conversion on PDP)."

**2. Evidence Quality Level: E2 (Pattern)**
- ✓ Verified: No review system on PDP
- ✓ Verified: Competitor PDPs have reviews (social proof)
- ✓ Verified: Conversion rate 17.5% (28-35% benchmark suggests trust gap)

**3. Business Impact: P10=€10k, P50=€50-100k, P90=€150k**

---

### Finding TSK-F019: Null/No-Data Checkout Push

**FINDING OBJECT FIELDS:**

**1. Claim**
"Checkout form has 18% entries with 'нічого не знайдено' (no data found) message, indicating form field validation errors or autocomplete failures. Causes re-entry, form abandonment. Fix: improve form validation, better error messaging, smarter autofill. Estimated impact: €10-15k (reduced form friction)."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€2k, P50=€10-15k, P90=€20k**

---

### Finding TSK-F020: BLIK Payment Method Missing for PL

**FINDING OBJECT FIELDS:**

**1. Claim**
"Polish customers (growing segment, 68% of EU traffic post-launch) expect BLIK payment method. Currently missing → payment friction for PL buyers. Fix: Stripe integration for BLIK. Estimated impact: €15-30k (reduced payment abandonment for PL, +20% PL conversion)."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€5k, P50=€15-30k, P90=€50k**

---

### Finding TSK-F021: AOC Criteria Alignment

**FINDING OBJECT FIELDS:**

**1. Claim**
"Website UX audit vs AQC (Atomic Quality Criteria) standard: 22 criteria × 11 domains. 12 criteria status = 'Warn/Fail' (10 Pass, 12 Warn, 5 Fail). Most common failures: Visibility (CTA visibility <2c, mobile-specific), Forms (>6 fields), Mobile visibility (LCP >2.5s, tap targets <44px). Action: prioritize Top-5 AQC fails (visibility, forms, mobile LCP, decision criteria, accessibility). Estimated timeline: W1-W4 fixes."

**2. Evidence Quality Level: E2 (Pattern, Measured)**

**3. Business Impact: P10=€20k, P50=€80-120k, P90=€180k (comprehensive UX overhaul)**

---

## SECTION 2.09: SEO AUDIT (4 FINDINGS)

### Finding TSK-F022: Index Broken x8

**FINDING OBJECT FIELDS:**

**1. Claim**
"Index broken: 340 pages generate 85% of organic traffic, but 8.3k faceted pages are indexed but receive <1% traffic. Duplicate content issue (facets, filters, pagination) → GSC shows "URL in index but not needed." Recommendation: Remove faceted URLs from index (reduce to 340 canonical URLs). Estimated cleanup: 8.3k pages de-indexed. Impact on authority: +€85k potential (recovered crawl budget redirected to core content)."

**2. Evidence Quality Level: E2 (Pattern)**
- ✓ Verified: 340 core URL set (generates 85% traffic)
- ✓ Verified: 8.3k faceted pages (low traffic, duplicate concerns)
- ✓ Verified: GSC signals "not needed" for faceted pages

**3. Business Impact: P10=€20k, P50=€85k, P90=€150k**

**4. Counterargument Layer**

**A1: Faceted pages drive long-tail traffic; removing them kills keyword reach**
- Test: Measure organic traffic from faceted pages (current) vs canonical URLs
- Falsification: If faceted pages generate <5% of total traffic → cleanup won't impact reach
- Evidence: Organic traffic breakdown by URL type

---

### Finding TSK-F023: Keyword Research Gap

**FINDING OBJECT FIELDS:**

**1. Claim**
"Keyword content strategy is missing. Only high-volume, high-CPC terms are targeted (competitor terms). Opportunity: identify 50+ long-tail, low-competition keywords (cost-per-month = opportunity) in core categories. Estimated impact: €40-60k (new organic traffic from content cluster strategy)."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€15k, P50=€40-60k, P90=€100k**

---

### Finding TSK-F024: Link Profile Weak

**FINDING OBJECT FIELDS:**

**1. Claim**
"Backlink profile: only 41k links to site (vs benchmark 100k+). Most links are from marketplace directories (low authority). Missing: press mentions, industry blog coverage, partnerships. Solution: build 10-15 strategic partnerships, earn 20+ press mentions over Q4-Q1. Estimated impact: +€35-50k via improved domain authority."

**2. Evidence Quality Level: E3 (Mechanism Proven)**

**3. Business Impact: P10=€10k, P50=€35-50k, P90=€80k**

---

### Finding TSK-F025: On-Page Optimization

**FINDING OBJECT FIELDS:**

**1. Claim**
"On-page optimization score: 39% of SKUs lack optimized title/meta/H1. Opportunity: audit and fix 100+ product pages. Estimated impact: +€20-30k (improved CTR from search results)."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€5k, P50=€20-30k, P90=€50k**

---

## SECTION 2.10: ACQUISITION AUDIT (4 FINDINGS)

### Finding TSK-F026: GA4 Broken (−22% Undercounting)

**FINDING OBJECT FIELDS:**

**1. Claim**
"GA4 undercounts orders by 22%: GA4 reports 1,420 orders vs Stripe shows 1,821 orders. Root cause: client-side gtag.js tracking blocked by ad blockers (22% of sessions). Result: All CAC/ROAS calculations are misdirected; channel optimization is blind. Solution: implement server-side tracking (Google Tag Manager server-side container) to capture 100% of purchase events. Timeline: W1 setup (5 days), W2 parallel testing, W3 full live."

**2. Evidence Quality Level: E1 (Measured Fact)**
- ✓ Verified: GA4 1,420 orders (last 30 days)
- ✓ Verified: Stripe 1,821 orders (same period)
- ✓ Verified: Gap = 22% undercounting
- ✓ Verified: Client-side block rate = 22% (measured via event firing)
- Source: GA4 admin interface, Stripe dashboard, event inspection tool

**3. Business Impact: P10=€30k (baseline = decision quality risk), P50=€50k (accuracy recovery), P90=€100k (optimizations enabled)**

**4. Root Cause**

| Level | Root Cause |
|-------|-----------|
| L0 | −22% undercounting in GA4 |
| L1 | Client-side gtag.js blocked by ad blockers |
| L2 | No server-side fallback or backup measurement |
| L3 | GA4 setup in 2023, never updated; no measurement strategy review |

**5. Experiment Design**

**Phase 1: Setup (W1, 5 days)**
- Build GTM server-side container (Google Cloud infrastructure)
- Configure server-side event forwarding (purchase events → both GA4 + backup)
- Deploy to staging

**Phase 2: Parallel Testing (W2, 7 days)**
- Run server-side + client-side simultaneously
- Monitor agreement between two measurement streams
- Adjust configuration if gaps exist

**Phase 3: Full Live (W3)**
- Switch to server-side as primary measurement
- Retire client-side gtag (or use as backup)
- Update CAC/ROAS calculations

**6. Kill Criteria**
- If server-side gap doesn't close >70% → deeper integration issue (check Stripe webhook config, transaction ID matching)
- If implementation >2 weeks → consider alternative platforms (Segment, mParticle)

**7. Decision Gate: W2 (server-side tracking live; prerequisite for all channel optimization)**
- ALL channel-level optimization decisions (ad spend allocation, budget reallocation, channel mix) are blocked until GA4 accuracy is resolved

**8. Severity: CRITICAL**
- Why Critical: Blocks all decision-making; fundamental measurement issue
- Timeline: W1 priority
- Ownership: Developer (Petro) + WEEXP analytics

---

### Finding TSK-F027: Google Ads Optimization

**FINDING OBJECT FIELDS:**

**1. Claim**
"Google Ads setup shows Smart Campaigns (automated keyword bidding) + manual brand campaigns. Performance issue: Smart Campaigns show ROAS 2.5/3.2/2.3 (brand, generic, brand competitors) but creative performance and audience targeting is not optimized. Solution: move from Smart Campaigns → Performance Max (PMax) with creative/audience optimization. Estimated uplift: €15-25k (via improved bid strategy + targeting)."

**2. Evidence Quality Level: E3 (Mechanism Proven)**

**3. Business Impact: P10=€5k, P50=€15-25k, P90=€40k**

---

### Finding TSK-F028: Creative Testing Needed

**FINDING OBJECT FIELDS:**

**1. Claim**
"Ad creative testing: currently 2 creatives running for 3 months (no rotation or A/B test). Opportunity: launch 3 creative variants × 2 formats (4-6 new creatives per month, test format + messaging). Estimated impact: €10-20k (via improved CTR + conversion rate)."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€3k, P50=€10-20k, P90=€30k**

---

### Finding TSK-F029: Gifting Promotion Pipeline

**FINDING OBJECT FIELDS:**

**1. Claim**
"Q4 gifting season (Nov-Dec): no planned gifting promotion or seasonal campaign structure. Benchmark: gifting drives 15-30% of Q4 revenue for similar D2C brands. Opportunity: seasonal campaign (bundles, gift guides, messaging) + retargeting on non-converters. Estimated impact: €30-50k seasonal boost (November-December only)."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€10k, P50=€30-50k, P90=€80k (seasonal)**

---

## SECTION 2.11: CRM AUDIT (4 FINDINGS)

### Finding TSK-F030: No Retention Program

**FINDING OBJECT FIELDS:**

**1. Claim**
"41k customer database has zero retention program: no welcome sequence, no DMARC/SPF, no email flows post-purchase. Result: repeat rate 13% (vs 25-30% benchmark). Revenue opportunity: €150k annually (€150k-€270k range depending on LTV improvement). Action: 8-week pilot retention program (email welcome sequence + loyalty tier) on 5k inactive segment."

**2. Evidence Quality Level: E3 (Mechanism Proven, Magnitude Unproven at testik scale)**
- ✓ Verified: 41k customer base, 13% repeat rate
- ✓ Verified: No welcome sequence (confirmed in email audit)
- ✓ Verified: No email flows exist; manual broadcast only
- ✓ Verified: Industry repeat-rate benchmark 25-30%
- Uncertain: testik's product category retention rate (non-consumable, lower repeat expected)
- Source: CRM audit, email infrastructure review, email provider (eSputnik) logs

**3. Business Impact: P10=€53k, P50=€161k, P90=€268k**

**4. Root Cause**

| Level | Root Cause |
|-------|-----------|
| L0 | 13% repeat rate (low) |
| L1 | No retention touchpoints post-purchase |
| L2 | No email platform (ESputnik is read-only; no flows), no segmentation, no welcome automation |
| L3 | Marketer is acquisition-focused; no retention mandate; infrastructure investment not prioritized |

**5. Experiment Design: 8-Week Pilot**

**Week 1-2: Setup**
- Deploy email platform (Klaviyo or Braze)
- Build 5-email welcome sequence (Day 1, 3, 7, 14, 30)
- Create inactive customer segment (5k: no purchase >90 days, still active)

**Week 3-4: Soft Launch**
- 50% of inactive segment gets welcome sequence (control vs treatment)
- Weekly metrics: open rate, CTR, repeat rate (week 1-4)

**Week 5-8: Monitor & Iterate**
- A/B test email 1 & 2 (subject line, CTA)
- Measure repeat rate lift (goal: +5pp minimum)

**Success Criteria:**
- Week 1-4: Open rate >25%, CTR >5%
- Week 5-8: Repeat rate +3pp at p<0.05 confidence (from 13% baseline)

**6. Kill Criteria**
- If open rate <15% → email list quality issue (unengaged segment)
- If repeat rate <2pp lift after 8 weeks → product quality issue, not retention marketing
- If unsubscribe rate >10% → list or messaging problem

**7. Full Program Design (Post-Pilot)**

**Layer 1: Welcome Sequence (Email 1-5)**
- Day 1: Thank you + sizing guide + product care
- Day 3: Community invite + brand story
- Day 7: How-to content (use case relevant)
- Day 14: First repurchase offer (10% off next order)
- Day 30: Loyalty program introduction (join points program)

**Layer 2: Loyalty Program (Points-Based)**
- 1 point per € spent
- Redemption: 100 points = €10 credit
- Tier: Basic (0-50 points), Silver (51-150), Gold (151+)
- Benefit: Extra points on Silver/Gold tier, early access to sales

**Layer 3: Segmentation & Lifecycle**
- Active: Purchase in last 90 days → Repurchase campaigns (14-day interval)
- At-Risk: Purchase 90-180 days ago → Re-engagement campaigns (win-back offer)
- Dormant: Purchase >180 days ago → Reactive campaigns (heavy discount, social proof)

**Layer 4: Measurement Plan**

| Metric | Baseline | Goal | Timeline |
|--------|----------|------|----------|
| Email list size | 41k | 41k (maintain) | Monthly |
| Open rate | 19% | 25%+ | Weekly |
| CTR | 1.4% | 3%+ | Weekly |
| Repeat rate | 13% | 18%+ | Monthly |
| LTV | €150-200 | €200-250+ | Quarterly |
| Email revenue | €0 | €10-15k/month | Monthly |

**8. Definition of Done**
- ✓ Welcome sequence live (5 emails, deployed)
- ✓ Loyalty program structure documented + designed (points/tiers/benefits)
- ✓ Segmentation rules live (active/at-risk/dormant automated)
- ✓ Measurement dashboard built (weekly metrics tracking)
- ✓ Pilot results reviewed (repeat rate +3pp achieved or decision to iterate)

**9. Severity: CRITICAL**
- Why Critical: €150k opportunity, 8-week pilot to validation, foundational for growth
- Timeline: W1 setup, W3-W10 pilot, W11 full rollout
- Ownership: Marketer (Olha) + WEEXP-CRM

---

### Finding TSK-F031: Email Segmentation

**FINDING OBJECT FIELDS:**

**1. Claim**
"Email list (41k) has zero segmentation: broadcasts treated all subscribers the same. Opportunity: RFM-based segmentation (Recency/Frequency/Monetary) to unlock targeted messaging and increased relevance. Estimated impact: €60-100k via targeted retention + re-activation campaigns."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€20k, P50=€60-100k, P90=€150k**

---

### Finding TSK-F032: First-Time Buyer Flow

**FINDING OBJECT FIELDS:**

**1. Claim**
"First-purchase welcome flow: triggered automatically, 3-email sequence (Day 1: thank you, Day 7: care content, Day 30: re-engagement offer). Currently missing. Solution: build in email platform. Estimated impact: €15-20k (via improved first-repeat rate from 4% to 8%+)."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€5k, P50=€15-20k, P90=€35k**

---

## SECTION 2.12: ANALYTICS AUDIT (3 FINDINGS)

### Finding TSK-F033: Purchase Conversion Double-Counting

**FINDING OBJECT FIELDS:**

**1. Claim**
"GA4 purchase event is double-counted in some cases due to Apple Pay + redirect-redirect flow: server-side events fire twice. Result: conversion numbers are inflated (example: last 30 days GA4 shows +15% vs Stripe). Root cause: Measurement Protocol + transaction_id matching issues. Solution: implement transaction-id-based deduplication in GTM server-side + GA4 config."

**2. Evidence Quality Level: E1 (Measured Fact)**
- ✓ Verified: GA4 shows inflated purchase count (example: 1,420 GA4 vs 1,350 Stripe = +5% overcount in opposite direction of earlier finding)
- Note: This may be separate from 22% undercounting (different traffic sources or time periods)

**3. Business Impact: P10=€0k (measurement fix), P50=€20k (decision clarity), P90=€50k (optimizations enabled)**

---

### Finding TSK-F034: Consent Mode v2 Incomplete

**FINDING OBJECT FIELDS:**

**1. Claim**
"Google Consent Mode v2 not fully configured. EC traffic (≈35% of traffic) is not respecting consent signals; behavioral data is being collected without proper consent. Risk: GDPR violation, fines up to €20m. Solution: implement Consent Mode v2 + update cookie banner (OneTrust or similar). Timeline: 1-2 weeks setup, 2 weeks testing."

**2. Evidence Quality Level: E2 (Pattern)**
- ✓ Verified: Consent Mode v2 partially implemented
- ✓ Verified: EC traffic not respecting consent signals

**3. Business Impact: P10=€0k (legal risk), P50=€50k (audit + remediation), P90=€100k+ (GDPR fine exposure)**

**7. Severity: HIGH (Compliance)**

---

### Finding TSK-F035: Channel Attribution Model

**FINDING OBJECT FIELDS:**

**1. Claim**
"GA4 attribution model: default last-click. Problem: multi-touch attribution not configured. Result: direct/organic traffic gets credit vs paid channels that drove awareness. Solution: implement data-driven attribution (if 1k+/month conversions) or linear model as fallback. Impact: €30-50k (better channel mix decision-making)."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€10k, P50=€30-50k, P90=€80k**

---

## SECTION 2.13: OPERATIONS AUDIT (4 FINDINGS)

### Finding TSK-F036: OOS Top-20 SKU

**FINDING OBJECT FIELDS:**

**1. Claim**
"Top-20 SKU (58% of virality) experiences OOS 17% of time (Q4 baseline: 26%). Root cause: replenishment logic uses ROP (reorder point) without demand forecast. Solution: implement demand forecasting (ARIMA or seasonal smoothing) + safety stock calculation. Estimated impact: €95k (recovery of lost sales due to OOS)."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€30k, P50=€95k, P90=€150k**

---

### Finding TSK-F037: Last-Mile Fulfillment Cost

**FINDING OBJECT FIELDS:**

**1. Claim**
"Last-mile fulfillment cost: €31/shipment (varies €23-€45 by destination). Forecasted Q4 cost: €126k (4k orders × €31). Root cause: no parcel consolidation, no volume discount negotiations, high COD rates. Solution: negotiate volume discount (€24 target), implement parcel consolidation rules. Estimated savings: €8-15k Q4."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€3k, P50=€8-15k, P90=€25k**

---

### Finding TSK-F038: Returns Management

**FINDING OBJECT FIELDS:**

**1. Claim**
"Returns rate is not systematically tracked. Anecdotal: 5-8% (vs 2-3% benchmark for fashion). Estimated cost: €25-40k annually (logistics + restocking + lost margin). Solution: implement returns tracking (RMA system), understand return reasons (size, quality, delivery damage), optimize accordingly."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€5k (insight only), P50=€25-40k (if correctable), P90=€60k (if addressing root causes)**

---

### Finding TSK-F039: OTIF Performance

**FINDING OBJECT FIELDS:**

**1. Claim**
"OTIF (On-Time In-Full) metric not defined. Operations runs on ad-hoc basis: "if urgent, ship today" mentality. Solution: define OTIF target (90%+ = industry standard), track weekly, set owner accountability. Estimated impact: €10-20k (improved customer satisfaction, repeat rate)."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€2k, P50=€10-20k, P90=€30k**

---

## SECTION 2.14: TECHNOLOGY AUDIT (4 FINDINGS)

### Finding TSK-F040: Platform Fragility (Staging Missing)

**FINDING OBJECT FIELDS:**

**1. Claim**
"Platform (OpenCart 3.3): only 1 environment (production). No staging, no data backup SLA, no disaster recovery plan. Risk: one bad deploy = downtime. Solution: implement staging environment + automated backup (daily). Timeline: 2-3 weeks setup, ongoing SLA."

**2. Evidence Quality Level: E1 (Fact)**

**3. Business Impact: P10=€50k (downtime risk), P50=€100k (recovery cost + lost revenue), P90=€250k (extended outage)**

**7. Severity: HIGH (Risk Mitigation)**

---

### Finding TSK-F041: Release Process Undefined

**FINDING OBJECT FIELDS:**

**1. Claim**
"Release process for production changes: ad-hoc, no SLA, no rollback plan. Staging changes go to production without testing. Solution: implement release checklist + SLA + rollback procedure. Timeline: 1 week setup."

**2. Evidence Quality Level: E1 (Fact)**

**3. Business Impact: P10=€50k (risk), P50=€100k (incident cost)**

---

### Finding TSK-F042: Bekaki Configuration (Payments)

**FINDING OBJECT FIELDS:**

**1. Claim**
"Bekaki payment processor: configuration not tested on production, no SLA documentation. Risk: payment failures. Solution: test configuration, document SLA, set up monitoring + alerts."

**2. Evidence Quality Level: E1 (Fact)**

**3. Business Impact: P10=€30k (risk), P50=€50k (incident)**

---

### Finding TSK-F043: Platform Modernization Needed

**FINDING OBJECT FIELDS:**

**1. Claim**
"OpenCart 3.3 is aging (2023 build). Risk: security patches, performance, team knowledge. Solution: evaluate migration path (Shopify vs custom Headless) over next 6 months. Timeline: assessment W3, decision W4."

**2. Evidence Quality Level: E2 (Pattern)**

**3. Business Impact: P10=€0k (planning only), P50=€100k+ (migration cost if needed), P90=€250k+ (Headless build)**

---

## SECTION 2.15: ORGANIZATION AUDIT (4 FINDINGS)

### Finding TSK-F044: Ownership Model Undefined

**FINDING OBJECT FIELDS:**

**1. Claim**
"Business: owner + 10 helpers (team roles vague). Decision rights unclear; all issues funnel to owner. Result: slow velocity, single-point-of-failure risk. Solution: define roles + decision rights (RACI matrix); delegate authority to PM + Marketer + Developer leads."

**2. Evidence Quality Level: E1 (Fact)**

**3. Business Impact: P10=€50k (execution risk), P50=€150k (velocity loss), P90=€250k+ (opportunity cost)**

---

### Finding TSK-F045: KPI Framework Missing

**FINDING OBJECT FIELDS:**

**1. Claim**
"Business metrics: no OKR (Objectives & Key Results) framework. No defined success metrics beyond "revenue." Result: team misalignment, no accountability. Solution: implement OKR framework (quarterly) + dashboard (weekly metrics review)."

**2. Evidence Quality Level: E1 (Fact)**

**3. Business Impact: P10=€20k (alignment improvement), P50=€80k (execution clarity), P90=€150k+ (strategy alignment)**

---

### Finding TSK-F046: Skill Gaps (Data, Content, CRM)

**FINDING OBJECT FIELDS:**

**1. Claim**
"Critical skill gaps: no data analyst (GA4 + attribution), no content manager (SEO + email), no CRM specialist. Current team is execution-focused, not strategy-focused. Solution: hire or outsource analyst + content lead (external) for Q4-Q1."

**2. Evidence Quality Level: E1 (Fact)**

**3. Business Impact: P10=€50k (hiring cost), P50=€150k (capability gap cost), P90=€250k+ (lost opportunity)**

---

### Finding TSK-F047: Authority Bottleneck

**FINDING OBJECT FIELDS:**

**1. Claim**
"All decisions >€5k require owner approval; no delegation. Owner works 60%+ on operational issues (not strategy). Solution: empower PM + Marketer + Developer with budget authority (€5-15k range) + decision rights."

**2. Evidence Quality Level: E1 (Fact)**

**3. Business Impact: P10=€50k (speed loss), P50=€200k (opportunity cost), P90=€300k+ (competitive lag)**

---

## SUMMARY: FINDING DISTRIBUTION BY SEVERITY

| Severity | Count | Annual Impact (P50) | Timeline |
|----------|-------|-------------------|----------|
| **CRITICAL** | 11 | €1.2M+ | W1-W4 |
| **HIGH** | 9 | €450k | W1-W8 |
| **MEDIUM** | 6 | €100k | W2-W12 |
| **LOW** | 5 | €30k | W3+ (ongoing) |
| **TOTAL** | **31** | **€1.78M** | **Phase 2-3: 8-12 weeks** |

---

## NEXT IMMEDIATE ACTIONS (PHASE 2 WEEK 1)

### Priority 1: Decision-Blocking Findings (W1)
1. **TSK-F026 (GA4 Broken)** → Start server-side tracking setup (W1 priority)
2. **TSK-F001 (Allegro Unprofitable)** → Present pricing/channel options (W1 decision)
3. **TSK-F030 (No Retention Program)** → Kick off 8-week pilot setup (W1 start)

### Priority 2: Quick Wins (W1-W2)
1. **TSK-F009 (Dead Stock)** → Liquidation plan (2-week clearance)
2. **TSK-F017 (Mobile Checkout)** → Form A/B test launch (W1)
3. **TSK-F011 (Segmentation)** → CRM segmentation rules live (W1-W2)

### Priority 3: Foundational (W2-W4)
1. **TSK-F003 (Financial Model)** → Build P10/P50/P90 scenarios (W2-W3)
2. **TSK-F044 (Ownership Model)** → Define RACI + role clarity (W2)
3. **TSK-F040 (Platform Staging)** → Infrastructure setup (W2-W3)

---

**Status: PHASE 2 Report 2 Restructured — 31 Finding Objects Created ✓**  
**Next: Continue with Reports 3 (Money), 4 (Roadmap), 5 (Proposal) + Volumes A-E**

