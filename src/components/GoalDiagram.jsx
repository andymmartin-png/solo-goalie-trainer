import { ZONE_POSITIONS, stickRendersLeft } from '../data/drills';

// Logical grid: column 0 = stick side, column 1 = center, column 2 = off-stick
const ZONES = [
  ['High Stick-Side', 'High Center',  'High Off-Stick'],
  ['Mid Stick-Side',  null,           'Mid Off-Stick' ],
  ['Low Stick-Side',  '5-Hole',       'Low Off-Stick' ],
];

const ZONE_ABBR = {
  'High Stick-Side': ['High', 'Stick'],
  'High Center':     ['High', 'Ctr'],
  'High Off-Stick':  ['High', 'Off-Stk'],
  'Mid Stick-Side':  ['Mid',  'Stick'],
  '5-Hole':          ['5',    'Hole'],
  'Mid Off-Stick':   ['Mid',  'Off-Stk'],
  'Low Stick-Side':  ['Low',  'Stick'],
  'Low Off-Stick':   ['Low',  'Off-Stk'],
};

const GX = 24, GY = 16, GW = 252, GH = 192;
const CW = GW / 3, RH = GH / 3;

export default function GoalDiagram({ activeZone, handedness, level, perspective = 'goalie' }) {
  const left = stickRendersLeft(handedness, perspective);
  const toScreenCol = lci => (left ? lci : 2 - lci);

  const activeLogical = activeZone ? ZONE_POSITIONS[activeZone] : null;
  const activeScreen  = activeLogical
    ? { row: activeLogical.row, col: toScreenCol(activeLogical.col) }
    : null;

  const stickScreenCol = toScreenCol(0);
  const offScreenCol   = toScreenCol(2);

  return (
    <svg viewBox="0 0 300 240" className="goal-diagram" aria-label="Goal diagram">
      {/* Net background */}
      <rect x={GX} y={GY} width={GW} height={GH} fill="#0f172a" />

      {/* Net crosshatch lines */}
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`h${i}`}
          x1={GX} y1={GY + i * (GH / 12)}
          x2={GX + GW} y2={GY + i * (GH / 12)}
          stroke="#1e3a5f" strokeWidth="0.5"
        />
      ))}
      {Array.from({ length: 19 }, (_, i) => (
        <line key={`v${i}`}
          x1={GX + i * (GW / 18)} y1={GY}
          x2={GX + i * (GW / 18)} y2={GY + GH}
          stroke="#1e3a5f" strokeWidth="0.5"
        />
      ))}

      {/* Zone cells — iterate logical grid, place each at its screen column */}
      {ZONES.map((row, ri) =>
        row.map((zoneName, lci) => {
          if (!zoneName) return null;
          const sci = toScreenCol(lci);
          const isActive = activeScreen?.row === ri && activeScreen?.col === sci;
          const x = GX + sci * CW;
          const y = GY + ri * RH;
          const cx = x + CW / 2;
          const cy = y + RH / 2;
          const [abbr1, abbr2] = ZONE_ABBR[zoneName];

          return (
            <g key={zoneName}>
              <rect
                x={x} y={y} width={CW} height={RH}
                fill={isActive ? '#facc15' : 'rgba(30,58,95,0.5)'}
                stroke={isActive ? '#fde047' : '#1e40af'}
                strokeWidth={isActive ? 2 : 1}
              />
              {isActive && (
                <rect
                  x={x - 2} y={y - 2} width={CW + 4} height={RH + 4}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="3"
                  opacity="0.5"
                  rx="2"
                />
              )}
              {level <= 3 && (
                <>
                  <text x={cx} y={cy - 7} textAnchor="middle" fontSize="11"
                    fill={isActive ? '#0f172a' : '#475569'} fontWeight={isActive ? '700' : '400'}>
                    {abbr1}
                  </text>
                  <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11"
                    fill={isActive ? '#0f172a' : '#475569'} fontWeight={isActive ? '700' : '400'}>
                    {abbr2}
                  </text>
                </>
              )}
              {level === 4 && (
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize="10"
                  fill={isActive ? '#0f172a' : '#1e3a5f'}>
                  {isActive ? '●' : '·'}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* Divider lines between zones */}
      <line x1={GX + CW}     y1={GY} x2={GX + CW}     y2={GY + GH} stroke="#1e40af" strokeWidth="1.5" />
      <line x1={GX + CW * 2} y1={GY} x2={GX + CW * 2} y2={GY + GH} stroke="#1e40af" strokeWidth="1.5" />
      <line x1={GX} y1={GY + RH}     x2={GX + GW} y2={GY + RH}     stroke="#1e40af" strokeWidth="1.5" />
      <line x1={GX} y1={GY + RH * 2} x2={GX + GW} y2={GY + RH * 2} stroke="#1e40af" strokeWidth="1.5" />

      {/* Goal frame */}
      <rect x={GX - 6} y={GY - 6} width={8} height={GH + 12} fill="#cbd5e1" rx="2" />
      <rect x={GX + GW - 2} y={GY - 6} width={8} height={GH + 12} fill="#cbd5e1" rx="2" />
      <rect x={GX - 6} y={GY - 8} width={GW + 14} height={8} fill="#cbd5e1" rx="2" />
      <line x1={GX - 6} y1={GY + GH + 6} x2={GX + GW + 6} y2={GY + GH + 6}
        stroke="#475569" strokeWidth="2" />

      {/* Side labels */}
      <text x={GX + stickScreenCol * CW + CW / 2} y={230}
        textAnchor="middle" fontSize="11" fill="#B1CDE3" fontWeight="600">
        Stick Side
      </text>
      <text x={GX + offScreenCol * CW + CW / 2} y={230}
        textAnchor="middle" fontSize="11" fill="#64748b">
        Off-Stick
      </text>
    </svg>
  );
}
