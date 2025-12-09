#!/usr/bin/python3
# _*_ coding: utf-8 _*_

import os
import unittest
from KFBaseTestCase import KFBaseTestCase, gWorkDir
from KFDataDefine import tryobj
from pyKFD.pyKFDataType import KFDataType
from KFDTable import KFDTable

class KFDTableTest(KFBaseTestCase):
    def setUp(self) -> None:
        KFDataType.Init()
        self.setting = super().LoadSetting()
        return super().setUp()

    def test_kfd_table_object(self):
        #读取原有的KFD文件
        kfdtable = KFDTable()
        kfdtable.load(self.setting)
        self.assertTrue(kfdtable.is_loaded)

        self.assertTrue(isinstance(kfdtable.info, dict))
        self.assertEqual(len(kfdtable.info), 0)
        self.assertEqual(len(kfdtable.kfddata_maps), 0)
        self.assertEqual(len(kfdtable.import_KFDs), 0)
        self.assertFalse(hasattr(kfdtable, 'cls_typedef_map'))

        # 类表路径
        self.assertEqual(kfdtable.kfd_ns, self.setting.namespace)
        table_file_path = self.setting.export_kfd_path + "/" + self.setting.export_kfd_table
        self.assertEqual(kfdtable.kfd_table_file, table_file_path)

        # 类名、类ID映射表
        self.assertTrue(isinstance(kfdtable.cls_def_list, list))
        self.assertEqual(len(kfdtable.cls_def_list) * 2, len(kfdtable.cls_def_map))
        for key in kfdtable.cls_def_map:
           self.assertTrue(key == kfdtable.cls_def_map[key]["id"] or key == kfdtable.cls_def_map[key]["class"]) 

        # 路径映射到setting的import_code_objs
        self.assertEqual(len(kfdtable.dir_2_group), 1)
        export_code_path = os.path.realpath(gWorkDir + "/GenTest/Serialize")
        self.assertEqual(len(tryobj(kfdtable.dir_2_group, export_code_path)), 1)
        self.assertEqual(tryobj(kfdtable.dir_2_group, export_code_path)[0], self.setting.import_code_objs[0])

        pass

if __name__ == '__main__':
    unittest.main(verbosity=2)
