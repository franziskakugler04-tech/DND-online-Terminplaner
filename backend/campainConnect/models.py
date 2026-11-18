import uuid

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


# ─────────────────────────────────────────
# ENUMS / CHOICES
# ─────────────────────────────────────────

class RolleChoices(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    SPIELLEITER = 'spielleiter', 'Spielleiter'
    SPIELER = 'spieler', 'Spieler'
    BEIDES = 'beides', 'Spieler & Spielleiter'


class ErfahrungChoices(models.TextChoices):
    ANFAENGER = 'anfaenger', 'Anfänger'
    FORTGESCHRITTEN = 'fortgeschritten', 'Fortgeschritten'
    VETERAN = 'veteran', 'Veteran'


class MeetingFormatChoices(models.TextChoices):
    ONLINE = 'online', 'Online'
    IRL = 'irl', 'IRL'
    HYBRID = 'hybride', 'Hybride'


class KampagneTypChoices(models.TextChoices):
    KAMPAGNE = 'kampagne', 'Kampagne'
    ONESHOT = 'oneshot', 'Oneshot'
    EVENT = 'event', 'Event'


class KampagneStatusChoices(models.TextChoices):
    AKTIV = 'aktiv', 'Aktiv'
    ABGESCHLOSSEN = 'abgeschlossen', 'Abgeschlossen'
    PAUSIERT = 'pausiert', 'Pausiert'


class KampagneGroesseChoices(models.TextChoices):
    S1_3 = '1-3', 'ca. 1-3 Sessions'
    S4_6 = '4-6', 'ca. 4-6 Sessions'
    S7_10 = '7-10', 'ca. 7-10 Sessions'
    S10_15 = '10-15', 'ca. 10-15 Sessions'
    S16_25 = '16-25', 'ca. 16-25 Sessions'
    S25PLUS = '25plus', 'ca. 25+ Sessions'


class TeilnahmeStatusChoices(models.TextChoices):
    ZUGESAGT = 'zugesagt', 'Zugesagt'
    ABGESAGT = 'abgesagt', 'Abgesagt'
    AUSSTEHEND = 'ausstehend', 'Ausstehend'
    KOMMT_SPAETER = 'kommt_spaeter', 'Kommt später'


class TeilnahmeRolleChoices(models.TextChoices):
    DM = 'dm', 'Dungeon Master'
    SPIELER = 'spieler', 'Spieler'


class FreundschaftStatusChoices(models.TextChoices):
    AUSSTEHEND = 'ausstehend', 'Ausstehend'
    ANGENOMMEN = 'angenommen', 'Angenommen'


class BeitrittsanfrageStatusChoices(models.TextChoices):
    AUSSTEHEND = 'ausstehend', 'Ausstehend'
    ANGENOMMEN = 'angenommen', 'Angenommen'
    ABGELEHNT  = 'abgelehnt',  'Abgelehnt'


# ─────────────────────────────────────────
# Player (extends AbstractUser)
# ─────────────────────────────────────────

class Spieler(AbstractUser):
    rolle = models.CharField(
        max_length=20,
        choices=RolleChoices.choices,
        default=RolleChoices.SPIELER,
    )
    erfahrung = models.CharField(
        max_length=20,
        choices=ErfahrungChoices.choices,
        blank=True,
        null=True,
    )
    timezone = models.CharField(
        max_length=50,
        default='Europe/Berlin',
    )
    ical_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    class Meta:
        verbose_name = 'Spieler'
        verbose_name_plural = 'Spieler'

    def __str__(self):
        return self.username


# ─────────────────────────────────────────
# GROUP
# ─────────────────────────────────────────

class Gruppe(models.Model):
    name = models.CharField(max_length=255)
    beschreibung = models.TextField(blank=True)
    max_spieler = models.PositiveIntegerField(null=True, blank=True)
    ist_oeffentlich = models.BooleanField(default=False)
    meeting_format = models.CharField(
        max_length=10,
        choices=MeetingFormatChoices.choices,
        default=MeetingFormatChoices.IRL,
    )
    erstellt_von = models.ForeignKey(
        Spieler,
        on_delete=models.SET_NULL,
        null=True,
        related_name='erstellte_gruppen',
    )

    class Meta:
        verbose_name = 'Gruppe'
        verbose_name_plural = 'Gruppen'

    def __str__(self):
        return self.name


# ─────────────────────────────────────────
# GROUP MEMBERSHIP
# ─────────────────────────────────────────

class Gruppenmitgliedschaft(models.Model):
    gruppe = models.ForeignKey(
        Gruppe,
        on_delete=models.CASCADE,
        related_name='mitgliedschaften',
    )
    spieler = models.ForeignKey(
        Spieler,
        on_delete=models.CASCADE,
        related_name='mitgliedschaften',
    )
    rolle = models.CharField(
        max_length=20,
        choices=RolleChoices.choices,
        default=RolleChoices.SPIELER,
    )
    mitglied_seit = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Gruppenmitgliedschaft'
        verbose_name_plural = 'Gruppenmitgliedschaften'
        unique_together = ('gruppe', 'spieler')

    def __str__(self):
        return f'{self.spieler} in {self.gruppe} ({self.rolle})'


# ─────────────────────────────────────────
# CAMPAIGN
# ─────────────────────────────────────────

class Kampagne(models.Model):
    gruppe = models.ForeignKey(
        Gruppe,
        on_delete=models.CASCADE,
        related_name='kampagnen',
    )
    titel = models.CharField(max_length=255)
    beschreibung = models.TextField(blank=True)
    sonstiges = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=KampagneStatusChoices.choices,
        default=KampagneStatusChoices.AKTIV,
    )
    typ = models.CharField(
        max_length=20,
        choices=KampagneTypChoices.choices,
        default=KampagneTypChoices.KAMPAGNE,
    )
    meeting_format = models.CharField(
        max_length=10,
        choices=MeetingFormatChoices.choices,
        default=MeetingFormatChoices.IRL,
    )
    sprache = models.CharField(max_length=5, default='de')
    kampagnengroesse = models.CharField(
        max_length=10,
        choices=KampagneGroesseChoices.choices,
        default=KampagneGroesseChoices.S4_6,
    )
    ist_privat = models.BooleanField(default=True)
    nur_mit_dm = models.BooleanField(default=True)
    warteliste = models.BooleanField(default=True)
    start_date = models.DateField(null=True, blank=True)
    spielleiter = models.ForeignKey(
        Spieler,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='geleitete_kampagnen',
    )

    class Meta:
        verbose_name = 'Kampagne'
        verbose_name_plural = 'Kampagnen'

    def __str__(self):
        return f'{self.titel} ({self.get_typ_display()})'


