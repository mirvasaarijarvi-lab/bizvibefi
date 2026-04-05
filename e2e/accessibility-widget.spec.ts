import { test, expect } from "@playwright/test";

test.describe("Accessibility Widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens and closes the accessibility panel", async ({ page }) => {
    const trigger = page.getByLabel("Open accessibility menu");
    await expect(trigger).toBeVisible();

    await trigger.click();
    await expect(page.getByText("Accessibility menu")).toBeVisible();

    // Close via X button
    await page.getByLabel("Close").click();
    await expect(page.getByText("Accessibility menu")).not.toBeVisible();
  });

  test("closes panel by clicking overlay", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();
    await expect(page.getByText("Accessibility menu")).toBeVisible();

    // Click the overlay backdrop
    await page.locator(".fixed.inset-0").click({ position: { x: 350, y: 400 } });
    await expect(page.getByText("Accessibility menu")).not.toBeVisible();
  });

  test("adjusts font size up and down", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    // Default should be 100%
    await expect(page.getByText("100%")).toBeVisible();

    // Increase font size
    await page.getByLabel("Increase font size").click();
    await expect(page.getByText("110%")).toBeVisible();

    // Decrease font size
    await page.getByLabel("Decrease font size").click();
    await expect(page.getByText("100%")).toBeVisible();
  });

  test("toggles highlight titles", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    const btn = page.getByRole("button", { name: /highlight titles/i });
    await btn.click();

    // Verify class applied to html
    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains("a11y-highlight-titles")
    );
    expect(hasClass).toBe(true);

    // Toggle off
    await btn.click();
    const removed = await page.evaluate(() =>
      !document.documentElement.classList.contains("a11y-highlight-titles")
    );
    expect(removed).toBe(true);
  });

  test("toggles dark contrast mode", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    await page.getByRole("button", { name: /dark contrast/i }).click();

    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains("a11y-dark")
    );
    expect(hasClass).toBe(true);
  });

  test("toggles big cursor", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    await page.getByRole("button", { name: /big cursor/i }).click();

    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains("a11y-big-cursor")
    );
    expect(hasClass).toBe(true);
  });

  test("reset button clears all settings", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    // Enable a few settings
    await page.getByRole("button", { name: /dyslexia font/i }).click();
    await page.getByLabel("Increase font size").click();

    // Reset
    await page.getByRole("button", { name: /reset settings/i }).click();

    // Font size back to 100%
    await expect(page.getByText("100%")).toBeVisible();

    // Class removed
    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains("a11y-dyslexia")
    );
    expect(hasClass).toBe(false);
  });

  test("accessibility statement link navigates correctly", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    await page.getByRole("link", { name: /accessibility statement/i }).click();
    await expect(page).toHaveURL(/\/accessibility/);
  });

  test("settings persist after page reload", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();
    await page.getByLabel("Increase font size").click();
    await page.getByLabel("Increase font size").click();
    await expect(page.getByText("120%")).toBeVisible();

    // Close and reload
    await page.getByLabel("Close").click();
    await page.reload();

    await page.getByLabel("Open accessibility menu").click();
    await expect(page.getByText("120%")).toBeVisible();
  });
});
