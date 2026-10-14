// Original mascot: a small astronaut roadrunner with a jetpack, drawn in the
// site palette. Nothing here is GitHub's or UTSA's artwork. Waving, facing
// the viewer, flame on so it reads as "about to launch".
export default function Mascot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 220" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="visor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dff2fb" />
          <stop offset="55%" stopColor="#5fa9cf" />
          <stop offset="100%" stopColor="#1c3b57" />
        </linearGradient>
        <linearGradient id="suit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2eef9" />
          <stop offset="100%" stopColor="#bdb6cc" />
        </linearGradient>
        <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb15c" />
          <stop offset="60%" stopColor="#ff7a1a" />
          <stop offset="100%" stopColor="#ff3b30" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* jetpack flames */}
      <path d="M72 158 q-10 30 0 54 q10-24 0-54z" fill="url(#flame)" />
      <path d="M128 158 q-10 30 0 54 q10-24 0-54z" fill="url(#flame)" />

      {/* jetpack */}
      <rect x="56" y="104" width="30" height="58" rx="10" fill="#3b3647" />
      <rect x="114" y="104" width="30" height="58" rx="10" fill="#3b3647" />
      <rect x="62" y="112" width="18" height="10" rx="4" fill="#ff7a1a" />
      <rect x="120" y="112" width="18" height="10" rx="4" fill="#ff7a1a" />

      {/* legs and boots */}
      <rect x="78" y="168" width="18" height="26" rx="8" fill="url(#suit)" />
      <rect x="104" y="168" width="18" height="26" rx="8" fill="url(#suit)" />
      <rect x="74" y="186" width="26" height="14" rx="7" fill="#3b3647" />
      <rect x="100" y="186" width="26" height="14" rx="7" fill="#3b3647" />

      {/* body */}
      <rect x="66" y="104" width="68" height="72" rx="26" fill="url(#suit)" />
      <rect x="84" y="124" width="32" height="22" rx="6" fill="#2a2634" />
      <circle cx="92" cy="135" r="3" fill="#ff3b30" />
      <circle cx="101" cy="135" r="3" fill="#9ad3ea" />
      <circle cx="110" cy="135" r="3" fill="#ffb15c" />

      {/* arms: left down, right waving */}
      <path d="M68 118 q-26 10 -22 44" stroke="url(#suit)" strokeWidth="16" strokeLinecap="round" fill="none" />
      <circle cx="46" cy="164" r="10" fill="#3b3647" />
      <path d="M132 118 q28 -4 30 -40" stroke="url(#suit)" strokeWidth="16" strokeLinecap="round" fill="none" />
      <circle cx="164" cy="72" r="11" fill="#3b3647" />

      {/* helmet */}
      <circle cx="100" cy="68" r="46" fill="#f2eef9" />
      <circle cx="100" cy="70" r="36" fill="url(#visor)" />
      {/* roadrunner silhouette inside the visor: crest, beak, eye */}
      <path d="M86 46 l-6 -16 l10 10 l2 -14 l6 14 l6 -10 l-4 18z" fill="#2a2634" />
      <ellipse cx="98" cy="72" rx="20" ry="16" fill="#2a2634" />
      <path d="M116 70 l20 4 l-20 6z" fill="#ff7a1a" />
      <circle cx="104" cy="66" r="4" fill="#f2eef9" />
      <circle cx="105" cy="66" r="2" fill="#15121c" />
      {/* visor glare */}
      <path d="M72 56 q10 -18 30 -20" stroke="rgba(255,255,255,0.7)" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* helmet ring and antenna */}
      <rect x="62" y="104" width="76" height="12" rx="6" fill="#8b84a0" />
      <line x1="138" y1="40" x2="150" y2="24" stroke="#8b84a0" strokeWidth="4" strokeLinecap="round" />
      <circle cx="152" cy="22" r="5" fill="#ff3b30" />
    </svg>
  );
}
