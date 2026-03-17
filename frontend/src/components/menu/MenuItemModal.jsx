import { useEffect, useState } from 'react';
import { ImagePlus, Package, X } from 'lucide-react';

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
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      is_available: Boolean(item.is_available),
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

    if (formData.image) {
      payload.append('image', formData.image);
    }

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
    <div className="menu-modal-overlay" onClick={onClose}>
      <div
        className="menu-modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="menu-modal-header">
          <div>
            <p className="menu-modal-kicker">
              <Package size={15} />
              Menu Management
            </p>
            <h3>{item ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
            <span>
              Fill in the details below to {item ? 'update' : 'create'} your menu item.
            </span>
          </div>

          <button
            type="button"
            className="menu-modal-close"
            onClick={onClose}
            disabled={submitting}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="menu-modal-form">
          <div className="menu-modal-grid">
            <div className="menu-modal-field">
              <label htmlFor="menu-name">Item Name</label>
              <input
                id="menu-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Chicken Burger"
                required
              />
            </div>

            <div className="menu-modal-field">
              <label htmlFor="menu-price">Price (LKR)</label>
              <input
                id="menu-price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 950"
                required
              />
            </div>
          </div>

          <div className="menu-modal-field">
            <label htmlFor="menu-description">Description</label>
            <textarea
              id="menu-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Write a short description for this menu item..."
              rows={4}
            />
          </div>

          <div className="menu-modal-grid menu-modal-grid--lower">
            <div className="menu-modal-field">
              <label htmlFor="menu-image">Upload Image</label>
              <label htmlFor="menu-image" className="menu-upload-box">
                <div className="menu-upload-box__icon">
                  <ImagePlus size={22} />
                </div>
                <div>
                  <strong>Choose food image</strong>
                  <p>PNG, JPG, WEBP supported</p>
                </div>
              </label>

              <input
                id="menu-image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="menu-file-input"
              />
            </div>

            <div className="menu-modal-field">
              <label>Availability</label>
              <label className="menu-availability-toggle">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleChange}
                />
                <span className="menu-availability-toggle__slider" />
                <span className="menu-availability-toggle__label">
                  {formData.is_available ? 'Available' : 'Unavailable'}
                </span>
              </label>
            </div>
          </div>

          {preview ? (
            <div className="menu-preview-wrap">
              <img src={preview} alt="Food preview" className="menu-preview-image" />
            </div>
          ) : null}

          {error ? (
            <div className="menu-modal-error">{error}</div>
          ) : null}

          <div className="menu-modal-actions">
            <button
              type="button"
              className="menu-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="menu-btn-primary"
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