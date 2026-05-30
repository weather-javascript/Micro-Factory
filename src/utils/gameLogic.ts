// ════════════════════════════════════════════════════════════════════
//  utils/gameLogic.ts — Micro-Factory 3D ゲームコアロジック
// ════════════════════════════════════════════════════════════════════

import type {
  GameState, Tile, Direction, ItemKind,
  ProdStats, StatsSnapshot, DayPhase,
} from "../types";
import {
  STONE_DRILL_INTERVAL, IRON_DRILL_INTERVAL, URANIUM_DRILL_INTERVAL,
  ASSEMBLER_INTERVAL, FUEL_ROD_INTERVAL,
  BELT_SPEED_NORMAL, BELT_SPEED_FAST,
  SOLAR_POWER_DAY, STEAM_ENGINE_POWER, NUCLEAR_POWER,
  BATTERY_CAPACITY, LARGE_BATTERY_MULT, LOW_POWER_EFFICIENCY,
  POWER_CONSUMPTION,
  GEAR_RECIPE, FUEL_ROD_RECIPE,
  WASTE_CHANCE_NORMAL, WASTE_CHANCE_PROD,
  SELL_RATES, PHASE_DURATIONS,
  DEPOSIT_RESPAWN_SECS,
  TILE_SIZE,
  ROCKET_REQUIREMENTS,
} from "../constants";

// ─── モジュール倍率（constants.tsに未定義のためここで宣言） ──────────
const _MODULE_SPEED_MULT = 1.5;
const _MODULE_PROD_MULT  = 2.0;

// ─── 数値フォーマット ─────────────────────────────────────────────────
export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 10_000)    return (n / 1_000).toFixed(1) + "k";
  return Math.floor(n).toString();
}

// ─── タイル座標 → 3D世界座標 ────────────────────────────────────────
export function tileToWorld(row: number, col: number, gridSize: number): [number, number, number] {
  const offset = (gridSize - 1) / 2;
  return [
    (col - offset) * TILE_SIZE,
    0,
    (row - offset) * TILE_SIZE,
  ];
}

// ─── 方向ユーティリティ ──────────────────────────────────────────────
export function getNeighbor(
  row: number, col: number, dir: Direction, gridSize: number,
): [number, number] | null {
  const d: Record<Direction, [number, number]> = {
    up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1],
  };
  const [dr, dc] = d[dir];
  const nr = row + dr, nc = col + dc;
  if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return null;
  return [nr, nc];
}

// ─── 電力計算 ────────────────────────────────────────────────────────
export function calcPower(state: GameState): {
  powerUsed:      number;
  powerGenerated: number;
  batteryMax:     number;
  efficiency:     number;
} {
  const { grid, gridSize, dayPhase, upgrades } = state;
  let used = 0, solar = 0, steam = 0, nuclear = 0, batteryCnt = 0;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t = grid[r][c];
      let pw = POWER_CONSUMPTION[t.kind] ?? 0;
      if (
        (t.kind === "stone_drill" || t.kind === "iron_drill" ||
         t.kind === "uranium_drill" || t.kind === "assembler") &&
        t.module === "speed"
      ) pw *= 2.0;
      used += pw;
      if (t.kind === "solar")                             solar++;
      if (t.kind === "battery")                           batteryCnt++;
      if (t.kind === "steam_engine"  && t.waterFed)       steam   += STEAM_ENGINE_POWER;
      if (t.kind === "nuclear_plant" && t.fuelFed)        nuclear += NUCLEAR_POWER;
    }
  }

  const solarMult  = dayPhase === "day" ? 1.0 : dayPhase === "dusk" ? 0.5 : dayPhase === "dawn" ? 0.3 : 0;
  const solarOut   = solar * SOLAR_POWER_DAY * solarMult;
  const battMult   = upgrades.largeBattery ? LARGE_BATTERY_MULT : 1;
  // ★修正: battMax → batteryMax に統一
  const batteryMax = batteryCnt * BATTERY_CAPACITY * battMult;
  const generated  = solarOut + steam + nuclear;
  const available  = generated + Math.min(state.batteryCharge, Math.max(0, used - generated));
  const efficiency = used <= 0 ? 1.0 : available >= used ? 1.0 : LOW_POWER_EFFICIENCY;

  return { powerUsed: used, powerGenerated: generated, batteryMax, efficiency };
}

