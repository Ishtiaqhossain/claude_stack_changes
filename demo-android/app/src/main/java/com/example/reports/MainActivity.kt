package com.example.reports

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val report = Report(
            title = "Sales",
            rows = listOf(Row("Apples", 120), Row("Oranges", 90)),
        )

        val textView = TextView(this).apply {
            text = report.render()
            textSize = 18f
        }
        val exportButton = Button(this).apply {
            text = "Export as CSV"
            setOnClickListener { shareCsv(report) }
        }
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
            addView(textView)
            addView(exportButton)
        }
        setContentView(layout)
    }

    private fun shareCsv(report: Report) {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/csv"
            putExtra(Intent.EXTRA_TEXT, report.render("csv"))
        }
        startActivity(Intent.createChooser(intent, "Export report"))
    }
}
