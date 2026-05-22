// ════════════════════════════════════════════════════════════════════
//  utils/gameLogic.ts — 純粋関数群（副作用なし）
//  ゲームループ内の計算・物流ロジック・各種判定をすべてここに集約。
//  描画側のperSec計算もこのファイルから流用し、重複を排除する。
// ════════════════════════════════════════════════════════════════════

import type {
  Tile, TileType, Direction, BeltItem,
  GameState, TickResult, DayPhase, Upgrades,
} from "../types";
import {
  GRID_SIZE, DIR_ORDER, DIR_DELTA,
  SOLAR_POWER_DAY, SOLAR_POWER_NIGHT,
  BATTERY_CAPACITY, BATTERY_CHARGE_RATE, BATTERY_DISCHARGE_RATE,
  POWER_USE, SELL_RATE, HUB_POSITION, PHASE_DURATION_TICKS,
} from "../constants";

// ════════════════════════════════════════════════════════════════════
//  ■ グリッドユーティリティ
// ════════════════════════════════════════════════════════════════════

/** 方向と座標から隣のマス座標を返す（範囲外はnull） */
export function neighborOf(
  r: number,
  c: number,
  dir: Direction
): [number, number] | null {
  const [dr, dc] = DIR_DELTA[dir];
  const nr = r + dr;
  const nc = c + dc;
  if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return null;
  return [nr, nc];
}

/** ベルトの向きを時計回りに90度回転させる */
export function nextDirection(d: Direction): Direction {
  return DIR_ORDER[(DIR_ORDER.indexOf(d) + 1) % 4];
}

/** ShopItemをそのマスに配置できるか判定する */
export function canPlace(tile: Tile, item: string | null): boolean {
  if (!item || item === "demolish") return false;
  if (tile.type === "hub") return false; // Hubは上書き不可
  if (item === "stone_drill") return tile.type === "stone_deposit";
  if (item === "iron_drill")  return tile.type === "iron_deposit";
  if (item === "belt")        return tile.type === "empty";
  if (item === "solar")       return tile.type === "empty";
  if (item === "battery")     return tile.type === "empty";
  return false;
}

/** 解体可能なタイルかどうか */
export function canDemolish(tile: Tile): boolean {
  return (
    tile.type === "stone_drill" ||
    tile.type === "iron_drill"  ||
    tile.type === "belt"        ||
    tile.type === "solar"       ||
    tile.type === "battery"
  );
}

/** 解体後に戻るタイルの種別（鉱床の上のドリルは鉱床に戻す） */
export function demolishedType(tile: Tile): TileType {
  if (tile.type === "stone_drill") return "stone_deposit";
  if (tile.type === "iron_drill")  return "iron_deposit";
  return "empty";
}

// ════════════════════════════════════════════════════════════════════
//  ■ 昼夜サイクル
// ════════════════════════════════════════════════════════════════════

/** ティック数から昼夜フェーズを計算する */
export function calcDayPhase(tick: number): DayPhase {
  const cycle = Math.floor(tick / PHASE_DURATION_TICKS) % 2;
  return cycle === 0 ? "day" : "night";
}

/** ティック内での進行度（0.0 〜 1.0） */
export function phaseProgress(tick: number): number {
  return (tick % PHASE_DURATION_TICKS) / PHASE_DURATION_TICKS;
}

// ════════════════════════════════════════════════════════════════════
//  ■ 電力計算（描画 & ゲームループ共通）
// ════════════════════════════════════════════════════════════════════

export interface PowerStats {
  powerUsed: number;
  solarGen: number;  // ソーラー発電量（昼夜考慮前）
  batteryCnt: number;
}

/** グリッドから電力消費・発電量を集計する */
export function calcPowerStats(grid: Tile[][], phase: DayPhase): PowerStats {
  let powerUsed = 0;
  let solarGen  = 0;
  let batteryCnt = 0;
  const solarPower = phase === "day" ? SOLAR_POWER_DAY : SOLAR_POWER_NIGHT;

  for (const row of grid) {
    for (const t of row) {
      if (t.type === "stone_drill") powerUsed += POWER_USE.stone_drill;
      if (t.type === "iron_drill")  powerUsed += POWER_USE.iron_drill;
      if (t.type === "solar")       solarGen  += solarPower;
      if (t.type === "battery")     batteryCnt++;
    }
  }
  return { powerUsed, solarGen, batteryCnt };
}

// ════════════════════════════════════════════════════════════════════
//  ■ 生産量計算（描画用 perSec 表示と共通）
// ════════════════════════════════════════════════════════════════════

