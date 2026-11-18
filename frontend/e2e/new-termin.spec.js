import { test, expect } from '@playwright/test';

test('Termin erstellen flow — Neuer Termin → Questboard', async ({ page, context }) => {
    // Ensure app treats us as logged in
    await context.addInitScript(() => {
        localStorage.setItem('cc_user', 'e2e-test');
        localStorage.setItem('cc_access', 'token-e2e');
    });

    // Mock backend endpoints used by the flow
    await page.route('**/api/gruppen/', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'g1', name: 'Test Gruppe', membersList: ['Alice'] }])
    }));

    await page.route('**/api/kampagnen/', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'c1', titel: 'Test Kampagne', beschreibung: 'desc' }])
    }));

    // Return empty initial termine list
    await page.route('**/api/termine/', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
    }));

    // Intercept the POST that creates a session and return the created termin
    await page.route('**/api/kampagnen/c1/sessions/', async route => {
        const body = {
            id: 't1',
            date: '17.08.2026',
            time: '16:00',
            group: 'Test Gruppe',
            description: 'Automated test termin',
            spots: { filled: 0, total: 4 },
            confirmed: true,
        };
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(body) });
    });

    // Open the app
    await page.goto('/');

    // Navigate to Neuer Termin (use main quick-action to avoid header duplicate)
    await page.getByRole('main').getByRole('button', { name: 'Neuer Termin' }).click();

    // Fill the form
    await page.getByLabel('Welche Gruppe').selectOption('g1');
    await page.getByLabel('Welche Kampagne').selectOption('c1');
    await page.getByLabel('Datum').fill('2026-08-17');
    await page.getByLabel('Startzeit').fill('16:00');
    await page.getByLabel('Endzeit').fill('17:00');
    await page.getByLabel('Beschreibung und Notizen').fill('Automated test termin');

    // Submit
    await page.getByRole('button', { name: 'Als Termin festlegen' }).click();

    // Verify the created termin is visible in the "Anstehende Termine" section
    const upcomingSection = page.getByRole('heading', { name: 'Anstehende Termine' }).locator('xpath=ancestor::section');
    await expect(upcomingSection.getByText('17.08.2026')).toBeVisible();
});
