from datetime import timedelta
import datetime

from django.db import models
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import (
    Spieler, Kampagne, Gruppe, Gruppenmitgliedschaft, Session, SessionTeilnahme,
    Freundschaft, Beitrittsanfrage, Benachrichtigung,
    Terminumfrage, Umfrageoption, Umfragestimme,
    RolleChoices, ErfahrungChoices, TeilnahmeStatusChoices, TeilnahmeRolleChoices,
    FreundschaftStatusChoices, BeitrittsanfrageStatusChoices,
)
from .serializers import (
    KampagneErstellenSerializer, KampagneSerializer, EinladungSerializer,
    SessionErstellenSerializer, TerminSerializer,
    SpielerSucheSerializer, FreundSerializer, FreundschaftsanfrageSerializer,
    _parse_datum, _parse_time,
)


# ─────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────

@api_view(['POST'])
def register_user(request):
    data = request.data
    username = data.get('username', '').strip()
    password = data.get('password', '')
    email    = data.get('email', '').strip()

    if not username or not password or not email:
        return Response({'error': 'Benutzername, Passwort und E-Mail sind erforderlich.'}, status=status.HTTP_400_BAD_REQUEST)
    if Spieler.objects.filter(username__iexact=username).exists():
        return Response({'error': 'Benutzername bereits vergeben.'}, status=status.HTTP_400_BAD_REQUEST)
    if Spieler.objects.filter(email__iexact=email).exists():
        return Response({'error': 'E-Mail-Adresse bereits vergeben.'}, status=status.HTTP_400_BAD_REQUEST)

    Spieler.objects.create_user(username=username.lower(), password=password, email=email.lower())
    return Response({'message': 'Registrierung erfolgreich.'}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user

    if request.method in ('PUT', 'PATCH'):
        data = request.data

        if 'rolle' in data:
            neue_rolle = data.get('rolle', '').strip()
            if neue_rolle not in (RolleChoices.SPIELER, RolleChoices.SPIELLEITER, RolleChoices.BEIDES):
                return Response({'error': 'Ungültige Rolle.'}, status=status.HTTP_400_BAD_REQUEST)
            u.rolle = neue_rolle

        if 'erfahrung' in data:
            neue_erfahrung = data.get('erfahrung', '').strip()
            if neue_erfahrung and neue_erfahrung not in ErfahrungChoices.values:
                return Response({'error': 'Ungültige Erfahrungsstufe.'}, status=status.HTTP_400_BAD_REQUEST)
            u.erfahrung = neue_erfahrung or None

        if 'timezone' in data:
            neue_timezone = data.get('timezone', '').strip()
            max_len = Spieler._meta.get_field('timezone').max_length
            if len(neue_timezone) > max_len:
                return Response({'error': f'Zeitzone darf höchstens {max_len} Zeichen lang sein.'}, status=status.HTTP_400_BAD_REQUEST)
            u.timezone = neue_timezone or u.timezone

        u.save()

    return Response({
        'id':           u.id,
        'username':     u.username,
        'email':        u.email,
        'rolle':        u.rolle,
        'erfahrung':    u.erfahrung,
        'timezone':     u.timezone,
        'is_superuser': u.is_superuser,
    })


# ─────────────────────────────────────────
# USER-VERWALTUNG
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list(request):
    if not (request.user.is_superuser or request.user.rolle == RolleChoices.ADMIN):
        return Response({'error': 'Keine Berechtigung.'}, status=status.HTTP_403_FORBIDDEN)
    users = Spieler.objects.all().values('id', 'username', 'email', 'rolle', 'is_superuser')
    return Response(list(users))


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def user_rolle_setzen(request, pk):
    caller     = request.user
    neue_rolle = request.data.get('rolle', '').strip()

    if caller.is_superuser:
        erlaubte_rollen = [RolleChoices.SPIELER, RolleChoices.SPIELLEITER, RolleChoices.ADMIN]
    elif caller.rolle == RolleChoices.ADMIN:
        erlaubte_rollen = [RolleChoices.SPIELER, RolleChoices.SPIELLEITER]
    else:
        return Response({'error': 'Keine Berechtigung.'}, status=status.HTTP_403_FORBIDDEN)

    if neue_rolle not in erlaubte_rollen:
        return Response(
            {'error': f'Ungültige Rolle. Erlaubt: {[r.value for r in erlaubte_rollen]}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        ziel_user = Spieler.objects.get(pk=pk)
    except Spieler.DoesNotExist:
        return Response({'error': 'Nutzer nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    if ziel_user.is_superuser:
        return Response({'error': 'Superadmins können nicht verändert werden.'}, status=status.HTTP_403_FORBIDDEN)

    ziel_user.rolle = neue_rolle
    ziel_user.save()
    return Response({'message': f'Rolle von {ziel_user.username} auf "{neue_rolle}" gesetzt.'})


# ─────────────────────────────────────────
# COMMUNITY (öffentliche Kampagnen)
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def community_kampagnen(request):
    # Nur verfügbare Kampagnen zeigen: eigene, bereits beigetretene und
    # bereits angefragte werden ausgeblendet.
    eigene_gruppen = Gruppenmitgliedschaft.objects.filter(
        spieler=request.user
    ).values_list('gruppe_id', flat=True)
    angefragte = Beitrittsanfrage.objects.filter(
        spieler=request.user
    ).values_list('kampagne_id', flat=True)

    qs = (
        Kampagne.objects
        .filter(ist_privat=False, status='aktiv')
        .exclude(spielleiter=request.user)
        .exclude(gruppe_id__in=eigene_gruppen)
        .exclude(id__in=angefragte)
        .select_related('gruppe', 'spielleiter')
        .prefetch_related('sessions', 'gruppe__mitgliedschaften')
        .order_by('-id')
    )
    result = []
    for k in qs:
        first_session = k.sessions.order_by('datetime').first()
        members_count = k.gruppe.mitgliedschaften.count()
        result.append({
            'id':    k.id,
            'title': k.titel,
            'desc':  k.beschreibung,
            'plaetze': {
                'full':  members_count,
                'total': k.gruppe.max_spieler or 5,
            },
            'sessions':  k.sessions.count(),
            'date':      k.start_date.strftime('%d.%m.%Y') if k.start_date else 'Noch offen',
            'time':      first_session.datetime.strftime('%H:%M') if first_session else '–',
            'ort':       (first_session.ort if first_session and first_session.ort else k.meeting_format),
            'host':      k.spielleiter.username if k.spielleiter else '–',
            'hostTag':   'Dungeon Master',
            'kampagnengroesse': k.kampagnengroesse,
            'sprache':   k.sprache,
            'modus':     k.meeting_format,
        })
    return Response(result)


# ─────────────────────────────────────────
# KAMPAGNEN
# ─────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def kampagnen(request):
    if request.method == 'GET':
        qs = Kampagne.objects.filter(spielleiter=request.user).select_related('gruppe', 'spielleiter')
        return Response(KampagneSerializer(qs, many=True).data)

    serializer = KampagneErstellenSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    kampagne = serializer.save()
    return Response(KampagneSerializer(kampagne).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def kampagne_detail(request, pk):
    try:
        kampagne = Kampagne.objects.select_related('gruppe', 'spielleiter').get(pk=pk, spielleiter=request.user)
    except Kampagne.DoesNotExist:
        return Response({'error': 'Kampagne nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(KampagneSerializer(kampagne).data)

    if request.method == 'PUT':
        for field in ['titel', 'beschreibung', 'sonstiges', 'status', 'start_date']:
            if field in request.data:
                setattr(kampagne, field, request.data[field])
        kampagne.save()
        return Response(KampagneSerializer(kampagne).data)

    kampagne.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kampagne_mitglieder(request, pk):
    """Mitglieder der Gruppe einer Kampagne. Nur der Spielleiter sieht sie."""
    try:
        kampagne = Kampagne.objects.select_related('gruppe', 'spielleiter').get(pk=pk, spielleiter=request.user)
    except Kampagne.DoesNotExist:
        return Response({'error': 'Kampagne nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    mitglieder = (
        Gruppenmitgliedschaft.objects
        .filter(gruppe=kampagne.gruppe)
        .select_related('spieler')
        .order_by('mitglied_seit')
    )
    return Response([
        {
            'spieler_id':      m.spieler_id,
            'username':        m.spieler.username,
            'rolle':           m.rolle,
            'ist_spielleiter': m.spieler_id == kampagne.spielleiter_id,
        }
        for m in mitglieder
    ])


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def kampagne_mitglied_entfernen(request, pk, spieler_pk):
    """Entfernt ein Mitglied aus der Gruppe einer Kampagne (nur Spielleiter)."""
    try:
        kampagne = Kampagne.objects.select_related('gruppe').get(pk=pk, spielleiter=request.user)
    except Kampagne.DoesNotExist:
        return Response({'error': 'Kampagne nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    if spieler_pk == kampagne.spielleiter_id:
        return Response({'error': 'Der Spielleiter kann sich nicht selbst entfernen.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        mitgliedschaft = Gruppenmitgliedschaft.objects.get(gruppe=kampagne.gruppe, spieler_id=spieler_pk)
    except Gruppenmitgliedschaft.DoesNotExist:
        return Response({'error': 'Mitglied nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    mitgliedschaft.delete()
    # alte Beitrittsanfrage entfernen, damit der Spieler erneut beitreten kann
    Beitrittsanfrage.objects.filter(kampagne=kampagne, spieler_id=spieler_pk).delete()
    Benachrichtigung.objects.create(
        empfaenger_id=spieler_pk,
        text=f'Du wurdest von {request.user.username} aus der Kampagne „{kampagne.titel}" entfernt.',
    )
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def benachrichtigungen_liste(request):
    """Benachrichtigungen des eingeloggten Nutzers."""
    qs = Benachrichtigung.objects.filter(empfaenger=request.user)
    return Response([
        {
            'id':          b.id,
            'text':        b.text,
            'gelesen':     b.gelesen,
            'erstellt_am': b.erstellt_am.strftime('%d.%m.%Y %H:%M'),
        }
        for b in qs
    ])


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def benachrichtigung_loeschen(request, pk):
    """Entfernt eine Benachrichtigung des eingeloggten Nutzers."""
    try:
        b = Benachrichtigung.objects.get(pk=pk, empfaenger=request.user)
    except Benachrichtigung.DoesNotExist:
        return Response({'error': 'Benachrichtigung nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)
    b.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────
# TERMINE (SESSIONS)
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def termine_upcoming(request):
    """Alle zukünftigen Sessions aus den Gruppen des eingeloggten Nutzers."""
    gruppen_ids = Gruppenmitgliedschaft.objects.filter(spieler=request.user).values_list('gruppe_id', flat=True)
    sessions = (
        Session.objects
        .filter(kampagne__gruppe_id__in=gruppen_ids, datetime__gte=timezone.now())
        .select_related('kampagne__gruppe', 'kampagne__spielleiter')
        .prefetch_related('teilnahmen__spieler')
        .order_by('datetime')
    )
    return Response(TerminSerializer(sessions, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def termine_vergangen(request):
    """Alle vergangenen Sessions aus den Gruppen des eingeloggten Nutzers."""
    gruppen_ids = Gruppenmitgliedschaft.objects.filter(spieler=request.user).values_list('gruppe_id', flat=True)
    sessions = (
        Session.objects
        .filter(kampagne__gruppe_id__in=gruppen_ids, datetime__lt=timezone.now())
        .select_related('kampagne__gruppe', 'kampagne__spielleiter')
        .prefetch_related('teilnahmen__spieler')
        .order_by('-datetime')
    )
    return Response(TerminSerializer(sessions, many=True, context={'request': request}).data)


@api_view(['POST', 'PUT'])
@permission_classes([IsAuthenticated])
def termin_teilnahme(request, pk):
    """Zusagen / Absagen / Komme später für eine Session."""
    try:
        session = Session.objects.get(pk=pk)
    except Session.DoesNotExist:
        return Response({'error': 'Session nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    aktion = request.data.get('aktion', '').strip()
    mapping = {
        'zusagen':        TeilnahmeStatusChoices.ZUGESAGT,
        'absagen':        TeilnahmeStatusChoices.ABGESAGT,
        'kommt_spaeter':  TeilnahmeStatusChoices.KOMMT_SPAETER,
    }
    if aktion not in mapping:
        return Response(
            {'error': 'Ungültige Aktion. Erlaubt: zusagen, absagen, kommt_spaeter'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    teilnahme, _ = SessionTeilnahme.objects.get_or_create(
        session=session,
        spieler=request.user,
        defaults={'status': TeilnahmeStatusChoices.AUSSTEHEND},
    )
    teilnahme.status = mapping[aktion]
    teilnahme.save()
    return Response({'status': teilnahme.status})


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def termin_bearbeiten(request, pk):
    """Bearbeitet oder löscht eine Session. Nur der Spielleiter der Kampagne darf das."""
    try:
        session = Session.objects.select_related('kampagne').get(pk=pk, kampagne__spielleiter=request.user)
    except Session.DoesNotExist:
        return Response({'error': 'Termin nicht gefunden oder keine Berechtigung.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if 'titel' in request.data:
        titel = request.data['titel'].strip()
        if not titel:
            return Response({'error': 'Der Titel darf nicht leer sein.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(titel) > 255:
            return Response({'error': 'Der Titel darf höchstens 255 Zeichen lang sein.'}, status=status.HTTP_400_BAD_REQUEST)
        session.titel = titel
    if 'beschreibung' in request.data:
        session.beschreibung = request.data['beschreibung']
    if 'ort' in request.data:
        ort = request.data['ort']
        if len(ort) > 255:
            return Response({'error': 'Der Ort darf höchstens 255 Zeichen lang sein.'}, status=status.HTTP_400_BAD_REQUEST)
        session.ort = ort

    session.save(update_fields=['titel', 'beschreibung', 'ort'])
    return Response(TerminSerializer(session, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gruppen(request):
    """Alle Gruppen in denen der Nutzer Mitglied oder Ersteller ist."""
    mitglied_ids = Gruppenmitgliedschaft.objects.filter(spieler=request.user).values_list('gruppe_id', flat=True)
    qs = Gruppe.objects.filter(
        models.Q(id__in=mitglied_ids) | models.Q(erstellt_von=request.user)
    ).distinct().prefetch_related('mitgliedschaften__spieler')
    mitgliedschaft_rollen = {
        m.gruppe_id: m.rolle
        for m in Gruppenmitgliedschaft.objects.filter(spieler=request.user, gruppe_id__in=mitglied_ids)
    }
    result = [
        {
            'id': g.id,
            'name': g.name,
            # .all() statt .count()/.values_list() nutzt den prefetch_related-Cache
            'members': len(g.mitgliedschaften.all()),
            'membersList': [m.spieler.username for m in g.mitgliedschaften.all()],
            'rolle': mitgliedschaft_rollen.get(g.id, 'spielleiter' if g.erstellt_von == request.user else 'spieler'),
        }
        for g in qs
    ]
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kampagne_session_erstellen(request, pk):
    """Neue Session zu einer bestehenden Kampagne hinzufügen (nur Spielleiter)."""
    try:
        kampagne = Kampagne.objects.select_related('gruppe').get(pk=pk, spielleiter=request.user)
    except Kampagne.DoesNotExist:
        return Response({'error': 'Kampagne nicht gefunden oder keine Berechtigung.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = SessionErstellenSerializer(data=request.data, context={'request': request, 'kampagne': kampagne})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    session = serializer.save()
    return Response(TerminSerializer(session, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def einladungen(request):
    """Offene Termineinladungen: künftige Sessions aus den Gruppen des Nutzers,
    bei denen er nicht der DM ist und noch nicht zu-/abgesagt hat."""
    gruppen_ids = Gruppenmitgliedschaft.objects.filter(spieler=request.user).values_list('gruppe_id', flat=True)
    kandidaten = (
        Session.objects
        .filter(kampagne__gruppe_id__in=gruppen_ids, datetime__gte=timezone.now(), ist_vorschlag=False)
        .exclude(kampagne__spielleiter=request.user)
        .select_related('kampagne__gruppe', 'kampagne__spielleiter')
        .prefetch_related('teilnahmen__spieler')
        .order_by('datetime')
    )
    # nur Sessions, auf die der Nutzer noch nicht reagiert hat (keine Zeile oder ausstehend)
    sessions = []
    for s in kandidaten:
        t = next((x for x in s.teilnahmen.all() if x.spieler_id == request.user.id), None)
        if t is None or t.status == TeilnahmeStatusChoices.AUSSTEHEND:
            sessions.append(s)
    return Response(EinladungSerializer(sessions, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def terminvorschlag_erstellen(request, pk):
    """Spieler schlägt einen Termin für eine Kampagne vor."""
    try:
        kampagne = Kampagne.objects.select_related('gruppe').get(pk=pk)
    except Kampagne.DoesNotExist:
        return Response({'error': 'Kampagne nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    if not Gruppenmitgliedschaft.objects.filter(gruppe=kampagne.gruppe, spieler=request.user).exists():
        return Response({'error': 'Du bist kein Mitglied dieser Gruppe.'}, status=status.HTTP_403_FORBIDDEN)

    if kampagne.spielleiter == request.user:
        return Response({'error': 'Als Spielleiter nutze POST /api/kampagnen/<id>/sessions/.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = SessionErstellenSerializer(data=request.data, context={'request': request, 'kampagne': kampagne})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    session = serializer.save()
    session.ist_vorschlag = True
    session.save()
    return Response(TerminSerializer(session, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def terminvorschlaege_dm(request):
    """DM sieht alle offenen Terminvorschläge für seine Kampagnen."""
    sessions = (
        Session.objects
        .filter(kampagne__spielleiter=request.user, ist_vorschlag=True)
        .select_related('kampagne__gruppe', 'kampagne__spielleiter')
        .prefetch_related('teilnahmen__spieler')
        .order_by('datetime')
    )
    return Response(TerminSerializer(sessions, many=True, context={'request': request}).data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def termin_bestaetigen(request, pk):
    """DM bestätigt oder lehnt einen Terminvorschlag ab."""
    try:
        session = Session.objects.select_related('kampagne__gruppe').get(
            pk=pk, kampagne__spielleiter=request.user, ist_vorschlag=True
        )
    except Session.DoesNotExist:
        return Response({'error': 'Terminvorschlag nicht gefunden oder keine Berechtigung.'}, status=status.HTTP_404_NOT_FOUND)

    aktion = request.data.get('aktion', '').strip()
    if aktion == 'bestaetigen':
        session.ist_vorschlag = False
        session.save()
        for mitglied in session.kampagne.gruppe.mitgliedschaften.exclude(spieler=session.kampagne.spielleiter):
            SessionTeilnahme.objects.get_or_create(
                session=session,
                spieler=mitglied.spieler,
                defaults={'status': TeilnahmeStatusChoices.AUSSTEHEND, 'rolle': TeilnahmeRolleChoices.SPIELER},
            )
        return Response(TerminSerializer(session, context={'request': request}).data)
    elif aktion == 'ablehnen':
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    else:
        return Response(
            {'error': 'Ungültige Aktion. Erlaubt: bestaetigen, ablehnen'},
            status=status.HTTP_400_BAD_REQUEST,
        )


# ─────────────────────────────────────────
# TERMINUMFRAGEN (Abstimmung über mehrere Optionen)
# ─────────────────────────────────────────

def _umfrage_to_dict(umfrage):
    """Bringt eine Umfrage in das Format, das die PollCard im Frontend erwartet."""
    optionen = []
    for o in umfrage.optionen.all():
        voters = [s.spieler.username for s in o.stimmen.all()]
        bis = f'–{o.bis.strftime("%H:%M")}' if o.bis else ''
        optionen.append({
            'id':     str(o.id),
            'label':  f'{o.datum.strftime("%d.%m.%Y")} · {o.von.strftime("%H:%M")}{bis}',
            'voters': voters,
            'votes':  len(voters),
        })
    return {
        'id':           str(umfrage.id),
        'title':        umfrage.titel,
        'group':        umfrage.kampagne.gruppe.name,
        'createdBy':    umfrage.erstellt_von.username if umfrage.erstellt_von else None,
        'options':      optionen,
        'groupMembers': [m.spieler.username for m in umfrage.kampagne.gruppe.mitgliedschaften.all()],
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kampagne_umfrage_erstellen(request, pk):
    """Spielleiter erstellt eine Terminumfrage mit mehreren Optionen."""
    try:
        kampagne = Kampagne.objects.select_related('gruppe').get(pk=pk, spielleiter=request.user)
    except Kampagne.DoesNotExist:
        return Response({'error': 'Kampagne nicht gefunden oder keine Berechtigung.'}, status=status.HTTP_404_NOT_FOUND)

    optionen = request.data.get('optionen', [])
    if len(optionen) < 2:
        return Response({'error': 'Eine Umfrage braucht mindestens zwei Optionen.'}, status=status.HTTP_400_BAD_REQUEST)

    umfrage = Terminumfrage.objects.create(
        kampagne=kampagne,
        titel=request.data.get('titel', '').strip() or f'Terminumfrage – {kampagne.titel}',
        beschreibung=request.data.get('beschreibung', '').strip(),
        erstellt_von=request.user,
    )
    for opt in optionen:
        try:
            datum = _parse_datum(opt['datum'])
            von   = _parse_time(opt['von'])
            bis   = _parse_time(opt['bis']) if opt.get('bis') else None
        except Exception:
            umfrage.delete()
            return Response({'error': 'Ungültiges Datum/Zeit in einer Option.'}, status=status.HTTP_400_BAD_REQUEST)
        Umfrageoption.objects.create(umfrage=umfrage, datum=datum, von=von, bis=bis)

    return Response(_umfrage_to_dict(umfrage), status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def umfragen_liste(request):
    """Offene Umfragen für die Gruppen, in denen der Nutzer Mitglied ist."""
    gruppen_ids = Gruppenmitgliedschaft.objects.filter(spieler=request.user).values_list('gruppe_id', flat=True)
    umfragen = (
        Terminumfrage.objects
        .filter(kampagne__gruppe_id__in=gruppen_ids, abgeschlossen=False)
        .select_related('kampagne__gruppe', 'erstellt_von')
        .prefetch_related('optionen__stimmen__spieler', 'kampagne__gruppe__mitgliedschaften')
    )
    return Response([_umfrage_to_dict(u) for u in umfragen])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def umfrage_abstimmen(request, pk):
    """Stimmt für eine Option ab (eine Stimme pro Nutzer und Umfrage)."""
    try:
        umfrage = Terminumfrage.objects.select_related('kampagne__gruppe').get(pk=pk, abgeschlossen=False)
    except Terminumfrage.DoesNotExist:
        return Response({'error': 'Umfrage nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    if not Gruppenmitgliedschaft.objects.filter(gruppe=umfrage.kampagne.gruppe, spieler=request.user).exists():
        return Response({'error': 'Du bist kein Mitglied dieser Gruppe.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        option = umfrage.optionen.get(pk=request.data.get('option_id'))
    except Umfrageoption.DoesNotExist:
        return Response({'error': 'Option nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    Umfragestimme.objects.update_or_create(
        umfrage=umfrage, spieler=request.user,
        defaults={'option': option},
    )
    umfrage = Terminumfrage.objects.select_related('kampagne__gruppe', 'erstellt_von').prefetch_related(
        'optionen__stimmen__spieler', 'kampagne__gruppe__mitgliedschaften').get(pk=pk)
    return Response(_umfrage_to_dict(umfrage))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def umfrage_finalisieren(request, pk):
    """Spielleiter wählt die Gewinner-Option → erzeugt eine Session, schließt die Umfrage."""
    try:
        umfrage = Terminumfrage.objects.select_related('kampagne__gruppe').get(pk=pk, kampagne__spielleiter=request.user)
    except Terminumfrage.DoesNotExist:
        return Response({'error': 'Umfrage nicht gefunden oder keine Berechtigung.'}, status=status.HTTP_404_NOT_FOUND)

    option_id = request.data.get('option_id')
    if option_id:
        try:
            option = umfrage.optionen.get(pk=option_id)
        except Umfrageoption.DoesNotExist:
            return Response({'error': 'Option nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        # ohne Angabe: Option mit den meisten Stimmen
        option = max(umfrage.optionen.all(), key=lambda o: o.stimmen.count(), default=None)
        if option is None:
            return Response({'error': 'Die Umfrage hat keine Optionen.'}, status=status.HTTP_400_BAD_REQUEST)

    kampagne = umfrage.kampagne
    start_dt = datetime.datetime.combine(option.datum, option.von)
    end_dt   = datetime.datetime.combine(option.datum, option.bis) if option.bis else None
    session_nr = kampagne.sessions.count() + 1
    session = Session.objects.create(
        kampagne=kampagne,
        titel=f'Session {session_nr} – {kampagne.titel}',
        beschreibung=umfrage.beschreibung,
        datetime=start_dt,
        end_datetime=end_dt,
        ort=kampagne.gruppe.beschreibung,
        max_teilnehmer=kampagne.gruppe.max_spieler,
        meeting_format=kampagne.meeting_format,
    )
    # Spielleiter als DM zusagen, alle anderen Mitglieder einladen
    SessionTeilnahme.objects.create(
        session=session, spieler=request.user,
        status=TeilnahmeStatusChoices.ZUGESAGT, rolle=TeilnahmeRolleChoices.DM,
    )
    for m in kampagne.gruppe.mitgliedschaften.exclude(spieler=request.user):
        SessionTeilnahme.objects.get_or_create(
            session=session, spieler=m.spieler,
            defaults={'status': TeilnahmeStatusChoices.AUSSTEHEND, 'rolle': TeilnahmeRolleChoices.SPIELER},
        )

    umfrage.abgeschlossen = True
    umfrage.save(update_fields=['abgeschlossen'])
    return Response(TerminSerializer(session, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kalender(request):
    """Verfügbarkeit für den Kalender — gibt an welche Tage Sessions haben."""
    session_ids = SessionTeilnahme.objects.filter(spieler=request.user).values_list('session_id', flat=True)
    sessions = Session.objects.filter(id__in=session_ids).values('datetime')
    availability = {}
    for s in sessions:
        key = s['datetime'].strftime('%Y-%m-%d')
        availability[key] = availability.get(key, 0) + 1
    return Response(availability)


# ─────────────────────────────────────────
# FREUNDSCHAFTEN
# ─────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spieler_suche(request):
    """Spieler nach Username suchen (icontains, ohne sich selbst).
    Liefert pro Treffer den Beziehungs-Status zum eingeloggten Nutzer mit."""
    q = request.query_params.get('q', '').strip()
    if not q:
        return Response([])

    me = request.user
    treffer = list(Spieler.objects.filter(username__icontains=q).exclude(id=me.id)[:20])
    treffer_ids = [s.id for s in treffer]

    # Beziehungs-Map in einer einzigen Query — vermeidet N+1.
    beziehungen = Freundschaft.objects.filter(
        models.Q(user_a=me, user_b_id__in=treffer_ids) |
        models.Q(user_b=me, user_a_id__in=treffer_ids)
    )
    beziehungs_map = {}
    for f in beziehungen:
        other_id = f.user_b_id if f.user_a_id == me.id else f.user_a_id
        beziehungs_map[other_id] = f.status

    data = SpielerSucheSerializer(treffer, many=True, context={'beziehungs_map': beziehungs_map}).data
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def freunde_liste(request):
    """Alle angenommenen Freundschaften des Nutzers."""
    me = request.user
    qs = (
        Freundschaft.objects
        .filter(models.Q(user_a=me) | models.Q(user_b=me), status=FreundschaftStatusChoices.ANGENOMMEN)
        .select_related('user_a', 'user_b')
        .order_by('-angenommen_am')
    )
    return Response(FreundSerializer(qs, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def freundschaftsanfragen(request):
    """Eingehende, noch offene Anfragen — ich bin beteiligt, aber nicht der Initiator."""
    me = request.user
    qs = (
        Freundschaft.objects
        .filter(models.Q(user_a=me) | models.Q(user_b=me), status=FreundschaftStatusChoices.AUSSTEHEND)
        .exclude(initiator=me)
        .select_related('initiator')
        .order_by('-erstellt_am')
    )
    return Response(FreundschaftsanfrageSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def freundschaft_erstellen(request):
    """Neue Freundschaftsanfrage senden. Body: {empfaenger_id: <int>}."""
    empfaenger_id = request.data.get('empfaenger_id')
    if not empfaenger_id:
        return Response({'error': 'empfaenger_id ist erforderlich.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        empfaenger_id = int(empfaenger_id)
    except (TypeError, ValueError):
        return Response({'error': 'empfaenger_id muss eine Zahl sein.'}, status=status.HTTP_400_BAD_REQUEST)

    me = request.user
    if empfaenger_id == me.id:
        return Response({'error': 'Du kannst dir keine Anfrage schicken.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        empfaenger = Spieler.objects.get(pk=empfaenger_id)
    except Spieler.DoesNotExist:
        return Response({'error': 'Spieler nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    # Prüfen ob schon eine Freundschaft (in beide Richtungen) existiert.
    a_id, b_id = sorted([me.id, empfaenger.id])
    bestehend = Freundschaft.objects.filter(user_a_id=a_id, user_b_id=b_id).first()
    if bestehend:
        if bestehend.status == FreundschaftStatusChoices.ANGENOMMEN:
            return Response({'error': 'Ihr seid bereits befreundet.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'Es gibt bereits eine offene Anfrage.'}, status=status.HTTP_400_BAD_REQUEST)

    f = Freundschaft.objects.create(user_a=me, user_b=empfaenger, initiator=me)
    return Response(FreundschaftsanfrageSerializer(f).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def freundschaft_detail(request, pk):
    """PUT: Anfrage annehmen ({aktion: "annehmen"}). DELETE: ablehnen / entfernen / zurückziehen."""
    try:
        f = Freundschaft.objects.select_related('user_a', 'user_b').get(pk=pk)
    except Freundschaft.DoesNotExist:
        return Response({'error': 'Freundschaft nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    me = request.user
    if me.id not in (f.user_a_id, f.user_b_id):
        return Response({'error': 'Keine Berechtigung.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        f.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PUT — annehmen
    aktion = request.data.get('aktion', '').strip()
    if aktion != 'annehmen':
        return Response({'error': 'Ungültige Aktion. Erlaubt: annehmen'}, status=status.HTTP_400_BAD_REQUEST)
    if f.status != FreundschaftStatusChoices.AUSSTEHEND:
        return Response({'error': 'Anfrage ist nicht mehr offen.'}, status=status.HTTP_400_BAD_REQUEST)
    if f.initiator_id == me.id:
        return Response({'error': 'Du kannst deine eigene Anfrage nicht annehmen.'}, status=status.HTTP_400_BAD_REQUEST)

    f.status = FreundschaftStatusChoices.ANGENOMMEN
    f.angenommen_am = timezone.now()
    f.save()
    return Response(FreundSerializer(f, context={'request': request}).data)


# ─────────────────────────────────────────
# BEITRITTSANFRAGEN
# ─────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kampagne_anfragen(request, pk):
    """Spieler stellt Beitrittsanfrage für eine öffentliche Kampagne."""
    try:
        kampagne = Kampagne.objects.get(pk=pk, ist_privat=False)
    except Kampagne.DoesNotExist:
        return Response({'error': 'Kampagne nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    if kampagne.spielleiter == request.user:
        return Response({'error': 'Du bist bereits Spielleiter dieser Kampagne.'}, status=status.HTTP_400_BAD_REQUEST)

    anfrage, created = Beitrittsanfrage.objects.get_or_create(
        spieler=request.user,
        kampagne=kampagne,
        defaults={'status': BeitrittsanfrageStatusChoices.AUSSTEHEND},
    )
    if not created:
        return Response({'error': 'Du hast bereits eine Anfrage gestellt.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'id': anfrage.id, 'status': anfrage.status}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def beitrittsanfragen_liste(request):
    """Gibt alle ausstehenden Anfragen für die Kampagnen des eingeloggten DMs zurück."""
    anfragen = (
        Beitrittsanfrage.objects
        .filter(kampagne__spielleiter=request.user, status=BeitrittsanfrageStatusChoices.AUSSTEHEND)
        .select_related('spieler', 'kampagne')
        .order_by('-erstellt_am')
    )
    data = [
        {
            'id':           a.id,
            'spieler':      a.spieler.username,
            'spieler_id':   a.spieler.id,
            'kampagne':     a.kampagne.titel,
            'kampagne_id':  a.kampagne.id,
            'erstellt_am':  a.erstellt_am.strftime('%d.%m.%Y'),
        }
        for a in anfragen
    ]
    return Response(data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def beitrittsanfrage_bearbeiten(request, pk):
    """DM nimmt Anfrage an oder lehnt sie ab."""
    try:
        anfrage = Beitrittsanfrage.objects.select_related('spieler', 'kampagne__gruppe').get(
            pk=pk, kampagne__spielleiter=request.user
        )
    except Beitrittsanfrage.DoesNotExist:
        return Response({'error': 'Anfrage nicht gefunden.'}, status=status.HTTP_404_NOT_FOUND)

    aktion = request.data.get('aktion', '')
    if aktion == 'annehmen':
        Gruppenmitgliedschaft.objects.get_or_create(
            gruppe=anfrage.kampagne.gruppe,
            spieler=anfrage.spieler,
            defaults={'rolle': RolleChoices.SPIELER},
        )
        upcoming_sessions = anfrage.kampagne.sessions.filter(datetime__gte=timezone.now())
        for session in upcoming_sessions:
            SessionTeilnahme.objects.get_or_create(
                session=session,
                spieler=anfrage.spieler,
                defaults={'status': TeilnahmeStatusChoices.AUSSTEHEND, 'rolle': TeilnahmeRolleChoices.SPIELER},
            )
        anfrage.status = BeitrittsanfrageStatusChoices.ANGENOMMEN
        anfrage.save()
        return Response({'status': 'angenommen'})

    elif aktion == 'ablehnen':
        anfrage.status = BeitrittsanfrageStatusChoices.ABGELEHNT
        anfrage.save()
        return Response({'status': 'abgelehnt'})

    return Response({'error': 'Ungültige Aktion. Erlaubt: annehmen, ablehnen'}, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────
# iCAL FEED
# ─────────────────────────────────────────

def _format_dt(dt):
    utc = dt.astimezone(datetime.timezone.utc)
    return utc.strftime('%Y%m%dT%H%M%SZ')

def _escape_ical(text):
    return (text or '').replace('\\', '\\\\').replace('\n', '\\n').replace(',', '\\,').replace(';', '\\;')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ical_token_get(request):
    return Response({'ical_token': str(request.user.ical_token)})

def ical_feed(request, token):
    try:
        spieler = Spieler.objects.get(ical_token=token)
    except Spieler.DoesNotExist:
        return HttpResponse('Not found', status=404)
    session_ids = SessionTeilnahme.objects.filter(spieler=spieler).values_list('session_id', flat=True)
    sessions = Session.objects.filter(id__in=session_ids).select_related('kampagne__gruppe', 'kampagne__spielleiter').order_by('datetime')
    lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CampaignConnect//DE',
             'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
             f'X-WR-CALNAME:CampaignConnect – {_escape_ical(spieler.username)}',
             'X-WR-TIMEZONE:Europe/Berlin']
    for s in sessions:
        end_dt = s.end_datetime or (s.datetime + timedelta(hours=4))
        desc = _escape_ical(s.beschreibung)
        if s.kampagne.spielleiter:
            desc = f'DM: {_escape_ical(s.kampagne.spielleiter.username)}\\n' + desc
        lines += ['BEGIN:VEVENT', f'UID:session-{s.id}@campaignconnect',
                  f'DTSTART:{_format_dt(s.datetime)}', f'DTEND:{_format_dt(end_dt)}',
                  f'SUMMARY:{_escape_ical(s.titel)} – {_escape_ical(s.kampagne.titel)}',
                  f'DESCRIPTION:{desc}', f'LOCATION:{_escape_ical(s.ort)}',
                  # Erinnerung 1 Stunde vor Beginn (VALARM nach RFC 5545)
                  'BEGIN:VALARM', 'ACTION:DISPLAY',
                  f'DESCRIPTION:Erinnerung: {_escape_ical(s.titel)}',
                  'TRIGGER:-PT1H', 'END:VALARM',
                  'END:VEVENT']
    lines.append('END:VCALENDAR')
    content = '\r\n'.join(lines) + '\r\n'
    return HttpResponse(content, content_type='text/calendar; charset=utf-8')
