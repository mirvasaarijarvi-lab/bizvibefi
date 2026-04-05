import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CookieConsent from "./CookieConsent";
import AccessibilityWidget from "./AccessibilityWidget";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <a href="#main-content" className="skip-to-content">
      Skip to content
    </a>
    <Navbar />
    <main id="main-content" className="flex-1 pt-16">{children}</main>
    <Footer />
    <CookieConsent />
    <AccessibilityWidget />
  </div>
);

export default Layout;
