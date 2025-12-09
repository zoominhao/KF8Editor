#! /usr/bin/env python
#coding=utf-8

import _thread
from Middle.MDClient import *
from .MDKFDTable import *

KFRPCDataDefault = {
        "includes": [
            "Net/RPC/KFRPC.h"
        ],
        "class": "KFRPCData",
        "extend": "",
        "propertys": [
            {
                "id": 1,
                "default": "0",
                "name": "rpcid",
                "type": "int32"
            },
            {
                "id": 2,
                "cname": "方法名",
                "name": "method",
                "type": "kfstr"
            },
            {
                "id": 3,
                "cname": "响应的ID",
                "default": "0",
                "name": "rspid",
                "type": "int32"
            },
            {
                "id": 4,
                "cname": "源ID",
                "default": "0",
                "name": "srcid",
                "type": "int32"
            },
            {
                "id": 5,
                "cname": "参数类型",
                "default": "0",
                "name": "argtype",
                "type": "int8"
            },
            {
                "id": 6,
                "cname": "参数数量",
                "default": "0",
                "name": "argcount",
                "type": "int8"
            },
            {
                "id": 7,
                "cname": "参数数据",
                "name": "args",
                "type": "kfBytes"
            }
        ],
        "clsid": 1008
    }
FKReturnObjectDefault = {
        "includes": [
            "Net/RPC/KFRPC.h"
        ],
        "class": "FKReturnObject",
        "extend": "",
        "propertys": [
            {
                "id": 1,
                "default": "0",
                "name": "code",
                "type": "int32"
            },
            {
                "id": 2,
                "name": "msg",
                "type": "kfstr"
            }
        ],
        "clsid": 1009
    }

