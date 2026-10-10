import assert from "node:assert/strict";
import test from "node:test";
import { runAgent } from "./runAgent.ts";
import { DEMO_INPUT } from "./demo.ts";

test("report evidence changes the action and is preserved in the result", async () => {
  const cases = [
    [
      "Claim 1 · Supported: Sales grew. Findings: No critical issues.",
      "APPROVE FOR USE",
    ],
    [
      "Claim 2 · Not enough evidence: The sales forecast lacks a citation.",
      "REWRITE WITH CITATIONS",
    ],
    [
      "CRITICAL finding: Unsupported causal framing. Claim 1 · Supported.",
      "ESCALATE TO HUMAN REVIEW",
    ],
    [
      "Claim 1 · Contradicted: Sales fell rather than grew.",
      "BLOCK PUBLICATION",
    ],
    [
      "Sources: No primary sources. Claim 1 · Supported by commentary.",
      "PULL ANOTHER SOURCE",
    ],
    [
      "Verdict: Pending. The report has not reached a conclusion.",
      "PULL ANOTHER SOURCE",
    ],
    [
      "Claim 1 · Supported: The result was not contradicted. No unsupported claims.",
      "APPROVE FOR USE",
    ],
  ] as const;
  await Promise.all(
    cases.map(async ([report, expected]) => {
      const input = { ...DEMO_INPUT, report };
      const result = await runAgent(input);
      assert.equal(result.action, expected, report);
      assert.equal(result.role, input.role);
      assert.ok(result.evidence.length >= 3 && result.evidence.length <= 4);
      assert.ok(result.evidence.some((item) => item.excerpt === input.source));
      assert.ok(result.evidence.some((item) => report.includes(item.excerpt)));
      assert.ok(
        result.uncertainties.some((item) => item.includes("not been opened")),
      );
    }),
  );
});

test("EV demo recommends a rewrite and traces its gap, finding, and source", async () => {
  const result = await runAgent(DEMO_INPUT);
  assert.equal(result.action, "REWRITE WITH CITATIONS");
  assert.ok(result.evidence.some((item) => item.title.includes("Claim 2")));
  assert.ok(
    result.evidence.some((item) => item.excerpt.includes("Forecast gap")),
  );
  assert.ok(
    result.evidence.some((item) => item.excerpt.includes("Secondary source")),
  );
});
