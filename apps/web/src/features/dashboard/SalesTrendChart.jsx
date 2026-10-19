import { useId } from "react";

export function SalesTrendChart({ entries, mode, money }) {
  const gradientId = useId().replaceAll(":", "");
  const width = 760;
  const height = 250;
  const left = 54;
  const right = 14;
  const top = 16;
  const bottom = 210;
  const values = entries.map((entry) => mode === "orders" ? entry.count : entry.revenue);
  const maxValue = Math.max(1, ...values);
  const points = entries.map((entry, index) => ({
    entry,
    value: values[index],
    x: left + (entries.length <= 1 ? 0 : index * (width - left - right) / (entries.length - 1)),
    y: bottom - (values[index] / maxValue) * (bottom - top),
  }));
  const linePath = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const areaPath = points.length ? `${linePath} L${points.at(-1).x},${bottom} L${points[0].x},${bottom} Z` : "";
  const tickIndexes = [...new Set([0, Math.floor((entries.length - 1) / 2), entries.length - 1])];
  const formatTick = (value) => mode === "orders" ? Math.round(value).toLocaleString() : money(value);
  const label = mode === "orders" ? "Orders" : "Revenue";

  return (
    <div className="trend-chart" role="img" aria-label={`${label} trend for ${entries.length} days`}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2f49d8" stopOpacity=".2" />
            <stop offset="100%" stopColor="#2f49d8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((tick) => {
          const y = top + tick * (bottom - top) / 3;
          const value = maxValue * (1 - tick / 3);
          return <g key={tick}>
            <line x1={left} x2={width - right} y1={y} y2={y} className="trend-gridline" />
            <text x={left - 9} y={y + 4} textAnchor="end" className="trend-axis-label">{formatTick(value)}</text>
          </g>;
        })}
        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {linePath && <path d={linePath} className="trend-line" />}
        {points.map((point) => <circle key={point.entry.day} cx={point.x} cy={point.y} r={entries.length > 14 ? 2.5 : 3.5} className="trend-point">
          <title>{`${point.entry.day} · ${mode === "orders" ? `${point.value.toLocaleString()} orders` : money(point.value)}`}</title>
        </circle>)}
        {tickIndexes.map((index) => {
          const entry = entries[index];
          if (!entry) return null;
          const date = new Date(`${entry.day}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
          return <text key={entry.day} x={points[index]?.x ?? left} y={height - 9} textAnchor={index === 0 ? "start" : index === entries.length - 1 ? "end" : "middle"} className="trend-axis-label">{date}</text>;
        })}
      </svg>
    </div>
  );
}
