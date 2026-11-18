from datetime import date, time

import pytest
from rest_framework import serializers

from ...serializers import _parse_datum, _parse_time


def test_parse_datum_valide():
    assert _parse_datum('31.12.2025') == date(2025, 12, 31)


@pytest.mark.parametrize('datum_str', [
    '2025-12-31',
    'aa.bb.cccc',
    '31.12',
    '',
    '32.13.2025',
])
def test_parse_datum_invalide(datum_str):
    with pytest.raises(serializers.ValidationError):
        _parse_datum(datum_str)


def test_parse_time_valide():
    assert _parse_time('14:30') == time(14, 30)


@pytest.mark.parametrize('time_str', [
    '14-30',
    'hh:mm',
    '1430',
    '',
    '25:00',
])
def test_parse_time_invalide(time_str):
    with pytest.raises(serializers.ValidationError):
        _parse_time(time_str)
