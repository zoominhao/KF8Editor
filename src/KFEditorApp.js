///定义blk的创建窗口类
function NewblkWin() {
    this.Init();
}

NewblkWin.prototype.Start = function (context) {
    this.context = context;
    let self = this;

    let FillList = function (update) {
        let blkkfds = self.context.GetAllBlkKFDs();

        if (update) {
            //self.blktypesel.combobox('setValues', blkkfds);
            self.blktypesel.combobox('loadData', blkkfds);
        } else {
            self.blktypesel.combobox({
                valueField: 'label',
                textField: 'label0',
                data: blkkfds
            });
        }
    };

    FillList();

    this.context.Event.on("onKFDUpdate", function () {
        FillList(true);
    });
}

NewblkWin.prototype.Init = function () {
    this.winobj = $("#blknewwin");
    this.blknewname = $("#blknewname");
    this.blktypesel = $("#blktypesel");
    this.blksavepath = $("#blksavepath");
    this.blknewok = $("#blknewok");
    this.blknewno = $("#blknewno");

    let win = this;

    this.blknewok.bind('click', function () {
        if (win.CreateBlk()) {
            win.Close();
        }
    });

    this.blknewno.bind('click', function () {
        win.Close();
    });
}

NewblkWin.prototype.Open = function (path) {
    this.blksavepath.textbox("setValue", path ? path : "");
    this.winobj.window('open').window("center");
}

NewblkWin.prototype.Close = function () {
    this.winobj.window('close');
}

NewblkWin.prototype.CreateBlk = function () {
    let blkname = this.blknewname.textbox("getValue");
    let blktype = this.blktypesel.combobox('getValue');
    let blkpath = this.blksavepath.textbox("getValue");

    if (!blkname || !blktype) {
        Alert('Warning', "数据不能为空...");
        return false;
    }

    this.blknewname.textbox("setValue", "");
    this.context.CreateBlk(blkname, blktype, blkpath);

    return true;
}

//定义一个弹出输入的TEXT
function NewTextWin() {
    this.Init();
}

NewTextWin.prototype.Init = function () {
    this.value = "";
    this.callback = null;
    this.winobj = $("#textnewwin");
    this.textnewval = $("#textnewval");
    this.textnewname = $("#textnewname");
    this.blknewok = $("#textnewok");
    this.blknewno = $("#textnewno");

    let win = this;

    this.blknewok.bind('click', function () {
        let newname = win.textnewname.textbox("getValue");
        if (!newname) {
            Alert('Warning', "数据不能为空...");
            return false;
        }

        if (win.callback != null) {
            win.callback(newname, win.value);
        }

        win.Close();
    });

    this.blknewno.bind('click', function () {
        win.Close();
    });
}

NewTextWin.prototype.Open = function (path, callback) {
    this.value = path;
    this.callback = callback;
    this.textnewval.textbox("setValue", path ? path : "");
    //this.textnewname.textbox("setValue",path?path:"");
    this.winobj.window('open').window("center");
}

NewTextWin.prototype.Close = function () {
    this.winobj.window('close');
}

///定义一个Editor
function KFEditorApp() {
    this.Init();
}

