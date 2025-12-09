#!/usr/bin/python3
# _*_ coding: utf-8 _*_

import os
import unittest
from KFBaseTestCase import KFBaseTestCase, gWorkDir
from pyKFD.pyKFDataType import KFDataType
from KFD import KFD 

class KFDTest(KFBaseTestCase):
    def setUp(self) -> None:
        KFDataType.Init()
        self.setting = super().LoadSetting()
        self.kfdtable = super().LoadKFDTable(self.setting)
        return super().setUp()

    def test_kfd_object(self):
        kfd = KFD(self.kfdtable, False)
        kfd.kfd_filename = "kfdA.json"
        self.assertEqual(kfd.kfd_datas, None)

        kfddata = []
        kfd.add_datas(kfddata)
        self.assertEqual(len(kfd.kfd_datas), 0)

        kfddata = {}
        kfd.add_one_data(kfddata)
        self.assertEqual(len(kfd.kfd_datas), 1)
        kfd.make_methodKFDs()
        kfd.exportKFD(os.path.realpath(gWorkDir + "/Data"))

        pass

if __name__ == '__main__':
    unittest.main(verbosity=2)
