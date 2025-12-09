#!/usr/bin/python3
# _*_ coding: utf-8 _*_

import unittest
from KFBaseTestCase import KFBaseTestCase
from pyKFD.pyKFDataType import KFDataType
from SourceCodeReader import SourceCodeReader

class SourceReaderTest(KFBaseTestCase):
    def setUp(self) -> None:
        KFDataType.Init()
        self.setting = super().LoadSetting()
        self.kfdtable =  super().LoadKFDTable(self.setting)
        return super().setUp()

    def test_contructor(self):
        reader = SourceCodeReader(self.kfdtable)
        self.assertEqual(reader.kfdtable, self.kfdtable)
        self.assertTrue(reader.import_code_objs is None)
        self.assertEqual(reader.code_suffix, '.h')
        self.assertEqual(reader.code_type, 'cpp')
        pass

    def test_load_codefile(self):
        reader = SourceCodeReader(self.kfdtable)
        reader.load(self.setting)
        self.assertEqual(reader.import_code_objs, self.setting.import_code_objs)
        self.assertEqual(reader.code_type, 'cpp')
        self.assertEqual(reader.code_suffix, '.h')

        self.assertEqual(len(self.kfdtable.import_KFDs_Group), 1)
        self.assertEqual(len(self.kfdtable.import_KFDs), 1)
        pass

if __name__ == '__main__':
    unittest.main(verbosity=2)
