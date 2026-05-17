import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ReactElement } from "react";
import PageMeta from "./PageMeta";

const renderWithRouter = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("PageMeta", () => {
  beforeEach(() => {
    document.title = "";
    // Set up meta tags in head
    const metas = [
      { attr: "name", val: "description" },
      { attr: "property", val: "og:title" },
      { attr: "property", val: "og:description" },
      { attr: "name", val: "twitter:title" },
      { attr: "name", val: "twitter:description" },
    ];
    metas.forEach(({ attr, val }) => {
      if (!document.querySelector(`meta[${attr}="${val}"]`)) {
        const el = document.createElement("meta");
        el.setAttribute(attr, val);
        el.setAttribute("content", "");
        document.head.appendChild(el);
      } else {
        document.querySelector(`meta[${attr}="${val}"]`)!.setAttribute("content", "");
      }
    });
  });

  it("sets document.title", () => {
    renderWithRouter(<PageMeta title="Test Title" description="Test desc" />);
    expect(document.title).toBe("Test Title");
  });

  it("sets meta description", () => {
    renderWithRouter(<PageMeta title="T" description="My description" />);
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("My description");
  });

  it("sets Open Graph title and description", () => {
    renderWithRouter(<PageMeta title="OG Title" description="OG Desc" />);
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe("OG Title");
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute("content")).toBe("OG Desc");
  });

  it("sets Twitter title and description", () => {
    renderWithRouter(<PageMeta title="TW Title" description="TW Desc" />);
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute("content")).toBe("TW Title");
    expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute("content")).toBe("TW Desc");
  });

  it("updates when props change", () => {
    const { rerender } = renderWithRouter(<PageMeta title="First" description="First desc" />);
    expect(document.title).toBe("First");
    rerender(<MemoryRouter><PageMeta title="Second" description="Second desc" /></MemoryRouter>);
    expect(document.title).toBe("Second");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("Second desc");
  });

  it("renders nothing visually", () => {
    const { container } = renderWithRouter(<PageMeta title="T" description="D" />);
    expect(container.innerHTML).toBe("");
  });
});
