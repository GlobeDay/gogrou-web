"use client";

export function LabelPrint(props: {
  dm: string;
  qid: string;
  name: string;
  manufacturer: string;
  gid: string;
  diameter?: number;
  date?: string;
  marked: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="border border-foreground p-4 space-y-1 text-sm">
        <div className="text-2xs uppercase tracking-label">Štítek nástroje</div>
        <div className="text-lg font-bold">{props.name}</div>
        <div>{props.manufacturer}</div>
        <div className="font-mono text-xs">GID {props.gid}</div>
        <div className="font-mono">DM {props.dm}</div>
        <div className="font-mono">QID {props.qid}</div>
        {props.diameter != null && <div>D {props.diameter} mm</div>}
        {props.date && <div>Servis {props.date}</div>}
        <div>{props.marked ? "Fyzicky označené" : "Bez fyzického značení"}</div>
      </div>
      <div className="flex gap-2 print:hidden">
        <button type="button" className="text-sm underline" onClick={() => window.print()}>Tisk štítku</button>
        <button
          type="button"
          className="text-sm underline"
          onClick={() => navigator.clipboard.writeText(`${props.qid} ${props.dm} ${props.name}`)}
        >
          Kopírovat štítek
        </button>
      </div>
    </div>
  );
}
