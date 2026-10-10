import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  Check,
  CircleHelp,
  FileText,
  FlaskConical,
  Link2,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import DecisionPanel from "./components/DecisionPanel";
import type { ReviewAction } from "./components/DecisionPanel";
import { DEMO_INPUT, REPORT_PLACEHOLDER } from "./lib/demo";
import { runAgent } from "./lib/runAgent";
import type { AgentInput, AgentResult } from "./lib/runAgent";
import "./App.css";

const EMPTY_INPUT: AgentInput = { source: "", role: "", report: "" };
type Field = keyof AgentInput;

function validate(input: AgentInput): Record<Field, string> {
  let source = "";
  if (!input.source.trim()) source = "Add the original source URL.";
  else {
    try {
      const url = new URL(input.source.trim());
      if (
        !["https:", "http:"].includes(url.protocol) ||
        !url.hostname.includes(".") ||
        url.username ||
        url.password
      )
        source = "Enter a valid public URL starting with https:// or http://.";
    } catch {
      source =
        "Enter a valid URL, such as https://example.com/official-report.";
    }
  }
  return {
    source,
    role:
      input.role.trim().length < 10 || !/[a-z]/i.test(input.role)
        ? "Describe your role and decision in at least 10 characters."
        : "",
    report:
      input.report.trim().length < 30 || !/[a-z]/i.test(input.report)
        ? "Paste a trust report with at least 30 characters of evidence."
        : "",
  };
}

