// ════════════════════════════════════════════════════════════════════
//  components/ShopBtn.tsx — ショップの施設選択ボタン
// ════════════════════════════════════════════════════════════════════


import type React from "react";
import { CoinIcon } from "./Icons";

interface Props {
  /** 識別用キー */
  item: string;
  label: string;
  /** 購入コスト（nullなら無料表示） */
  cost: number | null;
  icon: React.ReactNode;
  accent: string;
  selected: boolean;
  canAfford: boolean;
  onSelect: () => void;
  /** ボタン下部の補足テキスト */
  sublabel?: string;
}

export const ShopBtn: React.FC<Props> = ({
  label, cost, icon, accent, selected, canAfford, onSelect, sublabel,
}) => (
  <button
    onClick={onSelect}
    className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95"
    style={{
      background: selected ? `${accent}28` : "#20202a",
      border:     `1.5px solid ${selected ? accent : "#2e2e3a"}`,
      color:      canAfford ? accent : "#444",
      boxShadow:  selected ? `0 0 14px ${accent}38` : "none",
    }}
  >
    {icon}
    <span style={{ fontSize: "10px", lineHeight: 1.2 }}>{label}</span>
    {sublabel && (
      <span style={{ fontSize: "9px", color: "#555" }}>{sublabel}</span>
    )}
    {cost !== null ? (
      <span className="flex items-center gap-0.5" style={{ color: canAfford ? "#F5C842" : "#444" }}>
        <CoinIcon className="w-3 h-3" />
        {cost}
      </span>
    ) : (
      <span style={{ fontSize: "9px", color: "#FC8181" }}>無料</span>
    )}
  </button>
);