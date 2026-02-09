"use client";

import { useState } from "react";
import type { TraceEvent } from "@faultline/shared";

export function TimelineView({ events }: { events: TraceEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="mt-2 text-sm text-zinc-500">
        No events yet. Analysis may still be running.
      </p>
    );
  }

  return (
    <ul className="mt-2 space-y-2">
      {events.map((event, i) => (
        <TimelineEventRow key={i} event={event} stepId={`Step ${i + 1}`} />
      ))}
    </ul>
  );
}

function TimelineEventRow({
  event,
  stepId,
}: {
  event: TraceEvent;
  stepId: string;
}) {
  const [open, setOpen] = useState(false);
  const ts =
    typeof event.timestamp === "number"
      ? new Date(event.timestamp).toISOString()
      : String(event.timestamp);
  const payload = "payload" in event ? event.payload : null;

  const id = stepId.replace(/\s/g, "-").toLowerCase();
  return (
    <li
      id={id}
      className="scroll-mt-4 rounded border border-zinc-700 bg-zinc-800/50 text-sm text-zinc-300"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 p-2 text-left hover:bg-zinc-700/50"
      >
        <span className="font-medium">{stepId}</span>
        <span className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs text-zinc-400">
          {event.type}
        </span>
        <span className="flex-1 text-right text-xs text-zinc-500">
          {new Date(ts).toLocaleTimeString()}
        </span>
        <span className="text-zinc-500">{open ? "▼" : "▶"}</span>
      </button>
      {open && payload && (
        <pre className="max-h-48 overflow-auto border-t border-zinc-700 p-2 text-xs text-zinc-400">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </li>
  );
}
