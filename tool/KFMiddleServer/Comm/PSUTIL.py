#! /usr/bin/env python
#coding=utf-8

import logging

has_psutil = False
try:
    import psutil
    has_psutil = True
except Exception as err:
    print("import psutil error!")
    has_psutil = False


def get_pid(name, notin = None):

    if not has_psutil:
        return 0

    process_list = psutil.pids()
    pid = 0
    for ppid in process_list:
        process_info = psutil.Process(ppid)
        try:
            pname = ' '.join(process_info.cmdline())
            cmdstr = "%s" % (name,)
            ##logging.info("find pid = %d name = %s" , ppid , pname)
            if pname.find(cmdstr) != -1:
                if notin is None or (pname.find(notin) == -1):
                    #logging.info("psutil find:%s pid:%d" , pname, ppid)
                    pid = ppid
                    break
                pass
        except:
            #print "error find pid = %d name = %s" % (ppid,process_info.name())
            pid = 0
            pass
    return pid
