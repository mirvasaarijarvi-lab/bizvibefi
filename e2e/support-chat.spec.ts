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

    await expect(trigger).not.toBeVisible();

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

    const chatWindow = page.locator(".fixed.bottom-4.left-4");
    const sendBtn = chatWindow.locator('button[type="submit"]');
    await expect(sendBtn).toBeDisabled();
  });

  test("can type a message and submit it", async ({ page }) => {
    await page.getByLabel("Open support chat").click();

    const input = page.getByPlaceholder("Type a message...");
    await input.fill("Hello there");

    const chatWindow = page.locator(".fixed.bottom-4.left-4");
    const sendBtn = chatWindow.locator('button[type="submit"]');
    await expect(sendBtn).toBeEnabled();

    await sendBtn.click();

    await expect(page.getByText("Hello there")).toBeVisible();
    await expect(input).toHaveValue("");
  });

  test("suggestion button fills input and submits", async ({ page }) => {
    await page.getByLabel("Open support chat").click();

    await page.getByRole("button", { name: "What is BizVibe?" }).click();

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
    const chatWindow = page.locator(".fixed.bottom-4.left-4");
    await chatWindow.locator('button[type="submit"]').click();

    await expect(input).toBeDisabled({ timeout: 3000 });
  });
});
