import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Questboard from './Questboard.jsx';

function QuestboardHarness() {
  const [upcoming, setUpcoming] = React.useState([]);

  return (
    <Questboard
      tweaks={{ theme: 'light', accent: 'orange', rpg: 'on', lang: 'de', cardVariant: 'default' }}
      onNavigate={vi.fn()}
      upcoming={upcoming}
      setUpcoming={setUpcoming}
    />
  );
}

describe('Questboard', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('cc_user', 'Max Mustermann');
    localStorage.setItem('cc_access', 'fake-token');
  });

  it('renders with MSW-backed fake data', async () => {
    render(<QuestboardHarness />);

    expect(screen.getByText('DEIN QUESTBOARD')).toBeInTheDocument();
    expect(screen.getByText('Deine Gruppen')).toBeInTheDocument();

    expect(await screen.findByText('Anstehende Termine')).toBeInTheDocument();
    expect(await screen.findByText('17.09.2026')).toBeInTheDocument();
  });
});