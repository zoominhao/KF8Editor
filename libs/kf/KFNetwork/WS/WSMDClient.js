var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "../../Core/Misc/KFEventTable", "../../KFData/Utils/FKByteArray", "../../Core/Log/KFLog", "../../KFData/Format/KFDName", "./IWebSocket"], function (require, exports, KFEventTable_1, FKByteArray_1, KFLog_1, KFDName_1, IWebSocket_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WSMDClient = /** @class */ (function (_super) {
        __extends(WSMDClient, _super);
        function WSMDClient(option) {
            if (option === void 0) { option = null; }
            var _this = _super.call(this) || this;
            _this.isConnected = false;
            _this._token = "";
            ///如果连接成功后更改成服务端分配的ID
            _this._localID = 0;
            ///此ID需要记住只用于登录时候用
            _this._remoteID = 0;
            _this._userName = "";
            _this._onDataEvt = new KFEventTable_1.KFEvent(KFDName_1.KFDName._Param.setString("onData"));
            _this._onLoginEvt = new KFEventTable_1.KFEvent(KFDName_1.KFDName._Param.setString("onLogin"));
            _this._onCloseEvt = new KFEventTable_1.KFEvent(KFDName_1.KFDName._Param.setString("onClose"));
            _this._onPeersOnlineEvt = new KFEventTable_1.KFEvent(KFDName_1.KFDName._Param.setString("onPeersOnline"));
            _this._onPeersOfflineEvt = new KFEventTable_1.KFEvent(KFDName_1.KFDName._Param.setString("onPeersOffline"));
            _this._islogined = false;
            _this._remoteNodes = {}
            _this.setparam(option);
            var buffsize = option && option.buffsize ? option.buffsize : 32;
            _this._writebuff = new FKByteArray_1.KFByteArray(null, buffsize * 1024);
            _this._readdata = {
                cmd: 0,
                evtlen: 0,
                bodytype: 0,
                datalen: 0,
                fromid: 0,
                toid: 0,
                evt: "",
                datastr: "",
                databytes: new FKByteArray_1.KFByteArray(null, buffsize * 1024)
            };
            return _this;
        }
        WSMDClient.prototype.isLogined = function () { return this._islogined; };
        WSMDClient.prototype.getLocalID = function () { return this._localID; };
        WSMDClient.prototype.onConntected = function (evt) {
            KFLog_1.LOG("连接成功发送登陆信息...");
            this.isConnected = true;
            if (this._remoteID == 0)
                this._remoteID = this._localID;
            var logindata = {
                token: this._token,
                remoteID: this._remoteID,
                userName: this._userName
            };
            this.write_pdata(JSON.stringify(logindata));
        };
        WSMDClient.prototype._onLoginData = function (dataobj) {
            var retinfo = JSON.parse(dataobj.datastr);
            KFLog_1.LOG("retinfo: {0}", dataobj.datastr);
            var ret = retinfo.ret;
            if (ret != 0) {
                var msg = retinfo.msg;
                KFLog_1.LOG_ERROR("登录失败:{0}", msg);
            }
            else {
                KFLog_1.LOG("登录成功");
                this._islogined = true;
                this._localID = retinfo.remoteID;
                this._remoteNodes = {}
                for (var node in retinfo.remoteList) {
                    this._remoteNodes[retinfo.remoteList[node].name] = {
                        "name" : retinfo.remoteList[node].name,
                        "remoteID" : retinfo.remoteList[node].remoteID,
                        "online" : retinfo.remoteList[node].online
                    };
                    KFLog_1.LOG("远程节点：{0}：{1}",
                        retinfo.remoteList[node].name,
                        retinfo.remoteList[node].remoteID);
                }
                this.FireEvent(this._onLoginEvt);
            }
        };
        WSMDClient.prototype.onData = function (evt) {
            var bytesarr = new FKByteArray_1.KFByteArray(evt.data);
            var isa = bytesarr.readByte();
            if (isa == 97) {
                bytesarr.Skip(2);
                var readdata = this._readdata;
                readdata.cmd = bytesarr.readShort();
                readdata.evtlen = bytesarr.readShort();
                readdata.bodytype = bytesarr.readByte();
                readdata.datalen = bytesarr.readInt();
                readdata.fromid = bytesarr.readUnsignedInt();
                readdata.toid = bytesarr.readUnsignedInt();
                readdata.evt = "";
                readdata.datastr = "";
                if (readdata.evtlen > 0) {
                    readdata.evt = bytesarr.readUTFBytes(readdata.evtlen);
                }
                if (readdata.datalen > 0) {
                    if (readdata.bodytype == 0) {
                        readdata.datastr = bytesarr.readUTFBytes(readdata.datalen);
                    }
                    else {
                        var bodybytes = readdata.databytes;
                        bodybytes.length = 0;
                        bytesarr.readBytes(bodybytes, 0, readdata.datalen);
                    }
                }
                if (this._islogined) {
                    /*LOG("收到数据from={0},cmd={1},len={2}"
                    ,       readdata.fromid
                        ,   readdata.cmd
                        ,   readdata.datalen);*/
                    if (readdata.cmd == 100) {
                        // 收到在线广播
                        var name = readdata.databytes.readUTFBytes(readdata.databytes.GetBuffAvailable);
                        this.update_remote_node(name, readdata.fromid, 1);
                        KFLog_1.LOG("有人进入了{0},{1}", name, readdata.fromid);
                        this._onPeersOnlineEvt.arg = {name:name, remoteID:readdata.fromid}
                        this.FireEvent(this._onPeersOnlineEvt);
                    } else if (readdata.cmd == 404) {
                        this.update_remote_node("", readdata.fromid, 0);
                        KFLog_1.LOG("有人离开了{0}", readdata.fromid);
                        this._onPeersOfflineEvt.arg = readdata.fromid;
                        this.FireEvent(this._onPeersOfflineEvt);
                    } else {
                        this._onDataEvt.arg = readdata;
                        this.FireEvent(this._onDataEvt);
                    }
                }
                else {
                    this._onLoginData(readdata);
                }
            }
            else {
                KFLog_1.LOG_ERROR("格式不下确断开连接了");
                var self_1 = this;
                self_1._ws.close(3000, "format error!");
            }
        };
        WSMDClient.prototype.onError = function (evt) {
            this.onClosed(evt);
        };
        WSMDClient.prototype.onClosed = function (evt) {
            this.isConnected = false;
            this._islogined = false;
            if (this._ws) {
                this._ws.onopen = null;
                this._ws.onerror = null;
                this._ws.onclose = null;
                this._ws.onmessage = null;
                this._ws = null;
            }
            this._remoteNodes = {}
            this.FireEvent(this._onCloseEvt);
        };
        WSMDClient.prototype.write_pdata = function (data, event, dataType, cmd, fromid, toid) {
            if (event === void 0) { event = null; }
            if (dataType === void 0) { dataType = 0; }
            if (cmd === void 0) { cmd = 0; }
            if (fromid === void 0) { fromid = 0; }
            if (toid === void 0) { toid = 0; }
            if (!this.isConnected)
                return;
            var databytes = data;
            if (typeof (data) == 'string') {
                databytes = this._writebuff.encodeUTF8(data);
                dataType = 0;
            }
            var evtbytes = null;
            if (event) {
                evtbytes = this._writebuff.encodeUTF8(event);
            }
            this._writebuff.length = 0;
            this._writebuff.writeByte(97);
            this._writebuff.writeByte(98);
            this._writebuff.writeByte(99);
            this._writebuff.writeShort(cmd);
            ///evtlen
            this._writebuff.writeShort(evtbytes ? evtbytes.length : 0);
            ///bodytype
            this._writebuff.writeByte(dataType);
            ///datalen
            this._writebuff.writeInt(databytes ? databytes.length : 0);
            this._writebuff.writeInt(fromid);
            this._writebuff.writeInt(toid);
            if (evtbytes) {
                this._writebuff._writeUint8Array(evtbytes);
            }
            if (databytes) {
                this._writebuff._writeUint8Array(databytes);
            }
            ///发送数据
            this._ws.send(this._writebuff.buffer);
        };
        /// toid:number|number[]
        WSMDClient.prototype.writefromfunc = function (toid, cmd, serialize, args, target) {
            if (target === void 0) { target = null; }
            if (!this.isConnected)
                return;
            var isnum = (typeof (toid) == "number");
            this._writebuff.length = 0;
            this._writebuff.writeByte(97);
            this._writebuff.writeByte(98);
            this._writebuff.writeByte(99);
            this._writebuff.writeShort(cmd);
            ///evtlen
            var evtlenpos = this._writebuff.GetPosition();
            this._writebuff.writeShort(0);
            ///bodytype
            this._writebuff.writeByte(1);
            ///datalen
            var bodylenpos = this._writebuff.GetPosition();
            this._writebuff.writeInt(0);
            this._writebuff.writeInt(this._localID);
            this._writebuff.writeInt(isnum ? toid : -2);
            var bodystart = 0;
            if (!isnum) {
                var toidarr = JSON.stringify(toid);
                var strlen = this._writebuff.writeUTFBytes(toidarr);
                bodystart = this._writebuff.GetPosition();
                this._writebuff.SetPosition(evtlenpos);
                this._writebuff.writeShort(strlen);
                this._writebuff.SetPosition(bodystart);
            }
            else
                bodystart = this._writebuff.GetPosition();
            serialize.call(target, this._writebuff, args);
            var endpos = this._writebuff.GetPosition();
            var cbodylen = endpos - bodystart;
            this._writebuff.SetPosition(bodylenpos);
            this._writebuff.writeInt(cbodylen);
            this._writebuff.SetPosition(endpos);
            ///发送数据
            this._ws.send(this._writebuff.buffer);
        };
        WSMDClient.prototype.setparam = function (option) {
            if (option) {
                this._token = option.token;
                this._localID = option.localID;
                this._userName = option.userName;
            }
        };
        WSMDClient.prototype.connect = function (url) {
            if (!this._ws) {
                var self_2 = this;
                this._ws = IWebSocket_1.IWebSocket_Type.new_instance(url);
                this._ws.binaryType = 'arraybuffer';
                this._ws.onopen = function (evt) {
                    self_2.onConntected(evt);
                };
                this._ws.onerror = function (evt) {
                    KFLog_1.LOG_ERROR("连接错误事件:{0}", evt);
                    self_2.onError(evt);
                };
                this._ws.onclose = function (evt) {
                    KFLog_1.LOG("断开连接事件...");
                    self_2.onClosed(evt);
                };
                this._ws.onmessage = function (evt) {
                    self_2.onData(evt);
                };
            }
        };
        WSMDClient.prototype.disconnect = function () {
            if (this._ws && this.isConnected) {
                this._ws.close(3000, "close by self");
            }
        };
        WSMDClient.prototype.get_remote_node = function(name) {
            if (name in this._remoteNodes) {
                return this._remoteNodes[name];
            }
            return null;
        }
        WSMDClient.prototype.get_remote_node_by_id = function(id) {
            for (let k in this._remoteNodes) {
                let node = this._remoteNodes[k];
                if (node.remoteID == id) {
                    return node;
                }
            }
            return null;
        }
        WSMDClient.prototype.get_remote_nodes = function() {
            return this._remoteNodes;
        }
        WSMDClient.prototype.update_remote_node = function(name, remoteID, online) {
            if (name !== void 0 && name != null && name != "") {
                this._remoteNodes[name] = {name:name, remoteID:remoteID, online:online};
                return;
            }
            if (remoteID <= 0){
                return;
            }
            for (let k in this._remoteNodes) {
                let node = this._remoteNodes[k];
                if (node.remoteID == remoteID) {
                    node.online = online;
                    return;
                }
            }
            return;
        }

        return WSMDClient;
    }(KFEventTable_1.KFEventTable));
    exports.WSMDClient = WSMDClient;
});