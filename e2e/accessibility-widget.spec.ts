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

  test("settings persist across page navigation", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    // Enable multiple settings
    await page.getByRole("button", { name: /highlight links/i }).click();
    await page.getByRole("button", { name: /big cursor/i }).click();
    await page.getByLabel("Increase font size").click();
    await expect(page.getByText("110%")).toBeVisible();

    // Close and navigate to another page
    await page.getByLabel("Close").click();
    await page.goto("/about");

    // Verify classes are still applied on the new page
    const classes = await page.evaluate(() => ({
      highlightLinks: document.documentElement.classList.contains("a11y-highlight-links"),
      bigCursor: document.documentElement.classList.contains("a11y-big-cursor"),
      fontSize: document.documentElement.style.fontSize,
    }));
    expect(classes.highlightLinks).toBe(true);
    expect(classes.bigCursor).toBe(true);
    expect(classes.fontSize).toBe("110%");

    // Open widget and verify UI state matches
    await page.getByLabel("Open accessibility menu").click();
    await expect(page.getByText("110%")).toBeVisible();
  });

  test("settings persist when navigating via links", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    // Enable dyslexia font and high contrast
    await page.getByRole("button", { name: /dyslexia font/i }).click();
    await page.getByRole("button", { name: /high contrast/i }).click();
    await page.getByLabel("Close").click();

    // Navigate via footer link
    await page.getByRole("link", { name: /contact/i }).first().click();
    await expect(page).toHaveURL(/\/contact/);

    // Verify settings survived SPA navigation
    const classes = await page.evaluate(() => ({
      dyslexia: document.documentElement.classList.contains("a11y-dyslexia"),
      highContrast: document.documentElement.classList.contains("a11y-high-contrast"),
    }));
    expect(classes.dyslexia).toBe(true);
    expect(classes.highContrast).toBe(true);
  });

  test("multiple toggles cycle correctly", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    // Letter spacing cycles through levels
    const letterBtn = page.getByRole("button", { name: /letter spacing/i });
    await letterBtn.click(); // level 1
    let spacing = await page.evaluate(() => document.documentElement.style.letterSpacing);
    expect(spacing).toBe("0.05em");

    await letterBtn.click(); // level 2
    spacing = await page.evaluate(() => document.documentElement.style.letterSpacing);
    expect(spacing).toBe("0.1em");

    await letterBtn.click(); // level 3
    spacing = await page.evaluate(() => document.documentElement.style.letterSpacing);
    expect(spacing).toBe("0.15em");

    await letterBtn.click(); // back to 0
    spacing = await page.evaluate(() => document.documentElement.style.letterSpacing);
    expect(spacing).toBe("");
  });

  test("contrast modes are mutually exclusive", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    // Enable dark contrast
    await page.getByRole("button", { name: /dark contrast/i }).click();
    const hasDark = await page.evaluate(() => document.documentElement.classList.contains("a11y-dark"));
    expect(hasDark).toBe(true);

    // Switch to light contrast - dark should be removed
    await page.getByRole("button", { name: /light contrast/i }).click();
    const classes = await page.evaluate(() => ({
      dark: document.documentElement.classList.contains("a11y-dark"),
      light: document.documentElement.classList.contains("a11y-light"),
    }));
    expect(classes.dark).toBe(false);
    expect(classes.light).toBe(true);
  });

  test("saturation modes are mutually exclusive", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    await page.getByRole("button", { name: /high saturation/i }).click();
    const hasHigh = await page.evaluate(() => document.documentElement.classList.contains("a11y-high-sat"));
    expect(hasHigh).toBe(true);

    // Switch to monochrome
    await page.getByRole("button", { name: /monochrome/i }).click();
    const classes = await page.evaluate(() => ({
      high: document.documentElement.classList.contains("a11y-high-sat"),
      mono: document.documentElement.classList.contains("a11y-mono"),
    }));
    expect(classes.high).toBe(false);
    expect(classes.mono).toBe(true);
  });

  test("font size respects min/max bounds", async ({ page }) => {
    await page.getByLabel("Open accessibility menu").click();

    // Decrease to minimum (80%)
    for (let i = 0; i < 5; i++) {
      await page.getByLabel("Decrease font size").click();
    }
    await expect(page.getByText("80%")).toBeVisible();

    // Try to go below - should stay at 80%
    await page.getByLabel("Decrease font size").click();
    await expect(page.getByText("80%")).toBeVisible();

    // Increase to maximum (150%)
    for (let i = 0; i < 10; i++) {
      await page.getByLabel("Increase font size").click();
    }
    await expect(page.getByText("150%")).toBeVisible();

    // Try to go above - should stay at 150%
    await page.getByLabel("Increase font size").click();
    await expect(page.getByText("150%")).toBeVisible();
  });
});
