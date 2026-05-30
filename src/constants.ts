// ════════════════════════════════════════════════════════════════════
//  constants.ts — Micro-Factory 3D 全定数
// ════════════════════════════════════════════════════════════════════

import type { TileKind, Direction, Upgrades, ResearchRequirement, Milestone, PrestigeSkill } from "./types";

// ─── グリッド ────────────────────────────────────────────────────────
export const INITIAL_GRID_SIZE   = 5;
export const HUB_ROW             = 2;
export const HUB_COL             = 2;
export const WATER_SOURCE_POS: [number, number] = [0, 0];
/** タイル1枚の3D幅（ワールド単位） */
export const TILE_SIZE           = 2.2;
/** タイルの高さ（ベース地面） */
export const TILE_HEIGHT         = 0.3;

// ─── 昼夜サイクル ────────────────────────────────────────────────────
export const PHASE_DURATIONS = {
  day:   20,  // 昼 20秒
  dusk:  5,   // 夕方 5秒
  night: 20,  // 夜 20秒
  dawn:  5,   // 夜明け 5秒
} as const;
export const TOTAL_CYCLE = 50; // 合計50秒

// ─── 電力 ────────────────────────────────────────────────────────────
export const SOLAR_POWER_DAY      = 10;
export const STEAM_ENGINE_POWER   = 40;
export const NUCLEAR_POWER        = 200;   // 原子力発電所
export const BATTERY_CAPACITY     = 40;
export const LARGE_BATTERY_MULT   = 2;
export const LOW_POWER_EFFICIENCY = 0.2;

export const POWER_CONSUMPTION: Partial<Record<TileKind, number>> = {
  stone_drill:    1,
  iron_drill:     3,
  uranium_drill:  5,
  assembler:      5,
  water_pump:     2,
  waste_disposal: 30,   // 廃棄物処分場は超大量消費
  nuclear_plant:  10,   // 原子力発電所自体も冷却電力を消費
  filter:         0,
};

// ─── 生産間隔 ────────────────────────────────────────────────────────
export const STONE_DRILL_INTERVAL   = 1.0;
export const IRON_DRILL_INTERVAL    = 2.0;
export const URANIUM_DRILL_INTERVAL = 4.0;
export const ASSEMBLER_INTERVAL     = 3.0;
export const WATER_PUMP_INTERVAL    = 1.5;
export const FUEL_ROD_INTERVAL      = 6.0; // 燃料棒クラフト間隔

// ─── 埋蔵量 ──────────────────────────────────────────────────────────
export const STONE_DEPOSIT_DEFAULT   = 500;
export const IRON_DEPOSIT_DEFAULT    = 300;
export const URANIUM_DEPOSIT_DEFAULT = 150;
export const DEPOSIT_RESPAWN_SECS    = 45;

// ─── ベルト速度 ──────────────────────────────────────────────────────
export const BELT_SPEED_NORMAL  = 1.0;
export const BELT_SPEED_FAST    = 2.0;

// ─── レシピ ──────────────────────────────────────────────────────────
/** 歯車: 石×2 + 鉄×1 */
export const GEAR_RECIPE    = { stone: 2, iron: 1 };
/** 燃料棒: 鉄×2 + ウラン×3 */
export const FUEL_ROD_RECIPE = { iron: 2, uranium: 3 };

/** 副産物発生確率 */
export const WASTE_CHANCE_NORMAL  = 0.12;
export const WASTE_CHANCE_NUCLEAR = 0.25;
export const WASTE_CHANCE_PROD    = 0.30;

// ─── 売却レート ──────────────────────────────────────────────────────
export const SELL_RATES: Record<string, number> = {
  stone:      1,
  iron:       3,
  uranium:    8,
  gear:       12,
  fuel_rod:   50,
  water:      0,
  waste:      0,
  radio_waste: 0,
};

// ─── 施設コスト ──────────────────────────────────────────────────────
export const COSTS: Record<string, number> = {
  stone_drill:    20,
  iron_drill:     60,
  uranium_drill:  200,
  belt:           5,
  filter:         30,
  solar:          80,
  battery:        120,
  assembler:      200,
  water_pump:     100,
  steam_engine:   400,
  nuclear_plant:  2000,
  waste_disposal: 500,
  rocket_silo:    5000,
  module_speed:       300,
  module_production:  300,
  module_efficiency:  400,
};

