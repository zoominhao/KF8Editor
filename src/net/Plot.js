function Plot(kfApp) {
    this.kfApp = kfApp;
    this.disposed = false;
    this.AddListeners();

    this.plotplay = $("#plotplay");
    this.plotpause = $("#plotpause");

    if(_global.editor.SelAry == null) 
    {
        _global.editor.SelAry = {};
    }
    _global.editor.SelAry[1] = {};
    _global.editor.PlotActors = {};
    _global.editor.SelectedInst = "";
    this.Plots = [];
    this.IsPlot = false;
    this.CurPlotId = "";
    this.ShowPlotOps(false);
    this.pause = false;
    var self = this;
    this.plotplay.click(function () {
        self.pause = false;
        self._play(1);
    });
    this.plotpause.click(function () {
        self.pause = !self.pause;
        self.plotpause.linkbutton({ iconCls: self.pause ? 'icon-continue' : 'icon-pause' });
        self._play(self.pause ? 2 : 3);
    });
}

Plot.prototype.ShowPlotOps = function(flag) {
    var plotSpan = document.getElementById('plotSpan');
    if(!plotSpan) return;
    if(!this.IsPlot || !this.kfApp.IsRemoteData) 
    {
        plotSpan.hidden = true;
        return;
    }

    plotSpan.hidden = !flag;
}

//mode == 1 play; mode == 2 pause; mode == 3 resume; 
Plot.prototype._play = function(mode) {
    this._pause(mode == 2); //暂停

    var curObj = null;
    for(var i = 0; i < this.Plots.length; ++i)
    {
        if(this.Plots[i].Path == this.CurPlotId)
        {
            curObj = this.Plots[i];
            break;
        }
    }
    if(curObj == null) return;
    if(mode == 1)
    {
        curObj.Set("KFPlotPlay", null, true);
    }
    else if(mode == 2)
    {
        curObj.Set("KFPlotPause", null, true);
    }
    else if(mode == 3)
    {
        curObj.Set("KFPlotResume", null, true);
    }
}

Plot.prototype._pause = function(flag) {
    //停world
    if(this.WorldNetObj != null)
        this.WorldNetObj.Set("Editing", flag);
    //停camera
    if(this.CamNetObj != null)
        this.CamNetObj.Set("Editing", flag);
    //自己已经停了
}



Plot.prototype.Dispose = function () {
    if (this.disposed) {
        console.error("Plot Control had been disposed!");
        return;
    }
    this.disposed = true;
    this.RemoveListeners();

    this.kfApp = null;
    this.context = null;

    _global.editor.SelAry[1] = null;
    _global.editor.PlotActors = null;
    _global.editor.SelectedInst = "";
    this.Plots = [];
    this.IsPlot = false;
    this.CurPlotId = "";
    this.pause = false;
    this.ShowPlotOps(false);
}

Plot.prototype.AddListeners = function () {
    this.onlineRpcMgr = _global.editor.network ?.rpcobjsonline;
    if (this.onlineRpcMgr) {
        this.onlineRpcMgr.objmgr.Event.on("OnNetObjsChanged", this.NetObjsChangedFunc.bind(this));

        this.onlineRpcMgr.objmgr.Event.on("OnNetObjDestroy", this.NetObjDeletedFunc.bind(this));
        this.onlineRpcMgr.objmgr.Event.on("OnNetObjAdd", this.NetObjAddedFunc.bind(this));
    }
}

Plot.prototype.RemoveListeners = function () {
    if (this.onlineRpcMgr) {
        this.onlineRpcMgr.objmgr.Event.off("OnNetObjsChanged", this.NetObjsChangedFunc.bind(this));

        this.onlineRpcMgr.objmgr.Event.off("OnNetObjDestroy", this.NetObjDeletedFunc.bind(this));
        this.onlineRpcMgr.objmgr.Event.off("OnNetObjAdd", this.NetObjAddedFunc.bind(this));   //这个移除应该有问题？？？
    }
}

