const LogVerbosityStrs = ["NoLogging", "Fatal", "Error", "Warning", "Display", "Log", "Verbose", "VeryVerbose"];

function logVerbosityStr(verbosity) {
    let str = "Unknow";
    if (verbosity < LogVerbosityStrs.length) {
        str = LogVerbosityStrs[verbosity];
    }
    return str;
}

function logTimeStr(time) {
    let datetime = new Date(time);
    return datetime.toJSON().substr(0, 19).replace('T', ' ')
        + "." + (time % 1000).toString();
}

function RemoteLogWindow() {
    this.logFetching = false;
    this.logFetchInterval = 1000;
    this.logFetchTimer = null;
    this.autoLogFetch = true;
    this.allGotLogNum = -1;
    this.winOpened = false;
    this.console = true;

    this.win = $('#RemoteLogWin');
    this.dg = $('#RemoteLogDG');
    this.autoLogFetchUI = $('#autologfetch');
    this.clearCurrLogUI = $('#clearcurrlog');
    this.remoteBufferLogUI = $('#remotebufferlog');
    this.remoteLogConsoleUI = $('#remotelogconsole');
}

RemoteLogWindow.prototype.startFetchTimer = function () {
    let self = this;
    if (!this.logFetchTimer) {
        this.logFetchTimer = setInterval(function (){
            self.FetchLogs();
        }, this.logFetchInterval)
    }
}

RemoteLogWindow.prototype.stopFetchTimer = function () {
    if (this.logFetchTimer) {
        clearInterval(this.logFetchTimer);
        this.logFetchTimer = null;
    }
}

RemoteLogWindow.prototype.init = function () {
    let self = this;

    let mgr = this.logObj.GetNetObjMgr();
    if (mgr) {
        mgr.Event.on("OnDisconnected", function () {
            self.logObj = null;
            //self.allGotLogNum = -1;
            // 如果窗口打开，关闭
            self.win.window("close");
        });
    }

    this.logObj.Event.on("OnBufferLogChanged", function () {
        self.remoteBufferLogUI.checkbox({
            checked: self.logObj.BufferLog
        });
    })

    this.win.window({
        modal:false,
        minimizable:false,
        maximizable:true,
        inline:false,
        onOpen: function () {
            self.winOpened = true;
            if (this.autoLogFetch) {
                self.FetchLogs();
                self.startFetchTimer();
            }
        },
        onBeforeClose: function () {
            self.winOpened = false;
            // 删除定时器
            self.stopFetchTimer();
        }
    });

    //this.dg.datagrid('autoSizeColumn');

    this.autoLogFetchUI.checkbox({
        checked: this.autoLogFetch,
        onChange: function (checked) {
            self.autoLogFetch = checked;
            if (self.autoLogFetch) {
                self.startFetchTimer();
            } else {
                self.stopFetchTimer();
            }
        }
    });
    if (this.autoLogFetch) {
        self.startFetchTimer();
    }

    this.clearCurrLogUI.click(function() {
        self.dg.datagrid('loadData', []);
    });

    this.remoteBufferLogUI.checkbox({
        checked: self.logObj.BufferLog,
        onChange: function (checked) {
            if (self.logObj) {
                self.logObj.Set("BufferLog", checked);
                if (!checked) {
                    self.allGotLogNum = 0;
                }
            }
        }
    });

    this.remoteLogConsoleUI.checkbox({
        checked: self.console,
        onChange: function (checked) {
            self.console = checked;
        }
    });
}

RemoteLogWindow.prototype.Open = function (logobj) {
    this.logObj = logobj;
    this.init();
    this.win.window("open");
}

RemoteLogWindow.prototype.FetchLogs = function () {
    if (this.logFetching) { return; }
    if (!this.logObj) { return; }

    let self = this;
    this.logObj.Get("Logs", function (logs) {
        // 窗口打开才更新
        if (!self.winOpened) { return; }
        if (logs && logs.Logs && logs.Logs.length > 0) {
            for (i in logs.Logs) {
                let log = logs.Logs[i];
                let item = {
                    time:logTimeStr(log.Time),
                    category:log.Category.toString(),
                    data:log.Data,
                    verbosity:logVerbosityStr(log.Verbosity)
                }
                if (self.console) {
                    console.log("REMOTE_LOG", item.time, item.category, item.verbosity, item.data);
                } else {
                    self.dg.datagrid("appendRow", item);
                }
            }
            if (!self.console) {
                let data = self.dg.datagrid("getData");
                let index = 0;
                if (data.total > 1) {
                    index = data.total - 1;
                }
                self.dg.datagrid("scrollTo", index);
            }
            //self.allGotLogNum = self.allGotLogNum + logs.Logs.length;
            self.logFetching = false;
            if (logs.LeftLogNum > 0 && self.autoLogFetch) {
                // 还有，继续请求
                self.FetchLogs();
            }
        }
    }, this.allGotLogNum);

    this.logFetching = true;

    // rpc Get可能超时，定个超时清理
    setTimeout(function(){
        self.logFetching = false;
    }, 3000);
}
