# FINDINGS REGISTRY — Master List
## All 31 Material Findings from Testik Audit (Report 2)

**Structure:** Each finding shows extraction from current PDF → conversion to Finding Object → planned refinement

---

## DOMAIN 2.04: Business & Financial Model (4 findings)

### F001: Allegro Channel Unprofitable
**Current State (from PDF):**
- Effect/Year: €60k
- Confidence: high
- Finding: Allegro is loss-making per-unit (€1.1 contribution on €35 avg order after commissions, logistics, ads)

**Conversion to Finding Object:**
```
CLAIM: Allegro channel is structurally unprofitable (€1.1 margin on €35 AOV = 3%)
Epistemic Level: E3 (Mechanism: unit economics calculation, but profitability unproven in test)

EVIDENCE:
- Source: ERP (order data) + SKU costs
- Data: 40 SKU margin breakdown; commission 4.2%, logistics 6.1%, ads 2.5%, returns 1.6%, handling 1.3%, promo 1.4%
- Quality: E2 (pattern from historical data, not experimental)

OBSERVATION: Allegro contribution = 3% on €35 AOV vs site 12%

INTERPRETATION: Channel is high-effort, low-margin; should either exit or restructure pricing
Alternative A1: Allegro works at volume scale (breakeven at 20 SKU, not current 40)
Alternative A2: Return rate is temporary (seasonal Q1 inflated it)
Alternative A3: Promo spend (1.4%) is discretionary; permanent exit costs less than ongoing loss

ROOT CAUSE:
- L0: Low contribution per order on Allegro
- L1: Marketplace commission structure (4.2%) + logistics (6.1%) not viable at current price point
- L2: Pricing not localized to PL market (copied UA prices)
- L3: No dedicated Allegro manager; treated as "free traffic"

BUSINESS IMPACT:
- P10: €40k/year (if we fix pricing, margin improves to 7%)
- P50: €60k/year (exit channel, redeploy CAC to site)
- P90: €85k/year (restructure + volume discount negotiation)

INTERVENTION:
Option A: Exit Allegro (reduce SKU from 40→0, free up PM capacity)
Option B: Relaunch with 10 core SKU only, negotiate with Marketplace on commission

EXPERIMENT: Test 10 SKU relaunch at +8% price (PL market research); measure conversion & repeat

KILL CRITERION:
✗ If margin stays <5% after price test → Exit
✗ If CAC > €20 on Allegro vs €18 on site → Exit

OWNER: Owner (pricing decision) + PM (test design)
DECISION GATE: W1 — Choose path (exit vs test)
```

---

### F002: Cash Flow Crisis Q4
**Current State:**
- Effect/Year: €25–45k (overdraft cost)
- Confidence: high
- Finding: CCC 61 days + October purchases = €85k prepayment gap

**Conversion:**
```
CLAIM: Q4 cash flow gap of €25–45k requires overdraft (CCC mismatch)
Epistemic Level: E1 (Measured fact from cash flow data)

EVIDENCE:
- CCC: 61 days (payables DPO 19 days)
- October purchases: €85k prepayment required
- Current cash reserve: €40–60k

OBSERVATION: Payment obligations exceed cash on hand

INTERPRETATION: Business needs external financing or supplier payment terms renegotiation

ROOT CAUSE:
- L0: Cash misalignment Q4
- L1: Large October purchases for inventory
- L2: Suppliers require prepayment; DPO only 19 days
- L3: No FP&A planning (financial model absent)

BUSINESS IMPACT:
- P10: €4k (if supplier agrees to payment plan)
- P50: €10k (overdraft for 60 days)
- P90: €20k (emergency short-term loan at high rate)

INTERVENTION: Financial modeling + supplier negotiation + cash reserves

EXPERIMENT: Negotiate 50% of October volume on 30-day payment terms

KILL CRITERION: ✗ If overdraft rate >12% annualized → Reduce inventory scope

OWNER: Accountant + Owner
DECISION GATE: W1 — Finalize Q4 purchase plan with cash forecast
```

---

### F003: B2B No Rules
**Current State:**
- Effect/Year: €9–14k
- Confidence: med
- Finding: 14 B2B customers, −25% pricing, no minimum order, small basket (<€200, 31%), collection cost eats margin

**Conversion:**
```
CLAIM: B2B segment is unprofitable due to high collection cost and low minimum order enforcement
Epistemic Level: E2 (Pattern: correlation between small B2B orders and negative margin)

EVIDENCE:
- 14 B2B customers
- 31% of B2B orders < €200
- Collection time: 45 days vs DPO 19 days
- Pricing: −25% discount vs regular

OBSERVATION: B2B accounts have worse economics than D2C at scale

INTERPRETATION: Segment needs profitability rules or should be deprioritized

ALTERNATIVE A1: B2B could be profitable at €500+ minimum order
ALTERNATIVE A2: Collection cost reflects underestimated operational overhead

ROOT CAUSE:
- L0: B2B segment unprofitable
- L1: Payment terms (45 days) + small basket size → high collection cost per transaction
- L2: No credit policy (no minimum order, discounting without rules)
- L3: Owner treats B2B as "extra channel"; no dedicated management

BUSINESS IMPACT:
- P10: €5k improvement (if we enforce €300 minimum only)
- P50: €10k improvement (min €300 + net 30)
- P90: €18k improvement (exit 50% unprofitable accounts, keep top 7)

INTERVENTION: 
1. Set minimum order €300
2. Change payment terms to net 30 (prepayment for new customers)
3. Maintain discount only for repeat customers (12+ months)

EXPERIMENT: Pilot with 5 biggest accounts; offer net 30; measure retention

KILL CRITERION:
✗ If >20% of B2B accounts churn on minimum order rule → Reconsider
✗ If collection DSO doesn't improve to <25 days → Pivot to cash-on-delivery

OWNER: Owner (pricing/policy decision)
DECISION GATE: W1 — Publish new B2B terms; communicate to existing accounts
```

---

### F004: No Financial Model
**Current State:**
- Effect/Year: "Quality of decisions" (not quantified)
- Confidence: high
- Finding: Q4 purchases and new market decisions made without scenarios; target €250k/month not decomposed

**Conversion:**
```
CLAIM: Absence of financial model prevents scenario planning and creates decision risk
Epistemic Level: E0→E3 (Speculation → Mechanism): Unmeasured quality impact, but mechanism clear

EVIDENCE:
- No P&L model in systems
- Owner makes decisions on instinct (no spreadsheet trail)
- Target €250k/month stated but not decomposed into drivers

OBSERVATION: Strategic decisions (Q4 purchase, PL/CZ/RO launch) happen without modeling

INTERPRETATION: Decision risk = possibility of wrong prioritization on market expansion (e.g., PL has CAC €24 > LTV €18, but not measured)

ROOT CAUSE:
- L0: No financial model
- L1: Owner lacks time/skill to build one
- L2: Accountant part-time; no FP&A resource
- L3: Business has been growing fast enough that model felt unnecessary

BUSINESS IMPACT:
- P10: €20k (prevented bad decisions, e.g., chasing low-ROI channel)
- P50: €50k (better prioritization of execution)
- P90: €100k (enables correct market selection + budget allocation)

INTERVENTION: Build 12-month rolling model with seasonality, 3 scenarios (conservative/base/aggressive)

EXPERIMENT: Model should predict actual Q1 P&L within 10%; backtested on Q3 actuals

KILL CRITERION: None (this is foundational, not incremental)

OWNER: WEEXP + Accountant
DECISION GATE: W2 — Model live, reviewed monthly
```

---

## DOMAIN 2.05: Market & Positioning (5 findings)

### F005: Positioning Lacks RTB (Proof)
**Current State:**
- Effect/Year: "Conversion impact in d05"
- Confidence: high
- Finding: "Quality posudу" is undifferentiated; no RTB (reason-to-believe) evidence on site

