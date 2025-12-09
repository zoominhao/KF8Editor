define(["require", "exports", "../../KFData/Format/KFDName"], function (require, exports, KFDName_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let KFEvent = /** @class */ (function () {
        ///evtname:KFDName|number|string
        function KFEvent(evtname) {
            if (evtname === void 0) { evtname = null; }
            this.type = new KFDName_1.KFDName();
            let typstr = typeof (evtname);
            if (typstr === 'string') {
                this.type.value = KFDName_1.KFDName._Strs.GetNameID(evtname);
            } else if (typstr === "number") {
                this.type.value = evtname;
            } else {
                this.type.value = evtname == null ? 0 : evtname.value;
            }
        }
        return KFEvent;
    }());
    exports.KFEvent = KFEvent;

    let KFEventTable = /** @class */ (function () {
        function KFEventTable() {
            this._listenersMap = {};
        }
        KFEventTable.prototype.Clear = function () {
            this._listenersMap = {};
        };
        KFEventTable.prototype.AddEventListener = function (type, listener, target) {
            if (target === void 0) { target = null; }
            let evtlist = this._listenersMap[type.value];
            if (!evtlist) {
                evtlist = [];
                this._listenersMap[type.value] = evtlist;
            }
            evtlist.push({ func: listener, target: target });
        };
        KFEventTable.prototype.RemoveEventListener = function (type, listener) {
            let evtlist = this._listenersMap[type.value];
            if (evtlist) {
                let index = evtlist.length - 1;
                while (index >= 0) {
                    if (evtlist[index].func === listener) {
                        evtlist.splice(index, 1);
                        break;
                    }
                    index -= 1;
                }
            }
        };
        KFEventTable.prototype.FireEvent = function (event) {
            let listeners = this._listenersMap[event.type.value];
            if (listeners) {
                let count = listeners.length;
                for (let i = 0; i < count; i++) {
                    let itm = listeners[i];
                    itm.func.call(itm.target, event);
                }
            }
        };
        return KFEventTable;
    }());
    exports.KFEventTable = KFEventTable;
});
