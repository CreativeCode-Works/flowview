import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — FlowView",
};

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-zinc-500 hover:text-zinc-300"
      >
        &larr; Back to home
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mb-10 text-sm text-zinc-500">
        Effective date: April 21, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            1. Who We Are
          </h2>
          <p>
            FlowView (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) is
            operated by CreativeCode Works. Our principal country of operation is
            the <strong className="text-zinc-300">United States</strong>. You can
            reach us at{" "}
            <a
              href="mailto:kyle@flowview.dev"
              className="text-blue-400 hover:underline"
            >
              kyle@flowview.dev
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            2. Information We Collect
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-zinc-300">Account information:</strong>{" "}
              email address and password when you sign up.
            </li>
            <li>
              <strong className="text-zinc-300">Connected platform data:</strong>{" "}
              automations, contacts, tags, events, and related metadata pulled
              from platforms you connect (e.g., ActiveCampaign, Zapier, Stripe)
              via OAuth.
            </li>
            <li>
              <strong className="text-zinc-300">Usage data:</strong> pages
              visited, features used, and anonymous analytics collected via
              PostHog.
            </li>
            <li>
              <strong className="text-zinc-300">Waitlist submissions:</strong>{" "}
              email address provided through our waitlist form.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>To provide and improve FlowView&apos;s services.</li>
            <li>
              To sync, normalize, and display your automation data within the
              app.
            </li>
            <li>To run audit rules and generate reports on your stack.</li>
            <li>To send transactional emails (e.g., reports, account alerts).</li>
            <li>To communicate product updates if you opted in.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            4. Data Sharing
          </h2>
          <p>
            We do not sell your data. We share information only with
            sub-processors necessary to operate the service (e.g., Supabase for
            database hosting, Nango for OAuth token management, Vercel for
            hosting). Each sub-processor is bound by data protection agreements.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            5. Data Retention
          </h2>
          <p>
            We retain your account and synced data for as long as your account is
            active. Event history is retained for up to 90 days by default. You
            may request deletion of your data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            6. Your Rights
          </h2>
          <p>
            You may request access to, correction of, or deletion of your
            personal data by emailing{" "}
            <a
              href="mailto:kyle@flowview.dev"
              className="text-blue-400 hover:underline"
            >
              kyle@flowview.dev
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            7. Security
          </h2>
          <p>
            We use industry-standard measures to protect your data, including
            encryption in transit (TLS) and at rest. OAuth tokens are managed by
            Nango and are never stored directly in our application database.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            8. Changes to This Policy
          </h2>
          <p>
            We may update this policy from time to time. We will notify you of
            material changes via email or an in-app notice.
          </p>
        </section>
      </div>
    </div>
  );
}