KFEditorApp.prototype.Init = function () {
    this.menucreateblk = $("#menucreateblk");
    this.menusaveblk = $("#menusaveblk");
    this.menuimport = $("#menuimport");
    this.menudebugrun = $("#debugrun");
    this.apphtmls = $("#apphtmls");
    this.setting = $("#setting");
    this.undo = $("#undo");
    this.redo = $("#redo");
    this.searchUI = $('#search');
    this.netObjSelector = new NetObjSelector();
    this.edaction = new KFEditorAction(this);
    this.newblkwin = new NewblkWin();
    this.newtxtwin = new NewTextWin();
    this.blklib = new BlkLibrary($("#blklibui"));
    this.blkattrib = new KFDEditor($("#blkattrib"));
    this.kfTimeTool = new KFTimeTool();

    let editor = this;
    this.menucreateblk.click(function () {
        editor.newblkwin.Open();
    });

    $("#rebuildrefs").click(function () {
        __Native.ExecuteScript({path: "src/ext/script/RebuildRefs.js", params: [_global.appdatapath]});
        Alert("操作", "资源依赖刷新完成");
    });

    $("#exportKFD").click(function () {
        ///获取KFD路径
        let ExportKFDDir = _global.kfdpath.replace("/KFD","/Config/");
        let ConfigPath = ExportKFDDir + "Kungfu.json";
        let AppPath = "";
        let PyExePath = AppPath + "tool\\Python39\\python.exe";
        let PyPath = "{AppPath}\\tool\\KFDataTool\\Py\\KFDataTool.py";

        if (fileExists(ConfigPath)) {
            $.messager.progress({title: "KFD生成中..."});
            $.messager.progress('bar').progressbar({
                text: '请等待...'
            });
            _global.Event.once("KFDExportEnd", function (arg) {
                try { $.messager.progress('close'); } catch (e) {}
                if (!arg) return;
                if (arg.error) {
                    Nt(arg.error);
                    console.error(arg.error);
                } else {
                    Msg('KFD导出成功!' , 2, "消息");
                }
            });
            __Native.ExecuteScript({path: PyExePath, cwd: ExportKFDDir, exec: true, params: [PyPath, ConfigPath], GlobalEvent: "KFDExportEnd"});
        } else {
            Alert("错误", ConfigPath + " 文件不存在?");
        }
    });

    this.regulationfunc = function () {
        KFDEditTool.Regulation(editor);
    };

    this.savefunc = function (isAll = true) {
        if (editor.blkdata) {
            if(isAll) {
                editor.context.SaveBlk(editor.blkdata, true);
            } else {
                editor.context.SaveBlk(editor.blkdata, false);
            }
        } else {
            Nt("没有打开任何文件");
        }
    };

    this.searchfunc = function () {
        KFDEditTool.Search(editor);
    }

    this.clickSaveFunc = function (evt) {
        editor.context.SaveBlk(editor.blkdata, true);
    }
    this.menusaveblk.click(this.clickSaveFunc);
    
    let KeyEventHandler = function (event) {
        let handled;
        if (event.key !== undefined) {
            handled = event.key;
            // 使用KeyboardEvent.key处理事件，并将handled设置为true。
        }
        if (handled) {
            // 如果事件已处理，则禁止“双重操作”
            if (event.ctrlKey && handled === "s") {
                event.preventDefault();
                editor.savefunc(false);
            } else if (event.altKey && (handled === "s" || handled === "S")) {
                event.preventDefault();
                editor.savefunc(true);
            } else if (event.ctrlKey && handled === "r") {
                event.preventDefault();
                editor.regulationfunc();
            } else if (event.ctrlKey && handled === "f") {
                event.preventDefault();
                editor.searchfunc();
            } else if (handled === "Enter") {
                event.preventDefault();
                let activeEle = document.activeElement;
                if (activeEle)
                    activeEle.blur();
            }
        }
    };

    _global.Event.on("OnPreviewKeyDown", KeyEventHandler);
    window.addEventListener("keydown", KeyEventHandler);

    this.menuimport.click(function () {
        (new AnimationCCImport(editor.context)).Import();
    });

    ///收集目录下所有的.html

    this.menudebugrun.click(function () {
        var htmlpath = editor.apphtmls.combobox("getValue");
        if (!htmlpath) {
            Nt("选择调试的对象html");
            return;
        }

        var webrootpath = _global.webrootpath;
        htmlpath = "Html/" + htmlpath;
        __Native.DebugRun(webrootpath, "a/b/xxx.asset", htmlpath);
    });

    this.apphtmls.combobox({
        loader: function (param, success, error) {
            var htmlfiles = [];
            IKFFileIO_Type.instance.asyncGetFilePaths(htmlfiles, _global.apppath, true, ".html",
                function (succ, data, path) {
                    if (succ && path === "") {
                        var items = [];
                        var reppath = _global.apppath + "/";

                        for (var i = 0; i < htmlfiles.length; i++) {
                            var filepath = htmlfiles[i];
                            var htmlpath = filepath.replace(reppath, "");
                            items.push({label: htmlpath, value: htmlpath});
                        }

                        success(items);
                    }
                }
            );

            return true;
        }
    });

    this.setting.click(function () {
        SettingWorkSpace(true)
    });
    this.undo.click(function () {
        editor.edaction.UndoAction();
    });
    this.redo.click(function () {
        editor.edaction.RedoAction();
    });
    this.searchUI.click(function () {
        OpenNewWindow(WindowConfig.search, _global.apppath, _global.kfdpath, _global.appdatapath);
    });

    _global.Event.on("OnBlkOpen", function (data) {
        if (data.value) {//区分是NetObj还是本地Blk
            let hostname = data.value._netObjMgr?.hostname;
            if (hostname === 'UE4Editor') {
                if (editor.levelCtrl === undefined)
                    editor.levelCtrl = new LevelControl(this, this.context.kfdtable);
                if (editor.levelCtrl.OpenSomeNode(data))
                    return;
            }
        }
        
        editor.EditorOpen(data);
    }, this);
    _global.Event.on("OnBlkOpenNew", function (data) {
        let blkpath = data.path;
        OpenBlkInNewWindow(blkpath, _global.apppath, _global.kfdpath, _global.appdatapath);
    });

    _global.Event.on("onDataRestore", this.OnDataRestore.bind(this));

    this.StateLabel('<a  style="color:hsl(0,100%,50%);">当前没有编辑文件</a>');


    var ChangeAttribPanel = function () {
        let tab = $('#tt').tabs('getSelected');
        let title = tab.panel('options').title;

        if (title === '时间图') {
            _global.curEditIndex = 2;
            $("#attribspanel").tabs("select", "时间图属性");
        } else if (title === '流程图') {
            _global.curEditIndex = 1;
            $("#attribspanel").tabs("select", "流程图属性");
        }
    }

    //侦听选中事件
    $("#tt").tabs({
        onSelect: function (title) {
            _global.curEditIndex = 0;
            if (title === '时间图') {
                //解决不在选中的状态时，HEADTEXT的刷新会失效的问题...
                if (_global.timeline)
                    _global.timeline._redrawAllLayers();

                ChangeAttribPanel();
                _global.Event.emit("OnSwitchToTimeline");
            } else {
                if (_global.timeline)
                    _global.timeline.HideTab();

                if (title === '流程图') {
                    ChangeAttribPanel();
                    _global.Event.emit("OnSwitchToGraph");
                }
            }
        }
    });

    $("#libtab").tabs({
        onSelect: function (title) {
            if (title === '属性') {
                ChangeAttribPanel();
            }
        }
    });
    this.GenboxWinInit();
}

