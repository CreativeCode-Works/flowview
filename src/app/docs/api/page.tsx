export const metadata = {
  title: "API Documentation — FlowView",
};

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold text-white">
        FlowView API Documentation
      </h1>
      <p className="mb-12 text-zinc-400">
        Use the FlowView API to integrate with your automation workflows.
      </p>

      {/* Authentication */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Authentication
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          All API requests require an API key. Find your key in the FlowView
          dashboard under <strong>Settings</strong>.
        </p>
        <p className="mb-2 text-sm text-zinc-400">
          Include your API key as a query parameter or header:
        </p>
        <pre className="mb-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
{`# As query parameter
GET https://flowview.dev/api/zapier/auth?api_key=YOUR_API_KEY

# As header
GET https://flowview.dev/api/zapier/auth
X-API-Key: YOUR_API_KEY`}
        </pre>
      </section>

      {/* Endpoints */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-white">Endpoints</h2>

        {/* Auth */}
        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              GET
            </span>
            <code className="text-sm text-white">/api/zapier/auth</code>
          </div>
          <p className="mb-3 text-sm text-zinc-400">
            Verify your API key and return account information.
          </p>
          <p className="mb-1 text-xs font-medium text-zinc-500">Response</p>
          <pre className="overflow-x-auto rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
{`{
  "id": "account-uuid",
  "name": "kyle@creativecode.works"
}`}
          </pre>
        </div>

        {/* Trigger */}
        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              GET
            </span>
            <code className="text-sm text-white">
              /api/zapier/triggers/new-finding
            </code>
          </div>
          <p className="mb-3 text-sm text-zinc-400">
            Returns the latest audit findings. Used by Zapier as a polling
            trigger.
          </p>
          <p className="mb-1 text-xs font-medium text-zinc-500">Response</p>
          <pre className="overflow-x-auto rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
{`[
  {
    "id": "finding-uuid",
    "rule_id": "inactive-automations",
    "severity": "warning",
    "category": "automation-gaps",
    "title": "Inactive automation has incoming connections",
    "explanation": "...",
    "created_at": "2026-04-19T20:00:00Z"
  }
]`}
          </pre>
        </div>

        {/* Action */}
        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-blue-900/50 px-2 py-0.5 text-xs font-mono font-medium text-blue-400">
              POST
            </span>
            <code className="text-sm text-white">
              /api/zapier/actions/log-event
            </code>
          </div>
          <p className="mb-3 text-sm text-zinc-400">
            Log an event from a Zap run. Used to track contact journeys across
            your automation stack.
          </p>
          <p className="mb-1 text-xs font-medium text-zinc-500">Request Body</p>
          <pre className="mb-3 overflow-x-auto rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
{`{
  "email": "contact@example.com",
  "event_type": "new_lead",
  "zap_name": "New Typeform → ActiveCampaign",
  "zap_reference": "abc-123",
  "description": "New lead captured from landing page"
}`}
          </pre>
          <p className="mb-1 text-xs font-medium text-zinc-500">Response</p>
          <pre className="overflow-x-auto rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
{`{
  "success": true,
  "contact_id": "contact-uuid",
  "message": "Event logged successfully"
}`}
          </pre>
        </div>
      </section>

      {/* Zapier Integration */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Zapier Integration
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          FlowView is available as a Zapier integration. Search for
          &quot;FlowView&quot; in the Zapier app directory to:
        </p>
        <ul className="list-inside list-disc space-y-2 text-sm text-zinc-400">
          <li>
            <strong>Trigger:</strong> Get notified when FlowView finds a new
            audit issue in your stack
          </li>
          <li>
            <strong>Action:</strong> Log Zap run events to FlowView for
            contact journey tracking
          </li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 pt-8">
        <p className="text-xs text-zinc-600">
          FlowView API v1 &mdash; Questions? Contact kyle@flowview.dev
        </p>
      </footer>
    </div>
  );
}
