function SearchWindow() {
}

SearchWindow.prototype.Init = function (context) {
    $('#opendevpanel').click(function ()
    {
        OpenDevToolsByID(_global.windowID);
    });

    this.SearchImpl = new SearchImpl(context);

    _global.Event.on("OnBlkOpenNew", function (data){
        let blkpath = data.path;
        OpenBlkInNewWindow(blkpath, _global.apppath, _global.kfdpath, _global.appdatapath);
    });
}

function ReadyContext()
{
    $.messager.progress({title:"环境准备中",msg:"资源加载中..."});
    let context = new EditorContext(
        _global.apppath
        , _global.appdatapath
        ,_global.kfdpath
        , true , function (blkdata){
            ///保持事件
        });

    context.Event.on("Complete",function ()
    {
        $.messager.progress('close');
        if(_global.searchWin == null)
        {
            _global.searchWin = new SearchWindow();
            _global.searchWin.Init(context);
        }
    });

    context.Ready();
}

_global.Event.on("Ready",function() {
    HttpRequest_Type.meta = WebHttpRequest.Meta;
    IKFFileIO_Type.meta = KFHttpFileIO.Meta;
    IKFFileIO_Type.new_default();
    ///绑定一些本地行为
    __Native.Ready();
    ///弹出设置环境

    const search_params = GetURLParams(document.location.toString());

    let kfdpath =  search_params.get('kfdpath');
    let apppath =  search_params.get('apppath');
    let appdatapath =  search_params.get('appdatapath');

    _global.windowID = parseInt(search_params.get('id'));
    _global.currentContentsID = GetwebContentsIDByWinID(_global.windowID);
    _global.mainContentsID = parseInt(search_params.get('maincid'));

    if(kfdpath == "" || apppath == "")
    {
        Nt("路径不能为空!");
        return;
    }

    _global.saveconfig(appdatapath,kfdpath,apppath);
    ///暂进这样处理吧
    _global.webrootpath = _global.apppath.replace("/Html","")
        .replace("\\Html","");

    ReadyContext();
});

///加载需要有库
loadjspackage(
    [
        "KFData"
        , "Core"
        , "KFNetwork"
    ]
    ,   "libs/kf/"
    ,   function(jspaths)
    {
        //console.log(JSON.stringify(jspaths));
        loadandincludejs(jspaths
            ,function()
            {
                _global.Event.emit("Ready");
            });
    }
    , ["src/m"]
);
