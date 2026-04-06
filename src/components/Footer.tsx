import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import NewsletterSignup from "@/components/NewsletterSignup";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="font-display text-xl font-extrabold text-gradient-storm">BizVibe</span>
            <p className="mt-3 text-sm text-muted-foreground font-body">{t("footer.desc")}</p>
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
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground font-body">© {new Date().getFullYear()} {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
