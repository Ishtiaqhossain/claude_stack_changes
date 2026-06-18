package com.example.reports

data class Row(val label: String, val value: Int)

// A Report holds rows and renders them in a chosen format.
class Report(val title: String, val rows: List<Row>) {

    fun render(format: String = "text"): String {
        val formatter: ReportFormatter = if (format == "csv") CsvFormatter() else TextFormatter()
        return formatter.format(title, rows)
    }
}
