// ════════════════════════════════════════════════════════════════════
//  components/Icons.tsx — ゲーム内SVGアイコン群
// ════════════════════════════════════════════════════════════════════

import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string };

export const PickaxeIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M14.5 2.5 L21.5 9.5 L17 14 L10 7 Z" fill="currentColor" opacity="0.8"/>
    <path d="M10 7 L3 17 L2 22 L7 21 L17 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

export const CoinIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="9" stroke="#F5C842" strokeWidth="1.5"/>
    <text x="12" y="16.5" textAnchor="middle" fontSize="10" fill="#F5C842" fontWeight="bold">¥</text>
  </svg>
);

export const StoneIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <polygon points="12,3 20,8 20,16 12,21 4,16 4,8" fill="#52596a" stroke="#8899aa" strokeWidth="1.2"/>
    <polygon points="12,3 20,8 12,10 4,8" fill="#6a7585" opacity="0.7"/>
    <polygon points="12,10 20,8 20,16 12,21" fill="#3a4050" opacity="0.5"/>
  </svg>
);

export const IronIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <rect x="4" y="6" width="16" height="12" rx="2" fill="#2e4d6e" stroke="#4a7aaa" strokeWidth="1.2"/>
    <rect x="7" y="9" width="10" height="6" rx="1" fill="#3a6090" opacity="0.8"/>
    <line x1="7" y1="12" x2="17" y2="12" stroke="#5a8ab0" strokeWidth="0.8"/>
  </svg>
);

export const GearIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="3" fill="#c0a060" stroke="#e0c080" strokeWidth="1"/>
    <path d="M12 2 L13.5 5.5 L17 4 L17 7.5 L20.5 8 L19 11.5 L22 13 L19 14.5 L20.5 18 L17 17.5 L17 21 L13.5 19.5 L12 22 L10.5 19.5 L7 21 L7 17.5 L3.5 18 L5 14.5 L2 13 L5 11.5 L3.5 8 L7 7.5 L7 4 L10.5 5.5 Z"
      stroke="#d0a050" strokeWidth="1.2" fill="none"/>
    <circle cx="12" cy="12" r="2" fill="#e0c070"/>
  </svg>
);

export const DrillIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <rect x="10" y="3" width="4" height="14" rx="1" fill="#4a7aaa"/>
    <polygon points="8,17 12,22 16,17" fill="#5090c0"/>
    <rect x="6" y="7" width="12" height="4" rx="1" fill="#3a5a80"/>
    <circle cx="12" cy="9" r="1.5" fill="#7ab0e0"/>
  </svg>
);

export const BeltIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <rect x="2" y="9" width="20" height="6" rx="3" fill="#1e5040" stroke="#2e7060" strokeWidth="1"/>
    <circle cx="5" cy="12" r="2.5" fill="#2e6050" stroke="#4e9070" strokeWidth="1"/>
    <circle cx="19" cy="12" r="2.5" fill="#2e6050" stroke="#4e9070" strokeWidth="1"/>
    <line x1="7.5" y1="12" x2="16.5" y2="12" stroke="#4e9070" strokeWidth="1.5" strokeDasharray="2 2"/>
    <polygon points="13,8 17,12 13,16" fill="#68D391" opacity="0.8"/>
  </svg>
);

export const SolarIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <rect x="4" y="8" width="16" height="10" rx="1" fill="#1a3010" stroke="#3a6020" strokeWidth="1"/>
    <line x1="8" y1="8" x2="8" y2="18" stroke="#3a6020" strokeWidth="0.8"/>
    <line x1="12" y1="8" x2="12" y2="18" stroke="#3a6020" strokeWidth="0.8"/>
    <line x1="16" y1="8" x2="16" y2="18" stroke="#3a6020" strokeWidth="0.8"/>
    <line x1="4" y1="12" x2="20" y2="12" stroke="#3a6020" strokeWidth="0.8"/>
    <circle cx="12" cy="4" r="2" fill="#FCD34D" opacity="0.9"/>
    <line x1="12" y1="1" x2="12" y2="2.5" stroke="#FCD34D" strokeWidth="1"/>
    <line x1="15" y1="2" x2="14.2" y2="3.2" stroke="#FCD34D" strokeWidth="1"/>
    <line x1="9" y1="2" x2="9.8" y2="3.2" stroke="#FCD34D" strokeWidth="1"/>
  </svg>
);