export interface ProductionStats {
  stoneDrillCnt: number;
  ironDrillCnt: number;
  beltCnt: number;
  solarCnt: number;
  batteryCnt: number;
  stonePerSec: number;  // 実効的な毎秒石生産量
  ironPerSec: number;   // 実効的な毎秒鉄生産量
  efficiency: number;   // 電力効率（1.0 or 0.5）
}

/**
 * グリッドと各種状態から生産量統計を計算する。
 * ゲームループ内と描画側のperSec表示の両方で使用することで重複を排除。
 */
export function calcProductionStats(
  grid: Tile[][],
  phase: DayPhase,
  batteryCharge: number,
  batteryMax: number,
  upgrades: Upgrades
): ProductionStats {
  let stoneDrillCnt = 0, ironDrillCnt = 0, beltCnt = 0, solarCnt = 0, batteryCnt = 0;

  for (const row of grid) {
    for (const t of row) {
      if (t.type === "stone_drill") stoneDrillCnt++;
      if (t.type === "iron_drill")  ironDrillCnt++;
      if (t.type === "belt")        beltCnt++;
      if (t.type === "solar")       solarCnt++;
      if (t.type === "battery")     batteryCnt++;
    }
  }

  const { powerUsed, solarGen } = calcPowerStats(grid, phase);
  // 夜間は蓄電池から放電してカバー
  const batterySupply = phase === "night" ? Math.min(batteryCharge, BATTERY_DISCHARGE_RATE * batteryCnt) : 0;
  const powerMax = solarGen + batterySupply;
  const powerOk  = powerUsed <= powerMax || (powerUsed === 0);
  const efficiency = powerOk ? 1.0 : 0.5;

  const drillBonus = upgrades.turbodrillBoost ? 1 : 0;
  const stonePerSec = Math.floor(stoneDrillCnt * (1 + drillBonus) * efficiency);
  const ironPerSec  = Math.floor(ironDrillCnt  * (1 + drillBonus) * efficiency);

  return {
    stoneDrillCnt, ironDrillCnt, beltCnt, solarCnt, batteryCnt,
    stonePerSec, ironPerSec, efficiency,
  };
}

// ════════════════════════════════════════════════════════════════════
//  ■ 物流ロジック（ベルトコンベア搬送 + Hub自動売却）
// ════════════════════════════════════════════════════════════════════

/**
 * 1ティック分のベルト搬送を処理する。
 *
 * アルゴリズム概要:
 * 1. ドリルが隣接するベルトへアイテムを排出する
 * 2. ベルト上のアイテムを direction の方向へ移動させる
 *    （ループを防ぐため、Hub方向を優先して逆流しないよう処理順を工夫）
 * 3. Hubに到達したアイテムは即時売却（moneyFromHub に加算）
 *
 * @returns [新しいグリッド, hubで稼いだコイン]
 */
export function processBeltTick(
  grid: Tile[][],
  drillBonus: number,
  efficiency: number
): [Tile[][], number] {
  // ─ Step1: グリッドをディープコピー
  const next: Tile[][] = grid.map(row =>
    row.map(t => ({ ...t, beltParticle: null as BeltItem }))
  );
  let moneyFromHub = 0;

  // ─ Step2: ドリルが隣のベルトへアイテムを排出
  //   ドリルは「自分の下方向」のベルトに排出する（向きはbeltの向きに依存）
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = grid[r][c];
      const isDrill = t.type === "stone_drill" || t.type === "iron_drill";
      if (!isDrill) continue;

      const item: BeltItem = t.type === "stone_drill" ? "stone" : "iron";
      // 周囲4方向にベルトがあれば排出（最初に見つかった1つへ）
      for (const dir of DIR_ORDER) {
        const nb = neighborOf(r, c, dir);
        if (!nb) continue;
        const [nr, nc] = nb;
        const nbTile = next[nr][nc];
        if (nbTile.type === "belt" && !nbTile.beltItem) {
          // effectivenessを考慮：50%効率なら50%の確率で排出
          if (Math.random() < efficiency) {
            next[nr][nc] = { ...nbTile, beltItem: item, beltParticle: item };
          }
          break;
        }
        // Hubに直接隣接している場合も売却
        if (nbTile.type === "hub") {
          if (Math.random() < efficiency) {
            moneyFromHub += SELL_RATE[item];
            next[r][c] = { ...next[r][c], beltParticle: item };
          }
          break;
        }
      }
    }
  }

  // ─ Step3: ベルト上のアイテムを搬送
  //   Hubに近いマスから処理することで、同一ティックでHub到達を実現
  const [hr, hc] = HUB_POSITION;
  // 全ベルトマスを Hub からの距離でソート（BFS的な処理順）
  const beltCoords: [number, number, number][] = []; // [r, c, dist]
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (next[r][c].type === "belt") {
        const dist = Math.abs(r - hr) + Math.abs(c - hc);
        beltCoords.push([r, c, dist]);
      }
    }
  }
  // Hubに近い順（昇順）に処理
  beltCoords.sort((a, b) => a[2] - b[2]);

  for (const [r, c] of beltCoords) {
    const t = next[r][c];
    if (!t.beltItem) continue;

    const dir = t.direction ?? "up";
    const nb  = neighborOf(r, c, dir);
    if (!nb) {
      // グリッド外 → アイテム消滅
      next[r][c] = { ...t, beltItem: null };
      continue;
    }

    const [nr, nc] = nb;
    const dest = next[nr][nc];

    if (dest.type === "hub") {
      // Hub到達 → 自動売却
      moneyFromHub += SELL_RATE[t.beltItem as "stone" | "iron"];
      next[r][c]   = { ...t, beltItem: null };
    } else if (dest.type === "belt" && !dest.beltItem) {
      // 隣のベルトへ移動
      next[nr][nc] = { ...dest, beltItem: t.beltItem, beltParticle: t.beltItem };
      next[r][c]   = { ...t, beltItem: null };
    }
    // 行き先が埋まっている・ベルト以外 → 待機（アイテムはそのまま）
  }

  return [next, moneyFromHub];
}

