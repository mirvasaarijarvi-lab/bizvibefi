import { test, expect } from "@playwright/test";

test.describe("Mobile Navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger menu is visible on mobile", async ({ page }) => {
    await page.goto("/");
    // Desktop nav links should be hidden
    await expect(page.locator("nav").getByRole("link", { name: /community/i }).first()).not.toBeVisible();
    // Hamburger button (Menu icon) should be visible
    const menuButton = page.locator("nav button").filter({ has: page.locator("svg") }).last();
    await expect(menuButton).toBeVisible();
  });

  test("hamburger menu opens and shows nav links", async ({ page }) => {
    await page.goto("/");
    // Click hamburger
    const menuButton = page.locator("nav .md\\:hidden button").last();
    await menuButton.click();

    // Mobile menu links should now be visible
    await expect(page.getByRole("link", { name: /community/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /events/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /forum/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /about/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /contact/i }).first()).toBeVisible();
  });

  test("mobile menu closes when a link is clicked", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.locator("nav .md\\:hidden button").last();
    await menuButton.click();

    // Click a nav link
    await page.getByRole("link", { name: /events/i }).first().click();

    // Should navigate and menu should close
    await expect(page).toHaveURL(/\/events/);
  });

  test("sign in button is visible in mobile menu", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.locator("nav .md\\:hidden button").last();
    await menuButton.click();

    await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
  });

  test("language switcher works on mobile", async ({ page }) => {
    await page.goto("/");
    // Language button should be visible in mobile header
    const langButton = page.locator("nav .md\\:hidden button").filter({ hasText: /EN|FI|SV/ }).first();
    await expect(langButton).toBeVisible();
  });
});

test.describe("Desktop Navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("desktop nav shows all links without hamburger", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav").getByRole("link", { name: /community/i })).toBeVisible();
    await expect(page.locator("nav").getByRole("link", { name: /events/i })).toBeVisible();
    await expect(page.locator("nav").getByRole("link", { name: /forum/i })).toBeVisible();
  });

  test("Good Vibes Café logo links to homepage", async ({ page }) => {
    await page.goto("/about");
    await page.locator("nav").getByRole("link", { name: /good vibes café/i }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });
});
