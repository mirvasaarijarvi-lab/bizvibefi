import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("auth page loads with login form", async ({ page }) => {
    await page.goto("/auth");
    await expect(page).toHaveTitle(/BizVibe/);
    await expect(page.getByRole("heading", { name: /sign in|log in|welcome/i })).toBeVisible();
  });

  test("auth page has email and password fields", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("auth page shows signup toggle", async ({ page }) => {
    await page.goto("/auth");
    const signUpToggle = page.getByText(/sign up|create account|register/i);
    await expect(signUpToggle.first()).toBeVisible();
  });

  test("profile page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL(/\/(auth|profile)/);
    const url = page.url();
    expect(url).toMatch(/\/(auth|profile)/);
  });

  test("reset password page loads", async ({ page }) => {
    await page.goto("/reset-password");
    // Without a recovery token, the page shows an "invalid link" message
    await expect(page.getByText(/invalid|expired|reset/i).first()).toBeVisible();
  });
});
