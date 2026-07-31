import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import NewsletterSignup from "@/components/NewsletterSignup";
import logoMarkDark from "@/assets/logo-mark-transparent.png";
import logoMarkLight from "@/assets/logo-mark-light.png";
import aiByCmimmio from "@/assets/ai-by-cmimmio.png.asset.json";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="font-display text-xl font-extrabold text-gradient-storm">{"<Good Vibes Café/>"}</span>
            <p className="mt-3 text-sm text-muted-foreground font-body">{t("footer.desc")}</p>
            <img
              src={logoMarkLight}
              alt="<Good Vibes Café/> logo"
              loading="lazy"
              width={96}
              height={96}
              className="mt-5 h-24 w-24 object-contain block dark:hidden"
            />
            <img
              src={logoMarkDark}
              alt="<Good Vibes Café/> logo"
              loading="lazy"
              width={96}
              height={96}
              className="mt-5 h-24 w-24 object-contain hidden dark:block"
            />
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">{t("footer.navigate")}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-purple-soft font-body">{t("nav.home")}</Link>
              <Link to="/community" className="text-sm text-muted-foreground hover:text-purple-soft font-body">{t("nav.community")}</Link>
              <Link to="/get-going" className="text-sm text-muted-foreground hover:text-purple-soft font-body">{t("nav.getGoing")}</Link>
              <Link to="/showcase" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Showcase</Link>
              <Link to="/forum" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Forum</Link>
              <Link to="/events" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Events</Link>
              <Link to="/members" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Members</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">{t("footer.company")}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-purple-soft font-body">{t("nav.about")}</Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-purple-soft font-body">{t("nav.contact")}</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Terms of Service</Link>
              <Link to="/accessibility" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Accessibility</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground mb-3">Newsletter</h4>
            <p className="text-sm text-muted-foreground font-body mb-3">Updates, no spam.</p>
            <NewsletterSignup variant="inline" />
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-border">
          <h4 className="font-display text-sm font-semibold text-foreground mb-3">Trust &amp; Compliance</h4>
          <nav aria-label="Trust and compliance" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Privacy Policy</Link>
            <span className="text-muted-foreground/40" aria-hidden="true">·</span>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Terms of Service</Link>
            <span className="text-muted-foreground/40" aria-hidden="true">·</span>
            <Link to="/cookies" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Cookie Policy</Link>
            <span className="text-muted-foreground/40" aria-hidden="true">·</span>
            <Link to="/accessibility" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Accessibility</Link>
            <span className="text-muted-foreground/40" aria-hidden="true">·</span>
            <Link to="/security" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Security Contact</Link>
            <span className="text-muted-foreground/40" aria-hidden="true">·</span>
            <Link to="/data-requests" className="text-sm text-muted-foreground hover:text-purple-soft font-body">Data Requests</Link>
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center">
          <img
            src={aiByCmimmio.url}
            alt="AI by cmimmio"
            loading="lazy"
            width={48}
            height={48}
            className="mx-auto mb-3 h-12 w-12 object-contain saturate-[.6] invert dark:invert-0"
          />
          <p className="text-xs text-muted-foreground font-body">© {new Date().getFullYear()} {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
