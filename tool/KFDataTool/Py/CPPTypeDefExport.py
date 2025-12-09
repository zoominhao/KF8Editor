from CodeFile import *
from Cheetah.Template import Template

def CPP_Typedef_export(typedefinfo,kfdtabel,dirpath,includes,tmpl):

    clsname = typedefinfo["class"]
    cls_def_map = kfdtabel.cls_def_map
    clsdef = cls_def_map[clsname]
    td_kfdata = kfdtabel.kfddata_maps[clsname]
    pkeyinfo = kfdtabel.get_propkey(td_kfdata)
    export_info = tryobj(typedefinfo, "export_info")

    if pkeyinfo is None and td_kfdata["typeid"] != -1:
        logging.error("class(%s) not found key",clsname)
        return

    keyval = trystr(pkeyinfo,"KEY")
    DEF_ENUM = (keyval != "CUSTOM" and keyval != "")
    USECLSID = (keyval == "CLASSID")

    pkeyname = trystr(pkeyinfo,"name")

    context = {
        "data":typedefinfo,
        "USECLSID":USECLSID,
        "DEF_ENUM":DEF_ENUM,
        "CLASS":clsname,
        "CLSID":td_kfdata["clsid"],
        "NS":kfdtabel.kfd_ns,
        "KEY_PROP_NAME":pkeyname
    }
    context["info"] = kfdtabel.info
    context["kfd"] = td_kfdata
    context["export_api"] = trystr(export_info, "export_api")

    #print(json.dumps(context))
    # 写头文件
    # 把生成的文件包含进去
    includes.append("%sTypeDef.h" % (clsname,))
    headpath = dirpath + ("/%sTypeDef.h" % (clsname,))
    headfilestr = tmpl["h"]
    headfilestr = str(Template(headfilestr, searchList=context))
    SaveFile(headpath, headfilestr, True)
    logging.debug("typedef h file: %s", headpath)

    # 写CPP文件
    cppfilestr = tmpl["cpp"]
    cppfilestr =str(Template(cppfilestr, searchList=context))
    cpppath = dirpath + ("/%sTypeDef.cpp" % (clsname,))
    SaveFile(cpppath, cppfilestr, True)
    logging.debug("typedef cpp file: %s", cpppath)

    pass
