#!/usr/bin/python3
# _*_ coding: utf-8 _*_

import os
import unittest
from KFBaseTestCase import *
from KFDataDefine import *


class UtilityTest(KFBaseTestCase):
    def setUp(self) -> None:
        return super().setUp()

    def test_load_file(self):
        filedata = LoadFile(os.path.realpath(gWorkDir + "/NotExistFileToLoad"), logError = False)
        self.assertEqual(filedata, "")

        filedata = LoadFile(os.path.realpath(gWorkDir + "/Test.json"))
        self.assertNotEqual(filedata, "")

        pass


if __name__ == "__main__":
    unittest.main(verbosity=2)
