export interface AgentInput {
  source: string;
  role: string;
  report: string;
}

export type AgentAction =
  | "APPROVE FOR USE"
  | "REWRITE WITH CITATIONS"
  | "PULL ANOTHER SOURCE"
  | "ESCALATE TO HUMAN REVIEW"
  | "BLOCK PUBLICATION";

export interface Evidence {
  title: string;
  excerpt: string;
  kind: "claim" | "finding" | "source" | "original";
  concern: boolean;
}

export interface AgentResult {
  action: AgentAction;
  role: string;
  summary: string;
  confidence: number;
  evidence: Evidence[];
  uncertainties: string[];
  humanAction: string;
  reviewedAt: string;
}

const RECOMMENDATIONS: Record<
  AgentAction,
  { summary: string; humanAction: string; confidence: number }
> = {
  "APPROVE FOR USE": {
    summary:
      "The report marks the claims as supported and identifies no material blockers. The answer is ready to use within the scope of the cited evidence.",
    humanAction:
      "Check that citations match the final wording, preserve the source’s context, and approve the answer for the decision at hand.",
    confidence: 92,
  },
  "REWRITE WITH CITATIONS": {
    summary:
      "The report supports parts of the answer, but leaves an evidence gap. Keep the supported claims and revise the uncertain statements before relying on them.",
    humanAction:
      "Request a sourced rewrite. Add primary citations to uncertain claims and qualify or remove forecasts the evidence does not establish.",
    confidence: 84,
  },
  "PULL ANOTHER SOURCE": {
    summary:
      "The report does not provide enough reliable evidence to justify approval. An authoritative source is needed before this answer can inform the decision.",
    humanAction:
      "Find a primary report or dataset that directly addresses the claim, then run an updated trust report before proceeding.",
    confidence: 76,
  },
  "ESCALATE TO HUMAN REVIEW": {
    summary:
      "The report flags a material issue that needs professional judgment. Pause use of the answer until a reviewer resolves the flagged evidence.",
    humanAction:
      "Ask a subject-matter reviewer to inspect the flagged claims against primary evidence and revise the answer before approval.",
    confidence: 89,
  },
  "BLOCK PUBLICATION": {
    summary:
      "The report contains a contradicted claim or an explicit publication blocker. Publishing the answer as written could carry a known error into the decision.",
    humanAction:
      "Hold publication. Correct or remove the contradicted claims, obtain primary citations, and reassess the revised answer.",
    confidence: 95,
  },
};

// All decision rules are local demo heuristics, not independent fact verification.
// Replace this function's body with your API call; keep the AgentResult contract.
export async function runAgent(input: AgentInput): Promise<AgentResult> {
  await new Promise<void>((resolve) => setTimeout(resolve, 1400));

  const lines = input.report
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  // Avoid interpreting "no critical issues" or "not contradicted" as a blocker.
  const signalText = input.report
    .replace(
      /\b(?:no|without)\s+(?:critical|unsupported|contradicted)(?:\s+(?:issues?|claims?|findings?))?/gi,
      "",
    )
    .replace(/\bnot\s+(?:unsupported|contradicted)\b/gi, "");
  const hasCritical = /\b(?:critical|unsupported)\b/i.test(signalText);
  const hasContradiction = /\bcontradicted\b|\bblock publication\b/i.test(
    signalText,
  );
  const hasGap = /not enough evidence|insufficient evidence|unverified/i.test(
    signalText,
  );
  const hasSupported = /\bsupported\b/i.test(signalText);
  const hasSourceGap =
    /(?:missing|no|unavailable|unreliable)\s+(?:primary\s+)?sources?|no primary evidence/i.test(
      signalText,
    );

  let action: AgentAction = "PULL ANOTHER SOURCE";
  if (hasContradiction) action = "BLOCK PUBLICATION";
  else if (hasCritical) action = "ESCALATE TO HUMAN REVIEW";
  else if (hasSourceGap) action = "PULL ANOTHER SOURCE";
  else if (hasGap) action = "REWRITE WITH CITATIONS";
  else if (hasSupported) action = "APPROVE FOR USE";

  const claimLines = lines.filter((line) => /^claim\s+\d+/i.test(line));
  const concernPattern =
    /not enough evidence|critical|unsupported|contradicted|insufficient|unverified|gap|missing|not primary/i;
  const priorityClaims = [
    ...claimLines.filter((line) => concernPattern.test(line)),
    ...claimLines.filter((line) => !concernPattern.test(line)),
  ];
  const finding = lines.find((line) =>
    /^(?:critical\s+)?finding\s*[·:\-]/i.test(line),
  );
  const source =
    lines.find(
      (line) =>
        /^(?:secondary|primary) source\s*[:·]|^sources?\s*:\s*\S/i.test(line) &&
        concernPattern.test(line),
    ) ??
    lines.find((line) =>
      /^(?:secondary|primary) source\s*[:·]|^sources?\s*:\s*\S/i.test(line),
    );
  const evidence: Evidence[] = priorityClaims.slice(0, 1).map((line) => ({
    title: line.split(":")[0],
    excerpt: line.includes(":")
      ? line.slice(line.indexOf(":") + 1).trim()
      : line,
    kind: "claim",
    concern: concernPattern.test(line),
  }));
  if (finding && evidence.length < 3)
    evidence.push({
      title: "Report finding",
      excerpt: finding,
      kind: "finding",
      concern: concernPattern.test(finding),
    });
  if (source && evidence.length < 3)
    evidence.push({
      title: "Source quality · Report excerpt",
      excerpt: source,
      kind: "source",
      concern: concernPattern.test(source),
    });
  for (const line of priorityClaims.slice(1)) {
    if (evidence.length >= 3) break;
    evidence.push({
      title: line.split(":")[0],
      excerpt: line,
      kind: "claim",
      concern: concernPattern.test(line),
    });
  }
  // Unstructured reports still show real excerpts rather than invented claims.
  if (evidence.length < 3) {
    for (const line of lines) {
      if (evidence.length >= 3) break;
      if (
        line.length > 20 &&
        !claimLines.includes(line) &&
        line !== finding &&
        line !== source
      ) {
        evidence.push({
          title: "Trust report · Report excerpt",
          excerpt: line,
          kind: "finding",
          concern: concernPattern.test(line),
        });
      }
    }
  }
  if (evidence.length < 2)
    evidence.push({
      title: "Source quality · Not established",
      excerpt:
        "The pasted text does not include enough distinct evidence elements to establish source quality.",
      kind: "source",
      concern: true,
    });
  evidence.push({
    title: "Original source · Provided reference",
    excerpt: input.source,
    kind: "original",
    concern: false,
  });

  const uncertainties = [
    ...(hasGap
      ? [
          "Claims marked “Not enough evidence” remain unresolved; a report verdict cannot fill the evidence gap.",
        ]
      : []),
    ...(hasCritical || hasContradiction
      ? [
          "The cause and extent of the flagged issue require review of the underlying primary evidence.",
        ]
      : []),
    "The original URL and cited sources have not been opened or independently checked in this demo.",
    "The report cannot establish whether the answer includes every caveat relevant to your professional decision.",
  ];

  return {
    action,
    role: input.role,
    ...RECOMMENDATIONS[action],
    evidence,
    uncertainties,
    reviewedAt: new Date().toISOString(),
  };
}
