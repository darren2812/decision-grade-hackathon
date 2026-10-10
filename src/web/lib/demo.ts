import type { AgentInput } from "./runAgent";

export const DEMO_INPUT: AgentInput = {
  source: "https://www.iea.org/reports/global-ev-outlook-2024",
  role: "Senior policy editor deciding whether to publish a public briefing",
  report: `EZIO TRUST REPORT · EV MARKET BRIEFING

Verdict: NEEDS REVISION
Module scores: Accuracy 78/100 · Source quality 84/100 · Completeness 62/100

Claim analysis:
Claim 1 · Supported: Global electric car sales reached nearly 14 million in 2023.
Claim 2 · Not enough evidence: EVs will account for 50% of all global car sales by 2030.
Claim 3 · Supported: China represented the largest share of electric car sales in 2023.

Sources:
Primary source: IEA, Global EV Outlook 2024.
Secondary source: News commentary used for the 2030 forecast; not primary evidence.

Findings:
Finding · Forecast gap: The cited source does not establish the 50% projection across all policy scenarios.
Finding · Missing context: Forecast wording omits policy and regional assumptions.
Recommendation: Keep historical claims, add a primary citation for any forecast, and state its scenario assumptions.`,
};

export const REPORT_PLACEHOLDER = `Verdict: NEEDS REVISION
Module scores: Accuracy 78/100 · Source quality 84/100

Claim analysis:
Claim 1 · Supported: EV sales reached nearly 14 million in 2023.
Claim 2 · Not enough evidence: EVs will reach 50% of sales by 2030.

Sources: IEA Global EV Outlook 2024; news commentary.
Findings: Forecast scenario assumptions are missing.`;
