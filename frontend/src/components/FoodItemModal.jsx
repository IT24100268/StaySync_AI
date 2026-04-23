import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ImagePlus, Package, X } from 'lucide-react';

const initialState = {
  name: '',
  price: '',
  image: null,
  category: '',
  food_id: '',
  meal_type: '',
  veg_nonveg: '',
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const CATEGORY_META_PREFIX = '[category:';

function normalizeCategoryName(category = '') {
  const value = String(category || '').trim();
  if (!value) return '';
  if (value.toLowerCase() === 'fride_rice') return 'fried_rice';
  return value;
}

function extractCategory(description = '') {
  const trimmed = String(description || '').trim();
  if (!trimmed.startsWith(CATEGORY_META_PREFIX)) return null;
  const match = trimmed.match(/^\[category:([^\]]+)\]/i);
  return normalizeCategoryName(match?.[1] || '');
}

function stripCategoryMeta(description = '') {
  return String(description || '')
    .replace(/^\[category:[^\]]+\]\s*/i, '')
    .trim();
}

function buildDescription(description = '', category = 'Other') {
  const cleaned = stripCategoryMeta(description);
  const normalizedCategory = normalizeCategoryName(category) || 'Other';
  return `${CATEGORY_META_PREFIX}${normalizedCategory}]\n${cleaned}`.trim();
}

