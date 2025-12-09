define(["require", "exports", "../../libs/kf/Core/Log/KFLog", "../../libs/kf/KFData/Utils/FKByteArray"],function(require, exports, KFLog_1, FKByteArray_1) {
    function KF8RpcFormat() {
    }

    KF8RpcFormat.write_value = function (bytearr, jsonobj) {
        let valueType = typeof jsonobj;
        let propinfo = {}
        if (valueType === "boolean") {
            propinfo["type"] = "bool";
        } else if (valueType === "string") {
            propinfo["type"] = "kfstr";
        } else if (valueType === "number") {
            if (Number.isInteger(jsonobj)) {
                propinfo["type"] = "int";
            } else {
                propinfo["type"] = "double";
            }
        } else if (jsonobj instanceof FKByteArray_1.KFByteArray) {
            propinfo["type"] = "kfBytes";
            jsonobj = { bytes:jsonobj };
        } else {
            propinfo = null
        }
        KFDJson.write_value(bytearr, jsonobj, propinfo);
    }

    function KF8Rpc(session) {
        this._session = session;
        this._reqId = 0;
        this._reqInvokers = {}
        this._retcallBack = {}
    }

    KF8Rpc.prototype.OnDataArrived = function (bytesarr) {
        if (!bytesarr) { return; }
        let isRsp = KFDJson.read_value(bytesarr);
        if (isRsp == null) {
            KFLog_1.LOG_ERROR("解包失败，isrsp字段取不到");
            return;
        }
        let rspId = KFDJson.read_value(bytesarr);
        if (rspId == null) {
            KFLog_1.LOG_ERROR("解包失败，rspId字段取不到");
            return;
        }
        // 收到回复
        if (isRsp) {
            if (rspId in this._retcallBack) {
                let ret = KFDJson.read_value(bytesarr);
                this._retcallBack[rspId](ret);
                delete this._retcallBack[rspId];
            }
        } else {
            // 收到请求
            let funcname = KFDJson.read_value(bytesarr);
            if (funcname in this._reqInvokers) {
                let params = []
                while (bytesarr.GetBuffAvailable > 0) {
                    let param = KFDJson.read_value(bytesarr);
                    params.push(param);
                }
                let ret = this._reqInvokers[funcname](...params);
                if (ret !== (void 0)) {
                    let ret_bytesarr = new FKByteArray_1.KFByteArray();
                    KF8RpcFormat.write_value(ret_bytesarr, true);
                    KF8RpcFormat.write_value(ret_bytesarr, rspId);
                    KF8RpcFormat.write_value(ret_bytesarr, ret);
                    this._session.SendBytes(ret_bytesarr.GetBuff(), bytesarr.GetBuffAvailable, 2);
                }
            }
        }
    }

    KF8Rpc.prototype.AsyncCall = function (func, funcname, ...args) {
        if (!this._session.IsSessionValid()) {
            KFLog_1.LOG_ERROR("{0} Session无效", this._session.GetRemoteName());
            return;
        }
        //KFLog_1.LOG("AsyncCall {0}", funcname);
        let bytesarr = new FKByteArray_1.KFByteArray();
        KF8RpcFormat.write_value(bytesarr, false);
        this._reqId = this._reqId + 1;
        KF8RpcFormat.write_value(bytesarr, this._reqId);
        KF8RpcFormat.write_value(bytesarr, funcname);
        for (let arg of args){
            KF8RpcFormat.write_value(bytesarr, arg);
        }
        this._session.SendBytes(bytesarr.GetBuff(), bytesarr.GetBuffAvailable, 2);
        if (func === void 0) { func = null; }
        if (func != null) {
            this._retcallBack[this._reqId] = func;
        }
    }

    KF8Rpc.prototype.RegisterFunc = function (funcname, func) {
        this._reqInvokers[funcname] = func;
    }

    KF8Rpc.prototype.UnRegisterFunc = function (funcname) {
        delete this._reqInvokers[funcname];
    }

    function KF8NetSession(netmgr, name = "") {
        this._netmgr = netmgr;
        this._remoteName = name;
        this._remoteID = 0;
        this._rpc = new KF8Rpc(this);
        this.Event = new PIXI.utils.EventEmitter();
    }

    KF8NetSession.prototype.Connect = function(name = "") {
        if(name === "") {
            if (this._remoteName !== "") {
                name = this._remoteName;
            } else {
                return;
            }
        }
        let node = this._netmgr.GetRemoteNode(name)
        if (node && node.online) {
            this._remoteName = name;
            this._remoteID = node.remoteID;
            this.Event.emit("OnConnected");
            KFLog_1.LOG("连接到远程节点：{0}", name);
        } else {
            //KFLog_1.LOG("找不到远程节点：{0}", name);
        }
    }

    KF8NetSession.prototype.ClearConnect = function() {
        this._remoteID = 0;
        this.Event.emit("OnDisconnected");
    }

    KF8NetSession.prototype.IsConnected = function() {
        return this._remoteID > 0;
    }

    KF8NetSession.prototype.IsSessionValid = function() {
        return this.IsConnected() &&
            this._netmgr.IsConnectionValid() &&
            this._netmgr.IsRemoteNoteValid(this._remoteID);
    }

    KF8NetSession.prototype.SendBytes = function(data, datalen, datatype = 1) {
        if (this._remoteID > 0) {
            this._netmgr.SendBytesTo(this._remoteID, data, datalen, datatype);
        }
    }

    KF8NetSession.prototype.GetRpc = function() {
        return this._rpc;
    }

    KF8NetSession.prototype.GetRemoteName = function() {
        return this._remoteName;
    }

    KF8NetSession.prototype.GetNetMgr = function() {
        return this._netmgr;
    }

    KF8NetSession.prototype.OnDataArrived = function (data) {
        //KFLog_1.LOG("NetSession有数据到达了fromid: {0}", data.fromid);
        if (data.bodytype === 2) {
            // rpc
            if (this._rpc) {
                this._rpc.OnDataArrived(data.databytes);
            }
        }
    }

    function KF8NetObject() {
        this._netObjMgr = null;
        this._registerFuncs = {};
        this.Event = new PIXI.utils.EventEmitter();
    }

    KF8NetObject.prototype.Init = function (netObjMgr) {
        this._netObjMgr = netObjMgr;
    }

    KF8NetObject.prototype.Dispose = function () {
        for (let k in this._registerFuncs) {
            this._netObjMgr.GetRpc().UnRegisterFunc(this.GetRegisterFuncName(k));
        }
        this._registerFuncs = null;
        this._netObjMgr = null;
        this.Event = null;
    }

    KF8NetObject.prototype.GetNetObjMgr = function () {
        return this._netObjMgr;
    }

    // 对象RPC调用
    KF8NetObject.prototype.AsyncCall = function (func, funcname, ...args) {
        return this._netObjMgr.GetRpc().AsyncCall(func, this.GetRegisterFuncName(funcname), ...args);
    }

    // 注册RPC函数
    KF8NetObject.prototype.RegisterRpc = function(funcname, func) {
        if (!this._registerFuncs[funcname]) {
            this._registerFuncs[funcname] = func;
            this._netObjMgr.GetRpc().RegisterFunc(this.GetRegisterFuncName(funcname), func);
        }
    }

    KF8NetObject.prototype.UnRegisterRpc = function(funcname) {
        if (this._registerFuncs[funcname]) {
            delete this._registerFuncs[funcname];
            this._netObjMgr.GetRpc().UnRegisterFunc(this.GetRegisterFuncName(funcname));
        }
    }

    KF8NetObject.prototype.GetRegisterFuncName = function(funcname) {
        return this.ID.toString() + "_" + funcname;
    }

    KF8NetObject.prototype.CopyFrom = function (obj) {
        let allKeys = Object.keys(obj);
        let baseKeys = Object.keys(new KF8NetObject());
        let baseKeysMap = {}
        for (let i in baseKeys) {
            baseKeysMap[baseKeys[i]] = true;
        }
        for (let i in allKeys) {
            let key = allKeys[i]
            if (key in baseKeysMap || key === "__cls__") {
                continue;
            }
            if (this[key] !== obj[key]) {
                this[key] = obj[key];
                this.Event.emit("On" + key + "Changed");
                this._netObjMgr.Event.emit("On" + key + "Changed",this);
            }
        }
    }
    
    // 远程设置属性
    KF8NetObject.prototype.Set = function (key, ...args) {
        if (this[key] === void 0) {
            this.AsyncCall(null, "Non_Field_Sync_Set_" + key, ...args);
        } else {
            if (args.length > 0) {
                var value = args[0];
                this.initChildKFDType(key, value);
                this.AsyncCall(null, "Set" + key, value);
            }
        }
    }

    // 远程获取属性
    KF8NetObject.prototype.Get = function (key, func, ...args) {
        if (this[key] === void 0) {
            this.AsyncCall(func, "Non_Field_Sync_Get_" + key, ...args);
        } else {
            func(this[key]);
        }
    }

    KF8NetObject.prototype.initChildKFDType = function(propname, obj) {
        if (!obj) return;
        let kfd = _global.editor.context.kfdtable.get_kfddata(this.__cls__);
        if (kfd && kfd.propertys) {
            for (let i in kfd.propertys) {
                var prop = kfd.propertys[i];
                if (prop.name === propname && prop.type === "object") {
                    obj.__cls__ = prop.otype;
                    break;
                }
            }
        }
    }

    function KF8NetObjectMgr(session)
    {
        let self = this;
        this._session = session;
        this._netObjects = {};
        this.IsConnected = false;

        this._session.GetRpc().RegisterFunc("SyncNetObjects", function (syncHelper) {
            self.SyncNetObjects(syncHelper);
        });
        let _onConnectedCallback = function() {
            self.SetRemoteTarget(null);
            self.UpdateNetObjectsFromRemote(null);
            self.IsConnected = true;
            self.Event.emit("OnConnected");
        };
        this._session.Event.on("OnConnected", _onConnectedCallback);
        this._session.Event.on("OnDisconnected", function() {
            self.IsConnected = false;
            self._netObjects = {}
            self.Event.emit("OnDisconnected");
        });
        setTimeout(function () {
            if (!self.IsConnected && self._session.IsSessionValid()) {
                _onConnectedCallback();
            }
        }, 1000);

        this.Event = new PIXI.utils.EventEmitter();
    }

    KF8NetObjectMgr.prototype.SyncNetObjects = function(syncHelper) {
        if (!syncHelper || !syncHelper.NetObjectOps) {
            KFLog_1.LOG_WARNING("SyncNetObjects null");
            return;
        }
        let netObjsChanged = false;
        for (let i in syncHelper.NetObjectOps) {
            let objop = syncHelper.NetObjectOps[i];
            let obj = objop.Obj;
            if (!obj || !obj.Init) {
                console.error("SyncNetObjects obj or Init null");
                continue;
            }
            //KFLog_1.LOG("NetObjectOp: {0}, {1}", obj.ID, objop.Op);
            if (objop.Op === 0) {
                obj.Init(this);
                this._netObjects[obj.ID] = obj;
                this.Event.emit("OnNetObjAdd", obj);
                netObjsChanged = true;
            } else if (objop.Op === 1) {
                if (obj.ID in this._netObjects) {
                    let oldObj = this._netObjects[obj.ID];
                    this.Event.emit("OnNetObjDestroy", oldObj);
                    if (oldObj) {
                        oldObj.Dispose();
                    }
                    delete this._netObjects[obj.ID];
                    netObjsChanged = true;
                }
            } else {
                obj.Init(this);
                let oldObj = this._netObjects[obj.ID]
                if (oldObj) {
                    oldObj.CopyFrom(obj);
                }
            }
        }
        if (netObjsChanged) {
            this.Event.emit("OnNetObjsChanged", this._netObjects);
        }
    }

    KF8NetObjectMgr.prototype.UpdateNetObjects = function(netObjMgr) {
        this._netObjects = {}
        let indexes = new Set();
        for (let i in netObjMgr.NetObjects) {
            let obj = netObjMgr.NetObjects[i];
            if (!obj || !obj.Init) {
                console.error("UpdateNetObjects obj or Init null, 0");
                continue;
            }
            indexes.add(obj.ID);
            //KFLog_1.LOG("NetObject: {0}, {1}, {2}, {3}", obj.ID, obj.Name, obj.Path, obj.ParentID);
            let oldObj = this._netObjects[obj.ID];
            if (oldObj === void 0 || oldObj == null) {
                obj.Init(this);
                this._netObjects[obj.ID] = obj;
                this.Event.emit("OnNetObjAdd", obj);
            } else {
                oldObj.CopyFrom(obj);
            }
        }
        for (let id in this._netObjects) {
            let obj = this._netObjects[id];
            if (!obj) {
                console.error("UpdateNetObjects obj null, 1");
                continue;
            }
            if (! id in indexes) {
                this.Event.emit("OnNetObjDestroy", obj);
                if (obj) {
                    obj.Dispose();
                }
                delete this._netObjects[id];
            }
        }
        this.Event.emit("OnNetObjsChanged", this._netObjects);
    }

    KF8NetObjectMgr.prototype.UpdateNetObjectsFromRemote = function(callback) {
        let self = this;
        this.GetRpc().AsyncCall(function (ret) {
            //KFLog_1.LOG("UpdateNetObjectsFromRemote ret");
            if (ret !== (void 0) && ret != null) {
                self.UpdateNetObjects(ret);
                if (callback) {
                    callback();
                }
            }
        }, "GetNetObjects");
    }

    KF8NetObjectMgr.prototype.SetRemoteTarget = function(callback) {
        this.GetRpc().AsyncCall(function (ret) {
            //KFLog_1.LOG("SetRemoteTarget ret");
            if (callback) {
                callback();
            }
        }, "SetTarget", this._session.GetNetMgr().UserName);
    }

    KF8NetObjectMgr.prototype.GetNetObject = function(id) {
        if (id in this._netObjects) {
            return this._netObjects[id];
        }
        return null;
    }

    KF8NetObjectMgr.prototype.GetNetObjects = function() {
        return this._netObjects;
    }

    KF8NetObjectMgr.prototype.GetRpc = function() {
        return this._session.GetRpc();
    }

    KF8NetObjectMgr.prototype.IsSessionValid = function () {
        return this._session.IsSessionValid();
    }

    function KF8NetManager(option,context) {
        context.SetKFDNewFuncs([
            {name:"KFRpcNetObject", func:function (){return new KF8NetObject();}},
            {name:"KF8EditNetObject", func:function (){return new KF8NetObject();}},
            {name:"KF8EditNetUEActor", func:function (){return new KF8NetObject();}},
            {name:"KF8EditNetUELog", func:function (){return new KF8NetObject();}},
            {name:"KF8EditNetUEEditorLevel", func:function (){return new KF8NetObject();}},
            {name:"KF8EditNetUEEditorLevelActor", func:function (){return new KF8NetObject();}},
            {name:"KF8EditNetUEEditorActor", func:function (){return new KF8NetObject();}},
            {name:"KF8RpcPlotActor", func:function (){return new KF8NetObject();}},
            {name:"KF8RpcPlotInst", func:function (){return new KF8NetObject();}},
            {name:"KF8RpcTODActor", func:function (){return new KF8NetObject();}},
            {name:"KF8NetDebugObject", func:function (){return new KF8NetObject();}}
        ]);

        option = option ? option : {userName:"KF8Editor",localID:100,token:"abc"};
        let wsc = new WSMDClient(option);
        let self =  this;

        this._shutdown = false;
        this.UserName = option.userName;
        this.Client = wsc;
        this._sessions = {};
        this._netObjMgrs = {};
        this.Event = new PIXI.utils.EventEmitter();

        // 心跳
        this._heartbeat = null;

        // tick
        this._tick = null;

        wsc.AddEventListener(wsc._onCloseEvt.type,function (event){
            self.CloseSessions();
            if (self._heartbeat) {
                clearInterval(self._heartbeat);
                self._heartbeat = null;
            }
            if (self._tick) {
                clearInterval(self._tick);
                self._tick = null;
            }
            if (!self._shutdown) {
                setTimeout(function (){
                    wsc.connect(self.url);
                }, 1000,);
                self.Event.emit("OnRemoteNodesChanged");
            } else {
                self.Clear();
            }
        });

        wsc.AddEventListener(wsc._onLoginEvt.type, function(event){
            // 广播在线
            let bytesarr = new FKByteArray_1.KFByteArray();
            bytesarr.writeUTFBytes(option.userName);
            let evt = "online";
            self.Client.write_pdata(bytesarr.GetBuff(), evt, 1, 100, self.Client.getLocalID(), -1);
            //KFLog_1.LOG("广播在线消息{0}", option.userName);

            self.UpdateSessions();

            // 每分钟心跳一次
            self._heartbeat = setInterval(function (){
                self.Client.write_pdata(bytesarr, "heartbeat", 1, 101, self.Client.getLocalID(), -1);
                //KFLog_1.LOG("{0}心跳", option.userName);
            }, 60000);

            // tick
            self._tick = setInterval(function(){
                self.UpdateSessions();
            }, 1000);

            self.Event.emit("OnRemoteNodesChanged");
        });

        wsc.AddEventListener(wsc._onPeersOnlineEvt.type, function(event){
            self.UpdateSessions();
            self.Event.emit("OnRemoteNodesChanged");
        })

        wsc.AddEventListener(wsc._onPeersOfflineEvt.type, function(event){
            self.CloseSession(event.arg);
            self.Event.emit("OnRemoteNodesChanged");
        })

        wsc.AddEventListener(wsc._onDataEvt.type, function(event){
            //KFLog_1.LOG("NetManager有数据到达了");
            let data = event.arg;
            if (data.fromid === 0) {
                return;
            }
            for (name in self._sessions) {
                let s = self._sessions[name];
                //KFLog_1.LOG("session: {0}, {1}, {2}", name, s._remoteID, data.fromid);
                if (s._remoteID === data.fromid) {
                    s.OnDataArrived(data);
                    return;
                }
            }
        });
    }

    KF8NetManager.prototype.Clear = function() {
        this.CloseSessions();
        if (this._heartbeat) {
            clearInterval(this._heartbeat);
            this._heartbeat = null;
        }
        if (this._tick) {
            clearInterval(this._tick);
            this._tick = null;
        }
        this.Client = null;
        this._sessions = null;
        this._netObjMgrs = null;
        if (this.Event) {
            this.Event.removeAllListeners();
            this.Event = null;
        }
    }

    KF8NetManager.prototype.GetSession = function(name) {
        if (name in this._sessions) {
            return this._sessions[name];
        }
        let s = new KF8NetSession(this, name);
        this._sessions[name] = s;
        return s;
    }

    KF8NetManager.prototype.UpdateSessions = function() {
        for (name in this._sessions) {
            let s = this._sessions[name];
            if (!s.IsConnected()){
                s.Connect();
            }
        }
    }

    KF8NetManager.prototype.CloseSessions = function() {
        if (!this._sessions) {
            return;
        }
        for (name in this._sessions) {
            let s = this._sessions[name];
            if (s.IsConnected()){
                s.ClearConnect();
            }
        }
    }

    KF8NetManager.prototype.CloseSession = function(remoteID) {
        for (name in this._sessions) {
            let s = this._sessions[name];
            if (s._remoteID === remoteID){
                s.ClearConnect();
                break;
            }
        }
    }

    KF8NetManager.prototype.GetNetObjMgr = function(name) {
        if (name in this._netObjMgrs) {
            return this._netObjMgrs[name];
        }
        let netObjMgr = new KF8NetObjectMgr(this.GetSession(name));
        this._netObjMgrs[name] = netObjMgr;
        let strs = name.split("|");
        if (strs.length > 0) {
            netObjMgr.hostname = strs[strs.length - 1];
        }
        else {
            netObjMgr.hostname = name;
        }

        return netObjMgr;
    }

    KF8NetManager.prototype.Connect = function (url) {
        this.url = url;
        this.Client.connect(url);
    }

    KF8NetManager.prototype.Disconnect = function () {
        if (this.Client) {
            this.Client.disconnect();
        }
    }

    KF8NetManager.prototype.Shutdown = function() {
        if (this._shutdown) {
            KFLog_1.LOG_ERROR("重复Shutdown了");
            return;
        }
        this.Disconnect();
        this._shutdown = true;
        let self = this;
        setTimeout(function (){
            self.Clear();
        }, 1000,);
    }

    KF8NetManager.prototype.SendBytesTo = function (toid, data, datalen, datatype = 1, cmd = 0) {
        this.Client.write_pdata(data, null, datatype, cmd, this.Client.getLocalID(), toid);
    }

    KF8NetManager.prototype.GetRemoteNode = function(name) {
        return this.Client.get_remote_node(name);
    }

    KF8NetManager.prototype.GetRemoteNodeById = function(id) {
        return this.Client.get_remote_node_by_id(id);
    }

    KF8NetManager.prototype.IsConnectionValid = function() {
        return this.Client.isLogined();
    }

    KF8NetManager.prototype.IsRemoteNoteValid = function(id) {
        let node = this.GetRemoteNodeById(id);
        return node != null && node.online === 1;
    }

    KF8NetManager.prototype.GetValidRemoteNodes = function () {
        let valid_nodes = []
        let nodes = this.Client.get_remote_nodes();
        for (let name in nodes) {
            let node = nodes[name];
            if (node.online === 1) {
                valid_nodes.push(node);
            }
        }
        return valid_nodes;
    }

    KF8NetManager.prototype.GetValidRemoteHosts = function () {
        let hosts = {}
        let valid_nodes = this.GetValidRemoteNodes();
        for (let i in valid_nodes) {
            let node = valid_nodes[i];
            let strs = node.name.split("|");
            if (strs.length > 0) {
                if (strs[strs.length - 1] !== "KF8Editor" && !hosts.hasOwnProperty(strs[0])) {
                    hosts[strs[0]] = node.remoteID.toString();
                }
            }
        }
        return hosts;
    }

    exports.KF8NetManager = KF8NetManager;
});
