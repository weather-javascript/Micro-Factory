// ════════════════════════════════════════════════════════════════════
//  components/PowerBar.tsx — 電力消費・蓄電量の視覚化バー
// ════════════════════════════════════════════════════════════════════

import React from "react";

interface PowerBarProps {
  used: number;
  max: number;
  batteryCharge: number;
  batteryMax: number;
  isNight?: boolean;
}

export const PowerBar: React.FC<PowerBarProps> = ({
  used, max, batteryCharge, batteryMax, isNight = false,
}) => {
  // 電力充足率（0〜1）
  const powerRatio = max <= 0 ? 0 : Math.min(1, used / max);
  // 蓄電率（0〜1）
  const battRatio = batteryMax <= 0 ? 0 : Math.min(1, batteryCharge / batteryMax);

  const isOverloaded = used > max;
  const isNearOverload = used / max > 0.85;

  const powerColor = isOverloaded
    ? "#FC8181"
    : isNearOverload
    ? "#FBD38D"
    : "#4ade80";

  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ background: "#1a1a24", border: "1px solid #22222e" }}
    >
      {/* 電力ライン */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold tracking-wider" style={{ color: "#555" }}>
          ⚡ 電力
        </span>
        <span
          className="text-[11px] font-bold tabular-nums"
          style={{ color: powerColor }}
        >
          {used}W / {max}W
          {isOverloaded && (
            <span className="ml-1 text-[10px]" style={{ color: "#FC8181" }}>
              電力不足！
            </span>
          )}
        </span>
      </div>

      {/* 電力バー */}
      <div
        className="w-full h-2 rounded-full overflow-hidden mb-2"
        style={{ background: "#252532" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, powerRatio * 100)}%`,
            background: isOverloaded
              ? "linear-gradient(90deg, #FC8181, #FCA5A5)"
              : `linear-gradient(90deg, ${powerColor}80, ${powerColor})`,
            boxShadow: `0 0 6px ${powerColor}60`,
          }}
        />
      </div>

      {/* 蓄電池ライン（蓄電池がある場合のみ） */}
      {batteryMax > 0 && (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold tracking-wider" style={{ color: "#555" }}>
              🔋 蓄電池
            </span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: "#a78bfa" }}>
              {Math.floor(batteryCharge)}Wh / {batteryMax}Wh
              <span className="ml-1 text-[10px]" style={{ color: "#a78bfa80" }}>
                {isNight ? "（放電中）" : "（充電中）"}
              </span>
            </span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "#252532" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${battRatio * 100}%`,
                background: "linear-gradient(90deg, #6d28d9, #a78bfa)",
                boxShadow: battRatio > 0 ? "0 0 4px #a78bfa60" : "none",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};
