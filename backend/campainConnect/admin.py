from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Spieler, Gruppe, Gruppenmitgliedschaft, Kampagne, Session, SessionTeilnahme, Freundschaft,
    Terminumfrage, Umfrageoption, Umfragestimme,
)


@admin.register(Spieler)
class SpielerAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Zusätzliche Infos', {
            'fields': ('rolle', 'erfahrung', 'timezone')
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Zusätzliche Infos', {
            'fields': ('rolle', 'erfahrung', 'timezone')
        }),
    )
    list_display = ('username', 'email', 'rolle', 'erfahrung', 'is_staff')
    list_filter = ('rolle', 'erfahrung', 'is_staff')
    search_fields = ('username', 'email')


class GruppenmitgliedschaftInline(admin.TabularInline):
    model = Gruppenmitgliedschaft
    extra = 1
    autocomplete_fields = ('spieler',)


@admin.register(Gruppe)
class GruppeAdmin(admin.ModelAdmin):
    list_display = ('name', 'ist_oeffentlich', 'meeting_format', 'max_spieler', 'erstellt_von')
    list_filter = ('ist_oeffentlich', 'meeting_format')
    search_fields = ('name',)
    inlines = [GruppenmitgliedschaftInline]


@admin.register(Gruppenmitgliedschaft)
class GruppenmitgliedschaftAdmin(admin.ModelAdmin):
    list_display = ('spieler', 'gruppe', 'rolle', 'mitglied_seit')
    list_filter = ('rolle',)
    search_fields = ('spieler__username', 'gruppe__name')


class SessionInline(admin.TabularInline):
    model = Session
    extra = 1
    fields = ('titel', 'datetime', 'max_teilnehmer', 'meeting_format')


@admin.register(Kampagne)
class KampagneAdmin(admin.ModelAdmin):
    list_display = ('titel', 'typ', 'status', 'meeting_format', 'gruppe', 'spielleiter', 'start_date')
    list_filter = ('typ', 'status', 'meeting_format')
    search_fields = ('titel', 'gruppe__name')
    inlines = [SessionInline]

class SessionTeilnahmeInline(admin.TabularInline):
    model = SessionTeilnahme
    extra = 1
    autocomplete_fields = ('spieler',)


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('titel', 'kampagne', 'datetime', 'meeting_format', 'max_teilnehmer')
    list_filter = ('meeting_format',)
    search_fields = ('titel', 'kampagne__titel')
    inlines = [SessionTeilnahmeInline]


@admin.register(SessionTeilnahme)
class SessionTeilnahmeAdmin(admin.ModelAdmin):
    list_display = ('spieler', 'session', 'rolle', 'status')
    list_filter = ('rolle', 'status')
    search_fields = ('spieler__username', 'session__titel')


@admin.register(Freundschaft)
class FreundschaftAdmin(admin.ModelAdmin):
    list_display = ('user_a', 'user_b', 'initiator', 'status', 'erstellt_am', 'angenommen_am')
    list_filter = ('status',)
    search_fields = ('user_a__username', 'user_b__username')
    autocomplete_fields = ('user_a', 'user_b', 'initiator')
    readonly_fields = ('erstellt_am',)


class UmfrageoptionInline(admin.TabularInline):
    model = Umfrageoption
    extra = 0


@admin.register(Terminumfrage)
class TerminumfrageAdmin(admin.ModelAdmin):
    list_display = ('titel', 'kampagne', 'erstellt_von', 'abgeschlossen', 'erstellt_am')
    list_filter = ('abgeschlossen',)
    inlines = [UmfrageoptionInline]


@admin.register(Umfragestimme)
class UmfragestimmeAdmin(admin.ModelAdmin):
    list_display = ('umfrage', 'option', 'spieler')