import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TranslationProvider } from "@/i18n/TranslationContext";
import { translations } from "@/i18n";
import Navbar from "./Navbar";

const renderNavbar = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TranslationProvider translations={translations}>
          <Navbar />
        </TranslationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("Navbar", () => {
  it("renders the BizVibe logo", () => {
    renderNavbar();
    expect(screen.getByText("BizVibe")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    renderNavbar();
    expect(screen.getAllByText("Home").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Community").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Get Going").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("About").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Contact").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the Sign In CTA button", () => {
    renderNavbar();
    expect(screen.getAllByText("Sign In").length).toBeGreaterThanOrEqual(1);
  });

  it("shows current language as EN by default", () => {
    renderNavbar();
    expect(screen.getAllByText("EN").length).toBeGreaterThanOrEqual(1);
  });

  it("opens language dropdown on click", () => {
    renderNavbar();
    const langButtons = screen.getAllByText("EN");
    fireEvent.click(langButtons[0]);
    expect(screen.getAllByText("FI").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("SV").length).toBeGreaterThanOrEqual(1);
  });

  it("has correct link hrefs", () => {
    renderNavbar();
    const homeLinks = screen.getAllByText("Home");
    const link = homeLinks[0].closest("a");
    expect(link).toHaveAttribute("href", "/");
  });
});
