#! /usr/bin/env python  
#coding=utf-8

import sys
import os
import json

from tornado.tcpserver import TCPServer
from tornado.ioloop import IOLoop
from Comm.ReloadHelper import *
from Middle.MSwsHandler import *

class Connection(BaseConnection):
    clients = []
    remotes = {}
    configs = {}
    missconnids = {}
    dynamic_nodes = []
    dynamic_nodes_str = "[]"
    cacheMsgs = {}
    CONN_TIMEOUT = 300000
    MSG_CACHE_NUM = 1000
    MSG_CACHE_TIME = 120

    @staticmethod
    def FIND_DYNAMIC_NODE(username,config,autoid):

        lenc = len(Connection.dynamic_nodes)
        i = 0
        while i < lenc:
            dnode = Connection.dynamic_nodes[i]
            if dnode["name"]  == username:
                return dnode
            i = i + 1
        #not found

        remoteID = autoid
        autoid += 1
        config["auto"] = autoid

        # add new remotenode
        nodeinfo = {"name": username, "remoteID": remoteID, "online": 1}

        Connection.dynamic_nodes.append(nodeinfo)
        Connection.dynamic_nodes_str = json.dumps(Connection.dynamic_nodes)

        return nodeinfo
        pass

    @staticmethod
    def SET_NODE_ONLINE(remoteID, online):
        lenc = len(Connection.dynamic_nodes)
        i = 0
        while i < lenc:
            dnode = Connection.dynamic_nodes[i]
            if dnode["remoteID"] == remoteID:
                dnode["online"] = online
                break
            i = i + 1
        Connection.dynamic_nodes_str = json.dumps(Connection.dynamic_nodes)


    def __init__(self, stream, address,ws = False):
        BaseConnection.__init__(self,stream,ws)
        Connection.clients.append(self)
        self._stream = stream    
        self._address = address[0]
        self._port = address[1]
        self._islogin = False
        self._isConnected = True
        self._msgCacheTime = Connection.MSG_CACHE_TIME
        self._msgCacheMax = Connection.MSG_CACHE_NUM
        self._rec_data_time = time.time()
        self.remoteID = -1
        self.userName = ""
        self.nodeinfo = None
        self.evts = {}
        self.debug = False
        self._stream.set_close_callback(self.on_close)
        #check timeout
        IOLoop.current().call_later(3,self._check_timeout)
        self.read_login()
        logging.debug("[MiddleServer] A new user has entered the MiddleServer %s",address)

    def _check_timeout(self):
        if self._islogin == False:
            self.try_close()
            pass
        pass

    def is_timeout(self,ctime):
        return (ctime - self._rec_data_time) * 1000 >= Connection.CONN_TIMEOUT
        pass

    def read_login(self):
        #self._stream.read_until(END_TAG, self.on_loginArrv)
        self.read_until_pdata(self.on_loginArrv)

    def decodeData(self,databytes):
        data = str(databytes,'utf-8')
        logging.info(data)
        loginJson = None
        try:
            loginJson = json.loads(data)
        except Exception as e:
            logging.warning("[MiddleServer] login data json.load failed" + e)
        return loginJson

    def on_loginArrv(self,data,headData):

        loginJson = self.decodeData(data)
        remoteID = 0
        errormsg = "unkown"

        if  loginJson != None and "token" in loginJson and "remoteID" in loginJson:

            remoteID = loginJson["remoteID"]
            token = loginJson["token"]

            config = None
            REQUEST_STOP = trynum(loginJson, "REQUEST_STOP") == 1

            if remoteID in Connection.remotes or REQUEST_STOP:
                if REQUEST_STOP:
                    errormsg = "REQUEST MIDDLE STOP"
                    default_server_close()
                else:
                    errormsg = "the remoteID[%d] has been " % remoteID
            elif remoteID in Connection.configs:
                config = Connection.configs[remoteID]

                if config == None or config["token"] != token:
                    if config != None:
                        errormsg = "incorrect token"
                        logging.info("[MiddleServer] [remoteID = %s] login Failed %s != %s", remoteID, token,config["token"])
                    else:
                        errormsg = "not found remote id = %d" % (remoteID,)

                else:
                    self._islogin = True
                    autoid = trynum(config,"auto")
                    self.userName = trystr(loginJson, "userName")

                    if autoid >= 1:
                        nodeinfo = Connection.FIND_DYNAMIC_NODE(self.userName,config,autoid)
                        remoteID = nodeinfo["remoteID"]
                        if remoteID in Connection.remotes:
                            errormsg = "the remoteID[%d] has been " % remoteID
                            self._islogin = False
                            pass
                        else:
                            self.nodeinfo = nodeinfo
                        pass
                    pass
        else:
            logging.info("[MiddleServer] connection login failed:",self._address)

        if self._islogin:

            #################add to remotelist #####################
            logging.info("[MiddleServer] [remoteID = %s] online success", remoteID)
            self.remoteID = remoteID
            Connection.SET_NODE_ONLINE(self.remoteID, 1)
            self.evts.clear()
            listens = config["listens"]
            jj = len(listens) - 1
            while jj >= 0:
                self.evts[listens[jj]] = True
                jj -= 1
            Connection.remotes[remoteID] = self
            ##########################################################

            respstr = '{"ret":0,"msg":"","address":"%s","port":%d,"remoteID":%d,"remoteList":%s}'%(self._address,self._port,self.remoteID,Connection.dynamic_nodes_str);
            logging.info("[MiddleServer] connection login respstr:%s", respstr)
            self.send_message(respstr)


            if remoteID in Connection.cacheMsgs:

                msglist = Connection.cacheMsgs[remoteID]
                del Connection.cacheMsgs[remoteID]

                size = len(msglist)
                i = 0
                currtime = time.time()

                while i < size:

                    itm = msglist[i]

                    if (currtime  - itm["time"]) < self._msgCacheTime:
                        self.send_message(itm["data"])
                    i += 1
            self.read_message()
        else:
            respstr = '{"ret":-1,"msg":"%s"}'%(errormsg,)

            logging.info("[MiddleServer] connection login failed:%s",errormsg)

            self.send_message(respstr);
            self.read_login();
        pass

    def listen(self,evt):
        if evt == "":
            return True
        return evt in self.evts
        pass

    def read_message(self):
        #self._stream.read_until(END_TAG,self.on_messageArrv)
        self.read_until_pdata(self.on_messageArrv)
        pass

    def on_messageArrv(self,data,headData):

        bodytype = headData["bodytype"]
        fromid = headData["fromid"]

        if fromid != self.remoteID:
            logging.error("fake from id {0} real is {1}",fromid,self.remoteID)
            headData["fromid"] = self.remoteID
            pass

        if self.debug:
            if bodytype == 0:
                logging.debug("[on_messageArrv] %s",data)
            else:
                logging.debug("[on_messageArrv] bodytype = %d datalen:%d",bodytype,len(data))
            pass

        self._rec_data_time = time.time()
        Connection.broadcast_messages(data, headData["toid"], headData, self.debug, self._msgCacheMax,self._msgCacheTime)
        self.read_message()
        pass

    @staticmethod
    def broadcast_messages(data , toid = -1, headdata = None ,debug=False,msgCacheMax=1000,msgCacheTime=120):

        #广播发送还可以优化下效率不用每次拼BYTES
        dataType = headdata["bodytype"]
        cmd = headdata["cmd"]
        fromid = headdata["fromid"]

        if debug:
            if dataType == 0:
                logging.debug("[MiddleServer] User said=%s, ip=%s, toid=%d, cmd=%d", data, toid, cmd)
            else:
                logging.debug("[MiddleServer] User said size=%d, ip=%s, toid=%d, cmd=%d", len(data), toid, cmd)
            pass

        #心跳
        if cmd == 101:
            logging.debug("[MiddleServer] heartbeat from=%d, cmd=%d", fromid, cmd)
            return

        if toid == -1:
            evt = "";
            if headdata != None:
                if "event" in headdata:
                    evt = headdata["event"]
            for connid in Connection.remotes:
                if connid != fromid :
                    conn = Connection.remotes[connid]
                    if conn.listen(evt):
                        logging.debug("event(%s) to %d",evt,connid)
                        conn.send_message(data,dataType,cmd,fromid)
                        pass
                    pass
                pass
            pass
        elif toid == -2:
            #由一个json数组指定ID数组
            toidarr = None
            if headdata != None:
                if "event" in headdata:
                    evt = headdata["event"]
                    try:
                        toidarr = json.loads(evt)
                    except Exception as err:
                        toidarr = None
                        logging.exception(err)
                        pass
                    pass
            if toidarr is not None:
                for connid in toidarr:
                    if connid != fromid:
                        conn = Connection.remotes.get(connid)
                        if conn:
                            if debug:
                                logging.debug("event(%s) to %d", evt, connid)
                            conn.send_message(data, dataType, cmd, fromid)
                            pass
                        else:
                            missinfo = Connection.missconnids.get(connid)
                            if not missinfo:
                                missinfo = {'times':0}
                                Connection.missconnids[connid] = missinfo
                                pass
                            misstimes = missinfo["times"]
                            misstimes += 1
                            missinfo["times"] = misstimes

                            if misstimes >= 50:
                                missinfo["times"] = 0
                                Connection.offline_event(connid)
                                pass

                            pass
                        pass
                    pass
                pass
            pass
        else:
            if toid in Connection.remotes:
                conn = Connection.remotes[toid]
                if conn !=  None and conn.send_message(data,dataType,cmd,fromid):
                    return
            # connection was not found
            msglist = None

            if toid in Connection.cacheMsgs:
                msglist = Connection.cacheMsgs[toid]
            if msglist == None and toid in Connection.configs:
                msglist = []
                Connection.cacheMsgs[toid] = msglist

            if msglist != None:

                currtime = time.time()

                msgitm = {}
                msgitm["time"] = currtime
                msgitm["data"] = data

                msglist.append(msgitm)

                index = len(msglist) - 1
                maxindex = index - msgCacheMax

                while index >= 0:

                    itm = msglist[index]
                    itime = itm["time"]

                    if index <= maxindex or (currtime - itime) >= msgCacheTime:
                        msglist.pop(index)
                        break

                    index -= 1

            logging.warning("[MiddleServer]  toid=%d can not found!",toid)


    def send_message(self,data,dataType = 0,cmd = 0,fromid = 0):
        succ = False
        if self._isConnected:

            try:
                if not self._stream.closed():
                    #self._stream.write(data)
                    self.write_pdata(data,None,dataType,cmd,fromid)
                    succ = True
                    self._rec_data_time = time.time()
                else:
                    self._stream.close()
            except Exception as err:
                logging.exception(err)
                self._stream.close()
        return  succ

    def try_close(self):
        if self._stream != None:
            logging.info("close my self")
            if self._stream.closed():
                self.on_close()
            else:
                try:
                    self._stream.close()
                except Exception as err:
                    logging.exception(err)
                    pass
                pass
        else:
            self.on_close()
        pass

    def on_close(self):

        if self._isConnected == False:
            return

        self._isConnected = False
        self_remoteid = self.remoteID
        self._stream.set_close_callback(None)

        Connection.clients.remove(self)

        logging.debug("[MiddleServer] A user has left the MiddleServer %s conn count(%d)", self._address,len(Connection.clients))

        logoutmsg = False;

        if self._islogin:
            logoutmsg = True
            self._islogin = False
            logging.info("[MiddleServer] [RemoteID = %d] is offline",self_remoteid)
            pass

        if self_remoteid in Connection.remotes:
            Connection.remotes[self_remoteid] = None
            del Connection.remotes[self_remoteid]
            pass

        if logoutmsg:
            Connection.offline_event(self_remoteid)
            pass

        Connection.SET_NODE_ONLINE(self.remoteID, 0)

        self.nodeinfo = None
        self.remoteID = -1
        pass

    @staticmethod
    def offline_event(self_remoteid):
        headdata = {}

        headdata["bodytype"] = 0
        headdata["cmd"] = 404
        headdata["fromid"] = self_remoteid
        headdata["event"] = "offline"

        Connection.broadcast_messages("bye", -1, headdata)
        pass



