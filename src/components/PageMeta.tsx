import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageMetaProps {
  title: string;
  description: string;
  /** Optional override for og:type (e.g. "article"). Defaults to "website". */
  ogType?: string;
  /** Optional canonical URL override; otherwise derived from current path. */
  canonical?: string;
}

const SITE_ORIGIN = "https://goodvibescafe.org";

const setMeta = (selector: string, content: string) => {
  const el = document.querySelector(selector);
  if (el) el.setAttribute("content", content);
};

const setLink = (rel: string, href: string) => {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const PageMeta = ({ title, description, ogType = "website", canonical }: PageMetaProps) => {
  const location = useLocation();

  useEffect(() => {
    const url = canonical ?? `${SITE_ORIGIN}${location.pathname}`;
    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[property="og:type"]', ogType);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setLink("canonical", url);
  }, [title, description, ogType, canonical, location.pathname]);

  return null;
};

export default PageMeta;
