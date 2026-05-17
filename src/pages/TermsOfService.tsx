import Layout from "@/components/Layout";
import PageMeta from "@/components/PageMeta";

const TermsOfService = () => (
  <Layout>
    <PageMeta
      title="Terms of Service — <Good Vibes Café/>"
      description="<Good Vibes Café/> Terms of Service covering usage rules, intellectual property, liability, and membership terms."
    />
    <div className="container max-w-3xl py-16 space-y-10">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-[-0.02em] text-foreground">
          Terms of Service
        </h1>
        <p className="mt-4 font-body text-muted-foreground">
          Last updated: April 5, 2026
        </p>
      </header>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the {"<Good Vibes Café/>"} platform ("Service"), you agree to be bound by these
          Terms of Service ("Terms"). If you do not agree with any part of these Terms, you may not
          use the Service. We reserve the right to update these Terms at any time, and your continued
          use of the Service constitutes acceptance of any changes.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">2. Description of Service</h2>
        <p>
          {"<Good Vibes Café/>"} is a community platform for builders, founders, and creators. The Service includes
          community forums, event listings, member directories, newsletters, and related tools
          designed to help members build, ship, and grow together.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">3. User Accounts</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You must provide accurate and complete information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You are responsible for all activities that occur under your account.</li>
          <li>You must be at least 18 years of age to create an account.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">4. Membership Tiers</h2>
        <p>
          {"<Good Vibes Café/>"} offers Free and Pro membership tiers. Free tier access is provided at no cost. Pro
          tier memberships are subject to applicable fees, which will be clearly communicated before
          purchase. We reserve the right to modify pricing and tier benefits with reasonable notice.
          Refund policies for paid memberships will be specified at the point of purchase.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
          <li>Post or transmit content that is defamatory, obscene, threatening, or harassing.</li>
          <li>Impersonate any person or entity or misrepresent your affiliation.</li>
          <li>Attempt to gain unauthorized access to any part of the Service.</li>
          <li>Use automated tools to scrape, crawl, or extract data from the Service.</li>
          <li>Distribute spam, malware, or other harmful content.</li>
          <li>Interfere with or disrupt the integrity or performance of the Service.</li>
        </ul>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">6. User Content</h2>
        <p>
          You retain ownership of content you post on the Service ("User Content"). By posting User
          Content, you grant {"<Good Vibes Café/>"} a non-exclusive, worldwide, royalty-free license to use,
          display, and distribute your content in connection with the Service. You are solely
          responsible for your User Content and represent that you have all necessary rights to post
          it. We reserve the right to remove any User Content that violates these Terms.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">7. Intellectual Property</h2>
        <p>
          The Service and its original content (excluding User Content), features, and functionality
          are owned by {"<Good Vibes Café/>"} Collective and are protected by international copyright, trademark,
          and other intellectual property laws. You may not copy, modify, distribute, or create
          derivative works based on the Service without our express written permission.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">8. Privacy</h2>
        <p>
          Your use of the Service is also governed by our{" "}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, which
          describes how we collect, use, and protect your personal data in accordance with the EU
          General Data Protection Regulation (GDPR) and other applicable data protection laws.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">9. Disclaimer of Warranties</h2>
        <p>
          The Service is provided on an "as is" and "as available" basis without warranties of any
          kind, either express or implied, including but not limited to implied warranties of
          merchantability, fitness for a particular purpose, and non-infringement. {"<Good Vibes Café/>"} does not
          warrant that the Service will be uninterrupted, error-free, or secure.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">10. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by applicable law, {"<Good Vibes Café/>"} Collective and its founders,
          members, employees, and affiliates shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, including but not limited to loss of profits,
          data, use, or goodwill, arising out of or in connection with your use of the Service,
          whether based on warranty, contract, tort, or any other legal theory, even if advised of
          the possibility of such damages. In no event shall our total liability exceed the amount
          you paid to {"<Good Vibes Café/>"} in the twelve (12) months preceding the claim.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">11. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless {"<Good Vibes Café/>"} Collective and its founders,
          members, and affiliates from and against any claims, liabilities, damages, losses, and
          expenses arising out of or in connection with your use of the Service, violation of these
          Terms, or infringement of any third-party rights.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">12. Termination</h2>
        <p>
          We may terminate or suspend your access to the Service immediately, without prior notice,
          for any reason, including breach of these Terms. Upon termination, your right to use the
          Service will cease immediately. All provisions of these Terms which by their nature should
          survive termination shall survive, including ownership, warranty disclaimers, indemnity,
          and limitations of liability.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">13. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of Finland,
          without regard to its conflict of law provisions. Any disputes arising from these Terms or
          the Service shall be resolved in the courts of Helsinki, Finland. For users in the EU, this
          does not affect your statutory rights under your local consumer protection laws.
        </p>
      </section>

      <section className="space-y-4 font-body text-foreground/90 leading-relaxed">
        <h2 className="font-display text-2xl font-semibold text-foreground">14. Contact</h2>
        <p>
          If you have any questions about these Terms, please contact us:
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

export default TermsOfService;
