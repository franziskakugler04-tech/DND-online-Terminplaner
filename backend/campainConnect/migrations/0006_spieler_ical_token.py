import uuid
from django.db import migrations, models


def fill_ical_tokens(apps, schema_editor):
    Spieler = apps.get_model('campainConnect', 'Spieler')
    for spieler in Spieler.objects.filter(ical_token__isnull=True):
        spieler.ical_token = uuid.uuid4()
        spieler.save(update_fields=['ical_token'])


class Migration(migrations.Migration):
    dependencies = [('campainConnect', '0005_beitrittsanfrage')]
    operations = [
        migrations.AddField(model_name='spieler', name='ical_token', field=models.UUIDField(null=True)),
        migrations.RunPython(fill_ical_tokens, migrations.RunPython.noop),
        migrations.AlterField(model_name='spieler', name='ical_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
    ]
