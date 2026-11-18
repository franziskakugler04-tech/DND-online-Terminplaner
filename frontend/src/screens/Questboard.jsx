import welcomeImg from '../assets/welcome.png';
import React from 'react';
import { freundeApi, icalApi } from '../data/api.js';
import { getI18n } from '../data/i18n.js';
import Avatar from '../components/atoms/Avatar.jsx';
import Button from '../components/atoms/Button.jsx';
import Icon from '../components/atoms/Icon.jsx';
import TerminCard from '../components/molecules/TerminCard.jsx';
import AnfrageCard from '../components/molecules/AnfrageCard.jsx';
import PollCard from '../components/molecules/PollCard.jsx';
import Calendar from '../components/molecules/Calendar.jsx';
import FreundCard from '../components/molecules/FreundCard.jsx';
import GruppenCard from '../components/molecules/GruppenCard.jsx';
import TerminBearbeitenModal from '../components/organisms/TerminBearbeitenModal.jsx';

/* Startseite — Questboard.
   Layout (1440 wide, fluid):
   - Hero: Titel + Welcome-Bild + CTA
   - Grid:
       Spalte 1: Anfragen + Chats
       Spalte 2: Kalender + Anstehende Termine
       Spalte 3: Umfrage + neuer Termin/CTA
   - Sektion: Deine Freunde (horizontaler Scroll)
   - Sektion: Deine Gruppen
   - Sektion: Vergangene Sessions  */

/* Status-Farben für die Mitglieder-Liste eines Termins. */
const TEILNAHME_FARBEN = {
  zugesagt:      { bg: "rgba(22,163,74,.15)",  text: "#15803d", dot: "#16a34a" },
  ausstehend:    { bg: "var(--cc-border-soft)", text: "var(--cc-text-soft)", dot: "#9ca3af" },
  kommt_spaeter: { bg: "rgba(233,160,81,.18)", text: "var(--cc-accent-deep)", dot: "var(--cc-accent-deep)" },
  abgesagt:      { bg: "rgba(220,38,38,.12)",  text: "#b91c1c", dot: "#dc2626" },
};

