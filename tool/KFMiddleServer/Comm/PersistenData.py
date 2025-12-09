#! /usr/bin/env python
#coding=utf-8

import json
import logging
import os


class PersistenData:
    _instance = None
    @staticmethod
    def Instance(filePath = None):
        if PersistenData._instance is None:
            PersistenData._instance = PersistenData(filePath)
        return PersistenData._instance
        pass

    def __init__(self,filePath = ""):
        self.filePath = filePath
        if self.filePath is None or len(self.filePath) == 0:
            self.filePath = "./cache/%s"
        self.filehead = "%s.cache"
        pass

    def keepData(self,name,data):
        #logging.debug("try to keepdata %s",name)
        if data is None:
            return
        datastr = None
        try:
           datastr = json.dumps(data)
        except Exception as err:
            logging.error(err)
            datastr = None
            pass
        if datastr is not None:
            filename = self.filePath % (name,)
            self.save_data_to_jfile(filename, datastr)
        pass

    def loadData(self,name):
        data = None
        datastr = self.load_data_from_jfile(self.filePath % (name,))
        try:
            if datastr is not None:
                data = json.loads(datastr)
        except Exception as err:
            data = None
            logging.error(err)
        return data
        pass

    def load_data_from_jfile(self,name):
        path = os.path.abspath(self.filehead % (name,))
        datastr = None
        datafile = None
        if os.path.isfile(path):
            try:
                datafile = open(path,'r')
                datastr = datafile.read()
            finally:
                if datafile is not None:
                    datafile.close()
        #logging.debug("%s\n%s",path,datastr)
        return datastr
        pass

    def save_data_to_jfile(self,name, datastr):
        path = os.path.abspath(self.filehead % (name,))
        datafile = None
        try:
            if not os.path.isfile(path):
                dirname = os.path.dirname(path)
                if not os.path.exists(dirname):
                    os.mkdir(dirname)
                    logging.info("create cachedir:%s",dirname)
                    pass
                pass
            datafile = open(path,'w+')
            datafile.write(datastr)
        except Exception as err:
            logging.error(err)
            pass
        finally:
            if datafile is not None:
                datafile.close()
            path
        pass

    pass