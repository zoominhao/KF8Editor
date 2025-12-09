#! /usr/bin/env python  
#coding=utf-8

import struct

from Comm.Funcs import *

"""
    改造成一个二进制的中转协议
    magic   :3byte // 'abc'
    cmd     :2byte
    evtlen  :2byte //是否广播
    bodytype:1byte
    datalen :4byte
    fromid  :4byte
    toid    :4byte
    bodydata:evtlen + datalen
    
    head:20byte
    cmd = 100 一般表示一个RPC的调用 rpc的调用没有标准化完善过程中
    cmd = 404 表示退出事件
    toid = -1 event有内容表示广播
    toid = -2 event的内容是一个json数组里面装有需要广播id数组[暂时这样设计的]
"""

### BODY TYPE 现在有的定义 ###
class BodyTypeDef(object):
    BODY_TYPE_json  = 0
    BODY_TYPE_bytes = 1
    pass

class BaseConnection(object):

    def __init__(self, stream, ws=False):
        self._ws = ws
        self._stream = stream
        self._PDATA_MAGIC = 'abc'
        self._PDATA_MAGIC_BYTES = bytes(self._PDATA_MAGIC,'utf-8')
        self._PDATA_HEAD_SIZE = 20
        self._PDATA_BODY_SIZE = 0
        self._PDATA_HEAD_DATA = None
        self._PDATA_CALL_BACK = None
        pass

    def setStream(self,stream):
        self._stream = stream

    def reset(self):
        self._PDATA_BODY_SIZE = 0
        self._PDATA_HEAD_DATA = None
        self._PDATA_CALL_BACK = None
        pass

    """
    void callback(data,head)
    """
    def read_until_pdata(self,callback):
        if self._PDATA_CALL_BACK is not None:
            return False
        self._PDATA_CALL_BACK = callback
        self._read_pdata()
        return True
        pass

    """datatype=0表示字符"""
    def write_pdata(self,data,event=None,dataType=0,cmd=0,fromid=0,toid=0):

        if self._stream.closed():
            return

        bytesarr = data

        if isinstance(data,str):
            bytesarr = bytes(data,'utf-8')
            pass

        datalen = len(bytesarr)
        pdataBytes = None

        if event is None:
            formatstr = "!3sHHbiii%ds" % (datalen,)
            pdataBytes = struct.pack(formatstr,self._PDATA_MAGIC_BYTES, cmd, 0, dataType, datalen, fromid, toid, bytesarr)
        else:

            evtbytes = bytes(event, 'utf-8')
            evtlen = len(evtbytes)

            formatstr = "!3sHHbiii%ds%ds" % (evtlen,datalen)
            pdataBytes = struct.pack(formatstr, self._PDATA_MAGIC_BYTES, cmd, evtlen, dataType, datalen, fromid, toid, evtbytes,bytesarr)
        if pdataBytes is not None:
            if self._ws:
                self._stream.write_message(pdataBytes,True)
            else:
                self._stream.write(pdataBytes)
            pass
        pass

    def _read_pdata(self):
        if not self._stream.closed():
            if not self._ws:
                if self._PDATA_HEAD_DATA is None:
                    #self._stream.read_bytes(self._PDATA_HEAD_SIZE,self._on_bytes_readed)
                    self._stream.read_bytes(self._PDATA_HEAD_SIZE).add_done_callback(self._future_on_bytes_readed)
                else:
                    #self._stream.read_bytes(self._PDATA_BODY_SIZE,self._on_bytes_readed)
                    self._stream.read_bytes(self._PDATA_BODY_SIZE).add_done_callback(self._future_on_bytes_readed)
                    pass
                pass
            else:
                self._stream.set_message_handler(self._on_bytes_readed,self._PDATA_HEAD_SIZE)
                pass
        pass

    def _future_on_bytes_readed(self,future):
        if not self._stream.closed():
            self._on_bytes_readed(future.result())
        pass

    def _on_bytes_readed(self,bytes,offset=0):
        if self._PDATA_HEAD_DATA is None:
            magic,cmd,evtlen,bodytype,datalen,fromid,toid = struct.unpack_from("!3sHHbiii",bytes,offset)
            #check magic
            if str(magic,'utf-8') == self._PDATA_MAGIC:
                pdataHead = {}
                pdataHead["cmd"] = cmd
                pdataHead["evtlen"] = evtlen
                pdataHead["bodytype"] = bodytype
                pdataHead["datalen"] = datalen
                pdataHead["fromid"] = fromid
                pdataHead["toid"] = toid

                bodylen = datalen + evtlen
                if bodylen  > 0:
                    self._PDATA_HEAD_DATA = pdataHead
                    self._PDATA_BODY_SIZE = bodylen
                else:
                    callback = self._PDATA_CALL_BACK
                    self._PDATA_CALL_BACK = None
                    if callback is not None:
                        callback(None,pdataHead)
                    return
            else:
                logging.error("magic is Incorrect %s",bytes)
            pass
        else:
            pdataHead = self._PDATA_HEAD_DATA
            callback = self._PDATA_CALL_BACK

            self._PDATA_HEAD_DATA = None
            self._PDATA_CALL_BACK = None
            self._PDATA_BODY_SIZE = 0

            if callback is not None:
                evtlen = pdataHead["evtlen"]
                datatype = pdataHead["bodytype"]

                if evtlen == 0:
                    if offset == 0:
                        callback(bytes,pdataHead)
                    else:
                        callback(bytes[offset:], pdataHead)
                        pass
                else:
                    datalen = pdataHead["datalen"]
                    evt,databytes = struct.unpack_from("!%ds%ds"%(evtlen,datalen),bytes,offset)
                    pdataHead["event"] = str(evt,'utf-8')
                    callback(databytes, pdataHead)
            return
        self._read_pdata()
        pass