// ─── 蓄電池充放電 ────────────────────────────────────────────────────
export function updateBattery(
  state: GameState, dt: number, batteryMax: number,
): number {
  const { powerUsed, dayPhase, grid, gridSize } = state;
  let solar = 0;
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      if (grid[r][c].kind === "solar") solar += SOLAR_POWER_DAY;

  const solarMult = dayPhase === "day" ? 1.0 : dayPhase === "dusk" ? 0.5 : dayPhase === "dawn" ? 0.3 : 0;
  const solarOut  = solar * solarMult;
  let steamNuclear = 0;
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++) {
      const t = grid[r][c];
      if (t.kind === "steam_engine"  && t.waterFed) steamNuclear += STEAM_ENGINE_POWER;
      if (t.kind === "nuclear_plant" && t.fuelFed)  steamNuclear += NUCLEAR_POWER;
    }

  const generated = solarOut + steamNuclear;
  if (generated >= powerUsed) {
    const surplus = generated - powerUsed;
    return Math.min(batteryMax, state.batteryCharge + surplus * dt);
  } else {
    const deficit = powerUsed - generated;
    return Math.max(0, state.batteryCharge - deficit * dt);
  }
}

// ─── 生産統計 ────────────────────────────────────────────────────────
export function calcProdStats(state: GameState): ProdStats {
  const { grid, gridSize, upgrades, ngPlusBuff } = state;
  let stoneDrillCnt = 0, ironDrillCnt = 0, uraniumDrillCnt = 0;
  let beltCnt = 0, solarCnt = 0, batteryCnt = 0, assemblerCnt = 0;
  let waterPumpCnt = 0, steamEngineCnt = 0, nuclearPlantCnt = 0, wasteDisposalCnt = 0;

  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      switch (grid[r][c].kind) {
        case "stone_drill":    stoneDrillCnt++;    break;
        case "iron_drill":     ironDrillCnt++;     break;
        case "uranium_drill":  uraniumDrillCnt++;  break;
        case "belt":           beltCnt++;          break;
        case "solar":          solarCnt++;         break;
        case "battery":        batteryCnt++;       break;
        case "assembler":      assemblerCnt++;     break;
        case "water_pump":     waterPumpCnt++;     break;
        case "steam_engine":   steamEngineCnt++;   break;
        case "nuclear_plant":  nuclearPlantCnt++;  break;
        case "waste_disposal": wasteDisposalCnt++; break;
      }

  const { efficiency, powerUsed, powerGenerated } = calcPower(state);
  const drillBonus  = upgrades.turbodrillBoost ? 0.5 : 0;
  const ngProd      = ngPlusBuff.productionMultiplier;
  const stonePerSec = Math.floor(stoneDrillCnt * (1 / STONE_DRILL_INTERVAL) * (1 + drillBonus) * efficiency * ngProd);
  const ironPerSec  = Math.floor(ironDrillCnt  * (1 / IRON_DRILL_INTERVAL)  * (1 + drillBonus) * efficiency * ngProd);

  return {
    stoneDrillCnt, ironDrillCnt, uraniumDrillCnt, beltCnt, solarCnt,
    batteryCnt, assemblerCnt, waterPumpCnt, steamEngineCnt,
    nuclearPlantCnt, wasteDisposalCnt,
    stonePerSec, ironPerSec,
    powerBalance: powerGenerated - powerUsed,
    efficiency,
  };
}

// ─── 昼夜サイクル ────────────────────────────────────────────────────
export function tickDayNight(
  phase: DayPhase, timer: number, dt: number,
): { dayPhase: DayPhase; phaseTimer: number; lightNorm: number; phaseChanged: boolean } {
  const dur      = PHASE_DURATIONS[phase];
  const newTimer = timer + dt;
  let changed    = false;
  let nextPhase  = phase;

  if (newTimer >= dur) {
    changed = true;
    const order: DayPhase[] = ["day", "dusk", "night", "dawn"];
    const idx = order.indexOf(phase);
    nextPhase = order[(idx + 1) % 4];
  }

  const total = PHASE_DURATIONS.day + PHASE_DURATIONS.dusk + PHASE_DURATIONS.night + PHASE_DURATIONS.dawn;
  const phaseOffsets: Record<DayPhase, number> = {
    day:   0,
    dusk:  PHASE_DURATIONS.day,
    night: PHASE_DURATIONS.day + PHASE_DURATIONS.dusk,
    dawn:  PHASE_DURATIONS.day + PHASE_DURATIONS.dusk + PHASE_DURATIONS.night,
  };
  const elapsed   = phaseOffsets[phase] + Math.min(newTimer, dur);
  const lightNorm = elapsed / total;

  return {
    dayPhase:     changed ? nextPhase : phase,
    phaseTimer:   changed ? newTimer - dur : newTimer,
    lightNorm,
    phaseChanged: changed,
  };
}