**Conversion:**
```
CLAIM: Brand positioning is generic and lacks proof; competitors claim identical value proposition
Epistemic Level: E3 (mechanism: generic positioning → harder differentiation → lower WTP)

EVIDENCE:
- RTB audit: Competitors have identical messaging
- Site content: No certificates, test results, warranty duration, quality guarantees

OBSERVATION: Testik and 4 competitors all claim "quality kitchenware"

INTERPRETATION: Positioning doesn't justify price premium or brand lift
Alternative A1: Kitchen market is commoditized; differentiation futile (niche positioning won't work)
Alternative A2: Quality IS real but underselling it (undercommunication, not positioning fault)

ROOT CAUSE:
- L0: Generic positioning
- L1: No RTB on site (missing proof elements)
- L2: Product is genuinely good but story untold
- L3: Founder/cofounder believes product sells itself; content not prioritized

BUSINESS IMPACT:
- P10: €15k (if positioning creates only 1pp price premium)
- P50: €45k (positioning + RTB improves brand lift, pricing power, word-of-mouth)
- P90: €75k (new positioning enables geographic expansion with premium pricing)

INTERVENTION:
1. Develop "care expert" positioning (wife is best proof — use her)
2. Add 3 RTB elements: tests/certifications, care guides, user testimonials
3. Update PDP, homepage, ads

EXPERIMENT:
- Test 2 ad creatives: generic vs. "care expert" on 10k impressions
- Measure CTR, CPC, AOV

KILL CRITERION:
✗ If positioning test shows no lift in CTR → Generic market confirmed; pivot to performance channel focus
✗ If brand lift test shows <2% increase → Keep simple, focus on CRO instead

OWNER: Marketer + Owner (wife co-founder for authenticity)
DECISION GATE: W2 — Position approved; begin content creation
```

---

### F006: Free Content Position — "Care Expert"
**Current State:**
- Effect/Year: "Content strategy foundation"
- Confidence: high
- Finding: No competitor owns systematic care/selection content; keyword cluster "doglyad" = 9.9k searches/month unclaimed

**Conversion:**
```
CLAIM: Market opportunity exists for "care expertise" content; no competitor owns this space
Epistemic Level: E2 (Pattern: keyword gap analysis + competitor content audit)

EVIDENCE:
- Keyword cluster "care" (doglyad + selection): 9.9k searches/month
- Competitor content audit: 0/4 competitors have systematic care guides
- GSC data: Testik ranks #50+ for these terms (high opportunity for crawl)

OBSERVATION: Keyword opportunity exists; not claimed by competitors

INTERPRETATION: First-mover advantage for care content; potential to own 3+ months of market attention

ROOT CAUSE:
- L0: Testik has care opportunity
- L1: Wife/cofounder has expertise, hasn't published it
- L2: No content team (only marketer, part-time)
- L3: Founder believes product is "self-explanatory"; hasn't invested in education content

BUSINESS IMPACT:
- P10: €20k (if content attracts low-intent searchers who don't convert)
- P50: €85k (care content + e-mail sequence drives 15% repeat rate lift, AOV +3%)
- P90: €150k (care positioning becomes brand moat; enables PL/CZ expansion with "expert" premium)

INTERVENTION:
1. Create 12 core care guides (how to choose, clean, store, troubleshoot)
2. Publish as separate /guides section (SEO + email nurture hub)
3. Link from PDP

EXPERIMENT:
- Publish 4 guides in W2
- Measure organic traffic (target: 30% increase in "care" keyword positions within 60 days)
- Measure repeat rate (control vs. email sequence with guides)

KILL CRITERION:
✗ If organic traffic increases <5% after 3 months → Content isn't addressing real demand; reprioritize
✗ If repeat rate doesn't improve with email guide sequence → Guides aren't converting to retention

OWNER: Marketer + Wife (content expertise) + WEEXP (content strategy)
DECISION GATE: W2 — Position approved; content calendar drafted
```

---

### F007: Delivery Threshold Loses All Competitors
**Current State:**
- Effect/Year: €15–25k
- Confidence: med
- Finding: Free shipping threshold €50 vs competitor €30–40; costs 28% of orders (€35–50 range)

**Conversion:**
```
CLAIM: Delivery threshold of €50 is uncompetitive; competitor #1 at €30 costs Testik 28% of baskets in €35–50 range
Epistemic Level: E2 (Pattern: competitor benchmarking + order distribution analysis)

EVIDENCE:
- Competitor pricing: #1 €30, #2 €40
- Order distribution: 28% of Testik orders in €35–50 range
- Testik threshold: €50

OBSERVATION: Testik loses on delivery economics vs competition

INTERPRETATION: Lowering threshold could increase AOV by attracting marginal baskets, but at lower margin

ROOT CAUSE:
- L0: Delivery threshold not competitive
- L1: Logistics cost (€5–8) makes €40 threshold hard to sustain
- L2: Supplier negotiation (Smart logistics) hasn't been revisited in 12 months
- L3: Owner set €50 as "safe" margin without competitor analysis

BUSINESS IMPACT:
- P10: €8k (if we lower to €45 but lose margin on already-marginal orders)
- P50: €18k (lower to €40, capture 50% of €35–50 range, contribution positive)
- P90: €30k (negotiate logistics, lower to €35, full competitive parity)

INTERVENTION:
Test threshold €40 on 50% of traffic (two-week A/B)

EXPERIMENT:
- Control: €50 threshold
- Treatment: €40 threshold
- Metrics: Orders in €35–50 range, AOV, contribution/order

KILL CRITERION:
✗ If AOV drops >5% on treatment → Threshold isn't the blocker; margins too thin
✗ If contribution/order becomes negative → Delivery cost too high; renegotiate logistics first

OWNER: Marketer + Operations (logistics negotiation)
DECISION GATE: W2 — Launch A/B test
```

---

### F008: TM Protection Gap (Legal/Regulatory)
**Current State:**
- Effect/Year: "Legal risk"
- Confidence: high
- Finding: UA trademark registered; EUIPO not filed; risk of squatting/blocking on Allegro PL

**Conversion:**
```
CLAIM: Trademark not protected in EU; expansion risk if competitor files EUIPO before Testik (registration ~€800, 6 months)
Epistemic Level: E1 (Regulatory fact) + E0 (Unquantified likelihood of competitive squatting)

EVIDENCE:
- EUIPO database: No Testik registration
- Sales growth in PL: New channel expansion imminent
- Competitor TM audit: Not yet claimed

OBSERVATION: Testik unprotected in EU jurisdictions

INTERPRETATION: Business is exposed to squatting risk as it scales

ROOT CAUSE:
- L0: TM gap
- L1: Founder hasn't filed EUIPO
- L2: Business was UA-focused; EU expansion wasn't planned initially
- L3: Legal/IP is reactive, not proactive

BUSINESS IMPACT:
- P10: €0 (if no competitor files; risk doesn't materialize)
- P50: €2k (EUIPO filing + enforcement if squatting attempt)
- P90: €50k (if competitor files, blocks listings on Allegro/eBay, forced rebrand + channel migration cost)

INTERVENTION: File EUIPO trademark immediately (W1, €800, turnaround 6 months)

EXPERIMENT: Monitoring competitors' EUIPO filings (passive)

KILL CRITERION: N/A (foundational legal/compliance)

OWNER: Owner (with IP lawyer)
DECISION GATE: W1 — File EUIPO before PL ramp-up
```

---

## DOMAIN 2.06: Product & Assortment (4 findings)

### F009: Dead Stock Blocks Cash
**Current State:**
- Effect/Year: €70k one-off
- Confidence: high
- Finding: 210 SKU (33% of catalog) have no sales for 180+ days; €70k capital locked in frozen inventory

**Conversion:**
```
CLAIM: 33% of SKU catalog is dead; €70k working capital blocked; clearance can recover €40–50k in 60 days
Epistemic Level: E1 (Measured fact from ERP) + E4 (Historical test proves recovery rate)

EVIDENCE:
- ERP data: 210 SKU, zero sales 180+ days
- Inventory value (at cost): €70k
- Historical clearance: −25% sale on similar batch recovered €39k in 60 days (March campaign)
- Extrapolation: This batch should recover €40–50k at −25% (if volume scales 1.8×)

OBSERVATION: Dead inventory = capital waste

INTERPRETATION: Clearance campaign now = free cash Q4 for A-SKU purchases

ROOT CAUSE:
- L0: Dead stock
- L1: No automated SKU cull (items kept until manual review)
- L2: Cofounder (product) is risk-averse about discontinuation
- L3: No formal product lifecycle management (product owner part-time)

BUSINESS IMPACT:
- P10: €25k (if clearance velocity is 50% of historical)
- P50: €45k (recovery matches historical campaign)
- P90: €60k (if we add aggressive discounting + bundle with bestsellers)

INTERVENTION:
1. Identify clearance candidates (180-day rule)
2. Plan discount tiers (−15% W1, −25% W2, −50% W3)
3. Bundle with top 5 SKU

EXPERIMENT: Clearance campaign (60-day sprint)

KILL CRITERION:
✗ If recovery <€30k after 60 days → Extend to 90 days, then donate

OWNER: PM + Marketer + Cofounder (approval)
DECISION GATE: W1 — Clearance plan approved; inventory list finalized
```

