from CPPByteArrayExport import *
from CPPTypeDefExport import *
from CPPAnyExport import  *
from CPPDirUtilExport import  *
import re

class CPP(CodeFile):

    def __init__(self, reader):
        CodeFile.__init__(self, reader, r'^///\s*KFD\s*\(')
        pass

    def __parse_class_string(self, currstr, kfd):
        classname = ""
        extendname = ""
        # 格式举例: "TEST_API className : public ExtendClass0,public ExtendClass1"

        # 去掉public关键字
        currstr = currstr.replace("public ", "")
        # 判定是否有 ':'
        extendindex = currstr.find(':')
        str0 = ""
        str1 = ""

        if extendindex == -1:
            str0 = currstr
        else:
            str0 = currstr[0:extendindex]
            str1 = currstr[extendindex + 1:]
            pass

        # 查找类的名称
        tmparr = str0.split(" ")
        clsindex = len(tmparr) - 1
        while clsindex >= 0:
            clsstr = tmparr[clsindex]
            if clsstr != "":
                classname = clsstr
                break
            clsindex -= 1
            pass
        pass

        # 查找扩展类名
        if str1 != "":
            str1 = str1.split(",")[0]
            extendname = str1.replace(" ","")
            pass

        kfd["class"] = classname
        kfd["extend"] = extendname

        return classname, extendname

    def __find_name(self, ptype, itemlist, defualtname=''):
        retname = defualtname
        for item in itemlist:
            if ptype.find(item) != -1:
                retname = item
                break
        return retname

    def __find_array_name(self, ptype):
        return self.__find_name(ptype, ['vector<', 'kfVector<'])

    def __find_map_name(self, ptype):
        return self.__find_name(ptype, ['kfMap<', 'unordered_map<'])

    def __find_omap_name(self, ptype):
        return self.__find_name(ptype, ['kfOMap<', 'map<'])

    def __find_ref_name(self, ptype):
        return self.__find_name(ptype, ['kfRef<'])

    def __parse_use_type(self, ptype):
        ref_name = self.__find_ref_name(ptype)
        array_name = self.__find_array_name(ptype)
        map_name = self.__find_map_name(ptype)
        omap_name = self.__find_omap_name(ptype)

        has_pointer = (ptype.find('*') != -1)
        has_referrence = (ref_name != "")
        has_pointer_or_referrence = (has_referrence or has_pointer)

        use_type = ""
        if map_name and has_pointer_or_referrence:
            use_type = "mixmap"
        elif map_name:
            use_type = "map"
        elif omap_name and has_pointer_or_referrence:
            use_type = "mixomap"
        elif omap_name:
            use_type = "omap"
        elif array_name and has_pointer_or_referrence:
            use_type = "mixarr"
        elif array_name:
            use_type = "arr"
        elif has_pointer_or_referrence:
            use_type = "mixobject"
        elif not pyKFDataType.Is_BaseTypeStr(ptype):
            use_type = "object"
        else:
            return use_type, ptype, has_referrence

        if use_type not in ["", "object"]:
            ptype = erase_substring(ptype, ['*', '>', ref_name, array_name, map_name, omap_name])

        return use_type, ptype, has_referrence

    # 解析属性类型，如 "int32","object","mixarr"等
    def __parse_variable_type(self, ptype, kfd_data):
        use_type = trystr(kfd_data, "USETYPE")
        if use_type == '':
            use_type, ptype, has_referrence = self.__parse_use_type(ptype)
        else:
            del kfd_data["USETYPE"]

        if use_type != "":
            if has_referrence and use_type in ["mixobject", "mixarr", "mixmap", "mixomap"]:
                kfd_data["refptr"] = "GetPtr"
                kfd_data["refone"] = "_MoreThenOne"
                pass

            if use_type in ["map", "mixmap", "omap", "mixomap"]:
                pair_index = ptype.find(',')
                kfd_data["first_otype"]= (ptype[0:pair_index]).strip()
                kfd_data["second_otype"] = (ptype[pair_index + 1:]).strip()
                kfd_data["type"] = use_type
            else:
                kfd_data["otype"] = ptype
                kfd_data["type"] = use_type
            pass
        else:
            kfd_data["type"] = ptype
        
        pass

    def __parse_variable(self, typestr, kfd_data, isparam = False):
        # 去掉一些修饰词和空格
        typestr = typestr.strip()
        typestr = erase_substring(typestr, ["const ", "constexpr ", "static ", "std::"])

        # 有赋值的情况
        if typestr.find('=') != -1:
            arrstrs = typestr.split("=")
            typestr = arrstrs[0]
            defaultstr = arrstrs[1]
            # 先去掉两头的空格再去掉双引号
            defaultstr = defaultstr.strip().replace('"', "")
            if kfd_data.get("default", "") == "":
                kfd_data["default"] = defaultstr

        # 去掉空格
        typestr = typestr.strip()
        starindex = typestr.rfind(" ")
        if starindex != -1:
            ptype = typestr[0:starindex]
            pname = typestr[starindex + 1:]

            if pname.find('*') != -1:
                pname = pname.replace('*', '')
                ptype += '*'

            if isparam:
                # 如果是解析参数且包含有&则是引用参数
                if ptype.find('&') != -1 or pname.find('&') != -1:
                    kfd_data["id"] = 1
                pass

            ptype = ptype.replace('&', '')
            pname = pname.replace('&', '')

            kfd_data["name"] = pname
            # 解析变量类型
            self.__parse_variable_type(ptype, kfd_data)
        else:
            kfd_data["type"] = ""
            kfd_data["name"] = ""
        pass

    def parse_custom_variable(self, codestr, obj, isparam = False):
        codestr = codestr.strip()
        obj["rawType"] = codestr.replace("&","")
        #print("rawType:", codestr)
        if codestr.find("const ") != -1:
            obj["isConst"] = True
            codestr = codestr.replace("const ","")
            pass
        # 引用关注下
        if codestr.find("&") != -1:
            obj["isRef"] = True
            pass

        codestr = codestr.replace("&", "")
        codestr = codestr.replace("std::","")
        hasArr = (self.__find_array_name(codestr) != '')
        hasMap = (self.__find_map_name(codestr) != '')
        hasOMap = (self.__find_omap_name(codestr) != '')

        if hasArr:
            begin = codestr.find('<')
            end = codestr.rfind('>')
            if begin != -1 and end != -1 and begin < end:
                elementstr = codestr[begin + 1:end]
                element = {}
                self.parse_custom_variable(elementstr, element)
                elementtype = element["type"]
                if elementtype == "mixobject":
                    obj["type"] = "mixarr"
                else:
                    obj["type"] = "arr"
                obj["otype"] = ""
                obj["value_type_prop"] = element
            else:
                obj["type"] = ""

            if codestr.find('*', end + 1) != -1:
                obj["isPointer"] = True

        elif hasMap or hasOMap:
            begin = codestr.find('<')
            mid = codestr.find(',')
            end = codestr.rfind('>')
            if begin != -1 and mid != -1 and end != -1 and begin < mid < end:
                keystr = codestr[begin + 1:mid]
                valuestr = codestr[mid + 1:end]
                key = {}
                value = {}
                self.parse_custom_variable(keystr, key)
                self.parse_custom_variable(valuestr, value)
                mix = "mix" if value["type"] == "mixobject" else ""
                if hasMap:
                    obj["type"] = mix + "map"
                else:
                    obj["type"] = mix + "omap"
                obj["key_type_prop"] = key
                obj["value_type_prop"] = value
                obj["otype"] = ""
            else:
                obj["type"] = ""
                obj["otype"] = ""

            if codestr.find('*', end + 1) != -1:
                obj["isPointer"] = True

        elif codestr.find("kfRef") != -1:
            codestr = codestr.replace("kfRef", "").replace("<", "").replace(">", "")
            obj["type"] = "mixobject"
            obj["otype"] = codestr.replace(" ", "")
            obj["isKFRef"] = True
            pass
        elif codestr.find("*") != -1:
            codestr = codestr.replace("*", "")
            obj["type"] = "mixobject"
            obj["otype"] = codestr.replace(" ", "")
            pass
        else:
            codestr = codestr.replace(" ", "")
            if codestr == "void":
                obj["type"] = "null"
                obj["otype"] = ""
                pass
            else:
                if KFDataType.GetTypeID(codestr) != 0:
                    obj["type"] = codestr
                    obj["otype"] = ""
                    pass
                else:
                    obj["type"] = "object"
                    obj["otype"] = codestr
                    pass
                pass
            pass
        pass

    def __accept_string_end(self, codestr, accept_str, extra_end_chars = None):
        haspropend = False
        index = 0
        charcount = len(codestr)

        while (index < charcount):
            cchar = codestr[index]
            # maybe tab
            if ord(cchar) == 9:
                cchar = " "
            if cchar == ';' or cchar == '}' or (extra_end_chars is not None and cchar in extra_end_chars):
                haspropend = True
                break
                pass
            elif cchar != '\r' and cchar != '\n':
                if cchar == " ":
                    if accept_str != "" and accept_str[len(accept_str) - 1] != " ":
                        accept_str += cchar
                else:
                    accept_str += cchar
            index += 1
        return accept_str,haspropend
        pass

    def parse_class_following_code(self, kfd):
        classname = trystr(kfd,"class")
        extendname = ""
        nameindex = 0
        hasclassend = False
        codestr = self.lexer.get_left_of_current_line()
        self.lexer.skip_current_line()

        if classname == '':
            clsstr = "class"
            clsindex = codestr.find(clsstr)

            if clsindex == -1:
                clsstr = "struct"
                clsindex = codestr.find(clsstr)
                if clsindex == -1:
                    clsstr = "namespace"
                    clsindex = codestr.find(clsstr)
                # "namespace"

            if clsindex == -1:
                return CodeFile.NEXT_CLASS_BEGIN
            else:
                nameindex = clsindex + len(clsstr)

        codelen = len(codestr)
        currstr = classname

        while(nameindex < codelen):

            currchar = codestr[nameindex]
            # maybe tab
            if ord(currchar) == 9:
                currchar = " "

            if currchar == '{':
                hasclassend = True
                classname, extendname = self.__parse_class_string(currstr,kfd)
            else:
                if currchar == '\r' or currchar == '\n':
                    currchar = ""
                elif currchar == " ":
                    # 保证间隔最多一个空格
                    lastindex = len(currstr) - 1
                    lastchar = " "
                    if lastindex > -1:
                        lastchar = currstr[lastindex]
                    if lastchar == " " or lastchar == ":":
                        currchar = ""

                currstr += currchar

            nameindex += 1

        if hasclassend:
            kfd["propertys"] = []
            logging.debug(">>class:%s extend:%s", classname, extendname)
            return CodeFile.NEXT_UNKNOW

        # 记住临时的字符串
        kfd["class"] = currstr
        return CodeFile.NEXT_CLASS_BEGIN

    def parse_property_following_code(self, kfd):
        codestr = self.lexer.get_left_of_current_line()
        self.lexer.skip_current_line()

        typestr = trystr(kfd, "type")
        typestr, haspropend = self.__accept_string_end(codestr,typestr)

        if haspropend:
            self.__parse_variable(typestr, kfd)
            return CodeFile.NEXT_UNKNOW
        else:
            kfd["type"] = typestr

        return CodeFile.NEXT_PROPERTY

    def parse_method_following_code(self, method):
        codestr = self.lexer.get_left_of_current_line()
        self.lexer.skip_current_line()

        methodstr = trystr(method, "name")
        methodstr, hasmethodend = self.__accept_string_end(codestr, methodstr, ['{'])
        if hasmethodend:

            if methodstr.startswith("static"):
                method["isStatic"] = True

            methodstr = methodstr.replace("virtual ","")
            methodstr = methodstr.replace("static ", "")
            methodstr = methodstr.replace("inline", "")
            methodstr = methodstr.strip()

            # 使用正则区分出返回值，函数名，参数列表
            matchedobj = re.fullmatch(r'\s*(.*)\s+([a-zA-Z0-9_]+)\s*\((.*)\).*', methodstr)
            if matchedobj:
                returnstr = matchedobj.group(1).strip()
                methodname = matchedobj.group(2).strip()
                paramsstr = matchedobj.group(3).strip()
            else:
                self.error_log("parse methed faild")
                return CodeFile.NEXT_UNKNOW

            logging.debug("returnstr:%s,methodname:%s,paramsstr:%s",returnstr,methodname,paramsstr)

            method["name"] = methodname

            retparam = {}
            method["retparam"] = retparam
            retparam["name"] = "return"
            self.parse_custom_variable(returnstr, retparam, True)

            params = []
            method["params"] = params

            if paramsstr != '' and paramsstr != "void":
                varstrarr = paramsstr.split(",")
                varsize = len(varstrarr)
                i = 0
                while i < varsize:
                    varstr = varstrarr[i]
                    varobj = {}
                    # 先去掉等号后面的
                    index = varstr.rfind('=')
                    if index != -1:
                        if index + 1 < len(varstr):
                            varobj["defaultval"] = varstr[index+1:].strip()
                        varstr = varstr[0:index].strip()
                    varstr = varstr.replace('\t', ' ')
                    index = varstr.rfind(' ')
                    if index != -1 and index + 1 < len(varstr):
                        varobj["name"] = varstr[index+1:]
                        varstr = varstr[0:index].strip()
                    self.parse_custom_variable(varstr, varobj, True)
                    params.append(varobj)
                    i += 1
                pass

            return CodeFile.NEXT_UNKNOW
        else:
            method["name"] = methodstr

        return CodeFile.NEXT_METHOD

    pass

