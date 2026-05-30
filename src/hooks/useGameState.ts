// ════════════════════════════════════════════════════════════════════
//  hooks/useGameState.ts — Micro-Factory 3D コアゲームループ
// ════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  GameState, ShopItem, Tile, Direction, Toast,
  Upgrades, ModuleKind, NewGamePlusBuff,
} from "../types";
import {
  INITIAL_GRID_SIZE, COSTS, UPGRADE_COSTS, DIRECTION_ORDER,
  SELL_RATES, NGP_SPEED_BONUS, NGP_PROD_BONUS,
  NGP_START_MONEY_BASE, NGP_START_MONEY_PER,
  INITIAL_MILESTONES,
} from "../constants";
import {
  createInitialGrid, expandGrid,
  tickBeltPhysics, tickDrills, tickAssemblers,
  tickWaterSystem, tickContamination,
  tickDayNight, updateBattery, tickDepositRespawn,
  calcPower, calcProdStats,
  checkMilestones, pushSnapshot,
} from "../utils/gameLogic";

// ─── 初期NGPバフ ─────────────────────────────────────────────────────
const INITIAL_NGP: NewGamePlusBuff = {
  cycle: 0, speedMultiplier: 1.0, productionMultiplier: 1.0,
  wasteReduction: 0, startGridSize: INITIAL_GRID_SIZE, startMoney: 50,
  selectedSkills: [],
};

// ─── 初期状態生成 ────────────────────────────────────────────────────
function makeInitialState(ngp: NewGamePlusBuff = INITIAL_NGP): GameState {
  const gs = ngp.startGridSize ?? INITIAL_GRID_SIZE;
  return {
    money: ngp.startMoney, stone: 0, iron: 0, uranium: 0,
    gear: 0, fuel_rod: 0, water: 0,
    totalGearsShipped: 0, totalFuelShipped: 0, totalStonesShipped: 0,
    totalIronShipped: 0, totalWasteShipped: 0, totalUraniumShipped: 0,
    milestoneProgress: {},
    powerUsed: 0, powerGenerated: 0, batteryCharge: 0, batteryMax: 0,
    dayPhase: "day", phaseTimer: 0, lightNorm: 0,
    gridSize: gs, grid: createInitialGrid(gs),
    upgrades: {
      efficientPickaxe: false, turbodrillBoost: false, fastBelt: false,
      largeBattery: false, assemblerUnlock: false, filterUnlock: false,
      steamUnlock: false, nuclearUnlock: false, moduleUnlock: false,
      expansion7x7: false, expansion9x9: false, rocketSilo: false,
      spaceElevator: false,
    },
    currentTier: 0,
    milestones: INITIAL_MILESTONES.map(m => ({ ...m, completed: false })),
    statsHistory: [], totalTime: 0,
    rocketLaunched: false, infiniteMode: false, hubUpgraded: false,
    ngPlusBuff: ngp,
    moduleInventory: { speed: 0, production: 0, efficiency: 0 },
    cameraTarget: [0, 0, 0],
  };
}

