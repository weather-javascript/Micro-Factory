// ════════════════════════════════════════════════════════════════════
//  constants.ts — ゲームバランス・UI定数
// ════════════════════════════════════════════════════════════════════

import type { TileType, Direction, UpgradeCost } from "./types";

// ─── グリッド ─────────────────────────────────────────────────────────
export const GRID_SIZE = 5;

// ─── ゲームループ ─────────────────────────────────────────────────────
/** ゲームティック間隔（ms） */
export const TICK_MS = 1000;
/** 1フェーズ（昼 or 夜）の長さ（ティック数） = 30秒 */
export const PHASE_DURATION_TICKS = 30;

// ─── 出荷ポート（Hub）の固定位置 ────────────────────────────────────
export const HUB_POSITION: [number, number] = [2, 2];

// ─── 初期鉱床配置 ─────────────────────────────────────────────────────
export const INITIAL_STONE_DEPOSITS: [number, number][] = [
  [0, 0], [0, 1], [1, 0],
];
export const INITIAL_IRON_DEPOSITS: [number, number][] = [
  [0, 3], [0, 4], [1, 4],
];

// ─── 電力 ─────────────────────────────────────────────────────────────
/** ソーラーパネル1枚の昼間発電量（W） */
export const SOLAR_POWER_DAY = 10;
/** ソーラーパネル1枚の夜間発電量（W） */
export const SOLAR_POWER_NIGHT = 0;
/** 蓄電池1台の容量（Wh） */
export const BATTERY_CAPACITY = 40;
/** 蓄電池1台の充電速度（W/tick） */
export const BATTERY_CHARGE_RATE = 5;
/** 蓄電池1台の放電速度（W/tick） */
export const BATTERY_DISCHARGE_RATE = 8;
/** ドリルごとの電力消費量（W） */
export const POWER_USE: Record<"stone_drill" | "iron_drill", number> = {
  stone_drill: 1,
  iron_drill: 3,
};

// ─── 施設コスト ───────────────────────────────────────────────────────
export const COSTS: Record<
  "stone_drill" | "iron_drill" | "belt" | "solar" | "battery",
  number
> = {
  stone_drill: 20,
  iron_drill: 100,
  belt: 5,
  solar: 150,
  battery: 300,
};

// ─── 売却レート ───────────────────────────────────────────────────────
export const SELL_RATE: Record<"stone" | "iron", number> = {
  stone: 1,
  iron: 5,
};

// ─── アップグレードコスト（複合リソース） ────────────────────────────
export const UPGRADE_COSTS: Record<"efficientPickaxe" | "turbodrillBoost", UpgradeCost> = {
  efficientPickaxe: { money: 50, stone: 20 },
  turbodrillBoost:  { money: 200, iron: 10 },
};

// ─── ベルト方向 ───────────────────────────────────────────────────────
export const DIR_ORDER: Direction[] = ["up", "right", "down", "left"];

export const DIR_ROTATE: Record<Direction, string> = {
  up:    "rotate-0",
  right: "rotate-90",
  down:  "rotate-180",
  left:  "-rotate-90",
};

/** ベルトの向き → 移動デルタ [dr, dc] */
export const DIR_DELTA: Record<Direction, [number, number]> = {
  up:    [-1,  0],
  right: [ 0,  1],
  down:  [ 1,  0],
  left:  [ 0, -1],
};

// ─── タイル外観 ───────────────────────────────────────────────────────
export const TILE_BG: Record<TileType, string> = {
  empty:         "#16161c",
  stone_deposit: "#33363f",
  iron_deposit:  "#1e2e42",
  stone_drill:   "#1a2535",
  iron_drill:    "#132030",
  belt:          "#161e20",
  solar:         "#1a2010",
  battery:       "#1a1530",
  hub:           "#201520",
};

export const TILE_BORDER: Record<TileType, string> = {
  empty:         "#252530",
  stone_deposit: "#52596a",
  iron_deposit:  "#2e4d6e",
  stone_drill:   "#2e4d7e",
  iron_drill:    "#1e5a7e",
  belt:          "#1e4030",
  solar:         "#3a6020",
  battery:       "#4a3080",
  hub:           "#7a4060",
};

// ─── 施設・アップグレードの表示名 ────────────────────────────────────
export const SHOP_LABELS: Record<
  "stone_drill" | "iron_drill" | "belt" | "solar" | "battery" | "demolish",
  string
> = {
  stone_drill: "石ドリル",
  iron_drill:  "鉄ドリル",
  belt:        "ベルト",
  solar:       "ソーラー",
  battery:     "蓄電池",
  demolish:    "解体",
};

export const UPGRADE_LABELS: Record<"efficientPickaxe" | "turbodrillBoost", string> = {
  efficientPickaxe: "効率的なツルハシ",
  turbodrillBoost:  "過給ドリル",
};

export const UPGRADE_DESC: Record<"efficientPickaxe" | "turbodrillBoost", string> = {
  efficientPickaxe: "手動採掘で得られる資源が +1 増える（合計 ×2）",
  turbodrillBoost:  "すべてのドリルの毎秒生産量が +1 される",
};