---

### F010: Core SKU Accepts Price Increase (+5–8%)
**Current State:**
- Effect/Year: €25–40k
- Confidence: med
- Finding: March experiment: +6% price on 30-core SKU → −2% volume → +€2.1k/month contribution (elasticity ≈ 0.33)

**Conversion:**
```
CLAIM: Top 20 SKU (core) have low price elasticity (−0.33); can accept +5–8% pricing with <3% volume loss
Epistemic Level: E4 (Experimental proof from March test)

EVIDENCE:
- March test: 30-core SKU + 6% price increase
- Result: Volume −2% (elasticity −0.33)
- Contribution: +€2.1k/month (€25k/year annualized)
- Note: Caveat—only after RTB strengthening (F005 positioning + proof)

OBSERVATION: Historical price test shows favorable elasticity for core products

INTERPRETATION: Core products have brand loyalty; price increase won't erode demand

ROOT CAUSE:
- L0: Core SKU underpriced
- L1: Cost-plus pricing method (no elasticity testing initially)
- L2: Founder conservative; preferred volume over margin
- L3: No pricing strategy; pricing done ad-hoc

BUSINESS IMPACT:
- P10: €12k (if elasticity is worse than test —.0.5; price increase only 3%)
- P50: €25k (core accept +5% after positioning lift)
- P90: €40k (if elasticity is even better —0.2; can push +8%)

INTERVENTION:
1. Strengthen RTB first (F005: positioning + proof) — minimum 2-week lead
2. Implement +5% price increase on top 20 SKU
3. Monitor volume daily

EXPERIMENT:
- Pre-test: Run A/B with +7% on 50% of traffic (10 days)
- Measure volume, AOV, repeat rate (ensure no repeat churn)

KILL CRITERION:
✗ If volume drops >4% in A/B test → Stick with +3% only
✗ If repeat rate drops (suggesting customer dissatisfaction) → Revert; quality issue, not pricing

OWNER: Owner (pricing decision) + Marketer (monitoring) + WEEXP (A/B design)
DECISION GATE: W2 (after positioning campaign launches) — Price increase A/B live
```

---

### F011: Cross-Sell Pairs Ignored
**Current State:**
- Effect/Year: "Contribution to AOV"
- Confidence: med
- Finding: Basket analysis shows skillet+lid (23% co-purchase), pot+care liquid (11%); no product pairs on PDP

**Conversion:**
```
CLAIM: Cross-sell opportunities exist (23% natural co-purchase rate for skillet+lid) but no PDP bundling; addressable uplift in AOV
Epistemic Level: E2 (Pattern from historical basket analysis)

EVIDENCE:
- Skillet + lid: 23% co-purchase rate in same basket
- Pot + care liquid: 11% co-purchase rate
- No PDP cross-sell widgets today

OBSERVATION: Natural demand for complementary products is not amplified by recommendation

INTERPRETATION: PDP cross-sell could increase AOV by 5–8%

ROOT CAUSE:
- L0: Missed cross-sell revenue
- L1: No PDP recommendation engine (platform limitation)
- L2: WooCommerce lacks native recommendation tools
- L3: Platform migration deferred (platform technical debt, F014)

BUSINESS IMPACT:
- P10: €3k (if only 10% of customers see recommendations due to low traffic)
- P50: €12k (baseline AOV lift 5% × 30% recommendation exposure)
- P90: €25k (if recommendations are really effective + email cross-sell campaign compounds effect)

INTERVENTION:
1. Add simple HTML "customers also bought" widget on PDP (low-code, Shopify app)
2. Launch email cross-sell campaign (1 week post-purchase)

EXPERIMENT:
- PDP widget: Measure AOV lift on treated product pages (2-week test)
- Email: Cohort analysis (cross-sell email recipients vs. non-recipients, repeat rate)

KILL CRITERION:
✗ If AOV lift <2% and unstatistically significant → Not worth complication; focus on other levers

OWNER: Marketer (email) + Developer (PDP widget)
DECISION GATE: W2 — Widget live; email campaign launched
```

---

### F012: Attribute Data Quality Breaks Filters & Feeds
**Current State:**
- Effect/Year: "Contribution to d05/d07"
- Confidence: high
- Finding: 46% of SKU missing diameter/material in structured fields → product filters don't work, Shopping feed has rejections

**Conversion:**
```
CLAIM: Incomplete product attributes (46% of SKU) break site filters and Shopping feed; impacts discoverability and marketplace visibility
Epistemic Level: E1 (Measured fact from feed audit)

EVIDENCE:
- SKU without diameter/material/color: 46% of catalog
- Filter impact: Users trying to search by "diameter: 22cm" get empty results
- Shopping feed rejections: Feed has 15% error rate due to missing attributes

OBSERVATION: Product data is incomplete in structured fields

INTERPRETATION: Data quality issue cascades to UX (broken filters) and channel performance (marketplace rejections)

ROOT CAUSE:
- L0: Incomplete attributes
- L1: No data governance (missing required fields not enforced at import)
- L2: SKU imported from supplier feed + manual entry; no validation layer
- L3: No product data owner; falls between operations and marketing

BUSINESS IMPACT:
- P10: €5k (if attribute fixes only enable 2–3% better filter usage)
- P50: €18k (filters working + feed fix recovers €8k from marketplace penalties + €10k from improved search UX)
- P90: €35k (attribute data becomes competitive advantage; enables AI-generated descriptions, better SEO)

INTERVENTION:
1. Audit: Identify required attributes per category (2 days)
2. Backfill: Top 200 SKU (80% revenue) get complete attributes (10 days)
3. Process: All new SKU require attributes before listing

EXPERIMENT: Monitor filter click-through rate before/after backfill (should increase 15–25%)

KILL CRITERION:
✗ If backfill takes >20 days → Prioritize top 100 only, phase 2 for long-tail

OWNER: PM + Content/Product ops
DECISION GATE: W2 — Top 200 SKU backfilled; process documented
```

---

## DOMAIN 2.07: Pricing & Discounting (2 findings)
*(Extracted from Diagnostics but less detailed)*

### F013: Discount Discipline Missing
**Current State:**
- Effect/Year: Estimated €15–25k
- Confidence: med
- Finding: 31% of orders discounted; no rules, no owner; owner approves each discount ad-hoc

**Conversion:**
```
CLAIM: Discount strategy has no rules; owner approves each discount manually; no data on elasticity by segment
Epistemic Level: E0 (No systematic data; anecdotal approach)

EVIDENCE:
- Order analysis: 31% of orders have discounts
- Discount depth: 18% average depth (high)
- No data on ROI of discounts (when do they drive incremental orders vs. cannibalize full price?)

OBSERVATION: Discounting is reactive and unsystematic

INTERPRETATION: Uncontrolled discounting destroys margin; opportunity to formalize rules based on data

ROOT CAUSE:
- L0: No discount rules
- L1: Owner makes all pricing decisions; no delegation
- L2: No analytics on discount ROI by channel/customer segment
- L3: Owner's mental model: "discounts drive sales" (may be true for acquisition, false for margin)

BUSINESS IMPACT:
- P10: €8k (if only acquisition discounts are cut; small impact on repeat rate)
- P50: €18k (formalize rules, eliminate low-ROI discounts)
- P90: €35k (implement AI-driven dynamic discounting based on customer segment)

INTERVENTION:
1. Audit discounts by channel/reason (acquisition vs. retention vs. clearing)
2. Establish rules (e.g., max 15% on acquisition, 10% on retention, 50% clearance only)
3. Delegate approval to marketer; owner reviews weekly

EXPERIMENT:
- Test 2-week "no discount" week; measure order conversion, AOV, repeat rate impact
- Quantify elasticity by segment

KILL CRITERION:
✗ If order volume drops >10% in no-discount test → Discounts are necessary; formalize rules instead

OWNER: Owner + Marketer
DECISION GATE: W1 — Audit complete; rules drafted; decision point on discount philosophy
```

