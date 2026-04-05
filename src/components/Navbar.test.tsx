import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TranslationProvider } from "@/i18n/TranslationContext";
import { translations } from "@/i18n";
import Navbar from "./Navbar";

const renderNavbar = () =>
  render(
    <BrowserRouter>
      <TranslationProvider translations={translations}>
        <Navbar />
      </TranslationProvider>
    </BrowserRouter>
  );

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

  it("renders the Join CTA button", () => {
    renderNavbar();
    expect(screen.getAllByText("Join the Vibe").length).toBeGreaterThanOrEqual(1);
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
