interface KpiCardProps {
  label: string;
  value: string;
  subtext?: string;
  accent?: "blue" | "green" | "default";
}

const accentClasses = {
  blue: "border-l-accent-blue",
  green: "border-l-accent-green",
  default: "border-l-gray-300",
};

export function KpiCard({
  label,
  value,
  subtext,
  accent = "default",
}: KpiCardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm border-l-4 ${accentClasses[accent]}`}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
    </div>
  );
}
