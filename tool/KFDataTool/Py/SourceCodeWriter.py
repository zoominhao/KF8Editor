
from  SCDefine import *
import os

class SourceCodeWriter(object):
    def __init__(self,kfdTabel = None):
        self.kfdtable = kfdTabel
        pass

    def export_code_path(self,export_info):
        if export_info is None:
            return None
        else:
            export_path =trystr(export_info,"export_code_path")
            if export_path == "":
                return None
            return export_path
        pass

    # exts: 扩展名列表比如 [".cpp", ".h"]
    def clearDir(self, dirname, exts):
        for fname in os.listdir(dirname):
            if os.path.splitext(fname)[1] in exts:
                logging.debug("remove file %s", fname)
                os.remove(os.path.join(dirname,fname))
                pass
            pass
        pass

    # 在导出之前先清空掉文件夹
    def clearExportDir(self, setting):

        exts = []
        if setting.code_type == "cpp":
            exts = [".cpp", ".h"]

        self.clearDir(setting.export_code_path, exts)

        for ico in setting.import_code_objs:
            export_info = tryobj(ico, "export_info")
            if export_info is not None:
                export_code_path = tryobj(export_info, "export_code_path")
                if export_code_path != "":
                    self.clearDir(export_code_path, exts)
                    pass
                pass
            pass

        # 也清下为VM导出的头文件夹
        #tmpInclude = setting.configPath.replace("/Config/Kungfu.json", "/Include/Generated")
        tmpInclude = setting.export_vm3_path
        if not os.path.exists(tmpInclude):
            os.makedirs(tmpInclude, True)
        self.clearDir(tmpInclude, exts)
        pass



    def export(self, setting):
        # 先写类型列表
        if self.kfdtable is None:
            return

        self.clearExportDir(setting)

        obj = self.kfdtable.get_file_data()

        export_kfd_path = setting.export_kfd_path
        path = export_kfd_path + "/" + setting.export_kfd_table
        SaveConfigFromObject(path, obj)

        # 保存一下个自定义的数据
        if setting.typeDefTypes and len(setting.typeDefTypes) > 0:
            typeDefTypesPath = export_kfd_path + "/typeDefTypes.json"
            SaveConfigFromObject(typeDefTypesPath, setting.typeDefTypes)
            pass

        # 根据类型导出所有的类型或解析类
        code_type = setting.code_type

        # 如果setting.template_path没有定义则通过PY文件确定模块文件
        template_path = setting.template_path
        if template_path is None or template_path == "":
            absfilepath = os.path.abspath(os.path.dirname(__file__) + "/../Template")
            print("reset template_path:", absfilepath)
            template_path = absfilepath
            pass

        # export kfd file and source file
        load_code_template(code_type, template_path, setting.data_type)
        exportKFD = get_kfd_export(code_type)

        kfds = self.kfdtable.import_KFDs
        count = len(kfds)
        i = 0

        includes = []
        export_code_path = setting.export_code_path

        while i < count:
            kfd = kfds[i]
            # 导出路径的定义
            exportCodePath = self.export_code_path(kfd.export_info)
            if exportCodePath is None:
                exportCodePath = export_code_path
            # 如果不需要导出结构体则需要输出一个KFD文件
            if not kfd.isinclude:
                if not kfd.exportstruct:
                    kfd.exportKFD(export_kfd_path)
                else:
                    kfd.exportStruct(exportCodePath)
                    pass
                pass
            # 导出解析文件吧
            if exportKFD is not None and not kfd.isinclude:
                # 导出数据
                exportKFD(kfd, self.kfdtable, exportCodePath, includes, setting)
            i += 1
            pass

        # 最后写入一些统计类信息
        exportEnd = get_export_end(code_type)
        if exportEnd is not None:
            kfdtabel = self.kfdtable
            for clsname in kfdtabel.typedef_map:
                typedef = kfdtabel.typedef_map[clsname]
                # 新增如果不在include内才导出
                if not typedef["isinclude"]:
                    export_dirpath = ""
                    # 先从EXPORTINFO中查看是否有导出TYPECODE的路径
                    export_info = tryobj(typedef, "export_info")
                    if export_info is not None:
                        export_dirpath = trystr(export_info, "export_typecode_path")
                        # 然后从定义中找是否有导出代码的路径
                        if export_dirpath == "":
                            export_dirpath = trystr(export_info, "export_code_path")
                    # 最后用默认路径导出代码
                    if export_dirpath == "":
                        export_dirpath = export_code_path
                    exportEnd(typedef, self.kfdtable, export_dirpath, includes)
                    pass
                pass

        # 最后的最后,导出需要的汇总文件
        # TODO 这里会改掉
        exportFinally = get_export_finally(code_type)
        if exportFinally is not None:
            exportFinally(self.kfdtable, setting)
            pass

        pass
    pass
