const {ipcMain,BrowserWindow,app} = require('electron');
const { fork } = require('child_process')

function EditorNetWork(mainvars) {
    ///AUTO START HTTPSERVER
    ipcMain.on('starthttp',(event,arg)=> {
        let apppath = app.getAppPath();
        ///启动一个WEB服务器
        if(mainvars.httpserver == null) {
            mainvars.httpserver = fork(apppath + `/tool/webserver/httpserver.js`, [9527, arg]);
        }

        var spawn = require("child_process").spawn;
        if(!mainvars.middleserver) {
            mainvars.middleserver = true;
            let python_cmd = apppath + '/tool/Python39/python.exe';
            let process = spawn(python_cmd, [apppath + "/tool/KFMiddleServer/MiddleStart.py","-ws=true"]);
            console.log('start midddle server');
            process.stdout.on('data', function (chunk) {
                let textChunk = chunk.toString('utf8');// buffer to string
                console.log(textChunk.trim());
            });
        }
    });

    /// RUN DEBUG WINDOW
    ipcMain.on('debugrun', (event, arg, indexpath, appdatapath) => {
        StopRun();
        if(mainvars.httpserver == null) {
            console.error("WEB服务器没有启动");
            return;
        }

        console.log("arg = " + arg + "," + indexpath);
        StartRun(indexpath, appdatapath);
        event.reply('ondebugrun', 'pong');
    });

    function StartRun(indexpath, appdatapath) {
        var runWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {nativeWindowOpen: true}});

        runWindow.on('closed', () => {
            if(mainvars.runwindow) {
                mainvars.runwindow = null;
                StopRun();
            }
        });

        runWindow.loadURL(indexpath + "?appdata=" + appdatapath);
        runWindow.webContents.openDevTools({ mode: 'detach' });
        mainvars.runwindow = runWindow;
    }

    function StopRun() {
        if(mainvars.runwindow) {
            mainvars.runwindow.close();
            mainvars.runwindow = null;
        }

        /* 不去关闭WEB SERVER吧
        if(mainvars.httpserver) {
            ///close
            mainvars.httpserver.kill(2);
            mainvars.httpserver = null;
        }
        */
    }
}

module.exports = EditorNetWork;