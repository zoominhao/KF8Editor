
const { SIGTERM } = require('constants');
const { ipcMain, BrowserWindow, webContents, app } = require('electron');

function MonacoConnection(mainvars) {
    ///////////////////////////////////////
    ///editor
    let self = this;

    this.mainvars = mainvars;

    function getMonacoWin(id) {
        return mainvars.monacowins ? mainvars.monacowins[id] : null;
    }

    ///打开编辑
    ipcMain.on('monaco', (event, label) => {
        self.NewMonacoEditor(label);
    });
    ///编辑发生改变
    ipcMain.on("monacochange", (event, id, data) => {
        Sendmonacotext(id, data, null);
    });
    ///主动获取当前的文本
    //     ipcMain.on('getmonacotext', (event, id) =>{
    //         var text = null;
    //         let monacowin = getMonacoWin(id);
    //         if(monacowin){
    //             monacowin.webContents.send("getEditorText", id);
    //         }else{
    //             Sendmonacotext(id,text,event);
    //         }
    //     });
    ///编译通知
    ipcMain.on('codecompileend', (event, id, arg) => {
        let monacowin = getMonacoWin(id);
        if (monacowin) {
            monacowin.webContents.send("codeCompileEnd", id, arg);
        }
    });
    /// 调试相关
    ipcMain.on('monacodebug', (event, id, type, data) => {
        mainvars.SendGlobalEvent('onmonacodebug', { id: id, event: type, data: data });
    })

    ipcMain.on("monacodebugger", (event, id, type, data) => {
        let monacowin = getMonacoWin(id);
        if (monacowin) {
            monacowin.webContents.send("debugger", id, type, data);
        }
    });
    /// 中转消息
    ipcMain.on("monacomsg", (event, id, type, data) => {
        let monacowin = getMonacoWin(id);
        if (monacowin) {
            monacowin.webContents.send("msg", id, type, data);
        }
    });

    function Sendmonacotext(id, data, event) {
        // 通过id获取窗口并发送消息
        let intid = parseInt(id);
        let BrowserWindows = BrowserWindow.getAllWindows()
        for (let win of BrowserWindows) {
            if (win.id === intid) {
                win.webContents.send("onmonacotext", id, data);
                return;
            }
        }
        mainvars.mainwin.webContents.send("onmonacotext", id, data);
    }
}


const cclsPort = 3333;
const findPidFromPort = require("find-pid-from-port")

const clearCcls = async () => {
    try {
      const pids = await findPidFromPort(cclsPort)
      var kill = require('tree-kill');
      pids.all.forEach(pid =>{
          console.log(pid)
          kill(pid)
      })
    } catch (error) {
      console.log(error)
    }
}

const startCcls = async() => {
    let exists = false;
    try {
        const pids = await findPidFromPort(cclsPort);
        pids.all.forEach(pid =>{
            console.log(pids)
            exists = true;
        })
      } catch (error) {
        console.log(error)
      }
    if (!exists)
        {
            console.log("start ccls");
            var spawn = require('child_process').spawn;
            let ccls = spawn('cmd.exe', ['/c', '.\\tool\\ccls\\cclsRun.bat']);
            ccls.stdout.on('data', function (data) {
                let textChunk = data.toString('utf8');
                console.log('stdout: ' + textChunk.trim());
            });
        
            ccls.stderr.on('data', function (data) {
                let textChunk = data.toString('utf8');
                console.log('stderr: ' + textChunk.trim());
            });
            ccls.on('exit', function (code) {
                console.log('child process exited with code ' + code);
            });
        }
}

MonacoConnection.prototype.NewMonacoEditor = function (label) {
    //if (!id) return;
    // let srcid = id;
    let mainvars = this.mainvars;
    if (!mainvars.monacowins) {
        mainvars.monacowins = {}
    }
   
    // 改为多tab，先只用一个id
    let id = "1";
    let monacowin = mainvars.monacowins[id];
    if (!monacowin) {
        let kfdpath;
        let apppath;
        let appdatapath;
        mainvars.mainwin.webContents.send("globalconfig");
        
        clearCcls();

        ipcMain.once("globalconfig", (event, config) => {
            if (!config) return;
            kfdpath = config.kfdpath;
            apppath = config.apppath;
            appdatapath = config.appdatapath;
            if (!appdatapath) return;

            monacowin = new BrowserWindow({
                width: 800,
                height: 800,
                autoHideMenuBar: true,
                webPreferences: {
                    nativeWindowOpen: true
                    , nodeIntegration: true
                    , enableRemoteModule: true
                    , webSecurity: false
                    , contextIsolation: false
                    , worldSafeExecuteJavaScript: true
                },
                show: false
            });

            monacowin.on('closed', () => {
                mainvars.SendGlobalEvent('onmonacodebug', { id: id, event: "monacowinclosed" });
                clearCcls();
                delete mainvars.monacowins[id];
            });

            monacowin.loadFile("monaco-editor/base/index.html", {
                query: {
                    apppath: apppath,
                    kfdpath: kfdpath,
                    appdatapath: appdatapath,
                    id: monacowin.id,
                    maincid: mainvars.mainwin.webContents.id,
                    label: label ? label : "",
                }
            });
            mainvars.monacowins[id] = monacowin;

            monacowin.webContents.on('did-finish-load', () => {
                console.log('did-finish-load');
                // if (srcid) {
                // monacowin.webContents.send("openCodeByLabel", label);
                // }
            });

            monacowin.once('ready-to-show', () => {
                monacowin.show()
            })
            // monacowin.webContents.openDevTools();
        });
    } else {
        // if (srcid) {
        monacowin.webContents.send("openCodeByLabel", label);
        // }
        monacowin.show();
    }
    startCcls();
}

module.exports = MonacoConnection;