KFEditorApp.prototype.ImportExcelToDataTable = function (path) {
    (new ExcelToDataTable(this.context)).Import(path);
}

KFEditorApp.prototype.CreateFolder = function (name, path) {
    var self = _global.editor;
    var newdir = path + "/" + name;
    IKFFileIO_Type.instance.asyncCreateDir(newdir, function (ret) {
        if (ret) {
            var filepath = newdir + "/__init__.blk";
            IKFFileIO_Type.instance.asyncSaveFile(filepath, new Uint8Array(), function (ret0) {
                if (ret0) {
                    self.context.UpdateBLKPaths();
                }
            });
        }
    });
}

KFEditorApp.prototype.OpenNewWindow = function (path) {
    if (path.indexOf("hostname=") !== -1) {
        if (this.network) {
            path = path + "&remotedebug=" + (this.network.IsRemoteDebug() ? "1" : "0");
        }
    }
    OpenBlkInNewWindow(path, _global.apppath, _global.kfdpath, _global.appdatapath);
}

KFEditorApp.prototype.OpenFolder = function (path) {
    OpenFolder(path);
}

KFEditorApp.prototype.GenboxWinInit = function () {
    let editor = this
    let allChecked = true
    let onlyFrame = false
    $("#genAll").checkbox({
        onChange: function (checked) {
            allChecked = checked
            if (!allChecked) {
                let statedef = editor.context.kfdtable.get_kfddata("KFBaseMotionID");
                let Dstatedef = KFDPropTool.GetStateDefData(statedef, "KFBaseMotionID");
                let stateSelAry = [];
                if (Dstatedef) {
                    for (var id in Dstatedef) {
                        stateSelAry.push({id: id, text: Dstatedef[id], value: id, children: []})
                    }
                }
                $("#genStateIDs").combotree('tree').tree({data: stateSelAry});
                $("#stateinput").show();
            } else {
                $("#stateinput").hide();
            }
        }
    });
    $("#genFrameOnly").checkbox({
        onChange: function (checked) {
            onlyFrame = checked
            if (!onlyFrame) {
                $("#genExpand").show();
                $("#boneinput").show();
                $("#portioninput").show();
            } else {
                $("#genExpand").hide();
                $("#boneinput").hide();
                $("#portioninput").hide();
            }
        }
    });
    

    $("#boxGenok").bind('click', function () {
        let kvkfd = editor.context.kfdtable.get_kfddata("KFBoxGenParam");
        let kv = {};
        kv.__cls__ = "KFBoxGenParam";
        KFDJson.init_object(kv, kvkfd);
        let xVal = parseInt($("#genExpandX").numberbox("getValue"));
        let yVal = parseInt($("#genExpandY").numberbox("getValue"));
        let zVal = parseInt($("#genExpandZ").numberbox("getValue"));
        kv.all = allChecked;
        kv.extend = {X: xVal, Y: yVal, Z: zVal};
        kv.onlyFrame = onlyFrame;
        if (!kv.all)
        {
            //kv.actionIDs = $("#genStateIDs").textbox("getValue");
            let ids = $("#genStateIDs").combotree('getValues');
            if(ids && ids.length > 0)
            {
                kv.actionIDs = ids[0];
                for (let i = 1; i < ids.length; ++i) 
                {
                    kv.actionIDs = kv.actionIDs + "|" + ids[i];
                }
            }
            /*if (ids) {
                for (let id of ids) {
                    let node = $("#genStateIDs").combotree('tree').tree('find', id);
                    if (node && !node.children) {
                        
                    }
                }
            }*/
        }
        
        if (onlyFrame)
            kv.bones = "";
        else
            kv.bones = $("#genBones").textbox("getValue");

        if (onlyFrame)
            kv.portions = "";
        else
            kv.portions = $("#genPortions").textbox("getValue");
             
        if (kv) {
            _global.Event.emit("OnKFBoxGenParam", kv);
        }
        $("#boxGen").window('close');
    });
    $("#boxGencancel").bind('click', function () {
        $("#boxGen").window('close');
    });
}

