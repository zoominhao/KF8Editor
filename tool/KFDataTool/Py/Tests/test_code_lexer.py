#!/usr/bin/python3
# _*_ coding: utf-8 _*_

import unittest
import string
from KFBaseTestCase import KFBaseTestCase
from CodeLexer import CodeLexer


class CodeParserTest(KFBaseTestCase):
    def setUp(self) -> None:
        return super().setUp()

    def test_get_char(self):
        filedata = "A\nB\n"
        lexer = CodeLexer(filedata)

        c = lexer.get_char()
        self.assertEqual(c, "A")
        c = lexer.get_char()
        self.assertEqual(c, "\n")
        c = lexer.get_char()
        self.assertEqual(c, "B")
        c = lexer.get_char()
        self.assertEqual(c, "\n")
        c = lexer.get_char()
        self.assertEqual(c, 0)
        self.assertTrue(lexer.is_finished())

        pass

    def test_peek_char(self):
        filedata = "AB"
        lexer = CodeLexer(filedata)

        c = lexer.get_char()
        self.assertEqual(c, "A")
        c = lexer.peek_char()
        self.assertEqual(c, "B")

        pass

    def test_unget_char(self):
        filedata = "AB"
        lexer = CodeLexer(filedata)

        c = lexer.get_char()
        self.assertEqual(c, "A")
        lexer.unget_char()
        c = lexer.get_char()
        self.assertEqual(c, "A")

        pass

    def test_get_leading_char(self):
        filedata = "  A  \n\t B \r\n"
        lexer = CodeLexer(filedata)

        c = lexer.get_leading_char()
        self.assertEqual(c, "A")
        c = lexer.get_leading_char()
        self.assertEqual(c, "B")
        c = lexer.get_leading_char()
        self.assertEqual(c, 0)

        pass

    def test_get_token(self):
        filedata = "  A  \n\t = 10, B \t = 99 \r\n"
        lexer = CodeLexer(filedata)

        token = lexer.get_token()
        self.assertEqual(token.content, "A")
        token = lexer.get_token()
        self.assertEqual(token.content, "=")
        token = lexer.get_token()
        self.assertEqual(token.content, "10")
        token = lexer.get_token()
        self.assertEqual(token.content, ",")
        token = lexer.get_token()
        self.assertEqual(token.content, "B")
        token = lexer.get_token()
        self.assertEqual(token.content, "=")
        token = lexer.get_token()
        self.assertEqual(token.content, "99")
        token = lexer.get_token()
        self.assertEqual(token, None)

        pass

    def test_get_raw_token(self):
        filedata = "  A B  \n\t C DE F \r\n"
        lexer = CodeLexer(filedata)

        token = lexer.get_raw_token()
        self.assertEqual(token.content, "A B  ")
        token = lexer.get_raw_token()
        self.assertEqual(token.content, "C DE F \r")
        token = lexer.get_raw_token()
        self.assertEqual(token, None)

        pass

    def test_advance_by_reges(self):
        filedata = "  /// KFD \t ( \t C  \t)\n"
        lexer = CodeLexer(filedata)

        match_string = lexer.advance_by_regex(r"\s*///\s*KFD\s*\(")
        self.assertNotEqual(match_string, None)
        self.assertEqual(match_string, "  /// KFD \t (")

        c = lexer.get_leading_char()
        self.assertEqual(c, "C")
        lexer.skip_current_line()
        self.assertTrue(lexer.is_finished())

        filedata = "  \n"
        lexer = CodeLexer(filedata)

        # 测试空格行
        match_string = lexer.advance_by_regex(r"\s*///\s*KFD\s*\(")
        self.assertEqual(match_string, None)

        pass


if __name__ == "__main__":
    unittest.main(verbosity=2)
