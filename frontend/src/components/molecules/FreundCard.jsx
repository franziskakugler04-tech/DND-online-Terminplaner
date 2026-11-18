import React from 'react';
import Avatar from '../atoms/Avatar.jsx';

/* FreundCard — kleine Freund-Kachel */
export default function FreundCard({ f, onOpen }) {
  return (
    <div
      onClick={onOpen}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: "10px 8px",
        background: "var(--cc-surface)",
        border: "1px solid var(--cc-border-soft)",
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "center",
      }}
    >
      <Avatar name={f.name} id={f.avatarId || f.id} size={46}/>
      <div style={{ fontSize: 12, width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {f.name}
      </div>
    </div>
  );
}
