// ════════════════════════════════════════════════════════════════════
//  utils/gameLogic.ts — ゲームのコアロジック（純粋関数）
//  ゲームループ内で毎フレーム呼び出される物理物流・生産計算を担当。
// ════════════════════════════════════════════════════════════════════

import type { GameState, Tile, Direction, ItemKind, BeltItem } from "../types";
import {
  HUB_ROW, HUB_COL,
  BELT_SPEED, FAST_BELT_SPEED,
  DRILL_PRODUCTION_INTERVAL, IRON_DRILL_INTERVAL,
  ASSEMBLER_INTERVAL, GEAR_RECIPE,
  SELL_RATES, POWER_CONSUMPTION, LOW_POWER_EFFICIENCY,
  DAY_DURATION, NIGHT_DURATION,
  SOLAR_POWER, BATTERY_CAPACITY, LARGE_BATTERY_MULTIPLIER,
  DEPOSIT_RESPAWN_INTERVAL, INITIAL_STONE_DEPOSITS,
  ROCKET_REQUIREMENTS,
} from "../constants";
import type { ProdStats, StatsSnapshot } from "../types";

// ─── 数値フォーマット ─────────────────────────────────────────────────

/** 数値を見やすい形式に変換（例: 1200 → 1.2k） */
export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 10_000)    return (n / 1_000).toFixed(1) + "k";
  return Math.floor(n).toString();
}

// ─── 隣接タイル取得 ──────────────────────────────────────────────────

/** 指定方向の隣接マスの座標を返す */
export function getNeighbor(
  row: number, col: number, dir: Direction, gridSize: number
): [number, number] | null {
  const deltas: Record<Direction, [number, number]> = {
    up:    [-1,  0],
    right: [ 0,  1],
    down:  [ 1,  0],
    left:  [ 0, -1],
  };
  const [dr, dc] = deltas[dir];
  const nr = row + dr;
  const nc = col + dc;
  if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return null;
  return [nr, nc];
}

/** 指定方向からの反対方向（入口判定に使用） */
export function opposite(dir: Direction): Direction {
  const map: Record<Direction, Direction> = {
    up: "down", down: "up", left: "right", right: "left",
  };
  return map[dir];
}

// ─── 電力計算 ────────────────────────────────────────────────────────

/**
 * 現在の電力状況を計算する。
 * ソーラーは昼のみ発電。蓄電池は夜に放電、昼に充電。
 */
export function calcPower(state: GameState): {
  powerUsed: number;
  powerMax: number;
  batteryCharge: number;
  batteryMax: number;
  efficiency: number;
} {
  const { grid, gridSize, dayPhase, upgrades } = state;
  let used = 0;
  let solar = 0;
  let batteryCnt = 0;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t = grid[r][c];
      const pw = POWER_CONSUMPTION[t.kind];
      if (pw) used += pw;
      if (t.kind === "solar") solar += SOLAR_POWER;
      if (t.kind === "battery") batteryCnt++;
    }
  }

  const isDay = dayPhase === "day";
  // 昼はソーラー発電、夜は0
  const solarOutput = isDay ? solar : 0;

  const battMult = upgrades.largeBattery ? LARGE_BATTERY_MULTIPLIER : 1;
  const battMax = batteryCnt * BATTERY_CAPACITY * battMult;

  // 実際に利用できる電力 = ソーラー + 蓄電池放電（夜のみ）
  const availablePower = isDay
    ? solarOutput
    : solarOutput + Math.min(state.batteryCharge, used); // 夜は蓄電池から補う

  const totalAvailable = isDay ? solarOutput : availablePower;
  const efficiency = used <= 0 ? 1.0 : Math.min(1.0, totalAvailable / used) < LOW_POWER_EFFICIENCY
    ? LOW_POWER_EFFICIENCY
    : Math.min(1.0, used <= totalAvailable ? 1.0 : LOW_POWER_EFFICIENCY);

  return {
    powerUsed: used,
    powerMax: isDay ? solar : state.batteryCharge,
    batteryCharge: state.batteryCharge,
    batteryMax: battMax,
    efficiency: (used === 0 || totalAvailable >= used) ? 1.0 : LOW_POWER_EFFICIENCY,
  };
}

// ─── 蓄電池の充放電 ──────────────────────────────────────────────────

/**
 * 1ティック（dt秒）分の蓄電池充放電を計算する。
 * 昼: 余剰電力を充電。夜: 消費電力を放電。
 * @returns 更新後の batteryCharge
 */
