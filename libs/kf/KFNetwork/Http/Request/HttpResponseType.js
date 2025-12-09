define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var HttpResponseType = /** @class */ (function () {
        function HttpResponseType() {
        }
        HttpResponseType.TEXT = "text";
        HttpResponseType.ARRAY_BUFFER = "arraybuffer";
        return HttpResponseType;
    }());
    exports.HttpResponseType = HttpResponseType;
});
