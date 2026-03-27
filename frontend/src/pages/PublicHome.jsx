import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bike,
  BadgeCheck,
  BrainCircuit,
  Clock3,
  GraduationCap,
  Home,
  MapPin,
  Store,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import './PublicHome.css';

const featuredRooms = [
  {
    id: 1,
    name: 'Calm Study Single',
    location: 'Near University of Jaffna',
    price: 'LKR 22,000 / month',
    image: '/images/PublicImage1.jpg',
    description: 'Quiet private room with stable WiFi, study desk, laundry access, and a peaceful evening atmosphere.',
    amenities: ['WiFi', 'Desk', 'Laundry', 'Shared Kitchen'],
    size: '120 sq ft',
  },
  {
    id: 2,
    name: 'Shared Comfort Double',
    location: 'Kokuvil',
    price: 'LKR 16,500 / month',
    image: '/images/PublicImage2.jpg',
    description: 'A social and affordable shared room designed for students who want low monthly cost without losing comfort.',
    amenities: ['2 Beds', 'WiFi', 'Common Lounge', 'Fan'],
    size: '180 sq ft',
  },
  {
    id: 3,
    name: 'Independent Studio Corner',
    location: 'Thirunelvely',
    price: 'LKR 29,000 / month',
    image: '/images/PublicImage3.jpg',
    description: 'A more private option with attached washroom, kitchenette, and enough space for focused routines.',
    amenities: ['Private Bath', 'Kitchenette', 'AC', 'Parking'],
    size: '240 sq ft',
  },
];

const featuredFood = [
  {
    id: 1,
    name: 'Amma Lunch House',
    type: 'Home Food',
    location: 'Jaffna Town',
    image: '/images/Restaurant1.jpg',
    description: 'Affordable home-style rice, curry, and dinner packs that feel familiar and dependable every day.',
    menu: ['Rice and Curry', 'String Hoppers', 'Kottu', 'Parotta Combo'],
    priceRange: 'LKR 220 - 420',
  },
  {
    id: 2,
    name: 'Campus Spice Kitchen',
    type: 'Restaurant',
    location: 'Near Medical Faculty',
    image: '/images/Restaurant2.jpg',
    description: 'Fast student-friendly meals with generous portions and late-evening ordering when study sessions run long.',
    menu: ['Fried Rice', 'Biriyani', 'Chicken Burger', 'Noodles'],
    priceRange: 'LKR 320 - 780',
  },
  {
    id: 3,
    name: 'Green Bowl Meals',
    type: 'Healthy Kitchen',
    location: 'Nallur',
    image: '/images/Restaurant3.png',
    description: 'Balanced meal plans with lighter lunch options, protein bowls, and weekly student packages.',
    menu: ['Protein Bowl', 'Veg Wrap', 'Fruit Cup', 'Soup Combo'],
    priceRange: 'LKR 280 - 620',
  },
];

const featurePillars = [
  {
    id: 1,
    icon: BrainCircuit,
    title: 'Unified Platform',
    description: 'Students, hostel owners, restaurants, and delivery partners all work inside one connected flow.',
  },
  {
    id: 2,
    icon: Wallet,
    title: 'Premium Operations',
    description: 'Manage listings, orders, deliveries, and growth with polished dashboards and clearer actions.',
  },
  {
    id: 3,
    icon: ShieldCheck,
    title: 'Trusted Experience',
    description: 'Better visibility, structured profiles, and streamlined workflows help every role feel more confident.',
  },
];

const accountTypes = [
  {
    id: 'student',
    icon: GraduationCap,
    title: 'Student',
    description: 'Discover rooms, compare food options, and make smarter monthly decisions.',
    accent: 'indigo',
  },
  {
    id: 'hostel-owner',
    icon: Home,
    title: 'Hostel Owner',
    description: 'Publish room listings, manage enquiries, and showcase your property professionally.',
    accent: 'amber',
  },
  {
    id: 'restaurant-owner',
    icon: Store,
    title: 'Restaurant Owner',
    description: 'Run your menu, track orders, and grow a premium delivery-ready food presence.',
    accent: 'rose',
  },
  {
    id: 'delivery-partner',
    icon: Bike,
    title: 'Delivery Partner',
    description: 'Stay on top of jobs, routes, and earnings from a cleaner day-to-day dashboard.',
    accent: 'emerald',
  },
];

const journeySteps = [
  {
    id: '01',
    title: 'Choose your role',
    description: 'Enter as a student, hostel owner, restaurant owner, or delivery partner with a tailored experience.',
  },
  {
    id: '02',
    title: 'Operate in one place',
    description: 'Rooms, menus, deliveries, enquiries, and profile details stay connected instead of spread across tools.',
  },
  {
    id: '03',
    title: 'Grow with clarity',
    description: 'Use more polished screens, cleaner data, and faster actions to create a high-trust product experience.',
  },
];

const spotlightMetrics = [
  { label: 'Account experiences', value: '4 roles' },
  { label: 'Connected workflows', value: 'Rooms + Food + Delivery' },
  { label: 'Premium admin feel', value: 'Unified dashboards' },
];

