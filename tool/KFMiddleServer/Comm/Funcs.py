#! /usr/bin/env python
#coding=utf-8

import logging
import os
import json
import sys
import traceback
import string
import random

from logging.handlers import TimedRotatingFileHandler
from logging.handlers import RotatingFileHandler


def get_sys_arg_value(argname,args):
    i = 0
    argnamestr = "-%s=" % (argname,)
    while i < len(args):
        argstr = args[i]
        if argstr.startswith(argnamestr):
            return argstr.split("=")[1]
        i += 1
    return None
    pass

def has_key(name,obj):
    return name in obj

def trynum(obj,name):
    if obj is None or name not in obj:
        return 0
    return obj[name]

def trystr(obj,name):
    if obj is None or name not in obj:
        return ""
    return obj[name]

def tryobj(obj,name):
    if obj is None or name not in obj:
        return None
    return obj[name]

def init_exception_log():
    def excepthook(type, value, trace):
        errstr = ''.join(traceback.format_exception(type,value,trace))
        logging.error(errstr)
        sys.__excepthook__(type, value, trace)
    sys.excepthook = excepthook
    pass

def init_logging(level,screen = True,keepsize = 100,defpath = None):
    root = logging.getLogger()
    if len(root.handlers) == 0:

        filename = './logs/log'

        if defpath is not None:
            defpathFile = os.path.abspath(defpath)
            defpathDir = os.path.dirname(defpathFile)
            if not os.path.exists(defpathDir):
                os.mkdir(defpathDir)
            if not os.path.exists(defpathFile):
                os.mkdir(defpathFile)
            filename = ('%s/logs/log' % defpath)
        #create logdir
        logpath = os.path.abspath(filename)
        dirpath = os.path.dirname(logpath)
        if not os.path.exists(dirpath):
            os.mkdir(dirpath)
            print("create logdir:%s" % dirpath)

        format = '%(asctime)s %(levelname)s [%(filename)s:%(lineno)d] %(message)s'
        datefmt = '%Y-%m-%d %H:%M:%S'
        fmt = logging.Formatter(format,datefmt)

        #all write to file
        hdlr = TimedRotatingFileHandler(filename, "H", 1,keepsize)
        hdlr.setFormatter(fmt)
        root.addHandler(hdlr)

        #error write to
        errorfilename = './logs/err'
        if defpath is not None:
            errorfilename = ('%s/logs/err' % defpath)

        errorLG = RotatingFileHandler(errorfilename,'a',1024*1024*10,10)
        errorLG.setFormatter(fmt)
        errorLG.setLevel(logging.ERROR)

        root.addHandler(errorLG)

        if screen:
            console = logging.StreamHandler(sys.stdout)
            console.setFormatter(fmt)
            #console.flush = sys.stdout.flush
            root.addHandler(console)

        root.setLevel(level)
    init_exception_log()
    pass

#simple encrypt string
import base64

enc_str = "1a2b3c4d5e6f7g8h9i0jklmABCDEFGHIJKLMNOPQRSTUVWXYZnopqrstuvwxyz"
dec_str = "NOPQRSTUVWX9YZn8opqr7s6t5u4v3w2x1y0zabcdefghijklmABCDEFGHIJKLM"

def sp_encrypt(text,key=''):
    etxt = ""
    for ch in text:
        i = enc_str.find(ch)
        if i >= 0:
            etxt += dec_str[i]
        else:
            etxt += ch
    return etxt


def sp_decrypt(text,key=''):
    etxt = ""
    for ch in text:
        i = dec_str.find(ch)
        if i >= 0:
            etxt += enc_str[i]
        else:
            etxt += ch
    return etxt


############
# xml
############

import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom

def read_xml(in_path):
    """读取并解析xml文件
       in_path: xml路径
       return: tree"""
    tree = ET.parse(in_path)
    return tree

def creat_dict_(root):
    """xml生成为dict：，
    将tree中个节点添加到list中，将list转换为字典dict_init
    叠加生成多层字典dict_new"""
    dict_new = {}
    for key, valu in enumerate(root):
        dict_new[valu.tag] = valu.text
        #print  valu.tag,valu.text
    return dict_new

def xml_to_dict_(inputstr):
    xmle = ET.fromstring(inputstr)
    return creat_dict_(xmle)
    pass