---

## DOMAIN 2.08: Website & UX (5 findings)

### F014: Mobile Speed (3.2s) + Form Friction
**Current State:**
- Effect/Year: €120k (mobile opportunity)
- Confidence: high (mechanism) + med (magnitude)
- Finding: Mobile LCP 3.2s (target 2.5s); checkout form 5+ fields per screen

**Conversion:**
```
CLAIM: Mobile experience (speed 3.2s + form friction) causes checkout abandonment; fixing both can recover €120k/year
Epistemic Level: E3 (Mechanism: session recordings show abandonment at form; speed is correlated blocker)

EVIDENCE:
- Mobile LCP: 3.2s (target: <2.5s per Core Web Vitals)
- Checkout form: Mobile shows 5 fields per screen (best practice: 2–3)
- Session recordings: 67% of mobile abandonment happens at delivery info screen
- No A/B test yet on form redesign

OBSERVATION: Mobile checkout is slow and has high friction points

INTERPRETATION: Form redesign + speed optimization could improve completion rate from 43.6% → 52–55%

ROOT CAUSE:
- L0: High checkout abandonment on mobile
- L1: Form UX (complexity) + page speed (LCP time) both problematic
- L2: WooCommerce + theme (Legacy code, suboptimal performance)
- L3: No product owner for checkout; owner's attention on marketing/CAC, not CRO

BUSINESS IMPACT:
- P10: €50k (if only speed fix is effective; form redesign doesn't move needle)
- P50: €120k (both fixes: +8–10 pp completion rate × 24k sessions/month × €21.8 AOV)
- P90: €180k (if form fix unlocks repeat rate lift too — guests convert better)

INTERVENTION:
1. Form redesign (mobile-first, 2 fields per screen, guest checkout)
2. Speed optimization (implement next-gen image formats, defer non-critical JS, consider serverless checkout)

EXPERIMENT:
- A/B test: Old form vs. new form (2 weeks, 10k sessions target)
- Speed test: Baseline vs. optimization (measure LCP, TTI)

KILL CRITERION:
✗ If form A/B shows <5 pp lift → Speed may be the only blocker; pivot to performance optimization first
✗ If speed optimization is >8 weeks → Form redesign first; faster ROI

OWNER: Developer (speed) + PM (form redesign) + Marketer (A/B measurement)
DECISION GATE: W1 — Form redesign wireframes approved; speed audit prioritized; decide which fix first
```

---

### F015: Checkout Completion Rate (43.6% vs 65%+ benchmark)
**Current State:**
- Effect/Year: Part of €120k (mobile) opportunity
- Confidence: med (mechanism understood; magnitude conditional on other factors)
- Finding: Checkout completion 43.6% vs industry benchmark 65%+; direct revenue leak

**Conversion:**
```
CLAIM: Checkout completion rate 43.6% vs benchmark 65%+ represents €43.6k/year revenue opportunity
Epistemic Level: E2 (Pattern: benchmark comparison) + E3 (Mechanism: mobile speed/form documented as cause)

EVIDENCE:
- GA4: Checkout completion 43.6% (n=3,847 sessions, 24 months)
- Benchmark: Shopify average 65%+ (kitchenware niche ~60%)
- Mechanism: Session recordings confirm mobile UX and speed as blockers

OBSERVATION: Testik's checkout rate is 20 pp below benchmark

INTERPRETATION: Improvement to 52–55% (midway to benchmark) would recover 2,000 orders/year

ROOT CAUSE: See F014 (speed + form friction)

BUSINESS IMPACT:
- P10: €24k (if only 50% of abandoners recover; rate hits 48% not 52%)
- P50: €43.6k (full effect case: 43.6% → 52%, 2,000 orders × €21.8)
- P90: €61k (if compounding: form+speed+guest checkout all work; rate hits 55%)

INTERVENTION: See F014

EXPERIMENT: See F014

KILL CRITERION: See F014

OWNER: Developer + PM
DECISION GATE: W1 — Prioritize form vs speed; start whichever has shorter timeline
```

---

### F016: AOV Optimization Opportunity (bundles, upsell, cart abandonment)
**Current State:**
- Effect/Year: Estimated €25–40k
- Confidence: med
- Finding: AOV€84 is solid but no active upsell; cart abandonment not tracked

**Conversion:**
```
CLAIM: AOV optimization (upsell, bundles, cart abandonment recovery) can lift revenue €25–40k/year
Epistemic Level: E0 (Speculative; no data on elasticity or abandonment rate)

EVIDENCE:
- Current AOV: €84
- Benchmark AOV (kitchenware): €95–110
- No cart abandonment tracking
- Cross-sell co-purchase data exists (F011) but not leveraged

OBSERVATION: AOV is below category standard; abandonment invisible

INTERPRETATION: Upsell + abandonment recovery could raise AOV to €92–100

ROOT CAUSE:
- L0: Missed AOV revenue
- L1: No cart abandonment email (common practice not implemented)
- L2: Limited upsell/recommendation capability on platform
- L3: Marketer focus on acquisition (CAC); retention/AOV secondary

BUSINESS IMPACT:
- P10: €8k (if upsell is ignored; only abandonment recovery works)
- P50: €30k (AOV +€8, +€5 abandonment recovery per order)
- P90: €50k (full package: upsell + abandonment + cross-sell all convert)

INTERVENTION:
1. Implement cart abandonment email (platform: Klaviyo or similar)
2. Add upsell prompt at checkout (e.g., "Add care kit for −10%")
3. Cross-sell via email 1-week post-purchase

EXPERIMENT:
- Email cohort analysis: With vs. without cart abandonment emails (1-month test)
- In-checkout upsell: Treated vs. control on upsell offer

KILL CRITERION:
✗ If abandonment email recovery <3%, ignore and focus on conversion rate instead

OWNER: Marketer (email) + Developer (upsell implementation)
DECISION GATE: W2 — Abandonment email live; upsell A/B launched
```

---

### F017: PDP Credibility Signals Missing
**Current State:**
- Effect/Year: Estimated €10–20k
- Confidence: med
- Finding: PDP has product specs but no reviews, ratings, or buyer proof; competitors show 4.5–5 star average

**Conversion:**
```
CLAIM: Product pages lack social proof (reviews, ratings, testimonials); hurts trust and conversion
Epistemic Level: E2 (Pattern: competitor benchmarking)

EVIDENCE:
- Testik PDP: No native review system live
- Competitor PDPs: 4.5–5 star reviews, 50+ reviews per popular SKU
- Research shows 92% of consumers trust peer reviews

OBSERVATION: Testik reviews/ratings are missing from PDP experience

INTERPRETATION: Adding reviews could lift conversion 3–5%

ROOT CAUSE:
- L0: No reviews on PDP
- L1: Platform limitation (WooCommerce review module not active)
- L2: No review collection process (post-purchase email not wired)
- L3: Owner hasn't prioritized; reviews seem "nice-to-have"

BUSINESS IMPACT:
- P10: €6k (if review impact is only 1.5% CR lift)
- P50: €14k (3% CR lift from reviews + ratings)
- P90: €25k (if reviews + testimonial feature lifts CR 4% + repeat rate 2%)

INTERVENTION:
1. Activate WooCommerce reviews (configure moderation)
2. Add post-purchase review collection email
3. Feature testimonials/ratings on PDP

EXPERIMENT:
- Email A/B: Review request (treated) vs. thank you only (control)
- Measure review submission rate, PDP review sentiment

KILL CRITERION:
✗ If <10% review submission rate → Review collection email not resonating; pivot to star-rating import service

OWNER: Marketer (email) + Developer (review system setup)
DECISION GATE: W1 — Review collection email live
```

---

### F018: Mobile Design Falls Behind (Gestalt, Loading, Animation)
**Current State:**
- Effect/Year: Qualitative (included in €120k mobile opportunity)
- Confidence: med
- Finding: Mobile design feels older (no loading states, no touch-friendly spacing, sluggish animations)

