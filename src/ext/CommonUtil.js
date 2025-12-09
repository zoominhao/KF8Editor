function Path2Valid(path) {
    return path ? path.replace(/\\/g, '/') : path;
}

function GetURLParams(url) {
    if (url.indexOf(":") === -1) {
        url = "http://www.xx.com/" + url;
    }
    return (new URL(url)).searchParams;
}

function ParseBlkPath(blkpath, outInfo, subpathInfo) {
    if (blkpath.indexOf("?") !== -1) {
        let srcblkpath = blkpath;
        blkpath = blkpath.split("?")[0];
        let search_params = GetURLParams(srcblkpath);

        if (outInfo) {
            outInfo.hostname = search_params.get('hostname');
            outInfo.id = parseInt(search_params.get('id'));
            outInfo.remotedebug = (search_params.get('remotedebug') === "1");
            outInfo.path = blkpath;
        }

        if (subpathInfo) {
            let stateid = search_params.get('StateId');
            let nodename = search_params.get('NodeName');
            let fieldpath = search_params.get('FieldPath');
            if (stateid) {
                subpathInfo.StateId = parseInt(stateid);
                subpathInfo.LayerId = parseInt(search_params.get('LayerId'));
                subpathInfo.FrameId = parseInt(search_params.get('FrameId'));
                subpathInfo.ScriptId = parseInt(search_params.get('ScriptId'));
                subpathInfo.FieldPath = search_params.get('FieldPath');
            } else if (nodename) {
                subpathInfo.NodeName = nodename;
                if (search_params.has('ScriptId')) {
                    subpathInfo.ScriptId = parseInt(search_params.get('ScriptId'));
                    subpathInfo.FieldPath = search_params.get('FieldPath');
                }
            } else if (fieldpath) {
                subpathInfo.FieldPath = fieldpath;
            }
        }
    }

    return blkpath;
}

function PathtoMenu(paths, menuui, clickfunc) {
    let tochildhtml = function (pathobj, parentitem, icon) {
        menuui.menu('appendItem', {
            parent: parentitem,
            text: pathobj.text,
            id: pathobj.id,
            iconCls: icon ? icon : 'icon-add',
            onclick: function (item) {
                if (clickfunc) {
                    clickfunc(pathobj.asseturl);
                }
            }
        });
    }

    let toparenthtml = function (pathobj, parentitem) {
        for (let i = 0; i < pathobj.children.length; i++) {
            let pi = pathobj.children[i];
            tochildhtml(pi, parentitem, pi.children ? "icon-remove" : null);
            if (pi.children) {
                toparenthtml(pi, menuui.menu("findItem", {id: pi.id}).target);
            }
        }
    }

    let root = {children: paths};
    toparenthtml(root, null);
}

function OnFileSelected(e, ed, dataid, domui) {
    let menuui = $("#fileslibmenu");
    menuui.empty();
    ///此处用全局是权宜之计
    PathtoMenu(_global.editor.context.blkfilespath, menuui, function (asseturl) {
        domui.value = asseturl;
        domui.focus();
    });
    menuui.menu('show', {
        left: e.pageX,
        top: e.pageY
    });
}

function Alert(title, msg, icon, fn) {
    $.messager.alert(title,
        '<div style="width:100%;word-wrap:break-word">' + msg + "</div>",
        icon,
        fn);
}

function Prompt(title, msg, icon, okFunc, cancelFunc, defval) {
    $.messager.prompt({
        title: title,
        msg: '<div style="width:200px;word-wrap:break-word;">' + msg + "</div>",
        fn: function (r) {
            if (r) {
                if (okFunc)
                    okFunc(r);
            } else {
                if (cancelFunc)
                    cancelFunc(r);
            }
        }
    });
    if (defval) {
        $(".messager-input").val(defval);
    }
}

function Msg(msg, time, title, width=800, height=100) {
    $.messager.show({
        title: title ? title : "提示",
        msg: msg,
        showType: 'slide',
        width: width, height: height,
        timeout: time ? time * 1000 : 2000,
        style: {
            right: '',
            top: '',
            bottom: -document.body.scrollTop - document.documentElement.scrollTop
        }
    });
}

function Nt(msg, fn) {
    Alert("提示", msg, null, fn);
}

function Confirm(title, msg, yesfunc, nofunc) {
    $.messager.confirm(title, msg, function (c){
        if(c && yesfunc) {
            yesfunc();
        } else if (!c && nofunc) {
            nofunc();
        }
    });
}

///CANVAS 获取坐标
function CVEventPosition(ev) {
    let x, y;
    if (ev.layerX || ev.layerX === 0) {
        x = ev.layerX;
        y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX === 0) { // Opera
        x = ev.offsetX;
        y = ev.offsetY;
    }
    return {x: x, y: y};
}