class MDRpc(object):

    def __init__(self,config,atmain = False):

        self.io_loop = tornado.ioloop.IOLoop.current()
        self.atmain = atmain

        self.client = MDClient(config["Server"], self.io_loop)

        self.MethodInfos = {}
        self.Callbacks = {}
        self.RSPID = 1

        self.RemoteID = -1

        self.Remotes = config["Remotes"]
        self.RemoteIDs = config["RemoteIDs"]

        self.localID = self.client.localID
        self.userName = self.client.userName

        self.pingTimer = None
        self.pingNumRec = 0
        self.pingNum = 0

        self._LoginedCallBack = None

        if "localName" in config:
            self.localName = config["localName"]
        else:
            self.localName = "I DON'T KNOW"

        logging.info("[MDRpc] name = %s",self.localName)
        self.threadID = -1

        if atmain == False:
            self.client.setDataHandler(self._On_rpcData)
        else:
            self.client.setDataHandler(self._process_rpcData)

        self.client.setEventHandler(self._On_ClientEvent)

        self.rpcDatas = [];

    def Processing(self):
        rpcDatas = None;
        self.lock0.acquire();
        if len(self.rpcDatas) > 0:
            rpcDatas = self.rpcDatas;
            self.rpcDatas = [];
        self.lock0.release();

        if rpcDatas != None:
            i = 0;
            size = len(rpcDatas);
            while i < size:
                self._process_rpcData(rpcDatas[i]);
                i += 1;
        pass

    def _On_rpcData(self,rpcData):
        self.lock0.acquire();
        self.rpcDatas.append(rpcData);
        self.lock0.release();
        logging.info("[MDRpc] _On_rpcData:",rpcData)
        pass

    def _process_rpcData(self,rpcData):

        rpcid = rpcData["rpcid"]

        logging.info("[MDRpc] _process_rpcData:%s %d" ,str(rpcData) , rpcid)

        if rpcid == 0:
            methodName = rpcData["method"]
            if methodName in self.MethodInfos:
                methodInfo = self.MethodInfos[methodName]
                if methodInfo != None:

                    logging.info("rpc call %s"%methodName)

                    argcount = rpcData["argcount"]
                    args = rpcData["args"]

                    retobj = self._MethodCall(methodInfo,argcount,args)
                    rspid = rpcData["rspid"]

                    if rspid != 0:
                        if "srcid" in rpcData:
                            srcid = rpcData["srcid"]
                            self._sendMethodRsp(srcid,rspid,retobj)
                        else:
                            logging.error("srcid is null")
            else:
                logging.info("[MDRpc] rpc %s not found"%methodName)
        else:
            if rpcid in self.Callbacks:
                callback = self.Callbacks[rpcid]
                del  self.Callbacks[rpcid]
                cbArgs = None
                if "cbArgs" in callback:
                    cbArgs = callback["cbArgs"]
                    pass

                args = tryobj(rpcData, "args")

                if cbArgs == None:
                    callback["f"](args[0])
                else:
                    callback["f"](args[0], *cbArgs)
            else:
                logging.info("[MDRpc] rpc callback %d not found"%rpcid)

    def RegistService(self, methodName,func,argcount = -1):
        if methodName not in self.MethodInfos:
            self.MethodInfos[methodName] = {"f":func,"argcount":argcount}
            logging.info("[MDRpc] RegistService[%s]" % methodName)
            return True
        return False
        pass

    def _MethodCall(self,methodInfo,argcount,args):

        func = methodInfo["f"]
        allowArg = methodInfo["argcount"]
        argcount = len(args)

        if allowArg != argcount and allowArg != -1:
            logging.info("[MDRpc][Error] _MethodCall allowarg=%d,givenarg=%d"%(allowArg,argcount))

        try:
            if argcount == 0:
                return func()
            else:
                params = tuple(args)
                return func(*params)
        except Exception as e:
            exstr = traceback.format_exc()
            logging.error("[MDRpc] _MethodCall" + exstr)

    def _sendMethodRsp(self,srcid,rspid,retobj):
        rsp = {"rpcid":rspid,"args":[retobj]}
        self.client.push_rpc_data(srcid,rsp)
        pass

    def ConnectRemote(self,RemoteName):

        if RemoteName in self.Remotes:
            remoteOjb = self.Remotes[RemoteName]
            self.RemoteName = RemoteName
            self.RemoteID = remoteOjb["remoteID"]
            return True
        else:
            logging.warning("[MDRpc] Connect error can't found:%s",RemoteName)
            return False
        pass

    def GetRemoteID(self,RemoteName):
        if RemoteName in self.Remotes:
            remoteOjb = self.Remotes[RemoteName]
            return remoteOjb["remoteID"]
        else:
            return -100
        pass

    def ConnectRemoteID(self,remoteID):

        if remoteID in self.RemoteIDs:
            remoteOjb = self.RemoteIDs[remoteID]
            self.RemoteName = remoteOjb["name"]
            self.RemoteID = remoteOjb["remoteID"]
            return True
        else:
            logging.warning("[MDRpc] Connect error can't found:%d",remoteID)
            return False
        pass

    def RemoteEvent(self, eventstr, *args):
        rpc = {"rpcid": 0, "method": eventstr, "argcount": len(args), "args": args, "rspid": 0,
               "srcid": self.localID}
        self.client.push_rpc_data(-1 , rpc, eventstr)
        pass

    def SendRemoteData(self,data,datatype = 1):
        self.SendRemoteData_(data,datatype)
        pass

    def SendRemoteData_(self,data,datatype = 1,remoteid = -100):
        if remoteid == -100:
            remoteid = self.RemoteID
        self.client.push_rpc_data(remoteid,data,"",datatype)
        pass

    """
     #handler(data,head)
    """
    def RegistRemoteDataHandler(self,handler,datatype = 1):
        self.client.bodyTypeHandler[datatype] = handler

    def RemoteCallN_(self, methodStr,remoteid = -100, callback=None, *args):
        rspid = 0
        rspparm = None

        if callback != None:
            self.RSPID += 1
            rspid = self.RSPID
            rspparm = {"f": callback}
            self.Callbacks[rspid] = rspparm
            pass

        rpc = {"rpcid": 0, "method": methodStr, "argcount": len(args), "args": args, "rspid": rspid}
        if rspid != 0:
            rpc["srcid"] = self.localID

        if remoteid == -100:
            remoteid = self.RemoteID

        self.client.push_rpc_data(remoteid, rpc)
        return rspparm
        pass

    def RemoteCallN(self, methodStr,callback=None,*args):
        return self.RemoteCallN_(methodStr,-100,callback,*args)
        pass

    def RemoteCallWithArgs(self,methodStr,callback=None,cbArgs = None,*args):
        return self.RemoteCallWithArgs_(methodStr,-100,callback,cbArgs,*args)

    def RemoteCallWithArgs_(self,methodStr,remoteid = -100,callback=None,cbArgs = None,*args):
        rspparm = self.RemoteCallN_(methodStr,remoteid,callback,*args)
        if cbArgs != None and rspparm != None:
            rspparm["cbArgs"] = cbArgs
        return  rspparm

    def RemoteCallVoid(self, methodStr, callback = None, cbArgs = None):
        return self.RemoteCallVoid_(methodStr,-100,callback,cbArgs)
        pass

    def RemoteCallVoid_(self, methodStr,remoteid = -100,callback = None,cbArgs = None):
        rspid = 0
        rspparam = None

        if callback != None:
            self.RSPID += 1
            rspid = self.RSPID
            rspparam = {"f": callback}
            if cbArgs != None:
                rspparam["cbArgs"] = cbArgs
            self.Callbacks[rspid] = rspparam

        rpc = {"rpcid": 0, "method": methodStr, "argcount":0, "args":[], "rspid": rspid}

        if rspid != 0:
            rpc["srcid"] = self.localID

        if remoteid == -100:
            remoteid = self.RemoteID

        self.client.push_rpc_data(remoteid, rpc)
        return  rspparam
        pass

    def _ThreadIOLoopStart(self,tdobj):
        self.tdobj = tdobj
        self.io_loop.start()
        pass

    def _On_ClientEvent(self, eventid,data = None):

        if eventid == MDClient.EVENT_LOGINED:

            if self.pingTimer == None:
                self.pingTimer = tornado.ioloop.PeriodicCallback(self._CallPing, 120000)
            self.pingTimer.start()
            self.pingNum = 0
            self.pingNumRec = 0

            #set new localID
            self.localID = trynum(data,"remoteID")
            #add new remote node
            remoteList = tryobj(data,"remoteList")
            i = len(remoteList) - 1
            while i >= 0:
                remotenode = remoteList[i]
                name = trystr(remotenode,"name")
                remoteid = trynum(remotenode,"remoteID")
                self.Remotes[name] = remotenode
                self.RemoteIDs[remoteid] = remotenode
                i -= 1
            #call back
            callback = self._LoginedCallBack
            self._LoginedCallBack = None
            if callback is not None:
                callback()

            pass
        elif eventid == MDClient.EVENT_CLOSED:
            if self.pingTimer != None:
                self.pingTimer.stop()
            pass
        pass

    def _Ping(self,num):
        self.pingNumRec = num
        logging.debug("_Ping numRec = %d",self.pingNumRec)
        pass

    def _CallPing(self):

        if self.pingNumRec == self.pingNum:
            self.pingNum += 1
            self.RemoteCallN_("_Ping",self.localID,None,self.pingNum)

            logging.debug("_CallPing num = %d rec = %d",self.pingNum,self.pingNumRec)
        else:
            self.client.close(False)
            logging.info("_CallPing client close now")

        pass

    def Ready(self,LoginedCallBack = None, kfdPath = None):
        #load all kfd
        kfdTB = MDKFDTable()
        pyKFDTable.kfdTB = kfdTB
        if kfdPath is not None:
            kfdTB.load_kfds(kfdPath)
            pass

        #如果不存在默认补一个
        if kfdTB.get_kfddata(KFRPCDataDefault["class"]) is None:
            kfdTB.add_KFDDatas([KFRPCDataDefault])
            pass

        if kfdTB.get_kfddata(FKReturnObjectDefault["class"]) is None:
            kfdTB.add_KFDDatas([FKReturnObjectDefault])
            pass


        #regist ping
        self.RegistService("_Ping",self._Ping)

        if self.threadID == -1:
            self._LoginedCallBack = LoginedCallBack
            self.client.connect()

            if self.atmain == False:
                self.lock0 = threading.Lock();
                self.threadID = _thread.start_new_thread(self._ThreadIOLoopStart, (self,));
                logging.info("[MDRpc] Is Ready...")
            else:
                self.threadID = 0;
                logging.info("[MDRpc] wait main start ioloop!!")
        else:
            logging.info("[MDRpc] Erro threadid is not null")
        pass

    def Stop(self):
        if self.atmain == False:
            self.io_loop.Stop()
        self.client.close()
        pass

