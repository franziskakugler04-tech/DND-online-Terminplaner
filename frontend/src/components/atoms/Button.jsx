import React from 'react';

/* Button — Primary (orange), Ghost (inverted), Dark (button-dark) */

export default function Button({
  children,
  variant = "primary",   // primary | ghost | dark | outline | icon
  size = "md",           // sm | md | lg
  onClick,
  title,
  leading,
  className = "",
  style = {},
  disabled,
  block,
  type = "button",
}) {
  const sz = { sm: "32px", md: "40px", lg: "48px" }[size];
  const pad = { sm: "0 12px", md: "0 16px", lg: "0 22px" }[size];
  const fs = { sm: 14, md: 15, lg: 16 }[size];

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: sz,
    padding: variant === "icon" ? 0 : pad,
    width: variant === "icon" ? sz : (block ? "100%" : undefined),
    borderRadius: 5,
    fontFamily: "var(--cc-font)",
    fontWeight: 500,
    fontSize: fs,
    lineHeight: 1,
    transition: "transform .08s ease, background .15s ease, color .15s ease, box-shadow .15s ease",
    whiteSpace: "nowrap",
    opacity: disabled ? 0.45 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };

  const variants = {
    primary: {
      background: "var(--cc-accent)",
      color: "var(--cc-ink)",
    },
    dark: {
      background: "var(--cc-dark-night)",
      color: "#fff",
    },
    ghost: {
      background: "transparent",
      color: "var(--cc-text)",
      boxShadow: "inset 0 0 0 1px var(--cc-border)",
    },
    outline: {
      background: "transparent",
      color: "var(--cc-accent)",
      boxShadow: "inset 0 0 0 1px var(--cc-accent)",
    },
    icon: {
      background: "var(--cc-accent-deep)",
      color: "#fff",
      borderRadius: 5,
    },
  };

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
      className={`cc-btn cc-btn-${variant} ${className}`}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={e => (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={e => (e.currentTarget.style.transform = "")}
      onMouseLeave={e => (e.currentTarget.style.transform = "")}
    >
      {leading}
      {children}
    </button>
  );
}
