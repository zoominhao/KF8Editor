function TOD(kfApp, context) {
    this.kfApp = kfApp;
    this.disposed = false;
    this.AddListeners();

    this.todplay = $("#todplay");
    this.todpause = $("#todpause");
    this.todFastRate = $("#todFastRate");

    this.TODs = [];
    this.IsTOD = false;
    this.CurTODId = "";
    this.ShowTODOps(false);
    this.pause = false;
    var self = this;
    this.todplay.click(function () {
        self.pause = false;
        self._play(1);
    });
    this.todpause.click(function () {
        self.pause = !self.pause;
        self.todpause.linkbutton({ iconCls: self.pause ? 'icon-continue' : 'icon-pause' });
        self._play(self.pause ? 2 : 3);
    });
    this.todFastRate.numberbox({
            value : 1,
            onChange:function (newValue, oldValue){
                self.SetPlayRate(newValue);
            },
    });

    context.Event.on("OnDataSet", function (currentdata) {
        if(currentdata && currentdata.asseturl.indexOf("TOD") != -1 && self.todFastRate)
        {
            self.todFastRate.numberbox('setValue', 1);
        }
    });
}

TOD.prototype.ShowTODOps = function(flag) {
    var todSpan = document.getElementById('todSpan');
    if(!todSpan) return;
    if(!this.IsTOD || !this.kfApp.IsRemoteData) 
    {
        var todSpan = document.getElementById('todSpan');
        todSpan.hidden = true;
        return;
    }
    todSpan.hidden = !flag;
}

//mode == 1 play; mode == 2 pause; mode == 3 resume; 
TOD.prototype._play = function(mode) {
    var curObj = null;
    for(var i = 0; i < this.TODs.length; ++i)
    {
        if(this.TODs[i].Path == this.CurTODId)
        {
            curObj = this.TODs[i];
            break;
        }
    }
    if(curObj == null) return;
    if(mode == 1)
    {
        curObj.Set("KFTODPlay", null, true);
    }
    else if(mode == 2)
    {
        curObj.Set("KFTODPause", null, true);
    }
    else if(mode == 3)
    {
        curObj.Set("KFTODResume", null, true);
    }
}

TOD.prototype.FastForward = function () {
    var curObj = null;
    for(var i = 0; i < this.TODs.length; ++i)
    {
        if(this.TODs[i].Path == this.CurTODId)
        {
            curObj = this.TODs[i];
            break;
        }
    }
    if(curObj == null) return;
    curObj.Set("KFTODFastForWard", null, true);
}

TOD.prototype.FastBackward = function () {
    var curObj = null;
    for(var i = 0; i < this.TODs.length; ++i)
    {
        if(this.TODs[i].Path == this.CurTODId)
        {
            curObj = this.TODs[i];
            break;
        }
    }
    if(curObj == null) return;
    curObj.Set("KFTODFastBackWard", null, true);
}

TOD.prototype.SetPlayRate = function (PlayRate) {
    var curObj = null;
    for(var i = 0; i < this.TODs.length; ++i)
    {
        if(this.TODs[i].Path == this.CurTODId)
        {
            curObj = this.TODs[i];
            break;
        }
    }
    if(curObj == null) return;
    curObj.Set('PlayRate', parseInt(PlayRate));
}

TOD.prototype.Dispose = function () {
    if (this.disposed) {
        console.error("TOD Control had been disposed!");
        return;
    }
    this.disposed = true;
    this.RemoveListeners();

    this.kfApp = null;
    this.context = null;

    this.TODs = [];
    this.IsTOD = false;
    this.CurTODId = "";
    this.pause = false;
    this.ShowTODOps(false);
}

TOD.prototype.AddListeners = function () {
    this.onlineRpcMgr = _global.editor.network ?.rpcobjsonline;
    if (this.onlineRpcMgr) {
        this.onlineRpcMgr.objmgr.Event.on("OnNetObjsChanged", this.NetObjsChangedFunc.bind(this));

        this.onlineRpcMgr.objmgr.Event.on("OnNetObjDestroy", this.NetObjDeletedFunc.bind(this));
        this.onlineRpcMgr.objmgr.Event.on("OnNetObjAdd", this.NetObjAddedFunc.bind(this));
    }
}