###中转服务器的默认地址
DEF_CONFIG_PATH = "Conf/MiddleServerSetting.json"
###路由服务器的默认配置
ROUTER_CONFIG_PATH = "Conf/RounterServerSetting.json"

def LoadConfig(path,localName = "",config = None):

    if config == None:
        config = {}

    file_object = None
    json_config = None

    try:
        file_object = open(path)
    except:
        file_object = None

    if file_object is None:
        logging.info("[LoadConfig] not found path = %s error", path)
        return None

    try:
        filetxt = file_object.read()
        #print filetxt
        json_config = json.loads(filetxt)
        config["filetxt"] = filetxt
    except:
        json_config = None
    finally:
        file_object.close()
    pass

    if json_config == None:
        logging.info("[LoadConfig] decode error path = %s",path)
        return None

    serverc = {};

    MDSConfigs = json_config["MDSConfigs"]
    MDSConfig0 = MDSConfigs[0]

    serverc["host"] = trystr(MDSConfig0,"host")
    serverc["phost"] = trystr(MDSConfig0, "phost")
    serverc["port"] = trynum(MDSConfig0,"port")

    config["Server"] = serverc
    config["localName"] = localName
    config["MDSConfigs"] = MDSConfigs

    Remotes = {}
    RemoteIDs = {}
    RemoteList = []

    RemoteNodes = json_config["RemoteNodes"]

    i = 0;
    rncount = len(RemoteNodes)

    while i < rncount:

        rnode = RemoteNodes[i]

        name = trystr(rnode,"name")
        remoteID = trynum(rnode,"remoteID")
        token = trystr(rnode,"token")
        listenStr = trystr(rnode,"listen")
        auto = trynum(rnode,"auto")

        listens = []

        if len(listenStr) > 0:
            if listenStr.find(",") != -1:
                listens = listenStr.split(",")
            else:
                listens.append(listenStr)

        remtobj = {}
        remtobj["name"] = name
        remtobj["remoteID"] = remoteID
        remtobj["token"] = token
        remtobj["listens"] = listens

        if auto > 0:
            remtobj["auto"] = auto

        Remotes[name] = remtobj
        RemoteIDs[remoteID] = remtobj
        RemoteList.append(remtobj)

        if name == localName:
            serverc["token"] = token
            serverc["localID"] = remoteID;

        i += 1;

    config["Remotes"] = Remotes;
    config["RemoteIDs"] = RemoteIDs
    config["RemoteList"] = RemoteList;

    return config;
    pass

def RpcConnect(path,remotename,localname = "somerpccall"):
    config = LoadConfig(path,localname)
    rpc = MDRpc(config, True)
    rpc.Ready()
    rpc.ConnectRemote(remotename)
    return rpc

def RpcEnd(rpc = None):
    tornado.ioloop.IOLoop.current().stop()

def RpcCall(rpc,timeout = 30000):
    tornado.ioloop.PeriodicCallback(RpcEnd, timeout)
    tornado.ioloop.IOLoop.current().start()
