from CodeFile import *
from Cheetah.Template import Template
import json

_cpp_types_infos = None

def CPP_Load_ByteArray_Template(dirpath):
    global _cpp_types_infos
    _cpp_types_infos = {}
    KFDataType.GetTypeID("")
    pass

def CPP_ByteArray_export_Header(kfddata,kfdtabel,dirpath,includes,cpp_template,export_api):

    context = {"data":kfddata,"NS":kfdtabel.kfd_ns,"typeids":KFDataType.Type_to_ids,"baseids":KFDataType.Base_Type_ids}
    context["info"] = kfdtabel.info
    context["export_api"] = export_api

    headfilestr = cpp_template["h"]
    clsname = kfddata["class"]

    # 写头文件
    # 把生成的文件包含进去
    includes.append("%sF.h" % (clsname,))
    headfilestr = str(Template(headfilestr, searchList=context))
    headpath = dirpath + ("/%sF.h" % (clsname,))
    SaveFile(headpath,headfilestr,True)
    pass


def GetSpecBaseClass(kfddata, kfdtabel, specbaseclass=None):
    if specbaseclass is None:
        specbaseclass = ["KFGCObject", "UObject"]
    baseclass = ""
    currdata = kfddata
    while currdata != None:
        extend = trystr(currdata, "extend")
        if extend == "":
            extend = trystr(currdata, "__src_extend__")
        #print("====>", extend)
        extend = extend.replace("KF::", "")
        if extend != "":
            if extend in specbaseclass:
                baseclass = extend
                break
            currdata = kfdtabel.get_kfddata(extend)
        else:
            currdata = None
    return baseclass
    

def PropRawTypeToName(prop):
    rawType = prop["rawType"]
    ptype = prop["type"]
    if rawType is not None and ptype is not None:
        if pyKFDataType.Is_BaseTypeStr(ptype) and ptype not in ["kfstr", "kfname"]:
            rawType = rawType.replace(ptype, pyKFDataType.ID_to_types[pyKFDataType.Type_to_ids[ptype]])
        return rawType.replace("<", "_").replace(">", "").replace(" ", "_").replace("*", "_")
    return ""


def GetMethodParamVectorName(ptype, value_type_prop):
    if value_type_prop is not None:
        if ptype in ["arr", "mixarr"]:
            return "kfVector_" + PropRawTypeToName(value_type_prop)
    return ""


def GetMethodParamMapName(ptype, key_type_prop, value_type_prop):
    if key_type_prop is not None and value_type_prop is not None:
        if ptype in ["map", "mixmap"]:
            return "kfMap_" + PropRawTypeToName(key_type_prop) + "_" + PropRawTypeToName(value_type_prop)
        elif ptype in ["omap", "mixomap"]:
            return "kfOMap_" + PropRawTypeToName(key_type_prop) + "_" + PropRawTypeToName(value_type_prop)
    return ""


def CheckMethodParamContainer(param, container_dicts, method_containers):
    if param is not None:
        param_type = param["type"]
        container_name = ""
        if param_type in ["arr", "mixarr"]:
            container_name = GetMethodParamVectorName(param_type, param["value_type_prop"])
        elif param_type in ["map", "mixmap", "omap", "mixmap"]:
            container_name = GetMethodParamMapName(param_type, param["key_type_prop"], param["value_type_prop"])

        param["containerTypeName"] = container_name
        if container_name != "" and container_name not in container_dicts:
            container_dicts[container_name] = param
            method_containers[container_name] = param

def ForEachFuncParam(func, paramfunc):
    if "retparam" in func:
        paramfunc(func["retparam"])
    if "params" in func:
        for param in func["params"]:
            paramfunc(param)


