from datetime import datetime, date
from rest_framework import serializers
from .models import (
    Spieler, Kampagne, Gruppe, Gruppenmitgliedschaft, Session, SessionTeilnahme,
    Freundschaft,
    RolleChoices, MeetingFormatChoices, TeilnahmeStatusChoices, TeilnahmeRolleChoices,
)


def _parse_datum(datum_str):
    """Parst DD.MM.YYYY → date-Objekt."""
    try:
        parts = datum_str.split('.')
        return date(int(parts[2]), int(parts[1]), int(parts[0]))
    except Exception:
        raise serializers.ValidationError({'datum': 'Datumsformat muss DD.MM.YYYY sein.'})


def _parse_time(time_str):
    """Parst HH:MM → time-Objekt."""
    try:
        h, m = time_str.split(':')
        from datetime import time
        return time(int(h), int(m))
    except Exception:
        raise serializers.ValidationError({'von': 'Zeitformat muss HH:MM sein.'})


class KampagneErstellenSerializer(serializers.Serializer):
    gruppenname    = serializers.CharField(max_length=255, allow_blank=True, default='')
    kampagnename   = serializers.CharField(max_length=255)
    beschreibung   = serializers.CharField(allow_blank=True, default='')
    sonstiges      = serializers.CharField(allow_blank=True, default='')
    sprache        = serializers.CharField(max_length=5, default='de')
    datum          = serializers.CharField(required=False, allow_blank=True, default='')
    von            = serializers.CharField(default='16:00')
    bis            = serializers.CharField(default='22:00')
    modus          = serializers.ChoiceField(choices=['vor-ort', 'hybrid', 'online'], default='vor-ort')
    ort            = serializers.CharField(allow_blank=True, default='')
    max_spieler    = serializers.IntegerField(min_value=1, max_value=10, default=5)
    kampagnengroesse = serializers.CharField(default='4-6')
    private        = serializers.BooleanField(default=True)
    nur_mit_dm     = serializers.BooleanField(default=True)
    warteliste     = serializers.BooleanField(default=True)

    def create(self, validated_data):
        spielleiter = self.context['request'].user

        modus_map = {'vor-ort': 'irl', 'hybrid': 'hybride', 'online': 'online'}
        meeting_format = modus_map[validated_data['modus']]

        gruppenname = validated_data['gruppenname'].strip() or validated_data['kampagnename']
        gruppe, _ = Gruppe.objects.get_or_create(
            name=gruppenname,
            erstellt_von=spielleiter,
            defaults={
                'beschreibung': validated_data['beschreibung'],
                'max_spieler':  validated_data['max_spieler'],
                'ist_oeffentlich': not validated_data['private'],
                'meeting_format':  meeting_format,
            },
        )

        Gruppenmitgliedschaft.objects.get_or_create(
            gruppe=gruppe,
            spieler=spielleiter,
            defaults={'rolle': RolleChoices.SPIELLEITER},
        )

        start_date = None
        if validated_data.get('datum'):
            start_date = _parse_datum(validated_data['datum'])

        kampagne = Kampagne.objects.create(
            gruppe=gruppe,
            titel=validated_data['kampagnename'],
            beschreibung=validated_data['beschreibung'],
            sonstiges=validated_data['sonstiges'],
            sprache=validated_data['sprache'],
            kampagnengroesse=validated_data['kampagnengroesse'],
            meeting_format=meeting_format,
            ist_privat=validated_data['private'],
            nur_mit_dm=validated_data['nur_mit_dm'],
            warteliste=validated_data['warteliste'],
            start_date=start_date,
            spielleiter=spielleiter,
        )

        if start_date:
            von_time  = _parse_time(validated_data['von'])
            bis_time  = _parse_time(validated_data['bis'])
            start_dt  = datetime.combine(start_date, von_time)
            end_dt    = datetime.combine(start_date, bis_time)
            session   = Session.objects.create(
                kampagne=kampagne,
                titel=f'Session 1 – {kampagne.titel}',
                beschreibung=validated_data['beschreibung'],
                datetime=start_dt,
                end_datetime=end_dt,
                ort=validated_data['ort'],
                max_teilnehmer=validated_data['max_spieler'],
                meeting_format=meeting_format,
            )
            SessionTeilnahme.objects.create(
                session=session,
                spieler=spielleiter,
                status=TeilnahmeStatusChoices.ZUGESAGT,
                rolle=TeilnahmeRolleChoices.DM,
            )

        return kampagne


