// ════════════════════════════════════════════════════════════════════
//  hooks/useGameState.ts — ゲームのコア状態管理・ゲームループ
//  タイマー（requestAnimationFrame）、各アクションをカプセル化。
// ════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import type { GameState, ShopItem, Tile, Direction, Toast, Upgrades } from "../types";
import type { ProdStats } from "../types";
import {
  INITIAL_GRID_SIZE, HUB_ROW, HUB_COL,
  COSTS, UPGRADE_COSTS,
  DIRECTION_ORDER,
  SELL_RATES,
} from "../constants";
import {
  createInitialGrid, expandGrid,
  tickBeltPhysics, tickDrills, tickAssemblers,
  tickDayNight, updateBattery, tickDepositRespawn,
  calcPower, calcProdStats,
  checkRocketReady, pushSnapshot,
} from "../utils/gameLogic";

// ─── 初期状態 ──────────────────────────────────────────────────────

const INITIAL_STATE: GameState = {
  money: 50,
  stone: 0,
  iron: 0,
  gear: 0,
  totalGearsShipped: 0,
  totalStonesShipped: 0,
  totalIronShipped: 0,
  powerUsed: 0,
  powerMax: 0,
  batteryCharge: 0,
  batteryMax: 0,
  dayPhase: "day",
  phaseTimer: 0,
  gridSize: INITIAL_GRID_SIZE,
  grid: createInitialGrid(INITIAL_GRID_SIZE),
  upgrades: {
    efficientPickaxe: false,
    turbodrillBoost: false,
    fastBelt: false,
    largeBattery: false,
    assemblerUnlock: false,
    expansion7x7: false,
    expansion9x9: false,
    rocketSilo: false,
  },
  statsHistory: [],
  totalTime: 0,
  rocketLaunched: false,
  infiniteMode: false,
  rocketProgress: { gear: 0, iron: 0, money: 0 },
};

// ─── フック本体 ────────────────────────────────────────────────────