export default function App() {
  const [input, setInput] = useState<AgentInput>(EMPTY_INPUT);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const sourceRef = useRef<HTMLInputElement>(null);
  const helpRef = useRef<HTMLDialogElement>(null);
  const errors = validate(input);
  const valid = Object.values(errors).every((value) => !value);
  const completeCount = Object.values(errors).filter((value) => !value).length;

  useEffect(() => {
    if (helpOpen) helpRef.current?.showModal();
    else helpRef.current?.close();
  }, [helpOpen]);

  function updateField(field: Field, value: string) {
    setInput((previous) => ({ ...previous, [field]: value }));
    setResult(null);
    setReviewAction(null);
    setError("");
    setNotice("");
  }

  function reset() {
    setInput(EMPTY_INPUT);
    setResult(null);
    setReviewAction(null);
    setTouched({});
    setError("");
    setNotice("New assessment ready.");
    sourceRef.current?.focus();
  }

  function loadDemo() {
    setInput({ ...DEMO_INPUT });
    setResult(null);
    setReviewAction(null);
    setTouched({});
    setError("");
    setNotice(
      "EV-market demo loaded. Run the agent to see its recommendation.",
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ source: true, role: true, report: true });
    if (!valid || loading) return;
    setLoading(true);
    setResult(null);
    setReviewAction(null);
    setError("");
    setNotice("");
    try {
      const decision = await runAgent({
        source: input.source.trim(),
        role: input.role.trim(),
        report: input.report.trim(),
      });
      setResult(decision);
      requestAnimationFrame(() => {
        resultHeadingRef.current?.focus({ preventScroll: true });
        if (window.matchMedia("(max-width: 900px)").matches)
          resultHeadingRef.current?.scrollIntoView({ block: "start" });
      });
    } catch {
      setError(
        "The assessment could not be completed. Your inputs are saved here; please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#assessment">
        Skip to assessment
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a href="#" className="brand" aria-label="TrustGate home">
            <span className="brand-icon">
              <ShieldCheck size={25} strokeWidth={1.8} />
            </span>
            <div>
              <span className="brand-name">TrustGate</span>
              <span className="brand-subtitle">
                Evidence-aware next-step decisions
              </span>
            </div>
          </a>
          <div className="header-actions">
            <span className="demo-pill">
              <span />
              Demo workspace
            </span>
            <button
              type="button"
              className="help-button"
              aria-label="How it works"
              onClick={() => setHelpOpen(true)}
            >
              <CircleHelp size={17} />
              <span>How it works</span>
            </button>
            <span className="header-divider" />
            <button
              type="button"
              className="new-assessment"
              onClick={reset}
              disabled={loading}
            >
              <Plus size={16} />
              New assessment
            </button>
          </div>
        </div>
      </header>

      <main className="workspace">
        <div className="intro">
          <div>
            <div className="eyebrow breadcrumb">
              <span>WORKSPACE</span>
              <span>/</span>TRUST ASSESSMENT
            </div>
            <h1>
              From evidence to
              <br className="mobile-break" /> <span>your next move.</span>
            </h1>
            <p>Don’t stop at a trust score. Know what to do with it.</p>
          </div>
          <div className="intro-note">
            <span className="intro-note-icon">
              <ShieldCheck size={21} />
            </span>
            <div>
              <strong>Built for decisions that matter.</strong>
              <span>Grounded in evidence. Guided by you.</span>
            </div>
          </div>
        </div>

        <div className="workflow-strip" aria-label="Assessment workflow">
          <div className="workflow-step">
            <span className="workflow-icon">
              <Link2 size={17} />
            </span>
            <div>
              <strong>Bring the evidence</strong>
              <span>Original source + Ezio report</span>
            </div>
          </div>
          <ArrowRight size={18} className="workflow-arrow" />
          <div className="workflow-step">
            <span className="workflow-icon">
              <Sparkles size={17} />
            </span>
            <div>
              <strong>Add your perspective</strong>
              <span>A role and a real decision</span>
            </div>
          </div>
          <ArrowRight size={18} className="workflow-arrow" />
          <div className="workflow-step">
            <span className="workflow-icon final">
              <Check size={18} />
            </span>
            <div>
              <strong>Get a clear next step</strong>
              <span>A recommendation you can review</span>
            </div>
          </div>
        </div>

        <div className="assessment-grid" id="assessment">
          <section
            className="panel input-panel"
            aria-labelledby="input-heading"
          >
            <div className="panel-heading">
              <div className="flex items-center gap-3">
                <span className="step-number">01</span>
                <h2 id="input-heading">Set up your assessment</h2>
              </div>
              <span className="input-count">{completeCount}/3 ready</span>
            </div>
            <form onSubmit={submit} noValidate>
              <div className="form-intro">
                <p>A little context. A better decision.</p>
                <button
                  type="button"
                  className="demo-button"
                  onClick={loadDemo}
                  disabled={loading}
                >
                  <FlaskConical size={14} />
                  Load demo report
                </button>
              </div>
              <fieldset disabled={loading}>
                <div className="form-field">
                  <label htmlFor="source">
                    Original Source
                    <span className="required-dot" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <div className="input-wrap">
                    <Link2 size={17} aria-hidden="true" />
                    <input
                      id="source"
                      ref={sourceRef}
                      type="url"
                      inputMode="url"
                      autoComplete="url"
                      placeholder="https://example.com/official-report"
                      value={input.source}
                      onChange={(event) =>
                        updateField("source", event.target.value)
                      }
                      onBlur={() =>
                        setTouched((state) => ({ ...state, source: true }))
                      }
                      aria-invalid={!!(touched.source && errors.source)}
                      aria-describedby={`source-help${touched.source && errors.source ? " source-error" : ""}`}
                      required
                    />
                  </div>
                  <p className="field-help" id="source-help">
                    Paste the authoritative source the original AI answer was
                    based on.
                  </p>
                  {touched.source && errors.source && (
                    <p className="field-error" id="source-error">
                      {errors.source}
                    </p>
                  )}
                </div>
                <div className="form-field">
                  <label htmlFor="role">
                    Agent Role
                    <span className="required-dot" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <div className="input-wrap">
                    <UserRound size={17} aria-hidden="true" />
                    <input
                      id="role"
                      type="text"
                      placeholder="e.g. Senior policy editor deciding whether to publish a public briefing"
                      value={input.role}
                      onChange={(event) =>
                        updateField("role", event.target.value)
                      }
                      onBlur={() =>
                        setTouched((state) => ({ ...state, role: true }))
                      }
                      aria-invalid={!!(touched.role && errors.role)}
                      aria-describedby={`role-help${touched.role && errors.role ? " role-error" : ""}`}
                      minLength={10}
                      required
                    />
                  </div>
                  <p className="field-help" id="role-help">
                    Describe who is relying on this answer and what decision
                    they need to make.
                  </p>
                  {touched.role && errors.role && (
                    <p className="field-error" id="role-error">
                      {errors.role}
                    </p>
                  )}
                </div>
                <div className="form-field report-field">
                  <div className="flex items-center justify-between">
                    <label htmlFor="report">
                      Ezio Trust Report
                      <span className="required-dot" aria-hidden="true">
                        *
                      </span>
                    </label>
                    <span className="format-label">
                      <FileText size={12} />
                      PLAIN TEXT
                    </span>
                  </div>
                  <textarea
                    id="report"
                    placeholder={REPORT_PLACEHOLDER}
                    value={input.report}
                    onChange={(event) =>
                      updateField("report", event.target.value)
                    }
                    onBlur={() =>
                      setTouched((state) => ({ ...state, report: true }))
                    }
                    aria-invalid={!!(touched.report && errors.report)}
                    aria-describedby={`report-help${touched.report && errors.report ? " report-error" : ""}`}
                    minLength={30}
                    required
                  />
                  <div className="report-help-row">
                    <p className="field-help" id="report-help">
                      Paste the exported Ezio trust-report text here.
                    </p>
                    <span>
                      {input.report.length.toLocaleString()} characters
                    </span>
                  </div>
                  {touched.report && errors.report && (
                    <p className="field-error" id="report-error">
                      {errors.report}
                    </p>
                  )}
                </div>
              </fieldset>
              <button
                className="run-button"
                type="submit"
                disabled={!valid || loading}
              >
                {loading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                <span>
                  {loading ? "Reviewing evidence…" : "Run Trust Agent"}
                </span>
                {!loading && <ArrowRight size={18} className="ml-auto" />}
              </button>
              {!valid && (
                <p className="completion-hint">
                  Complete all three fields to run your assessment.
                </p>
              )}
              <div className="form-notice" role="status">
                {notice}
              </div>
              {error && (
                <p role="alert" className="field-error submit-error">
                  {error}
                </p>
              )}
              <p className="local-note">
                <ShieldCheck size={13} />
                Your inputs stay in this browser. No data is sent.
              </p>
            </form>
          </section>
          <DecisionPanel
            result={result}
            loading={loading}
            reviewAction={reviewAction}
            onReview={setReviewAction}
            headingRef={resultHeadingRef}
          />
        </div>
        <footer className="workspace-footer">
          <p>
            <ShieldCheck size={14} />
            Evidence informs. Humans decide.
          </p>
          <span>
            TrustGate <span className="footer-dot">·</span> Local prototype{" "}
            <span className="version">v0.1</span>
          </span>
        </footer>
      </main>

      <dialog
        ref={helpRef}
        className="help-dialog"
        onCancel={() => setHelpOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setHelpOpen(false);
        }}
        aria-labelledby="help-heading"
      >
        <div className="flex items-center justify-between">
          <span className="brand-icon">
            <ShieldCheck size={24} />
          </span>
          <button
            type="button"
            className="dialog-close"
            onClick={() => setHelpOpen(false)}
            aria-label="Close help"
          >
            <X size={20} />
          </button>
        </div>
        <h2 id="help-heading">Evidence to action, in three steps.</h2>
        <ol>
          <li>
            <strong>Bring your evidence.</strong> Paste the original source URL
            and exported Ezio report.
          </li>
          <li>
            <strong>Set the decision.</strong> Tell the agent whose professional
            judgment it should support.
          </li>
          <li>
            <strong>Review the next step.</strong> Read the recommendation,
            inspect its evidence, and choose a human action.
          </li>
        </ol>
        <div className="dialog-note">
          <FlaskConical size={18} />
          <p>
            This local prototype uses report keyword rules and illustrative
            confidence scores. It doesn’t open URLs or call an AI service.
            Review actions update the local status.
          </p>
        </div>
        <button
          type="button"
          className="run-button"
          onClick={() => setHelpOpen(false)}
        >
          Got it
          <ArrowRight size={16} className="ml-auto" />
        </button>
      </dialog>
    </>
  );
}
