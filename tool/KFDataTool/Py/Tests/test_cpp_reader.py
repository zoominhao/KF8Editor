#!/usr/bin/python3
# _*_ coding: utf-8 _*_

import os
import unittest

from KFBaseTestCase import KFBaseTestCase
from CPP import CPP
from KFDataDefine import *
from pyKFD.pyKFDataType import KFDataType
from SourceCodeReader import SourceCodeReader

def buildTestCodeFile(setting, kfdtable, filename):
    if len(setting.import_code_objs) < 1:
        return None

    import_code_object = setting.import_code_objs[0]
    path = trystr(import_code_object, "path")
    group = trystr(import_code_object, "group")
    export_info = tryobj(import_code_object, "export_info")

    filepath = os.path.realpath(path + "/" + filename)

    reader = SourceCodeReader(kfdtable)
    codefile = CPP(reader)
    codefile.filename = filename.replace(reader.code_suffix, "")
    codefile.group = group
    codefile.export_info = export_info
    codefile.filepath = filepath
    return codefile

class CppReaderTest(KFBaseTestCase):
    def setUp(self) -> None:
        KFDataType.Init()
        self.setting = super().LoadSetting()
        self.kfdtable = super().LoadKFDTable(self.setting)
        return super().setUp()

    def test_load_codefile(self):
        filename = "KFDTestObject.h"
        codefile = buildTestCodeFile(self.setting, self.kfdtable, filename)
        self.assertNotEqual(codefile, None)
        codefile.load(codefile.filepath, filename)

        self.assertEqual(codefile.filename, "KFDTestObject")
        self.assertEqual(codefile.include, filename)
        self.assertEqual(len(self.kfdtable.import_KFDs), 1)

        pass

if __name__ == "__main__":
    #init_logging(logging.DEBUG, True)
    unittest.main(verbosity=2)
