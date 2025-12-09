define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let KFMath = /** @class */ (function () {
        function KFMath() {
        }
        KFMath.v3Val = function (name, v3) {
            if (v3) {
                let retv = v3[name];
                return isNaN(retv) ? 0 : retv;
            }
            return 0;
        };
        KFMath.v3Set = function (name, v3, val) {
            if (v3) {
                v3[name] = isNaN(val) ? 0 : val;
            }
        };
        KFMath.v3Setxyz = function (v3, x, y, z) {
            if (z === void 0) { z = 0; }
            if (v3) {
                v3.x = x;
                v3.y = y;
                v3.z = z;
            }
        };
        KFMath.v3New = function (x, y, z) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            let v3 = {
                __cls__: "kfVector3",
                x: x,
                y: y,
                z: z,
                setxyz: function (x, y, z) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                }
            };
            return v3;
        };
        return KFMath;
    }());
    exports.KFMath = KFMath;
});
