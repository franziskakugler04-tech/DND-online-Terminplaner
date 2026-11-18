import React, { useState } from 'react';
import headerLogo from '../assets/logosammlung-04.png';
import Button from '../components/atoms/Button.jsx';

const API = 'http://localhost:8000/api';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!form.username || !form.password || (mode === 'register' && !form.email)) {
      setError('Bitte alle Felder ausfüllen.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'register') {
        const res = await fetch(`${API}/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.username, password: form.password, email: form.email }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Registrierung fehlgeschlagen.'); setLoading(false); return; }
        setMode('login');
        setError('');
        setForm(f => ({ ...f, password: '' }));
        setLoading(false);
        return;
      }

      const res = await fetch(`${API}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError('Benutzername oder Passwort falsch.'); setLoading(false); return; }

      localStorage.setItem('cc_access', data.access);
      localStorage.setItem('cc_refresh', data.refresh);
      onLogin(form.username);
    } catch {
      setError('Server nicht erreichbar. Ist das Backend gestartet?');
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cc-dark-night)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--cc-surface)',
        borderRadius: 18,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
        boxShadow: 'var(--cc-shadow-pop)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, overflow: 'hidden', borderRadius: 8, flexShrink: 0 }}>
            <img
              src={headerLogo}
              alt="Campaign Connect Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: 'scale(3.2)',
                transformOrigin: 'center',
                display: 'block',
              }}
            />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--cc-text)', letterSpacing: '.02em' }}>Campaign Connect</span>
        </div>

        {/* Tab-Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--cc-surface-2)',
          borderRadius: 8,
          padding: 4,
          marginBottom: 28,
          border: '1px solid var(--cc-border-soft)',
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 6,
                fontFamily: 'var(--cc-font)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'background .15s, color .15s',
                background: mode === m ? 'var(--cc-accent)' : 'transparent',
                color: mode === m ? 'var(--cc-ink)' : 'var(--cc-text-soft)',
                border: 'none',
              }}
            >
              {m === 'login' ? 'Anmelden' : 'Registrieren'}
            </button>
          ))}
        </div>

        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Benutzername" value={form.username} onChange={v => set('username', v)} autoComplete="username" />

          {mode === 'register' && (
            <Field label="E-Mail" type="email" value={form.email} onChange={v => set('email', v)} autoComplete="email" required />
          )}

          <Field label="Passwort" type="password" value={form.password} onChange={v => set('password', v)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

          {error && (
            <div style={{
              background: 'rgba(244,63,94,.1)',
              border: '1px solid rgba(244,63,94,.3)',
              color: '#F43F5E',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <Button type="submit" block size="lg" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? '...' : mode === 'login' ? 'Anmelden' : 'Account erstellen'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', autoComplete, required = true }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cc-text-soft)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid var(--cc-border-soft)',
          fontFamily: 'var(--cc-font)',
          fontSize: 15,
          background: 'var(--cc-surface)',
          color: 'var(--cc-text)',
          outline: 'none',
        }}
      />
    </label>
  );
}
