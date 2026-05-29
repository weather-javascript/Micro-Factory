// ════════════════════════════════════════════════════════════════════
//  types.ts — Micro-Factory 3D 全型定義
// ════════════════════════════════════════════════════════════════════

/** タイルの種類 */
export type TileKind =
  | "empty"
  | "stone_deposit"
  | "iron_deposit"
  | "uranium_deposit"   // ウラン鉱床（終盤）
  | "water_source"
  | "stone_drill"
  | "iron_drill"
  | "uranium_drill"
  | "belt"
  | "filter"            // フィルター分配器
  | "solar"
  | "battery"
  | "assembler"
  | "water_pump"
  | "steam_engine"
  | "nuclear_plant"     // 原子力発電所
  | "waste_disposal"    // 廃棄物遮蔽処分場
  | "rocket_silo"
  | "hub"               // 出荷ハブ（→軌道エレベーターにアップグレード）
  | "space_elevator";   // 軌道エレベーター（hubのアップグレード後）

/** 向き */
export type Direction = "up" | "right" | "down" | "left";

/** ベルト上を流れるアイテム種別 */
export type ItemKind =
  | "stone"
  | "iron"
  | "uranium"
  | "gear"          // 鉄の歯車
  | "fuel_rod"      // ウラン燃料棒
  | "water"
  | "waste"         // 放射性廃棄物（緑発光）
  | "radio_waste";  // 放射性廃棄物（高レベル）

/** ベルト上のアイテム実体 */
export interface BeltItem {
  kind: ItemKind;
  /** タイル内進行度 0.0〜1.0 */
  progress: number;
  /** 3D空間の世界座標（補間用） */
  worldX: number;
  worldZ: number;
}

/** フィルター分配器の設定 */
export interface FilterConfig {
  stone?:      Direction;
  iron?:       Direction;
  uranium?:    Direction;
  gear?:       Direction;
  fuel_rod?:   Direction;
  water?:      Direction;
  waste?:      Direction;
  radio_waste?: Direction;
}

/** モジュール種別 */
export type ModuleKind = "speed" | "production" | "efficiency" | null;

/** グリッドの1マス */
export interface Tile {
  id:               string;
  kind:             TileKind;
  direction:        Direction;
  beltItem:         BeltItem | null;
  productionTimer:  number;
  depositRemaining: number;
  module:           ModuleKind;
  filterConfig:     FilterConfig;
  waterFed:         boolean;
  fuelFed:          boolean;         // 原子力発電所への燃料棒供給フラグ
  contamination:    number;          // 汚染度 0〜1（廃棄物が近いと上昇）
}

/** 研究アップグレードフラグ */
export interface Upgrades {
  efficientPickaxe:  boolean;
  turbodrillBoost:   boolean;
  fastBelt:          boolean;
  largeBattery:      boolean;
  assemblerUnlock:   boolean;
  filterUnlock:      boolean;
  steamUnlock:       boolean;
  nuclearUnlock:     boolean;       // 原子力発電解放
  moduleUnlock:      boolean;
  expansion7x7:      boolean;
  expansion9x9:      boolean;
  rocketSilo:        boolean;
  spaceElevator:     boolean;       // 軌道エレベーター解放
}

/** 研究コスト条件 */
export interface ResearchRequirement {
  money:            number;
  stone?:           number;
  iron?:            number;
  gear?:            number;         // 累計ハブ出荷歯車数
  fuel_rod?:        number;         // 累計燃料棒出荷数
  requiresUpgrade?: keyof Upgrades;
}

/** ショップアイテム */
export type ShopItem =
  | "stone_drill" | "iron_drill" | "uranium_drill"
  | "belt" | "filter"
  | "solar" | "battery"
  | "assembler"
  | "water_pump" | "steam_engine" | "nuclear_plant"
  | "waste_disposal"
  | "rocket_silo"
  | "demolish"
  | "module_speed" | "module_production" | "module_efficiency";

/** 宇宙貿易マイルストーン要求 */
export interface Milestone {
  id:          string;
  label:       string;
  description: string;
  requires:    Partial<Record<ItemKind, number>>;
  reward:      keyof Upgrades;
  rewardLabel: string;
  completed:   boolean;
}

/** 統計スナップショット */
export interface StatsSnapshot {
  time:         number;
  stoneIn:      number;
  ironIn:       number;
  uraniumIn:    number;
  gearShipped:  number;
  fuelShipped:  number;
  wasteShipped: number;
  income:       number;
}

/** 昼夜フェーズ */
export type DayPhase = "day" | "dusk" | "night" | "dawn";

/** プレステージ特権（銀河開拓パス） */
export interface PrestigeSkill {
  id:          string;
  label:       string;
  description: string;
  icon:        string;
}

/** 周回バフ */
export interface NewGamePlusBuff {
  cycle:                number;
  speedMultiplier:      number;
  productionMultiplier: number;
  wasteReduction:       number;   // 廃棄物発生率軽減 0〜1
  startGridSize:        number;
  startMoney:           number;
  selectedSkills:       string[]; // 選択済み特権IDリスト
}

/** ゲーム全体の状態 */
export interface GameState {
  money:    number;
  stone:    number;
  iron:     number;
  uranium:  number;
  gear:     number;
  fuel_rod: number;
  water:    number;

  totalGearsShipped:   number;
  totalFuelShipped:    number;
  totalStonesShipped:  number;
  totalIronShipped:    number;
  totalWasteShipped:   number;
  totalUraniumShipped: number;

  /** マイルストーン進捗（現在のTier向け納品数） */
  milestoneProgress: Partial<Record<ItemKind, number>>;

  powerUsed:     number;
  powerGenerated: number;
  batteryCharge: number;
  batteryMax:    number;

  dayPhase:    DayPhase;
  phaseTimer:  number;
  /** 昼夜サイクル内の正規化時間 0〜1（ライティング補間用） */
  lightNorm:   number;

  gridSize: number;
  grid:     Tile[][];

  upgrades: Upgrades;
  currentTier: number;         // 現在のTier（0〜3）
  milestones: Milestone[];

  statsHistory: StatsSnapshot[];
  totalTime:    number;

  rocketLaunched:  boolean;
  infiniteMode:    boolean;
  hubUpgraded:     boolean;    // 軌道エレベーターへ昇格済み

  ngPlusBuff: NewGamePlusBuff;
  moduleInventory: { speed: number; production: number; efficiency: number };

  /** カメラ状態（3D視点保存） */
  cameraTarget: [number, number, number];
}

/** 生産統計（派生値） */
export interface ProdStats {
  stoneDrillCnt:    number;
  ironDrillCnt:     number;
  uraniumDrillCnt:  number;
  beltCnt:          number;
  solarCnt:         number;
  batteryCnt:       number;
  assemblerCnt:     number;
  waterPumpCnt:     number;
  steamEngineCnt:   number;
  nuclearPlantCnt:  number;
  wasteDisposalCnt: number;
  stonePerSec:      number;
  ironPerSec:       number;
  powerBalance:     number;   // 発電 - 消費
  efficiency:       number;
}

/** トースト通知 */
export interface Toast {
  id:    number;
  text:  string;
  color: string;
  icon?: string;
}
