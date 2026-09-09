import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageMetaProps {
  title: string;
  description: string;
  /** Optional override for og:type (e.g. "article"). Defaults to "website". */
  ogType?: string;
  /** Optional canonical URL override; otherwise derived from current path. */
  canonical?: string;
  /** Optional absolute (or root-relative) share image for og:image / twitter:image. */
  ogImage?: string;
}

const SITE_ORIGIN = "https://goodvibescafe.org";

const setMeta = (selector: string, content: string) => {
  const el = document.querySelector(selector);
  if (el) el.setAttribute("content", content);
};

const ensureMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
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

const toAbsolute = (src: string) =>
  src.startsWith("http://") || src.startsWith("https://")
    ? src
    : `${SITE_ORIGIN}${src.startsWith("/") ? "" : "/"}${src}`;

const PageMeta = ({ title, description, ogType = "website", canonical, ogImage }: PageMetaProps) => {
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
    if (ogImage) {
      const absolute = toAbsolute(ogImage);
      ensureMeta("property", "og:image", absolute);
      ensureMeta("name", "twitter:image", absolute);
    }
    setLink("canonical", url);
  }, [title, description, ogType, canonical, ogImage, location.pathname]);

  return null;
};

export default PageMeta;