export const BatteryIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <rect x="2" y="7" width="18" height="10" rx="2" fill="#1e1040" stroke="#4a3080" strokeWidth="1.2"/>
    <rect x="20" y="10" width="2" height="4" rx="1" fill="#4a3080"/>
    <rect x="4" y="9" width="10" height="6" rx="1" fill="#6a50b0" opacity="0.7"/>
    <path d="M11 9.5 L9 12.5 L11 12.5 L9 14.5" stroke="#a78bfa" strokeWidth="1.2" fill="none"/>
  </svg>
);

export const AssemblerIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" fill="#2a1a10" stroke="#7a4020" strokeWidth="1.2"/>
    <circle cx="12" cy="12" r="4" fill="none" stroke="#c0803040" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill="#d09050"/>
    <line x1="12" y1="4" x2="12" y2="8" stroke="#7a4020" strokeWidth="1.5"/>
    <line x1="12" y1="16" x2="12" y2="20" stroke="#7a4020" strokeWidth="1.5"/>
    <line x1="4" y1="12" x2="8" y2="12" stroke="#7a4020" strokeWidth="1.5"/>
    <line x1="16" y1="12" x2="20" y2="12" stroke="#7a4020" strokeWidth="1.5"/>
  </svg>
);

export const TrashIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const FactoryIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <rect x="2" y="12" width="20" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 12 L7 8 L7 12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M7 12 L12 8 L12 12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M12 12 L17 8 L17 12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="5" y="16" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="10.5" y="16" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="16" y="16" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="8" y="4" width="2" height="8" rx="1" fill="currentColor" opacity="0.6"/>
    <line x1="6" y1="3" x2="11" y2="3" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

export const ResearchIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="11" y1="8" x2="11" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const StatsIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity="0.7"/>
    <rect x="10" y="7" width="4" height="14" rx="1" fill="currentColor" opacity="0.8"/>
    <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor"/>
    <line x1="2" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const SunIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="4" fill="currentColor"/>
    <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="4.9" y1="4.9" x2="7.1" y2="7.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="16.9" y1="16.9" x2="19.1" y2="19.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="19.1" y1="4.9" x2="16.9" y2="7.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="7.1" y1="16.9" x2="4.9" y2="19.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const MoonIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
  </svg>
);

export const RocketIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <path d="M12 2C12 2 8 7 8 13H16C16 7 12 2 12 2Z" fill="currentColor" opacity="0.9"/>
    <rect x="9" y="13" width="6" height="5" rx="1" fill="currentColor" opacity="0.7"/>
    <path d="M9 18 L6 21 L9 20" fill="currentColor" opacity="0.5"/>
    <path d="M15 18 L18 21 L15 20" fill="currentColor" opacity="0.5"/>
    <circle cx="12" cy="10" r="1.5" fill="#60a0f0"/>
    <path d="M10 21 L12 23 L14 21" stroke="#f06040" strokeWidth="1.5" fill="none"/>
  </svg>
);

export const HubIcon = ({ className, ...p }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" {...p}>
    <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#3a1030" stroke="#9a2060" strokeWidth="1.5"/>
    <polygon points="12,6 17,9 17,15 12,18 7,15 7,9" fill="#5a1848" stroke="#c03070" strokeWidth="1"/>
    <circle cx="12" cy="12" r="2.5" fill="#e050a0" opacity="0.9"/>
    <line x1="12" y1="6" x2="12" y2="9.5" stroke="#e050a0" strokeWidth="1"/>
    <line x1="12" y1="14.5" x2="12" y2="18" stroke="#e050a0" strokeWidth="1"/>
    <line x1="7" y1="12" x2="9.5" y2="12" stroke="#e050a0" strokeWidth="1"/>
    <line x1="14.5" y1="12" x2="17" y2="12" stroke="#e050a0" strokeWidth="1"/>
  </svg>
);
