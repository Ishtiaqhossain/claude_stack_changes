"""A Formatter turns a report's title and rows into a string."""


class TextFormatter:
    def format(self, title, rows):
        lines = [title, "=" * len(title)]
        for label, value in rows:
            lines.append(f"{label}: {value}")
        return "\n".join(lines)
