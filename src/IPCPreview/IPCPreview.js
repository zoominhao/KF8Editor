let IPCPreview = function ()
{
    let self = this;

    _global.Event.on("OnFrameChange", this.OnFrameChange.bind(this));
    _global.Event.on("OnBeforeSave", function (blkdata)
    {
        let previewFrame = $("#previewFrame").get(0);
        if(previewFrame && previewFrame.contentWindow && previewFrame.contentWindow.SaveBlkData)
        {
            previewFrame.contentWindow.SaveBlkData(blkdata);
        }
    });

    window.addEventListener("message", function (event) {
        self.OnMessageEvent(event);
    });

    this.previewFrame = null;
    this.previewwindow = null;

    $(document).ready(function () {
        self.OnDocumentReady();
    });
}

IPCPreview.prototype.keydown = function(event){
    event.preventDefault = function(){};
    _global.Event.emit("OnPreviewKeyDown",event);
}

IPCPreview.prototype.OnDocumentReady = function()
{
    let self = this;

    $("#scale-select").change(function () {
         let scale = parseFloat($( this ).val());
        _global.editorConfig.scale = scale;
        self.OnScaleChange(scale);
    });

    $('#bgcolorsel').color({
        onChange: function(value){
            let color = parseInt(value.replace("#","0x"),16);
            _global.editorConfig.bgcolor = color;
            self.OnBGColorChange(color);
        }
    });
    
    
    $('#align-select').change(function () {
        let alignval = parseFloat($( this ).val());
        _global.editorConfig.align = alignval;
        self.OnAlignChange(alignval);
    });
}

IPCPreview.prototype.OnZoomEvent = function(zoom)
{
    //let mousepos = CVEventPosition(event);

    //let nodecanvas = app.nodecanvas;
    //let loc = nodecanvas.nodecontainer.toLocal(mousepos);

    //nodecanvas.ZoomContainer(zoom, loc);

    let scale = _global.editorConfig.scale;
    scale = scale + 0.05 * zoom;
    if(scale < 0.05) scale = 0.05;
    else if(scale > 3.0) scale = 3.0;

    if(_global.editorConfig.scale != scale)
    {
        _global.editorConfig.scale = scale;

       // console.log(scale);

        //$("#scale-select").text((scale * 100) + '%');
        $('#scale-select').val("0.1");

        $('#scale-select').find(':selected').html(Math.round(scale * 100) + '%');

        this.OnScaleChange(scale);
    }
}


IPCPreview.prototype.OnMessageEvent = function(event){

    //console.log(event);
    let arg = event.data;
    if(arg){
        let type = arg.type;
        let method = this[type];
        if(method){
            method.call(this, arg.data);
        }
    }
}

IPCPreview.prototype.GetPreviewWindow = function()
{
    if(this.previewwindow != null) {
        return this.previewwindow;
    }

    if(this.previewFrame == null)
    this.previewFrame = document.getElementById("previewFrame");

    if(this.previewFrame && this.previewwindow == null)
    {
        this.previewwindow = this.previewFrame.contentWindow;
    }
    return this.previewwindow;
}

IPCPreview.prototype.PostMessage = function(name,data)
{
    if(null == this.previewwindow){
        this.GetPreviewWindow();
    }
    if(this.previewwindow){
        this.previewwindow.postMessage({type:name,data:data},"*");
    }
}

IPCPreview.prototype.OnPreviewReady = function(data)
{
    this.OnFrameChange(_global.editorConfig.CurrentFrameIndex);
    this.OnScaleChange(_global.editorConfig.scale);
    this.OnBGColorChange(_global.editorConfig.bgcolor);
    this.OnAlignChange(_global.editorConfig.align);
}

IPCPreview.prototype.OnScaleChange = function(scale)
{
    this.PostMessage("OnScaleChange", scale);
}

IPCPreview.prototype.OnBGColorChange = function(color)
{
    this.PostMessage("OnBGColorChange", color);
}

IPCPreview.prototype.OnAlignChange = function(align)
{
    this.PostMessage("OnAlignChange", align);
}

IPCPreview.prototype.OnFrameChange = function(frameindex)
{
    this.PostMessage("OnFrameChange", frameindex);
}

IPCPreview.prototype.OpenPreview = function (context, metaclass, blkdata)
{
    var editFlag = context.GetEditFlag(metaclass, blkdata.blk.data.object);
    var editClass = context.GetEditClass(metaclass);
    
    if(editClass == null || !editFlag)
    {
        $("#previewFrame").attr("src","src/IPCPreview/ExcelPreview/NoPreview.html");
        $("#mainlayout").layout('collapse','south');
    }
    else
    {
        if(editClass.indexOf("URL:") != -1)
       {
           let editPath = editClass.replace("URL:","src/IPCPreview/ExcelPreview/");
           $("#previewFrame").attr("src",editPath);
           $("#mainlayout").layout('expand','south');
       }

        //var previewURL = "http://localhost:9527/Html/Preview.html?editclass=";
        //var asseturl = encodeURIComponent(blkdata.asseturl);
        //previewURL += editClass + "&asset=" + asseturl;
        //$("#previewFrame").attr("src", previewURL);
    }
}

IPCPreview.prototype.ReloadPreview = function()
{
    let src = $("#previewFrame").attr("src");
    if(src && src != "" && src.indexOf("NoPreview") == -1)
    {
        $("#previewFrame").attr("src", src);
    }
}

_global.ipcpreview = new IPCPreview();
