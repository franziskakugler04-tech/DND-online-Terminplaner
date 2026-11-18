import React from 'react';
import Avatar from '../atoms/Avatar.jsx';
import Button from '../atoms/Button.jsx';
import Icon from '../atoms/Icon.jsx';

/* TerminCard — zentraler Termin mit Avatar, Datum, Gruppe und Accept/Decline.
   Unterstützt 3 Varianten (ausgewählt via Tweaks):
   - "default"  : wie Figma, Buttons rechts als kleine Icon-Stacks
   - "compact"  : flache Zeile, Buttons inline
   - "pillboxed": dekorative Pille mit Accent-Rand
*/

const ACCEPT_GREEN = "#16a34a";
const DECLINE_RED = "#dc2626";

export default function TerminCard({ termin, variant = "default", onAccept, onDecline, onLate, onEdit, draggable, onDragStart, onDragOver, onDrop, dragging }) {
  const { date, time, group, confirmed, participants = [], spots } = termin;

  if (variant === "compact") {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`cc-termin ${dragging ? "dragging" : ""}`}
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 14,
          padding: "10px 14px",
          background: "var(--cc-surface)",
          borderRadius: 10,
          border: "1px solid var(--cc-border-soft)",
        }}
      >
        <Avatar name={group} id={termin.id} size={40} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{date} · {time}</div>
          <div style={{ fontSize: 13, color: "var(--cc-text-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{group}</div>
        </div>

      </div>
    );
  }

  if (variant === "pillboxed") {
    return (
      <div
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`cc-termin ${dragging ? "dragging" : ""}`}
        style={{
          display: "grid",
          gridTemplateColumns: "6px 40px 1fr auto",
          alignItems: "center",
          gap: 14,
          padding: "12px 14px",
          background: "var(--cc-surface)",
          borderRadius: 14,
          boxShadow: "0 2px 10px rgba(29,27,32,.06)",
          border: "1px solid var(--cc-border-soft)",
          overflow: "hidden",
        }}
      >
        <div style={{ width: 6, alignSelf: "stretch", background: "var(--cc-accent)", borderRadius: 3 }} />
        <Avatar name={group} id={termin.id} size={40} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{date}</div>
          <div style={{ fontSize: 13, color: "var(--cc-text-soft)" }}>{time} · {group}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={onAccept}
            title="Annehmen"
            style={{
              width: 34, height: 28, borderRadius: 6,
              background: "var(--cc-accent-deep)", color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          ><Icon name="check" size={14} /></button>
          <button
            onClick={onDecline}
            title="Ablehnen"
            style={{
              width: 34, height: 28, borderRadius: 6,
              background: "var(--cc-dark-plum)", color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          ><Icon name="x" size={14} /></button>
        </div>
      </div>
    );
  }

  /* default */
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`cc-termin ${dragging ? "dragging" : ""}`}
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr auto",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: "var(--cc-surface)",
        borderRadius: 10,
        border: "1px solid var(--cc-border-soft)",
        position: "relative",
      }}
    >
      {draggable && (
        <span style={{ position: "absolute", top: 6, right: 6, color: "var(--cc-text-soft)", opacity: .4 }}>
          <Icon name="grip" size={16} />
        </span>
      )}
      <Avatar name={group} id={termin.id} size={40} />
      <div style={{ minWidth: 0, opacity: confirmed === false ? 0.6 : 1 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
          <Icon name="calendar" size={14} style={{ color: "var(--cc-accent)", flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{date}</span>
          <Icon name="clock" size={14} style={{ color: "var(--cc-accent)", flexShrink: 0, marginLeft: 8 }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>{time}</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--cc-text-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{group}</div>
        {participants.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
            {participants.slice(0, 5).map((name, i) => (
              <Avatar key={i} name={name} id={i} size={22} title={name} />
            ))}
            {participants.length > 5 && (
              <span style={{ fontSize: 11, color: "var(--cc-text-soft)" }}>+{participants.length - 5}</span>
            )}
            <span style={{ fontSize: 11, color: "var(--cc-text-soft)", marginLeft: 2 }}>
              {spots ? `${spots.filled}/${spots.total}` : `${participants.length} zugesagt`}
            </span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {/* Bearbeiten (nur Spielleiter) */}
        {onEdit && termin.ist_spielleiter && (
          <button
            onClick={onEdit}
            title="Termin bearbeiten"
            style={{
              width: 33, height: 30, borderRadius: 5,
              background: "var(--cc-surface)", border: "1px solid var(--cc-border-soft)",
              color: "var(--cc-text-soft)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon name="pencil" size={15} />
          </button>
        )}
        {/* Annehmen (Haken) — grün bei Hover & wenn zugesagt */}
        <button
          onClick={onAccept}
          title="Annehmen"
          onMouseEnter={e => { e.currentTarget.style.background = ACCEPT_GREEN; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = ACCEPT_GREEN; }}
          onMouseLeave={e => {
            const on = confirmed === true;
            e.currentTarget.style.background = on ? ACCEPT_GREEN : "var(--cc-surface)";
            e.currentTarget.style.color = on ? "#fff" : "var(--cc-text-soft)";
            e.currentTarget.style.borderColor = on ? ACCEPT_GREEN : "var(--cc-border-soft)";
          }}
          style={{
            width: 33, height: 30, borderRadius: 5,
            background: confirmed === true ? ACCEPT_GREEN : "var(--cc-surface)",
            border: `1px solid ${confirmed === true ? ACCEPT_GREEN : "var(--cc-border-soft)"}`,
            color: confirmed === true ? "#fff" : "var(--cc-text-soft)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "background .15s, color .15s, border-color .15s", cursor: "pointer",
          }}
        >
          <Icon name="check" size={16} />
        </button>
        {/* Absagen (X) — rot bei Hover & wenn abgesagt */}
        <button
          onClick={onDecline}
          title="Absagen"
          onMouseEnter={e => { e.currentTarget.style.background = DECLINE_RED; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = DECLINE_RED; }}
          onMouseLeave={e => {
            const off = confirmed === false;
            e.currentTarget.style.background = off ? DECLINE_RED : "var(--cc-surface)";
            e.currentTarget.style.color = off ? "#fff" : "var(--cc-text-soft)";
            e.currentTarget.style.borderColor = off ? DECLINE_RED : "var(--cc-border-soft)";
          }}
          style={{
            width: 33, height: 30, borderRadius: 5,
            background: confirmed === false ? DECLINE_RED : "var(--cc-surface)",
            border: `1px solid ${confirmed === false ? DECLINE_RED : "var(--cc-border-soft)"}`,
            color: confirmed === false ? "#fff" : "var(--cc-text-soft)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "background .15s, color .15s, border-color .15s", cursor: "pointer",
          }}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  );
}
