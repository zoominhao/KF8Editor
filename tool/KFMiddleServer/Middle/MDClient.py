#! /usr/bin/env python
#coding=utf-8

import tornado.ioloop  
import tornado.iostream  
import socket
import _thread
import threading
import logging
from Middle.BaseConnection import *
from pyKFD.pyKFDJson import *

class MDClient(BaseConnection):

    EVENT_LOGINED = 1
    EVENT_CLOSED = -2

    def __init__(self, sconfig, io_loop = None,loginstr=None):
        BaseConnection.__init__(self,None)
        self.loginstr = loginstr
        self.host = sconfig["host"]
        self.port = sconfig["port"];
        self.localID = sconfig["localID"];
        self.userName = trystr(sconfig,"userName")
        self.token = sconfig["token"];
        self.io_loop = io_loop
        self.shutdown = False
        self.stream = None
        self.sock_fd = None
  
        self.EOF = ""
        self.logined = False;
        self.cacheLock0 = threading.Lock();
        self.cachRpcs = [];
        self.dcTimes = 0;
        self.bodyTypeHandler = {}

    def setDataHandler(self,handler):
        self.dataHandler = handler

    def setEventHandler(self,hander):
        self.eventHandler = hander
        pass
  
    def get_stream(self):

        if self.stream != None:
            self.stream.set_close_callback(None)
            self.stream.close()
            self.sock_fd = None
            self.stream = None
            self.setStream(None)

        self.sock_fd = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 0)
        self.stream = tornado.iostream.IOStream(self.sock_fd)
        self.setStream(self.stream)
        self.stream.set_close_callback(self.on_close)
  
    def connect(self):
        logging.info("[MDClient] try to connecting host:%s,port:%d"%(self.host,self.port))
        self.get_stream()
        #self.stream.connect((self.host, self.port), self.on_connected)
        self.stream.connect((self.host, self.port)).add_done_callback(self.futureConnected)

    def futureConnected(self,future):
        if not self._stream.closed():
            self.on_connected()
        pass

    def decodeData(self,databytes):
        datastr = str(databytes,'utf-8')
        loginJson = None
        logging.info("==>>>%s",datastr);
        try:
            loginJson = json.loads(datastr)
        except Exception as e:
            logging.info("[MDClient] login data json.load failed" + e)
        return loginJson

    def decode_rpcdata(self, data):

        buffArr = KFByteArray(data)
        rpcdata = pyKFDJson.read_value(buffArr)
        argtype = trynum(rpcdata, "argtype")
        argbytes = rpcdata["args"]

        if argbytes is None:
            argbytes = b"[]"
            argtype = 0
            pass

        if argtype == 1:
            argsarr = KFByteArray(argbytes)
            rpcdata["args"] = [pyKFDJson.read_value(argsarr)]
            pass
        else:
            rpcdata["args"] = self.decodeData(argbytes)
            pass

        #return self.decodeData(data)
        return rpcdata
        pass

    def encode_rpcdata(self, rpcdata):

        rpcdata["__cls__"] = "KFRPCData"
        args = tryobj(rpcdata, "args")
        argtype = 0
        argobj = None

        if args is not None and len(args) == 1:
            #目前不支持多参数的KFD数据类型
            argobj = args[0]
            if isinstance(argobj,dict) and trystr(argobj, "__cls__") != "":
                argtype = 1
                pass
            pass

        if argtype == 1:
            buffarr = KFByteArray()
            pyKFDJson.write_value(buffarr, argobj)
            rpcdata["args"] = buffarr.buffer
            pass
        else:
            rpcdata["args"] = bytes(json.dumps(args), 'utf-8')
            pass

        rpcdata["argtype"] = argtype

        sendbuffarr = KFByteArray()
        pyKFDJson.write_value(sendbuffarr, rpcdata)

        return sendbuffarr.buffer
        pass

    def on_connected(self):
        loginstr = self.loginstr
        if loginstr is None:
            loginstr = '{"token":"%s","remoteID":%d,"userName":"%s"}'
        loginstr = loginstr % (self.token, self.localID, self.userName);
        logging.info("[MDClient] connection connected start login:%s",loginstr);
        self.dcTimes = 0
        #self.stream.write(loginstr)
        self.write_pdata(loginstr)
        #self.stream.read_until(self.EOF, self.on_logined)
        self.read_until_pdata(self.on_logined)
        pass

    def on_logined(self,data,headData):
        jdata = self.decodeData(data)
        if jdata == None or "ret" not in jdata or jdata["ret"] != 0:
            ret = jdata["ret"]
            msg = "UNKNOW"
            if "msg" in jdata:
                msg = jdata["msg"]
                logging.info("[MDClient] login failed[%d] : %s"%(ret,msg))
            #self.stream.read_until(self.EOF, self.on_logined)
            self.read_until_pdata(self.on_logined)
        else:
            logging.info("[MDClient] login success:")
            self.logined = True
            self.flush_cache_rps();
            #self.stream.read_until(self.EOF, self.on_receive);
            self.read_until_pdata(self.on_receive)
            if self.eventHandler != None:
                self.eventHandler(MDClient.EVENT_LOGINED,jdata)
        pass

    def on_receive(self, data,headData):

        logging.info("[MDClient] Received: %s" % data)
        bodytype = trynum(headData,"bodytype")

        if bodytype == 0:
            rpcData = self.decode_rpcdata(data)
            func = self.dataHandler
            if rpcData != None and func != None:
                func(rpcData)
            else:
                logging.info("[MDClient] Don't found DataHandler drop message")
        else:
            handler = tryobj(self.bodyTypeHandler,bodytype)
            if handler is not None:
                handler(data,headData)
            else:
                logging.info("[MDClient] Don't found bodytype handler drop message")

        #self.stream.read_until(self.EOF, self.on_receive)
        self.read_until_pdata(self.on_receive)

    def on_close(self):
        self.reset()
        logging.info("[MDClient] connection closed")

        if self.eventHandler != None:
            self.eventHandler(MDClient.EVENT_CLOSED,None)

        self.logined = False
        self.dcTimes += 1
        if self.shutdown:  
            self.io_loop.stop()
        else:
            logging.info("[MDClient] connecting at 5 second")
            sec = (self.dcTimes - 3) * 5
            if sec <= 0:
                sec = 5
            self.io_loop.call_later(sec,self.connect)
  
    def _send_rpc_message(self,rpc):
        #rpcstr = rpc["headstr"] + WRITE_END_TAG + json.dumps(rpc["body"]) + WRITE_END_TAG;
        #self.stream.write(rpcstr);
        head = rpc["head"]
        event = None
        if "event" in head:
            event = head["event"]
            pass
        bodytype = trynum(head,"bodytype")
        if bodytype == 0:
            self.write_pdata(self.encode_rpcdata(rpc["body"]),event,0,0,head["fromid"],head["toid"])
        else:
            self.write_pdata(rpc["body"],event,bodytype,0,head["fromid"],head["toid"])

    def flush_cache_rps(self):
        cachRpcs = None
        self.cacheLock0.acquire()
        size = len(self.cachRpcs)
        if size > 0:
            cachRpcs = self.cachRpcs
            self.cachRpcs = []
        self.cacheLock0.release()

        if cachRpcs != None:
            size = len(cachRpcs)
            i = 0
            while i < size:
                self._send_rpc_message(cachRpcs[i])
                i += 1
        pass
    def push_rpc_data(self,remoteID,rpcData,evt = "",bodytype = 0):
        rpc = {}
        head = {}
        head["fromid"] = self.localID
        head["toid"] = remoteID
        head["bodytype"] = bodytype
        if evt != "":
            head["event"] = evt
        rpc["head"] = head
        rpc["body"] = rpcData

        if self.logined == True:
            self.io_loop.add_callback(self._send_rpc_message,rpc)
            return True
        else:
            self.cacheLock0.acquire()
            self.cachRpcs.append(rpc)
            self.cacheLock0.release()
            logging.info("[MDClient] client isn't logined rpc add to caches")
            return False
        pass

    def set_shutdown(self):  
        self.shutdown = True

    def close(self,isShutdown = True):
        if isShutdown:
            self.set_shutdown()
        self.stream.close()