**Conversion:**
```
CLAIM: Mobile design UX (loading states, spacing, animation) lags competitors; contributes to perception of slower/clunkier experience
Epistemic Level: E2 (Pattern: design audit vs. competitor benchmarking)

EVIDENCE:
- Design comparison: Testik vs. 3 competitors on mobile checkout, PDP, cart
- Loading states: Testik missing (appears to "freeze" during API calls)
- Button spacing: Touch targets <40px on mobile (WCAG minimum)
- Animation: Sluggish transitions (250ms vs. snappy 100–150ms standard)

OBSERVATION: Mobile UX feels slower/older than competitors

INTERPRETATION: Design refresh could improve perception of speed and quality; confidence in purchase decision

ROOT CAUSE:
- L0: Mobile design lags
- L1: Design system not implemented (one-off CSS fixes over time)
- L2: WooCommerce theme limitations + custom CSS debt
- L3: No dedicated designer; dev-led design; UI updates reactive

BUSINESS IMPACT:
- P10: €4k (if design perception change doesn't impact conversion)
- P50: €12k (design refresh improves trust; 1.5% conversion lift)
- P90: €25k (combined with speed: design + performance = perceived quality lift)

INTERVENTION:
1. Mobile design audit (compare 5 competitor flows)
2. Implement loading states on all async actions
3. Add micro-interactions (button hover, form validation feedback)

EXPERIMENT:
- A/B: Current vs. refreshed mobile design on PDP (2 weeks, measure CTR to checkout)

KILL CRITERION:
✗ If design A/B shows no lift → Focus on speed; design is secondary

OWNER: Designer (or WEEXP UX) + Developer (implementation)
DECISION GATE: W2 — Design spec approved; loading states prioritized in dev queue
```

---

## DOMAIN 2.09: SEO & Content (4 findings)

### F019: Technical SEO: Crawlability & Indexation
**Current State:**
- Effect/Year: Estimated €85k (SEO opportunity, shared)
- Confidence: med
- Finding: Site indexation at 8.6x potential (GSC shows crawl inefficiencies, some categories not crawled)

**Conversion:**
```
CLAIM: Technical SEO inefficiencies reduce indexed pages by 12–15%; fixing crawl/indexation could unlock €40–50k organic traffic
Epistemic Level: E2 (Pattern: GSC analysis of crawl coverage)

EVIDENCE:
- GSC: 320 indexed pages vs. estimated 360 total (8.6% gap)
- Crawl stats: Bot crawl inefficient on category/subcategory (due to pagination bugs, canonical issues)
- Robots.txt: Blocks 15 % of important URLs accidentally

OBSERVATION: Crawlability is suboptimal; some pages not in Google's index

INTERPRETATION: Fixing crawl issues could index 40–50 additional pages; each page could drive 2–4 sessions/month

ROOT CAUSE:
- L0: Indexation gap
- L1: Pagination implementation broken (rel=next/prev missing)
- L2: Canonical tags on some pages point to wrong URL (theme bug)
- L3: No SEO specialist; dev treats SEO as afterthought

BUSINESS IMPACT:
- P10: €15k (if only 20 pages are truly valuable; indexation fix drives 40 sessions/month)
- P50: €45k (40–50 pages indexed; 3 sessions/month each = 5k organic traffic/year at 1.8% CR)
- P90: €75k (if fixing crawl also improves existing page rankings +15%)

INTERVENTION:
1. Audit crawl errors in GSC
2. Fix robots.txt (remove blocks)
3. Implement rel=next/prev pagination
4. Fix canonical tag issues

EXPERIMENT:
- Monitor GSC crawl stats pre/post fix (should see +30% crawl efficiency)
- Measure indexed pages trend (target: 360 in 60 days)

KILL CRITERION:
✗ If indexed pages don't increase >5% → Bigger SEO issues exist; full site audit needed

OWNER: Developer (SEO-oriented) + SEO specialist (audit)
DECISION GATE: W1 — Crawl audit complete; fix prioritized
```

---

### F020: Keyword Research & Target Opportunities
**Current State:**
- Effect/Year: €85k (combined SEO opportunity, shared)
- Confidence: med
- Finding: 6 keyword clusters identified (care, selection, product, comparisons, discounts); Testik ranks #20+ for many; 9.9k monthly potential

**Conversion:**
```
CLAIM: Testik is underranking in 6 keyword clusters; organic visibility could improve 50–100% with targeted content
Epistemic Level: E2 (Pattern: keyword gap analysis + competitor ranking audit)

EVIDENCE:
- Keyword cluster "care" (doglyad, guides, selection): 9.9k searches/month; Testik ranks #50+
- Keyword cluster "product" (types, materials, features): 12k searches/month; rank #35+
- Keyword cluster "comparison" (vs. competitor brands): 3.2k searches/month; rank #100+
- Organic traffic potential: 200–300 sessions/month from top 20 positions (estimated)

OBSERVATION: Testik has low rankings for high-intent keywords; opportunity to improve organic traffic

INTERPRETATION: Keyword-focused content could drive incremental 5–10k organic sessions/year

ROOT CAUSE:
- L0: Low keyword rankings
- L1: Content focused on product features, not search intent
- L2: No keyword strategy; content created ad-hoc
- L3: No SEO specialist; marketer does keyword research without depth

BUSINESS IMPACT:
- P10: €20k (if only 2 clusters become winnable; 100 organic sessions/month × €16.70 organic LTV)
- P50: €50k (3 clusters, 250 sessions/month, repeatable conversion path)
- P90: €85k (all 6 clusters; 400 sessions/month; strong organic foundation)

INTERVENTION:
1. Map 6 keyword clusters to 12 core landing pages
2. Optimize existing pages + create 6 new pillar content pieces
3. Build internal linking structure (cluster → article hierarchy)

EXPERIMENT:
- Create 2 pillar pieces (care + selection); measure ranking progress & traffic at 60/90 day mark
- Target: Top 20 positions for 8+ keywords in each cluster

KILL CRITERION:
✗ If keyword rankings don't improve >5 positions in 90 days → Content quality too low; redo with professional SEO copywriter

OWNER: SEO specialist + Marketer + Content writer
DECISION GATE: W2 — Keyword map approved; content calendar drafted
```

---

### F021: Link Profile & Backlink Strategy
**Current State:**
- Effect/Year: €85k (SEO cumulative, shared)
- Confidence: low (speculative on link impact)
- Finding: Backlink profile exists but no active link building strategy; competitors have 40–60% more referring domains

**Conversion:**
```
CLAIM: Testik's link profile is weak (low referring domains); competitor link profiles 40–60% larger; link building opportunity
Epistemic Level: E2 (Pattern: backlink audit via Ahrefs/SEMRush)

EVIDENCE:
- Testik referring domains: 45
- Competitor #1: 72 domains
- Competitor #2: 68 domains
- No active link building program (organic only)

OBSERVATION: Testik has fewer backlinks than competitors

INTERPRETATION: Link building could improve domain authority & rankings

ROOT CAUSE:
- L0: Weak link profile
- L1: No link building strategy (founder doesn't value SEO)
- L2: No PR/media relations team; brand mentions rare
- L3: Product isn't well-known; PR outreach doesn't generate interest

BUSINESS IMPACT:
- P10: €5k (link building doesn't meaningfully improve rankings without other SEO work)
- P50: €20k (strategic link building from niche blogs/forums improves 5–10 keywords)
- P90: €45k (if link building + content strategy compound; authority grows)

INTERVENTION:
1. Identify 15–20 relevant blogs/resources in kitchen niche
2. Build relationships (press kit, guest post outreach)
3. Monitor backlink growth monthly

EXPERIMENT:
- Secure 10 backlinks from relevant domains (3-month push)
- Measure domain authority trend
- Track keyword rankings for linked-to pages

KILL CRITERION:
✗ If backlink acquisition cost >€500 per link → ROI too low; focus on content instead

OWNER: Marketer (PR/outreach) + WEEXP (strategy)
DECISION GATE: W3 (after content strategy is live) — Link building resource approved
```

---

### F022: On-Page SEO & Schema Markup
**Current State:**
- Effect/Year: €85k (SEO cumulative, shared)
- Confidence: med
- Finding: On-page SEO inconsistent (title/meta tags missing on some pages); schema markup (Product schema) incomplete

