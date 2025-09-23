// src/components/Ui/Tooltip.jsx
import React from "react";
import PropTypes from "prop-types";
import "../../styles/Tooltip.css";

/**
 * Lightweight, accessible tooltip (no external deps).
 * - Shows on hover and keyboard focus
 * - Positions: top | right | bottom | left
 */
export default function Tooltip({ content, position = "top", children }) {
  return (
    <span className={`tooltipped pos-${position}`} tabIndex={0}>
      {children}
      <span className="tooltip-bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}

Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  position: PropTypes.oneOf(["top", "right", "bottom", "left"]),
  children: PropTypes.node.isRequired,
};
