///定义一个Editor
function KFNewWindow() {
    this.Init();
}

KFNewWindow.prototype.Init = function () {
    this.blkattrib = new KFDEditor($("#blkattrib"))

    let editor = this;
    this.netObjSelector = new NetObjSelector();
    this.edaction = new KFEditorAction(this);
    this.regulationfunc = function () {
        KFDEditTool.Regulation(editor);
    };

    this.savefunc = function (isAll = true) {
        if (editor.blkdata) {
            if (isAll) {
                //editor.context.SaveLayer(editor.blkdata, 2); //额外保存一下audio layer
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
    $('#newsaveblk').click(this.clickSaveFunc);

    $('#opendevpanel').click(function () {
        OpenDevToolsByID(_global.windowID);
    });

    $('#undo').click(function () {
        editor.edaction.UndoAction();
    });
    $('#redo').click(function () {
        editor.edaction.RedoAction();
    });

    _global.Event.on("onDataRestore", this.OnDataRestore.bind(this));

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
    window.addEventListener("keydown"
        , KeyEventHandler);

    _global.Event.on("OnBlkOpen", this.EditorOpen, this);
    _global.Event.on("OnBlkOpenNew", function (data) {
        let blkpath = data.path;
        OpenBlkInNewWindow(blkpath, _global.apppath, _global.kfdpath, _global.appdatapath);
    });

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

            //if(_global.graph)
            //    _global.graph.Open(editor.blkdata.graph);
        }
    });
}

KFNewWindow.prototype.Clear = function () {

}

KFNewWindow.prototype.reflashTabState = function () {
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

KFNewWindow.prototype.switchTab = function (tab) {
    let ttobj = $("#tt");

    let index = 0;
    if (tab === "Graph") {
        index = 1;
    } else if (tab === "Timeline") {
        index = 2;
    }
    ttobj.tabs("select", index);
}

KFNewWindow.prototype.openSubpath = function (subpathinfo) {
    if (subpathinfo.hasOwnProperty('StateId') ||
        (subpathinfo.FieldPath && subpathinfo.FieldPath.indexOf('__timeline__') !== -1)) {
        _global.autotimelinesubpath = subpathinfo;
        this.switchTab("Timeline");
    } else if (subpathinfo.hasOwnProperty('NodeName') ||
        (subpathinfo.FieldPath && subpathinfo.FieldPath.indexOf('__graph__') !== -1)) {
        _global.autographsubpath = subpathinfo;
        this.switchTab("Graph");
    }
}

KFNewWindow.prototype.EditorOpen = function (data) {
    let editor = this;
    let blkpath = data.path;
    let remoteinfo = {};
    let subpathinfo = {};
    blkpath = ParseBlkPath(blkpath, remoteinfo, subpathinfo);

    if (blkpath.endsWith(".blk")) {
        this.context.remoteObject.SetInfo(remoteinfo);
        this.context.LoadBlk(blkpath, function (ret, blkdata, blkpath) {
            if (ret) {
                editor.blkdata = blkdata;

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

                editor.blkattrib.Edit(meta, editor.blkattrib.CreateMetaEditDef(metaclass));
                if (subpathinfo.FieldPath && subpathinfo.FieldPath.indexOf('__meta__') !== -1) {
                    editor.blkattrib.SelectFieldPath(subpathinfo.FieldPath.replace('__meta__.', ''));
                }

                let metaobj = meta.data ? meta.data.object : null;
                if (metaobj && metaobj.__cls__ !== metaclass) {
                    metaobj.__cls__ = metaclass;
                }

                if (_global.timeline)
                    _global.timeline.Open(blkdata.timeline);

                if (_global.graph)
                    _global.graph.Open(blkdata.graph);

                editor.reflashTabState();

                editor.openSubpath(subpathinfo);


                ///editor preview
                _global.ipcpreview.OpenPreview(editor.context, metaclass, blkdata);
            }

            Msg((ret ? "开始编辑:" : "文件保存失败:") + blkpath, 1);
        });
    }
}

KFNewWindow.prototype.OnDataRestore = function (curData) {
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
        if (_global.curEditIndex === 2) {
            _global.timeline._redrawAllLayers();
            _global.timeline.OnFrameChange();
        }
    }
}

