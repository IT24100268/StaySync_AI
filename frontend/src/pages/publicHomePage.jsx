import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './publicHomePage.css';

const ROOMS = [
  { id: 1, name: 'Sunrise Studio', location: '0.3 km from campus', price: 'LKR 18,000/mo', amenities: ['WiFi', 'AC', 'Attached Bath'], rating: 4.7, image: '/images/PublicImage1.jpg' },
  { id: 2, name: 'Garden View Suite', location: '0.5 km from campus', price: 'LKR 22,000/mo', amenities: ['WiFi', 'AC', 'Balcony'], rating: 4.8, featured: true, image: '/images/PublicImage2.jpg' },
  { id: 3, name: 'The Scholar Den', location: '0.2 km from campus', price: 'LKR 15,000/mo', amenities: ['WiFi', 'Study Desk', 'Hot Water'], rating: 4.5, image: '/images/PublicImage3.jpg' },
  { id: 4, name: 'Maple Residency', location: '0.7 km from campus', price: 'LKR 20,000/mo', amenities: ['WiFi', 'AC', 'Parking'], rating: 4.6, image: '/images/PublicImage4.png' },
];

const RESTAURANTS = [
  { id: 1, name: 'The Campus Kitchen', cuisine: 'Sri Lankan · Rice & Curry', time: '20–30 min', min: 'LKR 350', rating: 4.5, image: '/images/Restaurant1.jpg',
    menu: [
      { item: 'Rice & Curry (Veg)', price: 'LKR 350' },
      { item: 'Rice & Curry (Chicken)', price: 'LKR 450' },
      { item: 'Kottu Roti', price: 'LKR 400' },
      { item: 'Pol Sambol Roti', price: 'LKR 200' },
      { item: 'Papadam Plate', price: 'LKR 150' },
    ]
  },
  { id: 2, name: 'Spice Route', cuisine: 'Indian · Biryani & Curries', time: '25–35 min', min: 'LKR 400', rating: 4.7, featured: true, image: '/images/Restaurant2.jpg',
    menu: [
      { item: 'Chicken Biryani', price: 'LKR 550' },
      { item: 'Mutton Biryani', price: 'LKR 700' },
      { item: 'Paneer Butter Masala', price: 'LKR 480' },
      { item: 'Garlic Naan', price: 'LKR 120' },
      { item: 'Mango Lassi', price: 'LKR 200' },
    ]
  },
  { id: 3, name: 'Burger Barn', cuisine: 'Fast Food · Burgers & Fries', time: '15–25 min', min: 'LKR 300', rating: 4.4, image: '/images/Restaurant3.png',
    menu: [
      { item: 'Classic Beef Burger', price: 'LKR 450' },
      { item: 'Crispy Chicken Burger', price: 'LKR 400' },
      { item: 'Loaded Fries', price: 'LKR 300' },
      { item: 'Cheese Dog', price: 'LKR 350' },
      { item: 'Chocolate Milkshake', price: 'LKR 280' },
    ]
  },
  { id: 4, name: 'Green Bowl', cuisine: 'Healthy · Salads & Wraps', time: '20–30 min', min: 'LKR 450', rating: 4.6, image: '/images/Restaurant4.jpg',
    menu: [
      { item: 'Caesar Salad', price: 'LKR 480' },
      { item: 'Grilled Chicken Wrap', price: 'LKR 520' },
      { item: 'Avocado Toast', price: 'LKR 450' },
      { item: 'Smoothie Bowl', price: 'LKR 550' },
      { item: 'Fresh Juice', price: 'LKR 250' },
    ]
  },
];

