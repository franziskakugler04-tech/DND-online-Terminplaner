import { http, HttpResponse } from 'msw';

const gruppen = [
  { id: 'g1', name: 'Gruppe A', members: 3, color: '#E9A051', membersList: ['user_1', 'user_2', 'user_3'] },
  { id: 'g2', name: 'Gruppe B', members: 2, color: '#F43F5E', membersList: ['user_4', 'user_5'] },
];

const kampagnen = [
  { id: 'k1', titel: 'Kampagne Alpha', beschreibung: 'Testkampagne A.' },
  { id: 'k2', titel: 'Kampagne Beta', beschreibung: 'Testkampagne B.' },
];

const termine = [
  {
    id: 't1',
    date: '17.09.2026',
    time: '16:00–22:00',
    group: 'Gruppe A',
    location: 'Testort',
    description: 'Testbeschreibung',
    system: 'D&D 5e',
    participants: ['user_1', 'user_2'],
    spots: { filled: 2, total: 6 },
    tags: ['D&D 5e'],
    confirmed: true,
  },
];

const freundschaftsanfragen = [
  { id: 'r1', initiator: { username: 'user_1' } },
];

const freunde = [
  { id: 'f1', spieler: { username: 'user_1', avatarId: 1 } },
  { id: 'f2', spieler: { username: 'user_2', avatarId: 2 } },
];

export const handlers = [
  http.get('/api/gruppen/', () => HttpResponse.json(gruppen)),
  http.get('/api/kampagnen/', () => HttpResponse.json(kampagnen)),
  http.get('/api/termine/', () => HttpResponse.json(termine)),
  http.get('/api/freundschaftsanfragen/', () => HttpResponse.json(freundschaftsanfragen)),
  http.get('/api/freunde/', () => HttpResponse.json(freunde)),
  http.get('/api/spieler/', () => HttpResponse.json([])),
  http.post('/api/freundschaften/', () => HttpResponse.json({}, { status: 201 })),
  http.put('/api/freundschaften/:id/', () => HttpResponse.json({}, { status: 204 })),
  http.delete('/api/freundschaften/:id/', () => HttpResponse.json({}, { status: 204 })),
];

export { gruppen, kampagnen, termine, freundschaftsanfragen, freunde };
