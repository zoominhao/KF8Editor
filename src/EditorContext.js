///定义一个编辑环境，当前加载的blk上下文内容
function EditorContext(apppath, appdatapath, kfdpath, igothers = false, saveHandler = null) {
    ///一般新打开的窗口是没有存储能力的
    this.igothers = igothers;
    this.saveHandler = saveHandler;
    this.apppath = apppath;
    this.appdatapath = appdatapath;
    this.kfdpath = kfdpath;
    this.kfdtable = KFDTable.kfdTB;
    this.editClassFor = {};
    this.kfdNewFuncs = {};
    this.blkfilespath = [];
    this.fileid = 0;
    this.Event = new PIXI.utils.EventEmitter();
    this.currentdata = null;
    this.refs = {};
    this.refsfileDir = this.appdatapath + "/Refs/";
    this.currrefsfile = "";
    this.refsfile = this.appdatapath + "/_refs_.data";
    ///当前的显示状态
    this.libtreestates = {};
    this.remoteObject = new RemoteObject(this);

    let context = this;
    _global.Event.on("onAppDataChange", function (arg) {
        context.UpdateBLKPaths();
    });
    _global.Event.on("onKFDChange", function (arg) {
        context.UpdateKFDTable(function () {
            context.GetAllBlkKFDs(true);
            context.Event.emit("onKFDUpdate");
        });
    });
}

EditorContext.prototype.GetAllBlkKFDs = function (force) {
    if(this.allBlkKFDs == null) {
        this.allBlkKFDs = this.kfdtable.get_kfddatas_extend("KFBlockTarget");
    } else if(force) {
        this.allBlkKFDs.length = 0;
        this.allBlkKFDs.push.apply(this.allBlkKFDs, this.kfdtable.get_kfddatas_extend("KFBlockTarget"));
    }
    return this.allBlkKFDs;
}

EditorContext.prototype.GetClassPropDefault = function (clsname, tag) {

}

EditorContext.prototype.GetClassTag = function (clsname, tag) {
    let kfdcls = this.kfdtable.get_kfddata(clsname);
    if (kfdcls) {
        let unknowtags = kfdcls.unknowtags;
        if (unknowtags) {
            for (let i = 0; i < unknowtags.length; i++) {
                let tgpair = unknowtags[i];
                if (tgpair.tag === tag) {
                    return tgpair.val;
                }
            }
        }
    }
    return null;
}

EditorContext.GetPropTag = function (prop, tag) {
    if (prop && prop.unknowtags) {
        for (let item of prop.unknowtags) {
            if (item.tag === tag) {
                return item.val;
            }
        }
    }
    return null;
}

EditorContext.prototype.GetEditFlag = function (clsname, data) {
    let flagAttr = this.GetEditFlagAttr(clsname);
    if(flagAttr == null) return true;

    let flagAttrArr = flagAttr.split(":");
    if(flagAttrArr.length !== 2) return true;
    if(data == null) return true;
    if(data[flagAttrArr[0]] == null) return false;
    return data[flagAttrArr[0]].toString() === flagAttrArr[1];
}

EditorContext.prototype.GetEditFlagAttr = function (clsname) {
    let kfdcls = this.kfdtable.get_kfddata(clsname);
    if (kfdcls) {
        let unknowtags = kfdcls.unknowtags;
        if (unknowtags) {
            for (let i = 0; i < unknowtags.length; i++) {
                let tgpair = unknowtags[i];
                if (tgpair.tag === "EDITFLAG") {
                    return tgpair.val;
                }
            }
        }
        let extendcls = kfdcls.extend;
        if (extendcls) {
            return this.GetEditClass(extendcls);
        }
    }
    return null;
}

EditorContext.prototype.GetEditClass = function (clsname) {
    let editcls = this.editClassFor[clsname];
    if (editcls != null && editcls !== "")
        return editcls;

    let kfdcls = this.kfdtable.get_kfddata(clsname);
    if (kfdcls) {
        let unknowtags = kfdcls.unknowtags;
        if (unknowtags) {
            for (let i = 0; i < unknowtags.length; i++) {
                let tgpair = unknowtags[i];
                if (tgpair.tag === "EDITCLASS") {
                    return tgpair.val;
                }
            }
        }

        let extendcls = kfdcls.extend;
        if (extendcls) {
            return this.GetEditClass(extendcls);
        }
    }
    return null;
}

EditorContext.prototype.LookForEditClass = function (kfddatas) {
    if (kfddatas instanceof Array) {
        for (let i = 0; i < kfddatas.length; i++) {
            this.LookForEditClass(kfddatas[i]);
        }
    } else {
        let unknowtags = kfddatas.unknowtags;
        if (unknowtags) {
            let clsname = kfddatas.class;
            for (let i = 0; i < unknowtags.length; i++) {
                let tgpair = unknowtags[i];
                if (tgpair.tag === "EDITFOR") {
                    let clsarr = tgpair.val.split("|");
                    for (let j = 0; j < clsarr.length; j++) {
                        this.editClassFor[clsarr[j]] = clsname;
                    }
                    return;
                }
            }
        }
    }
}

