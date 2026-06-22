import { CONE_COLOR_MAP } from '../data/drills';

// Positions cones along a shallow upward arc by their shooter-position slot.
// Cones carry an absolute field slot (`position`, 0 = Left Pipe … 4 = Right Pipe),
// so the arc always reads left → right as the goalie faces the field — no
// handedness/perspective mirroring (the position labels are absolute).
function computePositions(cones, W, H) {
  const n = cones.length;
  const left = 40, right = W - 40;
  const baseY = H - 30, apexY = H * 0.25;
  const slots = cones.map((c, i) => (typeof c.position === 'number' ? c.position : i));
  const maxSlot = Math.max(4, ...slots);

  return cones.map((cone, i) => {
    const t = n === 1 ? 0.5 : slots[i] / maxSlot;
    const x = left + t * (right - left);
    const normalized = 2 * t - 1; // -1 to 1
    const y = apexY + (baseY - apexY) * normalized * normalized;
    return { ...cone, x, y };
  });
}

export default function ConeDiagram({ cones, activeCone, compact = false }) {
  const W = compact ? 280 : 300;
  const H = compact ? 90  : 180;
  const positions = computePositions(cones, W, H);

  // Draw a smooth arc path through cone positions
  const pathD = positions.length >= 2
    ? `M ${positions[0].x} ${positions[0].y} ` +
      positions.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={compact ? 'cone-diagram-compact' : 'cone-diagram'}
      aria-label="Cone diagram">
      {/* Arc guide */}
      <path d={pathD} fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeDasharray="5 4" />

      {positions.map(cone => {
        const isActive = cone.color === activeCone;
        const r = isActive ? (compact ? 16 : 28) : (compact ? 10 : 18);
        const color = CONE_COLOR_MAP[cone.color] ?? '#94a3b8';
        const isBright = ['Yellow', 'White'].includes(cone.color);

        return (
          <g key={cone.color}>
            {/* Glow ring for active cone */}
            {isActive && (
              <circle cx={cone.x} cy={cone.y} r={r + 6}
                fill="none" stroke={color} strokeWidth="2" opacity="0.4" />
            )}
            {/* Cone body — triangle shape */}
            <polygon
              points={`
                ${cone.x},${cone.y - r}
                ${cone.x - r * 0.8},${cone.y + r * 0.6}
                ${cone.x + r * 0.8},${cone.y + r * 0.6}
              `}
              fill={color}
              opacity={isActive ? 1 : 0.35}
              stroke={isActive ? 'white' : 'transparent'}
              strokeWidth="1.5"
            />
            {/* Cone base line */}
            <line
              x1={cone.x - r * 0.9} y1={cone.y + r * 0.6}
              x2={cone.x + r * 0.9} y2={cone.y + r * 0.6}
              stroke={isActive ? 'white' : color}
              strokeWidth={isActive ? 2 : 1}
              opacity={isActive ? 0.8 : 0.4}
            />
            {/* Color label */}
            {!compact && (
              <text
                x={cone.x}
                y={cone.y + r + 16}
                textAnchor="middle"
                fontSize="11"
                fill={isActive ? 'white' : '#475569'}
                fontWeight={isActive ? '700' : '400'}
              >
                {cone.color}
              </text>
            )}
            {/* Shooter-position label on active cone (non-compact) */}
            {!compact && isActive && cone.shotFrom && (
              <text
                x={cone.x}
                y={cone.y - r - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
              >
                {cone.shotFrom}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
