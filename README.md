# TrustGate

A responsive, browser-local trust-decision workspace built with React, TypeScript, Vite, Tailwind CSS, and Lucide icons. No authentication, database, or external API calls.

## Run locally

Use Node.js 22.16+ (or a current Node.js 24 release).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Click **Load demo report**, then **Run Trust Agent** to try the EV-market example.

Only **Agent Role** and **Ezio Trust Report** are required. **Original Source** is optional; if supplied, it must be a valid HTTP(S) URL. The agent receives an empty `source` string when omitted and clearly notes the missing reference in its results.

```sh
npm run build     # TypeScript check and production build
npm run preview   # Serve the production build
npm test          # Mock decision logic checks
npm run test:ui   # Browser interaction checks (requires Google Chrome)
```

## Where to change things

- `src/web/App.tsx`: form validation, inputs, loading, reset, help dialog, and local state.
- `src/web/components/DecisionPanel.tsx`: decision, evidence cards, uncertainty, and human-review messages.
- `src/web/lib/runAgent.ts`: the isolated asynchronous agent function and its TypeScript input/output contracts.
- `src/web/lib/demo.ts`: EV demo data and report placeholder.
- `src/web/App.css`: custom component styling and responsive layouts.
- `src/web/index.css`: Tailwind import, theme, and global accessibility styles.

## Replace the mock agent

Replace the body of `runAgent(input)` in `src/web/lib/runAgent.ts` with a backend call returning `AgentResult`. The UI already awaits this function and handles loading and errors. For example:

```ts
export async function runAgent(input: AgentInput): Promise<AgentResult> {
  const response = await fetch("/api/trust-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Assessment failed");
  return response.json();
}
```

Validate the response against `AgentResult` at the API boundary. Keep LLM credentials on the backend. Once connected, update the local-demo copy and confidence label in the interface.

The current mock prioritizes contradicted claims → block publication; critical/unsupported findings → human review; missing sources → another source; insufficient evidence → sourced rewrite; supported claims without blockers → approve. Unknown reports default to requesting another source. Confidence values are illustrative. The app quotes the pasted text and records the original URL; it does not open or verify sources.

Human-review buttons update local decision status only. Editing an input clears the prior result, and **New assessment** clears the form. Everything resets on page refresh.
