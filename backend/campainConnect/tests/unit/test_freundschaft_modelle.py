"""
Modell- und Serializer-Unit-Tests für das Freundschafts-Feature.
"""
import pytest
from django.core.exceptions import ValidationError
from rest_framework.test import APIRequestFactory

from ...models import Freundschaft, FreundschaftStatusChoices, Spieler
from ...serializers import (
    FreundSerializer,
    FreundschaftsanfrageSerializer,
    SpielerKurzSerializer,
    SpielerSucheSerializer,
)


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
def request_factory():
    return APIRequestFactory()


# ─────────────────────────────────────────
# MODELL-TESTS: Freundschaft
# ─────────────────────────────────────────

class TestFreundschaftModel:
    def test_user_a_und_b_werden_sortiert(self, alice, bob):
        """user_a soll immer die kleinere ID haben, egal in welcher Reihenfolge übergeben."""
        f = Freundschaft.objects.create(user_a=bob, user_b=alice, initiator=bob)
        assert f.user_a_id == min(alice.id, bob.id)
        assert f.user_b_id == max(alice.id, bob.id)

    def test_initiator_wird_unabhaengig_von_sortierung_gespeichert(self, alice, bob):
        f = Freundschaft.objects.create(user_a=bob, user_b=alice, initiator=bob)
        assert f.initiator_id == bob.id

    def test_default_status_ist_ausstehend(self, alice, bob):
        f = Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        assert f.status == FreundschaftStatusChoices.AUSSTEHEND

    def test_selbst_freundschaft_nicht_erlaubt(self, alice):
        with pytest.raises(ValidationError):
            Freundschaft.objects.create(user_a=alice, user_b=alice, initiator=alice)

    def test_initiator_muss_beteiligt_sein(self, alice, bob, carol):
        with pytest.raises(ValidationError):
            Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=carol)

    def test_duplikat_in_beide_richtungen_verhindert(self, alice, bob):
        """A→B und B→A dürfen nicht parallel existieren — die Sortierung macht beide identisch,
        und full_clean() im save() fängt das Duplikat schon vor dem DB-Insert ab."""
        Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        with pytest.raises(ValidationError):
            Freundschaft.objects.create(user_a=bob, user_b=alice, initiator=bob)


# ─────────────────────────────────────────
# SERIALIZER-TESTS
# ─────────────────────────────────────────

class TestFreundschaftSerializer:
    def test_spieler_kurz_serializer_felder(self, alice):
        data = SpielerKurzSerializer(alice).data
        assert data['id'] == alice.id
        assert data['username'] == 'alice'
        assert data['avatarId'] == alice.id

    def test_freund_serializer_gibt_anderen_spieler_zurueck(self, alice, bob, request_factory):
        """Aus Sicht von alice: spieler-Feld muss bob enthalten, nicht alice."""
        f = Freundschaft.objects.create(
            user_a=alice, user_b=bob, initiator=alice,
            status=FreundschaftStatusChoices.ANGENOMMEN,
        )
        request = request_factory.get('/')
        request.user = alice
        data = FreundSerializer(f, context={'request': request}).data
        assert data['spieler']['username'] == 'bob'
        assert data['id'] == f.id

    def test_freund_serializer_perspektive_andersrum(self, alice, bob, request_factory):
        """Aus Sicht von bob: spieler-Feld muss alice enthalten."""
        f = Freundschaft.objects.create(
            user_a=alice, user_b=bob, initiator=alice,
            status=FreundschaftStatusChoices.ANGENOMMEN,
        )
        request = request_factory.get('/')
        request.user = bob
        data = FreundSerializer(f, context={'request': request}).data
        assert data['spieler']['username'] == 'alice'

    def test_anfrage_serializer_enthaelt_initiator(self, alice, bob):
        f = Freundschaft.objects.create(user_a=alice, user_b=bob, initiator=alice)
        data = FreundschaftsanfrageSerializer(f).data
        assert data['initiator']['username'] == 'alice'
        assert data['id'] == f.id

    def test_suche_serializer_uebernimmt_beziehung_status_aus_context(self, bob):
        ctx = {'beziehungs_map': {bob.id: 'angenommen'}}
        data = SpielerSucheSerializer(bob, context=ctx).data
        assert data['beziehung_status'] == 'angenommen'

    def test_suche_serializer_status_none_wenn_keine_beziehung(self, bob):
        data = SpielerSucheSerializer(bob, context={'beziehungs_map': {}}).data
        assert data['beziehung_status'] is None
