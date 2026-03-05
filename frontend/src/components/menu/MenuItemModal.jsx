import { useEffect, useState } from 'react';

const initialState = {
  name: '',
  description: '',
  price: '',
  is_available: true,
  image: null,
};

export default function MenuItemModal({ open, item, onClose, onSave }) {
  const [formData, setFormData] = useState(initialState);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!item) {
      setFormData(initialState);
      setPreview('');
      return;
    }

    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      is_available: item.is_available,
      image: null,
    });
    setPreview(item.image_url || '');
  }, [item]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    if (type === 'file') {
      const file = files?.[0] || null;
      setFormData((prev) => ({ ...prev, image: file }));
      setPreview(file ? URL.createObjectURL(file) : item?.image_url || '');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('description', formData.description);
    payload.append('price', formData.price);
    payload.append('is_available', String(formData.is_available));
    if (formData.image) payload.append('image', formData.image);

    try {
      await onSave(payload);
      onClose();
    } catch {
      setError('Failed to save item. Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">{item ? 'Edit Menu Item' : 'Add Menu Item'}</h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Item name"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-200 focus:ring-2"
          />

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-200 focus:ring-2"
          />

          <input
            name="price"
            value={formData.price}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none ring-blue-200 focus:ring-2"
          />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} />
            Available
          </label>

          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs"
          />

          {preview ? <img src={preview} alt="Food preview" className="h-40 w-full rounded-xl object-cover" /> : null}

          {error ? <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}