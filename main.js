const {app, BrowserWindow, Menu, MenuItem} = require('electron');
const {fork, execFile} = require('child_process');
const {ipcMain, nativeTheme} = require('electron');
const EditorNetWork = require('./mainprocess/EditorNetWork');
const MonacoConnection = require('./mainprocess/MonacoConnection');
const EditorFileWatcher = require('./mainprocess/EditorFileWatcher');

nativeTheme.themeSource = 'dark';
require('@electron/remote/main').initialize();
const mainvars = {};
app.allowRendererProcessReuse = true;

global.sharedObject = {
    clipboard: null
};

function initApplication() {
    console.log("initialize application");
    createWindow();
}

// 如果窗口创建比较慢，考虑窗口池化
function createWindow() {
    console.log("start createWindow...");
    // 创建浏览器窗口
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            webSecurity: false,
            contextIsolation: false
        }
    });

    // 并且为你的应用加载index.html
    let params = { "maincid": win.webContents.id };
    win.loadFile('index.html', {query: params});
    win.on("closed", () => {
        console.log("window closed");
        app.quit();
    });
    mainvars.mainwin = win;

    const template = [{
            label: '帮助',
            submenu: [{
                label: '调试界面',
                click() {
                    win.webContents.openDevTools();
                }
            }, {
                label: '刷新页面',
                click() {
                    win.webContents.reload();
                }
            }, {
                label: '网络调试',
                click() {
                    win.webContents.send("OpenNetDebugWindow");
                }
            }, {
                label: '代码编辑',
                click() {
                    if (monaco) monaco.NewMonacoEditor();
                }
            }]
        }];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    console.log("createWindow OK");
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(initApplication)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    //if (process.platform !== 'darwin')
    {
        console.log("all window closed, application quit");
        app.quit()
    }
})

app.on('before-quit', () => {
    console.log("application quiting...");
});

app.on('activate', () => {
    console.log("activate application");
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
});

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

mainvars.SendGlobalEvent = function (etype, arg) {
    let BrowserWindows = BrowserWindow.getAllWindows();
    for (let win of BrowserWindows) {
        win.webContents.send('GlobalEvent', etype, arg);
    }
}

///GLOBAL EVENT
ipcMain.on('GlobalEvent', (event, etype, arg) => {
    mainvars.SendGlobalEvent(etype, arg);
});

let net = new EditorNetWork(mainvars);
let monaco = new MonacoConnection(mainvars);
let filewatcher = new EditorFileWatcher(mainvars);

ipcMain.on("apprun", (event, arg) => {
    console.log("application run, arg:%s", JSON.stringify(arg));
    filewatcher.Listen(arg);
});

ipcMain.on("reload", (event, args) => {
    console.log("application reload, args:", JSON.stringify(args));
    mainvars.mainwin.webContents.reload();
});

ipcMain.on("ExecuteScript", (event, arg) => {
    if (arg && arg.path) {
        let scriptpath = arg.path;

        let apppath = app.getAppPath();
        if (apppath.indexOf("/app.asar") !== -1 || apppath.indexOf("\\app.asar") !== -1) {
            apppath = apppath.replace("/app.asar", "").replace("\\app.asar", "");
        }
        if ((scriptpath.indexOf(":/") === -1 && scriptpath.indexOf(":\\") === -1)) {
            scriptpath = apppath + "\\" + arg.path;
        }
        console.log("scriptpath=", scriptpath);

        ///替换路径
        if (arg.params) {
            for (let key in arg.params) {
                let paramsstr = arg.params[key];
                arg.params[key] = paramsstr.replace(/\{AppPath\}/g, apppath);
            }
        }

        if (arg.exec) {
            let exeprocess = execFile(scriptpath, arg.params, { cwd: arg.cwd }, function (error, stdout, stderr) {
                let msg = stdout;
                if (error != null) {
                    console.log("执行错误:", error);
                    msg = error;
                } else {
                    console.log("执行成功:", stdout);
                }

                if (arg.GlobalEvent) {
                    // 不向主窗口发，应该从哪来回哪去
                    event.reply('GlobalEvent', arg.GlobalEvent, {
                        error: error,
                        msg: stdout
                    });
                } else {
                    mainvars.mainwin.webContents.send("MainMsg",
                        {msg: msg, time: 1, title: error ? "执行失败" : "执行成功"}
                    );
                }
            });
            exeprocess.stdout.on('data', function (chunk) {
                let textChunk = chunk.toString('utf8');// buffer to string
                console.log(textChunk.trim());
            });

            mainvars.mainwin.webContents.send("MainMsg", {msg: "开始执行", time: 0.1, title: "提示"});
        } else {
            /// 在编译脚本的时候尝试了使用FORK测试失败
            fork(scriptpath, arg.params);
        }
    }
});

// In this file you can include the rest of your app's specific main process
// code. 也可以拆分成几个文件，然后用 require 导入。