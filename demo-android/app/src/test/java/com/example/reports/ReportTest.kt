package com.example.reports

import org.junit.Assert.assertEquals
import org.junit.Test

class ReportTest {

    @Test
    fun rendersAReportAsPlainText() {
        val report = Report("Sales", listOf(Row("Apples", 120), Row("Oranges", 90)))
        assertEquals("Sales\n=====\nApples: 120\nOranges: 90", report.render())
    }

    @Test
    fun rendersAReportAsCsv() {
        val report = Report("Sales", listOf(Row("Apples", 120), Row("Oranges", 90)))
        assertEquals("label,value\nApples,120\nOranges,90", report.render("csv"))
    }
}
