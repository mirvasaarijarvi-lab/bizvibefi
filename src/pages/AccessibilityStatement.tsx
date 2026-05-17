import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";

const AccessibilityStatement = () => (
  <Layout>
    <PageMeta
      title="Accessibility Statement — <Good Vibes Café/>"
      description="<Good Vibes Café/>'s commitment to digital accessibility, covering WCAG 2.1 AA, EU European Accessibility Act, ADA, and Section 508 compliance."
    />
    <div className="container max-w-3xl py-16 space-y-10">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] text-foreground">
          Accessibility Statement
        </h1>
        <p className="mt-4 font-body text-muted-foreground">
          Last updated: April 5, 2026
        </p>
      </header>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">Our Commitment</h2>
        <p>
          <Good Vibes Café/> is committed to ensuring digital accessibility for people of all abilities. We are
          continually improving the user experience for everyone and applying the relevant
          accessibility standards to ensure we provide equal access to all users.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">Standards &amp; Guidelines</h2>
        <p>We strive to conform to the following standards:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>WCAG 2.1 Level AA</strong> — Web Content Accessibility Guidelines published by
            the World Wide Web Consortium (W3C). These guidelines explain how to make web content
            more accessible to people with disabilities.
          </li>
          <li>
            <strong>EN 301 549</strong> — European standard for ICT accessibility requirements,
            referenced by the European Accessibility Act (EAA, Directive (EU) 2019/882).
          </li>
          <li>
            <strong>ADA (Americans with Disabilities Act)</strong> — US federal civil-rights
            legislation that prohibits discrimination based on disability, interpreted to apply to
            websites and digital services.
          </li>
          <li>
            <strong>Section 508 of the Rehabilitation Act</strong> — Requires US federal agencies'
            electronic and information technology to be accessible, and widely adopted as a benchmark
            for private-sector compliance.
          </li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          European Accessibility Act (EAA)
        </h2>
        <p>
          The European Accessibility Act (Directive (EU) 2019/882) requires that products and
          services — including websites and mobile applications — placed on the EU market meet
          defined accessibility requirements from June 28, 2025. <Good Vibes Café/> aligns with the EN 301 549
          harmonized standard to meet these requirements and is committed to ongoing monitoring and
          improvement.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          North American Compliance
        </h2>
        <p>
          In the United States, the ADA and Section 508 require accessible digital experiences. In
          Canada, the Accessible Canada Act (ACA) and provincial legislation such as AODA (Ontario)
          set similar standards. <Good Vibes Café/>'s conformance with WCAG 2.1 AA addresses the technical
          requirements referenced by all of these frameworks.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">Measures Taken</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Semantic HTML5 elements for meaningful document structure.</li>
          <li>"Skip to content" link for keyboard navigation.</li>
          <li>ARIA attributes where appropriate to enhance assistive-technology compatibility.</li>
          <li>Sufficient colour contrast ratios across light and dark themes.</li>
          <li>Keyboard-navigable interactive components with visible focus indicators.</li>
          <li>Respects <code>prefers-reduced-motion</code> and <code>prefers-color-scheme</code> user preferences.</li>
          <li>On-site accessibility widget allowing users to adjust font size, spacing, contrast, and more.</li>
          <li>Responsive design that works across screen sizes and orientations.</li>
          <li>Alt text on meaningful images.</li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">Known Limitations</h2>
        <p>
          While we strive for full WCAG 2.1 AA compliance, some third-party content or newly added
          features may not yet meet all criteria. We are actively working to identify and resolve
          any accessibility barriers. If you encounter an issue, please let us know.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Feedback &amp; Contact
        </h2>
        <p>
          We welcome your feedback on the accessibility of <Good Vibes Café/>. If you encounter accessibility
          barriers or have suggestions, please contact us:
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
        <p>We aim to respond to accessibility feedback within 5 business days.</p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Enforcement Procedures
        </h2>
        <p>
          If you are not satisfied with our response, you may contact your national enforcement
          body. In Finland, this is the Regional State Administrative Agency for Southern Finland
          (Accessibility Monitoring). In the US, complaints may be filed with the Department of
          Justice or relevant federal agencies.
        </p>
      </section>
    </div>
  </Layout>
);

export default AccessibilityStatement;