// ─── ベルト物流 ──────────────────────────────────────────────────────
export function tickBeltPhysics(
  state: GameState, dt: number,
): {
  newGrid:        Tile[][];
  earnedMoney:    number;
  shippedStone:   number;
  shippedIron:    number;
  shippedUranium: number;
  shippedGear:    number;
  shippedFuel:    number;
  shippedWaste:   number;
} {
  const { grid, gridSize, upgrades, ngPlusBuff } = state;
  const beltSpeed = upgrades.fastBelt ? BELT_SPEED_FAST : BELT_SPEED_NORMAL;
  const ngSpeed   = ngPlusBuff.speedMultiplier;

  const ng: Tile[][] = grid.map(row =>
    row.map(t => ({ ...t, beltItem: t.beltItem ? { ...t.beltItem } : null }))
  );

  let earnedMoney = 0, shippedStone = 0, shippedIron = 0, shippedUranium = 0;
  let shippedGear = 0, shippedFuel = 0, shippedWaste = 0;

  // Step1: progress を進める
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++) {
      const t = ng[r][c];
      if ((t.kind === "belt" || t.kind === "filter") && t.beltItem)
        t.beltItem.progress = Math.min(1.0, t.beltItem.progress + beltSpeed * ngSpeed * dt);
    }

  // Step2: progress >= 1.0 → 次タイルへ移動
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t         = ng[r][c];
      const isCarrier = t.kind === "belt" || t.kind === "filter";
      if (!isCarrier || !t.beltItem || t.beltItem.progress < 1.0) continue;

      // フィルター分配器の出口方向決定
      let outDir = t.direction;
      if (t.kind === "filter" && t.beltItem) {
        const k = t.beltItem.kind as keyof typeof t.filterConfig;
        if (t.filterConfig[k]) outDir = t.filterConfig[k]!;
      }

      const next = getNeighbor(r, c, outDir, gridSize);
      if (!next) { t.beltItem = null; continue; }
      const [nr, nc] = next;
      const nxt = ng[nr][nc];

      if (nxt.kind === "hub" || nxt.kind === "space_elevator") {
        const item = t.beltItem;
        earnedMoney += SELL_RATES[item.kind] ?? 0;
        if (item.kind === "stone")    shippedStone++;
        if (item.kind === "iron")     shippedIron++;
        if (item.kind === "uranium")  shippedUranium++;
        if (item.kind === "gear")     shippedGear++;
        if (item.kind === "fuel_rod") shippedFuel++;
        if (item.kind === "waste" || item.kind === "radio_waste") shippedWaste++;
        t.beltItem = null;
      } else if (nxt.kind === "waste_disposal") {
        const { efficiency } = calcPower(state);
        if (efficiency >= 1.0) t.beltItem = null;
        // 電力不足 → ボトルネック
      } else if (nxt.kind === "nuclear_plant") {
        if (t.beltItem.kind === "fuel_rod" && !nxt.fuelFed) {
          nxt.fuelFed = true;
          t.beltItem  = null;
        }
      } else if ((nxt.kind === "belt" || nxt.kind === "filter") && nxt.beltItem === null) {
        const [wx, , wz] = tileToWorld(nr, nc, gridSize);
        nxt.beltItem = { kind: t.beltItem.kind, progress: 0.0, worldX: wx, worldZ: wz };
        t.beltItem   = null;
      } else if (nxt.kind === "assembler" && nxt.beltItem === null) {
        const [wx, , wz] = tileToWorld(nr, nc, gridSize);
        nxt.beltItem = { kind: t.beltItem.kind, progress: 0.0, worldX: wx, worldZ: wz };
        t.beltItem   = null;
      }
      // 上記以外 → ボトルネック
    }
  }

  return { newGrid: ng, earnedMoney, shippedStone, shippedIron, shippedUranium, shippedGear, shippedFuel, shippedWaste };
}