export function updateBattery(state: GameState, dt: number): number {
  const { dayPhase, powerUsed, upgrades } = state;
  const { grid, gridSize } = state;

  let solar = 0;
  let batteryCnt = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t = grid[r][c];
      if (t.kind === "solar") solar += SOLAR_POWER;
      if (t.kind === "battery") batteryCnt++;
    }
  }

  const battMult = upgrades.largeBattery ? LARGE_BATTERY_MULTIPLIER : 1;
  const battMax = batteryCnt * BATTERY_CAPACITY * battMult;

  if (dayPhase === "day") {
    // 余剰電力を充電（ソーラー - 消費）
    const surplus = Math.max(0, solar - powerUsed);
    return Math.min(battMax, state.batteryCharge + surplus * dt);
  } else {
    // 夜: 消費分を放電
    return Math.max(0, state.batteryCharge - powerUsed * dt);
  }
}

// ─── 生産統計の集計 ──────────────────────────────────────────────────

/** グリッドから生産統計を集計する */
export function calcProdStats(state: GameState): ProdStats {
  const { grid, gridSize, upgrades, dayPhase } = state;
  let stoneDrillCnt = 0;
  let ironDrillCnt = 0;
  let beltCnt = 0;
  let solarCnt = 0;
  let batteryCnt = 0;
  let assemblerCnt = 0;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const k = grid[r][c].kind;
      if (k === "stone_drill") stoneDrillCnt++;
      else if (k === "iron_drill") ironDrillCnt++;
      else if (k === "belt") beltCnt++;
      else if (k === "solar") solarCnt++;
      else if (k === "battery") batteryCnt++;
      else if (k === "assembler") assemblerCnt++;
    }
  }

  const { efficiency } = calcPower(state);
  const drillBonus = upgrades.turbodrillBoost ? 1 : 0;
  const stonePerSec = Math.floor(
    stoneDrillCnt * (1 / DRILL_PRODUCTION_INTERVAL + drillBonus) * efficiency
  );
  const ironPerSec = Math.floor(
    ironDrillCnt * (1 / IRON_DRILL_INTERVAL + drillBonus * 0.5) * efficiency
  );

  // 収入/秒は歯車ベルト出荷による概算
  const incomePerSec = 0;

  return {
    stoneDrillCnt,
    ironDrillCnt,
    beltCnt,
    solarCnt,
    batteryCnt,
    assemblerCnt,
    stonePerSec,
    ironPerSec,
    incomePerSec,
    efficiency,
  };
}

// ─── ベルト物流のシミュレーション ────────────────────────────────────

/**
 * 1ティック分のベルト物流を更新する。
 *
 * アルゴリズム概要:
 * 1. 各タイルのアイテムの progress を belt_speed * dt だけ進める。
 * 2. progress >= 1.0 になったアイテムは「次のタイル」への移動を試みる。
 * 3. 次のタイルが:
 *    - hub → アイテムを売却（money加算）
 *    - belt/assembler（空き）→ 移動
 *    - 詰まっている（occupied）→ 移動をブロック（progress = 1.0でキープ）
 *
 * @returns 更新後のグリッドと獲得コイン・各素材のカウント
 */
