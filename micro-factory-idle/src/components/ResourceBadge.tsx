// ════════════════════════════════════════════════════════════════════
//  components/ResourceBadge.tsx — リソース表示バッジ
// ════════════════════════════════════════════════════════════════════


import type React from "react";
import { fmt } from "../utils/gameLogic";

interface Props {
  icon: React.ReactNode;
  value: number;
  label: string;
  /** 毎秒の自動生産量（0またはundefinedなら非表示） */
  perSec?: number;
  color: string;
}

export const ResourceBadge: React.FC<Props> = ({ icon, value, label, perSec, color }) => (
  <div
    className="flex flex-col items-center justify-center rounded-xl p-2 gap-0.5 flex-1 min-w-0"
    style={{ background: "#20202a", border: `1px solid ${color}28` }}
  >
    <div style={{ color }}>{icon}</div>
    <span
      className="text-[10px] font-bold tracking-widest uppercase"
      style={{ color: "#555" }}
    >
      {label}
    </span>
    <span
      className="text-lg font-bold tabular-nums leading-none"
      style={{ color }}
    >
      {fmt(value)}
    </span>
    {perSec !== undefined && perSec > 0 && (
      <span className="text-[10px]" style={{ color: "#444" }}>
        +{perSec}/s
      </span>
    )}
  </div>
);