function DetailModal({ item, type, onClose }) {
  if (!item) return null;

  const isRoom = type === 'room';

  return (
    <div className="ph-modal-overlay" onClick={onClose}>
      <div className="ph-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="ph-modal__close" onClick={onClose}>
          x
        </button>
        <img src={item.image} alt={item.name} className="ph-modal__image" />
        <div className="ph-modal__body">
          <div className="ph-modal__tag">{isRoom ? 'Room Preview' : 'Food Preview'}</div>
          <h2>{item.name}</h2>
          <p className="ph-modal__location">
            <MapPin size={16} />
            <span>{item.location}</span>
          </p>

          <div className="ph-modal__summary">
            {isRoom ? (
              <>
                <div>
                  <span>Monthly cost</span>
                  <strong>{item.price}</strong>
                </div>
                <div>
                  <span>Room size</span>
                  <strong>{item.size}</strong>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span>Provider type</span>
                  <strong>{item.type}</strong>
                </div>
                <div>
                  <span>Price range</span>
                  <strong>{item.priceRange}</strong>
                </div>
              </>
            )}
          </div>

          <p className="ph-modal__description">{item.description}</p>

          <div className="ph-modal__chips">
            {(isRoom ? item.amenities : item.menu).map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>

          <div className="ph-modal__actions">
            <Link to="/register" className="ph-btn ph-btn--primary">
              Get Started
            </Link>
            <Link to="/login" className="ph-btn ph-btn--ghost">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicHome() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);

  return (
    <div className="public-home">
      <nav className="ph-navbar">
        <div className="ph-shell ph-navbar__inner">
          <Link to="/" className="ph-brand">
            <span className="ph-brand__mark">S</span>
            <span>StaySync AI</span>
          </Link>

          <div className="ph-navbar__links">
            <a href="#home">Home</a>
            <a href="#rooms">Rooms</a>
            <a href="#food">Food</a>
            <a href="#features">Features</a>
          </div>

          <div className="ph-navbar__actions">
            <Link to="/login" className="ph-btn ph-btn--ghost ph-btn--small">
              Login
            </Link>
            <Link to="/register" className="ph-btn ph-btn--primary ph-btn--small">
              Register
            </Link>
          </div>
        </div>
      </nav>

      <section className="ph-hero" id="home">
        <div className="ph-shell ph-hero__grid">
          <div className="ph-hero__content">
            <div className="ph-eyebrow">
              <Sparkles size={15} />
              <span>Premium ecosystem for all core users</span>
            </div>

            <h1>
              One premium platform
              <span> for students, hostel owners, restaurants, and delivery partners.</span>
            </h1>

            <p className="ph-hero__copy">
              StaySync AI brings accommodation, food ordering, delivery coordination, and role-based
              management into one refined product experience with modern dashboards and clearer UX.
            </p>

            <div className="ph-hero__actions">
              <Link to="/register" className="ph-btn ph-btn--primary">
                Create Account
              </Link>
              <a href="#account-types" className="ph-btn ph-btn--soft">
                Explore Roles
              </a>
            </div>

            <div className="ph-metrics">
              {spotlightMetrics.map((metric) => (
                <div key={metric.label} className="ph-metric">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ph-hero__visual">
            <div className="ph-dashboard-card ph-dashboard-card--main">
              <div className="ph-dashboard-card__top">
                <div>
                  <p>StaySync AI Control Center</p>
                  <strong>4 Connected Experiences</strong>
                </div>
                <span className="ph-status-pill">Live Platform</span>
              </div>

              <div className="ph-budget-bars">
                <div>
                  <span>Student Discovery</span>
                  <div className="ph-budget-bars__track">
                    <div style={{ width: '82%' }} />
                  </div>
                </div>
                <div>
                  <span>Owner Operations</span>
                  <div className="ph-budget-bars__track">
                    <div style={{ width: '76%' }} />
                  </div>
                </div>
                <div>
                  <span>Delivery Flow</span>
                  <div className="ph-budget-bars__track">
                    <div style={{ width: '64%' }} />
                  </div>
                </div>
              </div>

              <div className="ph-dashboard-card__footer">
                <div className="ph-mini-card">
                  <MapPin size={16} />
                  <div>
                    <strong>Multi-role onboarding</strong>
                    <span>Clear entry points for every user</span>
                  </div>
                </div>
                <div className="ph-mini-card">
                  <Clock3 size={16} />
                  <div>
                    <strong>Faster daily actions</strong>
                    <span>Cleaner dashboards and workflows</span>
                  </div>
                </div>
              </div>

              <div className="ph-dashboard-card ph-dashboard-card--floating">
                <BadgeCheck size={18} />
                <div>
                  <strong>Premium user journeys</strong>
                  <span>High-trust design across listings, orders, profiles, and delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ph-role-showcase" id="account-types">
        <div className="ph-shell">
          <div className="ph-section__heading">
            <div>
              <span className="ph-section__label">Account types</span>
              <h2>Built for every role that keeps the platform moving</h2>
            </div>
            <p>
              Choose the experience that fits you and enter a polished workflow designed for your
              daily tasks, growth, and trust.
            </p>
          </div>

          <div className="ph-role-grid">
            {accountTypes.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.id} className={`ph-role-card ph-role-card--${item.accent}`}>
                  <div className="ph-role-card__icon">
                    <Icon size={26} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <Link to="/register" className="ph-role-card__link">
                    Continue as {item.title}
                    <ArrowRight size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ph-pillars" id="features">
        <div className="ph-shell ph-pillars__grid">
          {featurePillars.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.id} className="ph-pillar-card">
                <div className="ph-pillar-card__icon">
                  <Icon size={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ph-section" id="rooms">
        <div className="ph-shell">
          <div className="ph-section__heading">
            <div>
              <span className="ph-section__label">Room picks</span>
              <h2>Accommodation discovery with stronger presentation</h2>
            </div>
            <p>
              Give students a better first impression with clearer listing structure, pricing, and
              room details that feel more premium and trustworthy.
            </p>
          </div>

          <div className="ph-card-grid">
            {featuredRooms.map((room) => (
              <article key={room.id} className="ph-card">
                <div className="ph-card__media">
                  <img src={room.image} alt={room.name} />
                  <span className="ph-card__badge">{room.price}</span>
                </div>
                <div className="ph-card__body">
                  <div className="ph-card__meta">
                    <span>Room</span>
                    <span>{room.size}</span>
                  </div>
                  <h3>{room.name}</h3>
                  <p className="ph-card__location">
                    <MapPin size={15} />
                    <span>{room.location}</span>
                  </p>
                  <p className="ph-card__text">{room.description}</p>
                  <div className="ph-chip-list">
                    {room.amenities.slice(0, 3).map((amenity) => (
                      <span key={amenity}>{amenity}</span>
                    ))}
                  </div>
                  <button type="button" className="ph-btn ph-btn--dark" onClick={() => setSelectedRoom(room)}>
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ph-section ph-section--alt" id="food">
        <div className="ph-shell">
          <div className="ph-section__heading">
            <div>
              <span className="ph-section__label">Food near you</span>
              <h2>Restaurant and meal experiences with better product polish</h2>
            </div>
            <p>
              Help restaurants present their food more clearly while giving students a faster way to
              compare everyday meal options.
            </p>
          </div>

          <div className="ph-card-grid">
            {featuredFood.map((provider) => (
              <article key={provider.id} className="ph-card ph-card--food">
                <div className="ph-card__media">
                  <img src={provider.image} alt={provider.name} />
                  <span className="ph-card__badge">{provider.priceRange}</span>
                </div>
                <div className="ph-card__body">
                  <div className="ph-card__meta">
                    <span>{provider.type}</span>
                    <span>Daily meals</span>
                  </div>
                  <h3>{provider.name}</h3>
                  <p className="ph-card__location">
                    <MapPin size={15} />
                    <span>{provider.location}</span>
                  </p>
                  <p className="ph-card__text">{provider.description}</p>
                  <div className="ph-chip-list">
                    {provider.menu.slice(0, 3).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <button type="button" className="ph-btn ph-btn--dark" onClick={() => setSelectedFood(provider)}>
                    View Menu
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ph-journey">
        <div className="ph-shell">
          <div className="ph-section__heading ph-section__heading--center">
            <div>
              <span className="ph-section__label">How it works</span>
              <h2>From confusion to a clear living plan</h2>
            </div>
            <p>
              The platform is built to reduce the usual student stress of finding a place, planning
              food, and estimating monthly spending.
            </p>
          </div>

          <div className="ph-journey__grid">
            {journeySteps.map((step) => (
              <article key={step.id} className="ph-step-card">
                <span className="ph-step-card__number">{step.id}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ph-cta">
        <div className="ph-shell ph-cta__inner">
          <div>
            <span className="ph-section__label">Start now</span>
            <h2>Make your next semester easier before it even begins</h2>
            <p>
              Join StaySync AI to compare rooms, discover meals, and make budget-aware choices with
              less guessing.
            </p>
          </div>

          <div className="ph-cta__actions">
            <Link to="/register" className="ph-btn ph-btn--primary">
              Create Account
            </Link>
            <Link to="/login" className="ph-btn ph-btn--soft">
              Sign In
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="ph-footer">
        <div className="ph-shell ph-footer__inner">
          <div>
            <h3>StaySync AI</h3>
            <p>Student housing, food discovery, and budget clarity in one place.</p>
          </div>
          <div className="ph-footer__links">
            <a href="#home">Home</a>
            <a href="#rooms">Rooms</a>
            <a href="#food">Food</a>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </footer>

      <DetailModal item={selectedRoom} type="room" onClose={() => setSelectedRoom(null)} />
      <DetailModal item={selectedFood} type="food" onClose={() => setSelectedFood(null)} />
    </div>
  );
}
