// ════════════════════════════════════════════════════════════════════
//  components/ResourceBadge.tsx
// ════════════════════════════════════════════════════════════════════
import React from "react";
import { fmt } from "../utils/gameLogic";

interface Props {
  icon: React.ReactNode;
  value: number;
  label: string;
  perSec?: number;
  color: string;
}

export const ResourceBadge: React.FC<Props> = ({ icon, value, label, perSec, color }) => (
  <div
    className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
    style={{
      background: "#1a1a24",
      border: `1px solid ${color}30`,
      boxShadow: `inset 0 0 12px ${color}08`,
    }}
  >
    <span style={{ color }}>{icon}</span>
    <div className="flex flex-col min-w-0">
      <div className="flex items-baseline gap-1">
        <span
          className="text-lg font-bold tabular-nums leading-none"
          style={{ color, fontFamily: "'Courier New', monospace" }}
        >
          {fmt(value)}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[10px] font-medium" style={{ color: `${color}80` }}>{label}</span>
        {perSec !== undefined && perSec > 0 && (
          <span className="text-[10px] tabular-nums" style={{ color: `${color}60` }}>
            +{perSec}/s
          </span>
        )}
      </div>
    </div>
  </div>
);
