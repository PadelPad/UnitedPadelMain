import React, { useState } from 'react';
import './Pricing.css';

const Pricing = () => {
  const [activeTab, setActiveTab] = useState('individual');

  const renderPlans = () => {
    switch (activeTab) {
      case 'individual':
        return (
          <div className="pricing-cards">
            <div className="pricing-card">
              <h3>Basic</h3>
              <p>£0 / month</p>
              <ul>
                <li>10 matches per month</li>
                <li>Join open tournaments</li>
                <li>View public leaderboards</li>
              </ul>
            </div>
            <div className="pricing-card">
              <h3>Plus</h3>
              <p>£4.99 / month</p>
              <ul>
                <li>Unlimited match uploads</li>
                <li>Verified rankings</li>
                <li>Club leaderboards</li>
                <li>Premium tournaments</li>
              </ul>
            </div>
            <div className="pricing-card">
              <h3>Elite</h3>
              <p>£9.99 / month</p>
              <ul>
                <li>All Plus features</li>
                <li>High-stakes tournaments</li>
                <li>Custom profile features</li>
                <li>Priority support</li>
              </ul>
            </div>
          </div>
        );
      case 'club':
        return (
          <div className="pricing-cards">
            <div className="pricing-card">
              <h3>Basic</h3>
              <p>£0 / month</p>
              <ul>
                <li>Free club leaderboard</li>
                <li>Limited player tracking</li>
              </ul>
            </div>
            <div className="pricing-card">
              <h3>Club Plus</h3>
              <p>£14.99 / month</p>
              <ul>
                <li>Automated rankings</li>
                <li>Tournament management</li>
              </ul>
            </div>
            <div className="pricing-card">
              <h3>Club Elite</h3>
              <p>£39.99 / month</p>
              <ul>
                <li>Custom branding</li>
                <li>Sponsorship integration</li>
                <li>Premium analytics</li>
              </ul>
            </div>
          </div>
        );
      case 'business':
        return (
          <div className="pricing-cards">
            <div className="pricing-card">
              <h3>Starter</h3>
              <p>£79 / month</p>
              <ul>
                <li>Private leaderboards</li>
                <li>Basic analytics</li>
              </ul>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <p>£199 / month</p>
              <ul>
                <li>Branded tournaments</li>
                <li>Employee reports</li>
              </ul>
            </div>
            <div className="pricing-card">
              <h3>Corporate Elite</h3>
              <p>£299 / month</p>
              <ul>
                <li>Dedicated account manager</li>
                <li>National corporate league</li>
              </ul>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pricing-page">
      <h1 className="pricing-title">Choose Your Plan</h1>
      <div className="pricing-tabs">
        <button
          className={activeTab === 'individual' ? 'active' : ''}
          onClick={() => setActiveTab('individual')}
        >
          Individuals
        </button>
        <button
          className={activeTab === 'club' ? 'active' : ''}
          onClick={() => setActiveTab('club')}
        >
          Padel Clubs
        </button>
        <button
          className={activeTab === 'business' ? 'active' : ''}
          onClick={() => setActiveTab('business')}
        >
          Businesses
        </button>
      </div>
      {renderPlans()}
    </div>
  );
};

export default Pricing;