// ─── ドリル生産 ──────────────────────────────────────────────────────
export function tickDrills(
  state: GameState, ng: Tile[][], dt: number, efficiency: number,
): Tile[][] {
  const { gridSize, upgrades, ngPlusBuff } = state;
  const drillBonus = upgrades.turbodrillBoost ? 0.5 : 0;
  const ngSpeed    = ngPlusBuff.speedMultiplier;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t       = ng[r][c];
      const isDrill = t.kind === "stone_drill" || t.kind === "iron_drill" || t.kind === "uranium_drill";
      if (!isDrill || t.depositRemaining <= 0) continue;

      const next = getNeighbor(r, c, t.direction, gridSize);
      if (!next) continue;
      const [nr, nc] = next;
      const front    = ng[nr][nc];
      if (front.beltItem !== null && front.kind !== "hub" && front.kind !== "space_elevator") continue;

      const baseInterval =
        t.kind === "stone_drill"   ? STONE_DRILL_INTERVAL :
        t.kind === "iron_drill"    ? IRON_DRILL_INTERVAL  :
        URANIUM_DRILL_INTERVAL;
      let interval = baseInterval / (1 + drillBonus) / ngSpeed;
      if (t.module === "speed") interval /= _MODULE_SPEED_MULT;

      t.productionTimer += dt * efficiency;
      if (t.productionTimer < interval) continue;
      t.productionTimer -= interval;
      t.depositRemaining--;

      const itemKind: ItemKind =
        t.kind === "stone_drill"   ? "stone"   :
        t.kind === "iron_drill"    ? "iron"    : "uranium";

      if (front.kind === "belt" && front.beltItem === null) {
        const [wx, , wz] = tileToWorld(nr, nc, gridSize);
        front.beltItem = { kind: itemKind, progress: 0.0, worldX: wx, worldZ: wz };
      }
    }
  }
  return ng;
}

// ─── 組立機生産 ──────────────────────────────────────────────────────
export function tickAssemblers(
  state: GameState, ng: Tile[][], dt: number, efficiency: number,
): { grid: Tile[][]; stonesConsumed: number; ironConsumed: number; uraniumConsumed: number; wasteProduced: number } {
  const { gridSize, ngPlusBuff } = state;
  const ngSpeed        = ngPlusBuff.speedMultiplier;
  const wasteReduction = ngPlusBuff.wasteReduction;
  let stonesConsumed = 0, ironConsumed = 0, uraniumConsumed = 0, wasteProduced = 0;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t = ng[r][c];
      if (t.kind !== "assembler") continue;

      // 排出待ちアイテムを前方ベルトへ押し出す
      if (t.beltItem && (
        t.beltItem.kind === "gear" || t.beltItem.kind === "fuel_rod" ||
        t.beltItem.kind === "waste" || t.beltItem.kind === "radio_waste"
      )) {
        const next = getNeighbor(r, c, t.direction, gridSize);
        if (next) {
          const [nr, nc] = next;
          const front    = ng[nr][nc];
          if (front.kind === "belt" && front.beltItem === null) {
            const [wx, , wz] = tileToWorld(nr, nc, gridSize);
            front.beltItem = { kind: t.beltItem.kind, progress: 0.0, worldX: wx, worldZ: wz };
            t.beltItem     = null;
          }
        }
        continue;
      }

      let interval = ASSEMBLER_INTERVAL / ngSpeed;
      if (t.module === "speed") interval /= _MODULE_SPEED_MULT;

      t.productionTimer += dt * efficiency;
      if (t.productionTimer < interval) continue;
      t.productionTimer -= interval;

      // レシピ判定
      const canFuelRod = state.uranium >= FUEL_ROD_RECIPE.uranium && state.iron >= FUEL_ROD_RECIPE.iron;
      const canGear    = state.stone   >= GEAR_RECIPE.stone       && state.iron >= GEAR_RECIPE.iron;
      if (!canGear && !canFuelRod) continue;

      const makeFuel         = canFuelRod && state.upgrades.nuclearUnlock;
      const prodKind: ItemKind = makeFuel ? "fuel_rod" : "gear";

      if (makeFuel) {
        ironConsumed    += FUEL_ROD_RECIPE.iron;
        uraniumConsumed += FUEL_ROD_RECIPE.uranium;
      } else {
        stonesConsumed += GEAR_RECIPE.stone;
        ironConsumed   += GEAR_RECIPE.iron;
      }

      const wasteChance = (t.module === "production" ? WASTE_CHANCE_PROD : WASTE_CHANCE_NORMAL) * (1 - wasteReduction);
      const hasWaste    = Math.random() < wasteChance;
      if (hasWaste) wasteProduced++;

      const next = getNeighbor(r, c, t.direction, gridSize);
      if (next) {
        const [nr, nc] = next;
        const front    = ng[nr][nc];
        if (front.kind === "belt" && front.beltItem === null) {
          const [wx, , wz] = tileToWorld(nr, nc, gridSize);
          const outKind: ItemKind = hasWaste ? (makeFuel ? "radio_waste" : "waste") : prodKind;
          front.beltItem = { kind: outKind, progress: 0.0, worldX: wx, worldZ: wz };
          if (hasWaste) {
            t.beltItem = { kind: prodKind, progress: 1.0, worldX: 0, worldZ: 0 };
          }
        }
      }
    }
  }

  return { grid: ng, stonesConsumed, ironConsumed, uraniumConsumed, wasteProduced };
}

