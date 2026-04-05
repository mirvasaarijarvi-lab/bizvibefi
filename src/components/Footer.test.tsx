import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TranslationProvider } from "@/i18n/TranslationContext";
import { translations } from "@/i18n";
import Footer from "./Footer";

const renderFooter = () =>
  render(
    <BrowserRouter>
      <TranslationProvider translations={translations}>
        <Footer />
      </TranslationProvider>
    </BrowserRouter>
  );

describe("Footer", () => {
  it("renders the BizVibe logo", () => {
    renderFooter();
    expect(screen.getByText("BizVibe")).toBeInTheDocument();
  });

  it("renders footer description", () => {
    renderFooter();
    expect(screen.getByText(/Build, ship, and grow together/)).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    renderFooter();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Get Going")).toBeInTheDocument();
  });

  it("renders company links", () => {
    renderFooter();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders section headers", () => {
    renderFooter();
    expect(screen.getByText("Navigate")).toBeInTheDocument();
    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Connect")).toBeInTheDocument();
  });

  it("renders copyright with current year", () => {
    renderFooter();
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("renders #shiphappens tag", () => {
    renderFooter();
    expect(screen.getByText("#shiphappens")).toBeInTheDocument();
  });

  it("has correct link hrefs", () => {
    renderFooter();
    const aboutLink = screen.getByText("About").closest("a");
    expect(aboutLink).toHaveAttribute("href", "/about");
    const contactLink = screen.getByText("Contact").closest("a");
    expect(contactLink).toHaveAttribute("href", "/contact");
  });
});
