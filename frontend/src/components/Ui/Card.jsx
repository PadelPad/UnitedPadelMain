import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={
        "bg-white shadow-lg rounded-2xl overflow-hidden " + className
      }
    >
      {children}
    </div>
  );
}