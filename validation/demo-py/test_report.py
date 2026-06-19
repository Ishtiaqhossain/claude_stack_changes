import unittest

from report import render


class RenderTest(unittest.TestCase):
    def test_text(self):
        self.assertEqual(
            render("Sales", [("Apples", 120), ("Oranges", 90)]),
            "Sales\n=====\nApples: 120\nOranges: 90",
        )


if __name__ == "__main__":
    unittest.main()