// ─── 研究コスト ──────────────────────────────────────────────────────
export const UPGRADE_COSTS: Record<keyof Upgrades, ResearchRequirement> = {
  efficientPickaxe: { money: 100,  stone: 30 },
  turbodrillBoost:  { money: 300,  iron: 20 },
  fastBelt:         { money: 500,  gear: 10,  requiresUpgrade: "assemblerUnlock" },
  largeBattery:     { money: 600,  gear: 10,  requiresUpgrade: "assemblerUnlock" },
  assemblerUnlock:  { money: 400,  iron: 50 },
  filterUnlock:     { money: 250,  iron: 30,  requiresUpgrade: "assemblerUnlock" },
  steamUnlock:      { money: 800,  gear: 20,  requiresUpgrade: "assemblerUnlock" },
  nuclearUnlock:    { money: 3000, gear: 100, fuel_rod: 10, requiresUpgrade: "steamUnlock" },
  moduleUnlock:     { money: 600,  gear: 15,  requiresUpgrade: "assemblerUnlock" },
  expansion7x7:     { money: 800,  gear: 30,  requiresUpgrade: "assemblerUnlock" },
  expansion9x9:     { money: 2000, gear: 100, requiresUpgrade: "expansion7x7" },
  rocketSilo:       { money: 5000, gear: 200, requiresUpgrade: "expansion9x9" },
  spaceElevator:    { money: 10000, gear: 500, fuel_rod: 100, requiresUpgrade: "rocketSilo" },
};

export const UPGRADE_LABELS: Record<keyof Upgrades, string> = {
  efficientPickaxe: "高効率ピッケル",
  turbodrillBoost:  "ターボドリルBoost",
  fastBelt:         "高速ベルト",
  largeBattery:     "大容量バッテリー",
  assemblerUnlock:  "組立機解放",
  filterUnlock:     "フィルター分配器解放",
  steamUnlock:      "蒸気発電ライン解放",
  nuclearUnlock:    "原子力発電解放",
  moduleUnlock:     "モジュール装着解放",
  expansion7x7:     "土地拡張Tier2（7×7）",
  expansion9x9:     "土地拡張Tier3（9×9）",
  rocketSilo:       "ロケットサイロ解放",
  spaceElevator:    "軌道エレベーター建設",
};

export const UPGRADE_DESC: Record<keyof Upgrades, string> = {
  efficientPickaxe: "手動採掘量2倍",
  turbodrillBoost:  "全ドリル速度+50%",
  fastBelt:         "ベルト速度2倍",
  largeBattery:     "蓄電容量2倍",
  assemblerUnlock:  "組立機をショップに解放",
  filterUnlock:     "フィルター分配器を解放",
  steamUnlock:      "蒸気発電ラインを解放",
  nuclearUnlock:    "原子力発電所を解放（超大電力）",
  moduleUnlock:     "ドリル・組立機にモジュール装着可能",
  expansion7x7:     "グリッドを7×7に拡張",
  expansion9x9:     "グリッドを9×9に拡張",
  rocketSilo:       "ロケットサイロを建設可能に",
  spaceElevator:    "出荷ハブを軌道エレベーターに昇格",
};

// ─── 宇宙貿易マイルストーン ──────────────────────────────────────────
export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: "m1", label: "Tier1: 歯車の量産",
    description: "鉄の歯車を30個ハブに出荷する",
    requires: { gear: 30 },
    reward: "assemblerUnlock", rewardLabel: "組立機解放", completed: false,
  },
  {
    id: "m2", label: "Tier2: 大規模工業化",
    description: "歯車100個 + 鉄50個を出荷する",
    requires: { gear: 100, iron: 50 },
    reward: "expansion7x7", rewardLabel: "7×7拡張", completed: false,
  },
  {
    id: "m3", label: "Tier3: 原子力時代",
    description: "燃料棒を50個ハブに出荷する",
    requires: { fuel_rod: 50 },
    reward: "nuclearUnlock", rewardLabel: "原子力発電解放", completed: false,
  },
  {
    id: "m4", label: "Tier4: 宇宙への道",
    description: "燃料棒500個 + 歯車500個を出荷する",
    requires: { fuel_rod: 500, gear: 500 },
    reward: "spaceElevator", rewardLabel: "軌道エレベーター建設", completed: false,
  },
];

// ─── プレステージ特権（銀河開拓パス） ───────────────────────────────
export const PRESTIGE_SKILLS: PrestigeSkill[] = [
  {
    id: "fast_belt",
    label: "超高速輸送",
    description: "全ベルト速度+50%（累積）",
    icon: "⚡",
  },
  {
    id: "big_start",
    label: "大規模開始",
    description: "7×7グリッドから開始",
    icon: "🗺️",
  },
  {
    id: "waste_half",
    label: "廃棄物管理",
    description: "廃棄物発生率を半分に",
    icon: "♻️",
  },
  {
    id: "rich_start",
    label: "資本家の後継",
    description: "開始資金+1000¥",
    icon: "💰",
  },
  {
    id: "solar_boost",
    label: "高効率太陽光",
    description: "ソーラーパネルの発電量2倍",
    icon: "☀️",
  },
];

