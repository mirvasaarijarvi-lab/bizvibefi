import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";

const PrivacyPolicy = () => (
  <Layout>
    <PageMeta
      title="Privacy Policy — <Good Vibes Café/>"
      description="<Good Vibes Café/>'s privacy policy explaining how we collect, use, and protect your personal data in compliance with GDPR and other applicable regulations."
    />
    <div className="container max-w-3xl py-16 space-y-10">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-4 font-body text-muted-foreground">Last updated: April 5, 2026</p>
      </header>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">1. Data Controller</h2>
        <p>
          <Good Vibes Café/> Collective ("<strong><Good Vibes Café/></strong>", "we", "us") is the data controller for
          personal data processed through this website. You can contact us at{" "}
          <a href="mailto:shipping@goodvibescafe.fi" className="text-primary hover:underline">
            shipping@goodvibescafe.fi
          </a>.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          2. What Data We Collect
        </h2>
        <p>We may collect the following categories of personal data:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account data</strong> — email address, display name, profile information
            (company, bio, LinkedIn URL, avatar) when you create an account.
          </li>
          <li>
            <strong>Contact form data</strong> — name, email address, and message content when you
            use our contact form.
          </li>
          <li>
            <strong>Newsletter data</strong> — email address when you subscribe to our newsletter.
          </li>
          <li>
            <strong>Forum data</strong> — posts, replies, and related metadata you submit in the
            community forum.
          </li>
          <li>
            <strong>Event data</strong> — RSVP status and related information when you register for
            events.
          </li>
          <li>
            <strong>Technical data</strong> — IP address, browser type, device information, and
            usage data collected automatically through essential cookies and server logs.
          </li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          3. Legal Basis for Processing
        </h2>
        <p>We process personal data based on the following legal grounds under the GDPR:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Consent (Art. 6(1)(a))</strong> — newsletter subscriptions and optional
            analytics cookies.
          </li>
          <li>
            <strong>Contract performance (Art. 6(1)(b))</strong> — providing account features,
            forum access, and event functionality.
          </li>
          <li>
            <strong>Legitimate interest (Art. 6(1)(f))</strong> — website security, fraud
            prevention, and service improvement.
          </li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          4. How We Use Your Data
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide and maintain your account and community access.</li>
          <li>To send newsletters you have subscribed to.</li>
          <li>To respond to contact form inquiries.</li>
          <li>To manage event registrations and RSVPs.</li>
          <li>To operate and moderate the community forum.</li>
          <li>To improve our website and user experience.</li>
          <li>To comply with legal obligations.</li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          5. Data Sharing &amp; Transfers
        </h2>
        <p>
          We do not sell your personal data. We may share data with the following categories of
          service providers who process data on our behalf:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Cloud hosting and database providers (infrastructure).</li>
          <li>Authentication service providers.</li>
          <li>Analytics providers (only with your consent).</li>
        </ul>
        <p>
          Some service providers may be located outside the EU/EEA. In such cases, we ensure
          appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved
          by the European Commission, or adequacy decisions.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          6. Cookies &amp; Tracking
        </h2>
        <p>We use the following types of cookies:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Essential cookies</strong> — required for the website to function (authentication,
            session management, preferences). These do not require consent.
          </li>
          <li>
            <strong>Analytics cookies</strong> — used to understand how visitors interact with the
            website. These are only set with your explicit consent via the cookie consent banner.
          </li>
        </ul>
        <p>
          You can manage your cookie preferences at any time by clearing your browser cookies or
          using the cookie consent controls on the site.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">7. Data Retention</h2>
        <p>
          We retain personal data only as long as necessary for the purposes described in this
          policy:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Account data is retained until you delete your account.</li>
          <li>Contact form submissions are retained for up to 12 months.</li>
          <li>Newsletter subscriptions are retained until you unsubscribe.</li>
          <li>Forum content is retained as part of the community record unless you request deletion.</li>
          <li>Server logs are retained for up to 90 days.</li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          8. Your Rights (GDPR)
        </h2>
        <p>Under the GDPR, you have the following rights regarding your personal data:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Right of access</strong> — request a copy of the personal data we hold about
            you.
          </li>
          <li>
            <strong>Right to rectification</strong> — request correction of inaccurate data.
          </li>
          <li>
            <strong>Right to erasure</strong> — request deletion of your personal data ("right to
            be forgotten").
          </li>
          <li>
            <strong>Right to restrict processing</strong> — request that we limit how we use your
            data.
          </li>
          <li>
            <strong>Right to data portability</strong> — receive your data in a structured,
            machine-readable format.
          </li>
          <li>
            <strong>Right to object</strong> — object to processing based on legitimate interest.
          </li>
          <li>
            <strong>Right to withdraw consent</strong> — withdraw consent at any time where
            processing is based on consent.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:shipping@goodvibescafe.fi" className="text-primary hover:underline">
            shipping@goodvibescafe.fi
          </a>
          . We will respond within 30 days.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          9. Children's Privacy
        </h2>
        <p>
          <Good Vibes Café/> is not intended for individuals under the age of 16. We do not knowingly collect
          personal data from children. If we become aware that we have collected data from a child
          under 16, we will take steps to delete it promptly.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">10. Security</h2>
        <p>
          We implement appropriate technical and organisational measures to protect your personal
          data against unauthorised access, alteration, disclosure, or destruction. These include
          encryption in transit (TLS), secure authentication, and access controls.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          11. Changes to This Policy
        </h2>
        <p>
          We may update this privacy policy from time to time. Material changes will be communicated
          via the website or email. The "last updated" date at the top reflects the most recent
          revision.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          12. Supervisory Authority
        </h2>
        <p>
          If you believe your data protection rights have been violated, you have the right to lodge
          a complaint with a supervisory authority. In Finland, this is the Office of the Data
          Protection Ombudsman (
          <a
            href="https://tietosuoja.fi/en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            tietosuoja.fi
          </a>
          ).
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">13. Contact</h2>
        <p>
          For any questions regarding this privacy policy or your personal data, please contact:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Email:{" "}
            <a href="mailto:shipping@goodvibescafe.fi" className="text-primary hover:underline">
              shipping@goodvibescafe.fi
            </a>
          </li>
          <li>
            Contact page:{" "}
            <a href="/contact" className="text-primary hover:underline">
              goodvibescafe.fi/contact
            </a>
          </li>
        </ul>
      </section>
    </div>
  </Layout>
);

export default PrivacyPolicy;
