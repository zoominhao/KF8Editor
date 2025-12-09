define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var URLLoaderDataFormat = /** @class */ (function () {
        function URLLoaderDataFormat() {
        }
        URLLoaderDataFormat.BINARY = "binary";
        URLLoaderDataFormat.TEXT = "text";
        URLLoaderDataFormat.VARIABLES = "variables";
        URLLoaderDataFormat.TEXTURE = "texture";
        URLLoaderDataFormat.SOUND = "sound";
        return URLLoaderDataFormat;
    }());
    exports.URLLoaderDataFormat = URLLoaderDataFormat;
});
