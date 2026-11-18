import React from 'react';
import { getI18n } from '../data/i18n.js';
import { meApi } from '../data/api.js';
import Avatar from '../components/atoms/Avatar.jsx';
import Button from '../components/atoms/Button.jsx';
import Icon from '../components/atoms/Icon.jsx';
import { istLeiter } from '../data/rollen.js';
import KampagneVerwaltenModal from '../components/organisms/KampagneVerwaltenModal.jsx';

/* Profil — Benutzerprofil mit Hero, Info-Cards, Stats */

const ROLLE_OPTIONEN = [
  { value: 'spieler',     label: 'Spieler' },
  { value: 'spielleiter', label: 'Spielleiter' },
  { value: 'beides',      label: 'Spieler & Spielleiter' },
];

const TIMEZONE_MAX_LENGTH = 50;

const ERFAHRUNG_OPTIONEN = [
  { value: 'anfaenger',       label: 'Anfänger' },
  { value: 'fortgeschritten', label: 'Fortgeschritten' },
  { value: 'veteran',         label: 'Veteran' },
];

export default function Profil({ tweaks }) {
  const i18n = getI18n(tweaks.lang);
  const [edit, setEdit] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const loggedInUsername = localStorage.getItem('cc_user') || '';
  const [user, setUser] = React.useState({ name: loggedInUsername, email: '', rolle: '', erfahrung: '', timezone: '' });
  const [freundeCount, setFreundeCount] = React.useState(0);
  const [gruppen, setGruppen] = React.useState([]);
  const [kampagnen, setKampagnen] = React.useState([]);
  const [verwalten, setVerwalten] = React.useState(null);

  React.useEffect(() => {
    meApi.laden()
      .then(me => setUser(u => ({ ...u, name: me.username, email: me.email, rolle: me.rolle, erfahrung: me.erfahrung || '', timezone: me.timezone })))
      .catch(() => {});
    const token = localStorage.getItem('cc_access');
    if (!token) return;
    const headers = { Authorization: 'Bearer ' + token };
    fetch('/api/freundschaften/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(items => setFreundeCount(items.length))
      .catch(() => {});
    fetch('/api/gruppen/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setGruppen)
      .catch(() => {});
    fetch('/api/kampagnen/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setKampagnen)
      .catch(() => {});
  }, []);

  const set = (k, v) => setUser(u => ({ ...u, [k]: v }));

  const toggleEdit = async () => {
    if (!edit) {
      setEdit(true);
      return;
    }
    setSaving(true);
    try {
      const me = await meApi.aktualisieren({ rolle: user.rolle, erfahrung: user.erfahrung, timezone: user.timezone });
      setUser(u => ({ ...u, rolle: me.rolle, erfahrung: me.erfahrung || '', timezone: me.timezone }));
      setEdit(false);
    } catch (e) {
      alert(e.message || 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "32px 32px 0", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom: 24 }}>
        <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: 0 }}>
          {i18n.p.title}
        </h1>
        <Button variant={edit ? "primary" : "ghost"} onClick={toggleEdit} disabled={saving}>
          {edit ? (saving ? "Speichern…" : "✓ Speichern") : i18n.p.edit}
        </Button>
      </div>

      {/* Hero */}
      <div style={{
        position:"relative",
        background:"linear-gradient(135deg, var(--cc-dark-plum), var(--cc-accent-deep))",
        borderRadius:18, padding:"32px 32px 24px",
        display:"flex", alignItems:"center", gap:24,
        color:"#fff", overflow:"hidden",
      }}>
        <div style={{
          position:"absolute", inset:0, opacity:.12,
          backgroundImage:"radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)",
          backgroundSize:"40px 40px",
        }}/>
        <Avatar name={user.name} id="profile-hero" size={120} style={{ fontSize: 42, border:"4px solid rgba(255,255,255,.2)" }}/>
        <div style={{position:"relative"}}>
          <div className="display" style={{ fontSize: 36, lineHeight:1.1 }}>{user.name}</div>
          <div style={{ marginTop: 6, opacity:.85, fontSize:14 }}>
            {user.email}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginTop:20}}>
        <Stat label="Gespielte Sessions" value="0"/>
        <Stat label="Geleitete Kampagnen" value={kampagnen.length}/>
        <Stat label="Verbundene Spieler" value={freundeCount}/>
        <Stat label="Aktive Gruppen" value={gruppen.length}/>
      </div>

      {/* Info-Grid */}
      <div style={{marginTop:20}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16}}>
          <EditableField label={i18n.p.role} value={user.rolle} edit={edit}
            options={ROLLE_OPTIONEN} onChange={v => set("rolle", v)}/>
          <EditableField label={i18n.p.exp} value={user.erfahrung} edit={edit}
            options={ERFAHRUNG_OPTIONEN} onChange={v => set("erfahrung", v)}/>
          <EditableField label="Ort und Zeitzone" value={user.timezone} edit={edit}
            maxLength={TIMEZONE_MAX_LENGTH} onChange={v => set("timezone", v)}/>
        </div>
      </div>

      {/* Gruppen & Rollen */}
      <div style={{marginTop:28, marginBottom:32}}>
        <h2 style={{fontSize:16, fontWeight:700, color:"var(--cc-text)", marginBottom:14}}>
          Deine Gruppen & Rollen
        </h2>
        {gruppen.length === 0 ? (
          <p style={{fontSize:13, color:"var(--cc-text-soft)"}}>Du bist noch in keiner Gruppe.</p>
        ) : (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:12}}>
            {gruppen.map(g => (
              <GruppenRolleCard key={g.id} gruppe={g} />
            ))}
          </div>
        )}
      </div>

      {/* Meine Kampagnen */}
      {kampagnen.length > 0 && (
        <div style={{marginTop:28, marginBottom:32}}>
          <h2 style={{fontSize:16, fontWeight:700, color:"var(--cc-text)", marginBottom:14}}>
            Meine Kampagnen
          </h2>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:12}}>
            {kampagnen.map(k => (
              <div key={k.id} style={{
                background:"var(--cc-surface)", border:"1px solid var(--cc-border-soft)",
                borderRadius:12, padding:"14px 16px",
                display:"flex", alignItems:"center", gap:12,
              }}>
                <Avatar name={k.titel} id={k.id} size={40}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:14, fontWeight:600, color:"var(--cc-text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                    {k.titel}
                  </div>
                  <div style={{fontSize:12, color:"var(--cc-text-soft)", marginTop:2}}>{k.gruppe_name}</div>
                </div>
                <button
                  onClick={() => setVerwalten(k)}
                  title="Kampagne bearbeiten"
                  style={{
                    width:34, height:32, borderRadius:8, flexShrink:0,
                    border:"1px solid var(--cc-border-soft)", background:"var(--cc-surface)",
                    color:"var(--cc-text-soft)", cursor:"pointer",
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                  }}
                >
                  <Icon name="pencil" size={15}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {verwalten && (
        <KampagneVerwaltenModal
          kampagne={verwalten}
          onClose={() => setVerwalten(null)}
          onUpdated={(k) => setKampagnen(ks => ks.map(x => x.id === k.id ? { ...x, ...k } : x))}
          onDeleted={(id) => { setKampagnen(ks => ks.filter(x => x.id !== id)); setVerwalten(null); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{
      background:"var(--cc-surface)",border:"1px solid var(--cc-border-soft)",
      borderRadius:12, padding:14,
    }}>
      <div className="display" style={{fontSize:28, color:"var(--cc-accent-deep)"}}>{value}</div>
      <div style={{fontSize:12, color:"var(--cc-text-soft)"}}>{label}</div>
    </div>
  );
}
function Card({ title, children }) {
  return (
    <div style={{
      background:"var(--cc-surface)",border:"1px solid var(--cc-border-soft)",
      borderRadius:14, padding:18,
    }}>
      <h3 style={{margin:0, marginBottom:10, fontSize:14, fontWeight:700, color:"var(--cc-accent-deep)", textTransform:"uppercase", letterSpacing:".06em"}}>{title}</h3>
      {children}
    </div>
  );
}
function GruppenRolleCard({ gruppe }) {
  const leiter = istLeiter(gruppe.rolle);
  return (
    <div style={{
      background:"var(--cc-surface)", border:"1px solid var(--cc-border-soft)",
      borderRadius:12, padding:"14px 16px",
      display:"flex", alignItems:"center", gap:12,
    }}>
      <Avatar name={gruppe.name} id={gruppe.id} size={40}/>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:14, fontWeight:600, color:"var(--cc-text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
          {gruppe.name}
        </div>
        <div style={{fontSize:12, color:"var(--cc-text-soft)", marginTop:2}}>
          {gruppe.members ?? gruppe.membersList?.length ?? 0} Mitglieder
        </div>
      </div>
      <span style={{
        padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700,
        background: leiter ? "rgba(233,160,81,.18)" : "rgba(107,114,128,.12)",
        color: leiter ? "var(--cc-accent-deep)" : "var(--cc-text-soft)",
        whiteSpace:"nowrap",
      }}>
        {leiter ? "Spielleiter" : "Spieler"}
      </span>
    </div>
  );
}

function EditableField({ label, value, edit, options, maxLength, onChange }) {
  const fieldStyle = {
    width:"100%",padding:"10px 12px",border:"1px solid var(--cc-border-soft)",
    borderRadius:6,fontSize:14,fontFamily:"inherit", background:"var(--cc-surface)",color:"var(--cc-text)",
  };
  const display = options?.find(o => o.value === value)?.label ?? value ?? "";

  return (
    <Card title={label}>
      {edit ? (
        options ? (
          <select value={value || ""} onChange={e=>onChange(e.target.value)} style={fieldStyle}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : maxLength ? (
          <input type="text" value={value || ""} maxLength={maxLength} onChange={e=>onChange(e.target.value)}
            style={fieldStyle}/>
        ) : (
          <textarea rows={5} value={value || ""} onChange={e=>onChange(e.target.value)}
            style={{...fieldStyle, resize:"vertical"}}/>
        )
      ) : (
        <p style={{margin:0, fontSize:14, lineHeight:1.6, color:"var(--cc-text-soft)"}}>{display}</p>
      )}
    </Card>
  );
}
