import React from 'react';

/* NavItem — Header-Navigation mit orange Diamant als aktiven Indikator */

export default function NavItem({ label, active, onClick, icon }) {
  return (
    <button
      className="cc-nav-item"
      onClick={onClick}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "6px 18px 6px 50px",
        color: active ? "#fff" : "rgba(255,255,255,.82)",
        fontWeight: active ? 600 : 400,
        height: 44,
        transition: "color .15s",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          width: 30,
          height: 30,
          clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: active ? "var(--cc-accent)" : "var(--cc-accent-deep)",
          transition: "background .2s",
        }}
      />
      {icon}
      {label}
    </button>
  );
}
