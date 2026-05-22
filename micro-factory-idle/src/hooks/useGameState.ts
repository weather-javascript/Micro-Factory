// ════════════════════════════════════════════════════════════════════
//  hooks/useGameState.ts — ゲームのコア状態管理カスタムフック
//
//  責務:
//  - GameState の初期化
//  - ゲームループ（setInterval）の管理
//  - 全アクション（採掘・売却・設置・解体・アップグレード）
//  - トースト通知の管理
//  - ESCキーによるショップキャンセル
// ════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import type { GameState, Tile, ShopItem, ToastMsg, ActiveTab } from "../types";
import {
  GRID_SIZE, TICK_MS, COSTS, SELL_RATE,
  UPGRADE_COSTS, SHOP_LABELS, HUB_POSITION,
  INITIAL_STONE_DEPOSITS, INITIAL_IRON_DEPOSITS,
} from "../constants";
import {
  calcTick, calcProductionStats, phaseProgress,
  canPlace, canDemolish, demolishedType, nextDirection, fmt,
} from "../utils/gameLogic";

// ─── 初期グリッド生成 ─────────────────────────────────────────────
function makeInitialGrid(): Tile[][] {
  const [hr, hc] = HUB_POSITION;
  const grid: Tile[][] = Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (_, c) => ({
      id:   r * GRID_SIZE + c,
      type: "empty" as const,
    }))
  );
  for (const [r, c] of INITIAL_STONE_DEPOSITS) grid[r][c].type = "stone_deposit";
  for (const [r, c] of INITIAL_IRON_DEPOSITS)  grid[r][c].type = "iron_deposit";
  grid[hr][hc].type = "hub";
  return grid;
}