# ─────────────────────────────────────────
# SESSION
# ─────────────────────────────────────────

class Session(models.Model):
    kampagne = models.ForeignKey(
        Kampagne,
        on_delete=models.CASCADE,
        related_name='sessions',
    )
    titel = models.CharField(max_length=255)
    beschreibung = models.TextField(blank=True)
    datetime = models.DateTimeField()
    end_datetime = models.DateTimeField(null=True, blank=True)
    ort = models.CharField(max_length=255, blank=True)
    max_teilnehmer = models.PositiveIntegerField(null=True, blank=True)
    ist_vorschlag = models.BooleanField(default=False)
    meeting_format = models.CharField(
        max_length=10,
        choices=MeetingFormatChoices.choices,
        default=MeetingFormatChoices.IRL,
    )

    class Meta:
        verbose_name = 'Session'
        verbose_name_plural = 'Sessions'

    def __str__(self):
        return f'{self.titel} – {self.datetime:%d.%m.%Y %H:%M}'


# ─────────────────────────────────────────
# SESSION PARTICIPATION
# ─────────────────────────────────────────

class SessionTeilnahme(models.Model):
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name='teilnahmen',
    )
    spieler = models.ForeignKey(
        Spieler,
        on_delete=models.CASCADE,
        related_name='teilnahmen',
    )
    status = models.CharField(
        max_length=20,
        choices=TeilnahmeStatusChoices.choices,
        default=TeilnahmeStatusChoices.AUSSTEHEND,
    )
    rolle = models.CharField(
        max_length=10,
        choices=TeilnahmeRolleChoices.choices,
        default=TeilnahmeRolleChoices.SPIELER,
    )

    class Meta:
        verbose_name = 'Session-Teilnahme'
        verbose_name_plural = 'Session-Teilnahmen'
        unique_together = ('session', 'spieler')

    def __str__(self):
        return f'{self.spieler} @ {self.session} ({self.rolle})'


