const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-sky-100 text-sky-700',
  PREPARING: 'bg-blue-100 text-blue-700',
  READY: 'bg-green-100 text-green-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}
