import Link from "next/link";

export const metadata = {
  title: "Terms of Service — FlowView",
};

export default function TermsOfService() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-zinc-500 hover:text-zinc-300"
      >
        &larr; Back to home
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-white">Terms of Service</h1>
      <p className="mb-10 text-sm text-zinc-500">
        Effective date: April 21, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using FlowView (&quot;the Service&quot;), operated
            by CreativeCode Works, you agree to be bound by these Terms of
            Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            2. Description of Service
          </h2>
          <p>
            FlowView is an observability tool that connects to your marketing
            and business automation platforms, visualizes your automation flows,
            and provides audit reports. FlowView is not an automation builder or
            iPaaS.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            3. Accounts
          </h2>
          <p>
            You must provide a valid email address to create an account. You are
            responsible for maintaining the security of your account credentials.
            You are responsible for all activity that occurs under your account.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            4. Connected Platforms
          </h2>
          <p>
            When you connect third-party platforms (e.g., ActiveCampaign, Zapier,
            Stripe), you authorize FlowView to access and sync data from those
            platforms on your behalf. You represent that you have the authority to
            grant this access.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            5. Acceptable Use
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use the Service for any unlawful purpose.</li>
            <li>
              Attempt to gain unauthorized access to any part of the Service.
            </li>
            <li>
              Reverse-engineer, decompile, or disassemble any part of the
              Service.
            </li>
            <li>
              Use the Service to store or transmit malicious code or content.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            6. Intellectual Property
          </h2>
          <p>
            The Service and its original content, features, and functionality are
            owned by CreativeCode Works and are protected by applicable
            intellectual property laws. Your data remains yours — we claim no
            ownership over data you import into FlowView.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            7. Disclaimer of Warranties
          </h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, whether express or
            implied. We do not warrant that the Service will be uninterrupted,
            error-free, or secure.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            8. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, CreativeCode Works shall not
            be liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits or revenue, whether incurred
            directly or indirectly, arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            9. Termination
          </h2>
          <p>
            We may suspend or terminate your access to the Service at any time,
            with or without cause. Upon termination, your right to use the
            Service ceases immediately. You may request deletion of your data
            upon termination.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            10. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of the State of Indiana, United
            States, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            11. Changes to These Terms
          </h2>
          <p>
            We reserve the right to modify these Terms at any time. We will
            notify you of material changes via email or an in-app notice.
            Continued use of the Service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">
            12. Contact
          </h2>
          <p>
            Questions about these Terms? Email us at{" "}
            <a
              href="mailto:kyle@flowview.dev"
              className="text-blue-400 hover:underline"
            >
              kyle@flowview.dev
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
