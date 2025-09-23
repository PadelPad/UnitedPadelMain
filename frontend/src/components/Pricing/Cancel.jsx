import React from 'react';
import { Link } from 'react-router-dom';

const Cancel = () => {
  return (
    <div className="checkout-cancel">
      <h1>❌ Checkout Cancelled</h1>
      <p>Your subscription was not completed.</p>
      <Link to="/pricing">Back to Pricing</Link>
    </div>
  );
};

export default Cancel;
