import { Link } from 'react-router-dom';
import './PublicHome.css';

const PublicHome = () => {
  // TODO: replace placeholder images with real hostel photos later
  const featuredRooms = [
    { id: 1, name: 'Cozy Single Room', location: 'Near University', price: 'LKR 25,000/month' },
    { id: 2, name: 'Shared Double Room', location: 'City Center', price: 'LKR 18,000/month' },
    { id: 3, name: 'Premium Studio', location: 'Colombo 7', price: 'LKR 35,000/month' },
    { id: 4, name: 'Budget Room', location: 'Nugegoda', price: 'LKR 15,000/month' },
  ];

  const featuredFood = [
    { id: 1, name: 'Home Kitchen', type: 'Home Food', location: 'Maharagama' },
    { id: 2, name: 'Spice Garden', type: 'Restaurant', location: 'Colombo 3' },
    { id: 3, name: 'Healthy Bites', type: 'Home Food', location: 'Nugegoda' },
    { id: 4, name: 'Quick Meals', type: 'Restaurant', location: 'Dehiwala' },
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
              <div className="card-icon">🏠</div>
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
          <p className="section-subtitle">Discover comfortable and affordable accommodation near your university</p>
          <div className="cards-grid">
            {featuredRooms.map((room) => (
              <div key={room.id} className="card">
                <img 
                  src={`https://via.placeholder.com/400x250?text=Room+Image`} 
                  alt={room.name}
                  className="card-image"
                />
                <div className="card-content">
                  <h3 className="card-title">{room.name}</h3>
                  <p className="card-location">📍 {room.location}</p>
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
          <p className="section-subtitle">Delicious meals delivered to your doorstep</p>
          <div className="cards-grid">
            {featuredFood.map((provider) => (
              <div key={provider.id} className="card">
                <img 
                  src={`https://via.placeholder.com/400x250?text=Food+Image`} 
                  alt={provider.name}
                  className="card-image"
                />
                <div className="card-content">
                  <h3 className="card-title">{provider.name}</h3>
                  <p className="card-type">🍽️ {provider.type}</p>
                  <p className="card-location">📍 {provider.location}</p>
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

      {/* AI Budget Planner Section */}
      <section className="budget-section gray-bg">
        <div className="section-container">
          <div className="budget-content">
            <div className="budget-text">
              <h2 className="section-title">AI-Powered Budget Planner</h2>
              <p>Let our intelligent system help you manage your monthly expenses efficiently. 
              Get personalized recommendations based on your budget and preferences.</p>
              <ul className="budget-features">
                <li>✓ Smart expense tracking</li>
                <li>✓ Personalized recommendations</li>
                <li>✓ Monthly budget optimization</li>
                <li>✓ Real-time insights</li>
              </ul>
            </div>
            <div className="budget-card">
              <h3>Monthly Budget Example</h3>
              <div className="budget-item">
                <span>Total Budget</span>
                <strong>LKR 50,000</strong>
              </div>
              <div className="budget-item">
                <span>Room Rent</span>
                <strong>LKR 28,000</strong>
              </div>
              <div className="budget-item">
                <span>Food & Meals</span>
                <strong>LKR 18,000</strong>
              </div>
              <div className="budget-item">
                <span>Savings</span>
                <strong className="savings">LKR 4,000</strong>
              </div>
            </div>
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
