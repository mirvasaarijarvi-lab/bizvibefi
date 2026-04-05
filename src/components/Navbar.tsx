import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe, User, LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation, type Language } from "@/i18n/TranslationContext";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";

const langLabels: Record<Language, string> = { en: "EN", fi: "FI", sv: "SV" };
const langOptions: Language[] = ["en", "fi", "sv"];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { t, lang, setLang } = useTranslation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/community", label: t("nav.community") },
    { to: "/get-going", label: t("nav.getGoing") },
    { to: "/forum", label: "Forum" },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-[-0.03em]">
          <span className="text-gradient-storm">BizVibe</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-body text-sm font-medium transition-colors hover:text-purple-soft ${
                location.pathname === link.to || (link.to === "/forum" && location.pathname.startsWith("/forum"))
                  ? "text-purple-vivid"
                  : "text-silver"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 text-sm font-body font-medium text-silver hover:text-foreground transition-colors"
            >
              <Globe className="h-4 w-4" />
              {langLabels[lang]}
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-2 bg-card border border-border rounded-lg overflow-hidden shadow-lg"
                >
                  {langOptions.map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      className={`block w-full px-4 py-2 text-sm font-body text-left transition-colors hover:bg-muted ${
                        lang === l ? "text-purple-vivid" : "text-foreground"
                      }`}
                    >
                      {langLabels[l]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-muted text-xs font-display">
                    {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-lg overflow-hidden shadow-lg"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-display font-semibold text-foreground truncate">
                        {profile?.display_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground font-body capitalize">
                        {profile?.membership_tier} member
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-body text-foreground hover:bg-muted transition-colors"
                    >
                      <User className="h-4 w-4" /> Profile
                    </Link>
                    <Link
                      to="/forum"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-body text-foreground hover:bg-muted transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" /> Forum
                    </Link>
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-body text-destructive hover:bg-muted transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 text-sm font-body text-silver"
            >
              <Globe className="h-4 w-4" />
              {langLabels[lang]}
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-2 bg-card border border-border rounded-lg overflow-hidden shadow-lg z-50"
                >
                  {langOptions.map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      className={`block w-full px-4 py-2 text-sm font-body text-left hover:bg-muted ${
                        lang === l ? "text-purple-vivid" : "text-foreground"
                      }`}
                    >
                      {langLabels[l]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button className="text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container py-4 flex flex-col gap-4">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`font-body text-base font-medium transition-colors ${
                    location.pathname === link.to ? "text-purple-vivid" : "text-silver"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setOpen(false)} className="font-body text-base font-medium text-silver">
                    Profile
                  </Link>
                  <button onClick={() => { signOut(); setOpen(false); }} className="font-body text-base font-medium text-destructive text-left">
                    Sign Out
                  </button>
                </>
              ) : (
                <Button variant="hero" size="sm" asChild>
                  <Link to="/auth" onClick={() => setOpen(false)}>Sign In</Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
