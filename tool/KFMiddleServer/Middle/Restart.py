#-*- encoding:UTF-8 -*-
import os
import sys
import string
import re
import time

from Comm.PSUTIL import *

def main(argv):

    name = None

    if len(argv) > 1:
        name = argv[1]

    if name == None or len(name) == 0:
        name = 'MiddleServer'

    pid = get_pid(name)
    killtimes = 0

    while pid != 0:

        if killtimes > 2:
            print("kill -2 %d" % (pid,))
            os.kill(pid, 2)
        else:
            print("kill -9 %d" % (pid,))
            os.kill(pid,9)

        time.sleep(3)
        pid = get_pid(name)
        killtimes += 1
        pass

    print("%s stop" % (name,))
    times = 0

    while pid == 0 and times < 2:
        os.system("nohup python %s.py &" % (name,))
        time.sleep(1)
        pid = get_pid(name)
        times += 1

    if pid != 0:
        print("%s restart success" % (name,))
    else:
        print("%s restart failed" % (name,))

if __name__ == "__main__":
    main(sys.argv)