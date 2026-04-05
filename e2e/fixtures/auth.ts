import { test as base, expect, Page } from "@playwright/test";

/**
 * Authenticated E2E test fixture.
 *
 * Uses environment variables E2E_USER_EMAIL and E2E_USER_PASSWORD to log in
 * via the /auth page before each test. If the variables are not set the test
 * is skipped gracefully so CI doesn't break when credentials aren't configured.
 */

async function login(page: Page, email: string, password: string) {
  await page.goto("/auth");

  // Fill in email
  await page.getByPlaceholder(/email/i).fill(email);

  // Fill in password
  await page.getByPlaceholder(/password/i).fill(password);

  // Click sign in
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for navigation away from /auth (successful login)
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 15000,
  });
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;

    if (!email || !password) {
      // Skip test when credentials are not available
      test.skip(true, "E2E_USER_EMAIL and E2E_USER_PASSWORD must be set");
      return;
    }

    await login(page, email, password);
    await use(page);
  },
});

export { expect };