###############################################################################
_cpp_template = None
_cpp_template_dir = None
_cpp_data_type = ""

def CPP_Load_Template(dirpath, data_type):

    global _cpp_template
    global _cpp_template_dir
    global _cpp_data_type

    if _cpp_template is not None:
        return

    _cpp_template = {}
    _cpp_template_dir = dirpath
    _cpp_data_type = data_type

    datatmplpath = _cpp_template_dir

    if _cpp_data_type != "":
        datatmplpath += "/" + _cpp_data_type

    default_template = {}
    default_template["h"] = LoadFile(datatmplpath + "/{{CLASS}}F.h")
    default_template["cpp"] = LoadFile(datatmplpath + "/{{CLASS}}F.cpp")
    default_template["refl"] = LoadFile(datatmplpath + "/{{CLASS}}R.cpp")
    default_template["m"] = LoadFile(_cpp_template_dir + "/{{CLASS}}_methods.h")
    default_template["container_m"] = LoadFile(_cpp_template_dir + "/{{CONTAINER}}_methods.h")
    default_template["vm3m"] = LoadFile(_cpp_template_dir + "/v{{CLASS}}.h")
    default_template["vm3mall"] = LoadFile(_cpp_template_dir + "/vAll.h")
    default_template["vm3mcompletion"] = LoadFile(_cpp_template_dir + "/vCompletion.tmpl")
    _cpp_template["default"] = default_template

    #typedef相关模版
    typedefTMPL = {}
    typedefTMPL["h"] = LoadFile(_cpp_template_dir + "/{{CLASS}}TypeDef.h")
    typedefTMPL["cpp"] = LoadFile(_cpp_template_dir + "/{{CLASS}}TypeDef.cpp")
    _cpp_template["typedefTMPL"] = typedefTMPL

    anyTMPL = {}
    anyTMPL["h"] = LoadFile(_cpp_template_dir + "/{{CLASS}}Any.h")
    anyTMPL["cpp"] = LoadFile(_cpp_template_dir + "/{{CLASS}}Any.cpp")
    _cpp_template["anyTMPL"] = anyTMPL

    utilTMPL = {}
    utilTMPL["h"] = LoadFile(_cpp_template_dir + "/{{CLASS}}Util.h")
    utilTMPL["cpp"] = LoadFile(_cpp_template_dir + "/{{CLASS}}Util.cpp")
    _cpp_template["utilTMPL"] = utilTMPL

    CPP_Load_ByteArray_Template(dirpath)
    pass