export function useGameState() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<"factory" | "research" | "stats">("factory");
  const [selectedShop, setSelectedShop] = useState<ShopItem | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [clickAnim, setClickAnim] = useState({ stone: false, iron: false });
  const [showRocketClear, setShowRocketClear] = useState(false);

  // ゲームループ用のref（stateを参照するクロージャ問題を回避）
  const stateRef = useRef(state);
  stateRef.current = state;

  // 統計用タイマー（1秒ごとにスナップショットを記録）
  const statsTimerRef = useRef(0);
  const prevStoneRef = useRef(0);
  const prevIronRef = useRef(0);
  const prevMoneyRef = useRef(50);

  // ─── トースト通知 ───────────────────────────────────────────────
  const toastId = useRef(0);
  const addToast = useCallback((text: string, color: string = "#68D391") => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, text, color }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // ─── ゲームループ（requestAnimationFrame） ────────────────────────
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1); // 最大100ms
      lastTimeRef.current = timestamp;

      setState(prev => {
        return gameLoop(prev, dt, addToast);
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [addToast]);

  // ─── 統計スナップショット（1秒ごと） ─────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const stoneDelta = Math.max(0, prev.stone - prevStoneRef.current);
        const ironDelta = Math.max(0, prev.iron - prevIronRef.current);
        const moneyDelta = Math.max(0, prev.money - prevMoneyRef.current);
        // 歯車出荷は直近1秒分（rocketProgressから算出）
        const snap = {
          time: Date.now(),
          stoneIn: stoneDelta,
          ironIn: ironDelta,
          income: moneyDelta,
          gearShipped: 0, // ゲームループ内で加算
        };
        prevStoneRef.current = prev.stone;
        prevIronRef.current = prev.iron;
        prevMoneyRef.current = prev.money;

        return {
          ...prev,
          statsHistory: pushSnapshot(prev.statsHistory, snap),
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── ロケット打ち上げ演出 ─────────────────────────────────────────
  useEffect(() => {
    if (state.rocketLaunched && !showRocketClear) {
      setShowRocketClear(true);
      addToast("🚀 ロケット打ち上げ成功！無限モード開始！", "#60d0ff");
    }
  }, [state.rocketLaunched, showRocketClear, addToast]);

  // ─── 派生値の計算 ────────────────────────────────────────────────
  const prodStats: ProdStats = calcProdStats(state);
  const { efficiency, powerUsed, powerMax } = calcPower(state);
  const powerOk = efficiency >= 1.0;
  const phaseRemain = Math.ceil(
    (state.dayPhase === "day" ? 30 : 30) - state.phaseTimer
  );

  // ─── アクション群 ────────────────────────────────────────────────

  /** 手動採掘（石） */
  const mineStone = useCallback(() => {
    setState(prev => ({
      ...prev,
      stone: prev.stone + (prev.upgrades.efficientPickaxe ? 2 : 1),
    }));
    setClickAnim(a => ({ ...a, stone: true }));
    setTimeout(() => setClickAnim(a => ({ ...a, stone: false })), 150);
  }, []);

  /** 手動採掘（鉄） */
  const mineIron = useCallback(() => {
    setState(prev => ({
      ...prev,
      iron: prev.iron + (prev.upgrades.efficientPickaxe ? 2 : 1),
    }));
    setClickAnim(a => ({ ...a, iron: true }));
    setTimeout(() => setClickAnim(a => ({ ...a, iron: false })), 150);
  }, []);

  /** 手動売却（石） */
  const sellStone = useCallback(() => {
    setState(prev => {
      if (prev.stone <= 0) return prev;
      const earn = Math.floor(prev.stone) * SELL_RATES.stone;
      return { ...prev, money: prev.money + earn, stone: 0 };
    });
  }, []);

  /** 手動売却（鉄） */
  const sellIron = useCallback(() => {
    setState(prev => {
      if (prev.iron <= 0) return prev;
      const earn = Math.floor(prev.iron) * SELL_RATES.iron;
      return { ...prev, money: prev.money + earn, iron: 0 };
    });
  }, []);

  /** タイルクリック（施設設置・向き変更・解体） */
  const handleTileClick = useCallback((row: number, col: number) => {
    setState(prev => {
      const tile = prev.grid[row][col];
      if (tile.kind === "hub") return prev; // ハブは操作不可

      if (!selectedShop) {
        // ショップ未選択 → ベルト/ドリル/組立機の向き変更
        if (
          tile.kind === "belt" ||
          tile.kind === "stone_drill" ||
          tile.kind === "iron_drill" ||
          tile.kind === "assembler"
        ) {
          const idx = DIRECTION_ORDER.indexOf(tile.direction);
          const newDir: Direction = DIRECTION_ORDER[(idx + 1) % 4];
          const newGrid = prev.grid.map(r => r.map(t => ({ ...t })));
          newGrid[row][col] = { ...tile, direction: newDir };
          return { ...prev, grid: newGrid };
        }
        return prev;
      }

      // ─── 解体モード ─────────────────────────────────────────────
      if (selectedShop === "demolish") {
        const demolishable = ["stone_drill", "iron_drill", "belt", "solar", "battery", "assembler", "rocket_silo"];
        if (!demolishable.includes(tile.kind)) return prev;

        const refund = Math.floor((COSTS[tile.kind] ?? 0) * 0.5);
        const newGrid = prev.grid.map(r => r.map(t => ({ ...t })));

        // 元の鉱床に戻す
        const wasOnDeposit =
          (tile.kind === "stone_drill") ? "stone_deposit" :
          (tile.kind === "iron_drill") ? "iron_deposit" : null;

        newGrid[row][col] = {
          id: tile.id,
          kind: wasOnDeposit ?? "empty",
          direction: "right",
          beltItem: null,
          productionTimer: 0,
          depositRemaining: wasOnDeposit ? (wasOnDeposit === "stone_deposit" ? 500 : 300) : 0,
        };

        return { ...prev, money: prev.money + refund, grid: newGrid };
      }

      // ─── 施設設置 ────────────────────────────────────────────────
      const cost = COSTS[selectedShop] ?? 0;
      if (prev.money < cost) return prev;

      // 設置可能タイルのチェック
      const canPlace =
        selectedShop === "stone_drill" ? tile.kind === "stone_deposit" :
        selectedShop === "iron_drill"  ? tile.kind === "iron_deposit" :
        tile.kind === "empty";

      if (!canPlace) return prev;

      // 組立機・ロケットサイロはアンロックが必要
      if (selectedShop === "assembler" && !prev.upgrades.assemblerUnlock) return prev;
      if (selectedShop === "rocket_silo" && !prev.upgrades.rocketSilo) return prev;

      const newGrid = prev.grid.map(r => r.map(t => ({ ...t })));
      newGrid[row][col] = {
        id: tile.id,
        kind: selectedShop as Tile["kind"],
        direction: "right",
        beltItem: null,
        productionTimer: 0,
        depositRemaining: tile.depositRemaining,
      };

      return { ...prev, money: prev.money - cost, grid: newGrid };
    });
  }, [selectedShop]);

  /** ショップアイテム選択 */
  const toggleShop = useCallback((item: ShopItem) => {
    setSelectedShop(prev => prev === item ? null : item);
  }, []);

  /** ショップ選択解除 */
  const cancelShop = useCallback(() => {
    setSelectedShop(null);
  }, []);

  /** 研究アップグレード購入 */
  const buyUpgrade = useCallback((key: keyof Upgrades) => {
    setState(prev => {
      if (prev.upgrades[key]) return prev;

      const cost = UPGRADE_COSTS[key];

      // 前提アップグレードチェック
      if (cost.requiresUpgrade && !prev.upgrades[cost.requiresUpgrade]) return prev;

      // コスト充足チェック
      if (prev.money < cost.money) return prev;
      if (cost.stone && prev.stone < cost.stone) return prev;
      if (cost.iron && prev.iron < cost.iron) return prev;
      if (cost.gear && prev.totalGearsShipped < cost.gear) return prev;

      // グリッド拡張処理
      let newGrid = prev.grid;
      let newGridSize = prev.gridSize;
      if (key === "expansion7x7") {
        newGridSize = 7;
        newGrid = expandGrid(prev.grid, 7);
        // 新しい中央にハブが来るよう配置
        newGrid[3][3] = prev.grid[2][2]; // 旧ハブをそのまま持ってくる（既にidで区別）
      } else if (key === "expansion9x9") {
        newGridSize = 9;
        newGrid = expandGrid(prev.grid, 9);
      }

      return {
        ...prev,
        money: prev.money - cost.money,
        stone: prev.stone - (cost.stone ?? 0),
        iron: prev.iron - (cost.iron ?? 0),
        gridSize: newGridSize,
        grid: newGrid,
        upgrades: { ...prev.upgrades, [key]: true },
      };
    });

    addToast(`✓ 研究完了: ${key}`, "#C084FC");
  }, [addToast]);

  // ─── ESCキーでショップ解除 ───────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedShop(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return {
    state,
    activeTab,
    selectedShop,
    toasts,
    clickAnim,
    powerOk,
    prodStats,
    phaseRemain,
    showRocketClear,
    setActiveTab,
    setShowRocketClear,
    mineStone,
    mineIron,
    sellStone,
    sellIron,
    handleTileClick,
    toggleShop,
    cancelShop,
    buyUpgrade,
    addToast,
  };
}