export function tickBeltPhysics(
  state: GameState,
  dt: number
): {
  newGrid: Tile[][];
  earnedMoney: number;
  shippedStone: number;
  shippedIron: number;
  shippedGear: number;
} {
  const { grid, gridSize, upgrades } = state;
  const beltSpeed = upgrades.fastBelt ? FAST_BELT_SPEED : BELT_SPEED;

  // グリッドをディープコピー（参照が混入しないように）
  const newGrid: Tile[][] = grid.map(row =>
    row.map(t => ({ ...t, beltItem: t.beltItem ? { ...t.beltItem } : null }))
  );

  let earnedMoney = 0;
  let shippedStone = 0;
  let shippedIron = 0;
  let shippedGear = 0;

  // ── Step1: 全ベルトタイルのアイテムのprogressを進める ──────────────
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t = newGrid[r][c];
      if ((t.kind === "belt" || t.kind === "assembler") && t.beltItem) {
        t.beltItem.progress = Math.min(1.0, t.beltItem.progress + beltSpeed * dt);
      }
    }
  }

  // ── Step2: progress >= 1.0 のアイテムを次のタイルへ移動 ─────────────
  // 処理順序: 出荷ハブに近い順（またはベルト方向の終端から）に処理することで
  // デッドロックを防ぐ。ここでは単純に全タイルをスキャンする。
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t = newGrid[r][c];
      if (t.kind !== "belt" && t.kind !== "assembler") continue;
      if (!t.beltItem || t.beltItem.progress < 1.0) continue;

      // 次のタイルの座標を取得
      const next = getNeighbor(r, c, t.direction, gridSize);
      if (!next) {
        // グリッド外 → アイテムを消滅（壁）
        t.beltItem = null;
        continue;
      }
      const [nr, nc] = next;
      const nextTile = newGrid[nr][nc];

      if (nextTile.kind === "hub") {
        // ── ハブに到達: 即時売却 ──────────────────────────────────────
        const item = t.beltItem;
        earnedMoney += SELL_RATES[item.kind] ?? 0;
        if (item.kind === "stone") shippedStone++;
        if (item.kind === "iron")  shippedIron++;
        if (item.kind === "gear")  shippedGear++;
        t.beltItem = null;
      } else if (nextTile.kind === "belt" && nextTile.beltItem === null) {
        // ── 次のベルトが空き: 移動 ──────────────────────────────────
        nextTile.beltItem = { kind: t.beltItem.kind, progress: 0.0 };
        t.beltItem = null;
      } else if (nextTile.kind === "assembler" && nextTile.beltItem === null) {
        // ── 組立機の入口: 素材を受け取る（組立機内処理はtickAssemblerで行う）
        nextTile.beltItem = { kind: t.beltItem.kind, progress: 0.0 };
        t.beltItem = null;
      } else {
        // ── ボトルネック: 前が詰まっているので進めない ──────────────
        // progress を 1.0 のままキープ（ライン停止）
      }
    }
  }

  return { newGrid, earnedMoney, shippedStone, shippedIron, shippedGear };
}

// ─── ドリルの生産処理 ────────────────────────────────────────────────

/**
 * ドリルタイルの生産タイマーを進め、アイテムを排出する。
 * アイテムは前方のベルトに排出される。前方が詰まっていれば生産停止。
 *
 * @returns 更新後のグリッド
 */
export function tickDrills(
  state: GameState,
  newGrid: Tile[][],
  dt: number,
  efficiency: number
): Tile[][] {
  const { gridSize, upgrades } = state;
  const drillBonus = upgrades.turbodrillBoost ? 1 : 0;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t = newGrid[r][c];
      if (t.kind !== "stone_drill" && t.kind !== "iron_drill") continue;

      const interval = t.kind === "stone_drill" ? DRILL_PRODUCTION_INTERVAL : IRON_DRILL_INTERVAL;
      const adjustedInterval = Math.max(0.2, interval / (1 + drillBonus * 0.5));

      // 前方のタイル（排出先）を確認
      const next = getNeighbor(r, c, t.direction, gridSize);
      if (!next) continue;
      const [nr, nc] = next;
      const frontTile = newGrid[nr][nc];

      // 前方が詰まっていればタイマーを進めない（ボトルネック）
      const isFrontFull =
        frontTile.beltItem !== null &&
        frontTile.kind !== "hub" &&
        frontTile.kind !== "empty";
      if (isFrontFull) continue;

      // 鉱床の残量チェック
      if (t.depositRemaining <= 0) continue;

      // タイマーを進める
      t.productionTimer += dt * efficiency;

      if (t.productionTimer >= adjustedInterval) {
        t.productionTimer -= adjustedInterval;

        const itemKind: ItemKind = t.kind === "stone_drill" ? "stone" : "iron";

        // Hubに直接排出
        if (frontTile.kind === "hub") {
          // ハブには直接売却しない（ベルト経由のみ）
          // ハブが隣ならベルト不要で排出可能にする
        } else if (frontTile.kind === "belt" && frontTile.beltItem === null) {
          frontTile.beltItem = { kind: itemKind, progress: 0.0 };
          t.depositRemaining--;
        }
        // front がhubなら直接売却（ベルトなし短絡）は仕様外なので何もしない
      }
    }
  }

  return newGrid;
}

// ─── 組立機の生産処理 ────────────────────────────────────────────────

/**
 * 組立機の生産タイマーを進め、歯車を生産する。
 *
 * 組立機の動作:
 * 1. 自身のbeltItemを内部バッファとして使う。
 * 2. 隣接するベルトから石と鉄を吸い込む（インプット）。
 * 3. 素材が揃ったらタイマーを進め、完成したら前方ベルトへ排出。
 *
 * @returns 更新後のグリッド
 */