// ─── 水システム ──────────────────────────────────────────────────────
export function tickWaterSystem(
  state: GameState, ng: Tile[][], dt: number, efficiency: number,
): Tile[][] {
  const { gridSize } = state;

  // フラグリセット
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++) {
      if (ng[r][c].kind === "steam_engine")  ng[r][c].waterFed = false;
      if (ng[r][c].kind === "nuclear_plant") ng[r][c].fuelFed  = false;
    }

  // 蒸気機関: 隣接ベルトの水を吸収
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t = ng[r][c];
      if (t.kind !== "steam_engine") continue;
      const dirs: Direction[] = ["up", "right", "down", "left"];
      for (const dir of dirs) {
        const nb = getNeighbor(r, c, dir, gridSize);
        if (!nb) continue;
        const [nr, nc] = nb;
        const belt     = ng[nr][nc];
        if (belt.kind === "belt" && belt.beltItem?.kind === "water") {
          belt.beltItem = null;
          t.waterFed    = true;
          break;
        }
      }
    }
  }

  // 給水ポンプ: 水源から水を生産
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t = ng[r][c];
      if (t.kind !== "water_pump") continue;
      const next = getNeighbor(r, c, t.direction, gridSize);
      if (!next) continue;
      const [nr, nc] = next;
      const front    = ng[nr][nc];
      if (front.kind !== "belt" || front.beltItem !== null) continue;
      t.productionTimer += dt * efficiency;
      if (t.productionTimer >= 1.5) {
        t.productionTimer -= 1.5;
        const [wx, , wz] = tileToWorld(nr, nc, gridSize);
        front.beltItem = { kind: "water", progress: 0.0, worldX: wx, worldZ: wz };
      }
    }
  }

  return ng;
}

// ─── 汚染度更新 ──────────────────────────────────────────────────────
export function tickContamination(ng: Tile[][], gridSize: number, dt: number): Tile[][] {
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const t        = ng[r][c];
      const hasWaste = t.beltItem?.kind === "waste" || t.beltItem?.kind === "radio_waste";
      if (hasWaste) {
        t.contamination = Math.min(1.0, t.contamination + 0.1 * dt);
      } else if (t.kind === "waste_disposal") {
        t.contamination = Math.max(0, t.contamination - 0.5 * dt);
      } else {
        t.contamination = Math.max(0, t.contamination - 0.02 * dt);
      }
    }
  }
  return ng;
}

// ─── 鉱床再発見 ──────────────────────────────────────────────────────
let _depositTimer = 0;

export function tickDepositRespawn(
  grid: Tile[][], gridSize: number, dt: number,
): { grid: Tile[][]; spawned: boolean; kind: "stone" | "iron" | "uranium" | null } {
  _depositTimer += dt;
  if (_depositTimer < DEPOSIT_RESPAWN_SECS) return { grid, spawned: false, kind: null };
  _depositTimer -= DEPOSIT_RESPAWN_SECS;

  const empties: [number, number][] = [];
  for (let r = 0; r < gridSize; r++)
    for (let c = 0; c < gridSize; c++)
      if (grid[r][c].kind === "empty") empties.push([r, c]);
  if (empties.length === 0) return { grid, spawned: false, kind: null };

  const [tr, tc] = empties[Math.floor(Math.random() * empties.length)];
  const rnd      = Math.random();
  const kind: "stone" | "iron" | "uranium" = rnd < 0.5 ? "stone" : rnd < 0.85 ? "iron" : "uranium";
  const ng       = grid.map(row => row.map(t => ({ ...t })));
  ng[tr][tc] = {
    ...ng[tr][tc],
    kind: `${kind}_deposit` as "stone_deposit" | "iron_deposit" | "uranium_deposit",
    depositRemaining: kind === "stone" ? 500 : kind === "iron" ? 300 : 150,
  };

  return { grid: ng, spawned: true, kind };
}