// ─── ゲームループの本体（純粋関数的に記述） ──────────────────────────

function gameLoop(
  prev: GameState,
  dt: number,
  addToast: (text: string, color?: string) => void
): GameState {
  // ─── 1. 昼夜サイクルの更新 ─────────────────────────────────────
  const { dayPhase, phaseTimer, phaseChanged } = tickDayNight(prev.dayPhase, prev.phaseTimer, dt);
  if (phaseChanged) {
    // 非同期で通知（Reactのstateバッチ処理の外）
    setTimeout(() => {
      addToast(
        dayPhase === "day" ? "☀ 昼になった" : "🌙 夜になった",
        dayPhase === "day" ? "#FCD34D" : "#818CF8"
      );
    }, 0);
  }

  // ─── 2. 電力計算 ──────────────────────────────────────────────
  const { efficiency, powerUsed, powerMax } = calcPower({ ...prev, dayPhase });

  // ─── 3. 蓄電池の充放電 ─────────────────────────────────────────
  const batteryCharge = updateBattery({ ...prev, dayPhase, powerUsed }, dt);

  // ─── 4. ベルト物流のシミュレーション ──────────────────────────
  const beltResult = tickBeltPhysics({ ...prev, dayPhase }, dt);
  let newGrid = beltResult.newGrid;

  // ─── 5. ドリルの生産処理 ──────────────────────────────────────
  newGrid = tickDrills({ ...prev, grid: newGrid, dayPhase }, newGrid, dt, efficiency);

  // ─── 6. 組立機の生産処理 ─────────────────────────────────────
  const assemblerResult = tickAssemblers(
    { ...prev, grid: newGrid, dayPhase },
    newGrid,
    dt,
    efficiency
  );
  newGrid = assemblerResult.grid;

  // 組立機が素材を消費（グローバルストックから）
  const stoneAfterAssembler = Math.max(0, prev.stone - assemblerResult.stonesConsumed);
  const ironAfterAssembler = Math.max(0, prev.iron - assemblerResult.ironConsumed);

  // ─── 7. 鉱床の再発見 ──────────────────────────────────────────
  const respawnResult = tickDepositRespawn(newGrid, prev.gridSize, dt);
  newGrid = respawnResult.grid;
  if (respawnResult.spawned) {
    setTimeout(() => {
      addToast(
        `✨ 新鉱床発見！（${respawnResult.kind === "stone" ? "石" : "鉄"}）`,
        respawnResult.kind === "stone" ? "#A0AFBF" : "#63B3ED"
      );
    }, 0);
  }

  // ─── 8. 収益・累計出荷の更新 ─────────────────────────────────
  const newMoney = prev.money + beltResult.earnedMoney;
  const newTotalStone = prev.totalStonesShipped + beltResult.shippedStone;
  const newTotalIron = prev.totalIronShipped + beltResult.shippedIron;
  const newTotalGear = prev.totalGearsShipped + beltResult.shippedGear;

  // ─── 9. ロケット打ち上げ条件チェック ─────────────────────────
  let rocketLaunched = prev.rocketLaunched;
  if (!rocketLaunched && prev.upgrades.rocketSilo) {
    // グリッドにロケットサイロがあるか確認
    let hasSilo = false;
    for (let r = 0; r < prev.gridSize; r++) {
      for (let c = 0; c < prev.gridSize; c++) {
        if (newGrid[r][c].kind === "rocket_silo") { hasSilo = true; break; }
      }
    }
    if (hasSilo && checkRocketReady(newMoney, newTotalGear, newTotalIron)) {
      rocketLaunched = true;
    }
  }

  // ─── 10. 総稼働時間の更新 ─────────────────────────────────────
  const totalTime = prev.totalTime + dt;

  // ─── 11. 電力情報のキャッシュ更新 ────────────────────────────
  const battCalc = calcPower({ ...prev, dayPhase, grid: newGrid });

  return {
    ...prev,
    money: newMoney,
    stone: stoneAfterAssembler,
    iron: ironAfterAssembler,
    totalStonesShipped: newTotalStone,
    totalIronShipped: newTotalIron,
    totalGearsShipped: newTotalGear,
    powerUsed: battCalc.powerUsed,
    powerMax: battCalc.powerMax,
    batteryCharge,
    batteryMax: battCalc.batteryMax,
    dayPhase,
    phaseTimer,
    grid: newGrid,
    totalTime,
    rocketLaunched,
    infiniteMode: rocketLaunched ? true : prev.infiniteMode,
  };
}
