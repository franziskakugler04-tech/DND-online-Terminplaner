import { beforeEach, describe, expect, test, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './Login.jsx';

const originalFetch = global.fetch;

function getSubmitButton() {
    const buttons = screen.getAllByRole('button', { name: /Anmelden/i });
    const submitButton = buttons.find(button => button.closest('form'));
    if (!submitButton) {
        throw new Error('Submit button not found in form');
    }
    return submitButton;
}

describe('Login', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        localStorage.clear();
        global.fetch = originalFetch;
    });

    test('show error box when fields are empty', async () => {
        const onLogin = vi.fn();
        render(<Login onLogin={onLogin} />);

        fireEvent.click(getSubmitButton());

        expect(await screen.findByText(/Bitte alle Felder ausfüllen\./i)).toBeInTheDocument();
        expect(screen.getByText(/Bitte alle Felder ausfüllen\./i)).toHaveStyle('background: rgba(244,63,94,.1)');
        expect(onLogin).not.toHaveBeenCalled();
    });

    test('blocks submit button while the login request is pending', async () => {
        const onLogin = vi.fn();
        let resolveFetch;
        global.fetch = vi.fn(() => new Promise(resolve => { resolveFetch = resolve; }));

        render(<Login onLogin={onLogin} />);

        fireEvent.change(screen.getByLabelText(/Benutzername/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Passwort/i), { target: { value: 'password123' } });

        const submitButton = getSubmitButton();
        expect(submitButton).not.toBeDisabled();

        fireEvent.click(submitButton);

        // Während der Request läuft: Button disabled + Lade-Label.
        await waitFor(() => expect(submitButton).toBeDisabled());
        expect(submitButton).toHaveTextContent('...');
        expect(onLogin).not.toHaveBeenCalled();

        // Nach erfolgreicher Antwort: Button wieder aktiv, onLogin ausgelöst.
        resolveFetch({
            ok: true,
            json: () => Promise.resolve({ access: 'test-access-token', refresh: 'test-refresh-token' }),
        });
        await waitFor(() => expect(onLogin).toHaveBeenCalledWith('testuser'));
        await waitFor(() => expect(submitButton).not.toBeDisabled());
    });

    test('calls onLogin and stores cc_access on successful login', async () => {
        const onLogin = vi.fn();
        global.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ access: 'test-access-token', refresh: 'test-refresh-token' }),
        }));

        render(<Login onLogin={onLogin} />);

        fireEvent.change(screen.getByLabelText(/Benutzername/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Passwort/i), { target: { value: 'password123' } });

        fireEvent.click(getSubmitButton());

        await waitFor(() => expect(onLogin).toHaveBeenCalledWith('testuser'));
        expect(localStorage.getItem('cc_access')).toBe('test-access-token');
        expect(localStorage.getItem('cc_refresh')).toBe('test-refresh-token');
    });
});
