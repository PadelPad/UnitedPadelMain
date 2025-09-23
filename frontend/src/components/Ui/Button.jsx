import React from 'react';

const Button = ({ text, onClick, type = 'button', style = 'primary' }) => {
  const baseStyles = 'px-6 py-3 rounded-xl font-semibold transition duration-300';
  const variants = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600',
    secondary: 'bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-100',
    dark: 'bg-black text-white hover:bg-gray-800',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[style]}`}
    >
      {text}
    </button>
  );
};

export default Button;