// ─── 3Dマテリアルカラー ──────────────────────────────────────────────
export const MATERIAL_COLORS: Record<TileKind, {
  color:     string;
  emissive:  string;
  roughness: number;
  metalness: number;
  emissiveIntensity: number;
}> = {
  empty:          { color: "#1a1a2e", emissive: "#000000", roughness: 0.9, metalness: 0.0, emissiveIntensity: 0 },
  stone_deposit:  { color: "#3d3d52", emissive: "#000000", roughness: 0.8, metalness: 0.1, emissiveIntensity: 0 },
  iron_deposit:   { color: "#1a3a5c", emissive: "#001020", roughness: 0.6, metalness: 0.4, emissiveIntensity: 0.05 },
  uranium_deposit:{ color: "#1a3a1a", emissive: "#003300", roughness: 0.7, metalness: 0.2, emissiveIntensity: 0.15 },
  water_source:   { color: "#0a2040", emissive: "#001030", roughness: 0.1, metalness: 0.0, emissiveIntensity: 0.3 },
  stone_drill:    { color: "#2a4080", emissive: "#001040", roughness: 0.5, metalness: 0.6, emissiveIntensity: 0.1 },
  iron_drill:     { color: "#0a3060", emissive: "#001050", roughness: 0.4, metalness: 0.7, emissiveIntensity: 0.15 },
  uranium_drill:  { color: "#103020", emissive: "#002010", roughness: 0.4, metalness: 0.8, emissiveIntensity: 0.3 },
  belt:           { color: "#0a2818", emissive: "#001008", roughness: 0.6, metalness: 0.3, emissiveIntensity: 0.05 },
  filter:         { color: "#201030", emissive: "#100020", roughness: 0.5, metalness: 0.5, emissiveIntensity: 0.2 },
  solar:          { color: "#0f2010", emissive: "#001500", roughness: 0.3, metalness: 0.2, emissiveIntensity: 0.05 },
  battery:        { color: "#180830", emissive: "#080020", roughness: 0.4, metalness: 0.6, emissiveIntensity: 0.2 },
  assembler:      { color: "#2a1008", emissive: "#150500", roughness: 0.5, metalness: 0.7, emissiveIntensity: 0.15 },
  water_pump:     { color: "#081828", emissive: "#001020", roughness: 0.4, metalness: 0.5, emissiveIntensity: 0.2 },
  steam_engine:   { color: "#180820", emissive: "#100015", roughness: 0.5, metalness: 0.6, emissiveIntensity: 0.3 },
  nuclear_plant:  { color: "#082008", emissive: "#003000", roughness: 0.4, metalness: 0.7, emissiveIntensity: 0.5 },
  waste_disposal: { color: "#180808", emissive: "#100000", roughness: 0.6, metalness: 0.4, emissiveIntensity: 0.1 },
  rocket_silo:    { color: "#081828", emissive: "#001018", roughness: 0.3, metalness: 0.8, emissiveIntensity: 0.3 },
  hub:            { color: "#2a0818", emissive: "#200010", roughness: 0.3, metalness: 0.8, emissiveIntensity: 0.6 },
  space_elevator: { color: "#1a1040", emissive: "#0a0830", roughness: 0.2, metalness: 0.9, emissiveIntensity: 0.8 },
};

/** アイテムの3Dカラー */
export const ITEM_3D_COLORS: Record<string, {
  color: string; emissive: string; emissiveIntensity: number;
}> = {
  stone:      { color: "#8899aa", emissive: "#000000", emissiveIntensity: 0 },
  iron:       { color: "#4a90cc", emissive: "#001020", emissiveIntensity: 0.1 },
  uranium:    { color: "#40cc40", emissive: "#008000", emissiveIntensity: 0.5 },
  gear:       { color: "#d4aa40", emissive: "#302000", emissiveIntensity: 0.2 },
  fuel_rod:   { color: "#80ff40", emissive: "#204000", emissiveIntensity: 0.8 },
  water:      { color: "#4080ff", emissive: "#001040", emissiveIntensity: 0.3 },
  waste:      { color: "#80ff40", emissive: "#204000", emissiveIntensity: 1.0 },
  radio_waste:{ color: "#c0ff00", emissive: "#408000", emissiveIntensity: 1.5 },
};

export const DIRECTION_ORDER: Direction[] = ["up", "right", "down", "left"];
export const DIRECTION_ARROWS: Record<Direction, string> = {
  up: "↑", right: "→", down: "↓", left: "←",
};

// ─── ロケット打ち上げ条件 ─────────────────────────────────────────────
export const ROCKET_REQUIREMENTS = {
  money:    10000,
  gear:     500,
  fuel_rod: 100,
};

// ─── NGP定数 ─────────────────────────────────────────────────────────
export const NGP_SPEED_BONUS      = 0.2;
export const NGP_PROD_BONUS       = 0.15;
export const NGP_START_MONEY_BASE = 200;
export const NGP_START_MONEY_PER  = 100;
