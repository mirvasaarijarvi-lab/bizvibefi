import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";

const CookiePolicy = () => (
  <Layout>
    <PageMeta
      title="Cookie Policy — <Good Vibes Café/>"
      description="How <Good Vibes Café/> uses cookies and similar technologies, what categories we set, and how to manage your preferences under GDPR and the ePrivacy Directive."
    />
    <div className="container max-w-3xl py-16 space-y-10">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] text-foreground">
          Cookie Policy
        </h1>
        <p className="mt-4 font-body text-muted-foreground">Last updated: June 12, 2026</p>
      </header>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">1. What are cookies</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. We also use
          comparable browser-storage technologies such as <code>localStorage</code> to remember your
          preferences (for example, your cookie consent choice and theme).
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">2. Categories we use</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Strictly necessary</strong> — authentication session, CSRF protection, language
            and theme preference, cookie-consent state. Set without consent because the site cannot
            function without them.
          </li>
          <li>
            <strong>Functional</strong> — accessibility widget preferences and similar UI state.
          </li>
          <li>
            <strong>Analytics</strong> — only loaded if you click <em>Accept</em> in the cookie
            banner. We use a cookie-less, privacy-friendly analytics approach (Plausible / Umami
            style) without cross-site tracking or advertising identifiers.
          </li>
        </ul>
        <p>
          We do not use advertising cookies, third-party marketing pixels, or cross-site tracking.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">3. Managing your choice</h2>
        <p>
          You can change your decision at any time by clearing the <code>bizvibe-cookie-consent</code>
          entry in your browser storage, after which the banner reappears on your next visit. Most
          browsers also let you block or delete cookies via their settings.
        </p>
        <p>
          Declining analytics does not affect access to any feature of the site.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">4. Related policies</h2>
        <p>
          For information about how we process personal data, see our{" "}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. For the
          providers that process data on our behalf, see our{" "}
          <a href="/security" className="text-primary hover:underline">Security &amp; Trust</a> page.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">5. Contact</h2>
        <p>
          Questions about this cookie policy? Email{" "}
          <a href="mailto:shipping@goodvibescafe.org" className="text-primary hover:underline">
            shipping@goodvibescafe.org
          </a>.
        </p>
      </section>
    </div>
  </Layout>
);

export default CookiePolicy;
