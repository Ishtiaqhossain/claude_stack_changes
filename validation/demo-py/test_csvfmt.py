import unittest

from csvfmt import CsvFormatter


class CsvFormatterTest(unittest.TestCase):
    def test_csv(self):
        out = CsvFormatter().format("Sales", [("Apples", 120), ("Oranges", 90)])
        self.assertEqual(out, "label,value\nApples,120\nOranges,90")


if __name__ == "__main__":
    unittest.main()