EditorContext.prototype.CreateBlk = function (name, type, blkpath, callback) {
    ///先加载依赖文件再创建，依赖文件随时会更新
    let context = this;
    IKFFileIO_Type.instance.asyncLoadFile(context.refsfile, function (ret, data, path) {
        if (ret) {
            context.refs = JSON.parse(new KFByteArray(data).readstring());
        } else {
            LOG("{0} 文件不存在,自动创建", context.refsfile);
            context.refs = {};
        }
        context.__CreateBlk(name, type, blkpath, callback);
    }, "");
}

EditorContext.prototype.__CreateBlk = function (name, type, path, callback) {
    path = path.replace(/\\/g, "/");
    if (path.startsWith("/") || path.indexOf(":") !== -1) {
        if (path.indexOf(this.appdatapath) === -1) {
            Nt("路径格式不正确[需要相对路径]");
            return;
        }
        path = path.replace(this.appdatapath, "");

        if (path.startsWith("/")) {
            path = path.substring(1, path.length);
        }
    }

    ///修正路径
    if (path) {
        if (!path.endsWith('/')) path += "/";
    } else {
        path = "";
    }

    let asseturl = path + name;
    let dirpath = this.appdatapath + "/" + asseturl;

    ///依赖关系预先建立下
    asseturl += ".blk";
    let assetrefs = this.refs[asseturl];
    if (assetrefs == null) {
        if (asseturl.startsWith("/")) {
            debugger;
        }

        assetrefs = {};
        this.refs[asseturl] = assetrefs;
    }

    let context = this;
    let typekfddata = this.kfdtable.get_kfddata(type);
    let isextendactor = this.kfdtable.is_extend(typekfddata, "KFActor", true);

    let creatdatafunc = function (ret) {
        if (ret) {
            let metadata = {"__cls__": "KFMetaData"};
            let metapath = dirpath + ".blk";

            metadata.name = name;
            metadata.type = type;

            let files = [{path: metapath, data: metadata}];

            ///如果是继承ACTOR则需要创建TIMELINE 和 GRAPH数据
            if (isextendactor) {
                let timelinedata = {"__cls__": "KFTimelineConfig"};
                let graphdata = {"__cls__": "KFGraphConfig"};

                files.push({path: dirpath + "/timeline.data", data: timelinedata});
                files.push({path: dirpath + "/graph.data", data: graphdata});

                assetrefs.__timeline__ = true;
                assetrefs.__graph__ = true;
            }

            ///资源依赖文件更新下
            files.push({
                data: JSON.stringify(context.refs),
                path: context.refsfile
            });

            Savefilelist(files, function (ret, path) {
                if (callback) {
                    callback(ret, metapath);
                }

                if (ret) {
                    _global.EmitToGlobal("OnBlkCreated", {text: name, path: metapath});
                }
            })
        } else if (callback) {
            callback(false);
        }
    };

    if (isextendactor) {
        IKFFileIO_Type.instance.asyncCreateDir(dirpath, creatdatafunc)
    } else {
        creatdatafunc(true);
    }
}

function PushSort(a, v) {
    if (!a.length) {
        return 0;
    }
    if (a[0]['text'] > v['text']) {
        return 0;
    }
    let i = 1;
    while (i < a.length && !(a[i]['text'] > v['text'] && a[i - 1]['text'] <= v['text'])) {
        i = i + 1;
    }
    return i;
}

function SearchTimeLineFiles(seachpath, endfunc){
    let allpaths = [];
    IKFFileIO_Type.instance.asyncGetFilePaths(allpaths, seachpath, false, "tllayer.data", function (ret, data, path) {
        if (path === "" && endfunc && ret) {
            endfunc(allpaths);
        }
    });
}

function SeachFolder(seachpath, context, endfunc, statesmap) {
    seachpath = seachpath.replace(/\\/g, "/");
    LOG("blk seach path:{0}", seachpath);

    let allpaths = [];
    let dirmap = {};

    let pushtodir = function (dir, fileinfo) {
        let parentobj = dirmap[dir];
        if (!parentobj) {
            let dirarr = dir.split("/");
            parentobj = null;
            let cdir = "";

            for (let i = 0; i < dirarr.length; i++) {
                let dirname = dirarr[i];
                cdir = (cdir === "" ? "" : (cdir + "/")) + dirname;

                let tmpdiro = dirmap[cdir];
                if (!tmpdiro) {
                    context.fileid += 1;
                    tmpdiro = {
                        text: dirname,
                        path: (parentobj ? parentobj.path : seachpath) + "/" + dirname,
                        id: context.fileid,
                        children: [],
                        state: "closed"
                    };

                    if (statesmap && statesmap[tmpdiro.path]) {
                        tmpdiro["state"] = "open";
                    }

                    let myArray = null;
                    if (parentobj) {
                        myArray = parentobj.children;
                    } else {
                        myArray = allpaths;
                    }

                    myArray.splice(PushSort(myArray, tmpdiro), 0, tmpdiro);

                    dirmap[cdir] = tmpdiro;
                }

                parentobj = tmpdiro;
            }
        }

        if (fileinfo.text !== "__init__.blk") {
            parentobj.children.splice(PushSort(parentobj.children, fileinfo), 0, fileinfo);
        }
    }

    IKFFileIO_Type.instance.asyncIteratePaths(seachpath, true, function (path, isdir) {
            if (!isdir) {
                path = path.replace(/\\/g, "/");

                let lindex = path.lastIndexOf("/");
                let filename = path.substr(lindex + 1);
                if (filename.indexOf(".blk") !== -1) {
                    context.fileid += 1

                    let fileinfo = {
                        text: filename,
                        path: path,
                        id: context.fileid,
                        asseturl: path.replace(seachpath, "").substr(1)
                    };

                    let blkdirpath = path.substring(0, lindex).replace(seachpath, "");
                    if (blkdirpath === "") {
                        if (filename !== "__init__.blk") {
                            allpaths.push(fileinfo);
                        }
                    } else {
                        if (blkdirpath.startsWith("/")) {
                            blkdirpath = blkdirpath.substr(1);
                        }
                        pushtodir(blkdirpath, fileinfo);
                    }
                }
            }
        },
        function (ret, data, path) {
            if (!path && endfunc) {
                endfunc(ret, allpaths);
            }
        }
    );
}

