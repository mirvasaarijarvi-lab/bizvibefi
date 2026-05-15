import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TranslationProvider } from "./TranslationContext";
import { useTranslation } from "./useTranslation";
import { translations } from "./index";

const TestConsumer = () => {
  const { t, lang, setLang } = useTranslation();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="home">{t("nav.home")}</span>
      <span data-testid="hero-line1">{t("hero.line1")}</span>
      <span data-testid="nested">{t("about.founders.0.name")}</span>
      <span data-testid="missing">{t("this.key.does.not.exist")}</span>
      <span data-testid="array-item">{t("tiers.free.benefits.0")}</span>
      <button onClick={() => setLang("fi")} data-testid="set-fi">FI</button>
      <button onClick={() => setLang("sv")} data-testid="set-sv">SV</button>
      <button onClick={() => setLang("en")} data-testid="set-en">EN</button>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <TranslationProvider translations={translations}>
      <TestConsumer />
    </TranslationProvider>
  );

describe("Translation System", () => {
  it("defaults to English", () => {
    renderWithProvider();
    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("home")).toHaveTextContent("Home");
  });

  it("resolves nested keys", () => {
    renderWithProvider();
    expect(screen.getByTestId("hero-line1")).toHaveTextContent("Shoot first.");
  });

  it("resolves deeply nested keys with array index", () => {
    renderWithProvider();
    expect(screen.getByTestId("nested")).toHaveTextContent("Minna Blomster");
  });

  it("resolves array items by index", () => {
    renderWithProvider();
    expect(screen.getByTestId("array-item")).toHaveTextContent("Starter WhatsApp community");
  });

  it("returns key path for missing keys", () => {
    renderWithProvider();
    expect(screen.getByTestId("missing")).toHaveTextContent("this.key.does.not.exist");
  });

  it("switches to Finnish", () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId("set-fi"));
    expect(screen.getByTestId("lang")).toHaveTextContent("fi");
    // Finnish nav.home should differ from English
    expect(screen.getByTestId("home")).not.toHaveTextContent("Home");
  });

  it("switches to Swedish", () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId("set-sv"));
    expect(screen.getByTestId("lang")).toHaveTextContent("sv");
    expect(screen.getByTestId("home")).not.toHaveTextContent("Home");
  });

  it("switches back to English", () => {
    renderWithProvider();
    fireEvent.click(screen.getByTestId("set-fi"));
    fireEvent.click(screen.getByTestId("set-en"));
    expect(screen.getByTestId("lang")).toHaveTextContent("en");
    expect(screen.getByTestId("home")).toHaveTextContent("Home");
  });

  it("throws when useTranslation is used outside provider", () => {
    const Orphan = () => {
      useTranslation();
      return null;
    };
    expect(() => render(<Orphan />)).toThrow("useTranslation must be used within TranslationProvider");
  });
});
