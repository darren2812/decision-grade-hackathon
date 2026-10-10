import { expect, test } from "@playwright/test";

test("validates input, reviews evidence, and records all human decisions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.screenshot({
    path: "test-results/trustgate-desktop.png",
    fullPage: true,
  });
  const run = page.getByRole("button", { name: "Run Trust Agent" });
  await expect(run).toBeDisabled();
  await page.getByLabel("Original Source").fill("invalid-url");
  await page.getByLabel("Agent Role").focus();
  await expect(page.getByText("Enter a valid URL, such as")).toBeVisible();
  await page.getByRole("button", { name: "Load demo report" }).click();
  await expect(run).toBeEnabled();
  await run.click();
  await expect(
    page.getByText("Reviewing claims, findings, and source quality…"),
  ).toBeVisible();
  await expect(
    page.getByText("REWRITE WITH CITATIONS", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Claim 2 · Not enough evidence" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/trustgate-decision.png",
    fullPage: true,
  });
  for (const [button, message] of [
    ["Request a sourced rewrite", "Conditional approval after revision"],
    ["Find an authoritative source", "Awaiting authoritative evidence"],
    ["Override and approve", "Human override recorded"],
  ]) {
    await page.getByRole("button", { name: button }).click();
    await expect(page.getByText(message, { exact: false })).toBeVisible();
  }
  await page
    .getByLabel("Ezio Trust Report")
    .fill(
      "Verdict: Supported. Claim 1 · Supported: EV sales grew. Findings: No critical issues.",
    );
  await expect(
    page.getByText("REWRITE WITH CITATIONS", { exact: true }),
  ).toHaveCount(0);
  await run.click();
  await expect(
    page.getByText("APPROVE FOR USE", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Ezio Trust Report")
    .fill(
      "Verdict: CRITICAL. Claim 1 · Contradicted: The forecast contradicts the primary source.",
    );
  await run.click();
  await expect(
    page.getByText("BLOCK PUBLICATION", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "How it works" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "New assessment" }).click();
  await expect(page.getByLabel("Original Source")).toHaveValue("");
  await expect(run).toBeDisabled();
  expect(errors).toEqual([]);
});

test("layout fits narrow phones, tablets, and desktops", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `overflow at ${width}px`,
    ).toBe(true);
  }
});

test("mobile layout fits the viewport and can complete an assessment", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Load demo report" }).click();
  await page.getByRole("button", { name: "Run Trust Agent" }).click();
  await expect(
    page.getByText("REWRITE WITH CITATIONS", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Request a sourced rewrite" }).click();
  await expect(
    page.getByText("Conditional approval after revision", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/trustgate-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