def CPP_Methods_export_Header(kfddata,kfdtabel,dirpath,includes,cpp_template,export_api,container_dicts,method_containers):
    context = {"data":kfddata,"NS":kfdtabel.kfd_ns,"typeids":KFDataType.Type_to_ids,"type2ids":KFDataType.Type_to_ids}
    context["info"] = kfdtabel.info
    context["export_api"] = export_api
    context["root_base_class"] = GetSpecBaseClass(kfddata, kfdtabel)

    # 计算需要包含的头文件
    funcsIncludes = set()
    def paramProc(param):
        ptype = param["type"]
        potype = param["otype"]
        if ptype == "object" and "isRef" not in param:
            funcsIncludes.add(potype)
        CheckMethodParamContainer(param, container_dicts, method_containers)

    if "funcs" in kfddata:
        funcs = kfddata["funcs"]
        for func in funcs:
            ForEachFuncParam(func, paramProc)

    for container_name in method_containers:
        funcsIncludes.add(container_name)
    context["funcsincludes"] = sorted(funcsIncludes)

    headfilestr = cpp_template["m"]
    #print("====>",headfilestr)
    clsname = kfddata["class"]

    # 写头文件
    # 把生成的文件包含进去
    includes.append("%s_methods.h" % (clsname,))
    headfilestr = str(Template(headfilestr, searchList=context))

    headpath = dirpath + ("/%s_methods.h" % (clsname,))
    SaveFile(headpath,headfilestr,True)

    pass


def CPP_Methods_Containers_export_Header(kfddata,kfdtabel,dirpath,includes,cpp_template,export_api,method_containers):
    context = {"data":kfddata,"NS":kfdtabel.kfd_ns,"typeids":KFDataType.Type_to_ids,"type2ids":KFDataType.Type_to_ids}
    context["export_api"] = export_api

    headfilestr = cpp_template["container_m"]
    #print("====>",headfilestr)

    # 写头文件
    # 把生成的文件包含进去
    for container_name in method_containers:
        context["container_name"] = container_name
        context["container_param"] = method_containers[container_name]
        includes.append("%s_methods.h" % (container_name,))
        resultfilestr = str(Template(headfilestr, searchList=context))

        headpath = dirpath + ("/%s_methods.h" % (container_name,))
        SaveFile(headpath,resultfilestr,True)

    pass


def GetMethodExtendCls(kfddata,kfdtabel):
    extendcls = ""
    extend = trystr(kfddata, "extend")
    if extend == "":
        extend = trystr(kfddata, "__src_extend__")
    if extend != "":
        extenddata = kfdtabel.get_kfddata(extend)
        # if extenddata is not None and "funcs" in extenddata and len(extenddata["funcs"]) != 0:
        if extenddata is not None:
            extendcls = extenddata["class"]
    return extendcls


def CPP_VM3_export_Header(kfddata, kfdtabel, dirpath, includes, cpp_template, export_api, setting):
    # if ("method" not in kfddata or kfddata["method"] == "0") and ("funcs" not in kfddata or len(kfddata["funcs"]) == 0):
    #     return

    genIncludePath = setting.export_vm3_path
    #print("vm3 ====> %s" % (genIncludePath,))

    context = {"data":kfddata,"NS":kfdtabel.kfd_ns,"typeids":KFDataType.Type_to_ids,"type2ids":KFDataType.Type_to_ids}
    context["info"] = kfdtabel.info
    context["export_api"] = export_api
    context["extendcls"] = GetMethodExtendCls(kfddata, kfdtabel)
    context["root_base_class"] = GetSpecBaseClass(kfddata, kfdtabel)
    #print(kfddata["class"], "====>", context["extendcls"], ", ", context["isgcobject"])

    # 计算需要包含的头文件
    notincludes = {"char", "kfstr", "kfname", "KFGCObject"}
    funcsIncludes = set()
    def paramProc(param):
        ptype = param["type"]
        potype = param["otype"]
        if (ptype == "object" or ptype == "mixobject") and potype not in notincludes:
            funcsIncludes.add(potype)

    if "funcs" in kfddata:
        funcs = kfddata["funcs"]
        for func in funcs:
            ForEachFuncParam(func, paramProc)

    context["funcsincludes"] = sorted(funcsIncludes)

    headfilestr = cpp_template["vm3m"]
    #print("====>",headfilestr)
    clsname = kfddata["class"]

    # 写头文件
    # 把生成的文件包含进去
    includes.append("v%s.h" % (clsname,))
    headfilestr = str(Template(headfilestr, searchList=context))

    headpath = genIncludePath + ("/v%s.h" % (clsname,))
    SaveFile(headpath,headfilestr,True)

    pass


