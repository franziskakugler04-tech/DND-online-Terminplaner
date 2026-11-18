from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('campainConnect', '0004_freundschaft'),
    ]

    operations = [
        migrations.CreateModel(
            name='Beitrittsanfrage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(
                    choices=[('ausstehend', 'Ausstehend'), ('angenommen', 'Angenommen'), ('abgelehnt', 'Abgelehnt')],
                    default='ausstehend',
                    max_length=20,
                )),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('kampagne', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='beitrittsanfragen',
                    to='campainConnect.kampagne',
                )),
                ('spieler', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='beitrittsanfragen',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'unique_together': {('spieler', 'kampagne')},
            },
        ),
    ]
