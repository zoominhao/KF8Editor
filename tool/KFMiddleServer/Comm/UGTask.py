#! /usr/bin/env python
#coding=utf-8

import time,threading
import _thread as thread

class UGTask:
	def __init__(self,autoUpdate = False):
		self.tasks = [];
		self.running = False;
		self.autoUpdate = autoUpdate;
		pass

	#UG.Round_time - count,0,__Collection_warning,(UG,count,)
	def enter(self,delay,pr,func,params):

		task = {};

		task["func"] = func;
		task["params"] = params;
		task["uptime"] = time.time() + delay;

		self.tasks.append(task);

		return task;
		pass

	def update(self):
		
		if self.running == False:
			return;

		ct = time.time();
		count = len(self.tasks);
		i = 0;

		while i < count:
			task = self.tasks[i];
			uptime = task["uptime"];

			if uptime <= ct:
				
				self.tasks.remove(task);

				func = task["func"];
				params = task["params"];

				func(*params);

				count -= 1;

			else:
				i += 1;

			pass
		pass
	
	def run(self,sleepTime = 1):
		if self.running == False:
			self.running = True;
			if self.autoUpdate:
				while  True:
					self.update();
					time.sleep(sleepTime);
					pass
			pass
		pass

class UGTaskThread():
	def __init__(self):
		self.threadID = 0;
		self.returnObjs = [];
		self.tasks = [];
		self.running = False;
		self.sleepTime = 1.0

	def sync(self,delay,func,params,retunfunc = None , returnparams = None):
		if self.lock0 == None or self.lock0.acquire():
			task = {};
			task["func"] = func;
			task["params"] = params;
			task["uptime"] = time.time() + delay;

			if retunfunc != None:
				task["returnObj"] = {"func":retunfunc,"params":returnparams};
			else:
				task["returnObj"] = None;

			self.tasks.append(task);
			if self.lock0 != None:
				self.lock0.release();
		pass

	def returnUpdate(self):
		returnObjs = None;
		size = 0;
		self.lock1.acquire();
		size = len(self.returnObjs);
		if size > 0:
			returnObjs = self.returnObjs;
			self.returnObjs = [];
		self.lock1.release();

		if returnObjs != None:
			i = 0;
			while i < size:
				obj = returnObjs[i];
				func = obj["func"];
				params = obj["params"];
				if params != None:
					func(*params);
				else:
					func();
				i += 1;
				pass
		pass

	def endTask(self,returnObj):

		if self.lock1.acquire():
			self.returnObjs.append(returnObj);
			self.lock1.release();
		pass

	def syncUpdate(self,currentThread):
		while self.running:
			calltasks = None;
			if self.lock0.acquire():
				ct = time.time();
				count = len(self.tasks);
				i = 0;

				while i < count:
					task = self.tasks[i];
					uptime = task["uptime"];

					if uptime <= ct:	
						self.tasks.remove(task);
						if calltasks == None:
							calltasks = [];

						calltasks.append(task);
						count -= 1;

					else:
						i += 1;

					pass
				self.lock0.release();

			if calltasks != None:
				i = 0;
				size = len(calltasks);
				while i < size:

					task = calltasks[i];
					func = task["func"];
					params = task["params"];
					returnObj = task["returnObj"];

					func(*params);
					if returnObj != None:
						self.endTask(returnObj);

					i += 1;
					pass

			time.sleep(self.sleepTime);
			pass
		pass

	def stop(self):
		self.running = False;
		pass

	def run(self,sleepTime = 1.0):
		if self.running == False:
			self.running = True;
			self.sleepTime = sleepTime
			self.lock0 = threading.Lock();
			self.lock1 = threading.Lock();
			self.threadID = thread.start_new_thread(self.syncUpdate,(self,) );
		pass


class GlobalThreadPool():

    taskThreads = []
    nextIndex = 0
    thdCount = 0

    def startThreads(self,num = 2,sleepTime = 1):
        if self.thdCount == 0:
            i = 0;
            while i < num:
                thd = UGTaskThread()
                self.taskThreads.append(thd)
                thd.run(sleepTime)
                i += 1
                pass
            self.thdCount = num
            self.nextIndex = 0
            pass

        pass

    def stopThreads(self):

        if self.thdCount > 0:
            i = 0;
            while i < self.thdCount:
                thd = self.taskThreads[i]
                thd.stop()
                i += 1
                pass

            self.taskThreads = []
            self.thdCount = 0
            pass
        pass

        pass

    def getThread(self):
        thd = None

        if self.nextIndex < self.thdCount:
            thd = self.taskThreads[self.nextIndex]
        self.nextIndex += 1

        if self.nextIndex >= self.nextIndex:
            self.nextIndex = 0

        return thd
        pass

    def returnUpdate(self):

        if self.thdCount > 0:
            i = 0;
            while i < self.thdCount:
                thd = self.taskThreads[i]
                thd.returnUpdate()
                i += 1
                pass
        pass

    pass;

#global threa pool
globalThreadPool = GlobalThreadPool()