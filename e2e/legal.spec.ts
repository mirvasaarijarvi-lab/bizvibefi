import { test, expect } from "@playwright/test";

test.describe("Legal Pages", () => {
  test("privacy policy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1, name: /privacy/i })).toBeVisible();
  });

  test("terms of service page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { level: 1, name: /terms of service/i })).toBeVisible();
  });

  test("accessibility statement page loads", async ({ page }) => {
    await page.goto("/accessibility");
    await expect(page.getByRole("heading", { level: 1, name: /accessibility/i })).toBeVisible();
  });

  test("members page requires authentication", async ({ page }) => {
    await page.goto("/members");
    await page.waitForURL(/\/(auth|members)/, { timeout: 5000 });
    const url = page.url();
    expect(url).toMatch(/\/(auth|members)/);
  });
});
