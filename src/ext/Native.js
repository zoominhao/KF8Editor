const apifs = nodeRequire('fs');
const apipath = nodeRequire('path');
const {ipcRenderer} = nodeRequire('electron');

__Native = {};
// WindowConfig is loaded by Include.js before this file

function KFWriteFile(path, contents, cb) {
    apifs.mkdir(apipath.dirname(path), {recursive: true}, function (err) {
        if (err) return cb(err);
        apifs.writeFile(path, contents, cb);
    });
}

function __fileiteration(filePath, callback, recursive, EndCall) {
    let removefrom = function (arr, str0) {
        let i = arr.indexOf(str0);
        if (i !== -1) {
            arr.splice(i, 1);
        }
        return arr.length === 0;
    };

    //根据文件路径读取文件，返回文件列表
    apifs.readdir(filePath,function(err,files) {
        if(err) {
            console.warn(err);
            ///一个路径读取失败
            if(EndCall) {
                EndCall(filePath);
            }
        } else {
            //遍历读取到的文件
            let filelen = files.length;
            if(filelen === 0) {
                if(EndCall) {
                    EndCall(filePath);
                }
            } else {
                let waitfiles = [];
                for(let i = 0 ; i < filelen ;i ++) {
                    let filename = files[i];
                    //获取当前文件的绝对路径
                    let filedir = apipath.join(filePath,filename);
                    waitfiles.push(filedir);

                    //根据文件路径获取文件信息，返回一个fs.Stats对象
                    apifs.stat(filedir,function(eror,stats) {
                        if(eror) {
                            console.warn('获取文件stats失败');
                            callback(false, filedir, false);

                            if(EndCall && removefrom(waitfiles,filedir)) {
                                EndCall(filePath);
                            }
                        } else {
                            if(stats.isFile()) {
                                callback(true, filedir, false);

                                if(EndCall && removefrom(waitfiles,filedir)) {
                                    EndCall(filePath);
                                }
                            } else if(stats.isDirectory()) {
                                callback(true, filedir, true);

                                if(recursive) {
                                    __fileiteration(filedir,callback,recursive ,function(nextpath) {
                                        if(EndCall && removefrom(waitfiles,filedir)) {
                                            EndCall(filePath);
                                        }
                                    });
                                } else {
                                    if(EndCall && removefrom(waitfiles,filedir)) {
                                        EndCall(filePath);
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }
    });
}

function fileOpenDialog(option) {
    const { dialog } = nodeRequire('@electron/remote');
    return dialog.showOpenDialogSync(option);
}

function OpenFolder(path) {
    const remote = nodeRequire('@electron/remote');
    //const os = require('os')
    remote.shell.openPath(path);
}

function GetwebContentsIDByWinID(id) {
    const { BrowserWindow } = nodeRequire('@electron/remote');
    let wcs =  BrowserWindow.fromId(id);
    return wcs ? wcs.webContents.id : 0;
}

function GetWinByID(id) {
    const { BrowserWindow } = nodeRequire('@electron/remote');
    let wcs =  BrowserWindow.fromId(id);
    return wcs;
}

function OpenDevToolsByID(id) {
    const { BrowserWindow } = nodeRequire('@electron/remote');
    let wcs =  BrowserWindow.fromId(id);
    if(wcs) {
        wcs.webContents.openDevTools();
    }
}

function GetAppPath() {
    const { app } = nodeRequire('@electron/remote');
    return app.getAppPath();
}

function GetPath(name) {
    const { app } = nodeRequire('@electron/remote');
    return app.getPath(name);
}

function OpenBlkInNewWindow(path, apppath, kfdpath, appdatapath) {
    OpenNewWindow(WindowConfig.blkEditor, apppath, kfdpath, appdatapath, {"path": path});
}

function OpenNewWindow(url, apppath, kfdpath, appdatapath, otherqueryparams) {
    const { BrowserWindow } = nodeRequire('@electron/remote');

    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
            ,enableRemoteModule:true
            ,webSecurity : false
            ,contextIsolation:false
        }
    });

    let params = {
        apppath: apppath,
        kfdpath: kfdpath,
        appdatapath: appdatapath,
        id: win.id,
        maincid: _global.mainContentsID
    };

    if (otherqueryparams) {
       for (let k in otherqueryparams) {
           params[k] = otherqueryparams[k];
       }
    }

    win.loadFile(url,{query: params});
}

function fileExists(path){
    let ret = true;
    try {
        apifs.accessSync(path, apifs.constants.R_OK | apifs.constants.W_OK);
    } catch (err) {
        console.warn('access file failed:%s', path);
        ret = false;
    }
    return ret;
}

__Native.Ready = function() {
    IKFFileIO_Type.instance.asyncIteratePaths = function (path, recursive, ffilter, async) {
        __fileiteration(path, function (ok, filepath, isdir) {
                if (ok) {
                    if (!ffilter || ffilter(filepath, isdir)) {
                        async(true, null, filepath);
                    }
                } else {
                    LOG_ERROR("{0}文件访问失败", filepath);
                }
            },
            recursive,
            function () {
                async(true, null, "");
            });
    };

    IKFFileIO_Type.instance.syncLoadFile = function(filePath, options = null) {
        try {
            let data = apifs.readFileSync(filePath, options);
            return data;
        } catch(error) {
            return null;
        }
    }

    IKFFileIO_Type.instance.syncGetFilePaths = function(dir, recursive, suffix, filesList = []) {
        const files = apifs.readdirSync(dir);
        files.forEach((item, index) => {
            let fullPath = apipath.join(dir, item);
            const stat = apifs.statSync(fullPath);
            if (stat.isDirectory()) {      
                if(recursive) {
                    this.syncGetFilePaths(fullPath, recursive, suffix, filesList);  //递归读取文件
                }
            } else {         
                if(suffix)  {
                    if(fullPath.substring(fullPath.length - suffix.length, fullPath.length) === suffix)
                        filesList.push(fullPath);
                } else {
                    filesList.push(fullPath); 
                }               
            }
        });
        return filesList;
    }

    IKFFileIO_Type.instance.asyncGetFilePaths = function (pathlist, path, recursive, pattern, async) {
        __fileiteration(path,function(ok,filepath,isdir) {
                if(ok) {
                    if(!isdir) {
                        if(!pattern || filepath.endsWith(pattern)) {
                            filepath = filepath.replace(/\\/g,"/");
                            pathlist.push(filepath);
                            async(true,null,filepath);
                        }
                    }
                } else {
                    LOG_ERROR("{0}文件访问失败",filepath);
                }
            },
            recursive,
            function() {
                async(true,null,"");
            });
    };

    IKFFileIO_Type.instance.asyncSaveFile = function (path, bytesArr, async, async_err) {
        KFWriteFile(path, bytesArr, (err) => {
            if (err) {
                if (async_err) {
                    async_err(err);
                    return;
                } else {
                    throw err;
                }
            }
            if(async) {
                async(true);
            }
        });
    };

    IKFFileIO_Type.instance.asyncCreateDir = function (paths, async) {
        if(typeof(paths) == "string"){
            paths = [paths];
        }

        let mkfunction = function(paths) {
            if(paths.length > 0) {
                let path = paths.shift();
                apifs.mkdir(path, {recursive: true}, (err) => {
                    if (err) throw err;
                    mkfunction(paths);
                });
            } else if(async){
                async(true);
            }
        }
        mkfunction(paths);
        return true;
    };

    IKFFileIO_Type.instance.asyncCopyFiles = function (files,fromdir,todir,async) {
        let copyfunction = function(files) {
            if(files.length > 0) {
                let file = files.shift();
                apifs.copyFile(fromdir + "/" + file, todir + "/" + file, (err) => {
                    if (err) throw err;
                    copyfunction(files);
                });
            }else if(async){
                async(true);
            }
        };

        copyfunction(files);
    };
};


///////////////////////////////////
///运行与调试的逻辑代码
///////////////////////////////////
__Native.AppRun = function (global) {
    ///起动WEB服务器
    ipcRenderer.send("starthttp", global.webrootpath);
    ///通知主线程
    let info = {
        kfdpath: _global.kfdpath,
        appdatapath: _global.appdatapath,
        apppath: _global.apppath
    };
    ipcRenderer.send("apprun", info);
}

__Native.ExecuteScript = function (arg) {
    ipcRenderer.send("ExecuteScript", arg);
}

__Native.DebugRun = function(webrootpath, appdatapath, indexpath){
    let fullpath = "http://localhost:9527/" + indexpath;
    ipcRenderer.send("debugrun", webrootpath, fullpath, appdatapath);
}

__Native.Reload = function () {
    ipcRenderer.send("reload");
}

ipcRenderer.on('ondebugrun', (event, arg) => {
    console.log(arg) // prints "pong"
});

function NativeInitGlobal(global) {
    ipcRenderer.on('GlobalEvent',(event, evttype, arg) => {
        global.Event.emit(evttype, arg);
    });

    ipcRenderer.on('MainMsg', (event, arg) => {
        Msg(arg.msg, arg.time, arg.title);
    })

    global.EmitToGlobal = function (evttype, arg) {
        ipcRenderer.send('GlobalEvent', evttype, arg);
    }

    global.EmitToMainGlobal = function (evttype, arg) {
        if(global.currentContentsID === global.mainContentsID) {
            global.Event.emit(evttype, arg);
        } else {
            ipcRenderer.sendTo(global.mainContentsID, "GlobalEvent", evttype, arg);
        }
    }

    global.EmitToContentsID = function (contentsID, evttype, arg) {
        ipcRenderer.sendTo(contentsID, "GlobalEvent", evttype, arg);
    }
}


///////////////////////////////////
///外部编辑
///////////////////////////////////

__Native.OpenCode = function (label) {
    ipcRenderer.send("monaco", label);
}