**Conversion:**
```
CLAIM: On-page SEO (title tags, meta descriptions, schema markup) is incomplete; fixing could improve CTR from organic 5–8%
Epistemic Level: E2 (Pattern: on-page audit)

EVIDENCE:
- Title tags: 15% of pages missing or <30 characters (too short)
- Meta descriptions: 20% missing; others not compelling
- Product schema: Incomplete (missing rating, price, availability on some SKU)
- GSC data: Organic CTR 2.8% vs. benchmark 4–5%

OBSERVATION: On-page elements are not optimized

INTERPRETATION: Fixing on-page optimization could improve organic CTR 1–2 pp; additional 30–50 sessions/month

ROOT CAUSE:
- L0: On-page SEO incomplete
- L1: No SEO template or process (each page unique, manual optimization)
- L2: CMS doesn't enforce SEO fields (title, meta, schema)
- L3: Developer added pages without SEO review

BUSINESS IMPACT:
- P10: €8k (if CTR improvement is only 0.5 pp)
- P50: €18k (CTR improves 1.5 pp; 40 organic sessions/month × €16.70 LTV)
- P90: €35k (if schema markup also improves rich snippet CTR)

INTERVENTION:
1. Audit all 320 indexed pages for SEO elements
2. Create SEO template (title, meta, schema fields)
3. Bulk fix 100 priority pages; automate template for future

EXPERIMENT:
- Implement schema markup on 50 SKU pages
- Measure Google rich snippet impressions & CTR in GSC (4-week baseline)

KILL CRITERION:
✗ If bulk fix takes >40 hours → Prioritize top 50 pages only; automate template first

OWNER: SEO specialist + Developer
DECISION GATE: W1 — On-page audit complete; template approved
```

---

## DOMAIN 2.10: Acquisition & Paid Channels (3 findings)

### F023: GA4 Configuration Broken (−22% Undercounting)
**Current State:**
- Effect/Year: Decision quality (not quantified directly)
- Confidence: high (measurement error confirmed)
- Finding: GA4 shows −22% fewer orders than actual (server-side discrepancy); decisions are being made on faulty data

**Conversion:**
```
CLAIM: GA4 is undercounting orders by 22%; all acquisition optimization based on GA4 is misdirected
Epistemic Level: E1 (Measured fact: GA4 vs. ERP comparison shows 22% gap)

EVIDENCE:
- GA4 orders last month: 1,420
- ERP orders last month: 1,821
- Gap: 401 orders (−22%)
- Root cause: Client-side tracking fails on 22% of browsers (tracking blocker, etc.)

OBSERVATION: GA4 shows 22% fewer orders than reality

INTERPRETATION: All CAC, ROAS, conversion rate calculations are 22% too optimistic; optimization efforts are misdirected to wrong channels

ROOT CAUSE:
- L0: GA4 undercounting
- L1: Client-side only tracking (browser JS fails if ad blockers active)
- L2: No server-side tracking fallback (Gtag.js doesn't have backup)
- L3: GA4 set up incorrectly; server-side events not implemented

BUSINESS IMPACT:
- P10: €0 (if undercount is just measurement error, no action taken)
- P50: €50k (if fixing GA4 reveals that paid channel performance is actually 22% worse; redirects budget from wrong channel)
- P90: €100k (if undercount was masking that one channel is actually unprofitable; pivot investment)

INTERVENTION:
1. Implement server-side tracking (Google Tag Manager server-side setup)
2. Add Payment Gateway confirmation event (E-commerce API)
3. Backfill orders from last 3 months with corrected data

EXPERIMENT:
- Run 2-week parallel tracking (old client-side vs. new server-side)
- Measure gap closure (target: <5% difference)

KILL CRITERION:
✗ If gap doesn't close >70% → Deeper integration issue; might need Shopify migration

OWNER: Developer (GTM) + Marketer (verification)
DECISION GATE: W1 — GA4 fix is CRITICAL path; blocks all channel optimization decisions
```

---

### F024: Google Ads CAC Optimization Potential
**Current State:**
- Effect/Year: €50–80k (uplift opportunity)
- Confidence: med
- Finding: Current CAC €18 (healthy), but bid strategy is manual; automation (Smart Bidding) could improve efficiency 10–15%

**Conversion:**
```
CLAIM: Google Ads uses manual bidding; switching to Smart Bidding (TCPA/tROAS) could improve CAC efficiency 10–15%, freeing budget for other channels
Epistemic Level: E2 (Pattern: industry benchmark + competitor observation)

EVIDENCE:
- Current strategy: Manual CPC bidding, daily optimization
- Current CAC: €18 (healthy vs. AOV €84)
- Industry benchmark: Automated bidding improves efficiency 15–25% for e-commerce
- Testik readiness: 6+ months of conversion data (sufficient for Smart Bidding)

OBSERVATION: Manual bidding is suboptimal for e-commerce

INTERPRETATION: Automated bidding could reduce CAC to €15.3–16.2 (10–15% improvement)

ROOT CAUSE:
- L0: Suboptimal bid strategy
- L1: Manual bidding requires daily attention (owner's time bottleneck)
- L2: No PPC specialist; owner managing Google Ads directly
- L3: Owner risk-averse (trusts manual control more than automation)

BUSINESS IMPACT:
- P10: €25k (if automation improves CAC only 5%; €3/order × 8.3k orders/year)
- P50: €55k (10% improvement; €3.2/order × 17.2k orders)
- P90: €85k (if automation works + budget reallocation finds new channels)

INTERVENTION:
1. Switch to Smart Bidding (target ROAS = 3.5 for baseline)
2. Monitor daily for 2 weeks (ensure no deterioration)
3. Optimize ROAS target quarterly

EXPERIMENT:
- A/B: 50% of campaigns on Smart Bidding, 50% manual (1-month test)
- Measure CAC, ROAS, CVR by treatment

KILL CRITERION:
✗ If Smart Bidding CAC increases >5% vs. manual → Revert; may need more manual optimization

OWNER: Marketer + WEEXP (bidding strategy consultant)
DECISION GATE: W2 (after GA4 fix) — Smart Bidding A/B live
```

---

### F025: Channel Mix Opportunity (Underutilized Channels)
**Current State:**
- Effect/Year: €60–100k (new channel potential)
- Confidence: low (speculative)
- Finding: Budget 80% Google, 15% Allegro, 5% email; underutilized: social (0%), comparison shopping (0%)

**Conversion:**
```
CLAIM: Channel allocation is heavily Google-skewed; underutilized channels (social, comparison shopping) could diversify CAC and reduce risk
Epistemic Level: E0 (Speculative; no data on Testik's social/shopping performance)

EVIDENCE:
- Budget breakdown: Google 80%, Allegro 15%, email 5%
- Competitor allocation: Google 50%, social 20%, shopping 20%, email 10%
- Testik social spend: €0

OBSERVATION: Channel concentration risk; competitors are more diversified

INTERPRETATION: Testing underutilized channels could reduce CAC volatility and find cheaper scaling channels

ROOT CAUSE:
- L0: Unbalanced channel portfolio
- L1: Google works well (CAC €18); owner hasn't explored alternatives
- L2: No agency; owner and marketer are cautious about new platforms
- L3: Social/shopping have higher learning curve; owner focused on "proven" channel

BUSINESS IMPACT:
- P10: €20k (if new channels underperform; waste on testing)
- P50: €60k (if social/shopping CAC matches Google €18; enables 50k additional orders)
- P90: €100k (if new channels are cheaper €14–16 CAC; full reallocation improves unit economics)

INTERVENTION:
1. Test Facebook/Instagram (€1k budget, 30-day test)
2. Test Google Shopping feed ads (structured product feed, 30-day test)
3. Test Pinterest (high-intent home/kitchen audience)

EXPERIMENT:
- Parallel test: All 3 channels simultaneously (1 month, €3–5k budget)
- Measure CAC, ROAS, order volume by channel

KILL CRITERION:
✗ If all 3 channels CAC >€22 → Stick with Google; high CAC channels not worthwhile

OWNER: Marketer + WEEXP (channel strategy)
DECISION GATE: W2 (after GA4 fix + Smart Bidding) — Channel test budget approved
```

---

## DOMAIN 2.11: CRM & Retention (3 findings)

