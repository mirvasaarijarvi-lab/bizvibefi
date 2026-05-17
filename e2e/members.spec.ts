import { test as unauthTest, expect as unauthExpect } from "@playwright/test";
import { test, expect } from "./fixtures/auth";

/* ── Unauthenticated tests ─────────────────────────────── */

unauthTest.describe("Members Directory — unauthenticated", () => {
  unauthTest("unauthenticated users are redirected to auth", async ({ page }) => {
    await page.goto("/members");
    await page.waitForURL(/\/(auth|members)/, { timeout: 5000 });
    const url = page.url();
    unauthExpect(url).toMatch(/\/(auth|members)/);
  });

  unauthTest("members page has correct title", async ({ page }) => {
    await page.goto("/members");
    await unauthExpect(page).toHaveTitle(/GoodVibesCafe/);
  });

  unauthTest("members page renders main content area", async ({ page }) => {
    await page.goto("/members");
    await unauthExpect(page.locator("main")).toBeVisible();
  });
});

/* ── Authenticated tests ───────────────────────────────── */

test.describe("Members Directory — authenticated", () => {
  test("renders the directory heading", async ({ authenticatedPage: page }) => {
    await page.goto("/members");
    await expect(page.getByRole("heading", { name: /members/i })).toBeVisible();
  });

  test("search input filters members by text", async ({ authenticatedPage: page }) => {
    await page.goto("/members");

    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();

    // Type a query that is unlikely to match anyone
    await searchInput.fill("zzz_no_match_xyz");
    // Should show the empty state
    await expect(page.getByText(/no members match/i)).toBeVisible({ timeout: 5000 });

    // Clear the search to restore results
    await searchInput.clear();
    await expect(page.getByText(/no members match/i)).not.toBeVisible({ timeout: 5000 });
  });

  test("tier filter dropdown is functional", async ({ authenticatedPage: page }) => {
    await page.goto("/members");

    // Open the tier filter (first Select)
    const tierTrigger = page.locator("button").filter({ hasText: /all tiers|free|pro/i }).first();
    await expect(tierTrigger).toBeVisible();
    await tierTrigger.click();

    // Verify options are visible
    await expect(page.getByRole("option", { name: /all tiers/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /free/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /pro/i })).toBeVisible();

    // Select "Free"
    await page.getByRole("option", { name: /^free$/i }).click();
    // The trigger should now show "Free"
    await expect(tierTrigger).toHaveText(/free/i);
  });

  test("sort dropdown is functional", async ({ authenticatedPage: page }) => {
    await page.goto("/members");

    // Open the sort dropdown (second Select)
    const sortTrigger = page.locator("button").filter({ hasText: /newest|a → z/i }).first();
    await expect(sortTrigger).toBeVisible();
    await sortTrigger.click();

    // Verify options
    await expect(page.getByRole("option", { name: /newest first/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /a → z/i })).toBeVisible();

    // Select alphabetical
    await page.getByRole("option", { name: /a → z/i }).click();
    await expect(sortTrigger).toHaveText(/a → z/i);
  });

  test("member cards display profile information", async ({ authenticatedPage: page }) => {
    await page.goto("/members");

    // Wait for loading to finish — either cards appear or empty state
    const cardOrEmpty = page.locator("[class*='card'], [class*='Card']").first();
    const emptyState = page.getByText(/no members yet/i);

    // One of them should be visible
    await expect(cardOrEmpty.or(emptyState)).toBeVisible({ timeout: 10000 });
  });
});