// ─── マイルストーン進捗チェック ──────────────────────────────────────
export function checkMilestones(
  state: GameState,
): { milestones: typeof state.milestones; newlyCompleted: string[] } {
  const newlyCompleted: string[] = [];
  const updated = state.milestones.map(m => {
    if (m.completed) return m;
    const allMet = Object.entries(m.requires).every(([item, count]) => {
      const key = item as "gear" | "fuel_rod" | "iron" | "stone" | "uranium";
      const shipped =
        key === "gear"     ? state.totalGearsShipped    :
        key === "fuel_rod" ? state.totalFuelShipped      :
        key === "iron"     ? state.totalIronShipped      :
        key === "stone"    ? state.totalStonesShipped    :
        key === "uranium"  ? state.totalUraniumShipped   : 0;
      return shipped >= (count as number);
    });
    if (allMet) {
      newlyCompleted.push(m.id);
      return { ...m, completed: true };
    }
    return m;
  });
  return { milestones: updated, newlyCompleted };
}

// ─── グリッド初期化・拡張 ────────────────────────────────────────────
function emptyTile(r: number, c: number): Tile {
  return {
    id: `t_${r}_${c}`, kind: "empty", direction: "right",
    beltItem: null, productionTimer: 0, depositRemaining: 0,
    module: null, filterConfig: {}, waterFed: false, fuelFed: false, contamination: 0,
  };
}

export function createInitialGrid(size: number): Tile[][] {
  const grid: Tile[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => emptyTile(r, c))
  );
  const hubR = Math.floor(size / 2), hubC = Math.floor(size / 2);
  grid[hubR][hubC] = { ...emptyTile(hubR, hubC), kind: "hub" };
  grid[0][0]       = { ...emptyTile(0, 0), kind: "water_source" };

  const stonePos:   [number, number][] = [[0, size-1],[1,2],[3,1],[size-1,size-2]];
  const ironPos:    [number, number][] = [[0,2],[2,size-1],[size-1,0]];
  const uraniumPos: [number, number][] = [[size-2, 1]];

  stonePos.forEach(([r, c]) => {
    if (r < size && c < size && !(r === hubR && c === hubC))
      grid[r][c] = { ...emptyTile(r, c), kind: "stone_deposit", depositRemaining: 500 };
  });
  ironPos.forEach(([r, c]) => {
    if (r < size && c < size && !(r === hubR && c === hubC) && grid[r][c].kind === "empty")
      grid[r][c] = { ...emptyTile(r, c), kind: "iron_deposit", depositRemaining: 300 };
  });
  uraniumPos.forEach(([r, c]) => {
    if (r < size && c < size && grid[r][c].kind === "empty")
      grid[r][c] = { ...emptyTile(r, c), kind: "uranium_deposit", depositRemaining: 150 };
  });

  return grid;
}

export function expandGrid(prev: Tile[][], newSize: number): Tile[][] {
  return Array.from({ length: newSize }, (_, r) =>
    Array.from({ length: newSize }, (_, c) =>
      (prev[r] && prev[r][c]) ? prev[r][c] : emptyTile(r, c)
    )
  );
}

// ─── ロケット打ち上げ条件 ─────────────────────────────────────────────
// ★修正: require() を廃止し、ESM import で取得した ROCKET_REQUIREMENTS を直接使用
export function checkRocketReady(
  money: number, gearsShipped: number, fuelShipped: number,
): boolean {
  return (
    money        >= ROCKET_REQUIREMENTS.money    &&
    gearsShipped >= ROCKET_REQUIREMENTS.gear     &&
    fuelShipped  >= ROCKET_REQUIREMENTS.fuel_rod
  );
}

// ─── 統計スナップショット ─────────────────────────────────────────────
export function pushSnapshot(
  history: StatsSnapshot[], snap: StatsSnapshot,
): StatsSnapshot[] {
  const next = [...history, snap];
  if (next.length > 10) next.shift();
  return next;
}