### F026: No Repeat Rate Program (13% is orphaned)
**Current State:**
- Effect/Year: €150k (retention opportunity)
- Confidence: high (mechanism clear; magnitude unproven)
- Finding: 13% repeat rate vs. industry 25–30%; no email sequence, no loyalty program; base of 41k contacts unused

**Conversion:**
```
CLAIM: No retention program exists; 41k customer base has no email nurture; repeat rate 13% vs. 25–30% represents €150k opportunity
Epistemic Level: E3 (Mechanism: email + loyalty are proven retention tactics; but magnitude is unproven for Testik)

EVIDENCE:
- Current repeat rate: 13%
- Industry benchmark: 25–30% for kitchen/home products
- CRM data: 41k customer emails, no segmentation
- Current email: Only purchase confirmations (no nurture sequence)

OBSERVATION: Customer base is captured but not engaged; repeat rate is low

INTERPRETATION: Email retention program could lift repeat rate from 13% → 20–22% (cost of acquisition already sunk)

ROOT CAUSE:
- L0: Low repeat rate
- L1: No retention program (no email tool, no loyalty program)
- L2: Marketer focused on acquisition; retention is afterthought
- L3: Platform (WooCommerce) doesn't have native retention tools; requires 3rd-party (Klaviyo, etc.)

BUSINESS IMPACT:
- P10: €60k (if repeat rate improves only to 16% = +3pp; 41k × 3% × €43.7 repeat LTV)
- P50: €150k (repeat rate to 22% = +9pp; 41k × 9% × €43.7)
- P90: €220k (if repeat rate reaches 28%; email + loyalty compound effect)

INTERVENTION:
1. Implement email platform (Klaviyo)
2. Build email sequences: post-purchase care tips, reorder remind, loyalty program launch
3. Launch referral/loyalty program (e.g., points system)

EXPERIMENT:
- 8-week email campaign to inactive customers (60+ days since purchase)
- Measure repeat rate lift, email engagement (open/click), repeat order AOV

KILL CRITERION:
✗ If repeat rate improves <2pp after 8 weeks → Retention issue is product/quality, not marketing

OWNER: Marketer (email strategy) + WEEXP (program design)
DECISION GATE: W2 — Email platform chosen; sequence draft approved; loyalty program framework defined
```

---

### F027: Email Segmentation & Personalization
**Current State:**
- Effect/Year: €40–80k (incremental on retention)
- Confidence: low (speculative; email tool not yet selected)
- Finding: 41k contacts have no segment; opportunity to send targeted (first-time buyers, repeat customers, high-AOV) emails

**Conversion:**
```
CLAIM: Unsegmented email list misses personalization opportunity; segmented campaigns could improve retention ROI 20–40%
Epistemic Level: E0 (Speculative; no Testik email data; only industry benchmarks)

EVIDENCE:
- Segmented email ROI: 14–50% better than blasts (varies by segment, source)
- Testik readiness: Purchase history, RFM data available in CRM

OBSERVATION: Email list is treat as single audience; no segments

INTERPRETATION: Creating buyer segments (first-time, repeat, high-spenders, dormant) and tailoring messages could improve engagement

ROOT CAUSE:
- L0: No segmentation
- L1: No email platform (can't execute segments)
- L2: Marketer hasn't had bandwidth to plan (acquisition-focused)
- L3: Founder doesn't see email as strategic; views it as optional

BUSINESS IMPACT:
- P10: €15k (if segmentation improves ROI only 10%)
- P50: €50k (segmentation improves engagement 30%; repeat rate lift compounds)
- P90: €90k (if segments enable dynamic pricing strategy + loyalty differentiation)

INTERVENTION:
1. Activate email platform with segmentation (see F026)
2. Build 4–5 core segments (first-time, repeat-2+, high-AOV €150+, at-risk/dormant)
3. Create segment-specific campaigns (e.g., first-time = care guide sequence, high-AOV = VIP loyalty)

EXPERIMENT:
- A/B segment campaigns: Repeat customer care tips email vs. generic "here's a discount"
- Measure repeat rate by segment (target: high-AOV segment 30%+ repeat)

KILL CRITERION:
✗ If segment campaigns underperform generic blast → Audience composition issue; need deeper RFM analysis

OWNER: Marketer (email) + WEEXP (segmentation strategy)
DECISION GATE: W2–W3 (tied to F026) — Email platform live; segments activated
```

---

### F028: First-Time Buyer Experience & Onboarding
**Current State:**
- Effect/Year: €30–60k (lifetime value improvement)
- Confidence: med (mechanism understood; Testik data limited)
- Finding: New customers (day 1) receive only transactional email; no welcome sequence, no product education

**Conversion:**
```
CLAIM: First-time buyers lack onboarding email; welcome sequence + product guides could improve repeat rate and LTV
Epistemic Level: E2 (Pattern: welcome email best practice; no Testik A/B test yet)

EVIDENCE:
- Current: Purchase confirmation only
- Industry average: Welcome sequence = 3–5 emails over 14 days
- Testik advantage: Product expertise (wife cofounder) + care content (F006)

OBSERVATION: New customer experience is transactional; no education or encouragement to repeat

INTERPRETATION: Onboarding sequence with guides could improve first-repeat rate 15–25%

ROOT CAUSE:
- L0: No onboarding program
- L1: No email platform (infrastructure missing)
- L2: Marketer hasn't prioritized; welcome emails seen as "nice to have"
- L3: Founder's mental model: "Sale is done; customer figured it out"

BUSINESS IMPACT:
- P10: €12k (if welcome sequence improves first-repeat only 3%; 41k×3%×€43.7)
- P50: €40k (first-repeat lifts 8%; email + care guides shown to help)
- P90: €70k (if welcome sequence also improves NPS, reduces returns)

INTERVENTION:
1. Create welcome sequence (5 emails, 14 days):
   - Day 0: Welcome + care tips
   - Day 3: Product care guide + accessories crosssell
   - Day 7: Common questions + loyalty program intro
   - Day 14: Reorder reminder + feedback request
2. Measure first-repeat rate by cohort

EXPERIMENT:
- A/B: Welcome sequence (treated) vs. confirmation only (control) on cohort
- Measure repeat rate at 30/60/90 days

KILL CRITERION:
✗ If first-repeat rate doesn't improve >2pp → Product quality/satisfaction issue; focus on returns/NPS first

OWNER: Marketer (email) + Content writer (guides)
DECISION GATE: W2 — Sequence copy approved; email platform live
```

---

## DOMAIN 2.13: Operations & Fulfillment (2 findings)

### F029: Inventory Availability & OOS Management
**Current State:**
- Effect/Year: €25–45k (revenue recovery from OOS)
- Confidence: med
- Finding: No OOS (out-of-stock) tracking; estimated 5–8% of high-demand SKU have stockouts (unforced revenue loss)

**Conversion:**
```
CLAIM: Out-of-stock incidents cause revenue loss; no predictive inventory management; opportunity to prevent €25–45k in lost sales
Epistemic Level: E0→E1 (Estimated: no formal OOS tracking, but supply chain data suggests 5–8% OOS event rate)

EVIDENCE:
- Inventory management: Manual (owner's mental model)
- Top-20 SKU: 5–8% estimated OOS rate (based on supplier lead times vs. demand)
- Revenue impact: Unmeasured

OBSERVATION: Some SKU go OOS during peak demand; no forecast prevents this

INTERPRETATION: Inventory forecasting could prevent stockouts; revenue recovery = units sold at zero CAC

ROOT CAUSE:
- L0: Preventable OOS events
- L1: No demand forecasting (inventory set by supplier agreements, not demand)
- L2: Supply chain: 30–45 day lead time from suppliers vs. 7–14 day demand cycles
- L3: Operations (team of 1) overloaded; no time for forecasting

BUSINESS IMPACT:
- P10: €8k (if OOS events are rare; only 2–3% of potential sales lost)
- P50: €30k (5–8% OOS on top-20 SKU = 1k lost units × €30 contribution)
- P90: €50k (if OOS is systemic; 10% of high-demand SKU; + reduced repeat from availability issues)

INTERVENTION:
1. Implement simple SKU forecasting (12-week rolling, based on historical seasonality)
2. Adjust purchase orders to align with forecast
3. Monitor OOS events weekly

EXPERIMENT:
- Forecast 10 top SKU; track actual vs. predicted; measure accuracy at 4/8/12 week mark

KILL CRITERION:
✗ If forecast accuracy <60% → Demand is too erratic; implement safety stock instead

OWNER: Operations (lead) + WEEXP (forecasting support)
DECISION GATE: W2 — Demand forecast live; supplier orders adjusted
```