// ════════════════════════════════════════════════════════════════════
//  ■ メインゲームティック計算
// ════════════════════════════════════════════════════════════════════

/**
 * 1ティック分のゲーム状態を計算して返す純粋関数。
 * setState の中で呼び出すことで、副作用ゼロでテスト可能。
 */
export function calcTick(state: GameState): Partial<GameState> {
  const newTick   = state.tick + 1;
  const dayPhase  = calcDayPhase(newTick);

  // 電力・発電量を集計
  const { powerUsed, solarGen, batteryCnt } = calcPowerStats(state.grid, dayPhase);

  // 蓄電池の充放電
  let batteryCharge = state.batteryCharge;
  const battMax     = batteryCnt * BATTERY_CAPACITY;

  if (dayPhase === "day") {
    // 昼: 余剰電力で充電
    const surplus = Math.max(0, solarGen - powerUsed);
    batteryCharge = Math.min(battMax, batteryCharge + Math.min(surplus, BATTERY_CHARGE_RATE * batteryCnt));
  } else {
    // 夜: 蓄電池から放電
    const discharge = Math.min(batteryCharge, BATTERY_DISCHARGE_RATE * batteryCnt);
    batteryCharge = Math.max(0, batteryCharge - discharge);
  }

  // 実効電力最大値（ソーラー + 今ティックの蓄電池放電）
  const batterySupply = dayPhase === "night"
    ? Math.min(state.batteryCharge, BATTERY_DISCHARGE_RATE * batteryCnt)
    : 0;
  const powerMax  = solarGen + batterySupply;
  const powerOk   = powerUsed <= powerMax || powerUsed === 0;
  const efficiency = powerOk ? 1.0 : 0.5;

  const drillBonus = state.upgrades.turbodrillBoost ? 1 : 0;

  // 物流処理（ベルト搬送 + Hub売却）
  const [newGrid, moneyFromHub] = processBeltTick(state.grid, drillBonus, efficiency);

  // インベントリへの直接加算は行わない（物流経由のみ）
  // ただし、ベルトが接続されていないドリルはインベントリへ
  let stonePlus = 0, ironPlus = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = state.grid[r][c];
      if (t.type !== "stone_drill" && t.type !== "iron_drill") continue;

      // 隣にベルトやHubがない孤立ドリルはインベントリへ直接
      let hasBeltNeighbor = false;
      for (const dir of DIR_ORDER) {
        const nb = neighborOf(r, c, dir);
        if (!nb) continue;
        const [nr, nc] = nb;
        const nbType = state.grid[nr][nc].type;
        if (nbType === "belt" || nbType === "hub") { hasBeltNeighbor = true; break; }
      }
      if (!hasBeltNeighbor) {
        const prod = (1 + drillBonus) * efficiency;
        if (t.type === "stone_drill") stonePlus += prod;
        if (t.type === "iron_drill")  ironPlus  += prod;
      }
    }
  }

  return {
    tick:    newTick,
    dayPhase,
    powerUsed,
    powerMax,
    batteryCharge,
    batteryMax: battMax,
    grid:    newGrid,
    money:   state.money + moneyFromHub,
    stone:   state.stone + stonePlus,
    iron:    state.iron  + ironPlus,
  };
}

// ════════════════════════════════════════════════════════════════════
//  ■ 表示用ユーティリティ
// ════════════════════════════════════════════════════════════════════

/** 数値を K / M 表記にフォーマットする */
export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return Math.floor(n).toString();
}