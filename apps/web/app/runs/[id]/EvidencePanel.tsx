"use client";

import Image from "next/image";
import { useState } from "react";
import type { EvidenceLink } from "@faultline/shared";

function ArtifactViewer({
  artifactKey,
  traceId,
}: {
  artifactKey: string;
  traceId: string;
}) {
  const [contentType, setContentType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = `/api/artifacts/${artifactKey}?trace_id=${encodeURIComponent(traceId)}`;

  const load = () => {
    setError(null);
    setContentType(null);
    fetch(url, { method: "GET" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        setContentType(
          r.headers.get("Content-Type") ?? "application/octet-stream",
        );
      })
      .catch(() => setError("Could not load artifact"));
  };

  if (error) {
    return (
      <p className="text-sm text-red-400">
        {error}{" "}
        <a href={url} target="_blank" rel="noreferrer" className="underline">
          Open in new tab
        </a>
      </p>
    );
  }

  if (!contentType) {
    return (
      <button
        type="button"
        onClick={load}
        className="text-sm text-amber-400 hover:text-amber-300 underline"
      >
        View artifact
      </button>
    );
  }

  const isImage = contentType.startsWith("image/");
  const isAudio = contentType.startsWith("audio/");
  const isHtml = contentType.includes("text/html");

  return (
    <div className="mt-2 rounded border border-zinc-700 bg-zinc-900/80 p-2">
      {isImage && (
        <Image
          src={url}
          alt="Evidence artifact"
          width={400}
          height={256}
          className="max-h-64 max-w-full object-contain"
          unoptimized
        />
      )}
      {isAudio && (
        <audio src={url} controls className="max-w-full">
          <a href={url} download>
            Download audio
          </a>
        </audio>
      )}
      {isHtml && (
        <iframe
          src={url}
          title="Evidence artifact"
          className="h-64 w-full rounded border border-zinc-700"
          sandbox="allow-same-origin"
        />
      )}
      {!isImage && !isAudio && !isHtml && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-amber-400 hover:text-amber-300 underline"
        >
          Open artifact ({contentType})
        </a>
      )}
    </div>
  );
}

export function EvidencePanel({
  evidenceLinks,
  traceId,
}: {
  evidenceLinks: EvidenceLink[];
  traceId: string;
}) {
  const withArtifact = evidenceLinks.filter((e) => e.artifact_key);

  if (withArtifact.length === 0) return null;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-sm font-medium text-zinc-400">Evidence panel</h2>
      <ul className="mt-2 space-y-3 text-sm text-zinc-300">
        {withArtifact.map((e, i) => (
          <li key={i} className="rounded border border-zinc-700/50 p-2">
            <span className="text-zinc-500">{e.step_id}</span>
            {e.snippet && (
              <span className="ml-2 text-zinc-400">— {e.snippet}</span>
            )}
            {e.artifact_key && (
              <div className="mt-1">
                <ArtifactViewer
                  artifactKey={e.artifact_key}
                  traceId={traceId}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
