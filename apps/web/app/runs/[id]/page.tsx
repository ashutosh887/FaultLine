export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-100">Run {id}</h1>
      <p className="mt-2 text-zinc-500">
        Timeline, evidence panel, causal graph, and verdict pack will go here.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-medium text-zinc-400">Timeline</h2>
        </section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="text-sm font-medium text-zinc-400">Causal graph</h2>
        </section>
      </div>
      <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-sm font-medium text-zinc-400">Verdict pack</h2>
      </section>
    </main>
  );
}
