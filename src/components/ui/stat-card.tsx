type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="surface-subcard rounded-xl p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-medium text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
