import { useMemo } from "react";

interface Props {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function ProductivityRing({ percent, size = 88, strokeWidth = 7, label }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const color = useMemo(() => {
    if (percent >= 80) return "hsl(var(--success))";
    if (percent >= 50) return "hsl(var(--warning))";
    return "hsl(var(--primary))";
  }, [percent]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold font-display leading-none text-foreground">{Math.round(percent)}%</span>
        {label && <span className="text-[9px] text-muted-foreground mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
