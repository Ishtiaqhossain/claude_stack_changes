"""A tiny report renderer. Rendering is delegated to a formatter; the output is
unchanged (still plain text) — this is a pure refactor."""

from formatter import TextFormatter


def render(title, rows):
    return TextFormatter().format(title, rows)
