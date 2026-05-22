// ════════════════════════════════════════════════════════════════════
//  components/TileCell.tsx — グリッドの1マスを描画するコンポーネント
//  ベルト上を流れるアイテムのアニメーションも担当。
// ════════════════════════════════════════════════════════════════════

import React from "react";
import type { Tile, ShopItem } from "../types";
import { TILE_COLORS, DIRECTION_ARROWS } from "../constants";

interface TileCellProps {
  tile: Tile;
  selectedShop: ShopItem | null;
  onTileClick: (row: number, col: number) => void;
  row: number;
  col: number;
  powerOk: boolean;
}

/** ベルトアイテムの色 */
const ITEM_COLORS: Record<string, string> = {
  stone: "#A0AFBF",
  iron:  "#63B3ED",
  gear:  "#e0c070",
};

/** ベルトアイテムの絵文字 */
const ITEM_EMOJIS: Record<string, string> = {
  stone: "◆",
  iron:  "▲",
  gear:  "⚙",
};

export const TileCell: React.FC<TileCellProps> = ({
  tile, selectedShop, onTileClick, row, col, powerOk,
}) => {
  const { kind, direction, beltItem, depositRemaining } = tile;
  const colors = TILE_COLORS[kind];

  // ─── クリック可否の判定 ───────────────────────────────────────────
  const isClickable = selectedShop !== null && kind !== "hub";

  // ─── ハイライト（選択中ショップのターゲット） ────────────────────────
  const isTarget =
    selectedShop === "demolish"
      ? !["empty", "stone_deposit", "iron_deposit", "hub"].includes(kind)
      : selectedShop === "stone_drill"
      ? kind === "stone_deposit"
      : selectedShop === "iron_drill"
      ? kind === "iron_deposit"
      : selectedShop === "belt" || selectedShop === "solar" ||
        selectedShop === "battery" || selectedShop === "assembler" ||
        selectedShop === "rocket_silo"
      ? kind === "empty"
      : false;

  // ─── ハブタイルの特別描画 ─────────────────────────────────────────
  if (kind === "hub") {
    return (
      <div
        className="relative rounded-xl overflow-hidden flex items-center justify-center"
        style={{
          aspectRatio: "1",
          background: "radial-gradient(circle at 40% 40%, #5a1848, #2a0820)",
          border: "2px solid #9a2060",
          boxShadow: "0 0 12px #9a206050, inset 0 0 8px #c0308030",
        }}
      >
        <div className="flex flex-col items-center">
          <div className="text-[10px] font-black tracking-widest" style={{ color: "#e050a0" }}>
            HUB
          </div>
          <div className="text-[7px]" style={{ color: "#c0306060" }}>
            出荷ポート
          </div>
        </div>
        {/* パルスリング */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            border: "1px solid #e050a040",
            animation: "hubPulse 2s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  // ─── ベルトアイテムの位置計算 ─────────────────────────────────────
  // progress 0.0〜1.0 をタイル内の相対座標に変換
  const getItemPosition = () => {
    if (!beltItem) return null;
    const p = beltItem.progress;
    // 方向によってアイテムが流れる軸を決定
    switch (direction) {
      case "right": return { left: `${10 + p * 70}%`, top: "50%", transform: "translate(-50%,-50%)" };
      case "left":  return { left: `${80 - p * 70}%`, top: "50%", transform: "translate(-50%,-50%)" };
      case "down":  return { top: `${10 + p * 70}%`, left: "50%", transform: "translate(-50%,-50%)" };
      case "up":    return { top: `${80 - p * 70}%`, left: "50%", transform: "translate(-50%,-50%)" };
    }
  };

  const itemPos = getItemPosition();

  // ─── 鉱床の残量インジケーター ─────────────────────────────────────
  const showDepositBar = (kind === "stone_deposit" || kind === "iron_deposit") && depositRemaining > 0;
  const maxDeposit = kind === "stone_deposit" ? 500 : 300;
  const depositRatio = depositRemaining / maxDeposit;

  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer select-none"
      style={{
        aspectRatio: "1",
        background: colors.bg,
        border: `1px solid ${isTarget ? colors.border + "ff" : colors.border}`,
        boxShadow: isTarget
          ? `0 0 8px ${colors.border}80, inset 0 0 4px ${colors.border}40`
          : kind === "belt" && beltItem
          ? `inset 0 0 4px ${ITEM_COLORS[beltItem.kind]}30`
          : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
        opacity: kind === "stone_deposit" && depositRemaining <= 0 ? 0.4 : 1,
      }}
      onClick={() => onTileClick(row, col)}
    >
      {/* ── ラベル ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-0.5"
        style={{ pointerEvents: "none" }}
      >
        {/* メインラベル */}
        {kind !== "belt" && (
          <span
            className="text-[10px] font-bold leading-none"
            style={{ color: `${colors.border}cc` }}
          >
            {kind === "stone_drill" ? "⛏石"
             : kind === "iron_drill" ? "⛏鉄"
             : kind === "solar" ? "☀"
             : kind === "battery" ? "🔋"
             : kind === "assembler" ? "⚙"
             : kind === "stone_deposit" ? "◇石"
             : kind === "iron_deposit" ? "△鉄"
             : kind === "rocket_silo" ? "🚀"
             : ""}
          </span>
        )}

        {/* ベルトの向き矢印 */}
        {kind === "belt" && (
          <span
            className="text-base font-bold leading-none"
            style={{ color: `${colors.border}cc` }}
          >
            {DIRECTION_ARROWS[direction]}
          </span>
        )}

        {/* ドリル・組立機の向き表示 */}
        {(kind === "stone_drill" || kind === "iron_drill" || kind === "assembler") && (
          <span
            className="text-[8px] leading-none"
            style={{ color: `${colors.border}80` }}
          >
            {DIRECTION_ARROWS[direction]}
          </span>
        )}

        {/* 電力不足インジケーター */}
        {!powerOk && (kind === "stone_drill" || kind === "iron_drill" || kind === "assembler") && (
          <span className="text-[7px]" style={{ color: "#FC8181" }}>低電</span>
        )}
      </div>

      {/* ── ベルトアイテム（実体） ── */}
      {kind === "belt" && beltItem && itemPos && (
        <div
          className="absolute w-3 h-3 rounded-full flex items-center justify-center"
          style={{
            ...itemPos,
            position: "absolute",
            fontSize: "8px",
            color: ITEM_COLORS[beltItem.kind],
            background: `${ITEM_COLORS[beltItem.kind]}25`,
            border: `1px solid ${ITEM_COLORS[beltItem.kind]}80`,
            boxShadow: `0 0 4px ${ITEM_COLORS[beltItem.kind]}60`,
            zIndex: 2,
            width: "12px",
            height: "12px",
            lineHeight: "12px",
            textAlign: "center",
          }}
        >
          {ITEM_EMOJIS[beltItem.kind]}
        </div>
      )}

      {/* ── 鉱床残量バー ── */}
      {showDepositBar && (
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: "#ffffff10" }}
        >
          <div
            className="h-full"
            style={{
              width: `${depositRatio * 100}%`,
              background: kind === "stone_deposit" ? "#A0AFBF" : "#63B3ED",
              transition: "width 0.5s linear",
            }}
          />
        </div>
      )}

      {/* ── ターゲットハイライト（点滅） ── */}
      {isTarget && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            border: `2px solid ${colors.border}`,
            animation: "targetPulse 1s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};
