import React from 'react';

/* Logo — "Campaign Connect" mit Diamond + Sword,
   rekonstruiert aus Figma Branding-Frame (Koulen-Font). */

export default function Logo({ size = "md", onDark = false }) {
  const sizes = {
    sm: { diam: 26, font: 20, gap: 8 },
    md: { diam: 36, font: 26, gap: 10 },
    lg: { diam: 64, font: 48, gap: 14 },
    xl: { diam: 110, font: 88, gap: 22 },
    hero:{ diam: 200, font: 126, gap: 28 },
  }[size];

  return (
    <div
      className="cc-logo"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sizes.gap,
      }}
    >
      {/* Diamond with Sword pointing across it */}
      <div
        style={{
          position: "relative",
          width: sizes.diam,
          height: sizes.diam,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {/* back diamond (orange-deep) */}
        <div style={{
          position: "absolute", inset: 0,
          background: "var(--cc-orange-deep)",
          clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }} />
        {/* front diamond (orange-light, smaller) */}
        <div style={{
          position: "absolute",
          inset: `${sizes.diam*0.22}px`,
          background: "var(--cc-orange)",
          clipPath: "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          transform: "rotate(15deg)",
        }} />
        {/* sword */}
        <svg
          viewBox="0 0 100 100"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <g transform="rotate(45 50 50)">
            <rect x="49" y="8" width="3" height="64" fill={onDark ? "#fff" : "#1D1B20"} />
            <rect x="43" y="70" width="15" height="3" fill={onDark ? "#fff" : "#1D1B20"} />
            <rect x="49" y="72" width="3" height="8" fill={onDark ? "#fff" : "#1D1B20"} />
            <polygon points="50,4 53,8 47,8" fill={onDark ? "#fff" : "#1D1B20"} />
          </g>
        </svg>
      </div>

      <span
        className="display"
        style={{
          fontFamily: "var(--cc-font-display)",
          fontSize: sizes.font,
          lineHeight: 1,
          color: onDark ? "#fff" : "var(--cc-ink)",
          letterSpacing: ".015em",
        }}
      >
        Campaign Connect
      </span>
    </div>
  );
}
