// ════════════════════════════════════════════════════════════════════
//  constants.ts — ゲーム全体の定数
// ════════════════════════════════════════════════════════════════════

import type { Direction, TileKind, Upgrades } from "./types";
import type { ResearchRequirement } from "./types";

// ─── グリッド ───────────────────────────────────────────────────────
export const INITIAL_GRID_SIZE = 5;
export const HUB_ROW = 2;          // 出荷ハブの行（グリッド中央）
export const HUB_COL = 2;          // 出荷ハブの列（グリッド中央）

// ─── 昼夜サイクル ────────────────────────────────────────────────────
export const DAY_DURATION = 30;    // 昼フェーズの秒数
export const NIGHT_DURATION = 30;  // 夜フェーズの秒数

// ─── 電力 ────────────────────────────────────────────────────────────
export const SOLAR_POWER = 10;          // ソーラーパネル1枚の発電量 (W)
export const BATTERY_CAPACITY = 40;     // 蓄電池1台の容量 (Wh)
export const LARGE_BATTERY_MULTIPLIER = 2; // 大容量蓄電池倍率
/** 電力不足時の稼働効率 */
export const LOW_POWER_EFFICIENCY = 0.2;

// ─── ドリル ──────────────────────────────────────────────────────────
export const DRILL_PRODUCTION_INTERVAL = 1.0; // 石ドリルの生産間隔（秒）
export const IRON_DRILL_INTERVAL = 2.0;       // 鉄ドリルの生産間隔（秒）
export const STONE_DEPOSIT_DEFAULT = 500;     // 石鉱床のデフォルト埋蔵量
export const IRON_DEPOSIT_DEFAULT = 300;      // 鉄鉱床のデフォルト埋蔵量

// ─── ベルト ──────────────────────────────────────────────────────────
export const BELT_SPEED = 1.0;           // 通常ベルト速度（1マス/秒）
export const FAST_BELT_SPEED = 2.0;      // 高速ベルト速度（1マス/秒）

// ─── 組立機 ──────────────────────────────────────────────────────────
export const ASSEMBLER_INTERVAL = 3.0;   // 歯車1個の生産間隔（秒）
export const ASSEMBLER_POWER = 5;        // 組立機の消費電力 (W)
/** 歯車レシピ: 石×2 + 鉄×1 → 歯車×1 */
export const GEAR_RECIPE = { stone: 2, iron: 1 };
export const GEAR_SELL_PRICE = 12;       // 歯車1個の売却額（コイン）

// ─── 鉱床再発見 ──────────────────────────────────────────────────────
export const DEPOSIT_RESPAWN_INTERVAL = 45; // 新鉱床ポップアップ間隔（秒）

// ─── 売却レート ──────────────────────────────────────────────────────
export const SELL_RATES: Record<string, number> = {
  stone: 1,   // 石1個 = 1コイン
  iron: 3,    // 鉄1個 = 3コイン
  gear: GEAR_SELL_PRICE,
};

// ─── 施設コスト ──────────────────────────────────────────────────────
export const COSTS: Record<string, number> = {
  stone_drill: 20,
  iron_drill: 60,
  belt: 5,
  solar: 80,
  battery: 120,
  assembler: 200,
  rocket_silo: 5000,
};

/** 施設の消費電力 (W) */
export const POWER_CONSUMPTION: Partial<Record<TileKind, number>> = {
  stone_drill: 1,
  iron_drill: 3,
  assembler: ASSEMBLER_POWER,
};

// ─── アップグレード ──────────────────────────────────────────────────
export const UPGRADE_LABELS: Record<keyof Upgrades, string> = {
  efficientPickaxe: "高効率ピッケル",
  turbodrillBoost:  "ターボドリルBoost",
  fastBelt:         "高速ベルト",
  largeBattery:     "大容量バッテリー",
  assemblerUnlock:  "組立機解放",
  expansion7x7:     "土地拡張 Tier2（7×7）",
  expansion9x9:     "土地拡張 Tier3（9×9）",
  rocketSilo:       "ロケットサイロ解放",
};

