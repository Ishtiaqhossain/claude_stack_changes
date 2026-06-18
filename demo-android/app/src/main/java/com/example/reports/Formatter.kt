package com.example.reports

// A Formatter turns a report's title and rows into a string.
interface ReportFormatter {
    fun format(title: String, rows: List<Row>): String
}

class TextFormatter : ReportFormatter {
    override fun format(title: String, rows: List<Row>): String {
        val lines = mutableListOf(title, "=".repeat(title.length))
        for (row in rows) lines.add("${row.label}: ${row.value}")
        return lines.joinToString("\n")
    }
}

class CsvFormatter : ReportFormatter {
    override fun format(title: String, rows: List<Row>): String {
        val lines = mutableListOf("label,value")
        for (row in rows) lines.add("${row.label},${row.value}")
        return lines.joinToString("\n")
    }
}

// Registry mapping a format name to a formatter. CSV export is now wired into
// the UI, so it is always available.
object FormatterRegistry {
    private val formatters = mutableMapOf<String, ReportFormatter>(
        "text" to TextFormatter(),
        "csv" to CsvFormatter(),
    )

    fun get(name: String): ReportFormatter =
        formatters[name] ?: throw IllegalArgumentException("Unknown format: $name")

    fun register(name: String, formatter: ReportFormatter) {
        formatters[name] = formatter
    }
}
