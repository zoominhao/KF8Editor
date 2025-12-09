define(["require", "exports", "./KFD", "./KFDName"], function (require, exports, KFD_1, KFDName_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let KFDTable = /** @class */ (function () {
        function KFDTable() {
            this.kfddata_maps = {};
        }
        KFDTable.find_prop_info = function (kfddata, pid) {
            if (kfddata == null)
                return null;
            let __ids__ = kfddata["__ids__"];
            if (__ids__ == null) {
                __ids__ = {};
                kfddata["__ids__"] = __ids__;
                let propertys = kfddata["propertys"];
                let proplen = propertys.length;
                let i = 0;
                while (i < proplen) {
                    let prop = propertys[i];
                    __ids__[prop["id"]] = prop;
                    i += 1;
                }
            }
            return __ids__[pid];
        };
        KFDTable.find_extend_kfddata = function (kfddata, tb) {
            if (tb === void 0) { tb = null; }
            if (kfddata == null)
                return null;
            let __extend__ = kfddata["__extend__"];
            if (__extend__ == null && kfddata["extend"]) {
                if (tb == null)
                    tb = KFDTable.kfdTB;
                __extend__ = tb.get_kfddata(kfddata["extend"]);
                if (__extend__)
                    kfddata["__extend__"] = __extend__;
            }
            return __extend__;
        };
        KFDTable.getPropertyLable = function (prop) {
            if (prop.cname && prop.cname !== "")
                return prop.cname;
            return prop.name;
        };
        KFDTable.getKFDLable = function (kfd) {
            if (kfd.cname && kfd.cname !== "")
                return kfd.cname;
            return kfd.class;
        };
        KFDTable.getEnumValStr = function (defval, enumkfd) {
            ///形如class::xx,class.xx
            let defpropname = defval.replace(enumkfd["class"], "")
                .replace(/:/g, "")
                .replace(/\./g, "");
            let propertys = enumkfd.propertys;
            for (let i = 0; i < propertys.length; i++) {
                let prop = propertys[i];
                if (prop.name === defpropname) {
                    return prop.default;
                }
            }
            return null;
        };
        KFDTable.prototype.getDefaultStr = function (prop, defval) {
            let enumcls = prop.enum;
            if (enumcls && defval.indexOf(enumcls) !== -1) {
                let enumkfd = this.get_kfddata(enumcls);
                if (enumkfd) {
                    let defvarstr = KFDTable.getEnumValStr(defval, enumkfd);
                    if (defvarstr) {
                        return defvarstr;
                    }
                }
            }
            return defval;
        };
        KFDTable.prototype.getInitValue = function (prop, vtype) {
            let currenttb = this;
            if (vtype === KFD_1.KFDataType.OT_UNKNOW || KFD_1.KFDataType.Is_Number(vtype)) {
                let defval = 0;
                if (prop.default) {
                    defval = parseInt(currenttb.getDefaultStr(prop, prop.default));
                }
                return isNaN(defval) ? 0 : defval;
            } else if (vtype === KFD_1.KFDataType.OT_STRING) {
                let defval = prop.default ? currenttb.getDefaultStr(prop, prop.default) : "";
                if (prop && prop.type === "kfname") {
                    return new KFDName_1.KFDName(defval);
                }
                return defval;
            } else if (vtype === KFD_1.KFDataType.OT_BOOL) {
                return prop.default ? prop.default === "true" : false;
            } else if (vtype === KFD_1.KFDataType.OT_ARRAY || vtype === KFD_1.KFDataType.OT_MIXARRAY) {
                return [];
            } else if (vtype === KFD_1.KFDataType.OT_OBJECT) {
                return this.initObjectValue({}, this.get_kfddata(prop.otype));
            }
            return null;
        };
        KFDTable.prototype.initObjectValue = function (data, kfd) {
            let extend = kfd.extend;
            if (extend) {
                this.initObjectValue(data, this.get_kfddata(extend));
            }
            let propertys = kfd.propertys;
            for (let i = 0; i < propertys.length; i++) {
                let prop = propertys[i];
                let vtype = KFD_1.KFDataType.GetTypeID(prop.type);
                data[prop.name] = this.getInitValue(prop, vtype);
            }
            return data;
        };
        KFDTable.prototype.get_kfddata = function (clsname) {
            return this.kfddata_maps[clsname];
        };
        ///获取所有的继承类
        KFDTable.prototype.get_kfddatas_extend = function (clsname, includeself) {
            if (includeself === void 0) { includeself = false; }
            let all = [];
            for (let key in this.kfddata_maps) {
                let data = this.kfddata_maps[key];
                if (includeself && data["class"] === clsname) {
                }
                else if (this.is_extend(data, clsname)) {
                }
                else
                    data = null;
                if (data) {
                    let clsname_1 = data["class"];
                    ///显用
                    let cname = data["cname"];
                    let clslabel = (cname ? cname : clsname_1) + "[" + clsname_1 + "]";
                    all.push({ label: clsname_1, label0: clslabel, value: data });
                }
            }
            return all;
        };
        KFDTable.prototype.is_extendname = function (name, clsname, self) {
            if (self === void 0) { self = false; }
            if (self && name === clsname)
                return true;
            return this.is_extend(this.get_kfddata(name), clsname);
        };
        KFDTable.prototype.is_extend = function (kfddata, clsname, self) {
            if (self === void 0) { self = false; }
            if (self && kfddata["class"] === clsname)
                return true;
            let extend = kfddata["extend"];
            while (extend) {
                if (extend === clsname)
                    return true;
                kfddata = this.get_kfddata(extend);
                extend = kfddata ? kfddata["extend"] : null;
            }
            return false;
        };
        KFDTable.prototype.has_cls = function (clsname) {
            return this.kfddata_maps[clsname] != null;
        };
        KFDTable.prototype.add_kfd = function (kfd, AddFunc) {
            if (kfd instanceof Array) {
                for (let _i = 0, kfd_1 = kfd; _i < kfd_1.length; _i++) {
                    this._add_one_kfd(kfd_1[_i]);
                }
            } else {
                this._add_one_kfd(kfd);
            }
        };
        KFDTable.prototype._add_one_kfd = function (kfd, AddFunc) {
            let clsname = kfd["class"];
            if (clsname) {
                this.kfddata_maps[clsname] = kfd;
                if (AddFunc) {
                    AddFunc(kfd, clsname);
                }
            }
        }
        KFDTable.prototype.delete_kfd = function (clsname) {
            if (this.kfddata_maps[clsname]) {
                delete this.kfddata_maps[clsname];
            }
        }
        KFDTable.prototype.has_otype = function (otype) {
            if (otype === "")
                return true;
            if (KFD_1.KFDataType.Is_BaseTypeStr(otype))
                return true;
            return this.has_cls(otype);
        };
        KFDTable.kfdTB = new KFDTable();
        return KFDTable;
    }());
    exports.KFDTable = KFDTable;
});