import { Pencil, Plus, Trash2 } from 'lucide-react';

function AvailabilityBadge({ available }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${available ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
      {available ? 'Available' : 'Out of Stock'}
    </span>
  );
}

function MenuItemSkeleton() {
  return (
    <article className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm animate-pulse border border-slate-100">
      <div className="h-20 w-24 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
        <div className="h-3 w-1/3 rounded bg-slate-200" />
      </div>
    </article>
  );
}

export default function MenuItemsSection({
  title = 'Menu Items',
  description = 'Manage pricing, availability, and visuals for each dish.',
  items = [],
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={onAdd}
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {error ? <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <MenuItemSkeleton key={`menu-skeleton-${index}`} />)
        ) : items.length ? (
          items.map((item) => (
            <article key={item.id} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="h-20 w-24 overflow-hidden rounded-xl bg-slate-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-slate-400">No image</div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-500">{item.description || 'No description available.'}</p>
                  </div>
                  <AvailabilityBadge available={item.is_available} />
                </div>

                <div className="text-sm font-semibold text-slate-800">LKR {Number(item.price).toLocaleString()}</div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                    onClick={() => onEdit(item)}
                    title="Edit item"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    type="button"
                    className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                    onClick={() => onDelete(item)}
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    type="button"
                    className="ml-auto rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    onClick={() => onToggle(item)}
                  >
                    Toggle Availability
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 md:col-span-2">
            No items yet. Add your first menu item to start taking orders.
          </div>
        )}
      </div>
    </section>
  );
}