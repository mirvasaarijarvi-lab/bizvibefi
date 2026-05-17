import { useEffect } from "react";

interface JsonLdProps {
  /** Stable id so we can replace the script across renders without duplicating. */
  id: string;
  data: Record<string, unknown> | null | undefined;
}

const JsonLd = ({ id, data }: JsonLdProps) => {
  useEffect(() => {
    if (!data) return;
    const elementId = `jsonld-${id}`;
    let el = document.getElementById(elementId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = elementId;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => {
      el?.remove();
    };
  }, [id, data]);

  return null;
};

export default JsonLd;
