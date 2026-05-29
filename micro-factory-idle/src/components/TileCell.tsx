// ════════════════════════════════════════════════════════════════════
//  components/TileCell.tsx — グリッドの1マスを描画するコンポーネント
//  ベルト上のアイテム移動アニメーション・モジュール表示・廃棄物対応。
// ════════════════════════════════════════════════════════════════════
import React from "react";
import type { Tile, ShopItem } from "../types";
import { TILE_COLORS, DIRECTION_ARROWS, ITEM_COLORS, ITEM_ICONS } from "../constants";

interface Props {
  tile:           Tile;
  selectedShop:   ShopItem | null;
  onTileClick:    (row: number, col: number) => void;
  row:            number;
  col:            number;
  powerOk:        boolean;
  onModuleClick?: (row: number, col: number) => void;
}

export const TileCell: React.FC<Props> = ({
  tile, selectedShop, onTileClick, row, col, powerOk,
}) => {
  const { kind, direction, beltItem, depositRemaining, module } = tile;
  const colors = TILE_COLORS[kind];

  // ── ハブタイル ───────────────────────────────────────────────────
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
          <div className="text-[10px] font-black tracking-widest" style={{ color: "#e050a0" }}>HUB</div>
          <div className="text-[7px]" style={{ color: "#c0306060" }}>出荷ポート</div>
        </div>
        <div className="absolute inset-0 rounded-xl" style={{ border: "1px solid #e050a040", animation: "hubPulse 2s ease-in-out infinite" }} />
      </div>
    );
  }

  // ── 水源タイル ───────────────────────────────────────────────────
  if (kind === "water_source") {
    return (
      <div
        className="relative rounded-lg overflow-hidden flex items-center justify-center"
        style={{
          aspectRatio: "1",
          background: "radial-gradient(circle, #0e2040, #071020)",
          border: "2px solid #1e5090",
          boxShadow: "0 0 8px #1e509050",
        }}
      >
        <div className="text-center">
          <div className="text-[10px]" style={{ color: "#60c0ff" }}>💧</div>
          <div className="text-[7px]" style={{ color: "#1e509080" }}>水源</div>
        </div>
      </div>
    );
  }

  // ── ターゲットハイライト判定 ─────────────────────────────────────
  const isTarget =
    selectedShop === "demolish"
      ? !["empty", "stone_deposit", "iron_deposit", "water_source", "hub"].includes(kind)
      : selectedShop === "stone_drill" ? kind === "stone_deposit"
      : selectedShop === "iron_drill"  ? kind === "iron_deposit"
      : (selectedShop === "module_speed" || selectedShop === "module_production")
        ? kind === "stone_drill" || kind === "iron_drill" || kind === "assembler"
      : ["belt","filter","solar","battery","assembler","water_pump","steam_engine","waste_disposal","rocket_silo"].includes(selectedShop ?? "")
        ? kind === "empty"
        : false;

  // ── ベルトアイテムの位置計算 ─────────────────────────────────────
  const getItemPos = () => {
    if (!beltItem) return null;
    const p = beltItem.progress;
    switch (direction) {
      case "right": return { left: `${10 + p * 70}%`, top: "50%",  transform: "translate(-50%,-50%)" };
      case "left":  return { left: `${80 - p * 70}%`, top: "50%",  transform: "translate(-50%,-50%)" };
      case "down":  return { top:  `${10 + p * 70}%`, left: "50%", transform: "translate(-50%,-50%)" };
      case "up":    return { top:  `${80 - p * 70}%`, left: "50%", transform: "translate(-50%,-50%)" };
    }
  };
  const itemPos = getItemPos();

  // ── 鉱床残量バー ─────────────────────────────────────────────────
  const showBar   = (kind === "stone_deposit" || kind === "iron_deposit") && depositRemaining > 0;
  const maxDep    = kind === "stone_deposit" ? 500 : 300;
  const depRatio  = depositRemaining / maxDep;

  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer select-none"
      style={{
        aspectRatio: "1",
        background: colors.bg,
        border: `1px solid ${isTarget ? colors.border + "ff" : colors.border}`,
        boxShadow: isTarget ? `0 0 8px ${colors.border}80` : "none",
        opacity: kind === "stone_deposit" && depositRemaining <= 0 ? 0.35 : 1,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onClick={() => onTileClick(row, col)}
    >
      {/* ── メインラベル ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5" style={{ pointerEvents: "none" }}>
        {kind !== "belt" && kind !== "filter" && (
          <span className="text-[10px] font-bold leading-none" style={{ color: `${colors.border}cc` }}>
            {kind === "stone_drill"    ? "⛏石"
             : kind === "iron_drill"  ? "⛏鉄"
             : kind === "solar"       ? "☀"
             : kind === "battery"     ? "🔋"
             : kind === "assembler"   ? "⚙"
             : kind === "water_pump"  ? "💧"
             : kind === "steam_engine"? "♨"
             : kind === "waste_disposal" ? "♻"
             : kind === "stone_deposit"  ? "◇石"
             : kind === "iron_deposit"   ? "△鉄"
             : kind === "rocket_silo"    ? "🚀"
             : ""}
          </span>
        )}

        {/* ベルト向き */}
        {(kind === "belt" || kind === "filter") && (
          <span className="text-sm font-bold leading-none" style={{ color: `${colors.border}cc` }}>
            {kind === "filter" ? "⇌" : DIRECTION_ARROWS[direction]}
          </span>
        )}

        {/* ドリル・組立機・ポンプの向き */}
        {(kind === "stone_drill" || kind === "iron_drill" || kind === "assembler" || kind === "water_pump") && (
          <span className="text-[8px] leading-none" style={{ color: `${colors.border}80` }}>
            {DIRECTION_ARROWS[direction]}
          </span>
        )}

        {/* モジュール表示バッジ */}
        {module && (
          <span
            className="text-[7px] px-0.5 rounded leading-none font-bold"
            style={{
              background: module === "speed" ? "#3a806020" : "#7a30a020",
              color:       module === "speed" ? "#60d0a0"   : "#c060f0",
              border:     `1px solid ${module === "speed" ? "#60d0a040" : "#c060f040"}`,
            }}
          >
            {module === "speed" ? "SPD" : "PRD"}
          </span>
        )}

        {/* 電力不足インジケーター */}
        {!powerOk && ["stone_drill","iron_drill","assembler","water_pump","waste_disposal"].includes(kind) && (
          <span className="text-[7px]" style={{ color: "#FC8181" }}>低電</span>
        )}
      </div>

      {/* ── ベルトアイテム（実体オブジェクト） ── */}
      {(kind === "belt" || kind === "filter") && beltItem && itemPos && (
        <div
          style={{
            position: "absolute",
            ...itemPos,
            fontSize: "8px",
            color: ITEM_COLORS[beltItem.kind],
            background: `${ITEM_COLORS[beltItem.kind]}25`,
            border: `1px solid ${ITEM_COLORS[beltItem.kind]}80`,
            boxShadow: beltItem.kind === "waste"
              ? "0 0 4px #80802020"
              : `0 0 4px ${ITEM_COLORS[beltItem.kind]}60`,
            zIndex: 2,
            width: "12px",
            height: "12px",
            lineHeight: "12px",
            textAlign: "center",
            borderRadius: "3px",
          }}
        >
          {ITEM_ICONS[beltItem.kind]}
        </div>
      )}

      {/* ── 鉱床残量バー ── */}
      {showBar && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "#ffffff10" }}>
          <div
            className="h-full"
            style={{
              width: `${depRatio * 100}%`,
              background: kind === "stone_deposit" ? "#A0AFBF" : "#63B3ED",
              transition: "width 0.5s linear",
            }}
          />
        </div>
      )}

      {/* ── ターゲットパルスリング ── */}
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