Plot.prototype.NetObjsChangedFunc = function (objs) {
    _global.editor.SelAry[1] = {};
    _global.editor.PlotActors = {};
    this.Plots = [];
    var worldId = 0;
    for(var i in objs)
    {
        if(objs[i].InstName == "_world")
        {
            this.WorldNetObj = objs[i];
            worldId = objs[i].ID;
        }
        if(objs[i].UEName == "CameraController")
        {
            this.CamNetObj = objs[i];
        }
        if(objs[i].Path.indexOf("Plot") != -1 && objs[i].__cls__ == 'KF8RpcPlotActor')
        {
            this.Plots.push(objs[i]);
        }
    }
    for(var i in objs)
    {
        if(objs[i].__cls__ == 'KF8RpcPlotInst' && objs[i].InstName && objs[i].InstName != "")
        {
            _global.editor.SelAry[1][objs[i].UEName] = objs[i].ParentID == worldId ? "*._world." + objs[i].InstName: objs[i].InstName;
            if(objs[i].UEName == "CameraController") _global.editor.SelAry[1][objs[i].UEName] = "*._root." + objs[i].InstName;
            _global.editor.PlotActors[objs[i].InstName] = objs[i];
            //JSON.parse(JSON.stringify(objs[i]));
        }
    }
}

Plot.prototype.NetObjDeletedFunc = function (obj) {
    if(obj)
    {
        if(obj.__cls__ == 'KF8RpcPlotInst')
        {
            obj.Event.off("OnSelectedChanged", this.OnSelectedChanged.bind(this, obj));  //添加RPC属性同步事件
            obj.Event.off("OnlocationChanged", this.OnLocationChanged.bind(this, obj));
            obj.Event.off("OnrotationChanged", this.OnRotationhanged.bind(this, obj));
            obj.Event.off("OnscaleChanged", this.OnScaleChanged.bind(this, obj));
            obj.Event.off("OnfovChanged", this.OnFovChanged.bind(this, obj));
            obj.Event.off("OnFrameIndexChanged", this.OnFrameIndexChanged.bind(this, obj));
        }
    }
}

Plot.prototype.NetObjAddedFunc = function (obj) {
    if(obj)
    {
        if(obj.__cls__ == 'KF8RpcPlotInst')
        {
            obj.Event.on("OnSelectedChanged", this.OnSelectedChanged.bind(this, obj));
            obj.Event.on("OnlocationChanged", this.OnLocationChanged.bind(this, obj));
            obj.Event.on("OnrotationChanged", this.OnRotationhanged.bind(this, obj));
            obj.Event.on("OnscaleChanged", this.OnScaleChanged.bind(this, obj));
            obj.Event.on("OnfovChanged", this.OnFovChanged.bind(this, obj));
            obj.Event.on("OnFrameIndexChanged", this.OnFrameIndexChanged.bind(this, obj));
        }
    }
}

//C++侧触发过来
Plot.prototype.OnSelectedChanged = function (obj) {
    if(obj)
    {
        if (obj.Selected) {
            let n = this.onlineRpcMgr.ui.tree('find', obj.ID);
            if (n) {
                this.onlineRpcMgr.ui.tree('select', n.target);
            }
        }
    }
}

Plot.prototype.OnLocationChanged = function (obj) {
    if(obj && obj.InstName == _global.editor.SelectedInst)
    {
        _global.Event.emit("OnFrameObjChanged", obj);
    }
}

Plot.prototype.OnRotationhanged = function (obj) {
    if(obj && obj.InstName == _global.editor.SelectedInst)
    {
        _global.Event.emit("OnFrameObjChanged", obj);
    }
}

Plot.prototype.OnScaleChanged = function (obj) {
    if(obj && obj.InstName == _global.editor.SelectedInst)
    {
        _global.Event.emit("OnFrameObjChanged", obj);
    }
}

Plot.prototype.OnFovChanged = function (obj) {
    if(obj && obj.InstName == _global.editor.SelectedInst)
    {
        _global.Event.emit("OnFrameObjChanged", obj);
    }
}

Plot.prototype.OnFrameIndexChanged = function (obj) {
    if(obj)
    {
        _global.Event.emit("OnPlotFrameIndexChanged", obj);
    }
}


//////////////////////////////////////////////////////////////////////////////

function PlotRemoteOP(remoteObj) {
    this.remoteObj = remoteObj;

    _global.Event.on("OnSelectedChanged", this.SetSelected.bind(this));
}

//JS侧调C++
PlotRemoteOP.prototype.SetSelected = function(seleted) {
    this.remoteObj.Set('Selected', seleted);
}