KFNewWindow.prototype.Start = function (context) {
    this.Clear();

    this.context = context;
    this.blkattrib.kfdtable = context.kfdtable;

    if (_global.timeline)
        _global.timeline.Start(context);

    if (_global.graph)
        _global.graph.Start(context);

    this.netObjSelector.Start(context);

    //创建后不自动打开
    //_global.Event.on("OnBlkCreated", this.EditorOpen, this);
    //this.reflashTabState();

    _global.Event.emit("OnBlkOpen", {path: _global.editblkpath, asseturl: _global.asseturl});
}

KFNewWindow.prototype.IsInGraph = function () {
    let tab = $('#tt').tabs('getSelected');
    let title = tab.panel('options').title;
    return title === '流程图';
}

KFNewWindow.prototype.IsInTimeline = function () {
    let tab = $('#tt').tabs('getSelected');
    let title = tab.panel('options').title;
    return title === '时间图';
}

function ReadyContext() {
    $.messager.progress({title: "环境准备中", msg: "资源加载中..."});
    let context = new EditorContext(_global.apppath, _global.appdatapath, _global.kfdpath, true,
        function (blkdata) {
            ///保持事件
        });

    context.Event.on("Complete", function () {
        $.messager.progress('close');
        if (_global.editor == null) {
            let editor = new KFNewWindow();
            _global.editor = editor;
        }
        _global.editor.Start(context);

        _global.Event.emit("ContextComplete");

        // 通知下主窗口新窗口启动了，这样主窗口可以同步一些需要的数据过来
        _global.EmitToMainGlobal("OnNewWindowStarted", {from: _global.currentContentsID, phase: "complete"});
    });

    // OpenDevToolsByID(_global.windowID);
    // setTimeout(function () {
    //     context.Ready();
    // }, 3000);
    context.Ready();
}

_global.Event.on("Ready", function () {
    HttpRequest_Type.meta = WebHttpRequest.Meta;
    IKFFileIO_Type.meta = KFHttpFileIO.Meta;
    IKFFileIO_Type.new_default();
    ///绑定一些本地行为
    __Native.Ready();
    ///弹出设置环境

    const search_params = GetURLParams(document.location.toString());

    let kfdpath = search_params.get('kfdpath');
    let apppath = search_params.get('apppath');
    let appdatapath = search_params.get('appdatapath');

    _global.windowID = parseInt(search_params.get('id'));
    _global.currentContentsID = GetwebContentsIDByWinID(_global.windowID);
    _global.mainContentsID = parseInt(search_params.get('maincid'));

    // 通知下主窗口新窗口启动了，这样主窗口可以同步一些需要的数据过来
    _global.EmitToMainGlobal("OnNewWindowStarted", {from: _global.currentContentsID, phase: "init"});

    _global.editblkpath = search_params.get('path');
    _global.asseturl = _global.editblkpath.replace(_global.appdatapath + "/", "");

    document.title = _global.editblkpath;

    if (!kfdpath || !apppath) {
        Nt("路径不能为空!");
        return;
    }

    _global.saveconfig(appdatapath, kfdpath, apppath);
    ///暂进这样处理吧
    _global.webrootpath = _global.apppath.replace("/Html", "").replace("\\Html", "");

    ReadyContext();
});

///加载需要有库
loadjspackage(["KFData", "Core", "KFNetwork"],
    "libs/kf/",
    function (jspaths) {
        loadandincludejs(jspaths, function () {
            _global.Event.emit("Ready");
        });
    },
    ["src/m"]
);