KFEditorApp.prototype.OpenGenboxWin = function () {
    $("#boxGen").window('open').window("center");
}

KFEditorApp.prototype.Clear = function () {
    //去掉context的事件侦听 todo
}

KFEditorApp.prototype.StateLabel = function (txt) {
    $("#edstatelabel").html(txt);
}

KFEditorApp.prototype.reflashTabState = function () {
    let ttobj = $("#tt");

    if (this.blkdata == null || this.blkdata.timeline == null) {
        ttobj.tabs("select", 0);
        ttobj.tabs("disableTab", 1);
        ttobj.tabs("disableTab", 2);
    } else {
        ttobj.tabs("enableTab", 1);
        ttobj.tabs("enableTab", 2);
    }
}

KFEditorApp.prototype.EditorOpen = function (data, onCallBack) {
    let editor = this;
    let orgpath = data.path;
    if (orgpath.indexOf("hostname=") !== -1 && this.network) {
        orgpath = orgpath + "&remotedebug=" + (this.network.IsRemoteDebug() ? "1" : "0");
    }
    let remoteinfo = {};
    let blkpath = ParseBlkPath(orgpath, remoteinfo);

    if (blkpath.endsWith(".blk")) {
        this.IsRemoteData = remoteinfo.hostname != null;
        this.context.remoteObject.SetInfo(remoteinfo);
        this.context.LoadBlk(blkpath, function (ret, blkdata, blkpath) {
            if (ret) {
                editor.editNode = data;
                editor.blkdata = blkdata;
                editor.StateLabel("当前编辑:" + orgpath);

                let meta = blkdata.blk;
                let metaclass = meta.type.toString();
                let clsdataname = metaclass + "Data";

                let clsdatakfd = editor.context.kfdtable.get_kfddata(clsdataname);
                if (clsdatakfd) {
                    if (meta.classData == null) {
                        meta.classData = {};
                    }
                    meta.classData.__cls__ = clsdataname;
                }

                editor.blkattrib.buffEditor.OnBeforeEdit(blkpath);
                editor.blkattrib.Edit(meta, editor.blkattrib.CreateMetaEditDef(metaclass));

                let metaobj = meta.data ? meta.data.object : null;
                if (metaobj && metaobj.__cls__ !== metaclass) {
                    metaobj.__cls__ = metaclass;
                }

                if (_global.timeline)
                    _global.timeline.Open(blkdata.timeline, blkdata.asseturl);

                if (_global.graph)
                    _global.graph.Open(blkdata.graph);

                editor.reflashTabState();

                ///editor preview
                _global.ipcpreview.OpenPreview(editor.context, metaclass, blkdata);
            }
            if (onCallBack)
                onCallBack(ret, blkdata, blkpath);
            Msg((ret ? "开始编辑:" : "文件保存失败:") + blkpath, 1);
        });
    }
}