def CPP_ByteArray_export_CPP(kfddatas, kfdtabel, dirpath, includes, cpp_template, kfd_filename):
    context = {
        "datas": kfddatas,
        "includes": includes,
        "NS": kfdtabel.kfd_ns,
        "typeids": KFDataType.Type_to_ids,
        "baseids": KFDataType.Base_Type_ids
    }
    context["info"] = kfdtabel.info

    output_list = [{
        "filename": kfd_filename.replace(".kfd", "MERGED.cpp"),
        "template": cpp_template["cpp"]
    }, {
        "filename": kfd_filename.replace(".kfd", "REFL.cpp"),
        "template": cpp_template["refl"]
    }]

    # 写相关代码文件
    for item in output_list:
        cppFileName = item["filename"]
        cppfilestr = item["template"]
        cppfilestr = str(Template(cppfilestr, searchList=context))
        cpppath = dirpath + "/" + cppFileName
        SaveFile(cpppath, cppfilestr, True)

    pass


def CPP_VM3_export_Header_All(kfdtabel, tmpl, setting):
    newkfddatas = []
    for kfddata in kfdtabel.kfddata_maps.values():
        # if ("method" not in kfddata or kfddata["method"] == "0") and (
        #         "funcs" not in kfddata or len(kfddata["funcs"]) == 0):
        #     continue
        nof = trynum(kfddata,"nof")
        method = trynum(kfddata, "method")
        if (nof != 1 and ("method" not in kfddata or method == 1)) or (nof == 1 and method == 1):
            newkfddatas.append(kfddata)

    genIncludePath = setting.export_vm3_path
    #print("vm3 ====> %s" % (genIncludePath,))

    context = {"datas":newkfddatas,"NS":kfdtabel.kfd_ns,"typeids":KFDataType.Type_to_ids,"type2ids":KFDataType.Type_to_ids}
    context["info"] = kfdtabel.info

    allheadfilestr = tmpl["vm3mall"]

    allheadfilestr = str(Template(allheadfilestr, searchList=context))

    allheadpath = genIncludePath + "/vAll.h"
    SaveFile(allheadpath,allheadfilestr,True)

    pass


def CPP_VM3_export_Completion(kfdtabel, tmpl, setting):
    newkfddatas = []
    extras = {}
    for kfddata in kfdtabel.kfddata_maps.values():
        # if ("method" not in kfddata or kfddata["method"] == "0") and (
        #         "funcs" not in kfddata or len(kfddata["funcs"]) == 0):
        #     continue
        nof = trynum(kfddata, "nof")
        method = trynum(kfddata, "method")
        if (nof != 1 and ("method" not in kfddata or method == 1)) or (nof == 1 and method == 1):
            newkfddatas.append(kfddata)
            extraItem = {}
            extraItem["extendcls"] = GetMethodExtendCls(kfddata, kfdtabel)
            extraItem["root_base_class"] = GetSpecBaseClass(kfddata, kfdtabel)
            extras[kfddata["class"]] = extraItem

    genIncludePath = setting.export_vm3_path
    #print("vm3 ====> %s" % (genIncludePath,))

    context = {"datas": newkfddatas, "NS": kfdtabel.kfd_ns, "typeids": KFDataType.Type_to_ids,
               "type2ids": KFDataType.Type_to_ids}
    context["info"] = kfdtabel.info
    context["extras"] = extras

    filestr = tmpl["vm3mcompletion"]

    filestr = str(Template(filestr, searchList=context))

    completionpath = genIncludePath + "/vCompletion.json"
    SaveFile(completionpath, filestr, True)

    pass