export default function FoodItemModal({ open, item, onClose, onSubmit, categoryOptions = [], restaurantId = null }) {
  const [formData, setFormData] = useState(initialState);
  const [preview, setPreview] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryFieldRef = useRef(null);

  const mergedCategoryOptions = Array.from(
    new Set(
      [...categoryOptions, item?.category, extractCategory(item?.description || '')]
        .map((category) => normalizeCategoryName(category))
        .filter(Boolean)
    )
  );

  const filteredCategoryOptions = useMemo(() => {
    const search = String(formData.category || '').trim().toLowerCase();
    if (!search) return mergedCategoryOptions;

    const exactMatch = mergedCategoryOptions.some(
      (category) => category.toLowerCase() === search
    );

    if (exactMatch) return mergedCategoryOptions;

    return mergedCategoryOptions.filter((category) =>
      category.toLowerCase().includes(search)
    );
  }, [formData.category, mergedCategoryOptions]);

  useEffect(() => {
    if (!open) return;

    if (!item) {
      setFormData(initialState);
      setPreview('');
      return;
    }

    setFormData({
      name: item.name || '',
      price: item.price || '',
      image: null,
      category: normalizeCategoryName(extractCategory(item.description || '')) || '',
      food_id: item.food_id || '',
      meal_type: item.meal_type || '',
      veg_nonveg: item.veg_nonveg || '',
    });
    setPreview(item.image_url || '');
  }, [item, open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!categoryFieldRef.current?.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    if (type === 'file') {
      const file = files?.[0] || null;
      
      // Validate file
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          return;
        }
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          alert('Only JPG, PNG, or WEBP images are supported.');
          return;
        }
      }
      
      if (!file) {
        setFormData((previous) => ({ ...previous, image: null }));
        setPreview(item?.image_url || '');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setFormData((previous) => ({ ...previous, image: file }));
        setPreview(objectUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        alert('Image file appears corrupted. Please choose another image.');
      };
      img.src = objectUrl;
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Validation
    if (!formData.name || formData.name.trim().length < 3) {
      alert('Item name must be at least 3 characters');
      return;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      alert('Price must be a positive number');
      return;
    }

    if (parseFloat(formData.price) > 100000) {
      alert('Price seems too high. Please check.');
      return;
    }

    if (!String(formData.category || '').trim()) {
      alert('Please enter a category for this item');
      return;
    }

    if (!item && !formData.image) {
      alert('Please upload an image for the menu item');
      return;
    }

    const payload = new FormData();
    payload.append('name', formData.name.trim());
    payload.append('description', buildDescription('', formData.category));
    payload.append('price', formData.price);
    payload.append('is_available', 'true');
    if (formData.food_id.trim()) payload.append('food_id', formData.food_id.trim());
    if (formData.meal_type) payload.append('meal_type', formData.meal_type);
    if (formData.veg_nonveg) payload.append('veg_nonveg', formData.veg_nonveg);
    if (formData.image) {
      payload.append('image', formData.image);
    }
    onSubmit(payload);
  };

  return (
    <div className="menu-modal-overlay" onClick={onClose}>
      <div className="menu-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="menu-modal-header">
          <div>
            <p className="menu-modal-kicker">
              <Package size={15} />
              Menu Studio
            </p>
            <h3>{item ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
            <span>Create clean food and drink listings with category, price, and image.</span>
          </div>

          <button type="button" className="menu-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="menu-modal-form">
          <div className="menu-modal-grid">
            <div className="menu-modal-field">
              <label htmlFor="food-name">Item Name</label>
              <input
                id="food-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Iced Coffee or Chicken Burger"
                required
              />
            </div>

            <div className="menu-modal-field">
              <label htmlFor="food-category">Category</label>
              <div className="menu-category-field" ref={categoryFieldRef}>
                <div className="menu-select-wrap">
                  <input
                    id="food-category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="Type a category, e.g. Smoothies"
                    required
                  />
                  <button
                    type="button"
                    className="menu-category-toggle"
                    onClick={() => setShowCategoryDropdown((current) => !current)}
                    aria-label="Show saved categories"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {showCategoryDropdown && filteredCategoryOptions.length ? (
                  <div className="menu-category-dropdown">
                    {filteredCategoryOptions.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className="menu-category-option"
                        onClick={() => {
                          setFormData((previous) => ({ ...previous, category }));
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="menu-modal-grid">
            <div className="menu-modal-field">
              <label htmlFor="food-price">Price (LKR)</label>
              <input
                id="food-price"
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

            <div className="menu-modal-field">
              <label htmlFor="food-id">Food ID</label>
              <input
                id="food-id"
                name="food_id"
                value={formData.food_id}
                onChange={handleChange}
                placeholder="e.g. FOOD-001"
              />
            </div>
          </div>

          <div className="menu-modal-grid">
            <div className="menu-modal-field">
              <label htmlFor="food-restaurant-id">Restaurant ID</label>
              <input
                id="food-restaurant-id"
                value={item?.restaurant_id ?? restaurantId ?? ''}
                readOnly
                disabled
                placeholder="Auto-filled from restaurant"
              />
            </div>

            <div className="menu-modal-field">
              <label htmlFor="food-meal-type">Meal Type</label>
              <select
                id="food-meal-type"
                name="meal_type"
                value={formData.meal_type}
                onChange={handleChange}
              >
                <option value="">Select meal type</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>
          </div>

          <div className="menu-modal-grid">
            <div className="menu-modal-field">
              <label htmlFor="food-veg-nonveg">Veg / Non-Veg</label>
              <select
                id="food-veg-nonveg"
                name="veg_nonveg"
                value={formData.veg_nonveg}
                onChange={handleChange}
              >
                <option value="">Select type</option>
                <option value="veg">Vege</option>
                <option value="nonveg">Non-Vege</option>
              </select>
            </div>
          </div>

          <div className="menu-modal-field">
            <label htmlFor="food-image">Upload Image</label>
            <label htmlFor="food-image" className="menu-upload-box">
              <div className="menu-upload-box__icon">
                <ImagePlus size={22} />
              </div>
              <div>
                <strong>{preview ? 'Change menu image' : 'Choose a food or drink image'}</strong>
                <p>PNG, JPG, WEBP supported</p>
              </div>
            </label>
            <input
              id="food-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleChange}
              className="menu-file-input"
            />
          </div>

          {preview ? <div className="menu-preview-wrap"><img src={preview} alt="Food preview" className="menu-preview-image" /></div> : null}

          <div className="menu-modal-actions">
            <button type="button" className="menu-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="menu-btn-primary">
              {item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
