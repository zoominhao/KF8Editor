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
define(["require", "exports", "../Log/KFLog", "../../KFData/Format/KFDName"],
    function (require, exports, KFLog, KFName) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ///一个抽象的META不用直接实例化
    let AMeta = /** @class */ (function () {
        function AMeta(name, func, execSide) {
            if (name === void 0) { name = ""; }
            if (func === void 0) { func = null; }
            if (execSide === void 0) { execSide = 3; }
            this.execSide = execSide;
            this.SetDefaultFactroy(name, func);
        }
        AMeta.prototype.SetDefaultFactroy = function (namestr, func) {
            if (func === void 0) { func = null; }
            this.name = new KFName.KFDName(namestr);
            if (func == null) {
                if (this.instantiate == null) {
                    this.instantiate = function () {
                        return null;
                    };
                }
            } else {
                this.instantiate = func;
            }
        };
        return AMeta;
    }());
    exports.AMeta = AMeta;
    let IKFMeta = /** @class */ (function (_super) {
        __extends(IKFMeta, _super);
        function IKFMeta(name, func, execSide) {
            if (name === void 0) { name = ""; }
            if (func === void 0) { func = null; }
            if (execSide === void 0) { execSide = 3; }
            return _super.call(this, name, func, execSide) || this;
        }
        IKFMeta.prototype.SetDefaultFactroy = function (namestr, func) {
            if (func === void 0) { func = null; }
            _super.prototype.SetDefaultFactroy.call(this, namestr, func);
            if (this.name.value) {
                KFMetaManager.Register(this);
            }
        };
        return IKFMeta;
    }(AMeta));
    exports.IKFMeta = IKFMeta;
    var DefaultType = /** @class */ (function () {
        function DefaultType() {
            this.instance = null;
        }
        DefaultType.prototype.new_default = function () {
            var rest = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                rest[_i] = arguments[_i];
            }
            if (this.instance == null) {
                if (this.meta != null) {
                    this.instance = this.meta.instantiate.apply(null, rest);
                }
            }
            return this.instance;
        };
        DefaultType.prototype.new_instance = function () {
            var rest = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                rest[_i] = arguments[_i];
            }
            if (this.meta == null)
                return null;
            var instance = this.meta.instantiate.apply(null, rest);
            return instance;
        };
        return DefaultType;
    }());
    exports.DefaultType = DefaultType;
    var KFMetaManager = /** @class */ (function () {
        function KFMetaManager(startid, name) {
            if (startid === void 0) { startid = 1; }
            if (name === void 0) { name = "Meta"; }
            this.typeidstart = 1;
            this.m_name = "";
            this.m_metas = [];
            this.m_mapMetas = {};
            this.typeidstart = startid;
            this.m_name = name;
        }
        KFMetaManager.prototype._Register = function (meta) {
            var namevalue = meta.name.value;
            if (meta.type > 0 || namevalue === 0) {
                return false;
            }
            var namestr = meta.name.toString();
            var oldmeta = this.m_mapMetas[namevalue];
            if (oldmeta) {
                meta.type = oldmeta.type;
                KFLog.LOG_WARNING("[{0}] {1}[type:{2}]注册重复", this.m_name, namestr, meta.type);
                return;
            }
            this.m_metas.push(meta);
            meta.type = this.m_metas.length;
            this.m_mapMetas[namevalue] = meta;
            KFLog.LOG("[{0}] {1}[type:{2}]注册成功", this.m_name, namestr, meta.type);
            return true;
        };
        KFMetaManager.prototype._GetMetaType = function (type) {
            var i = type - this.typeidstart;
            if (i < 0) return null;
            return this.m_metas[i];
        };
        KFMetaManager.prototype._GetMetaName = function (name) {
            if (name.value <= 0) return null;
            return this.m_mapMetas[name.value];
        };
        KFMetaManager.Register = function (meta) {
            return KFMetaManager._Inst._Register(meta);
        };
        KFMetaManager.GetMetaType = function (type) {
            return KFMetaManager._Inst._GetMetaType(type);
        };
        KFMetaManager.GetMetaName = function (name) {
            return KFMetaManager._Inst._GetMetaName(name);
        };
        KFMetaManager._Inst = new KFMetaManager();
        return KFMetaManager;
    }());
    exports.KFMetaManager = KFMetaManager;
});
