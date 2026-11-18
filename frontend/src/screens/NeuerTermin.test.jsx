import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NeuerTermin from './NeuerTermin.jsx';

const tweaks = { theme: 'light', lang: 'de' };

function renderForm(props = {}) {
  return render(
    <NeuerTermin
      tweaks={tweaks}
      user="Max"
      onNavigate={vi.fn()}
      {...props}
    />,
  );
}

function getSubmitButton() {
  return screen.getByRole('button', { name: /Als Termin festlegen|Wird gespeichert/i });
}

// fetch-Mock: beim Mounten werden Gruppen und Kampagnen geladen, beim
// Absenden die Session angelegt. Den POST geben wir je Test extra mit.
function mockFetch(sessionResponse) {
  return vi.fn((url, opts = {}) => {
    if (opts.method === 'POST') return sessionResponse();
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
}

describe('NeuerTermin (Formular-Isolation)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cc_access', 'fake-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('blockiert den Submit-Button während des Speicherns (disabled + Label)', async () => {
    // POST in der Schwebe halten, damit der submitting-Zustand sichtbar wird.
    let resolvePost;
    global.fetch = mockFetch(() => new Promise((resolve) => { resolvePost = resolve; }));
    const onNavigate = vi.fn();

    renderForm({ onNavigate });

    const submitButton = getSubmitButton();
    expect(submitButton).not.toBeDisabled();

    fireEvent.submit(submitButton.closest('form'));

    // Während der Request läuft: Button disabled + Lade-Label.
    await waitFor(() => expect(getSubmitButton()).toBeDisabled());
    expect(screen.getByText(/Wird gespeichert/i)).toBeInTheDocument();
    expect(onNavigate).not.toHaveBeenCalled();

    // Nach erfolgreicher Antwort: Button wieder aktiv, Navigation ausgelöst.
    resolvePost({ ok: true, json: () => Promise.resolve({ id: 1 }) });
    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
    expect(onNavigate).toHaveBeenCalledWith('questboard');
  });

  it('rendert den lokalen Error-State, wenn das Anlegen fehlschlägt', async () => {
    global.fetch = mockFetch(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ datum: ['Datumsformat muss DD.MM.YYYY sein.'] }),
    }));

    renderForm();

    fireEvent.submit(getSubmitButton().closest('form'));

    expect(await screen.findByText(/Datumsformat muss DD.MM.YYYY sein/i)).toBeInTheDocument();
    // Nach dem Fehler ist der Button wieder bedienbar.
    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
  });

  it('legt bei gültiger Eingabe einen Termin an und navigiert', async () => {
    const postCalls = [];
    global.fetch = vi.fn((url, opts = {}) => {
      if (opts.method === 'POST') {
        postCalls.push(url);
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 1 }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    const onNavigate = vi.fn();

    renderForm({ onNavigate });

    fireEvent.submit(getSubmitButton().closest('form'));

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('questboard'));
    expect(postCalls[0]).toMatch(/\/api\/kampagnen\/.*\/sessions\/$/);
    expect(screen.queryByText(/Fehler beim Erstellen/i)).not.toBeInTheDocument();
  });
});