export const UPGRADE_DESC: Record<keyof Upgrades, string> = {
  efficientPickaxe: "手動採掘量が2倍になる",
  turbodrillBoost:  "全ドリルの生産量+1/s",
  fastBelt:         "ベルト搬送速度が2倍になる",
  largeBattery:     "蓄電池容量が2倍になる",
  assemblerUnlock:  "組立機をショップに解放する",
  expansion7x7:     "グリッドを7×7に拡張する",
  expansion9x9:     "グリッドを9×9に拡張する",
  rocketSilo:       "ロケットサイロを建設可能にする",
};

/** 研究アンロック条件 */
export const UPGRADE_COSTS: Record<keyof Upgrades, ResearchRequirement> = {
  efficientPickaxe: { money: 100, stone: 30 },
  turbodrillBoost:  { money: 300, iron: 20 },
  fastBelt:         { money: 500, gear: 10, requiresUpgrade: "assemblerUnlock" },
  largeBattery:     { money: 600, gear: 10, requiresUpgrade: "assemblerUnlock" },
  assemblerUnlock:  { money: 400, iron: 50 },
  expansion7x7:     { money: 800, gear: 30, requiresUpgrade: "assemblerUnlock" },
  expansion9x9:     { money: 2000, gear: 100, requiresUpgrade: "expansion7x7" },
  rocketSilo:       { money: 5000, gear: 200, requiresUpgrade: "expansion9x9" },
};

// ─── タイルカラー ─────────────────────────────────────────────────────
export const TILE_COLORS: Record<TileKind, { bg: string; border: string; label: string }> = {
  empty:         { bg: "#16161f", border: "#1e1e2a", label: "" },
  stone_deposit: { bg: "#2a2f3a", border: "#52596a", label: "石床" },
  iron_deposit:  { bg: "#1a2d42", border: "#2e4d6e", label: "鉄床" },
  stone_drill:   { bg: "#1e2f50", border: "#3a5a9e", label: "石⛏" },
  iron_drill:    { bg: "#0e3a5a", border: "#1e6a9e", label: "鉄⛏" },
  belt:          { bg: "#0e2820", border: "#1e5040", label: "→" },
  solar:         { bg: "#1a3010", border: "#3a6020", label: "☀" },
  battery:       { bg: "#1e1040", border: "#4a3080", label: "🔋" },
  assembler:     { bg: "#2a1a10", border: "#7a4020", label: "⚙" },
  hub:           { bg: "#3a1030", border: "#9a2060", label: "HUB" },
  rocket_silo:   { bg: "#0a1a30", border: "#1a4a8a", label: "🚀" },
};

// ─── ベルト向き表示 ──────────────────────────────────────────────────
export const DIRECTION_ARROWS: Record<Direction, string> = {
  up: "↑", right: "→", down: "↓", left: "←",
};

export const DIRECTION_ORDER: Direction[] = ["up", "right", "down", "left"];

// ─── 初期グリッドレイアウト（5×5） ───────────────────────────────────
/** 石鉱床の初期位置 [row, col] */
export const INITIAL_STONE_DEPOSITS: [number, number][] = [
  [0, 0], [0, 4], [1, 2], [3, 1], [4, 3],
];

/** 鉄鉱床の初期位置 [row, col] */
export const INITIAL_IRON_DEPOSITS: [number, number][] = [
  [0, 2], [2, 4], [4, 0], [3, 3],
];

// ─── ロケット打ち上げ条件 ─────────────────────────────────────────────
export const ROCKET_REQUIREMENTS = {
  money: 10000,   // 必要コイン
  gear: 500,      // 累計歯車納品数
  iron: 200,      // 累計鉄納品数
};

// ─── 凡例データ ──────────────────────────────────────────────────────
export const LEGEND_ITEMS = [
  { color: "#52596a", text: "石鉱床（ドリル設置可）" },
  { color: "#2e4d6e", text: "鉄鉱床（ドリル設置可）" },
  { color: "#3a5a9e", text: "石ドリル (1W消費)" },
  { color: "#1e6a9e", text: "鉄ドリル (3W消費)" },
  { color: "#1e5040", text: "ベルト（タップで回転）" },
  { color: "#3a6020", text: "ソーラー (+10W/昼)" },
  { color: "#4a3080", text: "蓄電池 (40Wh)" },
  { color: "#9a2060", text: "Hub（自動出荷）" },
  { color: "#7a4020", text: "組立機（歯車生産）" },
  { color: "#1a4a8a", text: "ロケットサイロ" },
];
