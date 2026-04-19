export const metadata = {
  title: "Audit — FlowView",
};

export default function AuditPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Audit</h1>
      <p className="text-sm text-zinc-400">
        Run an audit to scan your automation stack for broken flows, tag
        conflicts, webhook failures, and other issues.
      </p>
    </div>
  );
}
