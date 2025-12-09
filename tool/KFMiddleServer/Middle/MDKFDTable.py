import os
import logging

from pyKFD.pyKFDTable import *
from Comm.Funcs import *

class KFDLoader(object):

    def __init__(self,kfdtable,kfd_datas = None):
        self.kfd_table = kfdtable
        self.kfd_filename = ""
        if isinstance(kfd_datas,list):
            self.kfd_datas = kfd_datas
        else:
            self.kfd_datas = None
        pass

    def add_datas(self,kfd_datas):
        if self.kfd_datas is None:
            self.kfd_datas = kfd_datas
        else:
            self.kfd_datas.extend(kfd_datas)
        pass

    def add_one_data(self,kfd_data):
        if self.kfd_datas is None:
            self.kfd_datas = []
        self.kfd_datas.append(kfd_data)
        pass

    def load(self,path):
        #加载数据文件
        jsondata = LoadConfigFromJson(path)
        if isinstance(jsondata,list) == False:
            if jsondata is not None:
                self.add_one_data(jsondata)
                pass
            pass
        elif jsondata is not None:
            self.add_datas(jsondata)
            pass

        self.kfd_table.add_KFDDatas(self.kfd_datas)
        logging.info("load kfd path:%s",path)
        pass
    pass

class MDKFDTable(pyKFDTable):

    def __init__(self):
        pyKFDTable.__init__(self)
        self.is_loaded = False
        pass

    def add_KFDDatas(self,kfd_datas):
        count = len(kfd_datas)
        i = 0
        while i < count:
            kfddata = kfd_datas[i]
            clsname = trystr(kfddata,"class")
            if tryobj(self.kfddata_maps,clsname) is not None:
                logging.error("class(%s) duplicate definition",clsname)
                pass
            self.kfddata_maps[clsname] = kfddata
            i += 1
        pass

    def load_kfds(self, import_kfd_path):
        if self.is_loaded:
            return
        self.load_kfd_dir(import_kfd_path)
        self.is_loaded = True
        pass

    def load_kfd_dir(self, dirpath, JSONFILE = False):
        if os.path.exists(dirpath):
            files = os.listdir(dirpath)
            for file in files:
                filepath = dirpath + "/" + file
                if not os.path.isdir(filepath):
                    if file.endswith(".kfd") or (JSONFILE and file.endswith(".json")):
                        kfdpath = filepath
                        kfd = KFDLoader(self)
                        kfd.load(kfdpath)
                    pass
                else:
                    self.load_kfd_dir(filepath)
                    pass
        else:
            logging.error("dirpath[%s] FileNotFoundError",dirpath)
        pass
    pass
