import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  CircleCheck,
  FileCheck2,
  FileText,
  Fingerprint,
  Link2,
  LoaderCircle,
  Search,
  ShieldCheck,
  ShieldX,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type { AgentResult, Evidence } from "../lib/runAgent";
import type { RefObject } from "react";

export type ReviewAction = "rewrite" | "source" | "approve";
export const REVIEW_MESSAGES: Record<ReviewAction, string> = {
  rewrite:
    "Status updated: Conditional approval after revision. Keep supported claims, add primary citations, and remove unsupported forecasting language.",
  source:
    "Status updated: Awaiting authoritative evidence. Find a primary report or dataset for the flagged claims, then reassess the revised report.",
  approve:
    "Status updated: Human override recorded — approved by you. The original recommendation and evidence gaps remain visible for review.",
};

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const Icon =
    evidence.kind === "claim"
      ? FileCheck2
      : evidence.kind === "source" || evidence.kind === "original"
        ? Link2
        : TriangleAlert;
  return (
    <article
      className={`evidence-card ${evidence.concern ? "is-concern" : ""}`}
    >
      <span className="evidence-icon">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h4>{evidence.title}</h4>
        <p>{evidence.excerpt}</p>
        {evidence.kind === "original" && (
          <span className="source-note">
            Reference recorded · content not independently checked
          </span>
        )}
      </div>
    </article>
  );
}

interface Props {
  result: AgentResult | null;
  loading: boolean;
  reviewAction: ReviewAction | null;
  onReview: (action: ReviewAction) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

export default function DecisionPanel({
  result,
  loading,
  reviewAction,
  onReview,
  headingRef,
}: Props) {
  const tone =
    result?.action === "APPROVE FOR USE"
      ? "positive"
      : result?.action === "BLOCK PUBLICATION"
        ? "danger"
        : result?.action === "ESCALATE TO HUMAN REVIEW"
          ? "warning"
          : "revision";
  const StatusIcon =
    tone === "positive"
      ? CircleCheck
      : tone === "danger"
        ? ShieldX
        : tone === "warning"
          ? TriangleAlert
          : FileCheck2;

  return (
    <section
      className={`panel decision-panel ${result ? "has-result" : ""}`}
      aria-labelledby="decision-heading"
      aria-busy={loading}
    >
      <div className="panel-heading">
        <div className="flex items-center gap-3">
          <span className="step-number">02</span>
          <h2 id="decision-heading" ref={headingRef} tabIndex={-1}>
            Your next step
          </h2>
        </div>
        <span className={`panel-state ${result ? "is-ready" : ""}`}>
          <span />
          {loading
            ? "Reviewing"
            : result
              ? "Review complete"
              : "Awaiting evidence"}
        </span>
      </div>

      {!result ? (
        <div className="empty-decision">
          <div className="evidence-diagram" aria-hidden="true">
            <div className="diagram-inputs">
              <div>
                <Link2 size={20} />
                <span>Source</span>
              </div>
              <div>
                <FileText size={20} />
                <span>Report</span>
              </div>
            </div>
            <div className="diagram-connector" />
            <div className={`diagram-shield ${loading ? "is-loading" : ""}`}>
              {loading ? (
                <LoaderCircle className="animate-spin" size={32} />
              ) : (
                <ShieldCheck size={34} strokeWidth={1.6} />
              )}
            </div>
            <div className="diagram-connector single" />
            <div className="diagram-outcome">
              <CheckCheck size={19} />
              <span>Clear next step</span>
            </div>
          </div>
          <span className="eyebrow">EVIDENCE IN. DIRECTION OUT.</span>
          <h3>
            {loading ? "Connecting the evidence…" : "A clearer path forward."}
          </h3>
          <p role={loading ? "status" : undefined}>
            {loading
              ? "Reviewing claims, findings, and source quality…"
              : "Give your agent the source, the context, and the report. Get a recommendation you can trace back to the evidence."}
          </p>
          {!loading && (
            <div className="empty-features">
              <span>
                <Check size={14} />
                Traceable reasoning
              </span>
              <span>
                <Check size={14} />
                Human judgment built in
              </span>
            </div>
          )}
          <div className="output-preview">
            <span className="preview-label">YOUR DECISION WILL INCLUDE</span>
            <div>
              <span>
                <Fingerprint size={16} />
                Evidence trail
              </span>
              <span>
                <TriangleAlert size={16} />
                Uncertainty
              </span>
              <span>
                <UserRound size={16} />
                Human action
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="decision-content">
          <div className={`action-banner ${tone}`}>
            <StatusIcon size={20} aria-hidden="true" />
            <span>{result.action}</span>
          </div>
          <div className="decision-context">
            <h3>Decision at stake</h3>
            <p>{result.role}</p>
          </div>
          <p className="recommendation-summary">{result.summary}</p>
          <div className="confidence">
            <div className="flex items-center justify-between gap-3">
              <span>
                Recommendation confidence{" "}
                <span className="mock-label">MOCK</span>
              </span>
              <strong>{result.confidence}%</strong>
            </div>
            <div
              className="confidence-track"
              role="meter"
              aria-label="Mock recommendation confidence"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={result.confidence}
            >
              <span style={{ width: `${result.confidence}%` }} />
            </div>
            <p>
              Confidence in the suggested next step, not a factual accuracy
              score.
            </p>
          </div>
          <div className="result-section">
            <div className="result-section-heading">
              <h3>
                <BookOpen size={16} />
                Evidence used
              </h3>
              <span>{result.evidence.length} report references</span>
            </div>
            <div className="evidence-list">
              {result.evidence.map((evidence, index) => (
                <EvidenceCard
                  key={`${index}-${evidence.title}`}
                  evidence={evidence}
                />
              ))}
            </div>
          </div>
          <div className="uncertainty-box">
            <h3>
              <TriangleAlert size={16} />
              What the report could not verify
            </h3>
            <ul>
              {result.uncertainties.map((uncertainty) => (
                <li key={uncertainty}>{uncertainty}</li>
              ))}
            </ul>
          </div>
          <div className="human-action">
            <span className="human-icon">
              <UserRound size={18} />
            </span>
            <div>
              <h3>Recommended human action</h3>
              <p>{result.humanAction}</p>
            </div>
          </div>
          <div className="review-actions">
            <p>You make the final call.</p>
            <button
              type="button"
              className={`review-primary ${reviewAction === "rewrite" ? "selected" : ""}`}
              onClick={() => onReview("rewrite")}
              aria-pressed={reviewAction === "rewrite"}
            >
              <FileCheck2 size={16} />
              Request a sourced rewrite
              <ArrowRight size={16} className="ml-auto" />
            </button>
            <div className="secondary-review">
              <button
                type="button"
                onClick={() => onReview("source")}
                aria-pressed={reviewAction === "source"}
              >
                <Search size={15} />
                Find an authoritative source
              </button>
              <button
                type="button"
                onClick={() => onReview("approve")}
                aria-pressed={reviewAction === "approve"}
              >
                <Check size={15} />
                Override and approve
              </button>
            </div>
          </div>
          {reviewAction && (
            <div className="review-message" role="status">
              <CircleCheck size={17} />
              <p>{REVIEW_MESSAGES[reviewAction]}</p>
            </div>
          )}
          <p className="result-footnote">
            <Sparkles size={12} />
            Local demo recommendation · Human review remains in your hands
          </p>
        </div>
      )}
    </section>
  );
}
