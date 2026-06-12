import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";

const SecurityTrust = () => (
  <Layout>
    <PageMeta
      title="Security & Trust — <Good Vibes Café/>"
      description="Security practices, vulnerability disclosure policy, subprocessor list, incident response, and trust documentation for <Good Vibes Café/> members, sponsors, and partners."
    />
    <div className="container max-w-3xl py-16 space-y-10">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] text-foreground">
          Security &amp; Trust
        </h1>
        <p className="mt-4 font-body text-muted-foreground">Last updated: June 12, 2026</p>
        <p className="mt-4 font-body text-foreground/90">
          {"<Good Vibes Café/>"} is a community and event platform. We aim to align with the spirit
          of the EU Cyber Resilience Act (CRA) and GDPR Art. 32 even where formal scope does not
          strictly apply.
        </p>
      </header>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">1. Security contact</h2>
        <p>
          Report suspected vulnerabilities or security concerns to{" "}
          <a href="mailto:security@goodvibescafe.org" className="text-primary hover:underline">
            security@goodvibescafe.org
          </a>
          . We acknowledge reports within 5 business days.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">2. Vulnerability disclosure policy</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Report privately to the address above before any public disclosure.</li>
          <li>Provide steps to reproduce, affected URL/endpoint, and impact.</li>
          <li>Do not access, modify, or delete data that does not belong to you.</li>
          <li>Do not run denial-of-service, spam, or social-engineering attacks against members or staff.</li>
          <li>
            Good-faith research that follows this policy will not be pursued legally. We aim to
            triage within 5 business days and remediate critical issues within 30 days.
          </li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">3. Security practices</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>TLS 1.2+ encryption in transit for all traffic.</li>
          <li>Encryption at rest for databases and object storage via our infrastructure provider.</li>
          <li>Row-Level Security policies on all member-facing database tables.</li>
          <li>Role-based access control with least-privilege admin roles.</li>
          <li>Multi-factor authentication required for administrators.</li>
          <li>Automated dependency scanning (Dependabot) and CI security checks.</li>
          <li>Secrets stored in a managed vault, never in source control (enforced by gitleaks).</li>
          <li>Audit logging of administrative actions.</li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">4. Subprocessors</h2>
        <p>We rely on the following processors to operate the service:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-semibold">Provider</th>
                <th className="text-left p-3 font-semibold">Purpose</th>
                <th className="text-left p-3 font-semibold">Region</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="p-3">Lovable</td>
                <td className="p-3">Hosting, build, preview, content delivery</td>
                <td className="p-3">EU</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3">Supabase</td>
                <td className="p-3">Database, authentication, storage, edge functions</td>
                <td className="p-3">EU</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3">Mailgun</td>
                <td className="p-3">Transactional email delivery</td>
                <td className="p-3">EU</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3">Plausible / Umami</td>
                <td className="p-3">Cookie-less, privacy-friendly analytics (with consent)</td>
                <td className="p-3">EU</td>
              </tr>
              <tr className="border-t border-border">
                <td className="p-3">Google / Microsoft / Apple</td>
                <td className="p-3">OAuth sign-in providers (only if you choose them)</td>
                <td className="p-3">Global</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Where a provider is outside the EU/EEA, transfers rely on Standard Contractual Clauses or
          an adequacy decision. We will notify members of material changes to this list.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">5. Data retention</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Account profiles — until you delete your account.</li>
          <li>Event RSVPs and signups — 24 months after the event, then anonymised.</li>
          <li>Contact form messages — up to 12 months.</li>
          <li>Newsletter subscription — until you unsubscribe.</li>
          <li>Server and access logs — up to 90 days.</li>
          <li>Audit logs — up to 24 months.</li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">6. Incident response</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Triage and contain within 24 hours of detection.</li>
          <li>Assess scope, affected data categories, and root cause.</li>
          <li>
            Notify the Finnish Data Protection Ombudsman within 72 hours where the incident meets
            the GDPR notification threshold (Art. 33).
          </li>
          <li>Notify affected members without undue delay if their rights are at risk (Art. 34).</li>
          <li>Publish a post-incident summary on this page when remediation is complete.</li>
        </ol>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">7. Backups &amp; recovery</h2>
        <p>
          Databases are backed up daily by our infrastructure provider with point-in-time recovery.
          We test restore procedures at least annually.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">8. Dependency inventory</h2>
        <p>
          Our application dependencies are declared in our open package manifest and continuously
          monitored by GitHub Dependabot and CI security scans. Sponsors and partners may request a
          current SBOM (CycloneDX) by emailing the security contact above.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">9. AI usage</h2>
        <p>
          {"<Good Vibes Café/>"} uses a small AI-powered support chat assistant to help visitors
          navigate the site. The assistant is clearly labelled, never makes automated decisions
          about you, and does not perform profiling within the meaning of the EU AI Act. No member
          data is used to train third-party models.
        </p>
      </section>
    </div>
  </Layout>
);

export default SecurityTrust;
