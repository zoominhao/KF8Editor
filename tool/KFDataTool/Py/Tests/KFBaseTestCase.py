#!/usr/bin/python3
# _*_ coding: utf-8 _*_

import os
import unittest
import sys

gWorkDir = os.path.realpath(os.path.dirname(os.path.realpath(__file__)))
gRootDir = os.path.realpath(gWorkDir + '/..')
sys.path.append(gRootDir)

from KFDataToolSetting import KFDataToolSetting
from KFDTable import KFDTable

gTestConfigFile = os.path.realpath(gWorkDir + "/Test.json")

class KFBaseTestCase(unittest.TestCase):

    # 加载setting
    def LoadSetting(self):
        configdir = os.path.dirname(gTestConfigFile)
        os.chdir(configdir)
        setting = KFDataToolSetting(gTestConfigFile);
        self.assertTrue(setting is not None)
        self.assertTrue(setting.initSucc, setting.errorMsg)
        return setting
        pass

    # 加载kfdtable
    def LoadKFDTable(self, setting):
        kfdtable = KFDTable()
        kfdtable.load(setting)
        self.assertTrue(kfdtable.is_loaded)
        return kfdtable
        pass


    
