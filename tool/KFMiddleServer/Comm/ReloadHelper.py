#! /usr/bin/env python
#coding=utf-8

import logging
import signal
import os
import platform
import time
import sys

from Middle.MDRpc import *
from Comm.PSUTIL import *
from imp import *

_reload_module = None
_funcx_arg = None

def _reload_sig_handler():
    if _reload_module is not None:
        logging.info("[_reload_sig_handler] reloadmodule now")
        reload(_reload_module)
        _reload_module.fix_reload(_funcx_arg)
        return True
    else:
        logging.warning("[_reload_sig_handler] reloadmodule is None")
        return False
    pass

reload_signal = signal.SIGTERM

def _is_win():
    return platform.system() == "Windows"

def reload_init(module,rpc,argx = None):
    global _reload_module
    global _funcx_arg

    _reload_module = module
    _funcx_arg = argx

    if _is_win():
        rpc.RegistService("reload_signal",_reload_sig_handler)
        pass
    else:
        signal.signal(reload_signal, _reload_sig_handler)
    pass

def _reload_call_end(ret = False):
    RpcEnd()
    msg = "success"
    if not ret:
        msg = "failed"
    logging.info("[_reload_call_end] %s",msg)
    pass

def reload_call(name,remotename,configpath):
    if _is_win():
        rpc = RpcConnect(configpath,remotename,"somerpccall")
        rpc.RemoteCallVoid("reload_signal",_reload_call_end)
        RpcCall(rpc)
        pass
    else:
        pid = get_pid(name)
        if pid == 0:
            logging.info("%s reload failed 'pid is zero!'" % (name,))
            return False
        signalid = reload_signal
        logging.info("kill -%d %d" % (signalid, pid))
        os.kill(pid, signalid)
    return True

def reload_function(oldobj, newobj, depth = 0):
    setattr(oldobj, "func_code", newobj.func_code)
    setattr(oldobj, "func_defaults", newobj.func_defaults)
    setattr(oldobj, "func_doc", newobj.func_doc)

def reload_classmethod(oldobj, newobj, depth):
    oldfunc = oldobj.__get__(object).im_func
    newfunc = newobj.__get__(object).im_func
    reload_function(oldfunc, newfunc, depth)

def reload_staticmethod(oldobj, newobj, depth):
    oldfunc = oldobj.__get__(object)
    newfunc = newobj.__get__(object)
    reload_function(oldfunc, newfunc, depth)

def default_server_close(signum = None,frame = None):
    tornado.ioloop.IOLoop.instance().add_callback(default_shutdown)

__shutdownfunc = None
__stopdelaytime = 2

def default_shutdown():
    global __shutdownfunc
    shutdownfunc = __shutdownfunc
    __shutdownfunc = None
    if shutdownfunc is not None:
        shutdownfunc()
    else:
        logging.debug("shutdownfunc is None")
    delaytime = __stopdelaytime;
    logging.info('Will shutdown in %d seconds ...',delaytime)
    io_loop = tornado.ioloop.IOLoop.current()
    deadline = time.time() + delaytime
    def stop_loop():
        now = time.time()
        if now < deadline:
            io_loop.add_timeout(deadline, stop_loop)
        else:
            io_loop.stop()
            #处理完现有的 callback 和 timeout 后，可以跳出 io_loop.start() 里的循环
            logging.info('Shutdown')
    stop_loop()

def server_call_init(rpc,servermethod,serversignal,shutdownfunc,stopdelaytime = 2,closefunc = None):

    global  __shutdownfunc
    global  __stopdelaytime

    if closefunc is None:
        closefunc = default_server_close
        __shutdownfunc = shutdownfunc
        __stopdelaytime = stopdelaytime

    if _is_win():
        if rpc is not None:
            rpc.RegistService(servermethod,closefunc)
        pass
    else:
        signal.signal(serversignal, closefunc)
    pass

def _server_call_end(ret = False):
    RpcEnd()
    msg = "success"
    if not ret:
        msg = "failed"
    logging.info("[_server_call_end] %s",msg)
    pass

def server_call(name,remotename,configpath,remotemethod,signalid):
    if _is_win():
        rpc = RpcConnect(configpath,remotename,"somerpccall")
        rpc.RemoteCallVoid(remotemethod,_server_call_end)
        RpcCall(rpc)
        pass
    else:
        pid = get_pid(name)
        if pid == 0:
            logging.info("%s servercall[%s] failed 'pid is zero!'" % (name,remotemethod))
            return False
        logging.info("kill -%d %d" % (signalid, pid))
        os.kill(pid, signalid)
    return True