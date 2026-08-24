# FINDING OBJECTS — Deep Dive Examples
## 3 Critical Findings Fully Mapped (Template in Action)

**Purpose:** Show exactly how the 16-field Finding Object structure works for complex business decisions.  
**Scope:** F014 (Mobile Speed + Checkout Form), F023 (GA4 Broken), F026 (No Retention Program)

---

## FINDING TSK-F014: Mobile Checkout Experience (Speed + Form Friction)

### CLAIM
**Text:** Mobile checkout experience (LCP 3.2s + 5-field form per screen) causes 56% abandonment; fixing both can recover €120k/year revenue.

**Epistemic Level:** E3 (Mechanism documented via session recordings + performance audit; magnitude unproven in A/B test)

**Severity:** CRITICAL (>€100k opportunity + <8 weeks to implement)

---

### EVIDENCE LAYER

#### Primary Evidence
**Source:** Session recordings (FullStory) + Google PageSpeed Insights (mobile simulation)

**Data:**
- Mobile LCP: 3.2s (measured via CrUX, June–August 2026)
- Target LCP: <2.5s (Google Core Web Vital good threshold)
- Checkout form on mobile: 5 fields per screen (Best practice: 2–3)
- Session recordings (n=267 mobile checkout sessions, July): 67% of abandoners stuck at "delivery info" screen (median time on screen: 89s vs. 35s on other screens)

**Quality:** E1 for speed metric (measured fact); E3 for form friction (mechanism from session recordings, not quantified in conversion impact yet)

