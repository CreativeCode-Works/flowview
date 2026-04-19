export const metadata = {
  title: "Flow Graph — FlowView",
};

export default function GraphPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Flow Graph</h1>
      <p className="text-sm text-zinc-400">
        Your unified automation flow graph will appear here once you&apos;ve
        connected at least one tool and run a sync.
      </p>
    </div>
  );
}
