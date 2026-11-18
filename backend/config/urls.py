from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from campainConnect.views import (
    register_user, me,
    users_list, user_rolle_setzen,
    kampagnen, kampagne_detail, kampagne_session_erstellen,
    kampagne_mitglieder, kampagne_mitglied_entfernen,
    benachrichtigungen_liste, benachrichtigung_loeschen,
    gruppen,
    community_kampagnen,
    einladungen,
    terminvorschlag_erstellen, terminvorschlaege_dm, termin_bestaetigen,
    termine_upcoming, termine_vergangen, termin_teilnahme, termin_bearbeiten,
    kampagne_umfrage_erstellen, umfragen_liste, umfrage_abstimmen, umfrage_finalisieren,
    kalender,
    spieler_suche, freunde_liste, freundschaftsanfragen,
    freundschaft_erstellen, freundschaft_detail,
    kampagne_anfragen, beitrittsanfragen_liste, beitrittsanfrage_bearbeiten,
    ical_token_get, ical_feed,
)

urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    path("admin/", admin.site.urls),

    # Auth
    path("api/token/",            TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/",    TokenRefreshView.as_view(),    name="token_refresh"),
    path("api/register/",         register_user,                 name="register"),
    path("api/me/",               me,                            name="me"),

    # User-Verwaltung
    path("api/users/",            users_list,                    name="users_list"),
    path("api/users/<int:pk>/rolle/", user_rolle_setzen,         name="user_rolle_setzen"),

    # Gruppen
    path("api/gruppen/",          gruppen,           name="gruppen"),

    # Community
    path("api/community/",            community_kampagnen, name="community_kampagnen"),

    # Kampagnen
    path("api/kampagnen/",            kampagnen,        name="kampagnen"),
    path("api/kampagnen/<int:pk>/",   kampagne_detail,  name="kampagne_detail"),
    path("api/kampagnen/<int:pk>/sessions/", kampagne_session_erstellen, name="kampagne_session_erstellen"),
    path("api/kampagnen/<int:pk>/mitglieder/", kampagne_mitglieder, name="kampagne_mitglieder"),
    path("api/kampagnen/<int:pk>/mitglieder/<int:spieler_pk>/", kampagne_mitglied_entfernen, name="kampagne_mitglied_entfernen"),
    path("api/benachrichtigungen/", benachrichtigungen_liste, name="benachrichtigungen_liste"),
    path("api/benachrichtigungen/<int:pk>/", benachrichtigung_loeschen, name="benachrichtigung_loeschen"),

    # Einladungen & Terminvorschläge
    path("api/einladungen/",                         einladungen,             name="einladungen"),
    path("api/kampagnen/<int:pk>/terminvorschlag/",  terminvorschlag_erstellen, name="terminvorschlag_erstellen"),
    path("api/terminvorschlaege/",                   terminvorschlaege_dm,    name="terminvorschlaege_dm"),
    path("api/termine/<int:pk>/bestaetigen/",        termin_bestaetigen,      name="termin_bestaetigen"),

    # Termine / Sessions
    path("api/termine/",              termine_upcoming,  name="termine_upcoming"),
    path("api/termine/vergangen/",    termine_vergangen, name="termine_vergangen"),
    path("api/termine/<int:pk>/teilnahme/", termin_teilnahme, name="termin_teilnahme"),
    path("api/termine/<int:pk>/", termin_bearbeiten, name="termin_bearbeiten"),

    # Terminumfragen
    path("api/kampagnen/<int:pk>/umfragen/", kampagne_umfrage_erstellen, name="kampagne_umfrage_erstellen"),
    path("api/umfragen/",                    umfragen_liste,             name="umfragen_liste"),
    path("api/umfragen/<int:pk>/abstimmen/", umfrage_abstimmen,          name="umfrage_abstimmen"),
    path("api/umfragen/<int:pk>/finalisieren/", umfrage_finalisieren,    name="umfrage_finalisieren"),

    # Kalender
    path("api/kalender/",             kalender,          name="kalender"),

    # Beitrittsanfragen
    path("api/kampagnen/<int:pk>/anfragen/",      kampagne_anfragen,            name="kampagne_anfragen"),
    path("api/beitrittsanfragen/",                beitrittsanfragen_liste,      name="beitrittsanfragen_liste"),
    path("api/beitrittsanfragen/<int:pk>/",       beitrittsanfrage_bearbeiten,  name="beitrittsanfrage_bearbeiten"),

    # iCal
    path("api/me/ical-token/",                 ical_token_get,        name="ical_token_get"),
    path("api/ical/<uuid:token>/",             ical_feed,             name="ical_feed"),

    # Freundschaften
    path("api/spieler/",                       spieler_suche,         name="spieler_suche"),
    path("api/freunde/",                       freunde_liste,         name="freunde_liste"),
    path("api/freundschaftsanfragen/",         freundschaftsanfragen, name="freundschaftsanfragen"),
    path("api/freundschaften/",                freundschaft_erstellen, name="freundschaft_erstellen"),
    path("api/freundschaften/<int:pk>/",       freundschaft_detail,    name="freundschaft_detail"),
]
