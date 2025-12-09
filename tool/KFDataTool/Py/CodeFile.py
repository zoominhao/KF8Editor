from KFDataDefine import *
from pyKFD.pyKFDataType import *
from CodeLexer import *


class CodeFile(object):

    NEXT_UNKNOW = 0
    NEXT_CLASS_BEGIN = 1
    NEXT_PROPERTY = 2
    CURRENT_CLASS_BEGIN = 3
    CURRENT_PROPERTY = 4
    CURRENT_METHOD = 5
    NEXT_METHOD = 6
    NEXT_CLASS_END = -1

    def __init__(self, reader, leading):
        self.srcreader = reader
        self.kfd_datas = []
        self.include = ""
        self.filename = ""
        self.group = None
        self.export_info = None
        self.lexer = None
        self.__leading_string = leading
        pass

    def __add_property(self, kfd, props):
        if kfd is not None:
            # 检测下属性ID != 0x7F or = 0
            propid = trynum(props, "id")
            if isValidPropertyId(propid):
                is_override = trynum(props, "OR")
                if is_override == 0:
                    kfd["propertys"].append(props)
                else:
                    orprops = tryobj(kfd,"orprops")
                    if orprops is None:
                        orprops = []
                        kfd["orprops"] = orprops
                    orprops.append(props)

                # 如果发现是一个自定义的类型
                if "otype" in props:
                    otype = props["otype"]
                    if KFDataType.GetTypeID(otype) == 0:
                        clsinc = ("%sF.h" % (otype,))
                        includes = kfd["includes"]
                        if clsinc not in includes:
                            includes.append(clsinc)
                        pass
                    pass
            else:
                logging.error("class =%s prop id != 0x7f or 0", kfd["class"])
        pass

    def __add_method(self, kfd, method):
        if kfd is not None:
            methods = None
            if "funcs" in kfd:
                methods = kfd["funcs"]
            else:
                methods = []
                kfd["funcs"] = methods
            methods.append(method)
            logging.debug("%s add method: %s" % (kfd["class"], method["name"]))
            pass
        pass

    def error_log(self, msg):
        logging.error("[file:%s line:%d position:%d] [%s]: %s",
                      self.include,
                      self.lexer.line_number() + 1,
                      self.lexer.position(),
                      self.lexer.get_left_of_current_line(),
                      msg)
        pass

    def load(self, codepath, includepath):
        self.kfd_datas = []
        self.include = includepath

        filedata = LoadFile(codepath)
        if filedata == "":
            logging.info("%s is empty, skip", codepath)
            return

        if self.__parse(filedata):
            self.srcreader.addCodeFile(self)
            return

        pass

    def __parse(self, filedata):
        kfdstack = []
        kfd = None
        nextstat = CodeFile.NEXT_UNKNOW
        nextkfd = None
        haskfd = False

        self.lexer = CodeLexer(filedata)
        while not self.lexer.is_finished():
            self.lexer.skip_whitespace()

            if nextstat == CodeFile.NEXT_UNKNOW:
                # 检测起始标记 "///KFD("
                match_string = self.lexer.advance_by_regex(self.__leading_string)
                if match_string is None:
                    self.lexer.skip_current_line()
                    continue

                nextstat, nextkfd = self.__parse_kfdcode()
                # 发现一个KFD，解析开始，如果返回是NEXT_CLASS_BEGIN状态，则需要继续解析下一行
                if nextstat == CodeFile.NEXT_CLASS_BEGIN or nextstat == CodeFile.CURRENT_CLASS_BEGIN:
                    if kfd is not None:
                        kfdstack.append(kfd)
                    kfd = nextkfd
                    if nextstat == CodeFile.CURRENT_CLASS_BEGIN:
                        nextstat = CodeFile.NEXT_UNKNOW
                # 一个KFD解析结束
                elif nextstat == CodeFile.NEXT_CLASS_END:
                    if kfd is not None:
                        self.kfd_datas.append(kfd)
                        haskfd = True
                    nextstat = CodeFile.NEXT_UNKNOW
                    kfd = None
                    if len(kfdstack) > 0:
                        kfd = kfdstack.pop()
                elif nextstat == CodeFile.CURRENT_PROPERTY:
                    nextstat = CodeFile.NEXT_UNKNOW
                    self.__add_property(kfd, nextkfd)
                    nextkfd = None
                    pass
                elif nextstat == CodeFile.CURRENT_METHOD:
                    nextstat = CodeFile.NEXT_UNKNOW
                    self.__add_method(kfd, nextkfd)
                    nextkfd = None
                    pass
                pass
            elif nextstat == CodeFile.NEXT_CLASS_BEGIN:
                nextstat = self.parse_class_following_code(kfd)
                pass
            elif nextstat == CodeFile.NEXT_PROPERTY:
                nextstat = self.parse_property_following_code(nextkfd)
                if nextstat == CodeFile.NEXT_UNKNOW:
                    self.__add_property(kfd, nextkfd)
                    nextkfd = None
                pass
            elif nextstat == CodeFile.NEXT_METHOD:
                nextstat = self.parse_method_following_code(nextkfd)
                if nextstat == CodeFile.NEXT_UNKNOW:
                    self.__add_method(kfd, nextkfd)
                    nextkfd = None
                pass

        return haskfd

    def __parse_kfdcode(self):
        c = self.lexer.get_char()
        if c == 'C':
            return self.__parse_class()
        elif c == '*':
            self.lexer.skip_current_line()
            return CodeFile.NEXT_CLASS_END, None
        elif c == 'M':
            return self.__parse_method()
        else:
            self.lexer.unget_char()
            return self.__parse_property()
        pass

    # 解析名值对，格式为 key 或 key=value
    def __parse_key_value(self):
        # 解析key
        token = self.lexer.get_token()
        if not token or token.token_type != CodeToken.TOKEN_Identifier:
            self.error_log("key token is expect")
            return False, None, None
        keystr = token.content

        # 解析value
        valuestr = ""
        if self.lexer.require_token('='):
            parenthesis_stack = 1
            c = self.lexer.get_leading_char()
            while c != 0:
                if c == '(':
                    parenthesis_stack += 1
                if c == ')':
                    parenthesis_stack -= 1
                    if parenthesis_stack == 0:
                        break
                if c == ',' and parenthesis_stack == 1:
                    break
                if c == '\n':
                    break
                valuestr += c
                c = self.lexer.get_char()
            self.lexer.unget_char()
            if parenthesis_stack > 1:
                self.error_log("lock of ')'")
                return False, None, None

        valuestr = valuestr.strip()

        return True, keystr, valuestr

    def __parse_class(self):
        kfddata = {"includes": [self.include]}

        # 文法格式: KFDD(C, k1=v1, k2, k3=v3)
        while True:
            token = self.lexer.get_token()
            if not token or token.content == ')':
                break
            if token.content != ',':
                self.error_log("',' is expect")
                return CodeFile.NEXT_UNKNOW, None

            # 解析key和value
            is_success, keystr, valuestr = self.__parse_key_value()
            if not is_success:
                return CodeFile.NEXT_UNKNOW, None

            # 设置kfddata
            self.__set_class_kfddata(kfddata, keystr, valuestr)
            pass

        if "class" in kfddata:
            kfddata["propertys"] = []
            return CodeFile.CURRENT_CLASS_BEGIN, kfddata

        return CodeFile.NEXT_CLASS_BEGIN, kfddata

    def __set_class_kfddata(self, kfddata, keystr, valuestr):
        ukey = keystr.upper()
        if ukey == 'CLASS':
            kfddata["class"] = valuestr
        elif ukey == 'EXTEND':
            kfddata["extend"] = valuestr
        elif ukey == 'TMPL':
            kfddata["template"] = valuestr
        elif ukey == "TYPEDEF":
            kfddata["typedef"] = int(valuestr)
        elif ukey == "TYPEID":
            kfddata["typeid"] = int(valuestr)
        elif ukey == "DES":
            kfddata["des"] = valuestr
        elif ukey == "CNAME":
            kfddata["cname"] = valuestr
        elif ukey == "CTYPEIDS":
            kfddata["CTYPEIDS"] = valuestr.split('|')
        elif ukey == "NOF":
            kfddata["nof"] = int(valuestr)
        elif ukey == "NEW":
            kfddata["newfunc"] = valuestr
        elif ukey == "M":
            kfddata["method"] = int(valuestr)
        elif ukey == "ABSTRACT":
            kfddata["abstract"] = int(valuestr)
        else:
            if "unknowtags" not in kfddata:
                unknowtags = []
                kfddata["unknowtags"] = unknowtags
            else:
                unknowtags = kfddata["unknowtags"]
            tag = {"tag": keystr, "val": valuestr}
            unknowtags.append(tag)
        pass

    def __parse_property(self):
        kfddata = {}
        # 文法格式: KFDD(P=n, k1=v1, k2, k3=v3)
        while True:
            # 解析key和value
            is_success, keystr, valuestr = self.__parse_key_value()
            if not is_success:
                return CodeFile.NEXT_UNKNOW, None

            # 设置kfddata
            self.__set_property_kfddata(kfddata, keystr, valuestr)

            token = self.lexer.get_token()
            if not token or token.content == ')':
                break
            if token.content != ',':
                self.error_log("',' or ')' is expect")
                return CodeFile.NEXT_UNKNOW, None

            pass

        # 如果KFD里定义了 name 则不用分析源代码
        if "name" in kfddata:
            return CodeFile.CURRENT_PROPERTY, kfddata

        return CodeFile.NEXT_PROPERTY, kfddata

    def __set_property_kfddata(self, pobj, keystr, valuestr):
        ukey = keystr.upper()
        if ukey == 'P':
            pid = int(valuestr)
            if not isValidPropertyId(pid):
                errormsg = ("filename=%s ,pid != %d", self.filename, pid)
                raise RuntimeError(errormsg)
            pobj["id"] = pid
        elif ukey == "KEY":
            pobj["KEY"] = valuestr
        elif ukey == "USETYPE":
            pobj["USETYPE"] = valuestr
        elif ukey == "NAME":
            pobj["name"] = valuestr
        elif ukey == "TYPE":
            pobj["type"] = valuestr
        elif ukey == "OTYPE":
            typestr = valuestr
            typearray = [typestr]
            if typestr.find("|") != -1:
                typearray = typestr.split("|")
            if 1 == len(typearray):
                pobj["otype"] = valuestr
            else:
                pobj["first_otype"] = typearray[0]
                pobj["second_otype"] = typearray[1]
        elif ukey == "IGOTYPE":
            pobj["igotype"] = valuestr
        elif ukey == "IGOBASE":
            pobj["igobase"] = int(valuestr)
        elif ukey == "STYPE":
            pobj["stype"] = valuestr
        elif ukey == "STAG":
            pobj["stag"] = valuestr
        elif ukey == "FTYPE":
            pobj["ftype"] = valuestr
        elif ukey == "DES":
            pobj["des"] = valuestr
        elif ukey == "CNAME":
            pobj["cname"] = valuestr
        elif ukey == "OR":
            pobj["OR"] = int(valuestr)
        elif ukey == "CALL":
            pobj["call"] = valuestr
        elif ukey == "ITEMCALL":#貌似这个没有用处了？
            pobj["itemcall"] = valuestr
        elif ukey == "CLEAR":
            pobj["clear"] = valuestr
        elif ukey == "REFPTR":
            pobj["refptr"] = valuestr
        elif ukey == "REFONE":
            pobj["refone"] = valuestr
        elif ukey == "ARRCLEAR":
            pobj["arrclear"] = valuestr
        elif ukey == "ARRSIZE":
            pobj["arrsize"] = valuestr
        elif ukey == "ARRPUSH":
            pobj["arrpush"] = valuestr
        elif ukey == "ARRBACK":
            pobj["arrback"] = valuestr
        elif ukey == "READ":
            pobj["read"] = valuestr
        elif ukey == "WRITE":
            pobj["write"] = valuestr
        elif ukey == "DIFF":
            pobj["diff"] = valuestr
        elif ukey == "ENUM":
            pobj["enum"] = valuestr
        elif ukey == "ENUMATTACH":
            # 关联连动 enum_attach=TYPE|1|XXX#XX|2|XXX
            enum_attach = []
            argsstr = valuestr
            args = [argsstr]
            if argsstr.find("#") != -1:
                args = argsstr.split("#")
            for arg in args:
                argparams = arg.split("|")
                attachobj = {}
                attachobj["pname"] = argparams[0]
                attachobj["pval"] = argparams[1]
                attachobj["enum"] = argparams[2]
                enum_attach.append(attachobj)
                pass
            pobj["enumattach"] = enum_attach
        elif ukey == "DEFAULT":
            pobj["default"] = valuestr
        elif ukey == "NET":
            pobj["net"] = valuestr
        elif ukey == "M":
            pobj["method"] = int(valuestr)
        elif ukey == "TRANSIENT":
            pobj["transient"] = 1;
        else:
            unknowtags = None
            if "unknowtags" not in pobj:
                unknowtags = []
                pobj["unknowtags"] = unknowtags
            else:
                unknowtags = pobj["unknowtags"]

            tag = {"tag": keystr, "val": valuestr}
            unknowtags.append(tag)
            pass
        pass

    def __parse_method(self):
        method = {}
        method["params"] = []

        # 文法格式: KFDD(M, k1=v1, k2, k3=v3)
        while True:
            token = self.lexer.get_token()
            if not token or token.content == ')':
                self.lexer.skip_current_line()
                break
            if token.content != ',':
                self.error_log("',' is expect")
                return CodeFile.NEXT_UNKNOW, None

            # 解析key和value
            is_success, keystr, valuestr = self.__parse_key_value()
            if not is_success:
                return CodeFile.NEXT_UNKNOW, None

            # 设置kfddata
            self.__set_method_kfddata(method, keystr, valuestr)
            pass

        if "name" in method:
            return CodeFile.CURRENT_METHOD, method

        return CodeFile.NEXT_METHOD, method

    def __set_method_kfddata(self, kfddata, keystr, valuestr):
        ukey = keystr.upper()
        if ukey == "NAME":
            kfddata["name"] = valuestr
            pass
        elif ukey == "CNAME":
            kfddata["cname"] = valuestr
            pass
        elif ukey == "STATIC":
            kfddata["isStatic"] = (valuestr == "true")
            pass
        elif ukey == "GEN":
            kfddata["gen"] = (valuestr == "true")
            pass
        elif ukey == "DES":
            kfddata["des"] = valuestr
            pass
        elif ukey == "ALIAS":
            kfddata["alias"] = valuestr
        elif ukey == 'TMPL':
            kfddata["templ"] = valuestr
        elif ukey == 'EXTEND':
            kfddata["extend"] = valuestr
        elif ukey == "RETURN":
            retparamstr = valuestr
            retparam = {}
            kfddata["retparam"] = retparam
            retparam["name"] = "return"
            self.parse_custom_variable(retparamstr, retparam, True)
            pass
        elif ukey == "PARAMS":
            paramsstr = valuestr
            varstrarr = paramsstr.split("|")
            varsize = len(varstrarr)
            i = 0
            while i < varsize:
                varstr = varstrarr[i]
                varobj = {}
                varobj["name"] = "param_%d" % (i,)
                self.parse_custom_variable(varstr, varobj, True)
                kfddata["params"].append(varobj)
                i += 1
            pass
        pass

    def parse_custom_variable(self, codestr, obj, isparam = False):
        logging.error("override this function is required")
        pass

    def parse_class_following_code(self, kfd):
        logging.error("override this function is required")
        return CodeFile.NEXT_CLASS_BEGIN

    def parse_property_following_code(self, kfd):
        logging.error("override this function is required")
        return CodeFile.NEXT_PROPERTY

    def parse_method_following_code(self, kfd):
        logging.error("override this function is required")
        return CodeFile.NEXT_METHOD

