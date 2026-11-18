import React, { useEffect, useState } from 'react';
import Header from './components/organisms/Header.jsx';
import Footer from './components/organisms/Footer.jsx';
import TweaksPanel from './components/organisms/TweaksPanel.jsx';
import Questboard from './screens/Questboard.jsx';
import Community from './screens/Community.jsx';
import NeuerTermin from './screens/NeuerTermin.jsx';
import Profil from './screens/Profil.jsx';
import NeueKampagne from './screens/NeueKampagne.jsx';
import Branding from './screens/Branding.jsx';
import Login from './screens/Login.jsx';
import Freunde from './screens/Freunde.jsx';

const DEFAULT_TWEAKS = {
  theme: 'light',
  accent: 'orange',
  rpg: 'on',
  lang: 'de',
  cardVariant: 'default',
};

export default function App() {
  const [route, setRoute] = useState('questboard');
  const [tweaks, setTweaks] = useState(DEFAULT_TWEAKS);
  const [tweaksOpen, setTweaksOpen] = useState(true);
  const [user, setUser] = useState(() => localStorage.getItem('cc_user') || null);
  const [upcoming, setUpcoming] = useState([]);
  const [groups, setGroups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [poll, setPoll] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.accent = tweaks.accent;
    document.documentElement.dataset.rpg = tweaks.rpg;
  }, [tweaks]);

  useEffect(() => {
    if (!user) return;
    const headers = { Authorization: 'Bearer ' + localStorage.getItem('cc_access') };
    fetch('/api/gruppen/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(setGroups)
      .catch(() => {});
    fetch('/api/kampagnen/', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCampaigns(data.map(c => ({ ...c, title: c.titel, desc: c.beschreibung }))))
      .catch(() => {});
  }, [user]);

  function handleLogin(username) {
    localStorage.setItem('cc_user', username);
    setUser(username);
  }

  function handleLogout() {
    localStorage.removeItem('cc_access');
    localStorage.removeItem('cc_refresh');
    localStorage.removeItem('cc_user');
    setUser(null);
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const setTweak = (k, v) => setTweaks(t => ({ ...t, [k]: v }));

  const SCREENS = {
    questboard: <Questboard tweaks={tweaks} onNavigate={setRoute} upcoming={upcoming} setUpcoming={setUpcoming} poll={poll} user={user} onPollUpdate={setPoll} onPollFinalize={(session) => { setUpcoming(u => [session, ...u]); setPoll(null); }} />,
    community: <Community tweaks={tweaks} onNavigate={setRoute} />,
    neuerTermin: <NeuerTermin tweaks={tweaks} user={user} onNavigate={setRoute} onCreateTermin={(termin) => {
      if (termin.type === 'poll') {
        setPoll(termin.poll);
        return;
      }
      setUpcoming(u => [termin, ...u]);
    }} />,
    neueKampagne: <NeueKampagne tweaks={tweaks} onNavigate={setRoute} />,
    profil: <Profil tweaks={tweaks} />,
    freunde: <Freunde />,
    brand: <Branding tweaks={tweaks} />,
  };

  return (
    <div className="app" data-screen-label={route} style={{ display: "flex", flexDirection: "column" }}>
      <Header active={route} onNavigate={setRoute} user={user} onLogout={handleLogout} />
      <main style={{ flex: 1, paddingBottom: "clamp(200px, 24vh, 360px)" }}>{SCREENS[route]}</main>
      {route !== 'brand' && <Footer />}
      {tweaksOpen && (
        <TweaksPanel tweaks={tweaks} setTweak={setTweak} onClose={() => setTweaksOpen(false)} />
      )}
      {!tweaksOpen && (
        <button onClick={() => setTweaksOpen(true)} style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 100,
          padding: '10px 14px', borderRadius: 99,
          background: 'var(--cc-accent)', color: 'var(--cc-ink)',
          fontWeight: 600, boxShadow: '0 6px 20px rgba(0,0,0,.2)',
        }}>Tweaks</button>
      )}
    </div>
  );
}
