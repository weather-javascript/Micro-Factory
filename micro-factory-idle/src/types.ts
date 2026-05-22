// ════════════════════════════════════════════════════════════════════
//  types.ts — ゲーム全体の型定義
// ════════════════════════════════════════════════════════════════════

/** タイルの種類 */
export type TileKind =
  | "empty"          // 空き地
  | "stone_deposit"  // 石鉱床
  | "iron_deposit"   // 鉄鉱床
  | "stone_drill"    // 石ドリル
  | "iron_drill"     // 鉄ドリル
  | "belt"           // コンベアベルト
  | "solar"          // ソーラーパネル
  | "battery"        // 蓄電池
  | "assembler"      // 組立機
  | "hub"            // 出荷ハブ（固定）
  | "rocket_silo";   // ロケットサイロ

/** ベルト・ドリル・組立機の向き（排出方向） */
export type Direction = "up" | "right" | "down" | "left";

/** ベルト上を流れる実体アイテム */
export type ItemKind = "stone" | "iron" | "gear";

/** ベルトマスに乗っているアイテム */
export interface BeltItem {
  kind: ItemKind;
  /** 0.0〜1.0: タイル上の進行度（1.0で次のタイルへ移動） */
  progress: number;
}

/** グリッドの1マス */
export interface Tile {
  id: string;
  kind: TileKind;
  direction: Direction;
  /** ベルト上のアイテム（最大1個） */
  beltItem: BeltItem | null;
  /** ドリル/組立機の生産タイマー（0〜1） */
  productionTimer: number;
  /** 鉱床の残りの埋蔵量 */
  depositRemaining: number;
}

/** 永続アップグレードフラグ */
export interface Upgrades {
  efficientPickaxe: boolean;   // 手動採掘量×2
  turbodrillBoost: boolean;    // ドリル+1/s
  fastBelt: boolean;           // ベルト速度2倍（Tier2解放）
  largeBattery: boolean;       // 蓄電池容量2倍（Tier2解放）
  assemblerUnlock: boolean;    // 組立機解放（Tier2）
  expansion7x7: boolean;       // 7×7に拡張（Tier2）
  expansion9x9: boolean;       // 9×9に拡張（Tier3）
  rocketSilo: boolean;         // ロケットサイロ解放（Tier3）
}

/** 研究アンロック条件 */
export interface ResearchRequirement {
  money: number;
  stone?: number;
  iron?: number;
  gear?: number;               // 歯車の累計ハブ納品数
  requiresUpgrade?: keyof Upgrades; // 前提研究
}

/** ショップで選択できるアイテム種別 */
export type ShopItem =
  | "stone_drill"
  | "iron_drill"
  | "belt"
  | "solar"
  | "battery"
  | "assembler"
  | "rocket_silo"
  | "demolish";

/** 統計スナップショット（毎秒記録） */
export interface StatsSnapshot {
  time: number;            // 記録した時刻（Date.now()）
  stoneIn: number;         // 石の増加量
  ironIn: number;          // 鉄の増加量
  income: number;          // 収入
  gearShipped: number;     // 歯車出荷数
}

/** ゲーム全体の状態 */
export interface GameState {
  money: number;
  stone: number;
  iron: number;
  gear: number;            // 在庫中の歯車
  totalGearsShipped: number; // 累計ハブ出荷歯車数（研究条件）
  totalStonesShipped: number;
  totalIronShipped: number;

  powerUsed: number;       // 現在の消費電力 (W)
  powerMax: number;        // 現在の最大発電量 (W)
  batteryCharge: number;   // 蓄電池の現在充電量 (Wh)
  batteryMax: number;      // 蓄電池の最大容量 (Wh)

  dayPhase: "day" | "night";
  phaseTimer: number;      // 現在フェーズの経過秒数

  gridSize: number;        // 現在のグリッドサイズ（5,7,9）
  grid: Tile[][];

  upgrades: Upgrades;

  /** 直近10秒のスナップショット（統計グラフ用） */
  statsHistory: StatsSnapshot[];
  /** 累計時間（秒） */
  totalTime: number;

  /** ゲームクリアフラグ */
  rocketLaunched: boolean;
  infiniteMode: boolean;

  /** ロケット用素材納品進捗 */
  rocketProgress: {
    gear: number;    // 必要500個
    iron: number;    // 必要200個
    money: number;   // 必要10000コイン（フラグ）
  };
}

/** 生産統計（UIで表示する派生値） */
export interface ProdStats {
  stoneDrillCnt: number;
  ironDrillCnt: number;
  beltCnt: number;
  solarCnt: number;
  batteryCnt: number;
  assemblerCnt: number;
  stonePerSec: number;
  ironPerSec: number;
  incomePerSec: number;
  efficiency: number;      // 0.2〜1.0
}

/** トースト通知 */
export interface Toast {
  id: number;
  text: string;
  color: string;
}
