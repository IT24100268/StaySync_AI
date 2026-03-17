import { useMemo, useState } from 'react';
import {
  Pencil,
  Plus,
  Star,
  Trash2,
  ChevronDown,
  Grid2X2,
} from 'lucide-react';

const fallbackCategories = ['All', 'Pizzas', 'Burgers', 'Pasta', 'Salads', 'Drinks'];

function getCategoryFromName(name = '') {
  const lower = name.toLowerCase();

  if (lower.includes('pizza')) return 'Pizzas';
  if (lower.includes('burger')) return 'Burgers';
  if (lower.includes('pasta') || lower.includes('spaghetti') || lower.includes('noodle')) return 'Pasta';
  if (lower.includes('salad')) return 'Salads';
  if (lower.includes('juice') || lower.includes('drink') || lower.includes('cola') || lower.includes('coffee')) return 'Drinks';

  return 'Other';
}

function MenuItemSkeleton() {
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

function MenuItemCard({ item, onEdit, onDelete, onToggle }) {
  const image = item.image_url || item.image || '';
  const rating = item.rating || 4.6;
  const ordersToday = item.orders_today || item.order_count || 7;

  return (
    <article className="restaurant-menu-card">
      <div className="restaurant-menu-card__image-wrap">
        {image ? (
          <img
            src={image}
            alt={item.name}
            className="restaurant-menu-card__image"
          />
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
              onClick={() => onToggle(item)}
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
              onClick={() => onDelete(item)}
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

export default function MenuItemsSection({
  title = 'Menu Items',
  description = "Manage your restaurant's menu items and their availability.",
  items = [],
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}) {
  const [activeCategory, setActiveCategory] = useState('All');

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

    const dynamic = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));

    const ordered = fallbackCategories
      .filter((name) => name === 'All' || counts[name])
      .map((name) => ({
        name,
        count: name === 'All' ? categorizedItems.length : counts[name] || 0,
      }));

    const extras = dynamic.filter(
      (category) => !fallbackCategories.includes(category.name)
    );

    return [...ordered, ...extras];
  }, [categorizedItems]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return categorizedItems;
    return categorizedItems.filter((item) => item.derivedCategory === activeCategory);
  }, [categorizedItems, activeCategory]);

  return (
    <section className="restaurant-menu-section">
      <div className="restaurant-menu-section__top">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <button
          type="button"
          className="restaurant-add-item-btn"
          onClick={onAdd}
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

      {error ? (
        <div className="restaurant-menu-message restaurant-menu-message--error">
          {error}
        </div>
      ) : null}

      <div className="restaurant-menu-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <MenuItemSkeleton key={`menu-skeleton-${index}`} />
          ))
        ) : filteredItems.length ? (
          filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))
        ) : (
          <div className="restaurant-menu-message restaurant-menu-message--empty">
            No items found in this category. Add your first menu item to get started.
          </div>
        )}
      </div>

      {!loading && filteredItems.length ? (
        <div className="restaurant-menu-footer">
          <p>
            Showing <strong>{filteredItems.length}</strong> out of{' '}
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
      ) : null}
    </section>
  );
}