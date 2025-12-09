from SourceCodeReader import *
from KFDTable import *
from SourceCodeWriter import *
from KFDataToolSetting import *

"""
1.0.1
增加include_kfd_paths 只文件夹下的文件只加载进来依赖不做任何输出

2020.03.05

fix 对于include进来的KFD不用做CPPTypeDefExport
fix 对于include进来的KFD导出时因为没有指定导出名称报错

2020.03.06

fix 浏览器embed kfd文件的目录
add 增加对ts文件的扫描, 导出定还是和CPP一样
"""

KFDATA_TOOL_VER = "1.0.1"


def main(args):
    if len(args) < 2:
        print(args[0] + " ConfigPath")
        return

    init_logging(logging.DEBUG, False)

    # 初始化数据类型
    KFDataType.Init()
    # 读取配置文件
    configpath = abspath(args[1])
    setting = None

    if not os.path.exists(configpath):
        logging.error("%s does not exist", configpath)
        pass
    else:
        workdir = os.path.dirname(configpath)
        # 切换工作目录吧
        os.chdir(workdir)
        print("current work dir:", workdir)

        setting = KFDataToolSetting(configpath)

        if setting.initSucc:
            # 读取原有的KFD文件
            kfdtabel = KFDTable()
            kfdtabel.load(setting)
            # 从源代码中读取KFD文件
            reader = SourceCodeReader(kfdtabel)
            reader.load(setting)
            # 导出方法KFD
            #kfdtabel.make_methoddef()
            # 构造声明了typedef的类信息
            kfdtabel.make_typedef()
            # 导出所有文件
            writer = SourceCodeWriter(kfdtabel)
            writer.export(setting)
        else:
            logging.error("setting initSucc=False msg=%s", setting.errorMsg)
            pass
        pass
    pass

    global KFDATA_TOOL_VER
    print("\n=============KFDataTool(%s)==========\n" % KFDATA_TOOL_VER)

    pass


if __name__ == "__main__":
    main(sys.argv)
