// ════════════════════════════════════════════════════════════════════
//  components/TileCell.tsx — グリッドの1マスを描画するコンポーネント
// ════════════════════════════════════════════════════════════════════

import type React from "react";

import type { Tile } from "../types";
import type { ShopItem } from "../types";
import {
  TILE_BG, TILE_BORDER, DIR_ROTATE,
} from "../constants";
import { canPlace, canDemolish } from "../utils/gameLogic";
import {
  StoneIcon, IronIcon, DrillIcon, BeltIcon,
  SolarIcon, BatteryIcon, HubIcon,
} from "./Icons";

interface Props {
  tile: Tile;
  selectedShop: ShopItem;
  onTileClick: (r: number, c: number) => void;
  row: number;
  col: number;
  /** 電力が供給されているか（false=停止/半減） */
  powerOk: boolean;
}

export const TileCell: React.FC<Props> = ({
  tile, selectedShop, onTileClick, row, col, powerOk,
}) => {
  // 選択中ショップがこのマスに配置可能か
  const placeable   = canPlace(tile, selectedShop);
  // 解体モードでこのマスが解体対象か
  const demolishable = selectedShop === "demolish" && canDemolish(tile);

  // ハイライト色の決定
  let borderColor = TILE_BORDER[tile.type];
  if (selectedShop && selectedShop !== "demolish" && placeable)  borderColor = "#68D391";
  if (selectedShop && selectedShop !== "demolish" && !placeable && tile.type !== "hub") borderColor = "#FC818150";
  if (demolishable) borderColor = "#FC8181";

  // 電力不足でドリルが停止中か
  const isDrill      = tile.type === "stone_drill" || tile.type === "iron_drill";
  const drillStopped = isDrill && !powerOk;

  return (
    <div
      onClick={() => onTileClick(row, col)}
      className="relative flex items-center justify-center rounded-lg cursor-pointer select-none transition-all duration-100 active:scale-95"
      style={{
        background:  TILE_BG[tile.type],
        border:      `1.5px solid ${borderColor}`,
        aspectRatio: "1/1",
        boxShadow:   placeable && selectedShop !== "demolish"
          ? "0 0 10px #68D39140"
          : demolishable
          ? "0 0 10px #FC818140"
          : "none",
        opacity: drillStopped ? 0.4 : 1,
      }}
    >
      {/* ─── タイルコンテンツ ─── */}
      {tile.type === "stone_deposit" && (
        <div className="flex flex-col items-center gap-0.5">
          <StoneIcon className="w-5 h-5 opacity-75" />
          <span className="text-[7px] font-bold tracking-wider" style={{ color: "#52596a" }}>STONE</span>
        </div>
      )}

      {tile.type === "iron_deposit" && (
        <div className="flex flex-col items-center gap-0.5">
          <IronIcon className="w-5 h-5 opacity-75" />
          <span className="text-[7px] font-bold tracking-wider" style={{ color: "#2e4d6e" }}>IRON</span>
        </div>
      )}

      {tile.type === "stone_drill" && (
        <div className="flex flex-col items-center gap-0.5">
          <DrillIcon className="w-5 h-5" />
          <StoneIcon className="w-3 h-3 opacity-50" />
        </div>
      )}

      {tile.type === "iron_drill" && (
        <div className="flex flex-col items-center gap-0.5">
          <DrillIcon className="w-5 h-5" style={{ color: "#63B3ED" }} />
          <IronIcon className="w-3 h-3 opacity-50" />
        </div>
      )}

      {tile.type === "belt" && (
        <div
          className={`w-full h-full p-0.5 transition-transform duration-200 ${DIR_ROTATE[tile.direction ?? "up"]}`}
        >
          <BeltIcon className="w-full h-full" />
        </div>
      )}

      {tile.type === "solar" && (
        <div className="flex flex-col items-center gap-0.5">
          <SolarIcon className="w-5 h-5" />
          <span className="text-[7px] font-bold" style={{ color: "#4ade80" }}>SOLAR</span>
        </div>
      )}

      {tile.type === "battery" && (
        <div className="flex flex-col items-center gap-0.5">
          <BatteryIcon className="w-5 h-5" />
          <span className="text-[7px] font-bold" style={{ color: "#a78bfa" }}>BAT</span>
        </div>
      )}

      {tile.type === "hub" && (
        <div className="flex flex-col items-center gap-0.5">
          <HubIcon className="w-5 h-5" />
          <span className="text-[7px] font-bold" style={{ color: "#f472b6" }}>HUB</span>
        </div>
      )}

      {/* 配置可能なら＋マークをオーバーレイ */}
      {tile.type === "empty" && selectedShop && selectedShop !== "demolish" && placeable && (
        <span className="text-lg font-bold" style={{ color: "#68D39150" }}>＋</span>
      )}

      {/* ─── ドリル稼働 LED ─── */}
      {isDrill && powerOk && (
        <span
          className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: tile.type === "stone_drill" ? "#A0AFBF" : "#63B3ED" }}
        />
      )}
      {/* 電力不足 LED */}
      {isDrill && !powerOk && (
        <span
          className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
          style={{ background: "#FC8181" }}
        />
      )}

      {/* ─── ベルト上のアイテム粒子（アニメーション） ─── */}
      {tile.type === "belt" && tile.beltParticle && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ animation: "beltFlow 0.5s ease-in-out" }}
        >
          {tile.beltParticle === "stone"
            ? <StoneIcon className="w-3 h-3 opacity-90" />
            : <IronIcon  className="w-3 h-3 opacity-90" />
          }
        </div>
      )}

      {/* ─── ベルト方向ラベル ─── */}
      {tile.type === "belt" && (
        <span
          className="absolute bottom-0.5 right-0.5 text-[6px] font-bold"
          style={{ color: "#2a5040" }}
        >
          {(tile.direction ?? "U")[0].toUpperCase()}
        </span>
      )}

      {/* ─── 解体モード：赤い×オーバーレイ ─── */}
      {demolishable && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg"
          style={{ background: "#FC818120" }}
        >
          <span className="text-base font-black" style={{ color: "#FC8181" }}>✕</span>
        </div>
      )}
    </div>
  );
};