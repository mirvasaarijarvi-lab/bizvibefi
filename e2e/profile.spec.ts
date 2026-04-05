import { test, expect } from "./fixtures/auth";

test.describe("Profile editing & Members Directory", () => {
  const uniqueSuffix = Date.now().toString(36);
  const testDisplayName = `E2E Tester ${uniqueSuffix}`;
  const testCompany = `TestCorp ${uniqueSuffix}`;
  const testBio = `Bio for automated testing ${uniqueSuffix}`;

  test("edit profile and verify it appears in members directory", async ({
    authenticatedPage: page,
  }) => {
    // ── Step 1: Navigate to profile page and update fields ──
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: /your profile/i })
    ).toBeVisible({ timeout: 10000 });

    // Fill in profile fields
    const nameInput = page.locator("#display-name");
    await nameInput.clear();
    await nameInput.fill(testDisplayName);

    const bioInput = page.locator("#bio");
    await bioInput.clear();
    await bioInput.fill(testBio);

    const companyInput = page.locator("#company");
    await companyInput.clear();
    await companyInput.fill(testCompany);

    // Save profile
    await page.getByRole("button", { name: /save profile/i }).click();

    // Wait for success toast
    await expect(page.getByText(/profile updated/i)).toBeVisible({
      timeout: 5000,
    });

    // ── Step 2: Navigate to members directory ──
    await page.goto("/members");
    await expect(
      page.getByRole("heading", { name: /members/i })
    ).toBeVisible({ timeout: 10000 });

    // ── Step 3: Search for the updated profile ──
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill(testDisplayName);

    // The member card with our display name should appear
    await expect(page.getByText(testDisplayName)).toBeVisible({
      timeout: 10000,
    });

    // Verify company also appears on the card
    await expect(page.getByText(testCompany)).toBeVisible();
  });

  test("profile changes persist after page reload", async ({
    authenticatedPage: page,
  }) => {
    // Set a known value
    await page.goto("/profile");
    await expect(page.locator("#display-name")).toBeVisible({ timeout: 10000 });

    const nameInput = page.locator("#display-name");
    await nameInput.clear();
    await nameInput.fill(testDisplayName);

    await page.getByRole("button", { name: /save profile/i }).click();
    await expect(page.getByText(/profile updated/i)).toBeVisible({
      timeout: 5000,
    });

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator("#display-name")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#display-name")).toHaveValue(testDisplayName);
  });
});
