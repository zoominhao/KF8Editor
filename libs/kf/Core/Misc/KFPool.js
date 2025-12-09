define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let KFPool = /** @class */ (function () {
        function KFPool(newfunc) {
            this.m_pool = [];
            this.m_newfunc = newfunc;
        }
        KFPool.prototype.clear = function () {
            this.m_pool = [];
        };
        KFPool.prototype.Fetch = function () {
            if (this.m_pool.length > 0) {
                let tmp = this.m_pool.pop();
                return tmp;
            }
            if (this.m_newfunc)
                return this.m_newfunc();
            return null;
        };
        KFPool.prototype.Recycle = function (obj) {
            if (obj) {
                this.m_pool.push(obj);
            }
        };
        return KFPool;
    }());
    exports.KFPool = KFPool;
});
