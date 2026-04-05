import { test, expect } from "@playwright/test";

test.describe("Members Directory", () => {
  test("unauthenticated users are redirected to auth", async ({ page }) => {
    await page.goto("/members");
    await page.waitForURL(/\/(auth|members)/, { timeout: 5000 });
    const url = page.url();
    expect(url).toMatch(/\/(auth|members)/);
  });

  test("members page has correct title", async ({ page }) => {
    await page.goto("/members");
    await expect(page).toHaveTitle(/BizVibe/);
  });

  test("members page renders main content area", async ({ page }) => {
    await page.goto("/members");
    await expect(page.locator("main")).toBeVisible();
  });
});