EditorContext.prototype.UpdateBLKPaths = function () {
    let context = this;
    context.fileid = 0;
    context.blkfilespath.length = 0;

    SeachFolder(this.appdatapath, this, function (ret, paths) {
        if (ret) {
            context.blkfilespath = paths;
            context.Event.emit("OnBlkfilesUpate", context.blkfilespath)
        }
    }, this.libtreestates);
}

EditorContext.prototype.UpdateKFDTable = function (whatnext) {
    this.editClassFor = {};
    this.kfdtable.kfddata_maps = {};

    let context = this;
    let loadfiles = function (pathlist) {
        let kfdpaths = []
        let kfdtable = context.kfdtable;

        IKFFileIO_Type.instance.asyncLoadFileList(pathlist, function (succ, data, filepath) {
                LOG("load kfd file: {0}", filepath);
                let kfddatas = JSON.parse(data);
                context.LookForEditClass(kfddatas);

                kfdtable.add_kfd(kfddatas, function (kfddata) {
                    let newfunc = context.kfdNewFuncs[kfddata.class];
                    if (newfunc) {
                        kfddata.__new__ = newfunc;
                    }
                });
                kfdpaths.push(filepath.replace(context.kfdpath + "/", ""))
            },
            function (succ) {
                ///所有KFD加载成功
                LOG("All kfd load completed");

                if (!context.igothers) {
                    ///保存KFD加载列表
                    let kfd_list_path = context.kfdpath + "/_kfdpaths_.data";
                    let kfdpaths_copy = [...kfdpaths];
                    kfdpaths_copy.sort();
                    Savefilelist([{path: kfd_list_path, data: JSON.stringify(kfdpaths_copy)}], function (ret) {
                        LOG("save {0}, ret:{1}", kfd_list_path, ret);
                    });
                }

                //加载依赖关系
                if (whatnext) {
                    whatnext();
                }
            },
            "text"
        );
    }

    let pathlist = [];
    IKFFileIO_Type.instance.asyncGetFilePaths(pathlist, this.kfdpath, true, ".kfd", function (succ, data, path) {
        if (succ && !path) {
            loadfiles(pathlist);
        }
    });
}

EditorContext.prototype.SetKFDNewFuncs = function (defkfdnews) {
    for (let defnew of defkfdnews) {
        this.kfdNewFuncs[defnew.name] = defnew.func;
        if (this.kfdtable) {
            let kfddata = this.kfdtable.get_kfddata(defnew.name);
            if (kfddata) kfddata.__new__ = defnew.func;
        }
    }
}

EditorContext.prototype.Ready = function () {
    let context = this;

    //加载REFS文件
    let loadRef = function () {
        LOG("refsfile:{0}", context.refsfile);
        IKFFileIO_Type.instance.asyncLoadFile(context.refsfile, function (ret, data, path) {
            if (ret) {
                context.refs = JSON.parse(new KFByteArray(data).readstring());
            } else {
                LOG("{0} 文件不存在,自动创建", context.refsfile);
            }
            context.Event.emit("Complete");
        }, "");
    }

    ///获取所有的KFD文件
    this.UpdateKFDTable(loadRef);
    ///根据路径加载库BLK文件
    this.UpdateBLKPaths();
}

EditorContext.prototype.SetCurrentData = function (data) {
    if (this.currentdata === data)
        return;

    this.Event.emit("OnDataClear", this.currentdata);
    this.currentdata = data;
    if (data) {
        this.Event.emit("OnDataSet", this.currentdata);
    }
}