KFEditorApp.prototype.OnDataRestore = function (curData) {
    //blk meta
    this.blkdata = curData;
    let meta = curData.blk;
    let metaclass = meta.type.toString();
    let clsdataname = metaclass + "Data";

    let clsdatakfd = this.context.kfdtable.get_kfddata(clsdataname);
    if (clsdatakfd) {
        if (meta.classData == null) {
            meta.classData = {};
        }
        meta.classData.__cls__ = clsdataname;
    }
    if (_global.curEditIndex === 0) {
        this.blkattrib.Edit(meta, this.blkattrib.CreateMetaEditDef(metaclass));	//TODO：bytes需要存一下，要不对象数据没法撤销
    }

    //graph
    if (_global.graph) {
        _global.graph.Open(curData.graph);
        if (_global.curEditIndex === 1) {
            if (_global.graph.nodecanvas) {
                for (let node of _global.graph.nodecanvas.AllNodes) {
                    if (node.blockdata && node.blockdata.name.toString() === _global.currentGraphNodeName) {
                        _global.graph.OnNodeChange(node);
                        break;
                    }
                }
            }
        }
    }

    //timeline
    if (_global.timeline) {
        _global.timeline.tldata = curData.timeline;
        _global.timeline.currentState = curData.timeline.states[_global.timeline.stateid > -1 ? _global.timeline.stateid : 0];
        if(_global.curEditIndex === 2) {
            _global.timeline._redrawAllLayers();
            _global.timeline.OnFrameChange();
        }
    }
}

KFEditorApp.prototype.OpenRuntimeDataWin = function () {
    if (!this.runtimedatawin) {
        this.runtimedatawin = new KFDEdtWrapWindow($('#kfdRuntimeWin'), this.context.kfdtable);
    }
    let win = this.runtimedatawin;
    if (_global.editor.network && _global.editor.network.rpcobjsonline) {
        let rpcobjsonline = _global.editor.network.rpcobjsonline;
        let retfunc = rpcobjsonline.AsyncAccessRuntimeDataOfContext(function (data) {
            if (data) {
                let inprops = {};
                if (data.__cls__) {
                    inprops = win.KFDEdt.CreateMetaEditDef(data.__cls__).data;
                }
                win.open({title: '远程对象运行时数据', src: data, inprops: inprops});
            }
        });
        win.beforeCloseFunc = retfunc;
    }
}

KFEditorApp.prototype.Start = function (context) {
    this.Clear();

    this.context = context;
    this.newblkwin.Start(context);
    this.blklib.Start(context);
    this.blkattrib.kfdtable = context.kfdtable;

    if (_global.timeline)
        _global.timeline.Start(context);

    if (_global.graph)
        _global.graph.Start(context);

    this.netObjSelector.Start(context);
    this.reflashTabState();
}

KFEditorApp.prototype.IsInGraph = function() {
    let tab = $('#tt').tabs('getSelected');
    let title = tab.panel('options').title;
    return title === '流程图';
}

KFEditorApp.prototype.IsInTimeline = function() {
    let tab = $('#tt').tabs('getSelected');
    let title = tab.panel('options').title;
    return title === '时间图';
}

function ReadyContext() {
    $.messager.progress({title: "环境准备中", msg: "资源加载中..."});
    let context = new EditorContext(_global.apppath, _global.appdatapath, _global.kfdpath);
    context.Event.on("Complete", function () {
        $.messager.progress('close');

        let editor = _global.editor;
        if (editor == null) {
            editor = new KFEditorApp();
            _global.editor = editor;
        }

        editor.Start(context);
        ///通知主线程进入完成
        __Native.AppRun(_global);

        // 网络
        editor.network = new EditorNetworkMgr(context);
        editor.network.Event.on("OnNetworkChangeStart", function() {
            if (editor.levelCtrl) {
                editor.levelCtrl.Dispose();
                editor.levelCtrl = null;
            }

            if (editor.plotCtrl) {
                editor.plotCtrl.Dispose();
                editor.plotCtrl = null;
            }

            if (editor.todCtrl) {
                editor.todCtrl.Dispose();
                editor.todCtrl = null;
            }
        });

        editor.network.Event.on("OnNetworkChangeFinish", function() {
            if (editor.plotCtrl === undefined) {
                editor.plotCtrl = new Plot(editor);
            }
            if (editor.todCtrl === undefined) {
                editor.todCtrl = new TOD(editor, context);
            }
        });

        // 默认连本地服务器
        editor.network.SwitchNetwork(false);

        _global.Event.emit("ContextComplete");
    });

    context.Ready();
}