function GetGlobalKFByteArray() {
    if (!_global.defaultkfbytearray) {
        _global.defaultkfbytearray = new KFByteArray(null, 4*1024*1024);
    }
    return _global.defaultkfbytearray;
}

// 动态属性编解码
function VarsInit(obj) {
    obj.read = function (bytesarr) {
        if(this.value == null) this.value = [];
        let varsize = bytesarr.readvaruint();
        while (varsize > 0) {
            let name = bytesarr.readstring();
            let data = KFDJson.read_value(bytesarr);
            this.value.push({name:new KFDName(name), value:data});
            varsize -= 1;
        }
    };

    obj.write = function (bytesarr) {
        if(this.value) {
            let arr = this.value;
            bytesarr.writevaruint(arr.length);
            for(let itm of arr){
                bytesarr.writestring(itm.name ? itm.name.toString() : "");
                KFDJson.write_value(bytesarr, itm.value);
            }
        } else {
            bytesarr.writevaruint(0);
        }
    };
}

function Savefilelist(fileinfos, endfunc) {
    if (fileinfos && fileinfos.length > 0) {
        let writeinfo = fileinfos.shift();
        let kfbytearr = GetGlobalKFByteArray();
        kfbytearr.SetPosition(0);
        kfbytearr.length = 0;

        if (typeof (writeinfo.data) == 'string') {
            kfbytearr.writestring(writeinfo.data);
        } else if (writeinfo.data instanceof KFByteArray) {
            kfbytearr = writeinfo.data;
        } else {
            KFDJson.write_value(kfbytearr, writeinfo.data);
        }

        IKFFileIO_Type.instance.asyncSaveFile(writeinfo.path, new Uint8Array(kfbytearr.buffer),
            function (ret) {
                if (ret) {
                    Savefilelist(fileinfos, endfunc);
                } else if (endfunc) {
                    endfunc(false, writeinfo.path);
                }
            },
            function (err) {
                let errmsg = '文件: ' + writeinfo.path + '\n' + err.message + '\n' + err.stack;
                console.error('保存错误', errmsg);
                Alert('保存错误', errmsg.replaceAll('\n', '</br>'));
                if (endfunc) {
                    endfunc(false, writeinfo.path);
                }
            }
        );
    } else if (endfunc) {
        endfunc(true);
    }
}

function includejs(jsall) {
    for (let key in jsall) {
        window[key] = jsall[key];
    }
}

function loadandincludejs(jspaths, Complete) {
    if (!jspaths || !jspaths.length) {
        Complete(false);
        return;
    }
    requirejs(jspaths, function () {
        for (let i = 0; i < arguments.length; i++) {
            includejs(arguments[i]);
        }
        Complete(true);
    });
}

function loadjspackage(packagepaths, basepath, Complete, waitpackages, pathlist) {
    if (!packagepaths || !packagepaths.length || !__fileiteration) {
        Complete([]);
        return;
    }

    pathlist = pathlist ? pathlist : [];
    waitpackages = waitpackages ? waitpackages : [];

    for (let i = 0; i < packagepaths.length; i++) {
        let path = basepath + packagepaths[i];
        waitpackages.push(path);
    }

    ///兼容打包后的程序运行的逻辑
    let headpath = "";
    let apppath = GetAppPath();
    if (apppath && apppath.indexOf("resources") !== -1) {
        headpath = "resources/app/";
        if (apppath.indexOf("app.asar") !== -1) {
            headpath = "resources/";
        }
        for (let i = 0; i < waitpackages.length; i++) {
            waitpackages[i] = headpath + waitpackages[i];
        }
    }

    for (let i = 0; i < waitpackages.length; i++) {
        let path = waitpackages[i];

        __fileiteration(path, function (ok, filepath, isdir) {
                if (ok) {
                    if (!isdir) {
                        if (filepath.endsWith(".js")) {
                            filepath = filepath.replace(/\\/g, "/");
                            let loadjspath = filepath.replace(".js", "");
                            if (headpath) {
                                loadjspath = loadjspath.replace(headpath, "");
                            }
                            pathlist.push(loadjspath);
                        }
                    }
                } else {
                    console.error("{0}文件访问失败", filepath);
                }
            },
            true,
            function (loadedpath) {
                let index = waitpackages.indexOf(loadedpath);
                if (index !== -1) waitpackages.splice(index, 1);
                if (waitpackages.length === 0) {
                    Complete(pathlist);
                }
            }
        );
    }
}

window.onerror = function (message, source, lineno, colno, error) {
    if (message && error && message.indexOf(error.toString()) !== -1) {
        Alert("程序错误", source + "[" + lineno + ":" + colno + "]:<br/>" + error);
    } else {
        Alert("程序错误", source + "[" + lineno + ":" + colno + "]:<br/>" + error + "[" + message + "]");
    }
}
