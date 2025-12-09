/*
 * 给所有的字符串分配一个ID
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let KFDNameStrings = /** @class */ (function () {
        function KFDNameStrings() {
            ///找字符串的索引
            this._Strings2ID = {};
            ///所有字符串的集合
            this._ID2Strings = [];
            this._ID2Strings.push("");
        }
        KFDNameStrings.prototype.GetNameID = function (namestr) {
            if (namestr === "")
                return 0;
            let nameid = this._Strings2ID[namestr];
            if (nameid) {
                return nameid;
            }
            return this.__NewNameID(namestr);
        };
        KFDNameStrings.prototype.GetNameStr = function (nameid) {
            if (nameid <= 0)
                return "";
            return this._ID2Strings[nameid];
        };
        KFDNameStrings.prototype.__NewNameID = function (namestr) {
            this._ID2Strings.push(namestr);
            let nameid = this._ID2Strings.length - 1;
            this._Strings2ID[namestr] = nameid;
            return nameid;
        };
        return KFDNameStrings;
    }());
    exports.KFDNameStrings = KFDNameStrings;

    let KFDName = /** @class */ (function () {
        function KFDName(namestr) {
            if (namestr === void 0) { namestr = ""; }
            this.value = 0;
            this.value = KFDName._Strs.GetNameID(namestr);
        }
        KFDName.prototype.setString = function (namestr) {
            this.value = KFDName._Strs.GetNameID(namestr);
            return this;
        };
        KFDName.prototype.toString = function () {
            return KFDName._Strs.GetNameStr(this.value);
        };
        KFDName.Val = function (str) { return KFDName._Strs.GetNameID(str); };
        KFDName._Strs = new KFDNameStrings();
        KFDName._Param = new KFDName();
        KFDName.NONE = new KFDName();
        return KFDName;
    }());
    exports.KFDName = KFDName;

    function NVal(str) {
        return KFDName._Strs.GetNameID(str);
    }
    exports.NVal = NVal;
});