import React from 'react';
import { motion } from 'framer-motion';
import './Carousel.css';

const Carousel = ({ items }) => {
  return (
    <div className="carousel-container">
      <motion.div
        className="carousel"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.2 }}
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            className="carousel-card"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
          >
            {item.image_url && (
              <img src={item.image_url} alt={item.title} className="carousel-image" />
            )}
            <div className="carousel-content">
              <h3>{item.title}</h3>
              <p>{item.content}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Carousel;