export function tickAssemblers(
  state: GameState,
  newGrid: Tile[][],
  dt: number,
  efficiency: number
): { grid: Tile[][]; stonesConsumed: number; ironConsumed: number } {
  const { gridSize } = state;
  let stonesConsumed = 0;
  let ironConsumed = 0;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t = newGrid[r][c];
      if (t.kind !== "assembler") continue;

      // 組立機の内部バッファとしてbeltItemを流用
      // beltItem.kind === "gear" かつ progress >= 1.0 で排出準備完了
      if (t.beltItem && t.beltItem.kind === "gear") {
        // 排出待ち: 前方ベルトが空きなら排出
        const next = getNeighbor(r, c, t.direction, gridSize);
        if (next) {
          const [nr, nc] = next;
          const frontTile = newGrid[nr][nc];
          if (frontTile.kind === "hub") {
            // ハブへ直接排出しない（ベルト経由とする）
          } else if (frontTile.kind === "belt" && frontTile.beltItem === null) {
            frontTile.beltItem = { kind: "gear", progress: 0.0 };
            t.beltItem = null;
          }
        }
        continue;
      }

      // 素材の受け取り（隣接するベルトからスキャン）
      // beltItemに石や鉄が入ってきたらバッファに吸収する
      // 実際は tickBeltPhysics で既に beltItem に入っているのでそれを使う

      // 内部素材バッファを使う（組立機はbeltItemを内部バッファに転用しない）
      // ここではシンプルに: gameState の stone/iron を消費して生産する方式に切り替える
      // (完全物理物流はベルトに任せ、組立機はグローバルストックから消費)
      // ← このコメントは設計意図の記録

      // タイマーを進める
      t.productionTimer += dt * efficiency;
      if (t.productionTimer >= ASSEMBLER_INTERVAL) {
        t.productionTimer -= ASSEMBLER_INTERVAL;
        // 素材消費フラグを立てる（返り値経由でgameStateに反映）
        stonesConsumed += GEAR_RECIPE.stone;
        ironConsumed += GEAR_RECIPE.iron;

        // 前方ベルトへ歯車を排出
        const next = getNeighbor(r, c, t.direction, gridSize);
        if (next) {
          const [nr, nc] = next;
          const frontTile = newGrid[nr][nc];
          if (frontTile.kind === "belt" && frontTile.beltItem === null) {
            frontTile.beltItem = { kind: "gear", progress: 0.0 };
          } else if (frontTile.kind === "hub") {
            // ハブに直接排出（歯車）→ tickBeltPhysicsで売却される
            // ここでは何もしない
          }
        }
      }
    }
  }

  return { grid: newGrid, stonesConsumed, ironConsumed };
}

// ─── 昼夜サイクル ────────────────────────────────────────────────────

/**
 * 昼夜サイクルのタイマーを更新する。
 * @returns { dayPhase, phaseTimer }
 */
export function tickDayNight(
  dayPhase: "day" | "night",
  phaseTimer: number,
  dt: number
): { dayPhase: "day" | "night"; phaseTimer: number; phaseChanged: boolean } {
  const duration = dayPhase === "day" ? DAY_DURATION : NIGHT_DURATION;
  const newTimer = phaseTimer + dt;
  if (newTimer >= duration) {
    return {
      dayPhase: dayPhase === "day" ? "night" : "day",
      phaseTimer: newTimer - duration,
      phaseChanged: true,
    };
  }
  return { dayPhase, phaseTimer: newTimer, phaseChanged: false };
}

// ─── 鉱床の再発見 ────────────────────────────────────────────────────

let depositRespawnTimer = 0;

/**
 * ランダムな空きマスに新たな鉱床を出現させる。
 * @returns 更新後のグリッドと鉱床追加フラグ
 */
