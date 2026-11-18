import React from 'react';
import { getI18n } from '../data/i18n.js';
import Button from '../components/atoms/Button.jsx';
import Icon from '../components/atoms/Icon.jsx';

/* Neuer Termin — Wizard-Form für eine neue Kampagnen-Session.
   Layout: Step-Header oben, Form-Card mittig, Vorschau rechts. */

//   THIS IS THE NEW CAMPAIGN TAB

export default function NeuerTermin({ tweaks, onNavigate }) {
  const i18n = getI18n(tweaks.lang);
  const [gruppen, setGruppen] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/gruppen/', { headers: { Authorization: 'Bearer ' + localStorage.getItem('cc_access') } })
      .then(r => r.ok ? r.json() : [])
      .then(setGruppen)
      .catch(() => {});
  }, []);

  const [form, setForm] = React.useState(() => {
    // Standard: heutiges Datum, Startzeit = jetzt + 2 Stunden
    const jetzt = new Date();
    const tag    = String(jetzt.getDate()).padStart(2, "0");
    const monat  = String(jetzt.getMonth() + 1).padStart(2, "0");
    const jahr   = jetzt.getFullYear();
    const minute = String(jetzt.getMinutes()).padStart(2, "0");
    const startH = String((jetzt.getHours() + 2) % 24).padStart(2, "0");
    const endH   = String((jetzt.getHours() + 4) % 24).padStart(2, "0");
    return {
      gruppenname: "",
      kampagnename: "",
      sprache: "de",
      datum: `${tag}.${monat}.${jahr}`,
      von: `${startH}:${minute}`,
      bis: `${endH}:${minute}`,
      kampagnengroesse: "1-3",
      modus: "vor-ort",
      ort: "",
      max_spieler: 5,
      private: false,
      nur_mit_dm: false,
      warteliste: false,
      beschreibung: "",
      sonstiges: "",
    };
  });
  const [created, setCreated] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/kampagnen/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('cc_access'),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(JSON.stringify(err));
        return;
      }
      setCreated(true);
      setTimeout(() => onNavigate && onNavigate("community"), 1400);
    } catch {
      setError('Netzwerkfehler – Backend erreichbar?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "32px 32px 0", maxWidth: 1440, margin: "0 auto" }}>
      <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: "0 0 32px 0" }}>
        Neue Kampagne anlegen
      </h1>

      <form onSubmit={submit} style={{
        background: "var(--cc-surface)", border: "1px solid var(--cc-border-soft)",
        borderRadius: 14, padding: 32,
        maxWidth: 900,
        display: "flex", flexDirection: "column", gap: 24,
      }}>
        {/* Erste Reihe: Gruppennamen, Kampagnennamen, Sprache */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px", gap: 12 }}>
          <div>
            <Field label="Gruppennamen">
              <input style={inp()} list="gruppen-list" placeholder="Neue Gruppe oder wählen" value={form.gruppenname} onChange={e => set("gruppenname", e.target.value)} />
              <datalist id="gruppen-list">
                {gruppen.map(g => <option key={g.id} value={g.name} />)}
              </datalist>
            </Field>
          </div>
          <Field label="Kampagnennamen">
            <input style={inp()} placeholder="z.B. Fluch des Strahd" value={form.kampagnename} onChange={e => set("kampagnename", e.target.value)} required />
          </Field>
          <Field label="Sprache">
            <select style={{ ...inp(), cursor: "pointer" }} value={form.sprache} onChange={e => set("sprache", e.target.value)}>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="it">Italiano</option>
              <option value="pt">български</option>
            </select>
          </Field>
        </div>

        {/* Datum und Zeiten */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Datum für den ersten Termin:</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 80px)", gap: 12 }}>
            <Field label="DD">
              <input type="number" min="1" max="31" style={inp()} placeholder="17" value={form.datum.split(".")[0] || ""}
                onChange={e => { const [d, m, y] = form.datum.split("."); set("datum", `${e.target.value}.${m || ""}.${y || ""}`) }} />
            </Field>
            <Field label="MM">
              <input type="number" min="1" max="12" style={inp()} placeholder="01" value={form.datum.split(".")[1] || ""}
                onChange={e => { const [d, m, y] = form.datum.split("."); set("datum", `${d || ""}.${e.target.value}.${y || ""}`) }} />
            </Field>
            <Field label="YYYY">
              <input type="number" min="2020" max="2099" style={inp()} placeholder="2026" value={form.datum.split(".")[2] || ""}
                onChange={e => { const [d, m, y] = form.datum.split("."); set("datum", `${d || ""}.${m || ""}.${e.target.value}`) }} />
            </Field>
          </div>
        </div>

        {/* Startzeit und Endzeit */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Startzeit:</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="HH">
                <input type="number" min="0" max="23" style={inp()} placeholder="16" value={form.von.split(":")[0]}
                  onChange={e => set("von", `${e.target.value.padStart(2, "0")}:${form.von.split(":")[1]}`)} />
              </Field>
              <Field label="MM">
                <input type="number" min="0" max="59" style={inp()} placeholder="00" value={form.von.split(":")[1]}
                  onChange={e => set("von", `${form.von.split(":")[0]}:${e.target.value.padStart(2, "0")}`)} />
              </Field>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Endzeit:</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="HH">
                <input type="number" min="0" max="23" style={inp()} placeholder="22" value={form.bis.split(":")[0]}
                  onChange={e => set("bis", `${e.target.value.padStart(2, "0")}:${form.bis.split(":")[1]}`)} />
              </Field>
              <Field label="MM">
                <input type="number" min="0" max="59" style={inp()} placeholder="00" value={form.bis.split(":")[1]}
                  onChange={e => set("bis", `${form.bis.split(":")[0]}:${e.target.value.padStart(2, "0")}`)} />
              </Field>
            </div>
          </div>
        </div>

        {/* Kampagnenmodell */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>Kampagnenmodell festlegen:</h3>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { id: "vor-ort", label: "Vor Ort" },
              { id: "hybrid", label: "Hybrid" },
              { id: "online", label: "Online" }
            ].map(m => (
              <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="radio" name="modus" value={m.id} checked={form.modus === m.id}
                  onChange={e => set("modus", e.target.value)} style={{ cursor: "pointer", width: 18, height: 18 }} />
                <span style={{ fontSize: 14 }}>{m.label}</span>
              </label>
            ))}
          </div>
          {form.modus !== "online" && (
            <div style={{ marginTop: 12 }}>
              <Field label="Ort">
                <input style={inp()} placeholder="Adresse eingeben" value={form.ort}
                  onChange={e => set("ort", e.target.value)} />
              </Field>
            </div>
          )}
        </div>

        {/* Max Spieler und Kampagnengröße */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={`Max. Spieleranzahl: ${form.max_spieler}`}>
            <input type="range" min={1} max={10} value={form.max_spieler}
              onChange={e => set("max_spieler", +e.target.value)}
              style={{ width: "100%", accentColor: "var(--cc-accent)" }} />
          </Field>
          <Field label="Kampagnengröße">
            <select style={{ ...inp(), cursor: "pointer" }} value={form.kampagnengroesse} onChange={e => set("kampagnengroesse", e.target.value)}>
              <option value="1-3">ca. 1-3 Sessions</option>
              <option value="4-6">ca. 4-6 Sessions</option>
              <option value="7-10">ca. 7-10 Sessions</option>
              <option value="10-15">ca. 10-15 Sessions</option>
              <option value="16-25">ca. 16-25 Sessions</option>
              <option value="25plus">ca. 25+ Sessions</option>
            </select>
          </Field>
        </div>

        {/* Checkboxes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.private} onChange={e => set("private", e.target.checked)}
              style={{ cursor: "pointer", width: 18, height: 18 }} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Private Kampagne</span>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--cc-text-soft)" }}>der nur Freunde beitreten können</p>
            </div>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.warteliste} onChange={e => set("warteliste", e.target.checked)}
              style={{ cursor: "pointer", width: 18, height: 18 }} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Warteliste aktiviert</span>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--cc-text-soft)" }}>wenn es viele Interessierte gibt — in Entwicklung</p>
            </div>
          </label>
        </div>

        {/* Beschreibung */}
        <Field label="Beschreibung der Kampagne">
          <textarea rows={4} style={{ ...inp(), resize: "vertical", lineHeight: 1.5 }}
            placeholder="Beschreibe hier deine Infos zum Termin"
            value={form.beschreibung} onChange={e => set("beschreibung", e.target.value)} />
        </Field>

        {/* Sonstiges */}
        <Field label="Weitere Informationen oder besondere Wünsche">
          <textarea rows={2} style={{ ...inp(), resize: "vertical", lineHeight: 1.5 }}
            placeholder="Weitere Informationen oder besondere Wünsche..."
            value={form.sonstiges} onChange={e => set("sonstiges", e.target.value)} />
        </Field>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(220,50,50,.1)', color: '#c0392b', fontSize: 13 }}>
            {error}
          </div>
        )}
        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <Button variant="primary" onClick={() => onNavigate && onNavigate("community")}>
            Abbrechen
          </Button>
          <Button type="submit" variant="dark" leading={<Icon name="check" size={16} />} disabled={submitting || created}>
            {created ? "✓ Erstellt!" : submitting ? "Wird gespeichert…" : "Kampagne jetzt erstellen"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function inp() {
  return {
    width: "100%", padding: "10px 12px", border: "1px solid var(--cc-border-soft)", borderRadius: 6,
    fontSize: 14, fontFamily: "inherit", background: "var(--cc-surface)", color: "var(--cc-text)",
  };
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</span>
      {children}
    </label>
  );
}