def CPP_Template_Name(name):

    global _cpp_template
    global _cpp_template_dir

    if name == "":
        return tryobj(_cpp_template, "default")

    template = tryobj(_cpp_template, name)
    if template is None:

        global _cpp_data_type

        datatmplpath = _cpp_template_dir
        if _cpp_data_type != "":
            datatmplpath += "/" + _cpp_data_type

        template = {}
        template["fh"] = LoadFile("%s/%s.h" % (datatmplpath,name))
        template["fcpp"] = LoadFile("%s/%s.cpp" % (datatmplpath,name))
        _cpp_template[name] = template
        pass

    return template

# _dir_group_dicts = None   #记录每一个文件夹所包含的group
_cpp_method_container_dicts = {}

def CPP_KFD_export(kfd, kfdtabel, dirpath, includes, setting):
    kfd_datas = kfd.kfd_datas

    global _cpp_method_container_dicts

    cpptemplate = None
    cppkfddatas = []
    cppanykfddatas = []
    cppincludes = []
    cppanyincludes = []
    cppanycontainers = []
    export_api = trystr(kfd.export_info, "export_api")

    for kfddata in kfd_datas:
        # 检测扩展类是否存在
        extend = trystr(kfddata, "extend")
        if extend != "" and not kfdtabel.has_cls(extend):
            kfddata["extend"] = ""
            # 记录下原基类，VM生成时用到
            kfddata["__src_extend__"] = extend;
            pass

        typedef = trynum(kfddata, "typedef")
        tmplname = trystr(kfddata, "template")
        template = CPP_Template_Name(tmplname)

        nof = trynum(kfddata, "nof")
        if nof != 1:
            if template and not cpptemplate:
                cpptemplate = template
                pass

            CPP_ByteArray_export_Header(kfddata, kfdtabel, dirpath, includes, template, export_api)

            #cpp 信息汇总 用于CPP合并输出
            cppkfddatas.append(kfddata)
            cppanykfddatas.append(kfddata)
            if kfddata["class"] != "":
                cppincludes.append("%sF.h" % (kfddata["class"],))
                cppanyincludes.append("%sF.h" % (kfddata["class"],))
                pass

            if typedef == 1:
                cppincludes.append("%sTypeDef.h" % (kfddata["class"],))
                cppanyincludes.append("%sTypeDef.h" % (kfddata["class"],))
                pass

        method = trynum(kfddata,"method")
        #函数导不导出，跟nof标识有关
        if (nof != 1 and ("method" not in kfddata or method == 1)) or (nof == 1 and method == 1):
            method_containers = {}
            CPP_Methods_export_Header(kfddata,kfdtabel,dirpath,includes,template,export_api
                                      ,_cpp_method_container_dicts, method_containers)

            CPP_VM3_export_Header(kfddata, kfdtabel, dirpath, includes, template, export_api, setting)

            if len(method_containers) > 0:
                CPP_Methods_Containers_export_Header(kfddata, kfdtabel, dirpath, includes
                                                     , template, export_api, method_containers)

            #nof!=1时已经加了
            if nof == 1:
                cppanykfddatas.append(kfddata)
            if kfddata["class"] != "":
                cppanyincludes.append("%s_methods.h" % (kfddata["class"],))
                for container_name in method_containers:
                    cppanyincludes.append("%s_methods.h" % (container_name,))
                    cppanycontainers.append(container_name)

    # 导出合并的cpp, 使用kfd名字作为合并的c++的类名
    if cpptemplate:
        CPP_ByteArray_export_CPP(cppkfddatas, kfdtabel, dirpath, cppincludes, cpptemplate, kfd.kfd_filename)
        pass

    # 导出Any, 取group的名称为类名
    anyClassName = kfd.kfd_filename.replace(".kfd", "")
    CPP_Export_Any(cppanykfddatas, kfdtabel, dirpath, cppanyincludes, anyClassName, export_api, cppanycontainers)
    pass