export default function Questboard({ tweaks, onNavigate, upcoming, setUpcoming, poll, user, onPollUpdate, onPollFinalize }) {
  const i18n = getI18n(tweaks.lang);

  React.useEffect(() => {
    const token = localStorage.getItem('cc_access');
    if (!token) return;
    fetch('/api/termine/', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : [])
      .then(setUpcoming)
      .catch(() => {});
  }, []);

  const [anfragen, setAnfragen] = React.useState([]);
  const [freunde, setFreunde] = React.useState([]);
  const [invites, setInvites] = React.useState([]);
  const [gruppen, setGruppen] = React.useState([]);
  const [past, setPast] = React.useState([]);
  const [bearbeitenTermin, setBearbeitenTermin] = React.useState(null);
  const [umfragen, setUmfragen] = React.useState([]);

  const ladeUmfragen = React.useCallback(() => {
    const token = localStorage.getItem('cc_access');
    if (!token) return;
    const headers = { Authorization: 'Bearer ' + token };
    fetch('/api/umfragen/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setUmfragen)
      .catch(() => {});
    fetch('/api/einladungen/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setInvites)
      .catch(() => {});
  }, []);

  React.useEffect(() => { ladeUmfragen(); }, [ladeUmfragen]);

  const umfrageAbstimmen = (umfrageId, optionId) => {
    fetch(`/api/umfragen/${umfrageId}/abstimmen/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('cc_access') },
      body: JSON.stringify({ option_id: optionId }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(aktualisiert => { if (aktualisiert) setUmfragen(us => us.map(u => u.id === aktualisiert.id ? aktualisiert : u)); })
      .catch(() => {});
  };

  const umfrageFinalisieren = (umfrageId) => {
    fetch(`/api/umfragen/${umfrageId}/finalisieren/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('cc_access') },
      body: JSON.stringify({}),
    })
      .then(r => {
        if (!r.ok) return;
        setUmfragen(us => us.filter(u => u.id !== umfrageId));
        // neue Session in die Terminliste laden
        const token = localStorage.getItem('cc_access');
        fetch('/api/termine/', { headers: { Authorization: 'Bearer ' + token } })
          .then(r => r.ok ? r.json() : []).then(setUpcoming).catch(() => {});
      })
      .catch(() => {});
  };

  /* Freundschaftsanfragen + Freundesliste vom Backend laden. */
  React.useEffect(() => {
    freundeApi.anfragen().then(setAnfragen).catch(() => {});
    const token = localStorage.getItem('cc_access');
    if (!token) return;

    let cancelled = false;
    freundeApi.liste()
      .then((items) => {
        if (cancelled) return;
        setFreunde(
          items.map((item) => ({
            id: item.id,
            name: item.spieler.username,
            avatarId: item.spieler.avatarId,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setFreunde([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('cc_access');
    if (!token) return;
    const headers = { Authorization: 'Bearer ' + token };
    fetch('/api/gruppen/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setGruppen)
      .catch(() => {});
    fetch('/api/termine/vergangen/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setPast)
      .catch(() => {});
  }, []);
  const [draggedId, setDraggedId] = React.useState(null);
  const [selectedTermin, setSelectedTermin] = React.useState(null);
  const [calendarView, setCalendarView] = React.useState('month'); // 'month' | 'week'
  const [icalModal, setIcalModal] = React.useState(false);
  const [icalUrl, setIcalUrl] = React.useState(null);
  const [icalCopied, setIcalCopied] = React.useState(false);
  const [icalError, setIcalError] = React.useState(null);
  const upcomingBoxHeight = 520;

  const handlePollVote = (optionId) => {
    if (!poll || !user || !onPollUpdate) return;
    const alreadyVoted = poll.options.some(opt => opt.voters?.includes(user));
    if (alreadyVoted) return;
    const next = {
      ...poll,
      options: poll.options.map(opt => {
        if (opt.id !== optionId) return opt;
        return {
          ...opt,
          votes: (opt.votes || 0) + 1,
          voters: [...(opt.voters || []), user],
        };
      }),
    };
    onPollUpdate(next);
  };

  const handlePollFinalize = () => {
    if (!poll || poll.createdBy !== user || !onPollFinalize) return;
    const winningOption = [...poll.options].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];
    if (!winningOption) return;
    const participants = Array.from(new Set([...(winningOption.voters || []), poll.createdBy]));
    const session = {
      id: `session-${Date.now()}`,
      date: winningOption.datum || winningOption.label.split(' _ ')[0],
      time: `${winningOption.von || ''}${winningOption.bis ? `–${winningOption.bis}` : ''}`,
      group: poll.group,
      description: poll.title,
      participants,
      spots: { filled: participants.length, total: poll.groupMembers?.length || participants.length },
      confirmed: true,
    };
    onPollFinalize(session);
  };

  const openIcalModal = async () => {
    setIcalError(null);
    if (!icalUrl) {
      try {
        const data = await icalApi.getToken();
        const base = window.location.origin;
        setIcalUrl(`${base}/api/ical/${data.ical_token}/`);
      } catch (e) {
        setIcalError('Feed konnte nicht geladen werden. Bist du eingeloggt?');
        setIcalModal(true);
        return;
      }
    }
    setIcalModal(true);
    setIcalCopied(false);
  };

  const copyIcalUrl = () => {
    if (!icalUrl) return;
    navigator.clipboard.writeText(icalUrl.replace(/^https?:/, 'webcal:')).then(() => {
      setIcalCopied(true);
      setTimeout(() => setIcalCopied(false), 2000);
    });
  };

  const setzeTeilnahme = (id, aktion) => {
    fetch(`/api/termine/${id}/teilnahme/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('cc_access') },
      body: JSON.stringify({ aktion }),
    })
      .then(r => {
        if (!r.ok) return;
        // Terminliste neu laden und offenes Detail-Modal aktualisieren
        fetch('/api/termine/', { headers: { Authorization: 'Bearer ' + localStorage.getItem('cc_access') } })
          .then(r => r.ok ? r.json() : [])
          .then(list => {
            setUpcoming(list);
            setSelectedTermin(sel => sel ? (list.find(t => t.id === sel.id) || null) : sel);
          })
          .catch(() => {});
      })
      .catch(() => {});
  };
  const accept = (id) => setzeTeilnahme(id, 'zusagen');
  const decline = (id) => setzeTeilnahme(id, 'absagen');
  const late = (id) => setzeTeilnahme(id, 'kommt_spaeter');

  const annehmenAnfrage = async (id) => {
    try {
      await freundeApi.annehmen(id);
      setAnfragen(a => a.filter(x => x.id !== id));
      const neueListe = await freundeApi.liste();
      setFreunde(neueListe);
    } catch (e) { console.error(e); }
  };

  const ablehnenAnfrage = async (id) => {
    try {
      await freundeApi.loeschen(id);
      setAnfragen(a => a.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
  };

  const respondInvite = (inviteId, accepted) => {
    fetch(`/api/termine/${inviteId}/teilnahme/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('cc_access') },
      body: JSON.stringify({ aktion: accepted ? 'zusagen' : 'absagen' }),
    })
      .then(r => {
        if (!r.ok) return;
        // Einladung aus der Liste nehmen und die Terminliste neu laden
        setInvites(current => current.filter(inv => inv.id !== inviteId));
        const token = localStorage.getItem('cc_access');
        fetch('/api/termine/', { headers: { Authorization: 'Bearer ' + token } })
          .then(r => r.ok ? r.json() : []).then(setUpcoming).catch(() => {});
      })
      .catch(() => {});
  };

  /* Drag & Drop within upcoming list */
  const onDragStart = (id) => setDraggedId(id);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (overId) => {
    if (!draggedId || draggedId === overId) return;
    setUpcoming(u => {
      const arr = [...u];
      const fromIdx = arr.findIndex(t => t.id === draggedId);
      const toIdx = arr.findIndex(t => t.id === overId);
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
    setDraggedId(null);
  };

  /* Modal handler */
  React.useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setSelectedTermin(null);
    if (selectedTermin) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [selectedTermin]);

  /* Build calendar availability from upcoming */
  const calendarAvailability = React.useMemo(() => {
    const availability = {};
    upcoming.forEach(t => {
      const dateStr = t && t.date; // Format: "17.08.2026"
      if (!dateStr) return;
      const [day, month, year] = dateStr.split(".");
      if (!year || !month || !day) return;
      const key = `${year}-${month}-${day}`;
      availability[key] = 1; // Mark as having a termin
    });
    return availability;
  }, [upcoming]);

  /* Handle calendar day click */
  const handleCalendarClick = (dateKey, day) => {
    const [year, month, dayNum] = dateKey.split("-");
    const searchDate = `${dayNum}.${month}.${year}`;
    const termin = upcoming.find(t => t.date === searchDate);
    if (termin) setSelectedTermin(termin);
  };

  return (
    <div style={{ padding: "32px 32px 0", maxWidth: 1440, margin: "0 auto" }}>

      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <div>
          <h1 className="display" style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            margin: 0,
            color: "var(--cc-text)",
            letterSpacing: ".02em",
          }}>
            {i18n.q.title}
          </h1>
          <p style={{ marginTop: 8, color: "var(--cc-text-soft)", maxWidth: 540 }}>
            {i18n.b.heroes} {tweaks.rpg === "on" && "🎲 "}{i18n.b.roll}
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(280px, 1fr) minmax(360px, 1.4fr) minmax(280px, 1fr)",
        gap: 24,
        alignItems: "start",
      }}>
        {/* Col 1 — Chats + Anfragen */}
        <div style={col()}>
          <Section title={i18n.q.chats} count={0}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Empty>Noch keine Chats</Empty>
            </div>
          </Section>

          <Section title={i18n.q.openRequests} count={anfragen.length}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {anfragen.length === 0 && <Empty>Alle Anfragen erledigt 🎉</Empty>}
              {anfragen.map(a =>
                <AnfrageCard
                  key={a.id}
                  anfrage={{ id: a.id, type: 'friend', from: a.initiator.username }}
                  onAccept={annehmenAnfrage}
                  onDecline={ablehnenAnfrage}
                />
              )}
            </div>
          </Section>
        </div>

        {/* Col 2 — Kalender + Aktive Umfrage */}
        <div style={col()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--cc-text)", margin: 0 }}>Kalender · Verfügbarkeit</h3>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => setCalendarView('month')}
                style={{
                  padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 500,
                  border: calendarView === 'month' ? "2px solid var(--cc-accent)" : "1px solid var(--cc-border-soft)",
                  background: calendarView === 'month' ? "rgba(233,160,81,.1)" : "transparent",
                  color: "var(--cc-text)", cursor: "pointer",
                }}
              >
                Monat
              </button>
              <button
                onClick={() => setCalendarView('week')}
                style={{
                  padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 500,
                  border: calendarView === 'week' ? "2px solid var(--cc-accent)" : "1px solid var(--cc-border-soft)",
                  background: calendarView === 'week' ? "rgba(233,160,81,.1)" : "transparent",
                  color: "var(--cc-text)", cursor: "pointer",
                }}
              >
                Woche
              </button>
              <button
                onClick={openIcalModal}
                title="Mit privatem Kalender synchronisieren"
                style={{
                  padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                  border: "1px solid var(--cc-accent)",
                  background: "rgba(233,160,81,.15)",
                  color: "var(--cc-accent)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <Icon name="calendar" size={13} /> Sync
              </button>
            </div>
          </div>
          <div style={{
            background: "var(--cc-surface)", border: "1px solid var(--cc-border-soft)",
            borderRadius: 14, padding: 16, marginBottom: 16,
            minHeight: upcomingBoxHeight,
          }}>
            <Calendar
              year={new Date().getFullYear()}
              month={new Date().getMonth()}
              availability={calendarAvailability}
              onDayClick={handleCalendarClick}
              selectedDay={selectedTermin ? `${selectedTermin.date.split(".")[2]}-${selectedTermin.date.split(".")[1]}-${selectedTermin.date.split(".")[0]}` : undefined}
              view={calendarView}
            />
          </div>

          {(poll || umfragen.length > 0 || invites.length > 0) && (
            <Section title="Aktive Umfrage">
              <div style={{ display: "grid", gap: 12 }}>
                {invites.map(invite => (
                  <InvitationCard key={invite.id} invite={invite} onRespond={respondInvite} />
                ))}
                {umfragen.map(u => (
                  <PollCard
                    key={u.id}
                    poll={u}
                    currentUser={user}
                    onVote={(optionId) => umfrageAbstimmen(u.id, optionId)}
                    onFinalize={() => umfrageFinalisieren(u.id)}
                  />
                ))}
                {poll && <PollCard poll={poll} currentUser={user} onVote={handlePollVote} onFinalize={handlePollFinalize} />}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  padding: 16,
                  borderRadius: 14,
                  background: "var(--cc-surface)",
                  border: "1px solid var(--cc-border-soft)",
                  boxShadow: "var(--cc-shadow-card)",
                }}>
                  <img
                    src={welcomeImg}
                    alt="Natty"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      borderRadius: 16,
                    }}
                  />
                  <p style={{ margin: 0, fontSize: 15, color: "var(--cc-text)", lineHeight: 1.5, fontWeight: 500, textAlign: "center" }}>
                    Hi, ich bin Natty!
                  </p>
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Col 3 — Anstehende Termine + CTAs */}
        <div style={col()}>
          <Section title={i18n.q.upcoming} count={upcoming.length}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: upcomingBoxHeight, overflowY: "auto", paddingRight: 4 }}>
              {upcoming.map((t) => {
                // Support both session objects and poll entries
                if (t && t.type === 'poll') {
                  const key = t.id || t.poll?.id || `poll-${Math.random().toString(36).slice(2,6)}`;
                  return (
                    <div key={key} style={{ cursor: 'default' }}>
                      <PollCard poll={t.poll} />
                    </div>
                  );
                }
                // session / termin
                return (
                  <div
                    key={t.id}
                    onClick={(e) => {
                      if (e.target.closest("button")) return;
                      if (e.target.closest("svg")) return;
                      setSelectedTermin(t);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <TerminCard
                      termin={t}
                      variant={tweaks.cardVariant}
                      draggable
                      onAccept={() => accept(t.id)}
                      onDecline={() => decline(t.id)}
                      onLate={() => late(t.id)}
                      onEdit={() => setBearbeitenTermin(t)}
                      onDragStart={() => onDragStart(t.id)}
                      onDragOver={onDragOver}
                      onDrop={() => onDrop(t.id)}
                      dragging={draggedId === t.id}
                    />
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Schnellaktionen">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Button variant="primary" leading={<Icon name="plus" size={16} />} onClick={() => onNavigate && onNavigate('freunde')}>{i18n.q.newFriend}</Button>
              <Button variant="dark" leading={<Icon name="plus" size={16} />} onClick={() => onNavigate && onNavigate('neueKampagne')}>Neue Kampagne</Button>
              <Button variant="ghost" leading={<Icon name="calendar" size={16} />} onClick={() => onNavigate && onNavigate('neuerTermin')}>Neuer Termin</Button>
            </div>
          </Section>
        </div>
      </div>

      {/* Friends */}
      <Section title={i18n.q.friends} count={freunde.length} marginTop={32}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
          gap: 12,
        }}>
          {freunde.map(f => <FreundCard key={f.id} f={f} />)}
        </div>
      </Section>

      {/* Gruppen */}
      <Section title={i18n.q.groups} count={gruppen.length} marginTop={28}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}>
          {gruppen.length === 0 && <Empty>Noch keine Gruppen</Empty>}
          {gruppen.map(g => <GruppenCard key={g.id} g={g} />)}
        </div>
      </Section>

      {/* Past sessions */}
      <Section title={i18n.q.past} count={past.length} marginTop={28}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 10,
        }}>
          {past.length === 0 && <Empty>Noch keine vergangenen Sessions</Empty>}
          {past.map(t => (
            <TerminCard
              key={t.id}
              termin={{ ...t, confirmed: t.attended }}
              variant="compact"
              onAccept={() => { }}
              onDecline={() => { }}
            />
          ))}
        </div>
      </Section>

      {/* iCal Sync Modal */}
      {icalModal && (
        <div onClick={() => setIcalModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--cc-surface)", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxWidth: 480, width: "90%", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--cc-text)" }}>Kalender synchronisieren</h2>
              <button onClick={() => setIcalModal(false)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "var(--cc-border-soft)", color: "var(--cc-text)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            {icalError ? (
              <p style={{ margin: "0 0 16px", fontSize: 14, color: "#e55", lineHeight: 1.6 }}>{icalError}</p>
            ) : (
              <>
                <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--cc-text-soft)", lineHeight: 1.6 }}>
                  Abonniere deinen persönlichen CampaignConnect-Kalender. Alle deine Sessions erscheinen dann automatisch in Google Calendar, Apple Kalender oder Outlook.
                </p>
                <div style={{ background: "var(--cc-bg)", border: "1px solid var(--cc-border-soft)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "var(--cc-text-soft)", wordBreak: "break-all", fontFamily: "monospace" }}>
                  {icalUrl ? icalUrl.replace(/^https?:/, 'webcal:') : '…'}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <button onClick={copyIcalUrl} style={{ flex: 1, padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: icalCopied ? "var(--cc-accent-deep)" : "var(--cc-accent)", color: "#fff", border: "none", cursor: "pointer" }}>
                    {icalCopied ? '✓ Kopiert!' : 'URL kopieren'}
                  </button>
                  {icalUrl && (
                    <a href={icalUrl.replace(/^https?:/, 'webcal:')} style={{ flex: 1, padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, background: "var(--cc-surface)", color: "var(--cc-text)", border: "1px solid var(--cc-border-soft)", textDecoration: "none", textAlign: "center" }}>
                      Direkt öffnen
                    </a>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--cc-text-soft)", display: "flex", flexDirection: "column", gap: 6 }}>
                  <strong style={{ color: "var(--cc-text)" }}>Anleitung:</strong>
                  <span>📅 <strong>Google Calendar</strong> → Andere Kalender → Per URL hinzufügen</span>
                  <span>🍎 <strong>Apple Kalender</strong> → Datei → Neues Kalenderabonnement</span>
                  <span>📧 <strong>Outlook</strong> → Kalender hinzufügen → Aus dem Internet abonnieren</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Termin Detail Modal */}
      {selectedTermin && (
        <div
          onClick={() => setSelectedTermin(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--cc-surface)",
              borderRadius: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              maxWidth: 500,
              width: "90%",
              maxHeight: "85vh",
              overflow: "auto",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, var(--cc-accent-deep), var(--cc-dark-plum))",
                padding: "32px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                borderBottom: "1px solid var(--cc-border-soft)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff" }}>
                  {selectedTermin.group}
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                  {selectedTermin.date} · {selectedTermin.time}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {selectedTermin.ist_spielleiter && (
                  <button
                    title="Termin bearbeiten"
                    onClick={() => { setBearbeitenTermin(selectedTermin); setSelectedTermin(null); }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                  >
                    <Icon name="pencil" size={16} />
                  </button>
                )}
                <button
                  onClick={() => setSelectedTermin(null)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "#fff",
                    fontSize: 20,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* System & Description */}
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 8px" }}>
                  System
                </h3>
                <p style={{ margin: 0, fontSize: 15, color: "var(--cc-text)", fontWeight: 500 }}>
                  {selectedTermin.system || "—"}
                </p>
              </div>

              {/* Description */}
              {selectedTermin.description && (
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 8px" }}>
                    Beschreibung
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--cc-text-soft)", lineHeight: 1.5 }}>
                    {selectedTermin.description}
                  </p>
                </div>
              )}

              {/* Format / Ort */}
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 8px" }}>
                  {selectedTermin.modus === 'online' ? 'Format' : 'Ort'}
                </h3>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Icon name="pin" size={16} style={{ color: "var(--cc-accent)", flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: 14, color: "var(--cc-text)" }}>
                    {selectedTermin.modus === 'online'
                      ? 'Online'
                      : (selectedTermin.location
                          || (selectedTermin.modus === 'hybride' ? 'Hybrid (kein Ort angegeben)' : 'Vor Ort (kein Ort angegeben)'))}
                  </p>
                </div>
              </div>

              {/* Spots */}
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 8px" }}>
                  Plätze
                </h3>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 8, background: "var(--cc-border-soft)", borderRadius: 4, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          background: "var(--cc-accent)",
                          width: `${(selectedTermin.spots.filled / selectedTermin.spots.total) * 100}%`,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--cc-text-soft)", minWidth: 50, textAlign: "right" }}>
                    {selectedTermin.spots.filled}/{selectedTermin.spots.total}
                  </p>
                </div>
              </div>

              {/* Teilnehmer mit Status-Farben */}
              {selectedTermin.teilnehmer && selectedTermin.teilnehmer.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 8px" }}>
                    Mitglieder ({selectedTermin.teilnehmer.length})
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedTermin.teilnehmer.map((m, i) => {
                      const farbe = TEILNAHME_FARBEN[m.status] || TEILNAHME_FARBEN.ausstehend;
                      return (
                        <div key={i} style={{
                          fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                          background: farbe.bg, color: farbe.text,
                        }}>
                          {m.name}
                        </div>
                      );
                    })}
                  </div>
                  {/* Legende */}
                  <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                    {[["zugesagt", "Zugesagt"], ["ausstehend", "Wartet"], ["abgesagt", "Abgesagt"]].map(([k, label]) => (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--cc-text-soft)" }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: TEILNAHME_FARBEN[k].dot }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedTermin.tags && selectedTermin.tags.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--cc-text-soft)", textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 8px" }}>
                    Tags
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {selectedTermin.tags.map((tag, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 12,
                          padding: "6px 12px",
                          background: "var(--cc-accent)",
                          color: "#fff",
                          borderRadius: 8,
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: 24,
                borderTop: "1px solid var(--cc-border-soft)",
                background: "var(--cc-bg)",
              }}
            >
              {(() => {
                const accepted = selectedTermin.confirmed === true;
                const declined = selectedTermin.confirmed === false;
                return (
                  <>
                    <button
                      onClick={() => accept(selectedTermin.id)}
                      onMouseEnter={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#16a34a"; }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = accepted ? "#16a34a" : "var(--cc-surface)";
                        e.currentTarget.style.color = accepted ? "#fff" : "var(--cc-text)";
                        e.currentTarget.style.borderColor = accepted ? "#16a34a" : "var(--cc-border-soft)";
                      }}
                      style={{
                        flex: 1, height: 48, borderRadius: 8, cursor: "pointer",
                        background: accepted ? "#16a34a" : "var(--cc-surface)",
                        border: `1px solid ${accepted ? "#16a34a" : "var(--cc-border-soft)"}`,
                        color: accepted ? "#fff" : "var(--cc-text)", fontSize: 15, fontWeight: 600,
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "background .15s ease, color .15s ease, border-color .15s ease",
                      }}
                    >
                      <Icon name="check" size={16} /> {accepted ? "Angenommen" : "Annehmen"}
                    </button>
                    <button
                      onClick={() => decline(selectedTermin.id)}
                      onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#dc2626"; }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = declined ? "#dc2626" : "var(--cc-surface)";
                        e.currentTarget.style.color = declined ? "#fff" : "var(--cc-text)";
                        e.currentTarget.style.borderColor = declined ? "#dc2626" : "var(--cc-border-soft)";
                      }}
                      style={{
                        flex: 1, height: 48, borderRadius: 8, cursor: "pointer",
                        background: declined ? "#dc2626" : "var(--cc-surface)",
                        border: `1px solid ${declined ? "#dc2626" : "var(--cc-border-soft)"}`,
                        color: declined ? "#fff" : "var(--cc-text)", fontSize: 15, fontWeight: 600,
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "background .15s ease, color .15s ease, border-color .15s ease",
                      }}
                    >
                      <Icon name="x" size={16} /> {declined ? "Abgesagt" : "Absagen"}
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {bearbeitenTermin && (
        <TerminBearbeitenModal
          termin={bearbeitenTermin}
          onClose={() => setBearbeitenTermin(null)}
          onSaved={(akt) => setUpcoming(list => list.map(t => t.id === akt.id ? { ...t, ...akt } : t))}
          onDeleted={(id) => setUpcoming(list => list.filter(t => t.id !== id))}
        />
      )}
    </div>
  );
}

function Section({ title, count, children, marginTop = 0 }) {
  return (
    <section style={{ marginTop }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--cc-text)" }}>{title}</h2>
        {count != null && (
          <span style={{ fontSize: 12, color: "var(--cc-text-soft)", fontVariantNumeric: "tabular-nums" }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <div style={{ fontSize: 13, color: "var(--cc-text-soft)", padding: "12px 4px" }}>{children}</div>;
}

function InvitationCard({ invite, onRespond }) {
  const [open, setOpen] = React.useState(false);
  const isDeclined = invite.status === 'declined';
  const isAccepted = invite.status === 'accepted';

  return (
    <div
      style={{
        background: isDeclined ? 'rgba(107,114,128,.07)' : 'var(--cc-surface)',
        border: `1px solid ${isDeclined ? 'rgba(107,114,128,.25)' : 'var(--cc-border-soft)'}`,
        borderRadius: 14,
        padding: 16,
        opacity: isDeclined ? 0.5 : 1,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cc-text)' }}>{invite.title}</div>
          <div style={{ fontSize: 13, color: 'var(--cc-text-soft)', marginTop: 6 }}>
            {invite.group} · {invite.date} · {invite.time}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen((current) => !current); }}
          style={{
            padding: '8px 12px', borderRadius: 8, border: '1px solid var(--cc-border-soft)',
            background: 'transparent', color: 'var(--cc-text)', cursor: 'pointer', fontSize: 12,
          }}
        >
          {open ? 'Weniger' : 'Details'}
        </button>
      </div>

      <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--cc-text-soft)' }}>
        Hey schau mal, ein Gruppenmitglied möchte wissen, ob du beim Termin dabei bist. Mit Haken bestätigst du, mit Kreuz lehnst du ab.
      </p>

      {open && (
        <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: 'rgba(233,160,81,.08)', border: '1px solid rgba(233,160,81,.3)' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--cc-text-soft)' }}><strong>Ort:</strong> {invite.location}</div>
            <div style={{ fontSize: 13, color: 'var(--cc-text-soft)' }}><strong>System:</strong> {invite.system}</div>
            <div style={{ fontSize: 13, color: 'var(--cc-text-soft)' }}><strong>Beschreibung:</strong> {invite.description}</div>
            <div style={{ fontSize: 13, color: 'var(--cc-text-soft)' }}><strong>Teilnehmer:</strong> {invite.participants.join(', ')}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button
          size="sm"
          variant="primary"
          onClick={(e) => { e.stopPropagation(); onRespond(invite.id, true); }}
          disabled={isAccepted}
        >
          ✓ Ich bin dabei
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); onRespond(invite.id, false); }}
          disabled={isDeclined}
        >
          ✕ Ich bin nicht dabei
        </Button>
      </div>
      {(isAccepted || isDeclined) && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--cc-text-soft)' }}>
          {isAccepted ? 'Termin wurde übernommen und taucht nun bei deinen anstehenden Terminen auf.' : invite.declinedInfo}
        </div>
      )}
    </div>
  );
}

function col() {
  return { display: "flex", flexDirection: "column", gap: 24 };
}
