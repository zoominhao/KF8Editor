#! /usr/bin/env python  
#coding=utf-8

import os
import sys
import time


rootpath = os.path.dirname(sys.path[0])
os.chdir(rootpath)
sys.path.append(rootpath)

import socket  
from Middle.MDRpc import *


class TestService(object):
    def __init__(self):
        pass
    def rpcHello(self,retobj):
        str = "rpcHello:%s"%(retobj["msg"],)
        print(str)
        return str

def testBack(str):
    print("=============== testback %s" % (str,))
    pass

def main():
    init_logging(logging.DEBUG, True)

    config = LoadConfig(DEF_CONFIG_PATH, "dynamic_server")
    #set userName
    config["Server"]["userName"] = "testclient"

    rpc = MDRpc(config);
    test = TestService();

    rpc.RegistService("rpcHello",test.rpcHello);
    #rpc.RemoteEvent()

    def on_rpc_ready():
        if rpc.ConnectRemote("testclient") == True:

            retobj = {"__cls__":"FKReturnObject"}
            retobj["msg"] = "i tell you msg"
            rpc.RemoteCallN("rpcHello", testBack, retobj);
            rpc.SendRemoteData("test any string...")
            pass
        pass

    def on_data_recv(data,head):
        logging.info("[on_data_recv] ===>>%s",data)
        pass

    rpc.RegistRemoteDataHandler(on_data_recv)
    rpc.Ready(on_rpc_ready, "ExportKFD");

    while True:
        rpc.Processing()
        time.sleep(0.2)
        pass


if __name__ == "__main__":
    main()