/// callback void(ret,data,path)
EditorContext.prototype.LoadBlk = function (metapath, callback, ignoresetcurrentdata) {
    let context = this;
    let lindex = metapath.lastIndexOf("/");
    let blkname = metapath.substr(lindex + 1);
    let filedir = metapath.substr(0, lindex);
    let asseturl = metapath;///相对路径

    if (filedir.indexOf(":") === -1 && filedir.startsWith("/") === false) {
        //相对路径
        filedir = this.appdatapath + "/" + filedir;
    } else {
        //绝对路径转相对路径
        asseturl = metapath.replace(this.appdatapath + "/", "");
    }
    filedir += "/";

    metapath = filedir + blkname;

    let loadAniAndGraph = function (blkobj, dirpath) {
        let blkdata = {blk: blkobj, dir: dirpath, path: metapath, asseturl: asseturl};
        let clsname = blkobj.type.toString();
        if(!ignoresetcurrentdata) _global.editcls = clsname;
        blkdata.extendactor = context.kfdtable.is_extendname(clsname, "KFActor", true);
        let layerDatas = [];
        let AudioLayer = [];

        blkdata.excelextendactor = context.kfdtable.is_extendname(clsname, "KFBlockTarget", true);

        if(blkdata.excelextendactor) {
            let exceldescpath = dirpath.replace("App/Data/App","EditorOnly/DataDesc") + "excel.json";
            if(fileExists(exceldescpath)) {
                IKFFileIO_Type.instance.asyncLoadFile(exceldescpath, function (ret, data, path) {
                    let somedata = JSON.parse(new KFByteArray(data).readstring());
                    somedata = somedata == null ? {} : somedata;
                    if (path.endsWith("excel.json")) {
                        blkdata.exceldesc = somedata;
                        blkdata.exceldescpath = path;
                    }
                }, "");
            }
        }

        if (blkdata.extendactor) {
            SearchTimeLineFiles(blkdata.dir, function(allpath){
                let tldescpath = dirpath.replace("App/Data/App","EditorOnly/DataDesc") + "timeline.desc";
                if (fileExists(tldescpath)) {
                    allpath.push(tldescpath);
                }
                allpath.push(dirpath + "timeline.data");

                let graphdescpath = dirpath.replace("App/Data/App","EditorOnly/DataDesc") + "graph.desc";
                if (fileExists(graphdescpath)) {
                    allpath.push(graphdescpath);
                }
                allpath.push(dirpath + "graph.data");

                //IKFFileIO_Type.instance.asyncLoadFileList([dirpath + "timeline.data", dirpath + "graph.data"], function (ret, data, path) {
                IKFFileIO_Type.instance.asyncLoadFileList(allpath, function (ret, data, path) {
                    if (ret) {
                        let somedata = KFDJson.read_value(new KFByteArray(data));
                        somedata = somedata == null ? {} : somedata;
                        if (path.endsWith("_tllayer.data")) {
                            path = path.replace(/\\/g, "/");
                            let filename = path.substring(path.lastIndexOf("/") + 1)
                            let layernum = Number(filename.replace("_tllayer.data",""));
                            if(isNaN(layernum)) {
                                AudioLayer[0] = somedata;
                            } else {
                                layerDatas[layernum] = somedata;
                            }
                        } else if (path.endsWith("timeline.data")) {
                            ///处理默认需要多个state的定义
                            let STATEDEF = context.GetClassTag(clsname, "STATEDEF");
                            if (STATEDEF && STATEDEF !== "") {
                                let statedef = context.kfdtable.get_kfddata(STATEDEF);
                                let Dstatedef = KFDPropTool.GetStateDefData(statedef, STATEDEF, blkdata.tldesc ? blkdata.tldesc.stateCategory : "");
                                if (Dstatedef) {
                                    let statesmap = {};
                                    let currentids = {};

                                    let cstates = somedata.states;
                                    if (cstates) {
                                        for (let cst of cstates) {
                                            if(Dstatedef[cst.id]) cst.name = Dstatedef[cst.id]
                                            statesmap[cst.id] = cst;
                                        }
                                    } else {
                                        cstates = [];
                                        somedata.states = cstates;
                                    }

                                    for (let id in Dstatedef) {
                                        let iid = parseInt(id);
                                        currentids[iid] = true;
                                        if (!statesmap[iid]) {
                                            let KFTimelineData = {};

                                            KFTimelineData.id = iid;
                                            KFTimelineData.name = Dstatedef[iid];

                                            statesmap[iid] = KFTimelineData;
                                            cstates.push(KFTimelineData);
                                        }
                                    }
                                    /*for (let prop of Dstatedef) {
                                        let id = parseInt(prop.default);
                                        currentids[id] = true;
                                        let cname = prop.cname ? prop.cname : prop.name;
                                        if (!statesmap[id]) {
                                            let KFTimelineData = {};

                                            KFTimelineData.id = id;
                                            KFTimelineData.name = cname;

                                            statesmap[id] = KFTimelineData;
                                            cstates.push(KFTimelineData);
                                        }
                                    }*/
                                    //Expired 的判定
                                    let ExpiredStates = [];
                                    for (let state of cstates) {
                                        if (!currentids[state.id]) {
                                            ExpiredStates.push(state);
                                            if (state.name.indexOf("Expired") === -1) {
                                                state.name += "(Expired)";
                                            }
                                        }
                                    }
                                    ///delete
                                    for (let ExpiredState of ExpiredStates) {
                                        let index = cstates.indexOf(ExpiredState);
                                        if (index !== -1)
                                            cstates.splice(index, 1);
                                    }

                                }
                            }

                            blkdata.timeline = somedata;
                            blkdata.timelinepath = path;
                        } else if (path.endsWith("timeline.desc")) {
                            blkdata.tldesc = somedata;
                            blkdata.tldescpath = path;
                        } else if (path.endsWith("graph.data")) {
                            blkdata.graph = somedata;
                            blkdata.graphpath = path;
                        } else if (path.endsWith("graph.desc")) {
                            blkdata.graphdesc = somedata;
                            blkdata.graphdescpath = path;
                        }
                    }

                }, function (ret, data, path) {
                    ///完成事件
                    //timeline用layer的刷新一下
                    if(blkdata.timeline)
                    {
                        if(blkdata.timeline.states == null)
                            blkdata.timeline.states = [];

                        for(let n = 0; n < layerDatas.length; ++n)
                        {
                            for(let m = 0; m < blkdata.timeline.states.length; ++m)
                            {
                                if(layerDatas[n] && layerDatas[n].states[m] && layerDatas[n].states[m].layers && layerDatas[n].states[m].layers.length === 1)
                                {
                                    //if(blkdata.timeline.states[m].layers == null) blkdata.timeline.states[m].layers = new Array();
                                    if(blkdata.timeline.states[m].layers != null && blkdata.timeline.states[m].layers.length >= n)
                                    {
                                        blkdata.timeline.states[m].layers[n] = layerDatas[n].states[m].layers[0];
                                    }
                                }
                                /*else
                                {
                                    //异常数据或者为0，同时清理timeline
                                    if(blkdata.timeline.states[m].layers != null && blkdata.timeline.states[m].layers.length > n)
                                    {
                                        blkdata.timeline.states[m].layers[n] = null;
                                    }
                                }*/

                            }
                        }

                        // 音频添加脚本
                        if(AudioLayer.length >0)
                        {
                            for(let m = 0; m < blkdata.timeline.states.length; ++m)
                            {
                                if(AudioLayer[0] && AudioLayer[0].states[m] && AudioLayer[0].states[m].layers && AudioLayer[0].states[m].layers.length === 1)
                                {
                                    if(blkdata.timeline.states[m].layers != null && blkdata.timeline.states[m].layers.length >= 2)
                                    {
                                        if(blkdata.timeline.states[m].layers[2] && blkdata.timeline.states[m].layers[2].name === "Audio" && blkdata.timeline.states[m].layers[2].blocks.length > 0)
                                        {
                                            let KeyFrames = null;
                                            let blkKeyFrames = blkdata.timeline.states[m].layers[2].blocks[0].keyframes;
                                            if(AudioLayer[0].states[m].layers[0].blocks && AudioLayer[0].states[m].layers[0].blocks.length > 0)
                                            {
                                                KeyFrames = AudioLayer[0].states[m].layers[0].blocks[0].keyframes;
                                            }
                                            if(KeyFrames)
                                            {
                                                // --删
                                                // 针对音频已经删除的数据处理
                                                if(blkKeyFrames)
                                                {
                                                    for(var i = 0; i < blkKeyFrames.length; ++i)
                                                    {
                                                        let blkScripData = blkKeyFrames[i].data.scripts;
                                                        if(blkScripData)
                                                        {
                                                            for(let j = 0; j < blkScripData.length; j++)
                                                            {
                                                                if(blkScripData[j] && blkScripData[j].__cls__ === "TSPlayAudioData")
                                                                {
                                                                    if(KeyFrames[i] && KeyFrames[i].data && KeyFrames[i].data.scripts[j])
                                                                    {}
                                                                    else
                                                                    {
                                                                        blkScripData.splice(j);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }

                                                // --增 --改
                                                for(let i = 0; i < KeyFrames.length; i++)
                                                {
                                                    // 针对没有Timeline中不存在的关键帧
                                                    let flag = false;

                                                    if(blkKeyFrames)
                                                    {
                                                        for(let j = 0; j < blkKeyFrames.length; j++)
                                                        {
                                                            if(blkKeyFrames[j].id === KeyFrames[i].id)
                                                            {
                                                                flag = true;
                                                                break;
                                                            }
                                                        }
                                                    }

                                                    if(!flag && blkKeyFrames)
                                                    {
                                                        // 移除KeyFrames中不是Audio的脚本
                                                        let ScripData = KeyFrames[i].data.scripts;
                                                        if(ScripData)
                                                        {
                                                            for(let j = 0; j < ScripData.length; j++) {
                                                                if (ScripData[j] && ScripData[j].__cls__ !== "TSPlayAudioData") {
                                                                    ScripData.splice(j);
                                                                }
                                                            }
                                                        }

                                                        blkKeyFrames.push(KeyFrames[i]);
                                                    }
                                                    // 针对没有Timeline中存在的相同关键帧
                                                    let ScripData = KeyFrames[i].data.scripts;
                                                    if(flag && ScripData)
                                                    {
                                                        for(let j = 0; j < ScripData.length; j++)
                                                        {
                                                            if(ScripData[j] && ScripData[j].__cls__ === "TSPlayAudioData")
                                                            {
                                                                let blkScripData = blkdata.timeline.states[m].layers[2].blocks[0].keyframes[i].data.scripts;
                                                                if(blkScripData.length > j)
                                                                {
                                                                    // 类型不同尾部添加， 类型相同直接用层数据替换
                                                                    if( blkScripData[j].type.value !== ScripData[j].type.value)
                                                                    {
                                                                        blkdata.timeline.states[m].layers[2].blocks[0].keyframes[i].data.scripts.push(ScripData[j]);
                                                                    }
                                                                    else
                                                                    {
                                                                        blkScripData[j] = ScripData[j];
                                                                    }

                                                                }
                                                                else
                                                                {
                                                                    blkdata.timeline.states[m].layers[2].blocks[0].keyframes[i].data.scripts.push(ScripData[j]);
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }


                    }
                    if (!ignoresetcurrentdata) {
                        context.SetCurrentData(blkdata);
                    }
                    if (callback) {
                        callback(true, blkdata, metapath);
                    }
                }
                , "");
            });
        } else if (callback) {
            if (!ignoresetcurrentdata) {
                context.SetCurrentData(blkdata);
            }
            callback(true, blkdata, metapath);
        }
    };

    ///先加载一下BLK的文件吧

    IKFFileIO_Type.instance.asyncLoadFile(metapath,
        function (ret, data, path) {
            if (!ret) {
                console.error("文件加载失败:" + path);
                if (callback) {
                    callback(false, null, metapath);
                }
            } else {
                let bytearr = new KFByteArray(data);
                let blkobj = KFDJson.read_value(bytearr);

                if(blkobj)
                {
                    loadAniAndGraph(blkobj, filedir
                        + blkname.replace(".blk", "") + "/");
                /*
                    loadExcel(blkobj, filedir
                        + blkname.replace(".blk", "") + "/");
                 */
                }
                else
                {
                    console.error("文件解析失败:" + path);
                    if (callback)
                    {
                        callback(false, null, metapath);
                    }
                }
            }
        }
        , "");
}

function SearchBLKTargetData(targetdata, assetrefs, statename, context) {
    if (targetdata && targetdata.option === 1) {
        ///属于创建类型
        let asseturl = targetdata.asseturl;
        if (asseturl && asseturl !== "") {
            if (!statename) {
                statename = "#0";
            }

            let refinfo = assetrefs[asseturl];
            if (refinfo) {
                let instnames = refinfo.instnames[statename];
                if (!instnames) {
                    instnames = {};
                    refinfo.instnames[statename] = instnames
                }
                instnames[targetdata.instname] = true;
            } else {
                refinfo = {};
                refinfo.asseturl = asseturl;

                refinfo.instnames = {};
                let instnames = {};
                instnames[targetdata.instname] = true;
                refinfo.instnames[statename] = instnames;

                assetrefs[asseturl] = refinfo;
            }
        }
    }
}

function SearchScriptData(scriptdata, assetrefs, statename, context, topscript = true) {
    if (!scriptdata || !scriptdata.__cls__) return;

    if (scriptdata.__cls__ === "GSCreateChildScriptData") {
        SearchBLKTargetData(scriptdata.TargetData, assetrefs, statename, context);
    } else if (scriptdata.__cls__ === "GSCreateEntityData") {
        SearchBLKTargetData(scriptdata.EData, assetrefs, statename, context);
    } else if(scriptdata.__cls__ === "GSCodeData") {
        let codecontext = assetrefs.codecontext;
        codecontext.codefrom.fieldPath = "";
        codecontext.codes.push({data:scriptdata,from:{...codecontext.codefrom}});
    } else if (context) {
        let Category = context.GetClassTag(scriptdata.__cls__, "Category");
        if (Category && Category.indexOf && Category.indexOf("分歧") !== -1) {
            for (let propname in scriptdata) {
                SearchScriptData(scriptdata[propname], assetrefs, statename, context, false);
            }
        }
    }

    // 递归查找GSCodeData
    if (topscript) {
        let matchedPaths = CommTool.FindPathInKFDObject(scriptdata, null, context.kfdtable,
            function (value, typeid, prop, extra, kfdtable, savedCallback) {
                let matched = false;
                if (typeid === KFDataType.OT_MIXOBJECT) {
                    let cls = CommTool.GetKFDObjectClsName(value, prop);
                    if (cls === "GSCodeData") {
                        matched = true;
                    }
                }
                return matched;
            }, null, null);
        if (matchedPaths.length > 0) {
            for (let item of matchedPaths) {
                let codecontext = assetrefs.codecontext;
                codecontext.codefrom.fieldPath = item.path;
                codecontext.codes.push({data:item.value,from:{...codecontext.codefrom}});
            }
        }
    }
}

function SearchFrameData(kfframedata, assetrefs, statename, context) {
    if (kfframedata && kfframedata.scripts) {
        let i = 0;
        for (let scriptdata of kfframedata.scripts) {
            assetrefs.codecontext.codefrom.seqId = i++;
            SearchScriptData(scriptdata, assetrefs, statename, context);
        }
    }
}

function SearchMetaData(metadata, assetrefs, context) {
    // 只搜索类数据
    if (metadata && metadata.classData) {
        CommTool.FindPathInKFDObject(metadata.classData, null, context.kfdtable,
            function (value, typeid, prop, extra, kfdtable, savedCallback) {
                let matched = false;
                if (typeid === KFDataType.OT_OBJECT) {
                    let cls = CommTool.GetKFDObjectClsName(value, prop);
                    if (cls === "KFBlockTargetData") {
                        matched = true;
                        SearchBLKTargetData(value, assetrefs, '', context);
                    }
                }
                return matched;
            }, null, null);
    }
}

function SearchTimeline(timeline, assetrefs, context) {
    assetrefs.__timeline__ = true;
    let states = timeline.states;
    let count = states ? states.length : 0;
    let codefrom = {};
    assetrefs.codecontext.codefrom = codefrom;

    for (let i = 0; i < count; i++) {
        let cstate = states[i];
        let statename = cstate.id + "";
        codefrom.stateId = cstate.id;
        let layers = cstate.layers;
        let layercount = layers ? layers.length : 0;

        for (let j = 0; j < layercount; j++) {
            let clayer = layers[j];
            let blocks = clayer.blocks;
            let blkcount = blocks ? blocks.length : 0;
            codefrom.layer = j;

            for (let k = 0; k < blkcount; k++) {
                let blockData = blocks[k];
                SearchBLKTargetData(blockData.target, assetrefs, statename, context);
                if (blockData.keyframes) {
                    for (let keyframe of blockData.keyframes) {
                        codefrom.currentFrame = keyframe.id + (blockData.hasOwnProperty('begin') ? blockData.begin : 0);
                        SearchFrameData(keyframe.data, assetrefs, statename, context);
                    }
                }
            }
        }
    }
}

function SearchGraph(graph, assetrefs, context) {
    assetrefs.__graph__ = true;

    if (graph && graph.data && graph.data.blocks) {
        assetrefs.codecontext.codefrom = {};
        let blocks = graph.data.blocks;
        let blkcount = blocks ? blocks.length : 0;
        for (let i = 0; i < blkcount; i++) {
            let blkdata = blocks[i];
            assetrefs.codecontext.codefrom.graphNodeName = blkdata.name.toString();
            SearchBLKTargetData(blkdata.target, assetrefs, "", context);
            SearchFrameData(blkdata.frame, assetrefs, "", context);
        }
    }
}

EditorContext.prototype.SaveLayer = function (blkdata, layerId, autoSave = false) {
    if(blkdata == null){
        Nt("没有打开任何文件..");
        return;
    }

    _global.Event.emit("OnBeforeSave", blkdata);
    if(!autoSave) {
        $.messager.progress({title: "请等待", msg: "资源保存中..."});
    }

    let context = this;
    IKFFileIO_Type.instance.asyncLoadFile(context.refsfile, function (ret, data, path) {
        if (ret) {
            context.refs = JSON.parse(new KFByteArray(data).readstring());
        } else {
            LOG("{0} 文件不存在,自动创建", context.refsfile);
            context.refs = {};
        }
        context.__SaveBlk(blkdata, layerId, true, true, autoSave);
    }, "");
}

EditorContext.prototype.SaveBlk = function (blkdata, all = true) {
    if (!blkdata) {
        Nt("没有打开任何文件..");
        return;
    }

    _global.Event.emit("OnBeforeSave", blkdata);
    $.messager.progress({title: "请等待", msg: "资源保存中..."});
    let context = this;
    IKFFileIO_Type.instance.asyncLoadFile(context.refsfile, function (ret, data, path) {
        if (ret) {
            context.refs = JSON.parse(new KFByteArray(data).readstring());
        } else {
            LOG("{0} 文件不存在,自动创建", context.refsfile);
            context.refs = {};
        }
        context.__SaveBlk(blkdata, null, all);
    }, "");

    let blkname = blkdata.asseturl;
    if (blkname) {
        blkname = blkname.split("/");
        blkname = blkname[blkname.length - 1];
        blkname = blkname.split(".")[0];
        let block_name = blkname.split(".")[0];
        if (block_name && KFDPropTool.Enums && KFDPropTool.Enums[block_name]) {
            delete KFDPropTool.Enums[block_name];//删除当前缓存
        }
    }
}

EditorContext.prototype.__SaveBlk = function (blkdata, layerId, all = true, event_emit = true, autoSave = false) {
    let context = this;
    let meta = blkdata.blk;
    let metaclass = meta.type.toString();
    let metaobj = meta.data ? meta.data.object : null;
    if (metaobj && metaobj.__cls__ !== metaclass) {
        metaobj.__cls__ = metaclass;
    }

    this.SaveBlkList([blkdata], null, function (ret) {
        try { $.messager.progress('close'); } catch (e) {}
        if(!autoSave) {
            Msg((ret ? "文件保存成功:" : "文件保存失败:") + blkdata.path, 1);
        }
        if (ret) {
            if (context.saveHandler) {
                context.saveHandler(blkdata);
            }
            if (event_emit) {
                _global.Event.emit("OnBlkSaved", blkdata, context);
            }
        } else {
            console.error("文件保存失败:" + blkdata.path);
            if (event_emit) {
                _global.Event.emit("OnBlkSavedFail", blkdata, context);
            }
        }
    }, layerId, all);
}

EditorContext.prototype.SaveBlkList = function(blkdataarr, fileinfos = null, callback = null, layerId = null, all = true) {
    fileinfos = fileinfos ? fileinfos : [];

    for (let i = 0; i < blkdataarr.length; i++) {
        let blkdata = blkdataarr[i];
        if (blkdata) {
            let asseturl = blkdata.asseturl;
            if (asseturl.startsWith("/")) {
                debugger;
            }

            let assetrefs = this.refs[asseturl];
            if (assetrefs == null) {
                assetrefs = {};
            } else {
                //暂时全清空，后面做增量吧
                assetrefs = {};
            }

            assetrefs.type = blkdata.blk.type.toString();

            //定义一个代码的上下文为了查找代码方便
            assetrefs.codecontext = {
                global: _global,
                asseturl: asseturl,
                codes: [],
                outpath: blkdata.timelinepath ? blkdata.timelinepath.replace("timeline.data", "code.data") : ""
            };

            this.refs[asseturl] = assetrefs;

            if (all || _global.curEditIndex === 0) {
                fileinfos.push({
                    data: blkdata.blk,
                    path: blkdata.path
                });
            }

            let isactor = false;

            if (blkdata.timeline && (all || _global.curEditIndex === 2)) {
                isactor = true;
                if(layerId === "Audio") {
                    let newTimeline = $.extend(true, {}, blkdata.timeline)
                    if (newTimeline.states == null) newTimeline.states = [];
                    for (let m = 0; m < newTimeline.states.length; ++m) {
                        if (newTimeline.states[m].layers && newTimeline.states[m].layers.length > 2) {
                            let newlayer = newTimeline.states[m].layers[2];
                            newTimeline.states[m].layers = [];
                            newTimeline.states[m].layers.push(newlayer);
                        } else {
                            newTimeline.states[m].layers = [];
                        }
                    }
                    let layername = blkdata.timelinepath.replace("timeline", layerId + "_tllayer");

                    fileinfos.push({
                        data: newTimeline,
                        path: layername,
                    });
                } else if (layerId != null) {
                    let newTimeline = $.extend(true, {}, blkdata.timeline)
                    if (newTimeline.states == null) newTimeline.states = [];
                    for (let m = 0; m < newTimeline.states.length; ++m) {
                        if (newTimeline.states[m].layers && newTimeline.states[m].layers.length > layerId) {
                            let newlayer = newTimeline.states[m].layers[layerId];
                            newTimeline.states[m].layers = [];
                            newTimeline.states[m].layers.push(newlayer);
                        } else {
                            newTimeline.states[m].layers = [];
                        }
                    }
                    let layername = blkdata.timelinepath.replace("timeline", layerId + "_tllayer");

                    fileinfos.push({
                        data: newTimeline,
                        path: layername,
                    });
                } else {
                    fileinfos.push({
                        data: blkdata.timeline,
                        path: blkdata.timelinepath
                    });
                }
                if (blkdata.tldesc) {
                    fileinfos.push({
                        data: blkdata.tldesc,
                        path: blkdata.tldescpath
                    });
                }
                SearchTimeline(blkdata.timeline, assetrefs, this)
            }

            if (blkdata.blk && (all || _global.curEditIndex === 0)) {
                let classData = blkdata.blk.classData;
                if (classData) {
                    if (classData.ExtendBlk && classData.ExtendBlk !== "") {
                        let exturl = classData.ExtendBlk;
                        let refinfo = assetrefs[exturl];
                        if (!refinfo) {
                            refinfo = {};
                            refinfo.asseturl = exturl;
                            refinfo.instnames = {};
                            assetrefs[exturl] = refinfo;
                        }
                    }

                    if (classData.CombinedBlks) {
                        for (let curl of classData.CombinedBlks) {
                            let refinfo = assetrefs[curl];
                            if (!refinfo) {
                                refinfo = {};
                                refinfo.asseturl = curl;
                                refinfo.instnames = {};
                                assetrefs[curl] = refinfo;
                            }
                        }
                    }
                }
                if (blkdata.exceldesc) {
                    fileinfos.push({
                        data: JSON.stringify(blkdata.exceldesc),
                        path: blkdata.exceldescpath
                    });
                }
                SearchMetaData(blkdata.blk, assetrefs, this);
            }

            if (blkdata.graph && (all || _global.curEditIndex === 1)) {
                isactor = true;
                fileinfos.push({
                    data: blkdata.graph,
                    path: blkdata.graphpath
                });

                SearchGraph(blkdata.graph, assetrefs, this)
            }
            if (blkdata.graphdesc) {
                fileinfos.push({
                    data: blkdata.graphdesc,
                    path: blkdata.graphdescpath
                });
            }

            ///删除掉codecontext的定义
            let codecontext = assetrefs.codecontext;
            delete assetrefs.codecontext;

            if (all) {
                KF8Coder.Process(codecontext);

                if (codecontext.hasCode) {
                    assetrefs.__code__ = true;
                }

                ///当前文件的依赖关系记录
                let blkname = asseturl.replace(/\//g, "_");
                let currrefsfile = this.refsfileDir + blkname.replace(".blk", "") + ".refs";
                let assetrefinfo = {asseturl: asseturl, info: assetrefs};

                fileinfos.push({
                    data: JSON.stringify(assetrefinfo),
                    path: currrefsfile
                });
            }
        }
    }

    ///资源依赖文件更新下
    if (all) {
        fileinfos.push({
            data: JSON.stringify(this.refs),
            path: this.refsfile
        });
    }

    for (let idx in fileinfos)
        LOG("fileinfo:{0}", fileinfos[idx].path);

    Savefilelist(fileinfos, function (ret) {
        if (callback) {
            callback(ret);
        }
    });
}