// ─── フック本体 ──────────────────────────────────────────────────────
export function useGameState() {
  const [state, setState]               = useState<GameState>(() => makeInitialState());
  const [selectedShop, setSelectedShop] = useState<ShopItem | null>(null);
  const [selectedTile, setSelectedTile] = useState<[number, number] | null>(null);
  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [showRocketClear, setShowRocketClear] = useState(false);

  const stateRef     = useRef(state);
  stateRef.current   = state;
  const prevMoneyRef = useRef(state.money);
  const prevStoneRef = useRef(0);
  const prevIronRef  = useRef(0);
  const prevGearRef  = useRef(0);
  const prevFuelRef  = useRef(0);
  const prevWasteRef = useRef(0);

  // ─── トースト ─────────────────────────────────────────────────────
  const toastId = useRef(0);
  const addToast = useCallback((text: string, color = "#68D391", icon = "") => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, text, color, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ─── ゲームループ ────────────────────────────────────────────────
  const lastTimeRef = useRef(0);
  useEffect(() => {
    let animId: number;
    const loop = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = ts;
      setState(prev => gameLoop(prev, dt, addToast));
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addToast]);

  // ─── 統計スナップショット（1秒ごと） ─────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      setState(prev => {
        const stoneDelta = Math.max(0, prev.stone            - prevStoneRef.current);
        const ironDelta  = Math.max(0, prev.iron             - prevIronRef.current);
        const moneyDelta = Math.max(0, prev.money            - prevMoneyRef.current);
        const gearDelta  = Math.max(0, prev.totalGearsShipped - prevGearRef.current);
        const fuelDelta  = Math.max(0, prev.totalFuelShipped  - prevFuelRef.current);
        const wasteDelta = Math.max(0, prev.totalWasteShipped - prevWasteRef.current);
        prevStoneRef.current = prev.stone;
        prevIronRef.current  = prev.iron;
        prevMoneyRef.current = prev.money;
        prevGearRef.current  = prev.totalGearsShipped;
        prevFuelRef.current  = prev.totalFuelShipped;
        prevWasteRef.current = prev.totalWasteShipped;
        return {
          ...prev,
          statsHistory: pushSnapshot(prev.statsHistory, {
            time: Date.now(), stoneIn: stoneDelta, ironIn: ironDelta,
            uraniumIn: 0, gearShipped: gearDelta, fuelShipped: fuelDelta,
            wasteShipped: wasteDelta, income: moneyDelta,
          }),
        };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // ─── ロケットクリア検知 ──────────────────────────────────────────
  useEffect(() => {
    if (state.rocketLaunched && !showRocketClear) {
      setShowRocketClear(true);
      addToast("🚀 ロケット打ち上げ成功！", "#60d0ff", "🚀");
    }
  }, [state.rocketLaunched, showRocketClear, addToast]);

  // ─── 派生値 ──────────────────────────────────────────────────────
  const prodStats     = calcProdStats(state);
  const powerInfo     = calcPower(state);
  const powerOk       = powerInfo.efficiency >= 1.0;
  const phaseRemain   = Math.ceil(
    (state.dayPhase === "day" ? 20 : state.dayPhase === "dusk" ? 5 : state.dayPhase === "night" ? 20 : 5)
    - state.phaseTimer
  );

  // ─── アクション ──────────────────────────────────────────────────
  const mineStone = useCallback(() => {
    setState(prev => ({ ...prev, stone: prev.stone + (prev.upgrades.efficientPickaxe ? 2 : 1) }));
  }, []);

  const mineIron = useCallback(() => {
    setState(prev => ({ ...prev, iron: prev.iron + (prev.upgrades.efficientPickaxe ? 2 : 1) }));
  }, []);

  const sellStone = useCallback(() => {
    setState(prev => prev.stone <= 0 ? prev : {
      ...prev, money: prev.money + Math.floor(prev.stone) * SELL_RATES.stone, stone: 0,
    });
  }, []);

  const sellIron = useCallback(() => {
    setState(prev => prev.iron <= 0 ? prev : {
      ...prev, money: prev.money + Math.floor(prev.iron) * SELL_RATES.iron, iron: 0,
    });
  }, []);

  const handleTileClick = useCallback((row: number, col: number) => {
    setSelectedTile([row, col]);
    setState(prev => {
      const tile = prev.grid[row][col];
      if (tile.kind === "hub" || tile.kind === "space_elevator" || tile.kind === "water_source") return prev;

      // モジュール装着
      if (selectedShop === "module_speed" || selectedShop === "module_production" || selectedShop === "module_efficiency") {
        const targetable = ["stone_drill","iron_drill","uranium_drill","assembler"].includes(tile.kind);
        if (!targetable) return prev;
        const modKind: ModuleKind = selectedShop === "module_speed" ? "speed" : selectedShop === "module_production" ? "production" : "efficiency";
        const invKey = modKind as "speed" | "production" | "efficiency";
        if (prev.moduleInventory[invKey] <= 0) return prev;
        const newInv = { ...prev.moduleInventory };
        if (tile.module && tile.module !== modKind) newInv[tile.module as "speed" | "production" | "efficiency"]++;
        newInv[invKey]--;
        const ng = prev.grid.map(r => r.map(t => ({ ...t })));
        ng[row][col] = { ...tile, module: modKind };
        return { ...prev, grid: ng, moduleInventory: newInv };
      }

      // 向き変更
      if (!selectedShop) {
        const rotatable = ["belt","filter","stone_drill","iron_drill","uranium_drill","assembler","water_pump","steam_engine","nuclear_plant"];
        if (!rotatable.includes(tile.kind)) return prev;
        const idx    = DIRECTION_ORDER.indexOf(tile.direction);
        const newDir = DIRECTION_ORDER[(idx + 1) % 4] as Direction;
        const ng = prev.grid.map(r => r.map(t => ({ ...t })));
        ng[row][col] = { ...tile, direction: newDir };
        return { ...prev, grid: ng };
      }

      // 解体
      if (selectedShop === "demolish") {
        const dem = ["stone_drill","iron_drill","uranium_drill","belt","filter","solar","battery",
                     "assembler","water_pump","steam_engine","nuclear_plant","waste_disposal","rocket_silo"];
        if (!dem.includes(tile.kind)) return prev;
        const refund = Math.floor((COSTS[tile.kind] ?? 0) * 0.5);
        const wasDeposit =
          tile.kind === "stone_drill"   ? "stone_deposit"   :
          tile.kind === "iron_drill"    ? "iron_deposit"    :
          tile.kind === "uranium_drill" ? "uranium_deposit" : null;
        const newInv = { ...prev.moduleInventory };
        if (tile.module === "speed")      newInv.speed++;
        if (tile.module === "production") newInv.production++;
        if (tile.module === "efficiency") newInv.efficiency++;
        const ng = prev.grid.map(r => r.map(t => ({ ...t })));
        ng[row][col] = {
          id: tile.id, kind: wasDeposit ?? "empty",
          direction: "right" as Direction, beltItem: null, productionTimer: 0,
          depositRemaining: wasDeposit === "stone_deposit" ? 500 : wasDeposit === "iron_deposit" ? 300 : wasDeposit === "uranium_deposit" ? 150 : 0,
          module: null, filterConfig: {}, waterFed: false, fuelFed: false, contamination: 0,
        };
        return { ...prev, money: prev.money + refund, grid: ng, moduleInventory: newInv };
      }

      // 施設設置
      const cost = COSTS[selectedShop] ?? 0;
      if (prev.money < cost) return prev;
      const canPlace =
        selectedShop === "stone_drill"   ? tile.kind === "stone_deposit"   :
        selectedShop === "iron_drill"    ? tile.kind === "iron_deposit"    :
        selectedShop === "uranium_drill" ? tile.kind === "uranium_deposit" :
        tile.kind === "empty";
      if (!canPlace) return prev;
      if (selectedShop === "assembler"      && !prev.upgrades.assemblerUnlock) return prev;
      if (selectedShop === "filter"         && !prev.upgrades.filterUnlock)    return prev;
      if (selectedShop === "water_pump"     && !prev.upgrades.steamUnlock)     return prev;
      if (selectedShop === "steam_engine"   && !prev.upgrades.steamUnlock)     return prev;
      if (selectedShop === "nuclear_plant"  && !prev.upgrades.nuclearUnlock)   return prev;
      if (selectedShop === "rocket_silo"    && !prev.upgrades.rocketSilo)      return prev;
      const ng = prev.grid.map(r => r.map(t => ({ ...t })));
      ng[row][col] = {
        id: tile.id, kind: selectedShop as Tile["kind"],
        direction: "right" as Direction, beltItem: null, productionTimer: 0,
        depositRemaining: tile.depositRemaining,
        module: null, filterConfig: {}, waterFed: false, fuelFed: false, contamination: 0,
      };
      return { ...prev, money: prev.money - cost, grid: ng };
    });
  }, [selectedShop]);

  const toggleShop = useCallback((item: ShopItem) => {
    if (item === "module_speed" || item === "module_production" || item === "module_efficiency") {
      setState(prev => {
        const cost = COSTS[item] ?? 0;
        if (prev.money < cost) return prev;
        const key = item === "module_speed" ? "speed" : item === "module_production" ? "production" : "efficiency";
        return {
          ...prev, money: prev.money - cost,
          moduleInventory: { ...prev.moduleInventory, [key]: prev.moduleInventory[key] + 1 },
        };
      });
    }
    setSelectedShop(prev => prev === item ? null : item);
  }, []);

  const cancelShop = useCallback(() => setSelectedShop(null), []);

  const buyUpgrade = useCallback((key: keyof Upgrades) => {
    setState(prev => {
      if (prev.upgrades[key]) return prev;
      const cost = UPGRADE_COSTS[key];
      if (cost.requiresUpgrade && !prev.upgrades[cost.requiresUpgrade]) return prev;
      if (prev.money < cost.money)                                       return prev;
      if (cost.stone    && prev.stone    < cost.stone)                   return prev;
      if (cost.iron     && prev.iron     < cost.iron)                    return prev;
      if (cost.gear     && prev.totalGearsShipped < cost.gear)           return prev;
      if (cost.fuel_rod && prev.totalFuelShipped  < (cost.fuel_rod ?? 0)) return prev;
      let ng = prev.grid, gs = prev.gridSize;
      if (key === "expansion7x7") { gs = 7; ng = expandGrid(prev.grid, 7); }
      if (key === "expansion9x9") { gs = 9; ng = expandGrid(prev.grid, 9); }
      const hubUpgraded = key === "spaceElevator" ? true : prev.hubUpgraded;
      if (key === "spaceElevator") {
        // ハブタイルを space_elevator に変換
        for (let r = 0; r < gs; r++)
          for (let c = 0; c < gs; c++)
            if (ng[r][c].kind === "hub") ng[r][c] = { ...ng[r][c], kind: "space_elevator" };
      }
      return {
        ...prev,
        money: prev.money - cost.money,
        stone: prev.stone - (cost.stone ?? 0),
        iron:  prev.iron  - (cost.iron  ?? 0),
        gridSize: gs, grid: ng, hubUpgraded,
        upgrades: { ...prev.upgrades, [key]: true },
      };
    });
    addToast(`✓ 研究完了: ${UPGRADE_COSTS[key] && key}`, "#C084FC");
  }, [addToast]);

  const newGamePlus = useCallback((skills: string[]) => {
    setState(prev => {
      const nextCycle = prev.ngPlusBuff.cycle + 1;
      const wasteReduction = skills.includes("waste_half") ? Math.min(1, prev.ngPlusBuff.wasteReduction + 0.5) : prev.ngPlusBuff.wasteReduction;
      const startGridSize  = skills.includes("big_start")  ? 7 : INITIAL_GRID_SIZE;
      const startMoneyBonus = skills.includes("rich_start") ? 1000 : 0;
      const newBuff: NewGamePlusBuff = {
        cycle: nextCycle,
        speedMultiplier:      parseFloat((1.0 + NGP_SPEED_BONUS * nextCycle + (skills.includes("fast_belt") ? 0.5 : 0)).toFixed(2)),
        productionMultiplier: parseFloat((1.0 + NGP_PROD_BONUS  * nextCycle).toFixed(2)),
        wasteReduction,
        startGridSize,
        startMoney: NGP_START_MONEY_BASE + NGP_START_MONEY_PER * nextCycle + startMoneyBonus,
        selectedSkills: [...prev.ngPlusBuff.selectedSkills, ...skills],
      };
      return makeInitialState(newBuff);
    });
    setSelectedShop(null);
    setShowRocketClear(false);
    addToast(`👽 ${stateRef.current.ngPlusBuff.cycle + 1}周目開始！`, "#4ade80");
  }, [addToast]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") { setSelectedShop(null); setSelectedTile(null); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return {
    state, selectedShop, selectedTile, toasts, powerOk,
    powerGenerated: powerInfo.powerGenerated,
    prodStats, phaseRemain, showRocketClear,
    setShowRocketClear, mineStone, mineIron, sellStone, sellIron,
    handleTileClick, toggleShop, cancelShop, buyUpgrade, newGamePlus, addToast,
  };
}

// ════════════════════════════════════════════════════════════════════
//  ゲームループ本体
// ════════════════════════════════════════════════════════════════════
function gameLoop(
  prev: GameState, dt: number,
  addToast: (t: string, c?: string, icon?: string) => void,
): GameState {
  // 1. 昼夜
  const { dayPhase, phaseTimer, lightNorm, phaseChanged } =
    tickDayNight(prev.dayPhase, prev.phaseTimer, dt);
  if (phaseChanged) {
    setTimeout(() => addToast(
      dayPhase==="day"?"☀ 昼になった":dayPhase==="dusk"?"🌅 夕方になった":dayPhase==="night"?"🌙 夜になった":"🌄 夜明け",
      dayPhase==="day"?"#FCD34D":dayPhase==="night"?"#818CF8":"#F6AD55",
    ), 0);
  }

  // 2. 電力
  const { efficiency, powerUsed, powerGenerated, batteryMax } =
    calcPower({ ...prev, dayPhase });
  const batteryCharge = updateBattery({ ...prev, dayPhase, powerUsed }, dt, batteryMax);

  // 3. 物流
  const br = tickBeltPhysics({ ...prev, dayPhase }, dt);
  let ng   = br.newGrid;

  // 4. ドリル
  ng = tickDrills({ ...prev, grid: ng, dayPhase }, ng, dt, efficiency);

  // 5. 組立機
  const ar = tickAssemblers({ ...prev, grid: ng, dayPhase }, ng, dt, efficiency);
  ng = ar.grid;

  // 6. 水システム
  ng = tickWaterSystem({ ...prev, grid: ng, dayPhase }, ng, dt, efficiency);

  // 7. 汚染
  ng = tickContamination(ng, prev.gridSize, dt);

  // 8. 鉱床再発見
  const rr = tickDepositRespawn(ng, prev.gridSize, dt);
  ng = rr.grid;
  if (rr.spawned) {
    setTimeout(() => addToast(
      `✨ 新鉱床発見！（${rr.kind}）`,
      rr.kind==="uranium"?"#40cc40":rr.kind==="iron"?"#63B3ED":"#A0AFBF",
    ), 0);
  }

  // 9. 資源更新
  const newMoney    = prev.money + br.earnedMoney;
  const newStone    = Math.max(0, prev.stone   - ar.stonesConsumed);
  const newIron     = Math.max(0, prev.iron    - ar.ironConsumed);
  const newUranium  = Math.max(0, prev.uranium - ar.uraniumConsumed);
  const newTotalStone   = prev.totalStonesShipped  + br.shippedStone;
  const newTotalIron    = prev.totalIronShipped     + br.shippedIron;
  const newTotalUranium = prev.totalUraniumShipped  + br.shippedUranium;
  const newTotalGear    = prev.totalGearsShipped    + br.shippedGear;
  const newTotalFuel    = prev.totalFuelShipped     + br.shippedFuel;
  const newTotalWaste   = prev.totalWasteShipped    + br.shippedWaste;

  // 10. マイルストーン
  const { milestones, newlyCompleted } = checkMilestones({
    ...prev, totalGearsShipped: newTotalGear, totalFuelShipped: newTotalFuel,
    totalIronShipped: newTotalIron, totalStonesShipped: newTotalStone,
    totalUraniumShipped: newTotalUranium,
  });
  newlyCompleted.forEach(id => {
    const m = milestones.find(x => x.id === id);
    if (m) setTimeout(() => addToast(`🎉 マイルストーン達成！${m.label}`, "#F5C842"), 0);
  });

  // 11. ロケット打ち上げ
  let rocketLaunched = prev.rocketLaunched;
  if (!rocketLaunched && prev.upgrades.rocketSilo) {
    let hasSilo = false;
    for (let r = 0; r < prev.gridSize; r++)
      for (let c = 0; c < prev.gridSize; c++)
        if (ng[r][c].kind === "rocket_silo") hasSilo = true;
    if (hasSilo && newMoney >= 10000 && newTotalGear >= 500 && newTotalFuel >= 100)
      rocketLaunched = true;
  }

  // 12. 電力キャッシュ
  const fp = calcPower({ ...prev, dayPhase, grid: ng });

  return {
    ...prev,
    money: newMoney, stone: newStone, iron: newIron, uranium: newUranium,
    totalStonesShipped: newTotalStone, totalIronShipped: newTotalIron,
    totalUraniumShipped: newTotalUranium, totalGearsShipped: newTotalGear,
    totalFuelShipped: newTotalFuel, totalWasteShipped: newTotalWaste,
    powerUsed: fp.powerUsed, powerGenerated: fp.powerGenerated,
    batteryCharge, batteryMax: fp.batteryMax,
    dayPhase, phaseTimer, lightNorm,
    grid: ng, milestones,
    totalTime: prev.totalTime + dt,
    rocketLaunched, infiniteMode: rocketLaunched ? true : prev.infiniteMode,
  };
}
