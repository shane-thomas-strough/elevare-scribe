import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test("health endpoint returns ok", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.version).toBe("0.4.0");
    expect(body.checks).toBeDefined();
  });

  test("hero section renders", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    // Check that either WebGL canvas or fallback renders
    const canvas = page.locator("canvas");
    const fallback = page.locator("[data-testid='webgl-fallback']");
    const hasCanvas = await canvas.count();
    const hasFallback = await fallback.count();
    expect(hasCanvas + hasFallback).toBeGreaterThan(0);
  });
});
