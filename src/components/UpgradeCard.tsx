// ════════════════════════════════════════════════════════════════════
//  components/UpgradeCard.tsx
// ════════════════════════════════════════════════════════════════════
import React from "react";
import type { ResearchRequirement } from "../types";

interface Props {
  title:       string;
  description: string;
  cost:        ResearchRequirement;
  purchased:   boolean;
  canAfford:   boolean;
  onBuy:       () => void;
  icon:        React.ReactNode;
  accent:      string;
  locked?:     boolean;
  lockReason?: string;
  currentMoney?: number;
  currentStone?: number;
  currentIron?:  number;
  currentGear?:  number;
}

export const UpgradeCard: React.FC<Props> = ({
  title, description, cost, purchased, canAfford, onBuy,
  icon, accent, locked = false, lockReason,
  currentMoney = 0, currentStone = 0, currentIron = 0, currentGear = 0,
}) => {
  const isDisabled = purchased || !canAfford || locked;
  return (
    <div
      className="rounded-xl px-3 py-3 transition-all duration-200"
      style={{
        background: purchased ? `${accent}10` : locked ? "#111118" : "#1a1a24",
        border:    `1px solid ${purchased ? accent + "60" : locked ? "#1e1e28" : "#252535"}`,
        opacity:    locked ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: purchased ? `${accent}20` : "#13131c",
            border:    `1px solid ${purchased ? accent + "50" : "#1e1e2a"}`,
            color:      purchased ? accent : locked ? "#333" : accent + "80",
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: purchased ? accent : locked ? "#444" : "#ccc" }}>
              {title}
            </span>
            {purchased && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${accent}20`, color: accent }}>
                ✓ 完了
              </span>
            )}
            {locked && lockReason && (
              <span className="text-[10px]" style={{ color: "#555" }}>🔒 {lockReason}</span>
            )}
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "#555" }}>{description}</p>
          {!purchased && !locked && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Chip label={`${cost.money}¥`}    met={currentMoney >= cost.money} accent="#F5C842" />
              {cost.stone && <Chip label={`石×${cost.stone}`}   met={currentStone >= cost.stone}    accent="#A0AFBF" />}
              {cost.iron  && <Chip label={`鉄×${cost.iron}`}    met={currentIron  >= cost.iron}     accent="#63B3ED" />}
              {cost.gear  && <Chip label={`歯車出荷×${cost.gear}`} met={currentGear  >= cost.gear}  accent="#e0c070" />}
            </div>
          )}
        </div>
      </div>
      {!purchased && !locked && (
        <button
          onClick={onBuy}
          disabled={isDisabled}
          className="w-full mt-3 py-2 rounded-lg text-sm font-bold transition-all duration-150"
          style={{
            background: canAfford ? `${accent}20` : "#13131c",
            border:    `1px solid ${canAfford ? accent : "#2a2a38"}`,
            color:      canAfford ? accent : "#333",
            cursor:     canAfford ? "pointer" : "not-allowed",
          }}
        >
          {canAfford ? "研究する" : "素材不足"}
        </button>
      )}
    </div>
  );
};

const Chip: React.FC<{ label: string; met: boolean; accent: string }> = ({ label, met, accent }) => (
  <span
    className="text-[10px] px-1.5 py-0.5 rounded font-medium"
    style={{
      background: met ? `${accent}15` : "#1a1a24",
      border:    `1px solid ${met ? accent + "50" : "#252535"}`,
      color:      met ? accent : "#444",
    }}
  >
    {met ? "✓ " : ""}{label}
  </span>
);
