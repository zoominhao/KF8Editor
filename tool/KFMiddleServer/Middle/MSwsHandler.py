#! /usr/bin/env python
#coding=utf-8

import tornado.websocket
import tornado.ioloop
import logging
import time

#web连接的协议及数据处理器

class MSwsHandler(tornado.websocket.WebSocketHandler):
    ConnProxy = None
    def check_origin(self, origin):
        logging.debug("check_origin")
        self.connected = False
        self.msghandler = None
        self.headsize = 20
        self.connecttime = time.time()
        self.closecallback = None

        return True
        pass

    def open(self):
        logging.debug("connection open")
        self.connected = True
        if MSwsHandler.ConnProxy:
            MSwsHandler.ConnProxy.handle_conenction(self, ["",0], True)
            pass
        pass

    def set_close_callback(self,callback):
        self.closecallback = callback
        pass

    def on_message(self, message):
        #logging.debug(u"Your message was len: %d" , len(message))
        if self.msghandler is not None:
            self.msghandler(message, 0)
            self.msghandler(message, self.headsize)
            pass
        pass

    def set_message_handler(self,msghandler, headsize):
        self.msghandler = msghandler
        self.headsize = headsize
        pass

    def closed(self):
        return self.connected == False
        pass

    def on_close(self):

        logging.info("ws on closed")

        if hasattr(self,"connected") and self.connected:
            self.connected = False
            if self.closecallback:
                self.closecallback()
                pass
            pass
        pass