// ════════════════════════════════════════════════════════════════════
//  components/PowerBar.tsx — 電力・蓄電池の視覚化
// ════════════════════════════════════════════════════════════════════
import React from "react";

interface Props {
  used:          number;
  generated:     number; // ソーラー+蒸気の合計
  batteryCharge: number;
  batteryMax:    number;
  isNight:       boolean;
}

export const PowerBar: React.FC<Props> = ({
  used, generated, batteryCharge, batteryMax, isNight,
}) => {
  const isOver   = used > generated + batteryCharge;
  const isWarn   = used / Math.max(generated, 1) > 0.85;
  const powerColor = isOver ? "#FC8181" : isWarn ? "#FBD38D" : "#4ade80";
  const ratio    = generated <= 0 ? 0 : Math.min(1, used / generated);
  const battRatio = batteryMax <= 0 ? 0 : Math.min(1, batteryCharge / batteryMax);

  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ background: "#1a1a24", border: "1px solid #22222e" }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold tracking-wider" style={{ color: "#555" }}>⚡ 電力</span>
        <span className="text-[11px] font-bold tabular-nums" style={{ color: powerColor }}>
          {used}W / {generated}W
          {isOver && <span className="ml-1 text-[10px]" style={{ color: "#FC8181" }}>電力不足！</span>}
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: "#252532" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, ratio * 100)}%`,
            background: `linear-gradient(90deg, ${powerColor}80, ${powerColor})`,
            boxShadow: `0 0 6px ${powerColor}60`,
          }}
        />
      </div>
      {batteryMax > 0 && (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold tracking-wider" style={{ color: "#555" }}>🔋 蓄電池</span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: "#a78bfa" }}>
              {Math.floor(batteryCharge)}Wh / {batteryMax}Wh
              <span className="ml-1 text-[10px]" style={{ color: "#a78bfa80" }}>
                {isNight ? "（放電中）" : "（充電中）"}
              </span>
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#252532" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${battRatio * 100}%`,
                background: "linear-gradient(90deg, #6d28d9, #a78bfa)",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};
