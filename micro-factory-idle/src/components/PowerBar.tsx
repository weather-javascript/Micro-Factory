// ════════════════════════════════════════════════════════════════════
//  components/PowerBar.tsx — 電力メーター + 蓄電池残量
// ════════════════════════════════════════════════════════════════════


import type React from "react";
import { LightningIcon, BatteryIcon } from "./Icons";
import { fmt } from "../utils/gameLogic";

interface Props {
  used: number;
  max: number;
  batteryCharge: number;
  batteryMax: number;
}

export const PowerBar: React.FC<Props> = ({ used, max, batteryCharge, batteryMax }) => {
  const pct      = max === 0 ? 0 : Math.min(100, (used / max) * 100);
  const overload = used > max && max > 0;
  const barColor = overload ? "#FC8181" : pct > 75 ? "#FBBF24" : "#4ade80";
  const battPct  = batteryMax === 0 ? 0 : Math.min(100, (batteryCharge / batteryMax) * 100);

  return (
    <div
      className="flex flex-col gap-1.5 rounded-xl px-3 py-2"
      style={{
        background: "#20202a",
        border: `1px solid ${overload ? "#FC818144" : "#4ade8020"}`,
      }}
    >
      {/* 電力メーター */}
      <div className="flex items-center gap-2">
        <LightningIcon className="w-4 h-4 shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-[10px] mb-1">
            <span
              className="font-bold tracking-widest uppercase"
              style={{ color: overload ? "#FC8181" : "#4ade80" }}
            >
              電力{overload ? " ⚠ 不足" : ""}
            </span>
            <span style={{ color: barColor }}>
              {used}W / {max}W
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: "#2a2a36" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: barColor,
                boxShadow: `0 0 6px ${barColor}88`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 蓄電池残量（蓄電池が1台以上あるとき表示） */}
      {batteryMax > 0 && (
        <div className="flex items-center gap-2">
          <BatteryIcon className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="font-bold tracking-widest uppercase" style={{ color: "#7c3aed" }}>
                蓄電池
              </span>
              <span style={{ color: "#a78bfa" }}>
                {fmt(batteryCharge)} / {fmt(batteryMax)} Wh
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: "#2a2a36" }}>
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{
                  width: `${battPct}%`,
                  background: "#7c3aed",
                  boxShadow: "0 0 6px #7c3aed88",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};