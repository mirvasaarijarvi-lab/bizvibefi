import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("homepage loads with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Good Vibes Café/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("can navigate to all pages", async ({ page }) => {
    await page.goto("/");

    await page.click('a[href="/community"]');
    await expect(page).toHaveTitle(/Community/);

    await page.click('a[href="/get-going"]');
    await expect(page).toHaveTitle(/Get Going/);

    await page.click('a[href="/about"]');
    await expect(page).toHaveTitle(/About/);

    await page.click('a[href="/contact"]');
    await expect(page).toHaveTitle(/Contact/);
  });

  test("contact form shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/contact");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Please enter a valid email")).toBeVisible();
  });

  test("404 page shows for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });
});
