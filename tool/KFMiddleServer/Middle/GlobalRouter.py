#! /usr/bin/env python  
#coding=utf-8

from tornado.tcpserver import TCPServer
from tornado.ioloop import IOLoop
from Comm.ReloadHelper import *

class RouterConnection(BaseConnection):

    clients = []
    remotes = {}
    configs = {}
    dynamic_nodes = []
    dynamic_nodes_str = "[]"
    cacheMsgs = {}
    CONN_TIMEOUT = 300000
    MSG_CACHE_NUM = 1000
    MSG_CACHE_TIME = 120

    @staticmethod
    def FIND_DYNAMIC_NODE(username,config,autoid):

        lenc = len(RouterConnection.dynamic_nodes)
        i = 0
        while i < lenc:
            dnode = RouterConnection.dynamic_nodes[i]
            if dnode["name"]  == username:
                return dnode
            i = i + 1
        #not found

        remoteID = autoid
        autoid += 1
        config["auto"] = autoid

        # add new remotenode
        nodeinfo = {"name": username, "remoteID": remoteID}

        RouterConnection.dynamic_nodes.append(nodeinfo)
        RouterConnection.dynamic_nodes_str = json.dumps(RouterConnection.dynamic_nodes)

        return nodeinfo
        pass


    def __init__(self, stream, address):
        BaseConnection.__init__(self,stream)
        RouterConnection.clients.append(self)
        self._stream = stream
        self._address = address[0]
        self._port = address[1]
        self._islogin = False
        self._isConnected = True
        self._msgCacheTime = RouterConnection.MSG_CACHE_TIME
        self._msgCacheMax = RouterConnection.MSG_CACHE_NUM
        self._rec_data_time = time.time()
        self.remoteID = -1
        self.userName = ""
        self.nodeinfo = None
        self.evts = {}
        self._stream.set_close_callback(self.on_close)
        #check timeout
        IOLoop.current().call_later(3,self._check_timeout)
        self.read_login()
        logging.debug("[GlobalRouter] A new user has entered the MiddleServer %s",address)

    def _check_timeout(self):
        if self._islogin == False:
            self.try_close()
            pass
        pass

    def is_timeout(self,ctime):
        return ctime - self._rec_data_time >= RouterConnection.CONN_TIMEOUT
        pass

    def read_login(self):
        #self._stream.read_until(END_TAG, self.on_loginArrv)
        self.read_until_pdata(self.on_loginArrv)

    def decodeData(self,data):
        loginJson = None
        try:
            loginJson = json.loads(data)
        except Exception as e:
            logging.warning("[GlobalRouter] login data json.load failed" + e)
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

            if remoteID in RouterConnection.remotes or REQUEST_STOP:
                if REQUEST_STOP:
                    errormsg = "REQUEST MIDDLE STOP"
                    default_server_close()
                else:
                    errormsg = "the remoteID[%d] has been " % remoteID
            elif remoteID in RouterConnection.configs:
                config = RouterConnection.configs[remoteID]

                if config == None or config["token"] != token:
                    if config != None:
                        errormsg = "incorrect token"
                        logging.info("[GlobalRouter] [remoteID = %s] login Failed %s != %s", remoteID, token,config["token"])
                    else:
                        errormsg = "not found remote id = %d" % (remoteID,)
                else:
                    self._islogin = True
                    autoid = trynum(config,"auto")
                    self.userName = trystr(loginJson, "userName")

                    if autoid >= 1:
                        nodeinfo = RouterConnection.FIND_DYNAMIC_NODE(self.userName,config,autoid)
                        remoteID = nodeinfo["remoteID"]
                        if remoteID in RouterConnection.remotes:
                            errormsg = "the remoteID[%d] has been " % remoteID
                            self._islogin = False
                            pass
                        else:
                            self.nodeinfo = nodeinfo
                        pass
                    pass
        else:
            logging.info("[GlobalRouter] connection login failed:",self._address)

        if self._islogin:

            #################add to remotelist #####################
            logging.info("[GlobalRouter] [remoteID = %s] online success", remoteID)
            self.remoteID = remoteID
            self.evts.clear()
            listens = config["listens"]
            jj = len(listens) - 1
            while jj >= 0:
                self.evts[listens[jj]] = True
                jj -= 1
            RouterConnection.remotes[remoteID] = self
            ##########################################################

            respstr = '{"ret":0,"msg":"","address":"%s","port":%d,"remoteID":%d,"remoteList":%s}'%(self._address,self._port,self.remoteID,RouterConnection.dynamic_nodes_str);

            self.send_message(respstr)

            if remoteID in RouterConnection.cacheMsgs:

                msglist = RouterConnection.cacheMsgs[remoteID]
                del RouterConnection.cacheMsgs[remoteID]

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

        if bodytype == 0:
            logging.debug("[on_messageArrv] %s",data)
        else:
            logging.debug("[on_messageArrv] bodytype = %d datalen:%d",bodytype,len(data))

        self._rec_data_time = time.time()
        self.broadcast_messages(data, headData["toid"], headData)
        self.read_message()
        pass

    def broadcast_messages(self, data , toid = -1,headdata = None):

        #广播发送还可以优化下效率不用每次拼BYTES
        dataType = headdata["bodytype"]
        cmd = headdata["cmd"]
        fromid = headdata["fromid"]

        if dataType == 0:
            logging.debug("[GlobalRouter] User said =%s,ip = %s,toid=%d", data, self._address, toid)
        else:
            logging.debug("[GlobalRouter] User said size = %d,ip = %s,toid=%d", len(data), self._address, toid)

        if toid == -1:
            evt = "";
            if headdata != None:
                if "event" in headdata:
                    evt = headdata["event"];
            for connid in RouterConnection.remotes:
                if connid != fromid :
                    conn = RouterConnection.remotes[connid];
                    if conn.listen(evt):
                        logging.debug("event(%s) to %d",evt,connid);
                        conn.send_message(data,dataType,cmd,fromid)
        else:
            if toid in RouterConnection.remotes:
                conn = RouterConnection.remotes[toid];
                if conn !=  None and conn.send_message(data,dataType,cmd,fromid):
                    return
            # connection was not found
            msglist = None

            if toid in RouterConnection.cacheMsgs:
                msglist = RouterConnection.cacheMsgs[toid]
            if msglist == None and toid in RouterConnection.configs:
                msglist = []
                RouterConnection.cacheMsgs[toid] = msglist

            if msglist != None:

                currtime = time.time()

                msgitm = {}
                msgitm["time"] = currtime
                msgitm["data"] = data

                msglist.append(msgitm)

                index = len(msglist) - 1
                maxindex = index - self._msgCacheMax

                while index >= 0:

                    itm = msglist[index]
                    itime = itm["time"]

                    if index <= maxindex or (currtime - itime) >= self._msgCacheTime:
                        msglist.pop(index)
                        break

                    index -= 1

            logging.warning("[GlobalRouter]  toid=%d from:%d can not found!",toid,self.remoteID)


    def send_message(self,data,dataType=0,cmd=0,fromid=0):
        succ = False
        if self._isConnected:
            try:
                if not self._stream.closed():
                    #self._stream.write(data)
                    self.write_pdata(data,None,dataType,cmd,fromid)
                    succ = True
                else:
                    self._stream.close()
            except:
                self._stream.close()

        return  succ

    def try_close(self):
        if self._stream != None:

            if self._stream.closed():
                self.on_close()
            else:
                self._stream.close()
        else:
            self.on_close()
        pass

    def on_close(self):

        if self._isConnected == False:
            return

        self._isConnected = False
        self_remoteid = self.remoteID
        self._stream.set_close_callback(None)

        RouterConnection.clients.remove(self)

        logging.debug("[GlobalRouter] A user has left the MiddleServer %s conn count(%d)", self._address,len(RouterConnection.clients))

        if self._islogin:
            self._islogin = False
            logging.info("[GlobalRouter] [RemoteID = %d] is offline",self_remoteid)

        if self_remoteid in RouterConnection.remotes:
            RouterConnection.remotes[self_remoteid] = None
            del RouterConnection.remotes[self_remoteid]

        self.nodeinfo = None
        self.remoteID = -1


