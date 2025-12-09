#读取源代码

from SCDefine import *
from KFDTable import *

class SourceCodeReader(object):

    def __init__(self, kfdTabel = None):
        self.kfdtable = kfdTabel
        self.import_code_objs = None
        self.code_suffix = ".h"
        self.code_type = "cpp"
        pass

    def addCodeFile(self,codefile):

        if self.kfdtable is None:
            return

        kfd_datas = codefile.kfd_datas
        group = codefile.group
        export_info = codefile.export_info

        kfd = None
        #如果存在分组先获得这个分组的KFD
        if group is not None:
            kfd = self.kfdtable.get_KFD_Group(group)
        #如果KFD是空则创建一个
        if kfd == None:
            kfd = KFD(self.kfdtable,False,kfd_datas)

            if export_info is not None:
                kfd.export_info = export_info

            if group is None:
                kfd.kfd_filename = codefile.filename + ".kfd"
            else:
                kfd.kfd_filename = group + ".kfd"

            self.kfdtable.add_KFD(kfd,group)
        else:
            if export_info is not None:
                kfd.export_info = export_info

            kfd.add_datas(kfd_datas)
            self.kfdtable.add_KFDDatas(kfd_datas,kfd)
        pass

    def load(self,setting):
        logging.debug(">>LOAD ALL CODE FILES<<")

        self.import_code_objs = setting.import_code_objs
        self.code_type = setting.code_type
        self.code_suffix = get_sc_suffix(setting.code_type)

        if self.import_code_objs is None:
            return

        count = len(self.import_code_objs)
        index = 0
        while index < count:
            codeobj = self.import_code_objs[index]
            srcpath = trystr(codeobj,"path")
            logging.debug("SEARCH :%s",srcpath)
            # 检测下代码路径的分组
            group = trystr(codeobj, "group")
            if group == "":
                group = None
            # 检测头文件路径
            headpath = trystr(codeobj,"headpath")
            # 检测导出文件
            export_info = None
            if "export_info" in codeobj:
                export_info = codeobj["export_info"]

            self.load_dir(srcpath,group,headpath,'',export_info)
            index += 1
        pass

    def load_dir(self,dirpath,group,headpath,subdirpath = '',export_info = None):

        files = os.listdir(dirpath)

        for file in files:

            filepath = dirpath + "/" + file

            #子目录或子文件路径
            if subdirpath == '':
                xsubdirpath = file
            else:
                xsubdirpath = subdirpath + "/" + file

            if not os.path.isdir(filepath):
                if file.endswith(self.code_suffix):
                    codepath = filepath
                    codefile = get_code_reader(self.code_type,self)
                    codefile.filename = file.replace(self.code_suffix,"")
                    codefile.group = group
                    codefile.export_info = export_info
                    #设置头文件
                    includepath = xsubdirpath
                    if headpath != "":
                        includepath = headpath + "/" + xsubdirpath
                    codefile.load(codepath,includepath)
                pass
            else:
                self.load_dir(filepath,group,headpath,xsubdirpath,export_info)
        pass
    pass