---

### F030: Returns & Quality Issues
**Current State:**
- Effect/Year: Estimated €15–30k (cost + revenue impact)
- Confidence: med
- Finding: No returns tracking; customer anecdotes suggest 2–3% return rate; no root cause analysis

**Conversion:**
```
CLAIM: Returns rate unmeasured but anecdotal evidence suggests 2–3%; no root cause analysis; could address quality issues reducing returns
Epistemic Level: E0 (Speculative: no formal returns data)

EVIDENCE:
- Returns measurement: Manual (customer service emails)
- Anecdotal rate: 2–3% (owner's rough estimate)
- Root causes: Not tracked (chipping, sizing issues, defects)

OBSERVATION: Returns exist but not systematized or analyzed

INTERPRETATION: Formal returns tracking + root cause analysis could identify fixable quality issues

ROOT CAUSE:
- L0: Returns not tracked
- L1: No returns process (customer emails customer service with issues)
- L2: No feedback loop to product team
- L3: Operations owner doesn't have time; seen as cost center, not improvement lever

BUSINESS IMPACT:
- P10: €5k (if returns are actually <1% and not a problem)
- P50: €20k (if 2% returns + 10% defect reduction possible; saves cost + repeat rate lift)
- P90: €40k (if returns reveal design issues fixable by supplier; quality lift improves NPS + repeat)

INTERVENTION:
1. Create returns form (email template → data capture)
2. Categorize returns (damage in shipping, sizing, quality defect, wrong item, returns fraud)
3. Route to product team for analysis

EXPERIMENT:
- Track returns by SKU/reason for 8 weeks
- Identify top 3 return drivers
- Implement fixes (supplier discussion, product change, packaging improvement)

KILL CRITERION:
✗ If returns data doesn't reveal actionable patterns → Returns are noise; deprioritize

OWNER: Customer service + Product/Operations
DECISION GATE: W1 — Returns form live; tracking starts
```

---

## DOMAIN 2.14: Technology & Platform (2 findings)

### F031: Platform Migration Consideration (WooCommerce → Shopify)
**Current State:**
- Effect/Year: €50–150k (future opportunity, conditional)
- Confidence: low (foundational; will evaluate in W3)
- Finding: WooCommerce is legacy, extensible but complex; Shopify is modern but involves migration risk/cost

**Conversion:**
```
CLAIM: Platform choice (WooCommerce vs. Shopify) should be evaluated based on TCO; current platform limits scalability/personalization
Epistemic Level: E2 (Pattern: known platform limitations documented)

EVIDENCE:
- WooCommerce limitations: Slow checkout, poor email/CRM integration, limited personalization
- Shopify advantages: Native email (Klaviyo), apps ecosystem, faster checkout
- Migration cost: €15–30k (dev effort, data migration)
- Migration risk: 1–2 week downtime (if not planned well)

OBSERVATION: Current platform has tech debt; Shopify has better integration points

INTERPRETATION: Platform migration could unlock €50–150k value (via email, personalization, checkout speed)

ROOT CAUSE:
- L0: Platform limitation decision upcoming
- L1: Current platform (WooCommerce) works but limits native integrations
- L2: Migration has risk/cost (not urgent)
- L3: Decision deferred until revenue/maturity justify migration

BUSINESS IMPACT:
- P10: €0 (if WooCommerce + plugins solve all issues; migration unnecessary)
- P50: €50k (if migration enables better email/personalization, +2% repeat rate)
- P90: €150k (if migration enables advanced personalization + subscription features)

INTERVENTION:
1. TCO analysis: WooCommerce (plugins, maintenance) vs. Shopify (migration cost, monthly fee)
2. Feature gap analysis: Identify must-haves for next 12 months
3. Decision: Migrate W3 or stay for now?

EXPERIMENT:
- None (decision-making phase only)

KILL CRITERION:
N/A (strategic decision, not experiment)

OWNER: Owner + Developer + WEEXP (TCO analysis)
DECISION GATE: W3 — TCO analysis complete; go/no-go decision made
```

---

## SUMMARY TABLE: All 31 Findings

| # | Domain | Claim (Short) | Effect/Year | Confidence | Epistemic Level | Status |
|---|--------|---|---|---|---|---|
| F001 | Business | Allegro unprofitable | €60k | high | E3 | Extracted |
| F002 | Business | Cash flow Q4 gap | €25–45k | high | E1 | Extracted |
| F003 | Business | B2B no rules | €9–14k | med | E2 | Extracted |
| F004 | Business | No financial model | Decision quality | high | E0→E3 | Extracted |
| F005 | Market | Positioning lacks RTB | €15–45k | high | E3 | Extracted |
| F006 | Market | Free content "care expert" | €85k | high | E2 | Extracted |
| F007 | Market | Delivery threshold | €15–25k | med | E2 | Extracted |
| F008 | Market | TM protection gap (EUIPO) | €0–50k | high | E1 | Extracted |
| F009 | Product | Dead stock blocks cash | €70k one-off | high | E1+E4 | Extracted |
| F010 | Product | Core elasticity +5–8% | €25–40k | med | E4 | Extracted |
| F011 | Product | Cross-sell pairs ignored | €12k | med | E2 | Extracted |
| F012 | Product | Attribute data breaks feeds | €18k | high | E1 | Extracted |
| F013 | Pricing | Discount discipline missing | €15–25k | med | E0 | Extracted |
| F014 | Website | Mobile speed + form friction | €120k | med | E3 | Extracted |
| F015 | Website | Checkout completion 43.6% | €43.6k | med | E2+E3 | Extracted |
| F016 | Website | AOV optimization (upsell, cart) | €25–40k | med | E0 | Extracted |
| F017 | Website | PDP credibility signals | €10–20k | med | E2 | Extracted |
| F018 | Website | Mobile design UX | €12k | med | E2 | Extracted |
| F019 | SEO | Technical SEO crawl | €40–50k | med | E2 | Extracted |
| F020 | SEO | Keyword research opportunities | €50k | med | E2 | Extracted |
| F021 | SEO | Link profile weak | €20k | low | E2 | Extracted |
| F022 | SEO | On-page optimization | €18k | med | E2 | Extracted |
| F023 | Acquisition | GA4 broken (−22%) | Decision risk | high | E1 | Extracted |
| F024 | Acquisition | Google Ads optimization | €50–80k | med | E2 | Extracted |
| F025 | Acquisition | Channel diversification | €60–100k | low | E0 | Extracted |
| F026 | CRM | No repeat program | €150k | high | E3 | Extracted |
| F027 | CRM | Email segmentation | €40–80k | low | E0 | Extracted |
| F028 | CRM | First-time buyer onboarding | €30–60k | med | E2 | Extracted |
| F029 | Ops | Inventory/OOS management | €25–45k | med | E0→E1 | Extracted |
| F030 | Ops | Returns tracking & quality | €15–30k | med | E0 | Extracted |
| F031 | Tech | Platform migration evaluation | €50–150k | low | E2 | Extracted |

---

## Next Steps (Phase 2)

1. **Validate Findings Registry:** 
   - Confirm all 31 findings are captured
   - Correct any misalignment with original audit

2. **Build Counterargument Layer:**
   - For each Critical/High finding (F001–F006, F014–F016, F023–F026)
   - Add 3–5 alternative explanations
   - Define kill criteria + falsification tests

3. **Convert to Full Finding Objects:**
   - For each finding: Expand to 16-field template
   - Document experiment design + measurement plan
   - Assign owner & decision gate

4. **Restructure Documents:**
   - Report 2 (Diagnostics): Organize findings by epistemic level + severity
   - Report 3 (Money): Show P10/P50/P90 instead of point estimates
   - Report 4 (Roadmap): Experiment plan instead of task list
   - Volumes A–E: Replace scores with E-levels

---

**Status:** Foundation complete. Findings registry extracted.  
**Next action:** Counterargument layer + detailed Finding Objects for all 31 findings.
