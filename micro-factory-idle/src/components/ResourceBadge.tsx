// ════════════════════════════════════════════════════════════════════
//  components/ResourceBadge.tsx — リソース・お金・時間帯の表示バッジ
// ════════════════════════════════════════════════════════════════════

import React from "react";
import { fmt } from "../utils/gameLogic";

interface ResourceBadgeProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  perSec?: number;
  color: string;
  maxValue?: number;   // 在庫上限（省略時は表示なし）
}

export const ResourceBadge: React.FC<ResourceBadgeProps> = ({
  icon, value, label, perSec, color, maxValue,
}) => {
  return (
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
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-lg font-bold tabular-nums leading-none"
            style={{ color, fontFamily: "'Courier New', monospace" }}
          >
            {fmt(value)}
          </span>
          {maxValue !== undefined && (
            <span className="text-[10px]" style={{ color: `${color}60` }}>
              /{fmt(maxValue)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-medium" style={{ color: `${color}80` }}>
            {label}
          </span>
          {perSec !== undefined && perSec > 0 && (
            <span
              className="text-[10px] tabular-nums"
              style={{ color: `${color}60` }}
            >
              +{perSec}/s
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
