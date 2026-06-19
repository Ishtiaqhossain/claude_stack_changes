"""A tiny report renderer. `render` is the text default; `render_as` selects a
formatter by name."""

from formatter import TextFormatter
from csvfmt import CsvFormatter

_FORMATTERS = {"text": TextFormatter, "csv": CsvFormatter}


def render(title, rows):
    return TextFormatter().format(title, rows)


def render_as(fmt, title, rows):
    if fmt not in _FORMATTERS:
        raise ValueError(f"Unknown format: {fmt}")
    return _FORMATTERS[fmt]().format(title, rows)
