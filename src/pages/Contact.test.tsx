import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TranslationProvider } from "@/i18n/TranslationContext";
import { translations } from "@/i18n";
import Contact from "./Contact";

const renderContact = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TranslationProvider translations={translations}>
          <Contact />
        </TranslationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const getForm = () => {
  const submitBtn = screen.getByText("Send Message");
  return submitBtn.closest("form")!;
};

const submitForm = () => fireEvent.click(screen.getByText("Send Message"));

const fillField = (placeholder: string, value: string) => {
  const form = getForm();
  const el = within(form as HTMLElement).getByPlaceholderText(placeholder);
  fireEvent.change(el, { target: { value } });
};

describe("Contact Form Validation", () => {
  it("shows all errors on empty submit", () => {
    renderContact();
    submitForm();
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Please enter a valid email")).toBeInTheDocument();
    expect(screen.getByText("Message is required")).toBeInTheDocument();
  });

  it("shows email error for invalid email", () => {
    renderContact();
    fillField("Your name", "John");
    fillField("you@example.com", "not-an-email");
    fillField("What's on your mind?", "Hello");
    submitForm();
    expect(screen.getByText("Please enter a valid email")).toBeInTheDocument();
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
  });

  it("rejects special characters in name", () => {
    renderContact();
    fillField("Your name", "<script>alert('xss')</script>");
    fillField("you@example.com", "a@b.com");
    fillField("What's on your mind?", "Hello");
    submitForm();
    expect(screen.getByText("Name contains invalid characters")).toBeInTheDocument();
  });

  it("rejects special characters in message", () => {
    renderContact();
    fillField("Your name", "John");
    fillField("you@example.com", "a@b.com");
    fillField("What's on your mind?", "<script>{}</script>");
    submitForm();
    expect(screen.getByText("Message contains invalid characters")).toBeInTheDocument();
  });

  it("clears field error when user types", () => {
    renderContact();
    submitForm();
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    fillField("Your name", "J");
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
  });

  it("submits successfully with valid data", () => {
    renderContact();
    fillField("Your name", "Jane Doe");
    fillField("you@example.com", "jane@example.com");
    fillField("What's on your mind?", "Hello there");
    submitForm();
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
    expect(screen.queryByText("Please enter a valid email")).not.toBeInTheDocument();
    expect(screen.queryByText("Message is required")).not.toBeInTheDocument();
    const form = getForm();
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
  });

  it("silently discards honeypot submissions", () => {
    renderContact();
    const honeypotInput = document.getElementById("website") as HTMLInputElement;
    fireEvent.change(honeypotInput, { target: { value: "spam" } });
    fillField("Your name", "Bot");
    fillField("you@example.com", "bot@spam.com");
    fillField("What's on your mind?", "Buy now");
    submitForm();
    expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
    const form = getForm();
    expect(within(form as HTMLElement).getByPlaceholderText("Your name")).toHaveValue("Bot");
  });
});
