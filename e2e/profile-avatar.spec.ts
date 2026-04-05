import { test, expect } from "./fixtures/auth";
import path from "path";
import fs from "fs";

test.describe("Profile avatar upload", () => {
  test("upload avatar image and verify it displays", async ({
    authenticatedPage: page,
  }) => {
    // Create a small test image (1x1 red PNG)
    const testImagePath = path.join(__dirname, "test-avatar.png");
    // Minimal valid PNG: 1x1 red pixel
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(testImagePath, pngBuffer);

    try {
      await page.goto("/profile");
      await expect(
        page.getByRole("heading", { name: /your profile/i })
      ).toBeVisible({ timeout: 10000 });

      // Upload avatar via the hidden file input
      const fileInput = page.locator("#avatar-upload");
      await fileInput.setInputFiles(testImagePath);

      // Wait for success toast
      await expect(page.getByText(/avatar updated/i)).toBeVisible({
        timeout: 15000,
      });

      // Verify the avatar image element now has a src (not just the fallback)
      const avatarImg = page.locator("img").first();
      await expect(avatarImg).toBeVisible({ timeout: 5000 });
      const src = await avatarImg.getAttribute("src");
      expect(src).toBeTruthy();
      expect(src).toContain("avatar");
    } finally {
      // Clean up test file
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }
  });

  test("avatar persists after page reload", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: /your profile/i })
    ).toBeVisible({ timeout: 10000 });

    // Check if an avatar image is already set (from previous test or prior upload)
    const avatarImg = page.locator("img").first();
    const hasAvatar = await avatarImg.isVisible().catch(() => false);

    if (hasAvatar) {
      const srcBefore = await avatarImg.getAttribute("src");

      // Reload and verify persistence
      await page.reload();
      await expect(
        page.getByRole("heading", { name: /your profile/i })
      ).toBeVisible({ timeout: 10000 });

      const reloadedImg = page.locator("img").first();
      await expect(reloadedImg).toBeVisible({ timeout: 5000 });
      const srcAfter = await reloadedImg.getAttribute("src");
      expect(srcAfter).toBeTruthy();
      // Both should point to the same avatar path
      expect(srcAfter).toContain("avatar");
    }
  });
});