class KampagneSerializer(serializers.ModelSerializer):
    spielleiter_name = serializers.CharField(source='spielleiter.username', read_only=True)
    gruppe_name      = serializers.CharField(source='gruppe.name', read_only=True)
    max_spieler      = serializers.IntegerField(source='gruppe.max_spieler', read_only=True)

    class Meta:
        model = Kampagne
        fields = [
            'id', 'titel', 'beschreibung', 'sonstiges', 'status', 'typ',
            'meeting_format', 'sprache', 'kampagnengroesse',
            'ist_privat', 'nur_mit_dm', 'warteliste',
            'start_date', 'spielleiter_name', 'gruppe_name', 'max_spieler',
        ]


class EinladungSerializer(serializers.ModelSerializer):
    title        = serializers.CharField(source='titel')
    group        = serializers.CharField(source='kampagne.gruppe.name')
    date         = serializers.SerializerMethodField()
    time         = serializers.SerializerMethodField()
    location     = serializers.CharField(source='ort')
    system       = serializers.CharField(source='kampagne.titel')
    description  = serializers.CharField(source='beschreibung')
    participants = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = ['id', 'title', 'group', 'date', 'time', 'location', 'system', 'description', 'participants']

    def get_date(self, obj):
        return obj.datetime.strftime('%d.%m.%Y')

    def get_time(self, obj):
        start = obj.datetime.strftime('%H:%M')
        if obj.end_datetime:
            return f'{start}–{obj.end_datetime.strftime("%H:%M")}'
        return start

    def get_participants(self, obj):
        return list(
            obj.teilnahmen
               .filter(status=TeilnahmeStatusChoices.ZUGESAGT)
               .values_list('spieler__username', flat=True)
        )


class SessionErstellenSerializer(serializers.Serializer):
    datum        = serializers.CharField()
    von          = serializers.CharField()
    bis          = serializers.CharField(required=False, allow_blank=True, default='')
    beschreibung = serializers.CharField(allow_blank=True, default='')

    def create(self, validated_data):
        kampagne    = self.context['kampagne']
        spielleiter = self.context['request'].user

        start_date = _parse_datum(validated_data['datum'])
        von_time   = _parse_time(validated_data['von'])
        start_dt   = datetime.combine(start_date, von_time)

        end_dt = None
        if validated_data.get('bis'):
            bis_time = _parse_time(validated_data['bis'])
            end_dt   = datetime.combine(start_date, bis_time)

        session_nr = kampagne.sessions.count() + 1
        session = Session.objects.create(
            kampagne=kampagne,
            titel=f'Session {session_nr} – {kampagne.titel}',
            beschreibung=validated_data['beschreibung'],
            datetime=start_dt,
            end_datetime=end_dt,
            ort=kampagne.gruppe.beschreibung,
            max_teilnehmer=kampagne.gruppe.max_spieler,
            meeting_format=kampagne.meeting_format,
        )
        SessionTeilnahme.objects.create(
            session=session,
            spieler=spielleiter,
            status=TeilnahmeStatusChoices.ZUGESAGT,
            rolle=TeilnahmeRolleChoices.DM,
        )
        for mitglied in kampagne.gruppe.mitgliedschaften.exclude(spieler=spielleiter):
            SessionTeilnahme.objects.get_or_create(
                session=session,
                spieler=mitglied.spieler,
                defaults={'status': TeilnahmeStatusChoices.AUSSTEHEND, 'rolle': TeilnahmeRolleChoices.SPIELER},
            )
        return session


