import React from 'react';
import { getI18n } from '../data/i18n.js';
import Avatar from '../components/atoms/Avatar.jsx';
import Button from '../components/atoms/Button.jsx';
import Icon from '../components/atoms/Icon.jsx';
import Sidebar from '../components/organisms/Sidebar.jsx';

/* Community — Gruppen-/Kampagnen-Suche.
   Layout: Sidebar (Filter) + Grid mit Ausschreibungs-Karten + Header mit Sort/Lang */

export default function Community({ tweaks, onNavigate }) {
  const i18n = getI18n(tweaks.lang);

  const [filters, setFilters] = React.useState({ role: null, mode: null });
  const [items, setItems] = React.useState([]);
  const [joined, setJoined] = React.useState({});
  const [fehler, setFehler] = React.useState({});

  React.useEffect(() => {
    fetch('/api/community/', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('cc_access') },
    })
      .then(r => r.ok ? r.json() : [])
      .then(setItems)
      .catch(() => {});
  }, []);

  const join = (id) => {
    if (joined[id]) return;
    fetch(`/api/kampagnen/${id}/anfragen/`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('cc_access') },
    })
      .then(async r => {
        if (r.ok) {
          setJoined(j => ({ ...j, [id]: true }));
          setFehler(f => ({ ...f, [id]: null }));
        } else {
          const data = await r.json().catch(() => ({}));
          setFehler(f => ({ ...f, [id]: data.error || 'Anfrage fehlgeschlagen.' }));
        }
      })
      .catch(() => setFehler(f => ({ ...f, [id]: 'Netzwerkfehler.' })));
  };

  return (
    <div style={{ padding: "32px 32px 0", maxWidth: 1440, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
        <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: 0 }}>
          {i18n.c.title}
        </h1>
        <Button variant="primary" leading={<Icon name="plus" size={16} />}
          onClick={() => onNavigate && onNavigate("neueKampagne")}>
          {i18n.c.startNew}
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "start" }}>
        <Sidebar filters={filters} setFilters={setFilters} />

        <div>
          {/* Sort/lang bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px", marginBottom: 16,
            background: "var(--cc-surface)", border: "1px solid var(--cc-border-soft)", borderRadius: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--cc-text-soft)" }}>
              <Icon name="search" size={14} />
              {items.length} {tweaks.lang === "de" ? "Kampagnen" : "campaigns"}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--cc-text-soft)" }}>{i18n.c.lang}</span>
              <select style={{
                padding: "4px 8px", borderRadius: 5, border: "1px solid var(--cc-border-soft)",
                fontSize: 13, background: "var(--cc-surface)", color: "var(--cc-text)", fontFamily: "inherit",
              }}>
                <option>{i18n.c.all}</option>
                <option>Deutsch</option>
                <option>English</option>
              </select>
            </div>
          </div>

          {/* Card grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 18,
          }}>
            {items.map(a => (
              <AusschreibungCard key={a.id} a={a} joined={!!joined[a.id]} fehler={fehler[a.id]} onJoin={() => join(a.id)} i18n={i18n} rpg={tweaks.rpg} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AusschreibungCard({ a, joined, fehler, onJoin, i18n, rpg }) {
  return (
    <article
      className="cc-aussch slide-up"
      style={{
        background: "var(--cc-surface)",
        border: "1px solid var(--cc-border-soft)",
        borderRadius: 14,
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "var(--cc-shadow-card)",
      }}
    >
      {/* Cover */}
      <div style={{
        height: 120, position: "relative",
        background: `linear-gradient(135deg, var(--cc-accent-deep), var(--cc-dark-plum))`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {rpg === "on" ? (
          <Icon name="dice" size={48} style={{ color: "var(--cc-accent)", opacity: .85 }} />
        ) : (
          <Icon name="users" size={42} style={{ color: "var(--cc-accent)", opacity: .85 }} />
        )}
        <span style={{
          position: "absolute", top: 10, right: 10,
          padding: "3px 8px", borderRadius: 99,
          background: "rgba(0,0,0,.4)", color: "#fff",
          fontSize: 11, fontWeight: 600, letterSpacing: ".05em",
          backdropFilter: "blur(6px)",
        }}>
          {a.plaetze.full}/{a.plaetze.total} • {a.sessions} {i18n.c.session}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--cc-text)" }}>{a.title}</h3>
        <p style={{
          margin: 0, fontSize: 13, color: "var(--cc-text-soft)", lineHeight: 1.45,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
        }}>
          {a.desc}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          <Tag><Icon name="calendar" size={12} /> {a.date}</Tag>
          <Tag><Icon name="clock" size={12} /> {a.time}</Tag>
          <Tag><Icon name="pin" size={12} /> {a.ort}</Tag>
        </div>

        {/* Host + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto", paddingTop: 12 }}>
          <Avatar name={a.host} id={a.id} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {a.host}
            </div>
            <div style={{ fontSize: 11, color: "var(--cc-accent)", fontWeight: 600 }}>{a.hostTag}</div>
          </div>
          <Button
            size="sm"
            variant={joined ? "ghost" : "primary"}
            onClick={onJoin}
          >
            {joined ? "✓ Angefragt" : i18n.c.join}
          </Button>
        </div>
        {fehler && (
          <div style={{ fontSize: 12, color: '#b91c1c', padding: '6px 16px 10px' }}>{fehler}</div>
        )}
      </div>
    </article>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 99,
      background: "rgba(233,160,81,.12)",
      color: "var(--cc-accent-deep)",
      fontSize: 11, fontWeight: 500,
    }}>{children}</span>
  );
}
