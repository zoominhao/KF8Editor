import sys
import os

from Comm.Funcs import *
from Middle.MiddleServer import start_middle_server

if __name__ == "__main__":
    currpath = (sys.path[0])
    os.chdir(currpath)
    print("work path=>%s" % (os.getcwd(),))
    tcpvalue = get_sys_arg_value("tcp", sys.argv)
    wsvalue = get_sys_arg_value("ws",sys.argv)
    start_middle_server(tcp=(tcpvalue!='false'), ws=(wsvalue=='true'))
    pass