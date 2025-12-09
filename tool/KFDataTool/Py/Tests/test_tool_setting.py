#!/usr/bin/python3
# _*_ coding: utf-8 _*_

import os
import unittest
from KFBaseTestCase import KFBaseTestCase, gTestConfigFile
from KFDataDefine import trystr
from pyKFD.pyKFDataType import KFDataType
from KFDataToolSetting import KFDataToolSetting, ToolSettingFormat


class ToolSettingTest(KFBaseTestCase):
    def setUp(self) -> None:
        KFDataType.Init()
        return super().setUp()

    def test_load_json_file(self):
        config = ToolSettingFormat.LoadJsonConfig(gTestConfigFile)
        self.assertFalse(config is None)

        """
        加载配置后, 将import_groups中的group、export_info放入到各个import_code_paths, 删除import_groups并上提import_code_paths
        "import_groups": [
            {
                "group": "KFDTest",
                "export_info": {
                    "export_code_path": "GenTest/Serialize",
                    "export_typecode_path": "",
                    "export_api": "RA_API"
                },
                "import_code_paths": [
                    {
                        "path": "GenTest",
                        "headpath": ""
                    }
                ]
            }
        ]

        ====>

        "import_code_paths": [
            {
                "group": "KFDTest",
                "export_info": {
                    "export_code_path": "GenTest/Serialize",
                    "export_typecode_path": "",
                    "export_api": "RA_API"
                },
                "path": "GenTest",
                "headpath": ""
            }
        ]
        """
        self.assertTrue("import_groups" not in config)
        self.assertTrue("import_code_paths" in config)

        import_code_paths = config["import_code_paths"]
        self.assertEqual(len(import_code_paths), 1)
        self.assertTrue(isinstance(import_code_paths, list))

        self.assertEqual(trystr(config, "import_kfd_path"), "GenTest/import")
        self.assertTrue("export_code_path" in config)
        self.assertTrue("export_kfd_path" in config)
        self.assertTrue("export_kfd_table" in config)
        self.assertTrue("export_vm3_path" in config)
        self.assertTrue("template_path" in config)
        self.assertEqual(trystr(config, "namespace"), "KF")

        self.assertTrue("code_type" in config)
        self.assertTrue(config["code_type"] in ['cpp'])
        self.assertTrue("data_type" in config)
        self.assertTrue(config["data_type"] in ['bytearr'])

        self.assertTrue("info_props" in config)
        self.assertTrue("typeDefTypes" in config)
        self.assertTrue("projectname" in config)
        self.assertTrue("include_kfd_paths" in config)
        self.assertTrue("__cls__" in config)

        pass

    def test_setting_object(self):
        configdir = os.path.dirname(gTestConfigFile)
        os.chdir(configdir)
        setting = KFDataToolSetting(gTestConfigFile);
        self.assertTrue(setting is not None)
        self.assertTrue(setting.initSucc, setting.errorMsg)
        self.assertEqual(setting.configPath, gTestConfigFile)

        self.assertEqual(len(setting.import_code_objs), 1)

        self.assertTrue(isinstance(setting.import_code_objs, list))
        self.assertTrue(setting.import_kfd_path is not None)
        self.assertTrue(isinstance(setting.import_kfd_path, str))
        self.assertTrue(isinstance(setting.export_code_path, str))
        self.assertTrue(isinstance(setting.export_kfd_path, str))
        self.assertTrue(isinstance(setting.export_kfd_table, str))
        self.assertTrue(isinstance(setting.export_vm3_path, str))
        self.assertTrue(isinstance(setting.template_path, str))
        self.assertEqual(setting.namespace, "KF")
        self.assertEqual(setting.code_type, "cpp")
        self.assertEqual(setting.data_type, "bytearr")
        self.assertTrue(isinstance(setting.info, dict))
        self.assertTrue(isinstance(setting.typeDefTypes, list))
        self.assertTrue(isinstance(setting.include_kfd_paths, list))

        pass

if __name__ == '__main__':
    unittest.main(verbosity=2)
