"""CSV formatter. (Named csvfmt to avoid shadowing the stdlib `csv` module.)"""


class CsvFormatter:
    def format(self, title, rows):
        lines = ["label,value"]
        for label, value in rows:
            lines.append(f"{label},{value}")
        return "\n".join(lines)
