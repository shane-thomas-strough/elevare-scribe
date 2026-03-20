import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("page loads without critical errors", async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on("pageerror", (err) => {
      // Ignore WebGL/GPU errors in headless CI environments
      if (err.message.includes("WebGL") || err.message.includes("GPU")) return;
      criticalErrors.push(err.message);
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(criticalErrors).toEqual([]);
  });

  test("health endpoint returns valid response", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.version).toBe("0.4.0");
    expect(body.checks).toBeDefined();
  });

  test("page renders main content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Verify the page has rendered meaningful content (not a blank screen)
    const body = await page.locator("body");
    await expect(body).toBeVisible();
    // Check that main element exists
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});
