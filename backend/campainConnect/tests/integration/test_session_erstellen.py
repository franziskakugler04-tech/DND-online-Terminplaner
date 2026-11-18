"""
SCRUM-90 — Session-Erstellung (kampagne_session_erstellen) strikt validieren
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from ...models import (
    Gruppe,
    Gruppenmitgliedschaft,
    Kampagne,
    RolleChoices,
    Session,
    SessionTeilnahme,
    Spieler,
    TeilnahmeRolleChoices,
    TeilnahmeStatusChoices,
)


# ─────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────

@pytest.fixture
def spielleiter(db):
    return Spieler.objects.create_user(username='spielleiter', password='x')


@pytest.fixture
def spieler(db):
    return Spieler.objects.create_user(username='spieler', password='x')


@pytest.fixture
def fremder(db):
    return Spieler.objects.create_user(username='fremder', password='x')


@pytest.fixture
def gruppe(db, spielleiter, spieler):
    g = Gruppe.objects.create(name='TestGruppe', erstellt_von=spielleiter)
    Gruppenmitgliedschaft.objects.create(gruppe=g, spieler=spielleiter, rolle=RolleChoices.SPIELLEITER)
    Gruppenmitgliedschaft.objects.create(gruppe=g, spieler=spieler, rolle=RolleChoices.SPIELER)
    return g


@pytest.fixture
def kampagne(db, spielleiter, gruppe):
    return Kampagne.objects.create(
        titel='TestKampagne',
        gruppe=gruppe,
        spielleiter=spielleiter,
    )


@pytest.fixture
def client_spielleiter(spielleiter):
    c = APIClient()
    c.force_authenticate(user=spielleiter)
    return c


@pytest.fixture
def client_spieler(spieler):
    c = APIClient()
    c.force_authenticate(user=spieler)
    return c


@pytest.fixture
def client_anonym():
    return APIClient()


def url(kampagne_pk):
    return f'/api/kampagnen/{kampagne_pk}/sessions/'


VALIDE_DATEN = {'datum': '25.06.2026', 'von': '18:00', 'bis': '22:00', 'beschreibung': 'Test'}


# ─────────────────────────────────────────
# SCRUM-90 · AUTHENTIFIZIERUNG
# ─────────────────────────────────────────

class TestAuthentifizierung:
    def test_anonym_wird_abgelehnt(self, client_anonym, kampagne):
        resp = client_anonym.post(url(kampagne.pk), VALIDE_DATEN, format='json')
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_spielleiter_darf_erstellen(self, client_spielleiter, kampagne):
        resp = client_spielleiter.post(url(kampagne.pk), VALIDE_DATEN, format='json')
        assert resp.status_code == status.HTTP_201_CREATED

    def test_normaler_spieler_wird_abgelehnt(self, client_spieler, kampagne):
        """Nur der Spielleiter der Kampagne darf Sessions erstellen."""
        resp = client_spieler.post(url(kampagne.pk), VALIDE_DATEN, format='json')
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_fremder_nutzer_wird_abgelehnt(self, db, fremder, kampagne):
        c = APIClient()
        c.force_authenticate(user=fremder)
        resp = c.post(url(kampagne.pk), VALIDE_DATEN, format='json')
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_nicht_existierende_kampagne_404(self, client_spielleiter):
        resp = client_spielleiter.post(url(99999), VALIDE_DATEN, format='json')
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ─────────────────────────────────────────
# SCRUM-90 · EINGABE-VALIDIERUNG
# ─────────────────────────────────────────

class TestEingabeValidierung:
    def test_fehlendes_datum_gibt_400(self, client_spielleiter, kampagne):
        resp = client_spielleiter.post(url(kampagne.pk), {'von': '18:00'}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert 'datum' in resp.data

    def test_fehlende_startzeit_gibt_400(self, client_spielleiter, kampagne):
        resp = client_spielleiter.post(url(kampagne.pk), {'datum': '25.06.2026'}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert 'von' in resp.data

    def test_falsches_datumsformat_gibt_400(self, client_spielleiter, kampagne):
        """ISO-Format 2026-06-25 ist nicht erlaubt, nur DD.MM.YYYY."""
        resp = client_spielleiter.post(
            url(kampagne.pk), {'datum': '2026-06-25', 'von': '18:00'}, format='json'
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_falsches_zeitformat_gibt_400(self, client_spielleiter, kampagne):
        """1800 ohne Doppelpunkt ist kein gültiges Format."""
        resp = client_spielleiter.post(
            url(kampagne.pk), {'datum': '25.06.2026', 'von': '1800'}, format='json'
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_leerer_body_gibt_400(self, client_spielleiter, kampagne):
        resp = client_spielleiter.post(url(kampagne.pk), {}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_bis_ist_optional(self, client_spielleiter, kampagne):
        """Endzeit darf fehlen – Session wird trotzdem erstellt."""
        resp = client_spielleiter.post(
            url(kampagne.pk), {'datum': '25.06.2026', 'von': '18:00'}, format='json'
        )
        assert resp.status_code == status.HTTP_201_CREATED


# ─────────────────────────────────────────
# SCRUM-90 · ERSTELLUNGSLOGIK
# ─────────────────────────────────────────

class TestErstellungsLogik:
    def test_session_wird_in_db_gespeichert(self, client_spielleiter, kampagne):
        client_spielleiter.post(url(kampagne.pk), VALIDE_DATEN, format='json')
        assert Session.objects.filter(kampagne=kampagne).count() == 1

    def test_spielleiter_bekommt_dm_teilnahme(self, client_spielleiter, kampagne, spielleiter):
        client_spielleiter.post(url(kampagne.pk), VALIDE_DATEN, format='json')
        session = Session.objects.get(kampagne=kampagne)
        teilnahme = SessionTeilnahme.objects.get(session=session, spieler=spielleiter)
        assert teilnahme.rolle == TeilnahmeRolleChoices.DM
        assert teilnahme.status == TeilnahmeStatusChoices.ZUGESAGT

    def test_gruppenmitglieder_bekommen_ausstehende_teilnahme(self, client_spielleiter, kampagne, spieler):
        client_spielleiter.post(url(kampagne.pk), VALIDE_DATEN, format='json')
        session = Session.objects.get(kampagne=kampagne)
        teilnahme = SessionTeilnahme.objects.get(session=session, spieler=spieler)
        assert teilnahme.status == TeilnahmeStatusChoices.AUSSTEHEND
        assert teilnahme.rolle == TeilnahmeRolleChoices.SPIELER

    def test_session_nummerierung_steigt(self, client_spielleiter, kampagne):
        client_spielleiter.post(url(kampagne.pk), VALIDE_DATEN, format='json')
        client_spielleiter.post(url(kampagne.pk), {**VALIDE_DATEN, 'datum': '02.07.2026'}, format='json')
        sessions = Session.objects.filter(kampagne=kampagne).order_by('datetime')
        assert 'Session 1' in sessions[0].titel
        assert 'Session 2' in sessions[1].titel

    def test_antwort_enthaelt_erwartete_felder(self, client_spielleiter, kampagne):
        resp = client_spielleiter.post(url(kampagne.pk), VALIDE_DATEN, format='json')
        for feld in ['id', 'date', 'time', 'group', 'confirmed']:
            assert feld in resp.data
