import { test, expect } from "@playwright/test";

test.describe("Newsletter Signup", () => {
  test("footer newsletter form is visible", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByLabel(/email/i).first()).toBeVisible();
    await expect(footer.getByRole("button", { name: /subscribe/i })).toBeVisible();
  });

  test("newsletter form requires valid email", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const emailInput = footer.getByLabel(/email/i).first();
    const submitBtn = footer.getByRole("button", { name: /subscribe/i });

    // Try submitting empty — HTML5 validation should prevent submission
    await submitBtn.click();
    // Input should still be present (form not submitted)
    await expect(emailInput).toBeVisible();
  });

  test("newsletter form accepts email input", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const emailInput = footer.getByLabel(/email/i).first();
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
  });
});
