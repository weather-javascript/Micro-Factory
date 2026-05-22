// ════════════════════════════════════════════════════════════════════
//  components/Icons.tsx — SVGアイコン群（外部画像なし・インライン定義）
// ════════════════════════════════════════════════════════════════════

import type React from "react";

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PickaxeIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <path d="M3 21L10.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 4L20 10L13 17L7 11L14 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 4L17 2L22 7L20 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 21L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const CoinIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#F5C842" strokeWidth="2" fill="#F5C84218"/>
    <text x="12" y="16.5" textAnchor="middle" fontSize="10" fill="#F5C842" fontWeight="bold">¥</text>
  </svg>
);

export const StoneIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <polygon points="4,18 8,6 16,5 20,12 17,19 7,20"
      fill="#7C8A99" stroke="#A0AFBF" strokeWidth="1.5" strokeLinejoin="round"/>
    <polygon points="8,6 12,8 10,14 6,13" fill="#9AABB8" opacity="0.6"/>
    <line x1="12" y1="8" x2="16" y2="10" stroke="#A0AFBF" strokeWidth="1" opacity="0.5"/>
  </svg>
);

export const IronIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <rect x="3"  y="10" width="18" height="9" rx="2" fill="#7B8FA1" stroke="#A8BBC9" strokeWidth="1.5"/>
    <rect x="6"  y="7"  width="12" height="5" rx="1.5" fill="#8FA4B5" stroke="#A8BBC9" strokeWidth="1.5"/>
    <rect x="5"  y="10" width="3"  height="3" rx="0.5" fill="#C0D0DC" opacity="0.5"/>
    <rect x="16" y="10" width="3"  height="3" rx="0.5" fill="#C0D0DC" opacity="0.5"/>
  </svg>
);

export const DrillIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="10" width="12" height="5" rx="1.5" fill="#4A5568" stroke="#718096" strokeWidth="1.5"/>
    <polygon points="14,9.5 20,12 14,14.5" fill="#63B3ED" stroke="#4299E1" strokeWidth="1"/>
    <rect x="4" y="11.5" width="2" height="2" rx="0.3" fill="#2D3748"/>
    <rect x="8" y="11.5" width="2" height="2" rx="0.3" fill="#2D3748"/>
    <line x1="2" y1="8" x2="14" y2="8" stroke="#718096" strokeWidth="1" strokeDasharray="2 2"/>
  </svg>
);

export const BeltIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" fill="#1e2a20" stroke="#2a4030" strokeWidth="1.5"/>
    <path d="M12 17V7M8 11L12 7L16 11"
      stroke="#68D391" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LightningIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z"
      fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

export const SolarIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="8" width="18" height="10" rx="1.5" fill="#1a3010" stroke="#4ade80" strokeWidth="1.5"/>
    <line x1="3"  y1="13" x2="21" y2="13" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
    <line x1="10" y1="8"  x2="10" y2="18" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
    <line x1="17" y1="8"  x2="17" y2="18" stroke="#4ade80" strokeWidth="1" opacity="0.5"/>
    <path d="M8 5L9 7M12 4V6M16 5L15 7" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const BatteryIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <rect x="2"  y="7" width="18" height="10" rx="2" fill="#1a1530" stroke="#7c3aed" strokeWidth="1.5"/>
    <rect x="20" y="10" width="2" height="4" rx="1" fill="#7c3aed"/>
    <rect x="4"  y="9" width="5"  height="6" rx="1" fill="#7c3aed" opacity="0.8"/>
    <rect x="10" y="9" width="5"  height="6" rx="1" fill="#7c3aed" opacity="0.4"/>
  </svg>
);

export const HubIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <polygon points="12,2 22,7 22,17 12,22 2,17 2,7"
      fill="#2a1020" stroke="#f472b6" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="4" fill="#f472b6" opacity="0.3"/>
    <circle cx="12" cy="12" r="2" fill="#f472b6"/>
    <line x1="12" y1="6"  x2="12" y2="10" stroke="#f472b6" strokeWidth="1.2" opacity="0.6"/>
    <line x1="12" y1="14" x2="12" y2="18" stroke="#f472b6" strokeWidth="1.2" opacity="0.6"/>
    <line x1="6"  y1="12" x2="10" y2="12" stroke="#f472b6" strokeWidth="1.2" opacity="0.6"/>
    <line x1="14" y1="12" x2="18" y2="12" stroke="#f472b6" strokeWidth="1.2" opacity="0.6"/>
  </svg>
);

export const ResearchIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <path d="M9 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V5C19 3.9 18.1 3 17 3H15"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="9" y="2" width="6" height="4" rx="1" fill="currentColor" opacity="0.4"/>
    <line x1="9" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="18" x2="12" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const FactoryIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <path d="M2 20V10L7 14V10L12 14V10L17 14V6H22V20H2Z"
      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      fill="currentColor" opacity="0.15"/>
    <rect x="8"  y="16" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.6"/>
    <rect x="13" y="16" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.6"/>
  </svg>
);

export const TrashIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <path d="M3 6H21M8 6V4H16V6M19 6L18 20H6L5 6H19Z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const SunIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="4" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"/>
    <path d="M12 2V4M12 20V22M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78
             M2 12H4M20 12H22M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
      stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const MoonIcon = ({ className = "", style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
      fill="#818CF8" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);