# ─────────────────────────────────────────
# FREUNDSCHAFT
# ─────────────────────────────────────────

class Freundschaft(models.Model):
    user_a = models.ForeignKey(
        Spieler,
        on_delete=models.CASCADE,
        related_name='freundschaften_als_a',
    )
    user_b = models.ForeignKey(
        Spieler,
        on_delete=models.CASCADE,
        related_name='freundschaften_als_b',
    )
    initiator = models.ForeignKey(
        Spieler,
        on_delete=models.CASCADE,
        related_name='gesendete_freundschaftsanfragen',
    )
    status = models.CharField(
        max_length=20,
        choices=FreundschaftStatusChoices.choices,
        default=FreundschaftStatusChoices.AUSSTEHEND,
    )
    erstellt_am = models.DateTimeField(auto_now_add=True)
    angenommen_am = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Freundschaft'
        verbose_name_plural = 'Freundschaften'
        unique_together = ('user_a', 'user_b')

    def clean(self):
        if self.user_a_id == self.user_b_id:
            raise ValidationError('Ein Spieler kann nicht mit sich selbst befreundet sein.')
        if self.initiator_id not in (self.user_a_id, self.user_b_id):
            raise ValidationError('Initiator muss einer der beiden beteiligten Spieler sein.')

    def save(self, *args, **kwargs):
        if self.user_a_id and self.user_b_id and self.user_a_id > self.user_b_id:
            self.user_a_id, self.user_b_id = self.user_b_id, self.user_a_id
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.user_a} ↔ {self.user_b} ({self.status})'


# ─────────────────────────────────────────
# BEITRITTSANFRAGE
# ─────────────────────────────────────────

class Beitrittsanfrage(models.Model):
    spieler  = models.ForeignKey(Spieler,  on_delete=models.CASCADE, related_name='beitrittsanfragen')
    kampagne = models.ForeignKey(Kampagne, on_delete=models.CASCADE, related_name='beitrittsanfragen')
    status   = models.CharField(
        max_length=20,
        choices=BeitrittsanfrageStatusChoices.choices,
        default=BeitrittsanfrageStatusChoices.AUSSTEHEND,
    )
    erstellt_am = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('spieler', 'kampagne')

    def __str__(self):
        return f'{self.spieler} → {self.kampagne} ({self.status})'


class Benachrichtigung(models.Model):
    empfaenger  = models.ForeignKey(Spieler, on_delete=models.CASCADE, related_name='benachrichtigungen')
    text        = models.TextField()
    gelesen     = models.BooleanField(default=False)
    erstellt_am = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-erstellt_am']

    def __str__(self):
        return f'{self.empfaenger}: {self.text[:40]}'


# ─────────────────────────────────────────
# TERMINUMFRAGE (Abstimmung über mehrere Terminoptionen)
# ─────────────────────────────────────────

class Terminumfrage(models.Model):
    kampagne     = models.ForeignKey(Kampagne, on_delete=models.CASCADE, related_name='umfragen')
    titel        = models.CharField(max_length=255)
    beschreibung = models.TextField(blank=True)
    erstellt_von = models.ForeignKey(Spieler, on_delete=models.SET_NULL, null=True, related_name='erstellte_umfragen')
    erstellt_am  = models.DateTimeField(auto_now_add=True)
    abgeschlossen = models.BooleanField(default=False)

    class Meta:
        ordering = ['-erstellt_am']

    def __str__(self):
        return f'Umfrage: {self.titel}'


class Umfrageoption(models.Model):
    umfrage = models.ForeignKey(Terminumfrage, on_delete=models.CASCADE, related_name='optionen')
    datum   = models.DateField()
    von     = models.TimeField()
    bis     = models.TimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.datum} {self.von}'


class Umfragestimme(models.Model):
    umfrage = models.ForeignKey(Terminumfrage, on_delete=models.CASCADE, related_name='stimmen')
    option  = models.ForeignKey(Umfrageoption, on_delete=models.CASCADE, related_name='stimmen')
    spieler = models.ForeignKey(Spieler, on_delete=models.CASCADE, related_name='umfragestimmen')

    class Meta:
        unique_together = ('umfrage', 'spieler')

    def __str__(self):
        return f'{self.spieler} → {self.option}'
