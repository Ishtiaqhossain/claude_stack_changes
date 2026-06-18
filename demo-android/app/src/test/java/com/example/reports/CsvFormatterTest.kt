package com.example.reports

import org.junit.Assert.assertEquals
import org.junit.Test

class CsvFormatterTest {

    @Test
    fun emitsAHeaderRowAndOneLinePerRow() {
        val csv = CsvFormatter()
        assertEquals(
            "label,value\nApples,120\nOranges,90",
            csv.format("Sales", listOf(Row("Apples", 120), Row("Oranges", 90))),
        )
    }
}