def CPP_Export_Any(cppkfddatas, kfdtabel, dirpath, cppincludes, anyClassName, export_api, cppcontainers):
    global _cpp_template
    tmpl = _cpp_template["anyTMPL"]
    CPP_Any_export(cppkfddatas, kfdtabel, dirpath, cppincludes, anyClassName, tmpl, export_api, cppcontainers)

def CPP_Export_Dir_Util(kfdtable):
    global _cpp_template
    tmpl = _cpp_template["utilTMPL"]
    CPP_Dir_Util_Export(kfdtable, tmpl)

def CPP_Export_End(typedef, kfdtabel, dirpath, includes):
    #先导出定义的一些typedef
    global _cpp_template
    tmpl = _cpp_template["typedefTMPL"]
    CPP_Typedef_export(typedef, kfdtabel, dirpath, includes, tmpl)
    CPP_Export_Dir_Util(kfdtabel)
    pass

def CPP_Export_Finally(kfdtabel, setting):
    # VM3导出头文件合并在一个包含文件里
    global _cpp_template
    tmpl = _cpp_template["default"]
    CPP_VM3_export_Header_All(kfdtabel, tmpl, setting)
    CPP_VM3_export_Completion(kfdtabel, tmpl, setting)


# 定义CPP导输信息
CPP_Code_info = {
    "suffix": ".h",
    "reader": CPP,
    "export": CPP_KFD_export,
    "load_template": CPP_Load_Template,
    "end": CPP_Export_End,
    "finally": CPP_Export_Finally
}

TS_Code_info = {
    "suffix": ".ts",
    "reader": CPP,
    "export": CPP_KFD_export,
    "load_template": CPP_Load_Template,
    "end": CPP_Export_End,
    "finally": CPP_Export_Finally
}