const REVIEWS = [
  { initials: 'A.K.', name: 'Ashan Kumara', uni: 'University of Colombo', stars: 5, text: 'StaySync AI made finding my room so easy. The listings are accurate and the booking process was seamless. Highly recommend to every student!' },
  { initials: 'N.P.', name: 'Nimesha Perera', uni: 'SLIIT', stars: 5, text: 'Ordered food through StaySync AI for the first time and I was blown away. Fast delivery, hot food, and great variety near campus.' },
  { initials: 'R.S.', name: 'Ravindu Silva', uni: 'University of Moratuwa', stars: 5, text: 'The hostel I found through StaySync AI is perfect — clean, affordable, and close to uni. The platform is super intuitive to use.' },
  { initials: 'D.F.', name: 'Dilini Fernando', uni: 'Kelaniya University', stars: 5, text: 'As a student on a budget, StaySync AI helped me find a great room and affordable meals all in one place. Absolute lifesaver!' },
];

const FAQS = [
  { q: 'Is StaySync AI free to use?', a: 'Yes! Students can browse rooms and order food completely free. Hostel and restaurant owners pay a small listing fee to publish their offerings.' },
  { q: 'How do I list my hostel?', a: 'Register as a Hostel Owner, complete your profile verification, and use the dashboard to add your property with photos, pricing, and amenities.' },
  { q: 'Which areas are covered?', a: 'We currently cover major university zones across Colombo, Moratuwa, Kelaniya, and Peradeniya, with more cities being added regularly.' },
  { q: 'How does delivery work?', a: 'Once you place an order, our verified delivery partners pick it up from the restaurant and deliver it to your location. You can track in real-time.' },
  { q: 'Can I cancel a room booking?', a: 'Yes, cancellations are allowed up to 48 hours before the move-in date for a full refund. After that, the hostel owner\'s cancellation policy applies.' },
  { q: 'How are reviews verified?', a: 'Only students who have completed a booking or placed an order can leave a review, ensuring all feedback is genuine and trustworthy.' },
];

const HERO_SLIDES = [
  {
    image: '/images/image6.png',
    eyebrow: " Sri Lanka's Campus Living Platform",
    title: 'Your Campus Life,',
    titleEm: 'Elevated.',
    sub: 'Discover verified rooms and delicious food delivery — all within walking distance of your university.',
  },
  {
    image: '/images/image5.webp',
    eyebrow: ' Verified Student Stays',
    title: 'Find Your Perfect',
    titleEm: 'Room.',
    sub: 'Browse premium student-friendly rooms near your campus with trusted pricing and real reviews.',
  },
  {
    image: '/images/image7.png',
    eyebrow: ' Campus Food Delivery',
    title: 'Hot Meals,',
    titleEm: 'Delivered Fast.',
    sub: 'Order from top-rated restaurants near your university and get food delivered right to your door.',
  },
];

const ACCOUNT_TYPES = [
  { type: 'student', icon: '🎓', label: 'Student', desc: 'Find rooms and order food near your campus.' },
  { type: 'hostel_owner', icon: '🏠', label: 'Hostel Owner', desc: 'List your property and reach thousands of students.' },
  { type: 'restaurant_owner', icon: '🍽️', label: 'Restaurant Owner', desc: 'Grow your business with campus food delivery.' },
  { type: 'delivery_partner', icon: '🛵', label: 'Delivery Partner', desc: 'Earn flexibly by delivering food on campus.' },
];

