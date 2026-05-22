// ════════════════════════════════════════════════════════════════════
//  types.ts — ゲーム全体の型定義
// ════════════════════════════════════════════════════════════════════

// ─── タイル種別 ──────────────────────────────────────────────────────
export type TileType =
  | "empty"          // 空きマス
  | "stone_deposit"  // 石鉱床（ドリル設置可）
  | "iron_deposit"   // 鉄鉱床（ドリル設置可）
  | "stone_drill"    // 石ドリル
  | "iron_drill"     // 鉄ドリル
  | "belt"           // ベルトコンベア
  | "solar"          // ソーラーパネル
  | "battery"        // 蓄電池
  | "hub";           // 出荷ポート（解体不可、固定配置）

// ─── ベルト方向 ──────────────────────────────────────────────────────
export type Direction = "up" | "right" | "down" | "left";

// ─── 昼夜サイクル ────────────────────────────────────────────────────
export type DayPhase = "day" | "night";

// ─── ショップで選択中のアクション ────────────────────────────────────
export type ShopItem =
  | "stone_drill"
  | "iron_drill"
  | "belt"
  | "solar"
  | "battery"
  | "demolish"  // 解体モード
  | null;

// ─── アクティブタブ ───────────────────────────────────────────────────
export type ActiveTab = "factory" | "research";

// ─── ベルト上を移動するアイテム ──────────────────────────────────────
export type BeltItem = "stone" | "iron" | null;

// ─── グリッド1マスのデータ ───────────────────────────────────────────
export interface Tile {
  /** row * GRID_SIZE + col で一意になるID */
  id: number;
  type: TileType;
  /** ベルトコンベアの向き */
  direction?: Direction;
  /** ベルト上を流れているアイテム（物流ロジック用） */
  beltItem?: BeltItem;
  /** アニメーション用フラグ（描画のみ、ロジックとは独立） */
  beltParticle?: BeltItem;
}

// ─── アップグレード状態 ───────────────────────────────────────────────
export interface Upgrades {
  /** 手動採掘量 +1（コスト: コイン50 + 石20） */
  efficientPickaxe: boolean;
  /** ドリル毎秒生産 +1（コスト: コイン200 + 鉄10） */
  turbodrillBoost: boolean;
}

// ─── アップグレードのコスト定義（複合リソース） ──────────────────────
export interface UpgradeCost {
  money: number;
  stone?: number;
  iron?: number;
}

// ─── ゲーム全体の状態 ────────────────────────────────────────────────
export interface GameState {
  money: number;
  stone: number;
  iron: number;
  /** 消費電力（W） */
  powerUsed: number;
  /** 最大供給電力（W） */
  powerMax: number;
  /** 蓄電池の蓄電量 */
  batteryCharge: number;
  /** 蓄電池の最大容量 */
  batteryMax: number;
  /** ゲームの経過ティック数 */
  tick: number;
  /** 昼夜フェーズ */
  dayPhase: DayPhase;
  /** 5×5 グリッド */
  grid: Tile[][];
  /** 永続アップグレード */
  upgrades: Upgrades;
}

// ─── ゲームループ1ティックの計算結果 ────────────────────────────────
export interface TickResult {
  stonePlus: number;
  ironPlus: number;
  moneyFromHub: number;
  newGrid: Tile[][];
  powerUsed: number;
  powerMax: number;
  batteryCharge: number;
}

// ─── トースト通知 ────────────────────────────────────────────────────
export interface ToastMsg {
  id: number;
  text: string;
  color: string;
}