// ════════════════════════════════════════════════════════════════════
//  components/Dashboard.tsx — 統計ダッシュボード（リアルタイム生産グラフ）
// ════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import type { GameState, ProdStats } from "../types";
import { fmt } from "../utils/gameLogic";
import { ROCKET_REQUIREMENTS } from "../constants";

interface DashboardProps {
  state: GameState;
  prodStats: ProdStats;
  powerOk: boolean;
}

/** スパークラインSVG（小型折れ線グラフ） */
const Sparkline: React.FC<{
  data: number[];
  color: string;
  width?: number;
  height?: number;
}> = ({ data, color, width = 120, height = 32 }) => {
  if (data.length < 2) {
    return (
      <svg width={width} height={height}>
        <line x1="0" y1={height / 2} x2={width} y2={height / 2}
          stroke={color + "30"} strokeWidth="1" strokeDasharray="3 3" />
      </svg>
    );
  }

  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {/* 塗りつぶし領域 */}
      <defs>
        <linearGradient id={`grad_${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#grad_${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 最新値の点 */}
      {data.length > 0 && (() => {
        const lastX = width;
        const lastY = height - (data[data.length - 1] / max) * (height - 4) - 2;
        return (
          <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
        );
      })()}
    </svg>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ state, prodStats, powerOk }) => {
  const { statsHistory, totalTime, totalGearsShipped, totalStonesShipped, totalIronShipped, money, rocketProgress } = state;

  // 直近10秒の統計を集計
  const stoneData = useMemo(() =>
    statsHistory.map(s => s.stoneIn), [statsHistory]);
  const ironData = useMemo(() =>
    statsHistory.map(s => s.ironIn), [statsHistory]);
  const incomeData = useMemo(() =>
    statsHistory.map(s => s.income), [statsHistory]);
  const gearData = useMemo(() =>
    statsHistory.map(s => s.gearShipped), [statsHistory]);

  // 平均値（直近10秒）
  const avg = (arr: number[]) =>
    arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

  const avgStone = avg(stoneData).toFixed(1);
  const avgIron = avg(ironData).toFixed(1);
  const avgIncome = avg(incomeData).toFixed(1);
  const avgGear = avg(gearData).toFixed(2);

  // 稼働時間フォーマット
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // ロケット進捗
  const rocketGearPct = Math.min(100, (totalGearsShipped / ROCKET_REQUIREMENTS.gear) * 100);
  const rocketIronPct = Math.min(100, (totalIronShipped / ROCKET_REQUIREMENTS.iron) * 100);
  const rocketMoneyPct = Math.min(100, (money / ROCKET_REQUIREMENTS.money) * 100);
  const rocketOverall = (rocketGearPct + rocketIronPct + rocketMoneyPct) / 3;

  return (
    <div className="flex flex-col gap-3">
      {/* ─── ヘッダー ─── */}
      <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#444" }}>
        リアルタイム生産統計（直近10秒）
      </div>

      {/* ─── スパークラインカード群 ─── */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="石 生産/s"
          value={`${avgStone}`}
          unit="/s"
          color="#A0AFBF"
          data={stoneData}
          total={totalStonesShipped}
          totalLabel="累計出荷"
        />
        <StatCard
          label="鉄 生産/s"
          value={`${avgIron}`}
          unit="/s"
          color="#63B3ED"
          data={ironData}
          total={totalIronShipped}
          totalLabel="累計出荷"
        />
        <StatCard
          label="収入/s"
          value={`${avgIncome}`}
          unit="¥/s"
          color="#F5C842"
          data={incomeData}
          total={undefined}
        />
        <StatCard
          label="歯車 出荷/s"
          value={`${avgGear}`}
          unit="/s"
          color="#e0c070"
          data={gearData}
          total={totalGearsShipped}
          totalLabel="累計出荷"
        />
      </div>

      {/* ─── 設備カウント ─── */}
      <div
        className="rounded-xl px-3 py-2.5"
        style={{ background: "#1a1a24", border: "1px solid #252535" }}
      >
        <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "#444" }}>
          設備一覧
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            { label: "石ドリル",  value: prodStats.stoneDrillCnt, color: "#A0AFBF" },
            { label: "鉄ドリル",  value: prodStats.ironDrillCnt,  color: "#63B3ED" },
            { label: "ベルト",    value: prodStats.beltCnt,        color: "#68D391" },
            { label: "ソーラー",  value: prodStats.solarCnt,       color: "#4ade80" },
            { label: "蓄電池",    value: prodStats.batteryCnt,     color: "#a78bfa" },
            { label: "組立機",    value: prodStats.assemblerCnt,   color: "#e0a060" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between text-xs">
              <span style={{ color: "#555" }}>{label}</span>
              <span style={{ color: value > 0 ? color : "#333" }} className="tabular-nums font-bold">
                {value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 flex justify-between text-xs" style={{ borderTop: "1px solid #1e1e2a" }}>
          <span style={{ color: "#555" }}>電力効率</span>
          <span
            className="font-bold"
            style={{ color: prodStats.efficiency >= 1 ? "#4ade80" : "#FC8181" }}
          >
            {Math.round(prodStats.efficiency * 100)}%
            {prodStats.efficiency < 1 && " ⚠電力不足"}
          </span>
        </div>
      </div>

      {/* ─── ロケット進捗 ─── */}
      <div
        className="rounded-xl px-3 py-2.5"
        style={{
          background: "#0a1420",
          border: "1px solid #1a4060",
          boxShadow: "inset 0 0 16px #1a406030",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#2a6090" }}>
            🚀 ロケット打ち上げ進捗
          </div>
          <span className="text-xs font-bold" style={{ color: "#4090c0" }}>
            {Math.floor(rocketOverall)}%
          </span>
        </div>

        {[
          {
            label: "歯車出荷",
            current: totalGearsShipped,
            required: ROCKET_REQUIREMENTS.gear,
            pct: rocketGearPct,
            color: "#e0c070",
          },
          {
            label: "鉄出荷",
            current: totalIronShipped,
            required: ROCKET_REQUIREMENTS.iron,
            pct: rocketIronPct,
            color: "#63B3ED",
          },
          {
            label: "資金",
            current: Math.floor(money),
            required: ROCKET_REQUIREMENTS.money,
            pct: rocketMoneyPct,
            color: "#F5C842",
            prefix: "¥",
          },
        ].map(({ label, current, required, pct, color, prefix }) => (
          <div key={label} className="mb-2">
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px]" style={{ color: "#446" }}>{label}</span>
              <span className="text-[10px] tabular-nums" style={{ color: pct >= 100 ? color : "#446" }}>
                {prefix ?? ""}{fmt(current)} / {prefix ?? ""}{fmt(required)}
                {pct >= 100 && " ✓"}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#111a2a" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct >= 100
                    ? `linear-gradient(90deg, ${color}, ${color}cc)`
                    : `linear-gradient(90deg, ${color}50, ${color}80)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ─── 稼働時間 ─── */}
      <div
        className="rounded-xl px-3 py-2 text-center"
        style={{ background: "#111118", border: "1px solid #1e1e2a" }}
      >
        <span className="text-[10px]" style={{ color: "#333" }}>
          稼働時間: {formatTime(totalTime)}
        </span>
      </div>
    </div>
  );
};

/** 統計カード（スパークライン付き） */
const StatCard: React.FC<{
  label: string;
  value: string;
  unit: string;
  color: string;
  data: number[];
  total?: number;
  totalLabel?: string;
}> = ({ label, value, unit, color, data, total, totalLabel }) => (
  <div
    className="rounded-xl px-2.5 py-2"
    style={{
      background: "#1a1a24",
      border: `1px solid ${color}20`,
    }}
  >
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-bold" style={{ color: "#555" }}>{label}</span>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
        {value}<span className="text-[9px] opacity-60 ml-0.5">{unit}</span>
      </span>
    </div>
    <Sparkline data={data} color={color} width={110} height={28} />
    {total !== undefined && totalLabel && (
      <div className="mt-1 text-[9px] tabular-nums" style={{ color: "#444" }}>
        {totalLabel}: {fmt(total)}
      </div>
    )}
  </div>
);