// ─── フック本体 ──────────────────────────────────────────────────
export function useGameState() {
  const [state, setState] = useState<GameState>({
    money:         0,
    stone:         0,
    iron:          0,
    powerUsed:     0,
    powerMax:      0,
    batteryCharge: 0,
    batteryMax:    0,
    tick:          0,
    dayPhase:      "day",
    grid:          makeInitialGrid(),
    upgrades:      { efficientPickaxe: false, turbodrillBoost: false },
  });

  const [activeTab,    setActiveTab]    = useState<ActiveTab>("factory");
  const [selectedShop, setSelectedShop] = useState<ShopItem>(null);
  const [toasts,       setToasts]       = useState<ToastMsg[]>([]);
  const [clickAnim,    setClickAnim]    = useState({ stone: false, iron: false });

  // ── ゲームループ
  useEffect(() => {
    const id = setInterval(() => {
      setState(prev => ({ ...prev, ...calcTick(prev) }));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ── ESCでショップキャンセル
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedShop(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const showToast = useCallback((text: string, color: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, text, color }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 1800);
  }, []);

  const mineStone = useCallback(() => {
    const amount = state.upgrades.efficientPickaxe ? 2 : 1;
    setState(prev => ({ ...prev, stone: prev.stone + amount }));
    setClickAnim(a => ({ ...a, stone: true }));
    setTimeout(() => setClickAnim(a => ({ ...a, stone: false })), 150);
  }, [state.upgrades.efficientPickaxe]);

  const mineIron = useCallback(() => {
    const amount = state.upgrades.efficientPickaxe ? 2 : 1;
    setState(prev => ({ ...prev, iron: prev.iron + amount }));
    setClickAnim(a => ({ ...a, iron: true }));
    setTimeout(() => setClickAnim(a => ({ ...a, iron: false })), 150);
  }, [state.upgrades.efficientPickaxe]);

  const sellStone = useCallback(() => {
    setState(prev => {
      if (prev.stone <= 0) return prev;
      const earned = Math.floor(prev.stone) * SELL_RATE.stone;
      showToast(`+${fmt(earned)} コイン`, "#F5C842");
      return { ...prev, money: prev.money + earned, stone: 0 };
    });
  }, [showToast]);

  const sellIron = useCallback(() => {
    setState(prev => {
      if (prev.iron <= 0) return prev;
      const earned = Math.floor(prev.iron) * SELL_RATE.iron;
      showToast(`+${fmt(earned)} コイン`, "#F5C842");
      return { ...prev, money: prev.money + earned, iron: 0 };
    });
  }, [showToast]);

  const handleTileClick = useCallback((r: number, c: number) => {
    setState(prev => {
      const tile = prev.grid[r][c];

      // 解体モード
      if (selectedShop === "demolish") {
        if (!canDemolish(tile)) { showToast("解体できないタイルです", "#FC8181"); return prev; }
        const restoredType = demolishedType(tile);
        const newGrid = prev.grid.map(row => row.map(t => ({ ...t })));
        newGrid[r][c] = { id: tile.id, type: restoredType };
        const refund =
          tile.type === "stone_drill" ? Math.floor(COSTS.stone_drill * 0.3)
          : tile.type === "iron_drill"  ? Math.floor(COSTS.iron_drill  * 0.3)
          : tile.type === "solar"       ? Math.floor(COSTS.solar       * 0.3)
          : tile.type === "battery"     ? Math.floor(COSTS.battery     * 0.3)
          : 0;
        showToast(`解体完了 +${refund}コイン 返金`, "#F6AD55");
        return { ...prev, money: prev.money + refund, grid: newGrid };
      }

      // 施設設置モード
      if (selectedShop) {
        if (!canPlace(tile, selectedShop)) { showToast("ここには配置できません", "#FC8181"); return prev; }
        const cost = COSTS[selectedShop as keyof typeof COSTS];
        if (prev.money < cost) { showToast("コインが足りません", "#FC8181"); return prev; }
        const newGrid = prev.grid.map(row => row.map(t => ({ ...t })));
        newGrid[r][c] = {
          ...newGrid[r][c],
          type:      selectedShop,
          direction: selectedShop === "belt" ? "up" : undefined,
          beltItem:  undefined,
        };
        showToast(`${SHOP_LABELS[selectedShop]} 設置！`, "#68D391");
        return { ...prev, money: prev.money - cost, grid: newGrid };
      }

      // ベルト回転
      if (tile.type === "belt") {
        const newGrid = prev.grid.map(row => row.map(t => ({ ...t })));
        newGrid[r][c] = { ...newGrid[r][c], direction: nextDirection(newGrid[r][c].direction ?? "up") };
        return { ...prev, grid: newGrid };
      }

      return prev;
    });
  }, [selectedShop, showToast]);

  const toggleShop = useCallback((item: NonNullable<ShopItem>) => {
    setSelectedShop(prev => (prev === item ? null : item));
  }, []);

  const cancelShop = useCallback(() => setSelectedShop(null), []);

  const buyUpgrade = useCallback((key: "efficientPickaxe" | "turbodrillBoost") => {
    setState(prev => {
      if (prev.upgrades[key]) return prev;
      const cost = UPGRADE_COSTS[key];
      if (
        prev.money < cost.money ||
        (cost.stone !== undefined && prev.stone < cost.stone) ||
        (cost.iron  !== undefined && prev.iron  < cost.iron )
      ) {
        showToast("リソースが足りません", "#FC8181");
        return prev;
      }
      showToast("研究完了！", "#C084FC");
      return {
        ...prev,
        money:    prev.money - cost.money,
        stone:    prev.stone - (cost.stone ?? 0),
        iron:     prev.iron  - (cost.iron  ?? 0),
        upgrades: { ...prev.upgrades, [key]: true },
      };
    });
  }, [showToast]);

  // 派生値
  const prodStats = calcProductionStats(
    state.grid, state.dayPhase, state.batteryCharge, state.batteryMax, state.upgrades
  );
  const powerOk     = state.powerUsed <= state.powerMax || state.powerUsed === 0;
  const phaseRemain = Math.round((1 - phaseProgress(state.tick)) * 30);

  return {
    state, activeTab, selectedShop, toasts, clickAnim,
    powerOk, prodStats, phaseRemain,
    setActiveTab, mineStone, mineIron, sellStone, sellIron,
    handleTileClick, toggleShop, cancelShop, buyUpgrade,
  };
}