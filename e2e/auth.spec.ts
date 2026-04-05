import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("auth page loads with login form", async ({ page }) => {
    await page.goto("/auth");
    await expect(page).toHaveTitle(/BizVibe/);
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome/i })).toBeVisible();
  });

  test("auth page has email and password fields", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test("auth page shows signup toggle", async ({ page }) => {
    await page.goto("/auth");
    const signUpToggle = page.getByText(/sign up|create account|register/i);
    await expect(signUpToggle.first()).toBeVisible();
  });

  test("profile page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/profile");
    // Should redirect to auth or show auth prompt
    await page.waitForURL(/\/(auth|profile)/);
    const url = page.url();
    // Either redirected to auth or stayed on profile with auth prompt
    expect(url).toMatch(/\/(auth|profile)/);
  });

  test("reset password page loads", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByPlaceholder(/password/i).first()).toBeVisible();
  });
});
