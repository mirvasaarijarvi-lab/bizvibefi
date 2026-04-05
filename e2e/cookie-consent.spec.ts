import { test, expect } from "@playwright/test";

test.describe("Cookie Consent Banner", () => {
  test.beforeEach(async ({ page }) => {
    // Clear consent before each test so the banner appears
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("bizvibe-cookie-consent"));
    await page.reload();
  });

  test("banner appears when no consent stored", async ({ page }) => {
    await expect(page.getByText(/we use essential cookies/i)).toBeVisible();
  });

  test("banner has accept and decline buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: /accept/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /decline/i })).toBeVisible();
  });

  test("accepting cookies hides banner and persists", async ({ page }) => {
    await page.getByRole("button", { name: /accept/i }).click();
    await expect(page.getByText(/we use essential cookies/i)).toBeHidden();

    // Reload — banner should not reappear
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/we use essential cookies/i)).not.toBeVisible();
  });

  test("declining cookies hides banner and persists", async ({ page }) => {
    await page.getByRole("button", { name: /decline/i }).click();
    await expect(page.getByText(/we use essential cookies/i)).toBeHidden();

    await page.reload();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/we use essential cookies/i)).not.toBeVisible();
  });

  test("banner contains privacy policy link", async ({ page }) => {
    const link = page.getByRole("link", { name: /privacy policy/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/privacy");
  });
});
