import React from 'react';
import { motion } from 'framer-motion';
import './AboutUs.css';

import bgWave from '../../assets/bg-wave.jpg';
import padelHero from '../../assets/padelhero.jpg';
import padelTeam from '../../assets/padelteam.jpg';
import padelRank from '../../assets/padelranking.jpg';
import padelMission from '../../assets/padelmission.jpg';

const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 }
};

export default function AboutUs() {
  return (
    <div
      className="about-wrapper"
      style={{
        backgroundImage: `url(${bgWave})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="about-container">

        <motion.section
          className="about-hero"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          variants={fadeInUp}
        >
          <img src={padelHero} alt="Hero padel" className="hero-img" />
          <div className="about-hero-text">
            <h1>Welcome to United Padel</h1>
            <p>
              We’re more than just a ranking system. We’re a movement. A home for every player who’s ever craved a comeback, fought for that final set, or dreamed of standing at the top.
            </p>
          </div>
        </motion.section>

        <motion.section
          className="about-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          variants={fadeInUp}
        >
          <div className="text-content">
            <h2>Built by players. For players.</h2>
            <p>
              United Padel was born in 2024 with one mission: to fuel the fastest-growing sport with fairness, passion, and smart tech.
            </p>
            <p>
              We’re coders, coaches, competitors — and we’re building what we always wished existed.
            </p>
          </div>
          <div className="about-img-wrapper">
            <img src={padelTeam} alt="Our team" className="about-img" />
          </div>
        </motion.section>

        <motion.section
          className="about-section reverse"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          variants={fadeInUp}
        >
          <div className="text-content">
            <h2>Fair. Dynamic. Competitive.</h2>
            <p>Our Elo-based system rewards what truly matters:</p>
            <ul>
              <li>🏆 The match type (friendly? league? tournament?)</li>
              <li>⚔️ Who you played and how tough they were</li>
              <li>🔥 Your set scores, streaks, and clutch factor</li>
              <li>🕒 Consistency over time — no dodging</li>
            </ul>
          </div>
          <div className="about-img-wrapper">
            <img src={padelRank} alt="Ranking system" className="about-img" />
          </div>
        </motion.section>

        <motion.section
          className="about-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          variants={fadeInUp}
        >
          <div className="text-content">
            <h2>Why We Exist</h2>
            <ul>
              <li>🎯 To help players rise through skill, not politics</li>
              <li>🤝 To empower local clubs with modern tools</li>
              <li>📊 To bring clarity to rankings, and emotion to data</li>
              <li>💥 To create a national scene worth watching</li>
            </ul>
          </div>
          <div className="about-img-wrapper tall-img">
            <img src={padelMission} alt="Our mission" className="about-img" />
          </div>
        </motion.section>

        <motion.section
          className="about-cta"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          variants={fadeInUp}
        >
          <h3>Ready to Rise?</h3>
          <p>Join the movement. Build your legacy. Earn your crown.</p>
          <a href="/login" className="cta-button">Get Started</a>
        </motion.section>

      </div>
    </div>
  );
}
