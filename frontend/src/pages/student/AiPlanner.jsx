import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AiPlanner.css';

const AREAS = [
  'Annasathiram','Arasadi','Ariyalai','Chunnakam','Jaffna Town',
  'Kaithady','Kaladdy','Kantharmadam','Kokuvil','Kokuvil East',
  'Kondavil','Manipay','Nachimar Koviladi','Nallur','Navatkuli',
  'Tellippalai','Thirunelvely','Uduvil','Vannarpannai',
];

const FACILITIES = [
  { key: 'attached_bathroom', label: 'Attached Bathroom' },
  { key: 'ac_available',      label: 'Air Conditioning'  },
  { key: 'fan_available',     label: 'Fan'               },
  { key: 'furnished',         label: 'Furnished'         },
  { key: 'study_table',       label: 'Study Table'       },
  { key: 'cupboard',          label: 'Cupboard'          },
  { key: 'balcony',           label: 'Balcony'           },
];

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const fmtLKR = (v) => `LKR ${Number(v || 0).toLocaleString('en-LK')}`;

export default function AiPlanner() {
  const navigate = useNavigate();

  // ── Step 1 form state ──────────────────────────────────────
  const [form, setForm] = useState({
    area: '', gender: '', total_budget: '', room_type: '', facilities: [],
  });

  // ── Step 1 results ─────────────────────────────────────────
  const [roomResult, setRoomResult]     = useState(null);
  const [roomLoading, setRoomLoading]   = useState(false);
  const [roomError, setRoomError]       = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);

  // ── Step 2 results ─────────────────────────────────────────
  const [vegOnly, setVegOnly]               = useState(false);
  const [mealResult, setMealResult]         = useState(null);
  const [mealLoading, setMealLoading]       = useState(false);
  const [mealError, setMealError]           = useState('');
  const [needsConfirm, setNeedsConfirm]     = useState(null);

  // ── Handlers ───────────────────────────────────────────────
  const toggleFacility = (key) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(key)
        ? prev.facilities.filter((f) => f !== key)
        : [...prev.facilities, key],
    }));
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setRoomError('');
    setRoomResult(null);
    setSelectedRoom(null);
    setMealResult(null);
    setRoomLoading(true);
    try {
      const { data } = await api.post('/ai/recommend-rooms/', {
        area:         form.area,
        gender:       form.gender,
        total_budget: parseInt(form.total_budget),
        room_type:    form.room_type,
        facilities:   form.facilities,
        top_n:        5,
      });
      setRoomResult(data);
    } catch (err) {
      setRoomError(err.response?.data?.error || err.response?.data?.detail || 'Failed to get recommendations.');
    } finally {
      setRoomLoading(false);
    }
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setMealResult(null);
    setMealError('');
    window.scrollTo({ top: document.getElementById('meal-section')?.offsetTop - 80, behavior: 'smooth' });
  };

  const submitMealPlan = async (allowPartial = false) => {
    setMealError('');
    setMealResult(null);
    setNeedsConfirm(null);
    setMealLoading(true);
    try {
      const { data } = await api.post('/ai/meal-plan/', {
        hostel_id:     selectedRoom.hostel_id,
        total_budget:  parseInt(form.total_budget),
        veg_only:      vegOnly,
        allow_partial: allowPartial,
      });
      if (data.status === 'needs_confirmation') {
        setNeedsConfirm(data);
      } else {
        setMealResult(data);
      }
    } catch (err) {
      setMealError(err.response?.data?.error || err.response?.data?.detail || 'Failed to generate meal plan.');
    } finally {
      setMealLoading(false);
    }
  };

  const handleMealSubmit = (e) => { e.preventDefault(); submitMealPlan(false); };

  // ── Meal table grouped by day ──────────────────────────────
  const mealByDay = mealResult?.meal_plan
    ? DAYS.reduce((acc, day) => {
        acc[day] = mealResult.meal_plan.filter((r) => r.day === day);
        return acc;
      }, {})
    : {};

  return (
    <div className="aip-page">
      <div className="aip-container">

        {/* ── Header ── */}
        <header className="aip-header">
          <h1>AI Budget Planner</h1>
          <p>Enter your preferences → get room recommendations → generate a weekly meal plan.</p>
        </header>

        {/* ══════════════════════════════════════════════════════
            STEP 1 — Room Preferences
        ══════════════════════════════════════════════════════ */}
        <section className="aip-card">
          <h2 className="aip-card__title">Step 1 — Find Rooms</h2>

          <form className="aip-form" onSubmit={handleRoomSubmit}>
            <div className="aip-form__grid">
              <label className="aip-field">
                <span>Area</span>
                <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required>
                  <option value="">Select area</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>

              <label className="aip-field">
                <span>Gender</span>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                  <option value="">Select gender</option>
                  <option value="Girls">Girls</option>
                  <option value="Boys">Boys</option>
                </select>
              </label>

              <label className="aip-field">
                <span>Total Monthly Budget (LKR)</span>
                <input
                  type="number" min="5000" placeholder="e.g. 30000"
                  value={form.total_budget}
                  onChange={(e) => setForm({ ...form, total_budget: e.target.value })}
                  required
                />
              </label>

              <label className="aip-field">
                <span>Room Type</span>
                <select value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })} required>
                  <option value="">Select type</option>
                  <option value="Single">Single</option>
                  <option value="Shared">Shared</option>
                </select>
              </label>
            </div>

            <div className="aip-facilities">
              <span>Preferred Facilities</span>
              <div className="aip-facilities__chips">
                {FACILITIES.map((f) => (
                  <button
                    key={f.key} type="button"
                    className={`aip-chip ${form.facilities.includes(f.key) ? 'aip-chip--active' : ''}`}
                    onClick={() => toggleFacility(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="aip-btn aip-btn--primary" type="submit" disabled={roomLoading}>
              {roomLoading ? 'Finding rooms...' : 'Get AI Recommendations'}
            </button>
          </form>

          {roomError && <p className="aip-error">{roomError}</p>}
        </section>

        {/* ══════════════════════════════════════════════════════
            STEP 1 RESULTS — Room Cards
        ══════════════════════════════════════════════════════ */}
        {roomResult && (
          <section className="aip-card">
            <h2 className="aip-card__title">
              {roomResult.rooms_found} Rooms Found
            </h2>

            <div className="aip-budget-strip">
              <div className="aip-budget-box">
                <span>Total Budget</span>
                <strong>{fmtLKR(roomResult.total_budget)}</strong>
              </div>
              <div className="aip-budget-box">
                <span>Max Rent (40%)</span>
                <strong>{fmtLKR(roomResult.initial_rent_budget)}</strong>
              </div>
              <div className="aip-budget-box">
                <span>Food Budget (60%)</span>
                <strong>{fmtLKR(roomResult.initial_food_budget)}</strong>
              </div>
            </div>

            <div className="aip-rooms-grid">
              {roomResult.rooms.map((room) => (
                <article
                  key={room.hostel_id}
                  className={`aip-room-card ${selectedRoom?.hostel_id === room.hostel_id ? 'aip-room-card--selected' : ''}`}
                >
                  <div className="aip-room-card__rank">#{room.rank}</div>
                  <h3>{room.listing_name}</h3>

                  <div className="aip-room-card__tags">
                    <span className="aip-tag aip-tag--blue">{room.area}</span>
                    <span className="aip-tag aip-tag--amber">{room.room_type}</span>
                    <span className="aip-tag aip-tag--green">{room.gender_allowed}</span>
                  </div>

                  <p className="aip-room-card__rent">{fmtLKR(room.rent_lkr)} <span>/ month</span></p>
                  <p className="aip-room-card__rating">Rating: {room.estimated_rating}/5.0</p>

                  <div className="aip-score-bar">
                    <div className="aip-score-bar__labels">
                      <span>Fit Score</span><span>{room.fit_score}</span>
                    </div>
                    <div className="aip-score-bar__track">
                      <div className="aip-score-bar__fill" style={{ width: `${Math.round(room.fit_score * 100)}%` }} />
                    </div>
                  </div>

                  <p className="aip-room-card__reason">{room.reason}</p>

                  <div className="aip-room-card__actions">
                    <button
                      className="aip-btn aip-btn--select"
                      onClick={() => handleSelectRoom(room)}
                    >
                      {selectedRoom?.hostel_id === room.hostel_id ? '✓ Selected' : 'Select for meal plan'}
                    </button>
                    <button
                      className="aip-btn aip-btn--book"
                      onClick={() => navigate(`/rooms/${room.id}`)}
                    >
                      Book Room
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 2 — Meal Plan
        ══════════════════════════════════════════════════════ */}
        {selectedRoom && (
          <section className="aip-card" id="meal-section">
            <h2 className="aip-card__title">Step 2 — Generate Meal Plan</h2>
            <p className="aip-selected-room">
              Selected: <strong>{selectedRoom.listing_name}</strong> — {fmtLKR(selectedRoom.rent_lkr)}/month
            </p>

            <form className="aip-form" onSubmit={handleMealSubmit}>
              <label className="aip-field aip-field--inline">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => setVegOnly(e.target.checked)}
                />
                <span>Vegetarian only</span>
              </label>

              <button className="aip-btn aip-btn--primary" type="submit" disabled={mealLoading}>
                {mealLoading ? 'Generating meal plan...' : 'Generate Weekly Meal Plan'}
              </button>
            </form>

            {mealError && <p className="aip-error">{mealError}</p>}

            {needsConfirm && (
              <div className="aip-confirm-box">
                <p>{needsConfirm.message}</p>
                <p className="aip-confirm-box__detail">
                  Weekly budget: {fmtLKR(needsConfirm.summary.weekly_food_budget_lkr)} ·
                  Minimum full plan: {fmtLKR(needsConfirm.summary.minimum_full_weekly_cost_lkr)} ·
                  Shortfall: {fmtLKR(needsConfirm.summary.shortfall_for_full_plan_lkr)}
                </p>
                <div className="aip-confirm-box__actions">
                  <button className="aip-btn aip-btn--primary" onClick={() => submitMealPlan(true)} disabled={mealLoading}>
                    Yes, generate partial plan
                  </button>
                  <button className="aip-btn" onClick={() => setNeedsConfirm(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 2 RESULTS — Meal Plan
        ══════════════════════════════════════════════════════ */}
        {mealResult && (
          <section className="aip-card">
            <h2 className="aip-card__title">Weekly Meal Plan</h2>

            <div className="aip-budget-strip">
              <div className="aip-budget-box">
                <span>Total Budget / Month</span>
                <strong>{fmtLKR(mealResult.summary.monthly_total_budget_lkr)}</strong>
              </div>
              <div className="aip-budget-box">
                <span>Actual Rent</span>
                <strong>{fmtLKR(mealResult.summary.selected_room_rent_lkr)}</strong>
              </div>
              <div className="aip-budget-box aip-budget-box--green">
                <span>Food Budget / Month</span>
                <strong>{fmtLKR(mealResult.summary.monthly_food_budget_lkr)}</strong>
              </div>
              <div className="aip-budget-box">
                <span>Meal Plan Budget / Week</span>
                <strong>{fmtLKR(mealResult.summary.weekly_food_budget_lkr)}</strong>
              </div>
              <div className="aip-budget-box">
                <span>Weekly Meal Cost</span>
                <strong>{fmtLKR(mealResult.summary.weekly_total_cost_lkr)}</strong>
              </div>
              <div className="aip-budget-box aip-budget-box--green">
                <span>Weekly Remaining</span>
                <strong>{fmtLKR(mealResult.summary.weekly_remaining_lkr)}</strong>
              </div>
              <div className="aip-budget-box">
                <span>Daily Average</span>
                <strong>{fmtLKR(mealResult.summary.daily_average_lkr)}</strong>
              </div>
            </div>

            <p className="aip-meal-meta">
              {mealResult.summary.meals_planned}/21 meals planned · {mealResult.summary.restaurants_used} restaurants used
            </p>

            <div className="aip-meal-days">
              {DAYS.map((day) => {
                const rows = mealByDay[day] || [];
                if (!rows.length) return null;
                const dayTotal = rows.reduce((s, r) => s + r.price_lkr, 0);
                return (
                  <div key={day} className="aip-day-block">
                    <div className="aip-day-block__header">
                      <span>{day}</span>
                      <span>{fmtLKR(dayTotal)}</span>
                    </div>
                    {rows.map((row, i) => (
                      <div key={i} className="aip-meal-row">
                        <span className={`aip-slot aip-slot--${row.meal_slot.toLowerCase()}`}>{row.meal_slot}</span>
                        <span className="aip-meal-row__item">
                          {row.food_item}
                          <span className={`aip-veg ${row.veg_nonveg === 'Veg' ? 'aip-veg--v' : 'aip-veg--nv'}`}>
                            {row.veg_nonveg === 'Veg' ? 'V' : 'NV'}
                          </span>
                        </span>
                        <span className="aip-meal-row__rest">{row.restaurant_name} · {row.distance_km}km</span>
                        <span className="aip-meal-row__price">{fmtLKR(row.price_lkr)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
