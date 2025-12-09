#! /usr/bin/env python  
#coding=utf-8

import os
import sys

rootpath = os.path.dirname(sys.path[0])
os.chdir(rootpath)
sys.path.append(rootpath)

from Middle.MDRpc import *


RUNING = True

def main():

    init_logging(logging.DEBUG, True)

    config = LoadConfig(DEF_CONFIG_PATH, "dynamic_server")
    #set userName
    config["Server"]["userName"] = "testclient"
    runing = True

    def onClose():
        logging.info("退出....")
        global  RUNING
        RUNING = False
        pass

    rpc = MDRpc(config);
    rpc.client.loginstr = '{"token":"%s","remoteID":%d,"userName":"%s" ,"REQUEST_STOP":1}'
    rpc.ClosedCallback = onClose
    rpc.Ready();

    while RUNING:
        rpc.Processing();
        time.sleep(0.2);
        pass

if __name__ == "__main__":
    main()