class MSTcp(TCPServer):
    def __init__(self, mdserver):
        TCPServer.__init__(self)
        self.mdserver = mdserver
        pass

    def handle_stream(self, stream, address):
        self.mdserver.handle_conenction(stream,address,False)
        pass
    pass

class MSws(object):
    def __init__(self, mdserver):
        self.mdserver = mdserver
        settings = {"MAX_WAIT_SECONDS_BEFORE_SHUTDOWN": 2}
        self.app = tornado.web.Application([(r'/ws', MSwsHandler)],**settings)
        MSwsHandler.ConnProxy = mdserver
        pass
    def listen(self,port):
        self.app.listen(port)
        pass
    pass


class MiddleServer(object):

    def __init__(self):
        self.tcp_server = None
        self.ws_server = None
        self.tcp = False
        self.ws = False
        pass

    def typename(self):
        type = ""
        if self.tcp:
            type += " TCP"
        if self.ws:
            type += " WebSocket"
        return type


    def handle_conenction(self, stream, address, ws):
        logging.debug("[MiddleServer] New connection :%s", address)
        Connection(stream, address, ws)
        logging.debug("[MiddleServer] connection num is %d:", len(Connection.clients))
        pass

    def update(self):

        ctime = time.time()
        index = len(Connection.clients) - 1
        timeoutconns = None
        while index >= 0 :
            conn = Connection.clients[index]
            if conn.is_timeout(ctime):
                if timeoutconns is None:
                    timeoutconns = []
                timeoutconns.append(conn)
                pass
            index -= 1
            pass

        if timeoutconns is not None:
            index = len(timeoutconns) - 1
            while index >= 0:
                conn = timeoutconns[index]
                conn.try_close()
                index -= 1
        pass

    def start(self, configPath, tcp=True, ws=False):

        config = LoadConfig(configPath)

        if config is None:
            return False
            pass

        if not tcp and not ws:
            return False
            pass

        self.tcp = tcp
        self.ws = ws
        if tcp:
            self.tcp_server = MSTcp(self)
            pass

        if ws:
            self.ws_server = MSws(self)
            pass

        listen_port = trynum(tryobj(config,"Server"),"port")

        Connection.configs = tryobj(config,"RemoteIDs")
        Connection.configs["remoteList"] = json.dumps(tryobj(config,"RemoteList"))

        logging.debug("remotelist:" + Connection.configs["remoteList"])
        if self.tcp:
            print("===[TCP] listen at [%d]===" % (listen_port))
        if self.ws:
            print("===[WebSocket] listen at [%d]===" % (listen_port+1))

        startFlag = True
        try:
            if self.tcp:
                self.tcp_server.listen(listen_port)
            if self.ws:
                self.ws_server.listen(listen_port+1)
            #CHECK CONN TIMEOUT
            upateTimer = tornado.ioloop.PeriodicCallback(self.update, 60000)
            upateTimer.start()
        except Exception as err:
            startFlag = False
            logging.error("tpc start error:%s : PORT:%d",repr(err), listen_port)
            pass
        return startFlag
        pass


def start_middle_server(logsize = 100,path = "logs/middle", tcp=True, ws=False):

    if logsize is None:
        logsize = 100
    if path is None:
        path =  "logs/middle"
        pass
    init_logging(logging.DEBUG,True,logsize,path)
    server = MiddleServer()
    if server.start(DEF_CONFIG_PATH,tcp,ws):
        logging.info("[MiddleServer] Server[%s] start ......", server.typename())
    else:
        logging.error("[MiddleServer] Server start Error")
        return
    server_call_init(None,"",2,None)
    IOLoop.current().start()
    pass

