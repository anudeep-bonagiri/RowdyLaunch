// The ship interior, drawn in SVG so it scales to any viewport without assets.
// Eight bulkhead wedges around a circular hatch, red indicator strips on the
// upper panels, white light bars left and right, a walkway at the bottom.
// `cx` lets the hatch sit right of centre on wide screens so the copy has room.

export const HATCH_R = 200; // inner radius in SVG units; .porthole-view mirrors it via --hatch
const CY = 450;
const R_OUT = 1100;

const shades = ["#3b3647", "#433d51", "#352f41", "#4b4559", "#3b3647", "#352f41", "#433d51", "#3b3647"];

export default function Airlock({ cx = 720 }: { cx?: number }) {
  const CX = cx;
  const n = 8;
  const hole = HATCH_R + 14;
  const holePath = `M ${CX - hole} ${CY} a ${hole} ${hole} 0 1 0 ${hole * 2} 0 a ${hole} ${hole} 0 1 0 ${-hole * 2} 0 Z`;

  const wedge = (i: number, rIn: number, rOut: number, gap: number) => {
    const a0 = (i / n) * Math.PI * 2 + gap;
    const a1 = ((i + 1) / n) * Math.PI * 2 - gap;
    const p = (r: number, a: number) => `${(CX + r * Math.cos(a)).toFixed(1)} ${(CY + r * Math.sin(a)).toFixed(1)}`;
    return `M ${p(rIn, a0)} L ${p(rOut, a0)} L ${p(rOut, a1)} L ${p(rIn, a1)} Z`;
  };

  return (
    <svg className="airlock" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="vig" cx="50%" cy="50%" r="70%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.75" />
        </radialGradient>
        <linearGradient id="ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b84a0" />
          <stop offset="100%" stopColor="#4b4559" />
        </linearGradient>
        <linearGradient id="walk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2634" />
          <stop offset="100%" stopColor="#15121c" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* hull base with a transparent hole where the hatch is, so the sky shows through */}
      <path d={`M-400 0H1840V900H-400Z ${holePath}`} fill="#15121c" fillRule="evenodd" />

      {/* bulkhead wedges */}
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={wedge(i, HATCH_R + 40, R_OUT, 0.018)} fill={shades[i]} stroke="#15121c" strokeWidth="3" />
      ))}
      {Array.from({ length: n }, (_, i) => (
        <path key={`l${i}`} d={wedge(i, HATCH_R + 120, R_OUT, 0.055)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
      ))}

      {/* red indicator strips on the two upper wedges */}
      {[-0.42, 0.42].map((t, i) => {
        const a = -Math.PI / 2 + t;
        const r = HATCH_R + 110;
        const x = CX + r * Math.cos(a);
        const y = CY + r * Math.sin(a);
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI + 90})`} filter="url(#glow)">
            <rect x="-26" y="-5" width="52" height="10" rx="5" fill="#ff3b30" />
          </g>
        );
      })}

      {/* white light bars, left and right of the hatch */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${CX + s * 470} ${CY + 70})`}>
          <rect x="-70" y="-26" width="140" height="52" rx="8" fill="#2a2634" />
          <rect x="-58" y="-14" width="116" height="28" rx="6" fill="#f6f1e6" opacity="0.95" filter="url(#glow)" />
        </g>
      ))}

      {/* hatch ring */}
      <circle cx={CX} cy={CY} r={HATCH_R + 27} fill="none" stroke="url(#ring)" strokeWidth="26" />
      <circle cx={CX} cy={CY} r={HATCH_R + 14} fill="none" stroke="#2a2634" strokeWidth="6" />
      <circle cx={CX} cy={CY} r={HATCH_R + 11} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="10" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = HATCH_R + 27;
        return <circle key={i} cx={CX + r * Math.cos(a)} cy={CY + r * Math.sin(a)} r="4" fill="#15121c" />;
      })}

      {/* walkway */}
      <path d={`M ${CX - 110} ${CY + 150} L ${CX + 110} ${CY + 150} L ${CX + 400} 900 L ${CX - 400} 900 Z`} fill="url(#walk)" />
      <path d={`M ${CX - 55} ${CY + 150} L ${CX + 55} ${CY + 150} L ${CX + 190} 900 L ${CX - 190} 900 Z`} fill="rgba(255,255,255,0.03)" />

      {/* hull markings */}
      <text x={CX - 560} y="640" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="rgba(242,238,249,0.3)" letterSpacing="4">RL-31</text>
      <text x={CX + 400} y="640" fontFamily="JetBrains Mono, monospace" fontSize="22" fill="rgba(242,238,249,0.3)" letterSpacing="4">UTSA</text>

      <path d={`M-400 0H1840V900H-400Z ${holePath}`} fill="url(#vig)" fillRule="evenodd" />
    </svg>
  );
}