_global.Event.on("Ready", function () {
    HttpRequest_Type.meta = WebHttpRequest.Meta;
    IKFFileIO_Type.meta = KFHttpFileIO.Meta;
    IKFFileIO_Type.new_default();
    ///绑定一些本地行为
    __Native.Ready();

    ///弹出设置环境
    const current_url = new URL(document.location.toString());
    const search_params = current_url.searchParams;
    _global.mainContentsID = parseInt(search_params.get('maincid'));
    _global.currentContentsID = _global.mainContentsID;

    SettingWorkSpace(false);
});

function SettingWorkSpace(force) {
    if (_global.apppath && _global.apppath !== "" && !force) {
        _global.webrootpath = _global.apppath.replace("/Html", "").replace("\\Html", "");
        ReadyContext();
        return;
    }

    if (!_global.apppath || !_global.kfdpath || !_global.appdatapath ) {
        _global.apppath = "";
        _global.kfdpath = "";
        _global.appdatapath = "";
    }

    $("#contextSetting").window('open').window("center");
    $("#settingapppath").textbox("setValue", _global.apppath);
    $("#settingkfdpath").textbox("setValue", _global.kfdpath);
    $("#settingappdatapath").textbox("setValue", _global.appdatapath);

    $("#settinghistory").combobox({
        valueField: 'apppath',
        textField: 'apppath',
        data: _global.workSpaces
    });

    $("#settinghistory").combobox({onChange:function (newValue, oldValue){
        for(let hist of _global.workSpaces) {
            if(hist.apppath === newValue) {
                $("#settingapppath").textbox("setValue", hist.apppath);
                $("#settingkfdpath").textbox("setValue", hist.kfdpath);
                $("#settingappdatapath").textbox("setValue", hist.appdatapath);
                break;
            }
        }
    }});

    $("#settingapppathSEL").bind('click', function () {
        let defpath = _global.apppath.replace(/\//g, "\\");
        let files = fileOpenDialog({properties: ['openDirectory'], defaultPath: defpath});
        if (files && files[0]) {
            $("#settingapppath").textbox("setValue", files[0]);
        }
    });

    $("#settingkfdpathSEL").bind('click', function () {
        let defpath = _global.kfdpath.replace(/\//g, "\\");
        let files = fileOpenDialog({properties: ['openDirectory'], defaultPath: defpath});
        if (files && files[0]) {
            $("#settingkfdpath").textbox("setValue", files[0]);
        }
    });

    $("#settingappdatapathSEL").bind('click', function () {
        let defpath = _global.appdatapath.replace(/\//g, "\\");
        let files = fileOpenDialog({properties: ['openDirectory'], defaultPath: defpath});
        if (files && files[0]) {
            $("#settingappdatapath").textbox("setValue", files[0]);
        }
    });

    $("#settingok").bind('click', function () {
        let kfdpath = $("#settingkfdpath").textbox("getValue");
        let apppath = $("#settingapppath").textbox("getValue");
        let appdatapath = $("#settingappdatapath").textbox("getValue");

        if (!kfdpath || !apppath) {
            Nt("路径不能为空!");
            return;
        }

        $("#contextSetting").window('close');

        _global.saveconfig(appdatapath, kfdpath, apppath);

        $("#settinghistory").combobox({
            valueField: 'apppath',
            textField: 'apppath',
            data: _global.workSpaces
        });

        ///暂进这样处理吧
        _global.webrootpath = _global.apppath.replace("/Html", "").replace("\\Html", "");

        __Native.Reload();
        ///ReadyContext();
    });

    $("#settingcancel").bind('click', function () {
        if (_global.editor.context == null) {
            Nt("请设置好路径!");
            return;
        }
        $("#contextSetting").window('close');
    });
}

ipcRenderer.on("globalconfig", (event) => {
    let config = null;
    if (_global) {
        config = {
            apppath: _global.apppath,
            kfdpath: _global.kfdpath,
            appdatapath: _global.appdatapath
        }
    }
    ipcRenderer.send("globalconfig", config);
});

// Use CommonInit for module loading
CommonInit.initKFModules(function() {
    _global.Event.emit("Ready");
});

