import os
import sys

rootpath = os.path.dirname(sys.path[0])
os.chdir(rootpath)
sys.path.append(rootpath)

print("===>%s",rootpath)

from  Middle.MiddleServer import start_middle_server

if __name__ == "__main__":
    start_middle_server()