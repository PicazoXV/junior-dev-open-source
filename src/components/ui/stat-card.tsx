type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="surface-subcard relative overflow-hidden rounded-xl p-4">
      <span className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-400/70 via-orange-400/30 to-transparent" />
      <p className="pl-2 text-sm text-gray-400">{label}</p>
      <p className="mt-1 pl-2 text-lg font-medium text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
