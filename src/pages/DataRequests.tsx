import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";

const DataRequests = () => (
  <Layout>
    <PageMeta
      title="Data Requests — <Good Vibes Café/>"
      description="Exercise your GDPR rights: request access, correction, deletion, portability, restriction, or objection regarding personal data <Good Vibes Café/> holds about you."
    />
    <div className="container max-w-3xl py-16 space-y-10">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] text-foreground">
          Data Requests
        </h1>
        <p className="mt-4 font-body text-muted-foreground">Last updated: June 12, 2026</p>
        <p className="mt-4 font-body text-foreground/90">
          Under the GDPR you have a set of rights over the personal data we hold about you. This
          page explains how to exercise them and what to expect.
        </p>
      </header>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">Your rights</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Access</strong> — a copy of the personal data we hold about you.</li>
          <li><strong>Rectification</strong> — correction of inaccurate or incomplete data.</li>
          <li><strong>Erasure</strong> — deletion of your account and associated personal data.</li>
          <li><strong>Restriction</strong> — limit how we process your data.</li>
          <li><strong>Portability</strong> — receive your data in a machine-readable format (JSON).</li>
          <li><strong>Objection</strong> — object to processing based on legitimate interest.</li>
          <li><strong>Withdraw consent</strong> — for newsletter and analytics at any time.</li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">How to submit a request</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Email{" "}
            <a href="mailto:shipping@goodvibescafe.org" className="text-primary hover:underline">
              shipping@goodvibescafe.org
            </a>{" "}
            from the address associated with your account, or use our{" "}
            <a href="/contact" className="text-primary hover:underline">contact form</a>.
          </li>
          <li>State which right you are exercising and include any relevant context.</li>
          <li>
            We may ask for additional information to verify your identity before acting, in line
            with GDPR Art. 12(6).
          </li>
        </ol>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">Response time</h2>
        <p>
          We respond within <strong>30 days</strong> of receiving a verifiable request. Complex
          cases may be extended by up to two further months, in which case we will tell you why.
          There is no fee unless the request is manifestly unfounded or excessive.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">Self-service options</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Newsletter unsubscribe</strong> — use the unsubscribe link in any newsletter or
            visit <a href="/unsubscribe" className="text-primary hover:underline">/unsubscribe</a>.
          </li>
          <li>
            <strong>Profile data</strong> — edit or remove most profile fields from your{" "}
            <a href="/profile" className="text-primary hover:underline">profile page</a>.
          </li>
          <li>
            <strong>Cookies</strong> — clear the <code>bizvibe-cookie-consent</code> entry in your
            browser to re-open the consent banner.
          </li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">Supervisory authority</h2>
        <p>
          If you are not satisfied with our response, you may lodge a complaint with the Finnish
          Office of the Data Protection Ombudsman (
          <a
            href="https://tietosuoja.fi/en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            tietosuoja.fi
          </a>
          ) or the supervisory authority in your EU/EEA member state.
        </p>
      </section>
    </div>
  </Layout>
);

export default DataRequests;
