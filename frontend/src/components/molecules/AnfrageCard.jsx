import React from 'react';
import Avatar from '../atoms/Avatar.jsx';

/* AnfrageCard — Freundschafts-/Gruppenanfrage mit Accept/Decline.
   Passt zum Figma-Stil: 172×168, Avatar zentriert, 2 gestapelte Buttons. */

export default function AnfrageCard({ anfrage, onAccept, onDecline }) {
  const isFriend = anfrage.type === "friend";

  return (
    <div
      className="cc-anfrage slide-up"
      style={{
        width: 172,
        minHeight: 168,
        padding: "14px 6px",
        background: "var(--cc-surface)",
        border: "1px solid var(--cc-border)",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        textAlign: "center",
      }}
    >
      <Avatar name={anfrage.from} id={anfrage.id} size={40} />
      <div style={{ fontSize: 15, fontWeight: 500, marginTop: 6 }}>
        {isFriend ? "Freundschaftsanfrage" : "Gruppeneinladung"}
      </div>
      <div style={{ fontSize: 13, color: "var(--cc-text-soft)" }}>
        {isFriend ? "von " : "in "}{anfrage.from}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", padding: "0 6px", marginTop: "auto" }}>
        <button
          onClick={() => onAccept && onAccept(anfrage.id)}
          style={{
            background: "var(--cc-accent)",
            color: "var(--cc-ink)",
            height: 26,
            borderRadius: 5,
            fontWeight: 500,
            fontSize: 14,
          }}
        >Annehmen</button>
        <button
          onClick={() => onDecline && onDecline(anfrage.id)}
          style={{
            background: "var(--cc-dark-night)",
            color: "var(--cc-accent)",
            height: 26,
            borderRadius: 5,
            fontWeight: 500,
            fontSize: 14,
          }}
        >Ablehnen</button>
      </div>
    </div>
  );
}
