"use client";

export function ReportDownloadButton({ traceId }: { traceId: string }) {
  async function handleDownload() {
    const res = await fetch(`/api/runs/${traceId}/report`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faultline-report-${traceId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
    >
      Download report (JSON)
    </button>
  );
}
