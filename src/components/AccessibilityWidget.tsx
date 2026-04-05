import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type Settings = {
  fontSize: number;
  highlightTitles: boolean;
  highlightLinks: boolean;
  dyslexiaFont: boolean;
  letterSpacing: number;
  lineHeight: number;
  fontWeight: boolean;
  alignLeft: boolean;
  contrast: "" | "dark" | "light" | "high";
  saturation: "" | "high" | "low" | "mono";
  readingGuide: boolean;
  stopAnimations: boolean;
  bigCursor: boolean;
};

const STORAGE_KEY = "bizvibe-a11y";

const defaults: Settings = {
  fontSize: 100,
  highlightTitles: false,
  highlightLinks: false,
  dyslexiaFont: false,
  letterSpacing: 0,
  lineHeight: 0,
  fontWeight: false,
  alignLeft: false,
  contrast: "",
  saturation: "",
  readingGuide: false,
  stopAnimations: false,
  bigCursor: false,
};

const load = (): Settings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
};

const ToggleCard = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-body font-medium transition-all ${
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-card text-muted-foreground hover:border-primary/40"
    }`}
  >
    {icon}
    <span className="leading-tight text-center">{label}</span>
  </button>
);

const AccessibilityWidget = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(load);

  const persist = useCallback((s: Settings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      persist(next);
      return next;
    });
  };

  const toggleCycle = (key: "contrast" | "saturation", values: string[], current: string) => {
    const idx = values.indexOf(current);
    const next = idx === -1 || idx === values.length - 1 ? "" : values[idx + 1];
    update(key, next as Settings[typeof key]);
  };

  const reset = () => {
    setSettings({ ...defaults });
    persist({ ...defaults });
  };

  // Apply all settings as CSS classes / vars on <html>
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    root.style.setProperty("--a11y-font-scale", `${settings.fontSize}%`);
    root.style.fontSize = `${settings.fontSize}%`;

    // Letter spacing
    root.style.letterSpacing = settings.letterSpacing > 0 ? `${settings.letterSpacing * 0.05}em` : "";

    // Line height
    root.style.lineHeight = settings.lineHeight > 0 ? `${1.5 + settings.lineHeight * 0.3}` : "";

    // Toggle classes
    const toggleClass = (cls: string, on: boolean) => {
      if (on) { root.classList.add(cls); } else { root.classList.remove(cls); }
    };

    toggleClass("a11y-highlight-titles", settings.highlightTitles);
    toggleClass("a11y-highlight-links", settings.highlightLinks);
    toggleClass("a11y-dyslexia", settings.dyslexiaFont);
    toggleClass("a11y-bold", settings.fontWeight);
    toggleClass("a11y-align-left", settings.alignLeft);
    toggleClass("a11y-reading-guide", settings.readingGuide);
    toggleClass("a11y-stop-animations", settings.stopAnimations);
    toggleClass("a11y-big-cursor", settings.bigCursor);

    // Contrast
    root.classList.remove("a11y-dark", "a11y-light", "a11y-high-contrast");
    if (settings.contrast === "dark") root.classList.add("a11y-dark");
    if (settings.contrast === "light") root.classList.add("a11y-light");
    if (settings.contrast === "high") root.classList.add("a11y-high-contrast");

    // Saturation
    root.classList.remove("a11y-high-sat", "a11y-low-sat", "a11y-mono");
    if (settings.saturation === "high") root.classList.add("a11y-high-sat");
    if (settings.saturation === "low") root.classList.add("a11y-low-sat");
    if (settings.saturation === "mono") root.classList.add("a11y-mono");

    return () => {
      // cleanup on unmount not strictly needed for SPA but good practice
    };
  }, [settings]);

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open accessibility menu"
        className="fixed bottom-20 left-4 z-[70] w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Accessibility className="h-6 w-6" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-foreground/60"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-[90] w-80 max-w-[90vw] bg-background border-r border-border overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
                <div className="flex items-center gap-2">
                  <Accessibility className="h-5 w-5" />
                  <span className="font-display font-semibold text-lg">Accessibility menu</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={reset} aria-label="Reset settings" className="hover:opacity-80">
                    <RotateCcw className="h-5 w-5" />
                  </button>
                  <button onClick={() => setOpen(false)} aria-label="Close" className="hover:opacity-80">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {/* Content adjustments */}
                <section>
                  <h3 className="font-display font-semibold text-sm text-foreground mb-3">Content adjustments</h3>
                  <div className="space-y-3">
                    {/* Font size */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                      <span className="font-display text-xl font-bold">T<sub className="text-sm">T</sub></span>
                      <span className="text-xs font-body font-medium text-foreground flex-1">Adjust Font Size</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => update("fontSize", Math.max(80, settings.fontSize - 10))}
                          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold"
                          aria-label="Decrease font size"
                        >
                          −
                        </button>
                        <span className="text-xs font-body font-semibold text-primary min-w-[36px] text-center">
                          {settings.fontSize}%
                        </span>
                        <button
                          onClick={() => update("fontSize", Math.min(150, settings.fontSize + 10))}
                          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold"
                          aria-label="Increase font size"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <ToggleCard
                        icon={<span className="text-lg font-bold border-b-2 border-current">T</span>}
                        label="Highlight Titles"
                        active={settings.highlightTitles}
                        onClick={() => update("highlightTitles", !settings.highlightTitles)}
                      />
                      <ToggleCard
                        icon={<span className="text-lg">🔗</span>}
                        label="Highlight Links"
                        active={settings.highlightLinks}
                        onClick={() => update("highlightLinks", !settings.highlightLinks)}
                      />
                      <ToggleCard
                        icon={<span className="text-lg font-bold">Df</span>}
                        label="Dyslexia Font"
                        active={settings.dyslexiaFont}
                        onClick={() => update("dyslexiaFont", !settings.dyslexiaFont)}
                      />
                      <ToggleCard
                        icon={<span className="text-lg tracking-widest font-bold">AV</span>}
                        label="Letter Spacing"
                        active={settings.letterSpacing > 0}
                        onClick={() => update("letterSpacing", settings.letterSpacing >= 3 ? 0 : settings.letterSpacing + 1)}
                      />
                      <ToggleCard
                        icon={<span className="text-lg">↕</span>}
                        label="Line Height"
                        active={settings.lineHeight > 0}
                        onClick={() => update("lineHeight", settings.lineHeight >= 3 ? 0 : settings.lineHeight + 1)}
                      />
                      <ToggleCard
                        icon={<span className="text-lg font-black">B</span>}
                        label="Font Weight"
                        active={settings.fontWeight}
                        onClick={() => update("fontWeight", !settings.fontWeight)}
                      />
                      <ToggleCard
                        icon={<span className="text-lg">☰</span>}
                        label="Align Left"
                        active={settings.alignLeft}
                        onClick={() => update("alignLeft", !settings.alignLeft)}
                      />
                    </div>
                  </div>
                </section>

                {/* Colour adjustments */}
                <section>
                  <h3 className="font-display font-semibold text-sm text-foreground mb-3">Colour adjustments</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <ToggleCard
                      icon={<span className="text-lg">🌙</span>}
                      label="Dark Contrast"
                      active={settings.contrast === "dark"}
                      onClick={() => update("contrast", settings.contrast === "dark" ? "" : "dark")}
                    />
                    <ToggleCard
                      icon={<span className="text-lg">☀️</span>}
                      label="Light Contrast"
                      active={settings.contrast === "light"}
                      onClick={() => update("contrast", settings.contrast === "light" ? "" : "light")}
                    />
                    <ToggleCard
                      icon={<span className="text-lg">◐</span>}
                      label="High Contrast"
                      active={settings.contrast === "high"}
                      onClick={() => update("contrast", settings.contrast === "high" ? "" : "high")}
                    />
                    <ToggleCard
                      icon={<span className="text-lg">💧</span>}
                      label="High Saturation"
                      active={settings.saturation === "high"}
                      onClick={() => update("saturation", settings.saturation === "high" ? "" : "high")}
                    />
                    <ToggleCard
                      icon={<span className="text-lg opacity-50">💧</span>}
                      label="Low Saturation"
                      active={settings.saturation === "low"}
                      onClick={() => update("saturation", settings.saturation === "low" ? "" : "low")}
                    />
                    <ToggleCard
                      icon={<span className="text-lg">⬛</span>}
                      label="Monochrome"
                      active={settings.saturation === "mono"}
                      onClick={() => update("saturation", settings.saturation === "mono" ? "" : "mono")}
                    />
                  </div>
                </section>

                {/* Navigation adjustments */}
                <section>
                  <h3 className="font-display font-semibold text-sm text-foreground mb-3">Navigation adjustments</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <ToggleCard
                      icon={<span className="text-lg">📖</span>}
                      label="Reading Guide"
                      active={settings.readingGuide}
                      onClick={() => update("readingGuide", !settings.readingGuide)}
                    />
                    <ToggleCard
                      icon={<span className="text-lg">⏸</span>}
                      label="Stop Animations"
                      active={settings.stopAnimations}
                      onClick={() => update("stopAnimations", !settings.stopAnimations)}
                    />
                    <ToggleCard
                      icon={<span className="text-lg">🖱️</span>}
                      label="Big Cursor"
                      active={settings.bigCursor}
                      onClick={() => update("bigCursor", !settings.bigCursor)}
                    />
                  </div>
                </section>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  <Button variant="hero" className="w-full" onClick={reset}>
                    Reset settings
                  </Button>
                  <div className="text-center">
                    <Link
                      to="/accessibility"
                      onClick={() => setOpen(false)}
                      className="text-sm font-body text-primary hover:underline"
                    >
                      Accessibility statement
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccessibilityWidget;
