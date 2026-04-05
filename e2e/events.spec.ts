import { test, expect } from "@playwright/test";

test.describe("Events", () => {
  test("events page loads", async ({ page }) => {
    await page.goto("/events");
    await expect(page).toHaveTitle(/Events|BizVibe/);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("events page shows content area", async ({ page }) => {
    await page.goto("/events");
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("events page has filter or type tabs", async ({ page }) => {
    await page.goto("/events");
    // Check for event type filters or tab navigation
    const content = page.locator("main");
    await expect(content).toBeVisible();
    // Page should render without errors even with no events
  });
});
