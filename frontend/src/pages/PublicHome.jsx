import { Link } from 'react-router-dom';
import './PublicHome.css';

const PublicHome = () => {
  const featuredRooms = [
    {
      id: 1,
      name: 'Cozy Single Room',
      location: 'Near University',
      price: 'LKR 25,000/month',
      image: '/images/PublicImage1.jpg',
    },
    {
      id: 2,
      name: 'Shared Double Room',
      location: 'City Center',
      price: 'LKR 18,000/month',
      image: '/images/PublicImage2.jpg',
    },
    {
      id: 3,
      name: 'Premium Studio',
      location: 'Colombo 7',
      price: 'LKR 35,000/month',
      image: '/images/PublicImage3.jpg',
    },
    {
      id: 4,
      name: 'Budget Room',
      location: 'Nugegoda',
      price: 'LKR 15,000/month',
      image: '/images/PublicImage4.png',
    },
  ];

  const featuredFood = [
    {
      id: 1,
      name: 'Home Kitchen',
      type: 'Home Food',
      location: 'Maharagama',
      image: '/images/Restaurant1.jpg',
    },
    {
      id: 2,
      name: 'Spice Garden',
      type: 'Restaurant',
      location: 'Colombo 3',
      image: '/images/Restaurant2.jpg',
    },
    {
      id: 3,
      name: 'Healthy Bites',
      type: 'Home Food',
      location: 'Nugegoda',
      image: '/images/Restaurant3.png',
    },
    {
      id: 4,
      name: 'Quick Meals',
      type: 'Restaurant',
      location: 'Dehiwala',
      image: '/images/Restaurant4.jpg',
    },
  ];

  const aiFeatures = [
    {
      id: 1,
      number: '01',
      title: 'Monthly Budget Planner',
      description:
        'Plan your monthly student expenses with smart room costs, meal packages, and balanced spending suggestions.',
    },
    {
      id: 2,
      number: '02',
      title: 'Live Delivery Tracking',
      description:
        'Track food deliveries in real time and stay updated on order progress from preparation to arrival.',
    },
    {
      id: 3,
      number: '03',
      title: 'Room Recommendation System',
      description:
        'Get room suggestions based on your budget, location preference, lifestyle needs, and nearby food options.',
    },
  ];

  return (
    <div className="public-home">
      {/* Sticky Navbar */}
      <nav className="public-navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">StaySync AI</Link>
          <div className="nav-menu">
            <a href="#home">Home</a>
            <a href="#rooms">Rooms</a>
            <a href="#food">Food</a>
            <a href="#features">Features</a>
          </div>
          <div className="nav-buttons">
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/register" className="btn-register">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Find Rooms, Food & Smart Budget Planning in One Place</h1>
            <p className="hero-subtitle">
              The ultimate platform for students to discover affordable accommodation,
              order delicious meals, and manage their budget with AI-powered recommendations.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-primary">Get Started</Link>
              <a href="#rooms" className="btn-secondary">Explore Rooms</a>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-card">
              <div className="card-icon">◆</div>
              <h3>Smart Living</h3>
              <p>AI-powered recommendations for your perfect student life</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="featured-section" id="rooms">
        <div className="section-container">
          <h2 className="section-title">Featured Rooms</h2>
          <p className="section-subtitle">
            Discover comfortable and affordable accommodation near your university
          </p>
          <div className="cards-grid">
            {featuredRooms.map((room) => (
              <div key={room.id} className="card">
                <img
                  src={room.image}
                  alt={room.name}
                  className="card-image"
                />
                <div className="card-content">
                  <h3 className="card-title">{room.name}</h3>
                  <p className="card-location">Location | {room.location}</p>
                  <p className="card-price">{room.price}</p>
                  <button className="btn-card">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Food Section */}
      <section className="featured-section gray-bg" id="food">
        <div className="section-container">
          <h2 className="section-title">Featured Food Providers</h2>
          <p className="section-subtitle">Fresh and affordable meal options for students every day</p>
          <div className="cards-grid">
            {featuredFood.map((provider) => (
              <div key={provider.id} className="card">
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="card-image"
                />
                <div className="card-content">
                  <h3 className="card-title">{provider.name}</h3>
                  <p className="card-type">Type | {provider.type}</p>
                  <p className="card-location">Location | {provider.location}</p>
                  <button className="btn-card">View Menu</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="features">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Sign up in seconds and set your preferences</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Explore Rooms & Food</h3>
              <p>Browse verified listings near your university</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Get AI Recommendations</h3>
              <p>Smart budget planning tailored to your needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="budget-section gray-bg">
        <div className="section-container">
          <div className="ai-section-header">
            <h2 className="section-title">Our Smart AI Features</h2>
            <p className="section-subtitle">
              Designed to make student living easier, smarter, and more affordable
            </p>
          </div>

          <div className="ai-features-grid">
            {aiFeatures.map((feature) => (
              <div key={feature.id} className="ai-feature-card">
                <div className="ai-feature-number">{feature.number}</div>
                <h3 className="ai-feature-title">{feature.title}</h3>
                <p className="ai-feature-description">{feature.description}</p>
                <div className="ai-feature-line"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="section-container">
          <h2 className="cta-title">Ready to Simplify Student Living?</h2>
          <p className="cta-subtitle">Join thousands of students already using StaySync AI</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-primary large">Register Now</Link>
            <Link to="/login" className="btn-secondary large">Login</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>StaySync AI</h3>
            <p>Smart Student Living Platform</p>
          </div>
          <div className="footer-links">
            <a href="#home">Home</a>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 StaySync AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicHome;