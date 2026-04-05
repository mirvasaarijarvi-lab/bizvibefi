import { test, expect } from "./fixtures/auth";

test.describe("Forum posting & replying (authenticated)", () => {
  const uniqueSuffix = Date.now().toString(36);
  const topicTitle = `E2E Topic ${uniqueSuffix}`;
  const topicContent = `Automated test content ${uniqueSuffix}`;
  const replyContent = `Automated reply ${uniqueSuffix}`;

  test("create a topic and post a reply", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to the forum
    await page.goto("/forum");
    await expect(
      page.getByRole("heading", { name: /community forum/i })
    ).toBeVisible({ timeout: 10000 });

    // Click the first category link
    const categoryLink = page.locator('a[href^="/forum/"]').first();
    await expect(categoryLink).toBeVisible({ timeout: 10000 });
    await categoryLink.click();

    // Wait for category page to load
    await expect(page.getByText(/new topic/i)).toBeVisible({ timeout: 10000 });

    // Open the new topic form
    await page.getByRole("button", { name: /new topic/i }).click();

    // Fill in topic details
    await page.getByPlaceholder(/topic title/i).fill(topicTitle);
    await page.getByPlaceholder(/what's on your mind/i).fill(topicContent);

    // Submit topic
    await page.getByRole("button", { name: /post topic/i }).click();

    // Wait for success toast
    await expect(page.getByText(/topic created/i)).toBeVisible({
      timeout: 5000,
    });

    // The new topic should appear in the list
    await expect(page.getByText(topicTitle)).toBeVisible({ timeout: 10000 });

    // Click on the topic to view it
    await page.getByText(topicTitle).click();

    // Verify topic content is visible
    await expect(page.getByText(topicContent)).toBeVisible({ timeout: 10000 });

    // Post a reply
    const replyTextarea = page.getByPlaceholder(/write a reply/i);
    await expect(replyTextarea).toBeVisible();
    await replyTextarea.fill(replyContent);

    await page.getByRole("button", { name: /^reply$/i }).click();

    // Verify reply appears
    await expect(page.getByText(replyContent)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/reply posted/i)).toBeVisible({
      timeout: 5000,
    });

    // Reply count should show 1
    await expect(page.getByText(/1 reply/i)).toBeVisible();
  });

  test("back navigation works from topic to category", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/forum");

    const categoryLink = page.locator('a[href^="/forum/"]').first();
    await expect(categoryLink).toBeVisible({ timeout: 10000 });
    await categoryLink.click();

    // Click on any topic if available
    const topicLink = page.locator('a[href*="/forum/"][href$="-"]').first();
    const hasTopic = await topicLink.isVisible().catch(() => false);

    if (hasTopic) {
      await topicLink.click();
      await expect(page.getByText(/back to topics/i)).toBeVisible({
        timeout: 10000,
      });
      await page.getByText(/back to topics/i).click();
      await expect(page.getByText(/new topic/i)).toBeVisible({
        timeout: 10000,
      });
    }

    // Navigate back to forum index
    await page.getByText(/back to forum/i).click();
    await expect(
      page.getByRole("heading", { name: /community forum/i })
    ).toBeVisible({ timeout: 10000 });
  });
});