class TerminSerializer(serializers.ModelSerializer):
    """Gibt Sessions im Format zurück, das das Frontend im Questboard erwartet."""
    date         = serializers.SerializerMethodField()
    time         = serializers.SerializerMethodField()
    group        = serializers.CharField(source='kampagne.gruppe.name')
    confirmed    = serializers.SerializerMethodField()
    location     = serializers.CharField(source='ort')
    description  = serializers.CharField(source='beschreibung')
    system       = serializers.CharField(source='kampagne.titel')
    modus        = serializers.CharField(source='meeting_format')
    spots        = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
    teilnehmer   = serializers.SerializerMethodField()
    ist_spielleiter = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = ['id', 'titel', 'date', 'time', 'group', 'confirmed', 'location',
                  'description', 'system', 'modus', 'spots', 'participants', 'teilnehmer', 'ist_spielleiter']

    def get_teilnehmer(self, obj):
        """Alle Gruppenmitglieder mit ihrem Antwort-Status (für die farbige Liste)."""
        status_map = {t.spieler_id: t.status for t in obj.teilnahmen.all()}
        result = []
        for m in obj.kampagne.gruppe.mitgliedschaften.all():
            result.append({
                'name':   m.spieler.username,
                'status': status_map.get(m.spieler_id, TeilnahmeStatusChoices.AUSSTEHEND),
            })
        return result

    def get_ist_spielleiter(self, obj):
        user = self.context['request'].user
        return obj.kampagne.spielleiter_id == user.id

    def get_date(self, obj):
        return obj.datetime.strftime('%d.%m.%Y')

    def get_time(self, obj):
        start = obj.datetime.strftime('%H:%M')
        if obj.end_datetime:
            return f'{start}–{obj.end_datetime.strftime("%H:%M")}'
        return start

    def get_confirmed(self, obj):
        user = self.context['request'].user
        try:
            t = obj.teilnahmen.get(spieler=user)
            mapping = {
                TeilnahmeStatusChoices.ZUGESAGT:      True,
                TeilnahmeStatusChoices.ABGESAGT:      False,
                TeilnahmeStatusChoices.KOMMT_SPAETER: 'late',
                TeilnahmeStatusChoices.AUSSTEHEND:    None,
            }
            return mapping.get(t.status)
        except SessionTeilnahme.DoesNotExist:
            return None

    def get_spots(self, obj):
        filled = obj.teilnahmen.filter(
            status__in=[TeilnahmeStatusChoices.ZUGESAGT, TeilnahmeStatusChoices.KOMMT_SPAETER]
        ).count()
        return {'filled': filled, 'total': obj.max_teilnehmer or 0}

    def get_participants(self, obj):
        return list(
            obj.teilnahmen
               .filter(status=TeilnahmeStatusChoices.ZUGESAGT)
               .values_list('spieler__username', flat=True)
        )


# ─────────────────────────────────────────
# FREUNDSCHAFT
# (für Freundesliste, Anfragen, Suche)
# Kommentare wurden durch Claude (Anthropic) generiert
# ─────────────────────────────────────────

class SpielerKurzSerializer(serializers.ModelSerializer):
    """Reduzierte Spieler-Darstellung für Listen (Freunde, Suche, Anfragen)."""
    avatarId = serializers.IntegerField(source='id', read_only=True)

    class Meta:
        model = Spieler
        fields = ['id', 'username', 'avatarId']


class SpielerSucheSerializer(SpielerKurzSerializer):
    """Spieler in Suchergebnissen — zusätzlich mit Beziehungs-Status zum eingeloggten Nutzer."""
    beziehung_status = serializers.SerializerMethodField()

    class Meta(SpielerKurzSerializer.Meta):
        fields = SpielerKurzSerializer.Meta.fields + ['beziehung_status']

    def get_beziehung_status(self, obj):
        return self.context.get('beziehungs_map', {}).get(obj.id)


class FreundSerializer(serializers.ModelSerializer):
    """Eine angenommene Freundschaft aus Sicht des eingeloggten Nutzers — liefert den ANDEREN Spieler."""
    spieler = serializers.SerializerMethodField()

    class Meta:
        model = Freundschaft
        fields = ['id', 'spieler', 'angenommen_am']

    def get_spieler(self, obj):
        me = self.context['request'].user
        other = obj.user_b if obj.user_a_id == me.id else obj.user_a
        return SpielerKurzSerializer(other).data


class FreundschaftsanfrageSerializer(serializers.ModelSerializer):
    """Eingehende Anfrage — der Initiator wird mitgeschickt."""
    initiator = SpielerKurzSerializer(read_only=True)

    class Meta:
        model = Freundschaft
        fields = ['id', 'initiator', 'erstellt_am']
