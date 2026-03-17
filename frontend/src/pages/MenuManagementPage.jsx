import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Grid2X2, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import FoodItemModal from '../components/FoodItemModal';
import { restaurantApi } from '../services/restaurantApi';

const fallbackCategories = ['All', 'Pizzas', 'Burgers', 'Pasta', 'Salads', 'Drinks'];

function getCategoryFromName(name = '') {
  const lower = name.toLowerCase();

  if (lower.includes('pizza')) return 'Pizzas';
  if (lower.includes('burger')) return 'Burgers';
  if (lower.includes('pasta') || lower.includes('spaghetti') || lower.includes('noodle')) return 'Pasta';
  if (lower.includes('salad')) return 'Salads';
  if (lower.includes('juice') || lower.includes('drink') || lower.includes('coffee') || lower.includes('tea')) return 'Drinks';

  return 'Other';
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

function AvailabilityPill({ available, onClick }) {
  return (
    <button
      type="button"
      className={`restaurant-availability-pill ${available ? 'is-available' : 'is-unavailable'}`}
      onClick={onClick}
    >
      <span>{available ? 'Available' : 'Unavailable'}</span>
      <ChevronDown size={14} />
    </button>
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

        <p className="restaurant-menu-card__orders">{ordersToday} Orders Today</p>

        <div className="restaurant-menu-card__footer">
          <div className="restaurant-menu-card__rating">
            <Star size={14} fill="currentColor" />
            <span>{rating}</span>
          </div>

          <div className="restaurant-menu-card__actions">
            <AvailabilityPill
              available={item.is_available}
              onClick={() => onToggleAvailability(item.id)}
            />

            <button
              type="button"
              className="restaurant-icon-action"
              onClick={() => onEdit(item)}
              title="Edit item"
            >
              <Pencil size={15} />
            </button>

            <button
              type="button"
              className="restaurant-icon-action restaurant-icon-action--danger"
              onClick={() => onDelete(item.id)}
              title="Delete item"
            >
              <Trash2 size={15} />
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
      derivedCategory: getCategoryFromName(item.name),
    }));
  }, [items]);

  const categories = useMemo(() => {
    const counts = categorizedItems.reduce((acc, item) => {
      acc[item.derivedCategory] = (acc[item.derivedCategory] || 0) + 1;
      return acc;
    }, {});

    const ordered = fallbackCategories
      .filter((name) => name === 'All' || counts[name])
      .map((name) => ({
        name,
        count: name === 'All' ? categorizedItems.length : counts[name] || 0,
      }));

    const extras = Object.entries(counts)
      .filter(([name]) => !fallbackCategories.includes(name))
      .map(([name, count]) => ({ name, count }));

    return [...ordered, ...extras];
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

  const onToggleAvailability = async (id) => {
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
            <p>Manage your restaurant&apos;s menu items and their availability.</p>
          </div>

          <button
            type="button"
            className="restaurant-add-item-btn"
            onClick={onAddNew}
          >
            <Plus size={18} />
            <span>Add Item</span>
          </button>
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

          <button type="button" className="restaurant-category-filter-btn">
            <Grid2X2 size={16} />
            <span>All Categories</span>
            <ChevronDown size={15} />
          </button>
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
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}