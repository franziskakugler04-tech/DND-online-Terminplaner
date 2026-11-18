import React from 'react';
import Avatar from '../atoms/Avatar.jsx';
import Icon from '../atoms/Icon.jsx';
import { istLeiter } from '../../data/rollen.js';

/* GruppenCard — kleine Gruppe-Kachel */
export default function GruppenCard({ g, onOpen }) {
  const leiter = istLeiter(g.rolle);
  return (
    <div
      onClick={onOpen}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px",
        background: "var(--cc-surface)",
        border: "1px solid var(--cc-border-soft)",
        borderRadius: 10,
        cursor: "pointer",
        minWidth: 0,
      }}
    >
      <Avatar name={g.name} id={g.id} size={32}/>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</div>
        <div style={{ fontSize: 12, color: "var(--cc-text-soft)" }}>{g.members} Mitglieder</div>
      </div>
      {g.rolle && (
        <span style={{
          padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
          background: leiter ? "rgba(233,160,81,.18)" : "rgba(107,114,128,.1)",
          color: leiter ? "var(--cc-accent-deep)" : "var(--cc-text-soft)",
        }}>
          {leiter ? 'Spielleiter' : 'Spieler'}
        </span>
      )}
      <Icon name="arrowRight" size={14}/>
    </div>
  );
}
