"""
API-Integrationstests für das Freundschafts-Feature (Endpunkte unter /api/).
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from ...models import Freundschaft, FreundschaftStatusChoices, Spieler


# ─────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────

@pytest.fixture
def alice(db):
    return Spieler.objects.create_user(username='alice', password='x')


@pytest.fixture
def bob(db):
    return Spieler.objects.create_user(username='bob', password='x')


@pytest.fixture
def carol(db):
    return Spieler.objects.create_user(username='carol', password='x')


@pytest.fixture
def client_alice(alice):
    c = APIClient()
    c.force_authenticate(user=alice)
    return c


@pytest.fixture
def client_bob(bob):
    c = APIClient()
    c.force_authenticate(user=bob)
    return c


# ─────────────────────────────────────────
# API-TESTS
# ─────────────────────────────────────────

class TestSpielerSucheEndpoint:
    URL = '/api/spieler/'

    def test_unauthenticated_geht_nicht(self, alice):
        resp = APIClient().get(self.URL, {'q': 'a'})
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_findet_per_teilstring_case_insensitive(self, client_alice, bob):
        # bob's username ist 'bob'
        resp = client_alice.get(self.URL, {'q': 'BO'})
        assert resp.status_code == status.HTTP_200_OK
        usernames = [u['username'] for u in resp.data]
        assert 'bob' in usernames

    def test_schliesst_eigenen_user_aus(self, client_alice, alice, bob):
        resp = client_alice.get(self.URL, {'q': 'a'})  # 'alice' enthält 'a'
        usernames = [u['username'] for u in resp.data]
        assert 'alice' not in usernames

    def test_leere_query_liefert_leer(self, client_alice):
        resp = client_alice.get(self.URL, {'q': ''})
        assert resp.data == []

    def test_beziehung_status_wird_mitgeliefert(self, client_alice, alice, bob):
        Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        resp = client_alice.get(self.URL, {'q': 'bob'})
        bob_entry = next(u for u in resp.data if u['username'] == 'bob')
        assert bob_entry['beziehung_status'] == 'ausstehend'

    def test_beziehung_status_null_ohne_beziehung(self, client_alice, bob):
        resp = client_alice.get(self.URL, {'q': 'bob'})
        bob_entry = next(u for u in resp.data if u['username'] == 'bob')
        assert bob_entry['beziehung_status'] is None


class TestFreundeListeEndpoint:
    URL = '/api/freunde/'

    def test_liefert_nur_angenommene(self, client_alice, alice, bob, carol):
        Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice,
                                     status=FreundschaftStatusChoices.ANGENOMMEN)
        Freundschaft.objects.create(user_a=alice, user_b=carol, initiator=alice,
                                     status=FreundschaftStatusChoices.AUSSTEHEND)
        resp = client_alice.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        usernames = [f['spieler']['username'] for f in resp.data]
        assert usernames == ['bob']

    def test_zeigt_jeweils_anderen_user(self, client_bob, alice, bob):
        Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice,
                                     status=FreundschaftStatusChoices.ANGENOMMEN)
        resp = client_bob.get(self.URL)
        assert resp.data[0]['spieler']['username'] == 'alice'


class TestAnfragenEndpoint:
    URL = '/api/freundschaftsanfragen/'

    def test_eingehende_anfragen_werden_geliefert(self, client_bob, alice, bob):
        Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        resp = client_bob.get(self.URL)
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data) == 1
        assert resp.data[0]['initiator']['username'] == 'alice'

    def test_eigene_gesendete_anfragen_nicht_dabei(self, client_alice, alice, bob):
        Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        resp = client_alice.get(self.URL)
        assert resp.data == []

    def test_angenommene_nicht_in_anfragen(self, client_bob, alice, bob):
        Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice,
                                     status=FreundschaftStatusChoices.ANGENOMMEN)
        resp = client_bob.get(self.URL)
        assert resp.data == []


class TestFreundschaftErstellen:
    URL = '/api/freundschaften/'

    def test_anfrage_erstellen_erfolgreich(self, client_alice, alice, bob):
        resp = client_alice.post(self.URL, {'empfaenger_id': bob.id}, format='json')
        assert resp.status_code == status.HTTP_201_CREATED
        f = Freundschaft.objects.get(pk=resp.data['id'])
        assert f.initiator_id == alice.id
        assert f.status == FreundschaftStatusChoices.AUSSTEHEND

    def test_an_sich_selbst_400(self, client_alice, alice):
        resp = client_alice.post(self.URL, {'empfaenger_id': alice.id}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_unbekannter_empfaenger_404(self, client_alice):
        resp = client_alice.post(self.URL, {'empfaenger_id': 99999}, format='json')
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_duplikat_400(self, client_alice, alice, bob):
        Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        resp = client_alice.post(self.URL, {'empfaenger_id': bob.id}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_duplikat_andersrum_400(self, client_alice, alice, bob):
        """Auch wenn Bob bereits Alice angefragt hat, darf Alice nicht nochmal anfragen."""
        Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=bob)
        resp = client_alice.post(self.URL, {'empfaenger_id': bob.id}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_fehlende_empfaenger_id_400(self, client_alice):
        resp = client_alice.post(self.URL, {}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


class TestFreundschaftDetail:
    def url(self, pk):
        return f'/api/freundschaften/{pk}/'

    def test_empfaenger_kann_annehmen(self, client_bob, alice, bob):
        f = Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        resp = client_bob.put(self.url(f.id), {'aktion': 'annehmen'}, format='json')
        assert resp.status_code == status.HTTP_200_OK
        f.refresh_from_db()
        assert f.status == FreundschaftStatusChoices.ANGENOMMEN
        assert f.angenommen_am is not None

    def test_initiator_kann_eigene_anfrage_nicht_annehmen(self, client_alice, alice, bob):
        f = Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        resp = client_alice.put(self.url(f.id), {'aktion': 'annehmen'}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_aussenstehender_kann_nicht_annehmen(self, client_alice, alice, bob, carol):
        f = Freundschaft.objects.create(user_a=bob, user_b=carol, initiator=bob)
        resp = client_alice.put(self.url(f.id), {'aktion': 'annehmen'}, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_ungueltige_aktion_400(self, client_bob, alice, bob):
        f = Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        resp = client_bob.put(self.url(f.id), {'aktion': 'foo'}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_bereits_angenommen_kann_nicht_nochmal(self, client_bob, alice, bob):
        f = Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice,
                                         status=FreundschaftStatusChoices.ANGENOMMEN)
        resp = client_bob.put(self.url(f.id), {'aktion': 'annehmen'}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_beteiligter_kann_loeschen(self, client_alice, alice, bob):
        f = Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice,
                                         status=FreundschaftStatusChoices.ANGENOMMEN)
        resp = client_alice.delete(self.url(f.id))
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not Freundschaft.objects.filter(pk=f.id).exists()

    def test_initiator_kann_eigene_anfrage_zurueckziehen(self, client_alice, alice, bob):
        f = Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        resp = client_alice.delete(self.url(f.id))
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    def test_empfaenger_kann_anfrage_ablehnen_per_delete(self, client_bob, alice, bob):
        f = Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        resp = client_bob.delete(self.url(f.id))
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    def test_aussenstehender_kann_nicht_loeschen(self, client_alice, alice, bob, carol):
        f = Freundschaft.objects.create(user_a=bob, user_b=carol, initiator=bob)
        resp = client_alice.delete(self.url(f.id))
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_nicht_existierend_404(self, client_alice):
        resp = client_alice.delete(self.url(99999))
        assert resp.status_code == status.HTTP_404_NOT_FOUND
