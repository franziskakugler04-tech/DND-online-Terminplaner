"""
SCRUM-88 — Datenbank-Constraints & Default-Werte per Unit-Test absichern
"""
import pytest
from django.db import IntegrityError
from django.utils import timezone

from ...models import (
    Gruppe,
    Gruppenmitgliedschaft,
    Kampagne,
    MeetingFormatChoices,
    RolleChoices,
    Session,
    SessionTeilnahme,
    Spieler,
    TeilnahmeRolleChoices,
    TeilnahmeStatusChoices,
    KampagneStatusChoices,
    KampagneTypChoices,
    KampagneGroesseChoices,
)


# ─────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────

@pytest.fixture
def spieler(db):
    return Spieler.objects.create_user(username='testuser', password='x')


@pytest.fixture
def spieler2(db):
    return Spieler.objects.create_user(username='testuser2', password='x')


@pytest.fixture
def gruppe(db, spieler):
    return Gruppe.objects.create(name='TestGruppe', erstellt_von=spieler)


@pytest.fixture
def kampagne(db, spieler, gruppe):
    return Kampagne.objects.create(titel='TestKampagne', gruppe=gruppe, spielleiter=spieler)


@pytest.fixture
def session(db, kampagne):
    return Session.objects.create(
        kampagne=kampagne,
        titel='Session 1',
        datetime=timezone.now(),
    )


# ─────────────────────────────────────────
# SCRUM-88 · DEFAULT-WERTE
# ─────────────────────────────────────────

class TestSpielerDefaults:
    def test_rolle_default_ist_spieler(self, spieler):
        assert spieler.rolle == RolleChoices.SPIELER

    def test_timezone_default_ist_berlin(self, spieler):
        assert spieler.timezone == 'Europe/Berlin'


class TestGruppeDefaults:
    def test_ist_oeffentlich_default_false(self, gruppe):
        assert gruppe.ist_oeffentlich is False

    def test_meeting_format_default_irl(self, gruppe):
        assert gruppe.meeting_format == MeetingFormatChoices.IRL


class TestGruppenmitgliedschaftDefaults:
    def test_rolle_default_ist_spieler(self, db, gruppe, spieler):
        m = Gruppenmitgliedschaft.objects.create(gruppe=gruppe, spieler=spieler)
        assert m.rolle == RolleChoices.SPIELER

    def test_mitglied_seit_wird_automatisch_gesetzt(self, db, gruppe, spieler):
        m = Gruppenmitgliedschaft.objects.create(gruppe=gruppe, spieler=spieler)
        assert m.mitglied_seit is not None


class TestKampagneDefaults:
    def test_status_default_ist_aktiv(self, kampagne):
        assert kampagne.status == KampagneStatusChoices.AKTIV

    def test_typ_default_ist_kampagne(self, kampagne):
        assert kampagne.typ == KampagneTypChoices.KAMPAGNE

    def test_meeting_format_default_irl(self, kampagne):
        assert kampagne.meeting_format == MeetingFormatChoices.IRL

    def test_sprache_default_ist_de(self, kampagne):
        assert kampagne.sprache == 'de'

    def test_kampagnengroesse_default(self, kampagne):
        assert kampagne.kampagnengroesse == KampagneGroesseChoices.S4_6

    def test_ist_privat_default_true(self, kampagne):
        assert kampagne.ist_privat is True

    def test_nur_mit_dm_default_true(self, kampagne):
        assert kampagne.nur_mit_dm is True

    def test_warteliste_default_true(self, kampagne):
        assert kampagne.warteliste is True

    def test_start_date_default_none(self, kampagne):
        assert kampagne.start_date is None


class TestSessionDefaults:
    def test_ist_vorschlag_default_false(self, session):
        assert session.ist_vorschlag is False

    def test_meeting_format_default_irl(self, session):
        assert session.meeting_format == MeetingFormatChoices.IRL

    def test_end_datetime_default_none(self, session):
        assert session.end_datetime is None

    def test_ort_default_leer(self, session):
        assert session.ort == ''


class TestSessionTeilnahmeDefaults:
    def test_status_default_ausstehend(self, db, session, spieler):
        t = SessionTeilnahme.objects.create(session=session, spieler=spieler)
        assert t.status == TeilnahmeStatusChoices.AUSSTEHEND

    def test_rolle_default_spieler(self, db, session, spieler):
        t = SessionTeilnahme.objects.create(session=session, spieler=spieler)
        assert t.rolle == TeilnahmeRolleChoices.SPIELER


# ─────────────────────────────────────────
# SCRUM-88 · DATENBANK-CONSTRAINTS
# ─────────────────────────────────────────

class TestGruppenmitgliedschaftConstraints:
    def test_unique_together_spieler_gruppe(self, db, gruppe, spieler):
        """Derselbe Spieler kann einer Gruppe nicht zweimal beitreten."""
        Gruppenmitgliedschaft.objects.create(gruppe=gruppe, spieler=spieler)
        with pytest.raises(IntegrityError):
            Gruppenmitgliedschaft.objects.create(gruppe=gruppe, spieler=spieler)

    def test_verschiedene_spieler_in_selber_gruppe_erlaubt(self, db, gruppe, spieler, spieler2):
        Gruppenmitgliedschaft.objects.create(gruppe=gruppe, spieler=spieler)
        Gruppenmitgliedschaft.objects.create(gruppe=gruppe, spieler=spieler2)
        assert Gruppenmitgliedschaft.objects.filter(gruppe=gruppe).count() == 2

    def test_selber_spieler_in_verschiedenen_gruppen_erlaubt(self, db, spieler, spieler2):
        g1 = Gruppe.objects.create(name='G1', erstellt_von=spieler2)
        g2 = Gruppe.objects.create(name='G2', erstellt_von=spieler2)
        Gruppenmitgliedschaft.objects.create(gruppe=g1, spieler=spieler)
        Gruppenmitgliedschaft.objects.create(gruppe=g2, spieler=spieler)
        assert Gruppenmitgliedschaft.objects.filter(spieler=spieler).count() == 2


class TestSessionTeilnahmeConstraints:
    def test_unique_together_spieler_session(self, db, session, spieler):
        """Derselbe Spieler kann einer Session nicht zweimal beitreten."""
        SessionTeilnahme.objects.create(session=session, spieler=spieler)
        with pytest.raises(IntegrityError):
            SessionTeilnahme.objects.create(session=session, spieler=spieler)

    def test_verschiedene_spieler_in_selber_session_erlaubt(self, db, session, spieler, spieler2):
        SessionTeilnahme.objects.create(session=session, spieler=spieler)
        SessionTeilnahme.objects.create(session=session, spieler=spieler2)
        assert SessionTeilnahme.objects.filter(session=session).count() == 2


class TestKampagneCascadeDelete:
    def test_sessions_werden_geloescht_wenn_kampagne_geloescht(self, db, kampagne, session):
        kampagne_id = kampagne.id
        session_id = session.id
        kampagne.delete()
        assert not Session.objects.filter(pk=session_id).exists()

    def test_mitgliedschaften_werden_geloescht_wenn_gruppe_geloescht(self, db, gruppe, spieler):
        Gruppenmitgliedschaft.objects.create(gruppe=gruppe, spieler=spieler)
        gruppe.delete()
        assert not Gruppenmitgliedschaft.objects.filter(spieler=spieler).exists()

    def test_teilnahmen_werden_geloescht_wenn_session_geloescht(self, db, session, spieler):
        SessionTeilnahme.objects.create(session=session, spieler=spieler)
        session.delete()
        assert not SessionTeilnahme.objects.filter(spieler=spieler).exists()