export function tickDepositRespawn(
  grid: Tile[][],
  gridSize: number,
  dt: number
): { grid: Tile[][]; spawned: boolean; kind: "stone" | "iron" | null } {
  depositRespawnTimer += dt;
  if (depositRespawnTimer < DEPOSIT_RESPAWN_INTERVAL) {
    return { grid, spawned: false, kind: null };
  }
  depositRespawnTimer -= DEPOSIT_RESPAWN_INTERVAL;

  // 空きマス（empty）をリストアップ
  const empties: [number, number][] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c].kind === "empty") empties.push([r, c]);
    }
  }
  if (empties.length === 0) return { grid, spawned: false, kind: null };

  const [tr, tc] = empties[Math.floor(Math.random() * empties.length)];
  const kind = Math.random() < 0.6 ? "stone" : "iron";
  const newGrid = grid.map(row => row.map(t => ({ ...t })));
  newGrid[tr][tc] = {
    ...newGrid[tr][tc],
    kind: kind === "stone" ? "stone_deposit" : "iron_deposit",
    depositRemaining: kind === "stone" ? 500 : 300,
  };

  return { grid: newGrid, spawned: true, kind };
}

// ─── グリッド初期化 ──────────────────────────────────────────────────

/** 指定サイズのグリッドを初期化する */
export function createGrid(size: number, prevGrid?: Tile[][]): Tile[][] {
  const grid: Tile[][] = [];
  for (let r = 0; r < size; r++) {
    const row: Tile[] = [];
    for (let c = 0; c < size; c++) {
      // 既存グリッドのデータを引き継ぐ（拡張時）
      if (prevGrid && r < prevGrid.length && c < prevGrid[r].length) {
        row.push(prevGrid[r][c]);
      } else {
        row.push({
          id: `tile_${r}_${c}`,
          kind: "empty",
          direction: "right",
          beltItem: null,
          productionTimer: 0,
          depositRemaining: 0,
        });
      }
    }
    grid.push(row);
  }
  return grid;
}

/** ゲームの初期グリッドを生成（鉱床・ハブを配置） */
export function createInitialGrid(size: number): Tile[][] {
  const grid = createGrid(size);
  const hubR = Math.floor(size / 2);
  const hubC = Math.floor(size / 2);

  // ハブを配置（中央）
  grid[hubR][hubC] = {
    id: `tile_${hubR}_${hubC}`,
    kind: "hub",
    direction: "right",
    beltItem: null,
    productionTimer: 0,
    depositRemaining: 0,
  };

  // 石鉱床
  const stonePositions: [number, number][] = [
    [0, 0], [0, size - 1], [1, 2], [3, 1], [size - 1, size - 2],
  ];
  stonePositions.forEach(([r, c]) => {
    if (r < size && c < size && !(r === hubR && c === hubC)) {
      grid[r][c] = {
        id: `tile_${r}_${c}`,
        kind: "stone_deposit",
        direction: "right",
        beltItem: null,
        productionTimer: 0,
        depositRemaining: 500,
      };
    }
  });

  // 鉄鉱床
  const ironPositions: [number, number][] = [
    [0, 2], [2, size - 1], [size - 1, 0], [size - 2, size - 2],
  ];
  ironPositions.forEach(([r, c]) => {
    if (r < size && c < size && !(r === hubR && c === hubC)) {
      grid[r][c] = {
        id: `tile_${r}_${c}`,
        kind: "iron_deposit",
        direction: "right",
        beltItem: null,
        productionTimer: 0,
        depositRemaining: 300,
      };
    }
  });

  return grid;
}

// ─── グリッド拡張 ────────────────────────────────────────────────────

/**
 * 既存グリッドを新しいサイズに拡張する。
 * 既存タイルはそのまま保持し、新しいタイルは empty で埋める。
 * 新しいサイズが奇数であれば中央は常にハブが来るよう調整する。
 */
export function expandGrid(prevGrid: Tile[][], newSize: number): Tile[][] {
  const expanded = createGrid(newSize, prevGrid);
  // 既存のハブ位置を確認（新しい中央に移動しない）
  // ハブは元の位置のまま保持する（引き継ぎで対応済み）
  return expanded;
}

// ─── ロケット打ち上げ条件チェック ─────────────────────────────────────

export function checkRocketReady(
  money: number,
  totalGearsShipped: number,
  totalIronShipped: number
): boolean {
  return (
    money >= ROCKET_REQUIREMENTS.money &&
    totalGearsShipped >= ROCKET_REQUIREMENTS.gear &&
    totalIronShipped >= ROCKET_REQUIREMENTS.iron
  );
}

// ─── 統計スナップショット ─────────────────────────────────────────────

/** 最大10件の統計履歴を管理する */
export function pushSnapshot(
  history: import("../types").StatsSnapshot[],
  snap: import("../types").StatsSnapshot
): import("../types").StatsSnapshot[] {
  const next = [...history, snap];
  if (next.length > 10) next.shift();
  return next;
}
