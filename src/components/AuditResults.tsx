"use client";

interface Finding {
  id: string;
  rule_id: string;
  severity: string;
  category: string;
  title: string;
  explanation: string;
  affected_nodes: string[];
  affected_contacts: string[];
  created_at: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  error: { bg: "bg-red-900/30 border-red-800", text: "text-red-400", label: "Error" },
  warning: { bg: "bg-yellow-900/30 border-yellow-800", text: "text-yellow-400", label: "Warning" },
  info: { bg: "bg-blue-900/30 border-blue-800", text: "text-blue-400", label: "Info" },
};

const CATEGORY_LABELS: Record<string, string> = {
  "tag-hygiene": "Tag Hygiene",
  "webhook-reliability": "Webhook Reliability",
  "flow-integrity": "Flow Integrity",
  "contact-health": "Contact Health",
  "identity-fragmentation": "Identity Fragmentation",
  "subscription-risk": "Subscription Risk",
  "automation-gaps": "Automation Gaps",
  "data-quality": "Data Quality",
};

export function AuditResults({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
        <p className="text-sm text-zinc-400">
          No findings yet. Connect your tools and run an audit.
        </p>
      </div>
    );
  }

  // Group by severity
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const infos = findings.filter((f) => f.severity === "info");

  const groups = [
    { label: "Errors", findings: errors, severity: "error" },
    { label: "Warnings", findings: warnings, severity: "warning" },
    { label: "Info", findings: infos, severity: "info" },
  ].filter((g) => g.findings.length > 0);

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex gap-4">
        {errors.length > 0 && (
          <span className="rounded-full bg-red-900/50 px-3 py-1 text-xs font-medium text-red-400">
            {errors.length} error{errors.length !== 1 ? "s" : ""}
          </span>
        )}
        {warnings.length > 0 && (
          <span className="rounded-full bg-yellow-900/50 px-3 py-1 text-xs font-medium text-yellow-400">
            {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
          </span>
        )}
        {infos.length > 0 && (
          <span className="rounded-full bg-blue-900/50 px-3 py-1 text-xs font-medium text-blue-400">
            {infos.length} info
          </span>
        )}
      </div>

      {/* Findings by severity */}
      {groups.map((group) => (
        <div key={group.severity}>
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            {group.label}
          </h3>
          <div className="space-y-3">
            {group.findings.map((finding) => {
              const style = SEVERITY_STYLES[finding.severity] ?? SEVERITY_STYLES.info;
              return (
                <div
                  key={finding.id}
                  className={`rounded-lg border p-4 ${style.bg}`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`text-xs font-medium uppercase ${style.text}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {CATEGORY_LABELS[finding.category] ?? finding.category}
                    </span>
                  </div>
                  <h4 className="mb-1 text-sm font-medium text-white">
                    {finding.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-zinc-400">
                    {finding.explanation}
                  </p>
                  {(finding.affected_nodes.length > 0 ||
                    finding.affected_contacts.length > 0) && (
                    <p className="mt-2 text-xs text-zinc-500">
                      {finding.affected_nodes.length > 0 &&
                        `${finding.affected_nodes.length} node(s) affected`}
                      {finding.affected_nodes.length > 0 &&
                        finding.affected_contacts.length > 0 &&
                        " · "}
                      {finding.affected_contacts.length > 0 &&
                        `${finding.affected_contacts.length} contact(s) affected`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
