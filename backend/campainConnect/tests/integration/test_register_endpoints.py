import pytest
from rest_framework import status
from rest_framework.test import APIClient

from ...models import Spieler

@pytest.fixture
def client_anonym():
    return APIClient()

@pytest.fixture
def existierender_spieler(db):
    return Spieler.objects.create_user(
        username='tes_user',
        password='passwort123',
        email='test@test.com',
    )

URL = '/api/register/'
VALIDATE_DATA = {
    'username': 'new_user',
    'password': 'passwort123',
    'email': 'new@test.com',
}

class TestRegisterErfolg:
    def test_valid_request_http_201(self, client_anonym, db):
        response = client_anonym.post(URL, VALIDATE_DATA, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_spieler_in_db_angelegt(self, client_anonym, db):
        response = client_anonym.post(URL, VALIDATE_DATA, format='json')
        assert Spieler.objects.filter(username=VALIDATE_DATA['username']).exists()

    def test_passwort_is_hasehd(self, client_anonym,db):
        response = client_anonym.post(URL, VALIDATE_DATA, format='json')
        spieler = Spieler.objects.get(username=VALIDATE_DATA['username'])
        assert spieler.password != VALIDATE_DATA['password']

class TestEingabeValidierung:
    def test_fehlender_username(self, client_anonym, db):
        data = VALIDATE_DATA.copy()
        del data['username']
        response = client_anonym.post(URL, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_fehlendes_passwort(self, client_anonym, db):
        data = VALIDATE_DATA.copy()
        del data['password']
        response = client_anonym.post(URL, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_fehlende_email(self, client_anonym, db):
        data = VALIDATE_DATA.copy()
        del data['email']
        response = client_anonym.post(URL, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_empty_request(self, client_anonym, db):
        response = client_anonym.post(URL, {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_username_leerstring(self, client_anonym, db):
        data = VALIDATE_DATA.copy()
        data['username'] = ''
        response = client_anonym.post(URL, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

class TestDuplikate:
    def test_user_schon_vorhanden(self, client_anonym, existierender_spieler):
        data = VALIDATE_DATA.copy()
        data['username'] = existierender_spieler.username
        response = client_anonym.post(URL, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Spieler.objects.count() == 1

    def test_email_schon_vorhanden(self, client_anonym, existierender_spieler):
        data = VALIDATE_DATA.copy()
        data['email'] = existierender_spieler.email
        response = client_anonym.post(URL, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Spieler.objects.count() == 1

    @pytest.mark.xfail(reason="View nutzt aktuell case-sensitive Vergleich (filter(username=...)); " \
    "im Team klären, ob 'Admin' und 'admin' als gleich gelten sollen.")
    def test_username_casesensitiv(self, client_anonym, existierender_spieler):
        data = VALIDATE_DATA.copy()
        data['username'] = existierender_spieler.username.upper()
        response = client_anonym.post(URL, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Spieler.objects.count() == 1

    @pytest.mark.xfail(reason="View nutzt aktuell case-sensitive Vergleich" \
    "Mail s sollten in der Regel case-insensitive verglichen werden; im Team klären")
    def test_email_casesensitiv(self, client_anonym, existierender_spieler):
        data = VALIDATE_DATA.copy()
        data['email'] = existierender_spieler.email.upper()
        response = client_anonym.post(URL, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Spieler.objects.count() == 1