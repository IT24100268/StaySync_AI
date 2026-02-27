import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import FoodItemModal from '../components/FoodItemModal';
import { restaurantApi } from '../services/api';

function AvailabilityBadge({ available }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${available ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
      {available ? 'Available' : 'Out of Stock'}
    </span>
  );
}

export default function MenuManagementPage() {
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');

  const loadItems = async () => {
    try {
      const response = await restaurantApi.getFoodItems();
      setItems(response.data);
    } catch {
      setError('Unable to load food items.');
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const onAddNew = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const onEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (editingItem) {
        await restaurantApi.updateFoodItem(editingItem.id, payload);
      } else {
        await restaurantApi.createFoodItem(payload);
      }
      setModalOpen(false);
      setEditingItem(null);
      loadItems();
    } catch {
      setError('Failed to save food item. Please verify inputs and try again.');
    }
  };

  const onDelete = async (id) => {
    try {
      await restaurantApi.deleteFoodItem(id);
      loadItems();
    } catch {
      setError('Failed to delete food item.');
    }
  };

  const onToggleAvailability = async (id) => {
    try {
      await restaurantApi.toggleFoodAvailability(id);
      loadItems();
    } catch {
      setError('Failed to toggle item availability.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Menu Items</h3>
          <p className="text-sm text-slate-500">Manage pricing, availability, and visuals for each dish.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          onClick={onAddNew}
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {error ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-44 w-full object-cover" />
              ) : (
                <div className="grid h-44 place-items-center bg-slate-100 text-sm text-slate-500">No image available</div>
              )}

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{item.name}</h4>
                    <p className="mt-1 text-sm text-slate-500">{item.description || 'No description available.'}</p>
                  </div>
                  <AvailabilityBadge available={item.is_available} />
                </div>

                <div className="text-lg font-semibold text-slate-800">LKR {Number(item.price).toLocaleString()}</div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                    onClick={() => onEdit(item)}
                    title="Edit item"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                    onClick={() => onDelete(item.id)}
                    title="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="ml-auto rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    onClick={() => onToggleAvailability(item.id)}
                  >
                    Toggle Availability
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm sm:col-span-2 2xl:col-span-3">
            No menu items found. Add your first item to start taking orders.
          </div>
        )}
      </section>

      <FoodItemModal
        open={modalOpen}
        item={editingItem}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
