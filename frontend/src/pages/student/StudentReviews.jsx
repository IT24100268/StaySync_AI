import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  RefreshCcw,
  Search,
  Star,
  Store,
  BedDouble,
  MapPin,
} from "lucide-react";
import api from "../../services/api";
import "./StudentReviews.css";

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const buildErrorMessage = (error, fallback) => {
  const detail = error?.response?.data;
  if (!detail) return fallback;

  if (typeof detail === "string") return detail;
  if (typeof detail?.detail === "string") return detail.detail;
  if (Array.isArray(detail?.non_field_errors) && detail.non_field_errors.length > 0) {
    return detail.non_field_errors[0];
  }

  const flattened = Object.values(detail)
    .flat()
    .filter(Boolean)
    .map((item) => String(item));
  if (flattened.length > 0) {
    return flattened[0];
  }

  return fallback;
};

export default function StudentReviews() {
  const [rooms, setRooms] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [roomReviews, setRoomReviews] = useState([]);
  const [restaurantReviews, setRestaurantReviews] = useState([]);

  const [selectedType, setSelectedType] = useState("room");
  const [selectedId, setSelectedId] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [searchTarget, setSearchTarget] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchData(true);
  }, []);

  const fetchData = async (initialLoad = false) => {
    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const [roomsRes, restaurantsRes, roomReviewsRes, restaurantReviewsRes] = await Promise.allSettled([
      api.get("/rooms/"),
      api.get("/restaurants/"),
      api.get("/reviews/rooms/"),
      api.get("/reviews/restaurants/"),
    ]);

    if (roomsRes.status === "fulfilled") {
      setRooms(toArray(roomsRes.value.data));
    }

    if (restaurantsRes.status === "fulfilled") {
      setRestaurants(toArray(restaurantsRes.value.data));
    }

    if (roomReviewsRes.status === "fulfilled") {
      setRoomReviews(toArray(roomReviewsRes.value.data));
    }

    if (restaurantReviewsRes.status === "fulfilled") {
      setRestaurantReviews(toArray(restaurantReviewsRes.value.data));
    }

    const failed =
      roomsRes.status === "rejected" ||
      restaurantsRes.status === "rejected" ||
      roomReviewsRes.status === "rejected" ||
      restaurantReviewsRes.status === "rejected";

    setMessage((current) =>
      failed
        ? { type: "error", text: "Some review data could not be loaded. You can still submit reviews." }
        : current
    );

    setLoading(false);
    setRefreshing(false);
  };

  const availableTargets = useMemo(
    () => (selectedType === "room" ? rooms : restaurants),
    [selectedType, rooms, restaurants]
  );

  const filteredTargets = useMemo(() => {
    const query = searchTarget.trim().toLowerCase();
    if (!query) return availableTargets;

    return availableTargets.filter((target) => {
      const text =
        selectedType === "room"
          ? [target.hostel_name, target.title, target.address, target.hostel_address].filter(Boolean).join(" ")
          : [target.name, target.address, target.phone, target.email].filter(Boolean).join(" ");
      return text.toLowerCase().includes(query);
    });
  }, [availableTargets, searchTarget, selectedType]);

  const selectedTarget = useMemo(
    () => availableTargets.find((target) => String(target.id) === String(selectedId)) || null,
    [availableTargets, selectedId]
  );

  const reviewList = useMemo(
    () => (selectedType === "room" ? roomReviews : restaurantReviews),
    [selectedType, roomReviews, restaurantReviews]
  );

  const reviewAverage = useMemo(() => {
    if (reviewList.length === 0) return 0;
    const total = reviewList.reduce((sum, item) => sum + Number(item.rating || 0), 0);
    return total / reviewList.length;
  }, [reviewList]);

  const recentReviews = useMemo(() => {
    return [...reviewList]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 6);
  }, [reviewList]);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setSelectedId("");
    setSearchTarget("");
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!selectedId) {
      setMessage({ type: "error", text: "Please select a target to review." });
      return;
    }

    if (String(comment || "").trim().length < 10) {
      setMessage({ type: "error", text: "Comment should be at least 10 characters." });
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = selectedType === "room" ? "/reviews/rooms/" : "/reviews/restaurants/";
      const payload =
        selectedType === "room"
          ? { room: Number(selectedId), rating: Number(rating), comment: comment.trim() }
          : { restaurant: Number(selectedId), rating: Number(rating), comment: comment.trim() };

      await api.post(endpoint, payload);

      setMessage({ type: "success", text: "Review submitted successfully." });
      setComment("");
      setRating(5);
      setHoverRating(0);

      if (selectedType === "room") {
        const { data } = await api.get("/reviews/rooms/");
        setRoomReviews(toArray(data));
      } else {
        const { data } = await api.get("/reviews/restaurants/");
        setRestaurantReviews(toArray(data));
      }
    } catch (submitError) {
      setMessage({
        type: "error",
        text: buildErrorMessage(submitError, "Failed to submit review."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTargetImage =
    selectedType === "room"
      ? selectedTarget?.images?.[0]?.image || selectedTarget?.hostel_image || ""
      : selectedTarget?.image || "";

  return (
    <div className="reviews-page">
      <div className="reviews-page__container">
        <header className="reviews-hero">
          <div>
            <h1>
              <MessageSquare size={30} /> Reviews
            </h1>
            <p>Share your experience and help others choose better rooms and restaurants.</p>
          </div>
          <button
            type="button"
            className="reviews-btn reviews-btn--outline"
            onClick={() => fetchData(false)}
            disabled={refreshing}
          >
            <RefreshCcw size={15} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="reviews-stats">
          <article className="reviews-stat-card">
            <p>Rooms Available</p>
            <strong>{rooms.length}</strong>
          </article>
          <article className="reviews-stat-card">
            <p>Restaurants Available</p>
            <strong>{restaurants.length}</strong>
          </article>
          <article className="reviews-stat-card">
            <p>Your {selectedType === "room" ? "Room" : "Restaurant"} Reviews</p>
            <strong>{reviewList.length}</strong>
          </article>
          <article className="reviews-stat-card">
            <p>Average Rating</p>
            <strong>{reviewAverage ? reviewAverage.toFixed(1) : "0.0"}/5</strong>
          </article>
        </section>

        {message.text ? (
          <div className={`reviews-feedback ${message.type === "error" ? "is-error" : "is-success"}`}>
            {message.text}
          </div>
        ) : null}

        {loading ? (
          <div className="reviews-feedback">Loading review tools...</div>
        ) : (
          <>
            <section className="reviews-main-grid">
              <form className="reviews-form-card" onSubmit={handleSubmit}>
                <div className="reviews-form-head">
                  <h2>Write a Review</h2>
                  <div className="reviews-type-toggle">
                    <button
                      type="button"
                      className={selectedType === "room" ? "is-active" : ""}
                      onClick={() => handleTypeChange("room")}
                    >
                      <BedDouble size={14} /> Room
                    </button>
                    <button
                      type="button"
                      className={selectedType === "restaurant" ? "is-active" : ""}
                      onClick={() => handleTypeChange("restaurant")}
                    >
                      <Store size={14} /> Restaurant
                    </button>
                  </div>
                </div>

                <label className="reviews-label">
                  <span>Search {selectedType === "room" ? "Rooms" : "Restaurants"}</span>
                  <div className="reviews-input-with-icon">
                    <Search size={14} />
                    <input
                      type="text"
                      value={searchTarget}
                      onChange={(event) => setSearchTarget(event.target.value)}
                      placeholder={`Search ${selectedType === "room" ? "room/hostel" : "restaurant"}`}
                    />
                  </div>
                </label>

                <label className="reviews-label">
                  <span>Select {selectedType === "room" ? "Room" : "Restaurant"}</span>
                  <select
                    value={selectedId}
                    onChange={(event) => setSelectedId(event.target.value)}
                    required
                  >
                    <option value="">Select from available list</option>
                    {filteredTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {selectedType === "room"
                          ? `${target.hostel_name || "Hostel"} - ${target.title}`
                          : target.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="reviews-label">
                  <span>Rating</span>
                  <div className="reviews-stars">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const active = value <= (hoverRating || rating);
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`reviews-star ${active ? "is-active" : ""}`}
                          onMouseEnter={() => setHoverRating(value)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(value)}
                          aria-label={`Rate ${value}`}
                        >
                          <Star size={18} fill={active ? "currentColor" : "none"} />
                        </button>
                      );
                    })}
                    <span>{rating}/5</span>
                  </div>
                </label>

                <label className="reviews-label">
                  <span>Comment</span>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={5}
                    placeholder="Tell others what was good, what could improve, and whether you recommend it."
                    required
                  />
                  <small>{comment.length} characters</small>
                </label>

                <button type="submit" className="reviews-btn reviews-btn--primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>

              <aside className="reviews-preview-card">
                <h2>Selected Target Preview</h2>

                {selectedTarget ? (
                  <>
                    <div className="reviews-preview-media">
                      {selectedTargetImage ? (
                        <img src={selectedTargetImage} alt={selectedType === "room" ? selectedTarget.title : selectedTarget.name} />
                      ) : (
                        <div className="reviews-preview-empty">No Image</div>
                      )}
                    </div>

                    <div className="reviews-preview-body">
                      <h3>{selectedType === "room" ? selectedTarget.title : selectedTarget.name}</h3>
                      <p className="reviews-preview-subtitle">
                        {selectedType === "room" ? selectedTarget.hostel_name || "Hostel" : "Restaurant"}
                      </p>
                      <p className="reviews-preview-meta">
                        <MapPin size={14} />
                        {selectedType === "room"
                          ? selectedTarget.address || selectedTarget.hostel_address || "Address unavailable"
                          : selectedTarget.address || "Address unavailable"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="reviews-preview-empty-state">
                    Select a {selectedType === "room" ? "room" : "restaurant"} to preview before submitting.
                  </div>
                )}
              </aside>
            </section>

            <section className="reviews-list-card">
              <div className="reviews-list-head">
                <h2>Your Recent {selectedType === "room" ? "Room" : "Restaurant"} Reviews</h2>
                <span>{recentReviews.length} shown</span>
              </div>

              {recentReviews.length === 0 ? (
                <div className="reviews-feedback">No reviews yet. Submit your first review above.</div>
              ) : (
                <div className="reviews-grid">
                  {recentReviews.map((review) => {
                    const image =
                      selectedType === "room"
                        ? review.room_image || ""
                        : review.restaurant_image || "";

                    const title =
                      selectedType === "room"
                        ? review.room_title || `Room #${review.room}`
                        : review.restaurant_name || `Restaurant #${review.restaurant}`;

                    return (
                      <article key={review.id} className="review-card">
                        <div className="review-card__media">
                          {image ? (
                            <img src={image} alt={title} />
                          ) : (
                            <div className="review-card__empty">No Image</div>
                          )}
                        </div>

                        <div className="review-card__body">
                          <h3>{title}</h3>
                          <p className="review-card__author">By {review.user_name || "You"}</p>

                          <div className="review-card__stars">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <Star
                                key={value}
                                size={14}
                                fill={value <= Number(review.rating) ? "currentColor" : "none"}
                                className={value <= Number(review.rating) ? "is-filled" : ""}
                              />
                            ))}
                            <span>{review.rating}/5</span>
                          </div>

                          <p className="review-card__comment">{review.comment}</p>
                          <p className="review-card__date">{formatDate(review.created_at)}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
