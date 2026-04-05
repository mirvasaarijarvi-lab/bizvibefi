import { test, expect } from "@playwright/test";

test.describe("Forum", () => {
  test("forum page loads with categories", async ({ page }) => {
    await page.goto("/forum");
    await expect(page).toHaveTitle(/Forum|BizVibe/);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("forum page shows category links", async ({ page }) => {
    await page.goto("/forum");
    // Should display at least one category or an empty state
    const content = page.locator("main");
    await expect(content).toBeVisible();
  });

  test("invalid forum category shows appropriate state", async ({ page }) => {
    await page.goto("/forum/nonexistent-category");
    // Should show empty state or error - page should still render
    await expect(page.locator("main")).toBeVisible();
  });

  test("invalid forum topic shows appropriate state", async ({ page }) => {
    await page.goto("/forum/general/00000000-0000-0000-0000-000000000000");
    await expect(page.locator("main")).toBeVisible();
  });
});
