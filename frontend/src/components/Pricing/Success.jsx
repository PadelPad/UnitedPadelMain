import React from 'react';
import { Link } from 'react-router-dom';

const Success = () => {
  return (
    <div className="checkout-success">
      <h1>✅ Subscription Successful!</h1>
      <p>Welcome to United Padel Premium.</p>
      <Link to="/">Return to Home</Link>
    </div>
  );
};

export default Success;
