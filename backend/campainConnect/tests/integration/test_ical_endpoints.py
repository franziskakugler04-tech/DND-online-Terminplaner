import uuid
import pytest
from datetime import datetime, timedelta, timezone as dt_timezone
from rest_framework import status
from rest_framework.test import APIClient

from ...models import (
    Spieler, Gruppe, Gruppenmitgliedschaft, Kampagne,
    Session, SessionTeilnahme, TeilnahmeStatusChoices,
)

URL_TOKEN = '/api/me/ical-token/'


@pytest.fixture
def client_anonym():
    return APIClient()


@pytest.fixture
def alice(db):
    return Spieler.objects.create_user(username='alice', password='pass', email='alice@test.de')


@pytest.fixture
def bob(db):
    return Spieler.objects.create_user(username='bob', password='pass', email='bob@test.de')


@pytest.fixture
def gruppe(alice):
    g = Gruppe.objects.create(name='Gruppe', erstellt_von=alice)
    Gruppenmitgliedschaft.objects.create(gruppe=g, spieler=alice)
    return g


@pytest.fixture
def kampagne(alice, gruppe):
    return Kampagne.objects.create(titel='Kampagne', spielleiter=alice, gruppe=gruppe)


@pytest.fixture
def session_morgen(kampagne):
    dt = datetime.now(dt_timezone.utc) + timedelta(days=1)
    return Session.objects.create(
        kampagne=kampagne, titel='Session 1', ort='Raum 42',
        datetime=dt, beschreibung='Testbeschreibung',
    )


@pytest.fixture
def teilnahme_alice(alice, session_morgen):
    return SessionTeilnahme.objects.create(
        spieler=alice, session=session_morgen,
        status=TeilnahmeStatusChoices.ZUGESAGT,
    )


class TestIcalTokenEndpoint:
    def test_unauthenticated_returns_401(self, client_anonym):
        response = client_anonym.get(URL_TOKEN)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_token_for_authenticated_user(self, client_anonym, alice):
        client_anonym.force_authenticate(user=alice)
        response = client_anonym.get(URL_TOKEN)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['ical_token'] == str(alice.ical_token)

    def test_token_is_valid_uuid(self, client_anonym, alice):
        client_anonym.force_authenticate(user=alice)
        response = client_anonym.get(URL_TOKEN)
        uuid.UUID(response.data['ical_token'])


class TestIcalFeed:
    def feed_url(self, token):
        return f'/api/ical/{token}/'

    def test_unknown_token_returns_404(self, client_anonym, db):
        response = client_anonym.get(self.feed_url(uuid.uuid4()))
        assert response.status_code == 404

    def test_valid_token_returns_200(self, client_anonym, alice):
        response = client_anonym.get(self.feed_url(alice.ical_token))
        assert response.status_code == 200

    def test_content_type_is_text_calendar(self, client_anonym, alice):
        response = client_anonym.get(self.feed_url(alice.ical_token))
        assert 'text/calendar' in response['Content-Type']

    def test_vcalendar_frame_present(self, client_anonym, alice):
        response = client_anonym.get(self.feed_url(alice.ical_token))
        content = response.content.decode()
        assert 'BEGIN:VCALENDAR' in content
        assert 'END:VCALENDAR' in content

    def test_session_appears_in_feed(self, client_anonym, alice, teilnahme_alice, session_morgen):
        response = client_anonym.get(self.feed_url(alice.ical_token))
        content = response.content.decode()
        assert f'UID:session-{session_morgen.id}@campaignconnect' in content

    def test_summary_contains_session_and_campaign_title(self, client_anonym, alice, teilnahme_alice, session_morgen):
        response = client_anonym.get(self.feed_url(alice.ical_token))
        content = response.content.decode()
        assert session_morgen.titel in content
        assert session_morgen.kampagne.titel in content

    def test_location_in_feed(self, client_anonym, alice, teilnahme_alice, session_morgen):
        response = client_anonym.get(self.feed_url(alice.ical_token))
        assert session_morgen.ort in response.content.decode()

    def test_no_vevent_without_participation(self, client_anonym, alice):
        response = client_anonym.get(self.feed_url(alice.ical_token))
        assert 'BEGIN:VEVENT' not in response.content.decode()

    def test_other_user_feed_excludes_alice_session(self, client_anonym, alice, bob, teilnahme_alice, session_morgen):
        response = client_anonym.get(self.feed_url(bob.ical_token))
        assert f'UID:session-{session_morgen.id}@campaignconnect' not in response.content.decode()
