import React from 'react';

/* Avatar — Monogramm (Initialen) ODER farbiger Disc mit Nummer,
   um die 3D-Avatars aus Figma zu ersetzen. Farbvariation per Hash. */

const AV_PALETTE = [
  "#E9A051","#B45127","#6750A4","#8B5CF6","#10B981",
  "#F43F5E","#06B6D4","#F59E0B","#EC4899","#0EA5E9",
];

function hashStr(s = "") {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({ name = "?", size = 40, id, className = "", style = {}, title }) {
  const seed = id != null ? String(id) : name;
  const color = AV_PALETTE[hashStr(seed) % AV_PALETTE.length];
  const initials = (name || "")
    .split(/\s|_/)
    .filter(Boolean)
    .map(s => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "•";

  return (
    <div
      className={`cc-avatar ${className}`}
      title={title || name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: Math.max(10, Math.round(size * 0.38)),
        letterSpacing: ".02em",
        flexShrink: 0,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.15)",
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