def dict_to_xml(input_dict, root_tag):
    """ 定义根节点root_tag，定义第二层节点node_tag
    第三层中将字典中键值对对应参数名和值
       return: xml的tree结构 """
    root_name = ET.Element(root_tag)
    for (k, v) in input_dict.items():
        node_name = ET.SubElement(root_name, k)
        if isinstance(v,dict):
            for key, val in v.items():
                nodexml = ET.SubElement(node_name, key)
                nodexml.text = val
        else:
            node_name.text = v
    return root_name

def out_xml(root,out_file):
    """格式化root转换为xml文件"""
    rough_string = ET.tostring(root, 'utf-8')
    reared_content = minidom.parseString(rough_string)
    with open(out_file, 'w+') as fs:
        reared_content.writexml(fs, addindent=" ", newl="\n", encoding="utf-8")
    return True

#####
###
####
def creat_random_str(num = 6):
    return ''.join(random.sample(string.ascii_letters+string.digits,num))
    pass

def load_json_data(path):
    datastr = None
    datafile = None
    if os.path.isfile(path):
        try:
            datafile = open(path, 'r')
            datastr = datafile.read()
        finally:
            if datafile is not None:
                datafile.close()
    data = None
    if datastr is not None:
        try:
            data = json.loads(datastr)
        except Exception as err:
            data = None
            logging.error(err)
            pass
        pass

    return data

def LoadFileLines(path):
    lines = None
    if os.path.isfile(path):
        try:
            file_object = open(path, 'r', encoding='utf-8')
            lines = file_object.readlines()
        except:
            file_object = None
        finally:
            if file_object is not None:
                file_object.close()
        pass
    return lines
    pass

def LoadFile(path):

    #logging.info("LoadFile(%s)",path)
    file_object = None
    filetxt = ""

    try:
        file_object = open(path,'r',encoding='utf-8')
    except:
        file_object = None

    if file_object is None:
        logging.info("[LoadConfig] not found path = %s error", path)
        return filetxt

    try:
        filetxt = file_object.read()
    except Exception as err:
        logging.error(err)
        filetxt = ""
    finally:
        file_object.close()

    #EF BB BF #python2.x
    if len(filetxt) >= 3:
        if ord(filetxt[0]) == 0xEF and ord(filetxt[1]) == 0xBB and ord(filetxt[2]) == 0xBF:
            filetxt = filetxt[3:]
            logging.info("========UTF-8-Bom ======")
        elif ord(filetxt[0]) == 0xFEFF:
            filetxt = filetxt[1:]
            logging.info("========UTF-8-Bom-sig ======")
        pass
    return filetxt
    pass

def LoadConfigFromJson(path):
    logging.info("LoadConfigFromJson(%s)",path)
    json_config = None
    filetxt = LoadFile(path)

    if filetxt == "":
        return None

    try:
        json_config = json.loads(filetxt)
    except:
        json_config = None
    finally:
        pass

    if json_config == None:
        logging.info("[LoadConfig] decode error path = %s", path)
        return None

    return json_config
    pass

def SaveFile(path,datastr,UTF = False):
    datafile = None

    try:
        if not os.path.isfile(path):
            dirname = os.path.dirname(path)
            if not os.path.exists(dirname):
                os.mkdir(dirname)
                logging.info("create cachedir:%s", dirname)
            pass
        pass
        datafile = open(path, 'w+' ,encoding='utf-8')
        datafile.write(datastr)
    except Exception as err:
        logging.error(err)
        pass
    finally:
        if datafile is not None:
            datafile.close()
    pass

def SaveConfigFromObject(path, jsonobj):
    datastr = json.dumps(jsonobj,ensure_ascii=False)
    SaveFile(path,datastr,True)
    pass

def abspath(path):
    if  not os.path.isabs(path):
        return os.path.abspath(path)
    return path


########################
## net work
########################

ENCODE_HEAD = {}

def Encode_net_message_(cmd,seqid,msgobj):

    ENCODE_HEAD["cmd"] = cmd
    ENCODE_HEAD["seqid"] = seqid
    ENCODE_HEAD["arg0"] = ''

    if isinstance(msgobj,str):
        ENCODE_HEAD["body"] = msgobj
    else:
        ENCODE_HEAD["body"] = json.dumps(msgobj)

    return json.dumps(ENCODE_HEAD)

    pass