class GlobalRouter(TCPServer):

    def handle_stream(self, stream, address):
        logging.debug("[GlobalRouter] New connection :%s", address)
        RouterConnection(stream, address)
        logging.debug("[GlobalRouter] connection num is %d:", len(RouterConnection.clients))

    def update(self):

        ctime = time.time()
        index = len(RouterConnection.clients) - 1
        timeoutconns = None
        while index >= 0 :
            conn = RouterConnection.clients[index]
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

    def start(self,configPath):

        config = LoadConfig(configPath)

        if config is None:
            return False

        listen_port = trynum(tryobj(config,"Server"),"port")

        RouterConnection.configs = tryobj(config,"RemoteIDs")
        RouterConnection.configs["remoteList"] = json.dumps(tryobj(config,"RemoteList"))

        logging.debug("remotelist:" + RouterConnection.configs["remoteList"])
        startFlag = True

        try:
            self.listen(listen_port)
            #CHECK CONN TIMEOUT
            upateTimer = tornado.ioloop.PeriodicCallback(self.update, 60000)
            upateTimer.start()
        except Exception as err:
            startFlag = False
            logging.error("tpc start error:%s",repr(err))
            pass

        return startFlag
        pass

def start_globalrouter_server(logsize = 100,path = "logs/globalrouter"):
    init_logging(logging.DEBUG,True,logsize,path)
    server = GlobalRouter()
    if server.start(ROUTER_CONFIG_PATH):
        logging.info("[GlobalRouter] Server start ......")
    else:
        logging.error("[GlobalRouter] Server start Error")
        return
    server_call_init(None,"",2,None)
    IOLoop.current().start()
    pass
