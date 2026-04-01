import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Grid2X2, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import FoodItemModal from '../../components/FoodItemModal';
import { restaurantApi } from '../../services/restaurantApi';

const CATEGORY_META_PREFIX = '[category:';

function normalizeCategoryName(category = '') {
  const value = String(category || '').trim();
  if (!value) return '';
  if (value.toLowerCase() === 'fride_rice') return 'fried_rice';
  return value;
}

function extractCategoryMeta(description = '') {
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

function MenuSkeletonCard() {
  return (
    <article className="restaurant-menu-card restaurant-menu-card--skeleton">
      <div className="restaurant-menu-card__image skeleton-block" />
      <div className="restaurant-menu-card__body">
        <div className="skeleton-line skeleton-line--lg" />
        <div className="skeleton-line skeleton-line--md" />
        <div className="skeleton-line skeleton-line--sm" />
        <div className="restaurant-menu-card__footer">
          <div className="skeleton-pill" />
          <div className="skeleton-pill" />
        </div>
      </div>
    </article>
  );
}

function AvailabilityPill({ available, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="restaurant-availability-menu">
      <button
        type="button"
        className={`restaurant-availability-pill ${available ? 'is-available' : 'is-unavailable'}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{available ? 'Available' : 'Unavailable'}</span>
        <ChevronDown size={14} />
      </button>

      {open ? (
        <div className="restaurant-availability-dropdown">
          <button
            type="button"
            className={`restaurant-availability-option ${available ? 'active' : ''}`}
            onClick={() => {
              if (!available) onChange(true);
              setOpen(false);
            }}
          >
            Available
          </button>
          <button
            type="button"
            className={`restaurant-availability-option ${!available ? 'active' : ''}`}
            onClick={() => {
              if (available) onChange(false);
              setOpen(false);
            }}
          >
            Unavailable
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuCard({ item, onEdit, onDelete, onToggleAvailability }) {
  const rating = item.rating || 4.6;
  const ordersToday = item.orders_today || item.order_count || 7;

  return (
    <article className="restaurant-menu-card">
      <div className="restaurant-menu-card__image-wrap">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="restaurant-menu-card__image" />
        ) : (
          <div className="restaurant-menu-card__image restaurant-menu-card__image--empty">
            No image
          </div>
        )}
      </div>

      <div className="restaurant-menu-card__body">
        <h4>{item.name}</h4>

        <p className="restaurant-menu-card__price">
          LKR {Number(item.price || 0).toLocaleString()}
          <span>
            <Star size={14} fill="currentColor" />
            {rating}
          </span>
        </p>

        {item.description ? (
          <p className="restaurant-menu-card__description">{item.description}</p>
        ) : null}

        <p className="restaurant-menu-card__orders">{ordersToday} Orders Today</p>

        <div className="restaurant-menu-card__footer">
          <div className="restaurant-menu-card__rating">
            <Star size={14} fill="currentColor" />
            <span>{rating}</span>
          </div>

          <div className="restaurant-menu-card__actions">
            <AvailabilityPill
              available={item.is_available}
              onChange={(nextAvailable) => onToggleAvailability(item.id, nextAvailable)}
            />

            <button
              type="button"
              className="restaurant-text-action"
              onClick={() => onEdit(item)}
              title="Edit item"
            >
              <Pencil size={14} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              className="restaurant-text-action restaurant-text-action--danger"
              onClick={() => onDelete(item.id)}
              title="Delete item"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MenuManagementPage() {
  const [items, setItems] = useState([]);
  const [filteredText, setFilteredText] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await restaurantApi.getFoodItems();
      const list = response.data?.results || response.data;

      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      const details = err?.response?.data;
      const detailText =
        typeof details === 'string'
          ? details
          : details?.detail || details?.error || JSON.stringify(details || {});
      setError(`Unable to load food items. ${detailText}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const categorizedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      description: stripCategoryMeta(item.description || ''),
      derivedCategory: normalizeCategoryName(extractCategoryMeta(item.description || '')),
    }));
  }, [items]);

  const categories = useMemo(() => {
    const counts = categorizedItems.reduce((acc, item) => {
      if (!item.derivedCategory) return acc;
      acc[item.derivedCategory] = (acc[item.derivedCategory] || 0) + 1;
      return acc;
    }, {});

    const dynamic = Object.entries(counts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, count]) => ({ name, count }));

    return [
      { name: 'All', count: categorizedItems.length },
      ...dynamic,
    ];
  }, [categorizedItems]);

  const visibleItems = useMemo(() => {
    return categorizedItems.filter((item) => {
      const matchesCategory =
        activeCategory === 'All' ? true : item.derivedCategory === activeCategory;

      const search = filteredText.trim().toLowerCase();
      const matchesSearch =
        !search ||
        item.name?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.derivedCategory?.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [categorizedItems, activeCategory, filteredText]);

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
    } catch (err) {
      const details = err?.response?.data;
      const detailText =
        typeof details === 'string'
          ? details
          : details?.detail || details?.error || JSON.stringify(details || {});
      setError(`Failed to save food item. ${detailText}`);
    }
  };

  const onDelete = async (id) => {
    const selected = items.find((item) => item.id === id);
    const confirmed = window.confirm(`Delete ${selected?.name || 'this item'}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await restaurantApi.deleteFoodItem(id);
      loadItems();
    } catch {
      setError('Failed to delete food item.');
    }
  };

  const onToggleAvailability = async (id, nextAvailable) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    if (Boolean(target.is_available) === Boolean(nextAvailable)) {
      return;
    }

    try {
      await restaurantApi.toggleFoodAvailability(id);
      loadItems();
    } catch {
      setError('Failed to toggle item availability.');
    }
  };

  return (
    <div className="restaurant-menu-page">
      <section className="restaurant-menu-section">
        <div className="restaurant-menu-section__top">
          <div>
            <h3>Menu Items</h3>
            <p>Manage food and drink items with beautiful images, pricing, and categories.</p>
          </div>

          <button
            type="button"
            className="restaurant-add-item-btn"
            onClick={onAddNew}
          >
            <Plus size={18} />
            <span>Add Menu Item</span>
          </button>
        </div>

        <div className="restaurant-menu-toolbar">
          <label className="restaurant-menu-search">
            <Search size={18} />
            <input
              value={filteredText}
              onChange={(event) => setFilteredText(event.target.value)}
              placeholder="Search by name, description, or category..."
            />
          </label>

        </div>

        <div className="restaurant-category-bar">
          <div className="restaurant-category-bar__scroll">
            {(categories.length ? categories : [{ name: 'All', count: 0 }]).map((category) => (
              <button
                key={category.name}
                type="button"
                className={`restaurant-category-chip ${activeCategory === category.name ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.name)}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        <div className="restaurant-menu-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <MenuSkeletonCard key={`menu-skeleton-${index}`} />
            ))
          ) : visibleItems.length ? (
            visibleItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleAvailability={onToggleAvailability}
              />
            ))
          ) : (
            <div className="restaurant-menu-message restaurant-menu-message--empty">
              No menu items found. Add your first item to start taking orders.
            </div>
          )}
        </div>

        {error ? (
          <div className="restaurant-menu-message restaurant-menu-message--error">
            {error}
          </div>
        ) : null}

        {!loading && (
          <div className="restaurant-menu-footer">
            <p>
              Showing <strong>{visibleItems.length}</strong> out of{' '}
              <strong>{categorizedItems.length}</strong> items
            </p>

            <div className="restaurant-pagination">
              <button type="button" className="active">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button" className="restaurant-pagination__next">
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <FoodItemModal
        open={modalOpen}
        item={editingItem}
        categoryOptions={categories
          .map((category) => category.name)
          .filter((name) => name && name !== 'All')}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
