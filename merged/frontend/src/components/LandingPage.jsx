import React from 'react';
import './LandingPage.css';
import poorFarmerArt from '../assets/poor_farmer_art.png';

export default function LandingPage({ onEnterDashboard }) {
  return (
    <div className="landing-page">
      {/* FULL SCREEN ART BACKGROUND (with CSS slow-pan animation) */}
      <img className="lp-video-bg" src={poorFarmerArt} alt="Cinematic Poor Farmer Cultivating Crop" />
      <div className="lp-video-overlay"></div>

      {/* HEADER SECTION */}
      <header className="lp-header">
        <div className="lp-brand">
          <h1 className="lp-logo-text">Onlyfarmer</h1>
          <span className="lp-registered">®</span>
        </div>
        
        <div className="lp-nav-container">
          <nav className="lp-links">
            <a onClick={() => onEnterDashboard(1)}>Solutions</a>
            <a href="#about">About us</a>
            <a href="#contact">Contact</a>
          </nav>
          
          <div className="lp-icons">
            <button className="lp-icon-btn">✦</button>
            <button className="lp-icon-btn" onClick={() => onEnterDashboard(1)}>☰</button>
          </div>
        </div>
      </header>

      {/* RIGHT-ALIGNED SUBTITLE */}
      <div className="lp-subtitle-wrapper">
        <h2 className="lp-subtitle">Intelligent<br/>Farming</h2>
      </div>

      {/* FOOTER ACTIONS */}
      <footer className="lp-footer">
        <div className="lp-footer-left">
          <p>More crop, efficiency, and profits!</p>
        </div>
        
        <div className="lp-footer-right">
          <button className="lp-btn-pill" onClick={() => onEnterDashboard(1)}>Launch Dashboard</button>
          <button className="lp-btn-pill" style={{background: '#2CB1E6', color: '#fff'}} onClick={() => onEnterDashboard(3)}>Book a Truck</button>
        </div>
      </footer>
    </div>
  );
}