export default function PublicHomePage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [modal, setModal] = useState(null); // { type: 'room'|'food', data: {} }

  const closeModal = () => setModal(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  return (
    <div className="ph-page">

      <nav className="ph-nav">
        <div className="ph-nav__inner ph-container">
          <Link to="/" className="ph-logo">
            <span className="ph-logo__mark">SS</span>
            StaySync AI
          </Link>
          <div className="ph-nav__links">
            <a href="#rooms">Rooms</a>
            <a href="#food">Food</a>
            <a href="#how">How It Works</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="ph-nav__actions">
            <Link to="/login" className="ph-btn ph-btn--outline-light">Log In</Link>
            <Link to="/register?type=student" className="ph-btn ph-btn--gold">Sign Up</Link>
          </div>
        </div>
      </nav>

      <section className="ph-hero">
        {/* Background image slides */}
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`ph-hero__bg${i === heroIndex ? ' is-active' : ''}`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
        ))}
        <div className="ph-hero__overlay" />

        <div className="ph-container ph-hero__content">
          {HERO_SLIDES.map((slide, i) => (
            <div key={i} className={`ph-hero__slide${i === heroIndex ? ' is-active' : ''}`}>
              <p className="ph-hero__eyebrow ph-fade-up ph-fade-up--1">{slide.eyebrow}</p>
              <h1 className="ph-hero__title ph-fade-up ph-fade-up--2">{slide.title}<br /><em>{slide.titleEm}</em></h1>
              <div className="ph-hero__divider ph-fade-up ph-fade-up--3"><span /><span /><span /></div>
              <p className="ph-hero__sub ph-fade-up ph-fade-up--4">{slide.sub}</p>
              <div className="ph-hero__actions ph-fade-up ph-fade-up--5">
                <a href="#rooms" className="ph-hero__cta ph-hero__cta--primary">Find a Room</a>
                <a href="#food" className="ph-hero__cta ph-hero__cta--ghost">Order Food</a>
              </div>
            </div>
          ))}

          {/* Dot indicators */}
          <div className="ph-hero__dots">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                className={`ph-hero__dot${i === heroIndex ? ' is-active' : ''}`}
                onClick={() => setHeroIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="ph-section ph-join">
        <div className="ph-container">
          <div className="ph-section__heading-wrap">
            <span className="ph-section__eyebrow">Choose your role</span>
            <h2 className="ph-section__title">Join StaySync AI As</h2>
            <p className="ph-section__sub">One platform, four powerful roles. Pick yours and get started in minutes.</p>
            <div className="ph-section__line" />
          </div>
          <div className="ph-join__grid">
            {ACCOUNT_TYPES.map(({ type, icon, label, desc }) => (
              <div key={type} className="ph-join__card">
                <h3 className="ph-join__label">{label}</h3>
                <p className="ph-join__desc">{desc}</p>
                <Link to={`/register?type=${type}`} className="ph-join__btn">Get Started →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ph-section ph-rooms" id="rooms">
        <div className="ph-container">
          <div className="ph-section__heading-wrap">
            <span className="ph-section__eyebrow">Premium stays</span>
            <h2 className="ph-section__title">Rooms Near You</h2>
            <p className="ph-section__sub">
              Discover polished student-friendly stays with premium details, trusted pricing, and the comfort you need near campus.
            </p>
            <div className="ph-section__line" />
          </div>

          <div className="ph-rooms__grid">
            {ROOMS.map((r) => (
              <article key={r.id} className={`ph-room-card${r.featured ? ' ph-room-card--featured' : ''}`}>
                {r.featured && <span className="ph-room-card__featured-badge">★ Editor’s Pick</span>}

                <div className="ph-room-card__img-wrap">
                  <img
                    src={r.image}
                    alt={r.name}
                    className="ph-room-card__img"
                  />
                  <div className="ph-room-card__img-overlay" />
                  <span className="ph-room-card__location">📍 {r.location}</span>
                </div>

                <div className="ph-room-card__body">
                  <div className="ph-room-card__top">
                    <div>
                      <h3 className="ph-room-card__name">{r.name}</h3>
                      <p className="ph-room-card__price">
                        {r.price} <span className="ph-room-card__price-label">all inclusive</span>
                      </p>
                    </div>
                    <span className="ph-room-card__rating">⭐ {r.rating}</span>
                  </div>

                  <div className="ph-room-card__amenities">
                    {r.amenities.map((a) => (
                      <span key={a} className="ph-room-tag">{a}</span>
                    ))}
                  </div>

                  <div className="ph-room-card__footer">
                    <span className="ph-room-card__meta">Verified listing</span>
                    <button onClick={() => setModal({ type: 'room', data: r })} className="ph-room-card__btn">View Details →</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOD ── */}
      <section className="ph-section ph-food" id="food">
        <div className="ph-container">
          <div className="ph-section__heading-wrap">
            <span className="ph-section__eyebrow">Campus Dining</span>
            <h2 className="ph-section__title">Food Near You</h2>
            <p className="ph-section__sub">
              Hot meals, fast delivery, and great variety — all from restaurants within reach of your campus.
            </p>
            <div className="ph-section__line" />
          </div>
          <div className="ph-food__grid">
            {RESTAURANTS.map((r) => (
              <article key={r.id} className={`ph-food-card${r.featured ? ' ph-food-card--featured' : ''}`}>
                {r.featured && <span className="ph-food-card__featured-badge">★ Most Popular</span>}
                <div className="ph-food-card__img-wrap">
                  <img
                    src={r.image}
                    alt={r.name}
                    className="ph-food-card__img"
                  />
                  <div className="ph-food-card__img-overlay" />
                  <span className="ph-food-card__cuisine">🍴 {r.cuisine}</span>
                </div>
                <div className="ph-food-card__body">
                  <div className="ph-food-card__top">
                    <div>
                      <h3 className="ph-food-card__name">{r.name}</h3>
                      <div className="ph-food-card__meta">
                        <span>🕐 {r.time}</span>
                        <span className="ph-food-card__dot">·</span>
                        <span>Min: LKR {r.min}</span>
                      </div>
                    </div>
                    <span className="ph-food-card__rating">⭐ {r.rating}</span>
                  </div>
                  <div className="ph-food-card__footer">
                    <span className="ph-food-card__verified">Free delivery available</span>
                    <button onClick={() => setModal({ type: 'food', data: r })} className="ph-food-card__btn">View Menu →</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ph-section ph-section--dark">
        <div className="ph-container">
          <h2 className="ph-section__title ph-section__title--light">What Students Are Saying</h2>
          <div className="ph-section__line" />
          <div className="ph-reviews__grid">
            {REVIEWS.map((rv) => (
              <div key={rv.initials} className="ph-review__card">
                <span className="ph-review__quote">"</span>
                <div className="ph-review__header">
                  <div className="ph-review__avatar">{rv.initials}</div>
                  <div>
                    <p className="ph-review__name">{rv.name}</p>
                    <p className="ph-review__uni">{rv.uni}</p>
                  </div>
                </div>
                <div className="ph-review__stars">{'⭐'.repeat(rv.stars)}</div>
                <p className="ph-review__text">{rv.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ph-section" id="how">
        <div className="ph-container">
          <h2 className="ph-section__title">How StaySync AI Works</h2>
          <div className="ph-section__line" />
          <div className="ph-steps">
            {[
              { n: '01', icon: '👤', title: 'Create Account', desc: 'Sign up and choose your role — student, owner, restaurant, or rider.' },
              { n: '02', icon: '🔍', title: 'Browse & Connect', desc: 'Explore verified rooms and restaurants near your university.' },
              { n: '03', icon: '🎉', title: 'Move In or Order', desc: 'Confirm your booking or place your order and enjoy campus life.' },
            ].map((step, i) => (
              <div key={step.n} className="ph-step">
                <div className="ph-step__circle">{step.n}</div>
                {i < 2 && <div className="ph-step__line" />}
                <div className="ph-step__icon">{step.icon}</div>
                <h3 className="ph-step__title">{step.title}</h3>
                <p className="ph-step__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ph-section ph-section--alt" id="faq">
        <div className="ph-container ph-container--narrow">
          <h2 className="ph-section__title">Frequently Asked Questions</h2>
          <div className="ph-section__line" />
          <div className="ph-faq">
            {FAQS.map((faq, i) => (
              <div key={i} className={`ph-faq__item ${openFaq === i ? 'is-open' : ''}`}>
                <button className="ph-faq__q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span className="ph-faq__icon">{openFaq === i ? '−' : '+'}</span>
                </button>
                <div className="ph-faq__body">
                  <p className="ph-faq__a">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="ph-footer">
        <div className="ph-footer__top-line" />
        <div className="ph-container ph-footer__grid">
          <div className="ph-footer__col">
            <div className="ph-logo ph-logo--light">
              <span className="ph-logo__mark">SS</span>
              StaySync AI
            </div>
            <p className="ph-footer__tagline">Your campus life, elevated. Rooms & food, all in one place.</p>
            <div className="ph-footer__socials">
              <a href="#" aria-label="LinkedIn">in</a>
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="Facebook">f</a>
            </div>
          </div>
          <div className="ph-footer__col">
            <h4 className="ph-footer__heading">Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/register?type=student">Browse Rooms</Link></li>
              <li><Link to="/register?type=student">Browse Food</Link></li>
              <li><a href="#">About Us</a></li>
            </ul>
          </div>
          <div className="ph-footer__col">
            <h4 className="ph-footer__heading">For Partners</h4>
            <ul>
              <li><Link to="/register?type=hostel_owner">List Your Hostel</Link></li>
              <li><Link to="/register?type=restaurant_owner">Register Restaurant</Link></li>
              <li><Link to="/register?type=delivery_partner">Become a Rider</Link></li>
            </ul>
          </div>
          <div className="ph-footer__col">
            <h4 className="ph-footer__heading">Contact</h4>
            <ul className="ph-footer__contact">
              <li>📧 hello@staysyncai.lk</li>
              <li>📞 +94 77 123 4567</li>
              <li>📍 Colombo 07, Sri Lanka</li>
            </ul>
          </div>
        </div>
        <div className="ph-footer__bottom">
          <p>© {new Date().getFullYear()} StaySync AI. All rights reserved.</p>
          <div className="ph-footer__legal">
            <a href="#">Privacy Policy</a>
            <span>·</span>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
      {/* ── MODAL ── */}
      {modal && (
        <div className="ph-modal__backdrop" onClick={closeModal}>
          <div className="ph-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ph-modal__close" onClick={closeModal} aria-label="Close">✕</button>

            <div className="ph-modal__img-wrap">
              <img
                src={modal.type === 'room'
                  ? modal.data.image
                  : modal.data.image}
                alt={modal.data.name}
                className="ph-modal__img"
              />
              <div className="ph-modal__img-overlay" />
              {modal.data.featured && (
                <span className="ph-modal__featured-badge">
                  {modal.type === 'room' ? '★ Editor\'s Pick' : '★ Most Popular'}
                </span>
              )}
            </div>

            <div className="ph-modal__body">
              <div className="ph-modal__header">
                <div>
                  <p className="ph-modal__type">{modal.type === 'room' ? '🏠 Student Room' : '🍴 Restaurant'}</p>
                  <h2 className="ph-modal__title">{modal.data.name}</h2>
                </div>
                <span className="ph-modal__rating">⭐ {modal.data.rating}</span>
              </div>

              <div className="ph-modal__divider" />

              {modal.type === 'room' ? (
                <div className="ph-modal__details">
                  <div className="ph-modal__row">
                    <span className="ph-modal__label">📍 Location</span>
                    <span className="ph-modal__value">{modal.data.location}</span>
                  </div>
                  <div className="ph-modal__row">
                    <span className="ph-modal__label">💰 Price</span>
                    <span className="ph-modal__value ph-modal__value--gold">{modal.data.price}</span>
                  </div>
                  <div className="ph-modal__row">
                    <span className="ph-modal__label">✅ Amenities</span>
                    <div className="ph-modal__tags">
                      {modal.data.amenities.map((a) => (
                        <span key={a} className="ph-modal__tag">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="ph-modal__row">
                    <span className="ph-modal__label">🔒 Status</span>
                    <span className="ph-modal__value">Verified Listing</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ph-modal__menu-info">
                    <span>🕐 {modal.data.time}</span>
                    <span>·</span>
                    <span>Min: LKR {modal.data.min}</span>
                    <span>·</span>
                    <span>{modal.data.cuisine}</span>
                  </div>
                  <ul className="ph-modal__menu">
                    {modal.data.menu.map((m) => (
                      <li key={m.item} className="ph-modal__menu-item">
                        <span className="ph-modal__menu-name">{m.item}</span>
                        <span className="ph-modal__menu-price">{m.price}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <Link to="/register?type=student" className="ph-modal__cta">
                {modal.type === 'room' ? 'Book This Room' : 'Order Now'} →
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}