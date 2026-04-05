import { test, expect } from "@playwright/test";

test.describe("Support Chat Widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens and closes the chat window", async ({ page }) => {
    const trigger = page.getByLabel("Open support chat");
    await expect(trigger).toBeVisible();

    await trigger.click();
    await expect(page.getByText("BizVibe Support")).toBeVisible();

    // Trigger should be hidden when chat is open
    await expect(trigger).not.toBeVisible();

    // Close via X button
    await page.getByLabel("Close chat").click();
    await expect(page.getByText("BizVibe Support")).not.toBeVisible();
    await expect(trigger).toBeVisible();
  });

  test("shows welcome message and suggestion buttons", async ({ page }) => {
    await page.getByLabel("Open support chat").click();

    await expect(page.getByText("Hi! How can I help?")).toBeVisible();
    await expect(page.getByRole("button", { name: "What is BizVibe?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Free vs Pro?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "How do I join?" })).toBeVisible();
  });

  test("send button is disabled when input is empty", async ({ page }) => {
    await page.getByLabel("Open support chat").click();

    const sendBtn = page.locator('button[type="submit"]');
    await expect(sendBtn).toBeDisabled();
  });

  test("can type a message and submit it", async ({ page }) => {
    await page.getByLabel("Open support chat").click();

    const input = page.getByPlaceholder("Type a message...");
    await input.fill("Hello there");

    const sendBtn = page.locator('button[type="submit"]');
    await expect(sendBtn).toBeEnabled();

    await sendBtn.click();

    // User message should appear in the chat
    await expect(page.getByText("Hello there")).toBeVisible();

    // Input should be cleared after sending
    await expect(input).toHaveValue("");
  });

  test("suggestion button fills input and submits", async ({ page }) => {
    await page.getByLabel("Open support chat").click();

    await page.getByRole("button", { name: "What is BizVibe?" }).click();

    // The suggestion text should appear as a user message
    await expect(page.getByText("What is BizVibe?").last()).toBeVisible({ timeout: 5000 });
  });

  test("input is focused when chat opens", async ({ page }) => {
    await page.getByLabel("Open support chat").click();

    const input = page.getByPlaceholder("Type a message...");
    await expect(input).toBeFocused({ timeout: 3000 });
  });

  test("input is disabled while loading", async ({ page }) => {
    await page.getByLabel("Open support chat").click();

    const input = page.getByPlaceholder("Type a message...");
    await input.fill("Test message");
    await page.locator('button[type="submit"]').click();

    // Input should be disabled while waiting for response
    await expect(input).toBeDisabled({ timeout: 3000 });
  });
});
