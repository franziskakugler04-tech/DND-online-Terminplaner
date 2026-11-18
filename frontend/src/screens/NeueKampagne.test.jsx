import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../mocks/server.js';
import NeueKampagne from './NeueKampagne.jsx';

const tweaks = { lang: 'de' };

function renderForm() {
  return render(<NeueKampagne tweaks={tweaks} onNavigate={() => {}} />);
}

function getSubmitButton() {
  return screen.getByRole('button', { name: /Kampagne jetzt erstellen|Wird gespeichert|Erstellt/i });
}

describe('NeueKampagne (Formular-Isolation)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cc_access', 'fake-token');
  });

  it('blockiert den Submit-Button während des Speicherns (disabled + Label)', async () => {
    // POST künstlich in der Schwebe halten, damit der submitting-Zustand sichtbar wird.
    server.use(
      http.post('/api/kampagnen/', async () => {
        await delay(50);
        return HttpResponse.json({ id: 'k99' }, { status: 201 });
      }),
    );

    renderForm();

    fireEvent.change(screen.getByPlaceholderText(/Fluch des Strahd/i), {
      target: { value: 'Testkampagne' },
    });

    const submitButton = getSubmitButton();
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    // Während des laufenden Requests: disabled + Lade-Label.
    await waitFor(() => expect(getSubmitButton()).toBeDisabled());
    expect(screen.getByText(/Wird gespeichert/i)).toBeInTheDocument();

    // Nach Erfolg: bleibt disabled (created) und zeigt Bestätigung.
    await waitFor(() => expect(screen.getByText(/Erstellt!/i)).toBeInTheDocument());
    expect(getSubmitButton()).toBeDisabled();
  });

  it('rendert den lokalen Error-State bei ungültigen Eingaben (400 vom Backend)', async () => {
    server.use(
      http.post('/api/kampagnen/', () =>
        HttpResponse.json({ kampagnename: ['Dieses Feld ist erforderlich.'] }, { status: 400 }),
      ),
    );

    renderForm();

    fireEvent.change(screen.getByPlaceholderText(/Fluch des Strahd/i), {
      target: { value: 'Ungültig' },
    });

    fireEvent.click(getSubmitButton());

    // Die Fehlermeldung aus der Response wird lokal angezeigt.
    expect(await screen.findByText(/Dieses Feld ist erforderlich/i)).toBeInTheDocument();

    // Button ist nach dem Fehler wieder aktiv (kein created-State).
    await waitFor(() => expect(getSubmitButton()).not.toBeDisabled());
  });

  it('zeigt einen lokalen Netzwerk-Fehler an, wenn der Request fehlschlägt', async () => {
    server.use(
      http.post('/api/kampagnen/', () => HttpResponse.error()),
    );

    renderForm();

    fireEvent.change(screen.getByPlaceholderText(/Fluch des Strahd/i), {
      target: { value: 'Testkampagne' },
    });

    fireEvent.click(getSubmitButton());

    expect(await screen.findByText(/Netzwerkfehler/i)).toBeInTheDocument();
  });
});
