import unittest

from report import render_as


class RenderAsTest(unittest.TestCase):
    def test_csv(self):
        self.assertEqual(
            render_as("csv", "Sales", [("Apples", 120), ("Oranges", 90)]),
            "label,value\nApples,120\nOranges,90",
        )

    def test_text_default_unchanged(self):
        self.assertEqual(
            render_as("text", "Sales", [("Apples", 120)]),
            "Sales\n=====\nApples: 120",
        )

    def test_unknown(self):
        with self.assertRaises(ValueError):
            render_as("pdf", "x", [])


if __name__ == "__main__":
    unittest.main()
