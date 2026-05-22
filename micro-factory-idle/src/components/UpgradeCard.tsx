// ════════════════════════════════════════════════════════════════════
//  components/UpgradeCard.tsx — 研究タブのアップグレードカード
// ════════════════════════════════════════════════════════════════════

import type React from "react";

import type { UpgradeCost } from "../types";
import { CoinIcon, StoneIcon, IronIcon } from "./Icons";
import { fmt } from "../utils/gameLogic";

interface Props {
  title: string;
  description: string;
  cost: UpgradeCost;
  purchased: boolean;
  canAfford: boolean;
  onBuy: () => void;
  icon: React.ReactNode;
  accent: string;
}

export const UpgradeCard: React.FC<Props> = ({
  title, description, cost, purchased, canAfford, onBuy, icon, accent,
}) => (
  <div
    className="flex items-center gap-3 rounded-xl p-3 transition-all duration-200"
    style={{
      background: purchased ? `${accent}12` : "#20202a",
      border:     `1.5px solid ${purchased ? accent + "60" : "#2e2e3a"}`,
    }}
  >
    {/* アイコン */}
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
    >
      <div style={{ color: accent }}>{icon}</div>
    </div>

    {/* テキスト */}
    <div className="flex-1 min-w-0">
      <div
        className="font-bold text-sm"
        style={{ color: purchased ? accent : "#ccc" }}
      >
        {title}
      </div>
      <div className="text-[11px] mt-0.5 leading-snug" style={{ color: "#555" }}>
        {description}
      </div>

      {/* 複合コスト表示 */}
      {!purchased && (
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className="flex items-center gap-0.5 text-[10px] font-bold"
            style={{ color: canAfford ? "#F5C842" : "#444" }}
          >
            <CoinIcon className="w-3 h-3" />{fmt(cost.money)}
          </span>
          {cost.stone !== undefined && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold"
              style={{ color: canAfford ? "#A0AFBF" : "#444" }}
            >
              <StoneIcon className="w-3 h-3" />{cost.stone}
            </span>
          )}
          {cost.iron !== undefined && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold"
              style={{ color: canAfford ? "#7BAEC8" : "#444" }}
            >
              <IronIcon className="w-3 h-3" />{cost.iron}
            </span>
          )}
        </div>
      )}
    </div>

    {/* ボタン or 習得済バッジ */}
    {purchased ? (
      <span
        className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
        style={{ background: `${accent}22`, color: accent }}
      >
        習得済
      </span>
    ) : (
      <button
        onClick={onBuy}
        disabled={!canAfford}
        className="text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        style={{
          background: canAfford ? `${accent}22` : "#1a1a22",
          border:     `1px solid ${canAfford ? accent : "#333"}`,
          color:      canAfford ? accent : "#444",
        }}
      >
        研究
      </button>
    )}
  </div>
);