TOD.prototype.RemoveListeners = function () {
    if (this.onlineRpcMgr) {
        this.onlineRpcMgr.objmgr.Event.off("OnNetObjsChanged", this.NetObjsChangedFunc.bind(this));

        this.onlineRpcMgr.objmgr.Event.off("OnNetObjDestroy", this.NetObjDeletedFunc.bind(this));
        this.onlineRpcMgr.objmgr.Event.off("OnNetObjAdd", this.NetObjAddedFunc.bind(this));   //这个移除应该有问题？？？
    }
}

TOD.prototype.NetObjsChangedFunc = function (objs) {
    
    this.TODs = [];
    for(var i in objs)
    {
        if(objs[i].Path.indexOf("TOD") != -1 && objs[i].__cls__ == 'KF8RpcTODActor' && objs[i].InstName && objs[i].InstName != "")
        {
            this.TODs.push(objs[i]);
        }
    }
}

TOD.prototype.NetObjDeletedFunc = function (obj) {
    if(obj)
    {
        if(obj.__cls__ == 'KF8RpcTODActor')
        {
            obj.Event.off("OnDirL_RotatorXChanged", this.OnDirL_RotatorXChanged.bind(this, obj));
            obj.Event.off("OnDirL_IntensityChanged", this.OnDirL_IntensityChanged.bind(this, obj));
            obj.Event.off("OnDirL_ColorChanged", this.OnDirL_ColorChanged.bind(this, obj));
            obj.Event.off("OnDirL_NearShadowColorChanged", this.OnDirL_NearShadowColorChanged.bind(this, obj));
            obj.Event.off("OnDirL_FarShadowColorChanged", this.OnDirL_FarShadowColorChanged.bind(this, obj));
            obj.Event.off("OnSkyL_IntensityChanged", this.OnSkyL_IntensityChanged.bind(this, obj));
            obj.Event.off("OnSkyL_ColorChanged", this.OnSkyL_ColorChanged.bind(this, obj));

            obj.Event.off("OnFrameIndexChanged", this.OnFrameIndexChanged.bind(this, obj));
        }
    }
}

TOD.prototype.NetObjAddedFunc = function (obj) {
    if(obj)
    {
        if(obj.__cls__ == 'KF8RpcTODActor')
        {
            obj.Event.on("OnDirL_RotatorXChanged", this.OnDirL_RotatorXChanged.bind(this, obj));
            obj.Event.on("OnDirL_IntensityChanged", this.OnDirL_IntensityChanged.bind(this, obj));
            obj.Event.on("OnDirL_ColorChanged", this.OnDirL_ColorChanged.bind(this, obj));
            obj.Event.on("OnDirL_NearShadowColorChanged", this.OnDirL_NearShadowColorChanged.bind(this, obj));
            obj.Event.on("OnDirL_FarShadowColorChanged", this.OnDirL_FarShadowColorChanged.bind(this, obj));
            obj.Event.on("OnSkyL_IntensityChanged", this.OnSkyL_IntensityChanged.bind(this, obj));
            obj.Event.on("OnSkyL_ColorChanged", this.OnSkyL_ColorChanged.bind(this, obj));

            obj.Event.on("OnFrameIndexChanged", this.OnFrameIndexChanged.bind(this, obj));
        }
    }
}

//C++侧触发过来
TOD.prototype.OnDirL_RotatorXChanged = function (obj) {
    if(obj)
    {
        _global.Event.emit("OnTODObjChanged", obj);
    }
}

TOD.prototype.OnDirL_IntensityChanged = function (obj) {
    if(obj)
    {
        _global.Event.emit("OnTODObjChanged", obj);
    }
}

TOD.prototype.OnDirL_ColorChanged = function (obj) {
    if(obj)
    {
        _global.Event.emit("OnTODObjChanged", obj);
    }
}

TOD.prototype.OnDirL_NearShadowColorChanged = function (obj) {
    if(obj)
    {
        _global.Event.emit("OnTODObjChanged", obj);
    }
}

TOD.prototype.OnDirL_FarShadowColorChanged = function (obj) {
    if(obj)
    {
        _global.Event.emit("OnTODObjChanged", obj);
    }
}

TOD.prototype.OnSkyL_IntensityChanged = function (obj) {
    if(obj)
    {
        _global.Event.emit("OnTODObjChanged", obj);
    }
}

TOD.prototype.OnSkyL_ColorChanged = function (obj) {
    if(obj)
    {
        _global.Event.emit("OnTODObjChanged", obj);
    }
}

TOD.prototype.OnFrameIndexChanged = function (obj) {
    if(obj)
    {
        _global.Event.emit("OnTODFrameIndexChanged", obj);
    }
}