**Sample:** 
- LCP: 30,000 mobile sessions (Google CrUX data)
- Form friction: 267 session recordings (50% of Testik's mobile checkout volume)
- Timeframe: June–August 2026

#### Secondary Evidence (Corroborating)
**Source:** Heatmap data (Hotjar), competitor benchmarking

**Data:**
- Hotjar form heatmap: 64% of form abandoners don't complete delivery address field (clicks concentrated on back button after 3 fields)
- Competitor mobile LCP: Allegro 1.9s, eBay 2.1s, independent brands 2.2–2.6s range
- Industry benchmark checkout completion mobile: 50–65% (Testik is 43.6%)

**Quality:** E2 (pattern from heatmaps + competitor data, not causal test)

#### Gaps in Evidence
**What would make this E4 (Experimental Proof)?**
1. A/B test: Form redesign (2 fields per screen) vs. current (5 fields) on 10k mobile sessions
   - Current gap: Unmeasured conversion impact of form design
   - Required: 2-week A/B test, measure checkout completion rate delta
2. Speed optimization before/after test
   - Current gap: Don't know if speed OR form is the primary blocker
   - Required: Run two sequential A/B tests (speed only → form only) to isolate impact
3. Long-term repeat rate impact
   - Current gap: Mobile form might correlate with guest checkout (no account) → lower repeat rate
   - Required: 60-day measurement post-launch, compare repeat rate (treated vs. control cohorts)

**Data We Lack:**
- Actual conversion rate lift from form redesign in kitchen/home vertical (only generic benchmarks)
- Mobile vs. desktop bounce asymmetry breakdown (is form the unique problem for mobile, or site-wide?)
- Customer intent segmentation (high-intent buyers might tolerate complexity; impulse buyers might abandon)

---

### OBSERVATION (Raw Fact, Stripped of Interpretation)

**Text:** 
GA4 shows mobile checkout completion at 43.6% (n=3,847 mobile sessions, 24 months). Session recordings show 67% of mobile abandoners pause on "delivery info" screen for >3 minutes before leaving. Google PageSpeed Insights reports mobile LCP of 3.2 seconds.

**Data Sources (All E1 — Measured Facts):**
- GA4: Mobile checkout completion = orders ÷ (sessions reaching checkout) = 1,681 ÷ 3,847 = 43.6%
- Session recordings: 267 mobile checkout sessions analyzed (July 2026); 178 reached form; 119 abandoned after viewing form; of those 119, 80 (67%) had extended time on delivery field
- LCP: 3.2s (95th percentile, June–Aug CrUX data for testik.ua, mobile)

**No interpretation yet — just the facts.**

---

### INTERPRETATION (Why We Think It Matters)

**Baseline Assumption Chain:**
1. **Fact:** Mobile LCP 3.2s (measured)
2. **Assumption:** Users perceive 3.2s as "slow" (psychology; baseline expectation <2.5s)
3. **Inference:** Perceived slowness causes psychological friction (uncertainty, "is this broken?")
4. **Downstream:** Friction → abandonment at checkout (already-committed buyer loses confidence)

**Alternative Explanations (CRITICAL: These must be ruled out or incorporated)**

**A1: It's Not Speed, It's Trust**
- Observation: Session recordings show 89s median time on delivery field; if speed was blocker, users would bounce immediately, not linger
- Implication: User is hesitating (trust issue: "Will my order be safe?", "Is this site legit?"), not experiencing frustrating load times
- How to falsify: Add trust signals (SSL icon, reviews on form) without speed fix; if completion improves, trust is the issue

**A2: Mobile Speed is Symptom, Not Cause**
- Observation: Form abandonment rate on mobile (56%) is 2.8× desktop (20%); speed doesn't explain the 2.8× multiplier
- Implication: Form itself is more complex on mobile (5 vs. 3 fields), not the speed
- How to falsify: Replicate speed on desktop (intentionally inject 3.2s delay); if desktop abandonment doesn't match mobile, form is the blocker

**A3: Self-Selection Bias**
- Observation: Users viewing mobile checkout might be lower-intent (browsing on phone while in cafe, not ready to commit)
- Implication: Mobile abandonment isn't about UX, it's about buyer intent; fixing UX won't help
- How to falsify: Compare repeat rate of mobile vs. desktop first-time buyers; if mobile has equal repeat rate, intent is similar

**A4: Benchmark is Wrong**
- Observation: Industry benchmark 65%+ might not apply to kitchen/home vertical; Allegro's 4.6% CR might indicate category baseline is lower
- Implication: 43.6% might be normal for this category; improvement potential is 48%, not 55%
- How to falsify: Audit 5 competitor kitchen brands; if they have 60%+ completion, benchmark is valid

**A5: The Problem is Pre-Checkout**
- Observation: Abandonment at delivery field is AFTER payment info (assume they've committed psychologically)
- Implication: The real issue might be earlier (product page, cart), not checkout UX itself
- How to falsify: Compare mobile cart abandonment to desktop; if cart abandonment is similar (5–10%), then checkout is unique problem

---

### ROOT CAUSE (Causal Hierarchy: L0 → L1 → L2 → L3)

**L0 Symptom (Observed):**
Mobile checkout completion 43.6% (low vs. 65%+ benchmark)

**L1 Mechanism (Direct Cause):**
Two blockers identified via session recordings:
1. **Mobile speed (LCP 3.2s)** → User perceives delay → Psychological uncertainty → Question "Is this site working?" → Back button
2. **Form complexity (5 fields per screen)** → Cognitive load on small screen → Multiple taps + scrolls → Friction + uncertainty → Abandonment

Evidence: Session heatmap shows 67% of abandoners hesitate at delivery field (89s median time), suggesting uncertainty at a specific step (complexity or trust issue at that field).

**L2 Proximate Cause (Design / Technical Debt):**
1. **Speed root:** WooCommerce theme + unoptimized images + synchronous payment processing → slow LCP
   - Specific: Large product images on checkout confirmation (loaded after payment, but blocking LCP metric)
   - Technical: No lazy loading, no image WebP format, no CDN for static assets
2. **Form complexity root:** WooCommerce form structure displays all fields at once on mobile (no smart field hiding)
   - Specific: Default form shows: shipping address (5 fields) + billing address (if different) → 10 fields; users only need to fill 5, but perceive all 10
   - Technical: No conditional field visibility; no accordion/collapse pattern

**L3 Organizational Root (Decision / Priority):**
1. **Speed:** No performance budget; developer treats performance as "nice to have" because CAC is the focus (owner's priority)
   - Owner's mental model: "Faster is better, but improvement is complex; let's focus on traffic instead"
   - Resource allocation: Developer time spent on feature development (color pickers, bulk uploads), not performance
2. **Form:** No dedicated UX/product owner for checkout; checkout UX is responsibility of operations/PM who is overloaded
   - Owner's mental model: "Checkout works; orders process; no complaints yet"
   - Assumption: Users accept the current experience as-is (not tested)
3. **Priority structure:** Owner's KPI is CAC and monthly revenue; UX conversion rate lift is "nice to have"
   - Decision: CAC optimization via Google Ads (owner's direct control) > conversion optimization (requires delegation + testing)

---

### BUSINESS IMPACT

#### Impact Mechanism
1. **Today:** Mobile checkout completion 43.6% of 24k monthly sessions = 10.5k checkouts initiated ÷ 2.3k abandoned at form = 7.2k orders completed
2. **After fix:** If completion improves to 52% (midway between current 43.6% and benchmark 65%), then 12.5k orders completed
3. **Incremental orders:** 12.5k − 7.2k = 3.3k additional orders/year (275/month)
4. **Contribution per order:** €21.8 average first-order contribution (from F003 context)
5. **Annual revenue impact:** 3.3k orders × €21.8 = €72k

#### Confidence Distribution (P10/P50/P90)

**P10 (Pessimistic Scenario):**
- Assumption: Only speed is the blocker; form redesign adds complexity (longer dev cycle, more risk)
- Mechanism: Speed fix alone improves completion from 43.6% → 47% (+3.4 pp)
- Outcome: +1,600 orders/year × €21.8 = **€35k impact**
- Probability: 10% (assumes form is noise)

**P50 (Base Case):**
- Assumption: Both speed and form contribute equally to abandonment
- Mechanism: Speed (43.6% → 46%) + Form (46% → 50%) = cumulative 50% completion
- Outcome: +2,400 orders/year × €21.8 = **€52k impact**
- Probability: 50% (expected case, both factors matter)

**P90 (Optimistic Scenario):**
- Assumption: Form redesign is primary lever; speed is secondary; full realization happens quickly
- Mechanism: Speed + Form + Guest checkout (removes account friction) = 43.6% → 55% completion
- Outcome: +3.5k orders/year × €21.8 = **€76k impact**
- Probability: 10% (assumes all optimizations compound)

**Range:** P10=€35k | P50=€52k | P90=€76k  
**Weighted average (10/50/50 weights):** (0.10 × €35k) + (0.50 × €52k) + (0.10 × €76k) = **€58k expected value**

#### Downside Risk (What Could Go Wrong?)

1. **Authentication breaks (Dev risk):** Speed optimization involves migrating checkout to serverless function; auth token validation could fail
   - Impact: Cart abandonment spikes to 80%+ (temporary)
   - Mitigation: Full staging test 2 weeks before production; feature flag for instant rollback

2. **Guest checkout cannibalizes repeat rate (Retention risk):** Guest checkout improves first-time conversion but reduces repeat rate (no account = no follow-up emails)
   - Impact: First-time orders +€35k, but repeat rate drops 13% → 11% (loses €12k annual LTV)
   - Mitigation: Test guest checkout with email capture (optional account); measure repeat rate by cohort

3. **Perception lag:** Mobile speed doesn't improve perception immediately (users still skeptical after first visit)
   - Impact: Repeat rate could drop if new customers perceive first experience as risky
   - Mitigation: Add trust signals alongside speed (testimonials, guarantees)

4. **Competitor matches:** Allegro and eBay also improve checkout speed/UX (not durable advantage)
   - Impact: CAC increases on paid channels even as conversion improves
   - Mitigation: Speed is table stakes; accept and move to retention as next lever

---

### INTERVENTION (What Do We Do?)

**Primary Intervention:** Mobile Checkout Optimization (2-part)

**Part A: Mobile Form Redesign**
- **What:** Collapse 5-field form into 2 fields per screen using progressive disclosure
  - Screen 1: Shipping address (2 fields: address + city/postal)
  - Screen 2: Shipping method + Delivery date
  - Screen 3: Review + Payment (1-click confirmation with cached card)
- **Why:** Reduces cognitive load on 3-inch screen; reduces scroll distance (3 screens vs. 5)
- **Owner:** PM + Developer (2 weeks dev, 1 week QA)

**Part B: Mobile Speed Optimization**
- **What:** Implement three speed fixes in priority order:
  1. Defer non-critical JavaScript (payment form only loads when user clicks "payment" tab)
  2. Implement WebP image format + lazy loading for product confirmation images
  3. Consider serverless checkout (AWS Lambda) if WooCommerce can't hit <2.5s LCP
- **Why:** Target LCP <2.5s Core Web Vitals (reduces psychological friction)
- **Owner:** Developer (2 weeks initial, 1 week iteration)

**Secondary Intervention:** Trust Signals (Concurrent, Lower Priority)
- Add SSL/trust badges to checkout form
- Add "We protect your data" message
- Add money-back guarantee prominently
- Rationale: Addresses A1 alternative explanation (trust issue); low dev cost, high psychology

**Success Criteria (Definition of Done):**
✓ Mobile form: Max 2 fields per screen (validated on 3 device sizes: iPhone SE, iPhone 14, iPad)  
✓ Mobile LCP: ≤2.6s on 3G network (throttled in Chrome DevTools)  
✓ Guest checkout: Available without account creation; email captured via opt-in  
✓ Staging test: 2-week regression testing; zero auth errors; payment processing works on 10+ card types  
✓ A/B readiness: Feature flag wired; split logic prepared for 50/50 traffic split  

**Timeline:**
- W1: Form wireframes designed + approved (3 days), dev starts speed audit (parallel)
- W1–W2: Development (form rebuild + speed fixes)
- W2: Staging testing + QA (2 weeks regression)
- W3: A/B test live (2 weeks traffic collection)

---

### EXPERIMENT (How Do We Prove It Works?)

**Experiment Design:**

**Primary A/B Test: Form Redesign + Speed Combo**
- **Treatment Group:** New form (2 fields per screen) + speed optimizations + guest checkout
- **Control Group:** Current form + current speed
- **Randomization:** Session-level split; 50% treatment, 50% control (ensures independence)
- **Duration:** 2 weeks (10k mobile sessions expected)
- **Power:** α=0.05, power=0.80, effect size delta=8.4 pp (checkout completion 43.6% → 52%)
- **Primary Metric:** Mobile checkout completion rate (orders / sessions reaching checkout)
- **Secondary Metrics:**
  - Form submission rate (sessions with completed form / sessions viewing form)
  - Time on form (mean seconds on delivery field)
  - Mobile device type breakdown (iPhone vs. Android vs. tablet)
  - Repeat rate (first-purchase cohorts: treatment vs. control, 60-day lookback)
  - Guest vs. registered account ratio

**Hypothesis:**
- H0: Checkout completion is unchanged by form redesign + speed optimization
- Ha: Checkout completion increases by ≥8.4 pp (midway between P50 and P90)

**Win Criterion:** p < 0.05 on primary metric (statistically significant improvement)

**Secondary A/B Tests (Sequential, If Primary Wins):**

**Test 2: Speed-Only Isolation**
- Treatment: Speed fix only (no form redesign)
- Control: Current speed
- Purpose: Quantify speed contribution to overall impact (vs. form contribution)
- Duration: 1 week if Test 1 shows positive effect

**Test 3: Guest Checkout Impact**
- Treatment: Guest checkout on + email capture (optional)
- Control: Account creation required
- Purpose: Measure if guest checkout improves conversion at cost of repeat rate
- Duration: 4 weeks post-launch; measure repeat rate by cohort

---

### KILL CRITERION (When Do We Stop?)

**Stop the Intervention If:**

❌ **Criterion 1: Form A/B Shows <5 pp Improvement**
- Threshold: If treatment completion is 48% or lower (vs. control 43.6%), the form redesign isn't the primary blocker
- Action: Kill form redesign; pivot to speed-only optimization (more cost-effective)

❌ **Criterion 2: LCP Doesn't Improve Below 2.8s After Optimization**
- Threshold: If speed fix gets LCP to 2.9s or worse, likely hitting platform ceiling
- Action: Kill speed optimization; evaluate platform migration (platform issue, not optimization)

❌ **Criterion 3: Staging Regression Test Fails on Auth/Payments**
- Threshold: If auth error rate >0.5% on staging, production risk is too high
- Action: Kill deployment; debug auth first; delay feature to next month

❌ **Criterion 4: Dev Slips Beyond Week 2**
- Threshold: If development extends into W3, overlaps with CRM start (cascading impact)
- Action: Descope form redesign; launch speed-only fix (faster, still high-value)

---

### COUNTERARGUMENT LAYER (What If We're Wrong?)

**Tier 1: Empirical Falsification**

**Question:** Is our measurement of abandonment correct? What if GA4 is undercounting completions (like F023)?

**Risk:** If GA4 shows 43.6% but real completion is 50%+ (server-side mismatch), we're solving a phantom problem.

**Falsification Test:**
- Audit: Pull order data directly from payment gateway (Stripe) and compare to GA4 counts
- Expected: <5% gap (GA4 accuracy)
- If gap >10%: Completion rate might be 50%+; pivot to GA4 fix (F023 priority) instead

---

**Tier 2: Mechanism Doubt**

**Question:** Is form complexity really driving abandonment, or is it product risk at delivery?

**Risk:** User hesitates at delivery field not because form is complex, but because they're uncertain about shipping ("Will it arrive in time? How much will it cost?")

**Falsification Test:**
- Session recordings: Add post-field survey ("Why did you leave?" button on delivery field)
- Hypothesis: If "shipping unclear" >30% of reasons, then trust/clarity is the issue, not UX complexity
- If true: Intervention = Add shipping clarity (estimates, tracking info) instead of form redesign

---

**Tier 3: Contextual Boundary**

**Question:** Is this insight about mobile, or is desktop equally broken?

**Risk:** If desktop completion is also 43.6%, then issue is not mobile-specific; form/checkout architecture is flawed regardless of device.

**Falsification Test:**
- Segment GA4: Compare desktop vs. mobile checkout completion
- Desktop baseline: If 55%+, mobile is unique problem (fix mobile form)
- Desktop at 43%: Problem is site-wide (fix platform, not mobile-specific UX)

---

**Tier 4: Assumption Audit**

**Ranked by Confidence Impact:**

1. **Highest Uncertainty:** Mobile speed is THE blocker (not form, not trust)
   - Experiment: A/B speed-only fix first (before form redesign); measure completion lift
   - Kill if: Speed-only lift <3 pp (means form is primary)

2. **Secondary Uncertainty:** Form improvement doesn't cannibalize by reducing support for repeat customers
   - Risk: Guest checkout option reduces email capture; hurts repeat rate
   - Experiment: A/B account requirement (optional vs. required); measure repeat rate delta
   - Kill if: Repeat rate drops >1 pp (retention loss exceeds conversion gain)

3. **Tertiary:** Current benchmark (65%+) is valid for our category
   - Risk: Kitchen/home category might have 45–50% natural baseline (complexity of shipping furniture)
   - Experiment: Benchmark 5 competitors; if all at 50%, adjust target from 52% to 48%
   - Impact: Reduces expected value from €52k to €30k, but intervention still positive ROI

---

### OWNER & ACCOUNTABILITY

**Directly Responsible:** PM (Yana, starting W1)
- Decision-maker on form design; ensures DoD compliance; A/B test interpretation

**Technical Owner:** Developer (Petro)
- Form redesign implementation; speed optimization; staging regression test; feature flag deployment

**Product Validation:** Marketer (Olha)
- A/B test setup in analytics; daily metrics review; repeat rate tracking; business impact reporting

**Data Verification:** Accountant (Inna)
- Monthly contribution tracking (actual vs. forecast); ensures P&L impact is attributed correctly

**Decision Authority:** Owner (Vlad)
- Sign-off on form design (brand/usability risk); decision gate for A/B test go-live; approval for production deployment

---

### MEASUREMENT & TRACKING (Weekly + Monthly)

**Weekly Metrics Dashboard (For PM + Owner):**

| Metric | Target | Why | Frequency |
|--------|--------|-----|-----------|
| Form design % complete vs. DoD | 100% by W2 end | Gate to dev | Daily |
| Dev velocity (hours spent vs. sprint) | On track for W2 finish | Risk early warning | Daily |
| Speed optimization LCP (staging) | <2.7s | Dev progress | Daily |
| A/B test traffic (sessions collected) | 500/day | Pacing toward 10k in 2 weeks | Daily |
| A/B test completion rate (live) | Treatment vs. control | Primary metric tracking | Daily |
| Form field drop-off rates | No increase | Regression detection | Weekly |
| Mobile session count trend | +5% week-over-week | Baseline traffic | Weekly |

**Monthly Metrics (For Owner + Accountant):**

| Metric | Baseline | Target | Impact |
|--------|----------|--------|--------|
| Mobile checkout completion rate | 43.6% | 50–52% | Revenue impact (€52k P50) |
| Mobile form submission rate | ~92% (baseline) | ≥95% | Measurement confidence |
| Guest checkout adoption | 0% | 20–30% | Insight on user preference |
| Repeat rate (treated cohorts) | 13% | ≥13% (no decline) | Downside risk check |
| Mobile AOV | €78 (current) | €78+ (maintain) | Avoid selection bias (lower intent users) |
| P&L contribution from mobile orders | €1,456/month (baseline) | €2,100/month (P50) | Direct bottom-line impact |
| CAC trend on paid channels | €18 (baseline) | ≤€18 (stable) | Ensure CAC doesn't increase as conversion improves |

---

### DECISION

**Gate 1: Form Design Approval (End of W1)**
- Owner reviews wireframes
- Decision: Approve design OR request changes OR descope to speed-only
- If approved: Dev starts implementation

**Gate 2: A/B Test Go-Live (Mid-W2, After Staging QA)**
- PM verifies staging test passed (zero auth/payment errors)
- Developer confirms feature flag is wired
- Marketer confirms analytics tracking is live
- Decision: Launch A/B test OR delay to next week

**Gate 3: A/B Test Results (End of W3)**
- Primary metric: Checkout completion
- Statistical significance: p < 0.05 required
- Decision matrix:

| Completion Rate (Treatment) | Decision | Next Step |
|---|---|---|
| ≥51% (p<0.05) | Deploy to 100% | Permanent fix; move to CRM phase (F026) |
| 48–50% (p<0.05) | Deploy with caution | Roll out gradually; prepare rollback; monitor repeat rate |
| 45–47% (p>0.05) | Kill form redesign | Speed-only wins; keep deployed; pivot to speed as primary |
| <45% | Kill entire intervention | Platform issue (not UX); escalate to platform migration study (F031) |

---

## FINDING TSK-F023: GA4 Configuration Broken (−22% Undercounting)

### CLAIM
GA4 is undercounting orders by 22% (1,420 GA4 vs. 1,821 ERP last month); all paid channel optimization and CAC decisions are misdirected.

**Epistemic Level:** E1 (Measured fact: GA4 vs. ERP order count comparison)

**Severity:** CRITICAL (Decision quality blocker; prevents correct prioritization of all acquisition, F024–F025)

---

### EVIDENCE LAYER

#### Primary Evidence
**Source:** GA4 admin dashboard + Stripe payment records + ERP

**Data:**
- GA4 conversions (July 2026): 1,420 orders
- Stripe order records (July 2026): 1,821 orders
- Gap: 401 orders (−22%)
- Correlation by day: GA4 spikes/dips correlate with Stripe (r=0.78), suggesting systematic undercounting, not random error

**Quality:** E1 (Direct measurement from two independent systems)

**Sample:**
- Date range: July 2026 (30 days, full month)
- Stripe: Complete record of all charge attempts
- GA4: Conversion events tagged in GA4

#### Secondary Evidence
**Source:** Google Analytics audit tools + Browser dev console logs

**Data:**
- Google Analytics Debugger (browser extension) shows GA4 gtag.js event firing ~78% of sessions
- Ad blocker prevalence in audience: Estimated 22% of browsers have tracking blocker (ublockorigin, etc.)
- Client-side event tracking: 22% of page loads have gtag.js blocked by adblocker
- Server-side tracking: Not implemented (no fallback)

**Quality:** E2 (Pattern: adblocker detection + event firing correlation)

#### Gaps in Evidence
**What would make this E2 (Pattern) → E3 (Mechanism)?**
1. Implement server-side tracking and measure gap closure
   - Current gap: Know the problem exists, but not which traffic source is most affected
   - Required: Tag events server-side (GTM server-side container); compare GA4 to server events

---

### ROOT CAUSE

**L0 Symptom:** GA4 undercounts orders by 22%

**L1 Mechanism:** Client-side tracking (gtag.js) blocked by ad blockers on ~22% of browsers

**L2 Technical Debt:** No server-side tracking fallback (e.g., Google Tag Manager server-side)
- Only gtag.js implemented (fires from user's browser)
- If browser has adblocker, gtag.js never fires; event is lost

**L3 Organizational:** GA4 was set up in 2023 (when server-side tracking was less common); never updated

---

### BUSINESS IMPACT

**Impact Mechanism:** 
- Today: Owner sees GA4 shows ROAS 3.2 (1,420 orders / €442k ad spend)
- Reality: True ROAS 2.49 (1,821 orders / €730k total ad spend implied by conversion rate)
- Implication: Owner believes Google Ads is 28% more efficient than it actually is
- Consequence: Owner overinvests in Google Ads (because metrics are lying); underinvests in other channels

**Financial Impact:**
- Allocation error: Owner allocates €100k Google budget on false confidence
- True yield: That €100k generates €249k revenue (4-month payback)
- Illusion: GA4 says €100k → €320k revenue (due to 22% undercounting; looks better than it is)
- Misdirection: Owner starves other channels (F025 channel diversification) because Google "looks" too good

**P10/P50/P90:**
- P10: €0 (no action taken; GA4 undercounting is noise)
- P50: €50k (fixing GA4 reveals one channel is unprofitable; reallocates budget; saves loss on bad channel)
- P90: €100k (if undercounting was masking that paid channels are underwater; server-side fix averts crisis)

---

### INTERVENTION

**Primary Intervention: Implement Server-Side Tracking**

**What:**
1. Set up Google Tag Manager server-side container (hosted on Google Cloud)
2. Migrate order event tracking from client-side gtag.js to server-side (via Stripe webhook)
3. Cross-check: GA4 events from server-side should match Stripe orders ≤5% gap

**Why:** Server-side tracking fires even if browser has adblocker; captures full event

**Owner:** Developer (GTM setup, 3–5 days)

**Timeline:**
- W1 Day 1–2: Set up GTM server-side container
- W1 Day 3–5: Route Stripe webhooks to GTM server-side; test in staging
- W2 Day 1: Deploy server-side tracking; run parallel (client + server) for 1 week
- W2 Day 8: Compare GA4 (client-side) vs. GA4 (server-side); measure gap

---

### EXPERIMENT

**Parallel Tracking Test (1 week):**
- Keep client-side gtag.js live
- Add server-side gtag event from Stripe webhook
- Compare GA4 order counts from both sources
- Target: Server-side GA4 matches Stripe order counts ≤5%

---

### KILL CRITERION

❌ **Stop if:** Server-side tracking setup takes >10 days (dev capacity issue; deprioritize GA4, use Stripe data directly for decisions)

---

### DECISION

**Gate: Server-Side Tracking Live (W2)**
- Test results: GA4 (server-side) matches Stripe records ≤5% gap?
- If YES: Retire client-side tracking; GA4 is now trusted; proceed with channel optimization (F024)
- If NO: Gap still >10% → Deeper issue (payment gateway tag missing); escalate

**Implication:** This fix is prerequisite for all acquisition decisions (F024–F025). Until F023 is resolved, all CAC/ROAS metrics are unreliable.

---

## FINDING TSK-F026: No Repeat Rate Program (13% is Orphaned)

### CLAIM
41k customer base has zero retention program (no email nurture, no loyalty program); repeat rate 13% vs. 25–30% benchmark represents €150k/year opportunity.

**Epistemic Level:** E3 (Mechanism: email + loyalty programs are proven retention tactics; Testik's magnitude is unproven)

**Severity:** CRITICAL (€150k opportunity + 8 weeks implementation + highest ROI per dollar)

---

### EVIDENCE LAYER

#### Primary Evidence
**Source:** CRM (customer email list) + GA4 + Order history

**Data:**
- Customer base: 41,320 unique emails (24 months order history)
- Current repeat rate: 13% (customers with 2+ orders in 365 days)
- Industry benchmark (kitchen/home): 25–30%
- Gap: 12–17 pp improvement opportunity
- Corresponding revenue opportunity: 41k × 15% additional repeat rate × €43.7 repeat LTV = €268k (upper bound)

**Quality:** E1 (Fact: repeat rate is measured from order data; benchmark is external standard)

#### Secondary Evidence
**Source:** Email platform audit + Competitor CRM audit

**Data:**
- Current email touchpoints: Only purchase confirmation (transactional)
- Competitor email programs: Welcome sequence (5 emails), post-purchase nurture (4 emails), re-engagement (3 emails)
- Testik email: None of these implemented

**Quality:** E2 (Pattern: competitor benchmarking)

#### Gaps in Evidence
**What would make this E4?**
1. Run pilot email program; measure repeat rate lift
   - Current gap: Don't know Testik's elasticity to email (industry standard is 5–10% repeat rate lift, but Testik might be 2% or 15%)
   - Required: 8-week email campaign to cohort of 5k customers; A/B measure vs. control group (no email)

---

### ROOT CAUSE

**L0 Symptom:** Repeat rate 13%

**L1 Mechanism:** No retention touchpoints (email, loyalty, personalization)
- Email: No nurture, no re-engagement sequences
- Loyalty: No program (points, referral, VIP)
- Personalization: No post-purchase product recommendations

**L2 Technical Debt:** No email/CRM platform (requires 3rd-party tool; not native WooCommerce)
- WooCommerce has no email automation
- Manual email is impractical at 41k scale

**L3 Organizational:** Marketer is acquisition-focused; retention is afterthought
- Owner's KPI: Revenue growth (via CAC optimization)
- Retention improvement is slower, less visible than CAC optimization
- No PM owns retention; falls between operations and marketing

---

### BUSINESS IMPACT

**Impact Mechanism:**
- Today: 41k customers, 13% repeat = 5,330 repeat customers/year
- Target: 41k customers, 22% repeat = 9,020 repeat customers/year
- Incremental: 3,690 repeat customers
- Revenue: 3,690 × €43.7 repeat LTV = €161k/year

**Confidence Distribution:**

| Scenario | Repeat Rate | Incremental Customers | LTV Impact | Probability |
|----------|---|---|---|---|
| P10 (Email alone) | 16% | +1,230 | €53k | 10% |
| P50 (Email + loyalty) | 22% | +3,690 | €161k | 50% |
| P90 (Email + loyalty + personalization) | 28% | +6,150 | €268k | 10% |

**P10/P50/P90:** €53k / €161k / €268k

---

### INTERVENTION

**Part A: Email Retention Program**

**Phases:**
1. **Welcome Sequence (Day 0–14):**
   - Day 0: Welcome + care guide #1
   - Day 3: Product care guide + cross-sell
   - Day 7: Common Q&A + loyalty program intro
   - Day 14: Reorder reminder + NPS survey

2. **Nurture Sequence (Month 1–3):**
   - Monthly seasonal care tips
   - Product spotlights (seasonal relevance)
   - Educational content (care experts positioning, F006)

3. **Re-Engagement Sequence (60+ days inactive):**
   - Win-back campaign: "We miss you" + special offer
   - Target: Customers with zero purchases last 60 days

**Part B: Loyalty Program**

**Structure:**
- Points-based: 1 point = €0.01; redeem at €20 threshold
- Bonus: 5x points on repeat purchase #2 (encourages first repeat)
- VIP: Customers with 3+ purchases get free shipping on next order

---

### EXPERIMENT

**8-Week Email Pilot (Segment: Inactive Customers)**

**Design:**
- **Treatment Group:** 5,000 inactive customers receive welcome + nurture sequence
- **Control Group:** 5,000 inactive customers receive no email
- **Metric:** Repeat rate (orders within 60 days post-intervention)

**Hypothesis:**
- H0: Email sequence does not increase repeat rate
- Ha: Email sequence increases repeat rate by ≥3 pp

**Duration:** 8 weeks (60 days for order behavior + 30 days for email opens to settle)

**Expected Results:**
- Control: ~7% repeat rate (baseline for inactive segment)
- Treatment: ~12% repeat rate (5 pp lift, in line with industry benchmark)

---

### KILL CRITERION

❌ **Stop the email program if:** Pilot shows <2 pp repeat rate lift
- Implication: Email isn't resonating with Testik's audience; may be product/quality issue, not marketing

❌ **Stop the loyalty program if:** Participation rate <5% (few customers redeem points)
- Implication: Incentive structure wrong; pivot to simpler referral instead

---

### COUNTERARGUMENT LAYER

**Question 1:** What if repeat rate is constrained by product quality, not retention marketing?

**Risk:** Email marketing improves first-order repeat, but customers don't re-purchase because product isn't worth reordering (one-time purchase category).

**Falsification Test:**
- NPS survey (F030) on first-time buyers: Are they satisfied with product quality?
- If NPS >50 (satisfied): Retention marketing should work
- If NPS <40 (dissatisfied): Fix product first; email won't help

---

**Question 2:** What if competitors aren't actually achieving 25–30% repeat rate in kitchen/home category?

**Risk:** Benchmark might be wrong; 13% could be normal for commoditized kitchen products.

**Falsification Test:**
- Audit 5 competitor repeat rates (infer from brand search trends, email frequency, social media customer testimonials)
- If competitors have 20%+ repeat: Benchmark is valid; pursue retention program
- If competitors have 12–15% repeat: Category baseline is 13%; don't overspend on retention (focus on CAC instead)

---

**Question 3:** What if email program improves repeat rate but harms NPS (customer fatigue)?

**Risk:** 8-email program over 12 weeks might be too aggressive; customers unsubscribe or complain.

**Falsification Test:**
- Email unsubscribe rate <3% (acceptable)
- Customer complaint rate (email feedback) <1%
- If either threshold exceeded: Reduce email frequency (move to monthly, not weekly)

---

### OWNER & ACCOUNTABILITY

**Directly Responsible:** Marketer (Olha)
- Email strategy, copy, segmentation
- Loyalty program design

**Platform Owner:** PM (Yana)
- Email tool selection + setup (Klaviyo, ConvertKit, etc.)
- Integration with Stripe webhook
- Segment implementation

**Measurement:** Accountant (Inna) + Marketer
- Weekly repeat rate tracking
- Monthly LTV attribution
- Loyalty program spend vs. ROI

**Decision Authority:** Owner (Vlad)
- Loyalty program discount approval (impact on margin)
- Email frequency approval (risk of brand perception)

---

### MEASUREMENT

**Weekly Metrics:**
- Email open rate (target: >25%)
- Email click rate (target: >2%)
- Repeat rate (treated cohorts, 7-day lag)
- Unsubscribe rate (monitor, target: <1%/week)

**Monthly Metrics:**
- Repeat rate by segment (first-time vs. repeat customers)
- Loyalty program participation (% of customers who joined, % who redeemed)
- Revenue attribution (orders from email, directly vs. assisted)
- LTV lift (treated cohort vs. control, 90-day window)

---

### TIMELINE

**W1:** Email platform chosen, sequences drafted
**W2:** Email platform live, welcome sequence goes live for new customers
**W3:** Loyalty program designed, pilot with 1,000 customers
**W4:** Loyalty program scales to all customers
**W2–W9:** Pilot continues; measure repeat rate weekly
**W10:** Results analyzed; decision on scale

---

## SUMMARY TABLE: 3 Critical Finding Objects

| Finding | Claim | E-Level | Severity | P50 Impact | Owner | Decision Gate |
|---------|-------|---------|----------|-----------|-------|---|
| **F014** | Mobile speed + form friction → €120k recovery | E3 | CRITICAL | €52k | PM | W2: A/B results |
| **F023** | GA4 broken (−22% undercounting) → blocks all optimization | E1 | CRITICAL | €50k (risk mitigation) | Developer | W2: Server-side live |
| **F026** | No retention program → €150k repeat rate opportunity | E3 | CRITICAL | €161k | Marketer | W3: Pilot results |

---

**Status:** Three critical findings fully mapped with 16-field Finding Objects.  
**Next Action:** Apply same structure to remaining 28 findings; build counterargument layer for each.
