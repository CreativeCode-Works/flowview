import { WaitlistForm } from "@/components/WaitlistForm";

const PAIN_POINTS = [
  {
    title: "See the full picture",
    description:
      "Your automations span ActiveCampaign, Zapier, and Stripe. FlowView maps them into one visual flow so you can finally see how everything connects.",
  },
  {
    title: "Find what's broken",
    description:
      "Silent webhook failures, tag conflicts, contacts stuck in limbo. FlowView audits your stack for 20+ failure modes that silently cost revenue.",
  },
  {
    title: "Replay any contact's journey",
    description:
      "Pick any contact and see exactly what happened to them — every automation, every tag, every charge — across your entire stack, on one timeline.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-blue-400">
          Automation Observability
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          See every automation in your stack.{" "}
          <span className="text-zinc-400">
            Find what&apos;s broken before your customers do.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
          FlowView connects to your martech tools, maps your entire automation
          stack into one visual flow, and audits it for the failures that
          silently cost you customers and revenue.
        </p>

        {/* Email capture */}
        <div className="relative mt-10 w-full max-w-md">
          <WaitlistForm />
        </div>

        <p className="mt-4 text-xs text-zinc-600">
          Free audit report for early access members. No credit card required.
        </p>
      </section>

      {/* Pain points */}
      <section className="border-t border-zinc-800 px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-3">
          {PAIN_POINTS.map((point) => (
            <div key={point.title}>
              <h3 className="mb-3 text-lg font-semibold text-white">
                {point.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <p className="text-center text-xs text-zinc-600">
          FlowView &mdash; Automation observability for service businesses.
        </p>
      </footer>
    </div>
  );
}
