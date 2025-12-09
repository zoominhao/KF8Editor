define(["require", "exports", "./URLRequestMethod", "./URLLoaderDataFormat", "./URLVariables", "./Request/HttpRequest", "./Request/HttpMethod", "../../Core/Misc/TypeEvent", "./Request/HttpResponseType"], function (require, exports, URLRequestMethod_1, URLLoaderDataFormat_1, URLVariables_1, HttpRequest_1, HttpMethod_1, TypeEvent_1, HttpResponseType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function $getUrl(request) {
        var url = request.url;
        //get请求没有设置参数，而是设置URLVariables的情况
        if (url.indexOf("?") == -1 && request.method == URLRequestMethod_1.URLRequestMethod.GET && request.data && request.data instanceof URLVariables_1.URLVariables) {
            url = url + "?" + request.data.toString();
        }
        return url;
    }
    var URLLoader = /** @class */ (function () {
        function URLLoader(request) {
            if (request === void 0) { request = null; }
            this.IO_ERROR_Event = new TypeEvent_1.TypeEvent();
            this.COMPLETE_Event = new TypeEvent_1.TypeEvent();
            this.dataFormat = URLLoaderDataFormat_1.URLLoaderDataFormat.TEXT;
            this.data = null;
            this._request = null;
            this._status = -1;
            if (request) {
                this.load(request);
            }
        }
        URLLoader.prototype.geturl = function () {
            return this._request ? this._request.url : "";
        };
        URLLoader.prototype.load = function (request) {
            this._request = request;
            this.data = null;
            var loader = this;
            if (loader.dataFormat == URLLoaderDataFormat_1.URLLoaderDataFormat.TEXTURE) {
                ///TODO
                return;
            }
            if (loader.dataFormat == URLLoaderDataFormat_1.URLLoaderDataFormat.SOUND) {
                ///TODO
                return;
            }
            var virtualUrl = $getUrl(request);
            var httpRequest = HttpRequest_1.HttpRequest_Type.new_instance();
            httpRequest.open(virtualUrl, request.method == URLRequestMethod_1.URLRequestMethod.POST ? HttpMethod_1.HttpMethod.POST : HttpMethod_1.HttpMethod.GET);
            var sendData;
            if (request.method == URLRequestMethod_1.URLRequestMethod.GET || !request.data) {
            }
            else if (request.data instanceof URLVariables_1.URLVariables) {
                httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                var urlVars = request.data;
                sendData = urlVars.toString();
            }
            else {
                httpRequest.setRequestHeader("Content-Type", "multipart/form-data");
                sendData = request.data;
            }
            var length = request.requestHeaders.length;
            for (var i = 0; i < length; i++) {
                var urlRequestHeader = request.requestHeaders[i];
                httpRequest.setRequestHeader(urlRequestHeader.name, urlRequestHeader.value);
            }
            httpRequest.COMPLETE_Event.on(function (res) {
                loader.data = httpRequest.response;
                loader.COMPLETE_Event.emit(loader);
            });
            httpRequest.IO_ERROR_Event.on(function (res) {
                loader.IO_ERROR_Event.emit(loader);
            });
            httpRequest.responseType = loader.dataFormat == URLLoaderDataFormat_1.URLLoaderDataFormat.BINARY ? HttpResponseType_1.HttpResponseType.ARRAY_BUFFER : HttpResponseType_1.HttpResponseType.TEXT;
            httpRequest.send(sendData);
        };
        URLLoader.prototype.getResponseType = function (dataFormat) {
            switch (dataFormat) {
                case URLLoaderDataFormat_1.URLLoaderDataFormat.TEXT:
                case URLLoaderDataFormat_1.URLLoaderDataFormat.VARIABLES:
                    return URLLoaderDataFormat_1.URLLoaderDataFormat.TEXT;
                case URLLoaderDataFormat_1.URLLoaderDataFormat.BINARY:
                    return "arraybuffer";
                default:
                    return dataFormat;
            }
        };
        URLLoader.prototype.__recycle = function () {
            this._request = null;
            this.data = null;
        };
        return URLLoader;
    }());
    exports.URLLoader = URLLoader;
});
