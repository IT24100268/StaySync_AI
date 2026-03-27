import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import api from "../services/api";
import "./RestaurantMenu.css";

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const formatCurrency = (value) => `LKR ${safeNumber(value).toLocaleString("en-LK")}`;

const extractCategory = (item) => {
  if (item?.category) {
    return String(item.category).trim().toLowerCase();
  }

  const description = String(item?.description || "");
  const match = description.match(/\[\s*category\s*:\s*([^\]]+)\]/i);
  if (match?.[1]) {
    return match[1].trim().toLowerCase();
  }

  return "menu";
};

const cleanDescription = (text) => String(text || "").replace(/\[\s*category\s*:[^\]]+\]/gi, "").trim();

const prettifyCategory = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export default function RestaurantMenu() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [restaurantRes, menuRes] = await Promise.all([
        api.get(`/restaurants/${id}/`),
        api.get(`/restaurants/${id}/menu/`),
      ]);

      setRestaurant(restaurantRes.data || null);
      setMenuItems(toArray(menuRes.data));
    } catch (fetchError) {
      console.error("Error fetching restaurant menu:", fetchError);
      setRestaurant(null);
      setMenuItems([]);
      setError("Unable to load restaurant menu right now.");
    } finally {
      setLoading(false);
    }
  };

  const menuItemsWithMeta = useMemo(() => {
    return menuItems.map((item) => ({
      ...item,
      categoryKey: extractCategory(item),
      cleanedDescription: cleanDescription(item.description),
    }));
  }, [menuItems]);

  const categories = useMemo(() => {
    const keys = Array.from(new Set(menuItemsWithMeta.map((item) => item.categoryKey)));
    return ["all", ...keys];
  }, [menuItemsWithMeta]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return menuItemsWithMeta.filter((item) => {
      const categoryMatch = activeCategory === "all" || item.categoryKey === activeCategory;
      if (!categoryMatch) return false;

      if (!query) return true;
      const haystack = [item.name, item.cleanedDescription, item.categoryKey]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [menuItemsWithMeta, activeCategory, searchQuery]);

  const cartCount = useMemo(
    () => cart.reduce((count, item) => count + item.quantity, 0),
    [cart]
  );

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + safeNumber(item.price) * item.quantity, 0);
  }, [cart]);

  const getItemQuantity = (itemId) => {
    const existing = cart.find((entry) => entry.id === itemId);
    return existing ? existing.quantity : 0;
  };

  const addToCart = (item) => {
    setCart((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, nextQuantity) => {
    setCart((current) => {
      if (nextQuantity <= 0) {
        return current.filter((entry) => entry.id !== itemId);
      }
      return current.map((entry) =>
        entry.id === itemId ? { ...entry, quantity: nextQuantity } : entry
      );
    });
  };

  const removeFromCart = (itemId) => {
    setCart((current) => current.filter((entry) => entry.id !== itemId));
  };

  const clearCart = () => setCart([]);

  const handleCheckout = () => {
    navigate("/checkout", {
      state: {
        cart,
        restaurant,
        totalPrice: Number(totalPrice.toFixed(2)),
      },
    });
  };

  if (loading) {
    return (
      <div className="restaurant-menu-page">
        <div className="restaurant-menu-container">
          <div className="rm-card rm-feedback">Loading restaurant menu...</div>
        </div>
      </div>
    );
  }

  if (!restaurant || error) {
    return (
      <div className="restaurant-menu-page">
        <div className="restaurant-menu-container">
          <div className="rm-card rm-feedback rm-feedback--error">{error || "Restaurant not found."}</div>
          <button type="button" className="rm-btn rm-btn--outline" onClick={() => navigate("/restaurants")}>
            Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-menu-page">
      <div className="restaurant-menu-container">
        <header className="rm-hero rm-card">
          <div className="rm-hero__media">
            {restaurant.image ? (
              <img src={restaurant.image} alt={restaurant.name} />
            ) : (
              <div className="rm-hero__placeholder">No Restaurant Image</div>
            )}
          </div>

          <div className="rm-hero__content">
            <Link to="/restaurants" className="rm-back-link">
              <ArrowLeft size={14} /> Back to Restaurants
            </Link>

            <h1>{restaurant.name}</h1>
            <div className="rm-hero__meta">
              <span>
                <MapPin size={14} /> {restaurant.address || "Address unavailable"}
              </span>
              <span>
                <Phone size={14} /> {restaurant.phone || "No phone"}
              </span>
              <span>
                <Mail size={14} /> {restaurant.email || "No email"}
              </span>
            </div>
          </div>
        </header>

        <section className="rm-toolbar rm-card">
          <div className="rm-search">
            <Search size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by dish name, category, or description"
            />
          </div>

          <div className="rm-categories">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`rm-chip ${activeCategory === category ? "is-active" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {category === "all" ? "All" : prettifyCategory(category)}
              </button>
            ))}
          </div>
        </section>

        <div className="rm-layout">
          <section className="rm-menu rm-card">
            <div className="rm-menu__head">
              <h2>Menu Items</h2>
              <span>{filteredItems.length} items</span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="rm-feedback">No menu items found for this search.</div>
            ) : (
              <div className="rm-menu-grid">
                {filteredItems.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  const categoryLabel = prettifyCategory(item.categoryKey);

                  return (
                    <article key={item.id} className="rm-item-card">
                      <div className="rm-item-card__media">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} />
                        ) : (
                          <div className="rm-item-card__empty">No Food Image</div>
                        )}
                      </div>

                      <div className="rm-item-card__body">
                        <h3>{item.name}</h3>
                        <p className="rm-item-card__category">{categoryLabel}</p>
                        <p className="rm-item-card__desc">
                          {item.cleanedDescription || "Freshly prepared and available now."}
                        </p>
                        <p className="rm-item-card__price">{formatCurrency(item.price)}</p>

                        {quantity === 0 ? (
                          <button
                            type="button"
                            className="rm-btn rm-btn--primary"
                            onClick={() => addToCart(item)}
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <div className="rm-qty-control">
                            <button
                              type="button"
                              className="rm-icon-btn"
                              onClick={() => updateQuantity(item.id, quantity - 1)}
                            >
                              <Minus size={14} />
                            </button>
                            <span>{quantity}</span>
                            <button
                              type="button"
                              className="rm-icon-btn"
                              onClick={() => updateQuantity(item.id, quantity + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="rm-cart rm-card">
            <div className="rm-cart__head">
              <h2>
                <ShoppingCart size={16} /> Cart
              </h2>
              <span>{cartCount} items</span>
            </div>

            {cart.length === 0 ? (
              <div className="rm-cart__empty">
                <p>Your cart is empty.</p>
                <small>Add dishes from the menu to continue.</small>
              </div>
            ) : (
              <>
                <div className="rm-cart-list">
                  {cart.map((item) => (
                    <article key={item.id} className="rm-cart-item">
                      <div>
                        <h3>{item.name}</h3>
                        <p>
                          {formatCurrency(item.price)} x {item.quantity}
                        </p>
                      </div>

                      <div className="rm-cart-item__actions">
                        <button
                          type="button"
                          className="rm-icon-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          className="rm-icon-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          type="button"
                          className="rm-remove-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="rm-cart__summary">
                  <div className="rm-total-row">
                    <span>Total</span>
                    <strong>{formatCurrency(totalPrice)}</strong>
                  </div>

                  <div className="rm-cart__buttons">
                    <button
                      type="button"
                      className="rm-btn rm-btn--primary"
                      onClick={handleCheckout}
                    >
                      Checkout
                    </button>
                    <button type="button" className="rm-btn rm-btn--outline" onClick={clearCart}>
                      Clear Cart
                    </button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
