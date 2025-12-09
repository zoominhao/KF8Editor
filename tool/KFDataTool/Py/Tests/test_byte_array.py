#!/usr/bin/python3
# _*_ coding: utf-8 _*_

import unittest
from KFBaseTestCase import KFBaseTestCase
from pyKFD.pyKFByteArray import *

class ByteArrayTest(KFBaseTestCase):
    def setUp(self) -> None:
        return super().setUp()

    def test_varuint(self):
        wvalue = 0x101
        byte_array = KFByteArray()
        byte_array.write_varuint(wvalue)
        self.assertEqual(byte_array.available_size(), 2)
        rvalue = byte_array.read_varuint()
        self.assertEqual(rvalue, wvalue)
        pass

    def test_varint(self):
        wvalue = -1
        byte_array = KFByteArray()
        byte_array.write_varint(wvalue)
        self.assertEqual(byte_array.available_size(), 1)
        rvalue = byte_array.read_varint()
        self.assertEqual(rvalue, wvalue)
        pass

if __name__ == '__main__':
    unittest.main(verbosity=2)
