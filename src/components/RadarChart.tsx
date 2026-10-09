import React from 'react';

interface RadarChartProps {
  scores: [number, number, number, number, number];
  labels?: string[];
  benchmark?: [number, number, number, number, number];
  size?: number;
  isDark?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  scores,
  labels = ['S 概覽視角', 'Q 問題意識', 'R1 關鍵擷取', 'R2 消化改寫', 'R3 複習整合'],
  benchmark = [85, 85, 85, 85, 85],
  size = 320,
  isDark = false,
}) => {
  const center = size / 2;
  const radius = size * 0.38;
  const numAxes = 5;
  const angleStep = (Math.PI * 2) / numAxes;
  // Rotate so first vertex points straight up (angle = -PI/2)
  const offset = -Math.PI / 2;

  // Helper to calculate coordinates
  const getCoordinates = (index: number, value: number) => {
    const angle = offset + index * angleStep;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Helper for polygon SVG points string
  const getPolygonPoints = (values: number[]) => {
    return values
      .map((val, idx) => {
        const { x, y } = getCoordinates(idx, Math.min(100, Math.max(0, val)));
        return `${x},${y}`;
      })
      .join(' ');
  };

  const gridLevels = [20, 40, 60, 80, 100];
  const dataPoints = scores.map((val, idx) => getCoordinates(idx, val));

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible select-none transition-all duration-300"
      >
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="benchmarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric Grid Web */}
        {gridLevels.map((level) => {
          const points = Array.from({ length: numAxes })
            .map((_, i) => {
              const { x, y } = getCoordinates(i, level);
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <g key={level}>
              <polygon
                points={points}
                fill={level === 100 ? (isDark ? '#1e293b' : '#f8fafc') : 'none'}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                strokeWidth={level === 100 ? '1.5' : '1'}
                strokeDasharray={level < 100 ? '3 3' : 'none'}
              />
              {/* Level indicator */}
              <text
                x={center}
                y={center - (level / 100) * radius - 2}
                textAnchor="middle"
                fontSize="9"
                fill={isDark ? '#64748b' : '#94a3b8'}
                fontWeight="500"
              >
                {level}
              </text>
            </g>
          );
        })}

        {/* Radial Axis Lines */}
        {Array.from({ length: numAxes }).map((_, i) => {
          const { x, y } = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={isDark ? '#475569' : '#cbd5e1'}
              strokeWidth="1"
            />
          );
        })}

        {/* Benchmark / Teacher Standard Polygon */}
        {benchmark && (
          <polygon
            points={getPolygonPoints(benchmark)}
            fill="url(#benchmarkGradient)"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="transition-all duration-500 opacity-60"
          />
        )}

        {/* Student Actual Score Polygon */}
        <polygon
          points={getPolygonPoints(scores)}
          fill="url(#scoreGradient)"
          stroke="#10b981"
          strokeWidth="2.5"
          filter="url(#glow)"
          className="transition-all duration-700 ease-out"
        />

        {/* Score Points & Value Tooltip Badges */}
        {dataPoints.map((pt, i) => (
          <g key={i} className="transition-all duration-500">
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#ffffff"
              stroke="#059669"
              strokeWidth="2.5"
              className="hover:r-6 cursor-pointer drop-shadow-sm"
            />
            {/* Score pill */}
            <rect
              x={pt.x - 14}
              y={pt.y - 20}
              width="28"
              height="16"
              rx="8"
              fill={isDark ? '#0f172a' : '#ffffff'}
              stroke="#10b981"
              strokeWidth="1"
              className="drop-shadow-xs"
            />
            <text
              x={pt.x}
              y={pt.y - 9}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill={isDark ? '#34d399' : '#059669'}
            >
              {scores[i]}
            </text>
          </g>
        ))}

        {/* Labels at Outer Axis Tips */}
        {labels.map((label, i) => {
          const angle = offset + i * angleStep;
          const labelDist = radius + 26;
          const x = center + labelDist * Math.cos(angle);
          const y = center + labelDist * Math.sin(angle);

          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="700"
              fill={isDark ? '#e2e8f0' : '#1e293b'}
              className="transition-colors duration-200"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500/30 border-2 border-emerald-500 inline-block"></span>
          <span className={isDark ? 'text-emerald-400' : 'text-emerald-800'}>學生實際筆記得分</span>
        </div>
        {benchmark && (
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-indigo-500 border-t-2 border-dashed border-indigo-500 inline-block"></span>
            <span className={isDark ? 'text-indigo-300' : 'text-indigo-700'}>常模示範基準線 (85分)</span>
          </div>
        )}
      </div>
    </div>
  );
};
