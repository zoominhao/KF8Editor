define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TypeEvent = /** @class */ (function () {
        function TypeEvent() {
            let _this = this;
            this.listeners = [];
            this.listenersOncer = [];

            this.on = function (listener) {
                _this.listeners.push(listener);
                return {
                    dispose: function () { return _this.off(listener); }
                };
            };
            this.once = function (listener) {
                _this.listenersOncer.push(listener);
            };
            this.off = function (listener) {
                let callbackIndex = _this.listeners.indexOf(listener);
                if (callbackIndex > -1)
                    _this.listeners.splice(callbackIndex, 1);
            };
            this.emit = function (event) {
                let count = _this.listeners.length;
                for (let i = 0; i < count; i++) {
                    _this.listeners[i](event);
                }
                count = _this.listenersOncer.length;
                for (let i = 0; i < count; i++) {
                    _this.listenersOncer[i](event);
                }
                _this.listenersOncer = [];
            };
            this.pipe = function (te) {
                return _this.on(function (e) { return te.emit(e); });
            };
        }
        TypeEvent.prototype.clear = function () {
            this.listeners.length = 0;
            this.listenersOncer.length = 0;
        };
        return TypeEvent;
    }());
    exports.TypeEvent = TypeEvent;
});
