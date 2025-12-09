
function BlkLibrary(treedom)
{
    let blklib = this;
    this.descDict = new Array();
    this.ui = treedom;
    this.ui.tree({
        onDblClick: function(node){
            _global.Event.emit("OnBlkOpen", node);
        },
        onContextMenu: function(e, node)
        {
            e.preventDefault();
            if(node.children)
            {
                _global.CopyValue = node.path;

                let menuui =  $('#blklibmenu');

                //menuui.empty();
                //PathtoMenu(blklib.context.blkfilespath, menuui);

                //let itemx = menuui.menu('findItem', {name:'name2'});

               // menuui.menu('appendItem', {
               //     parent:   itemx.target,
               //     text:'new menu item',
               //     iconCls:'icon-save'
               // });

                menuui.menu('show', {
                    left: e.pageX,
                    top: e.pageY
                });


            }
            else
            {
                _global.CopyValue = node.path;

                let menuui =  $('#blkfilemenu');

                menuui.menu('show', {
                    left: e.pageX,
                    top: e.pageY
                });
            }
        }
        ,
        onExpand:function (node) {
            //node.state = "open";
            let libtreestate = blklib.context.libtreestates;
            libtreestate[node.path] = true;
        }
        ,
        onCollapse:function (node) {
            //node.state = "closed";
            let libtreestate = blklib.context.libtreestates;
            libtreestate[node.path] = false;
        },
        formatter:function(node){
            if(blklib.descDict[node.path])
            {
                return '<div id ="liblist" title="' + blklib.descDict[node.path] + '" class="easyui-tooltip">'+ node.text + '</div>';
            }
            else
            {
                return '<div id ="liblist">'+ node.text + '</div>';
            }
        }
    });
}

BlkLibrary.prototype.Start = function(context)
{
    this.context = context;
    this.context.Event.on("OnBlkfilesUpate", this.Update, this);
    let self = this;
    $('#blklibsearch').textbox({
        prompt:'Search',
        value:'',
        onChange: function (newValue, oldValue) {
            self.searchVal = newValue;
            self.Update(null, true);
            
        }
    })

    this.Update(null, false);
}

BlkLibrary.prototype.Update  = function (content, searchExpand)
{
    this.blkfiles = JSON.parse(JSON.stringify(this.context.blkfilespath));
    this.searchExpand = searchExpand == true;
    this.needRefresh = !this.searchVal || this.searchVal == "" || content == null;

    if(this.searchExpand)
    {
        if(this.searchVal && this.searchVal != "")
        {
            this.Contains(this.blkfiles[0]);
        }
    }
    if(this.descDict.length == 0)
    {
        this.BuildDescDict();
    }
    else
    {
        this.UpdataBlkTree();
    }
}

BlkLibrary.prototype.UpdataBlkTree = function()
{
    if(this.needRefresh)
    {
        this.ui.tree({data: this.blkfiles});
    }
    
    if(this.searchVal && this.searchVal != "" && this.searchExpand)
    {
        this.ui.tree("expandAll");
    }
}

BlkLibrary.prototype.Contains = function(blkFiles)
{
    if(blkFiles.hasOwnProperty("children"))
    {
        let flag = false;
        for(let i = blkFiles.children.length - 1; i >= 0; i--)
        {
            if(this.Contains(blkFiles.children[i]))
            {
                flag = true;
            }
            else
            {
                blkFiles.children.splice(i, 1);
            }  
        }
        return flag;
    }
    else if(blkFiles.hasOwnProperty("text"))
    {
        if(blkFiles.text.toLowerCase().indexOf(this.searchVal.toLowerCase()) != -1)
        {
            blkFiles.iconCls = "icon-search";
            return true;
        }
        else
        {
            return false;
        }
    }
}

BlkLibrary.prototype.BuildDescDict  = function ()
{
    if(this.descDict.length == 0)
    {
        let blklib = this;
        this.context.LoadBlk(_global.appdatapath + "/App/Editor/BLKDesc.blk", function (ret, blkdata, blkpath)
        {
            if (ret)
            {
                if(blkdata && blkdata.blk && blkdata.blk.data)
                {
                    let kv = KFDJson.read_value(blkdata.blk.data.bytes, false);
                    if(kv && kv.Rows)
                    {
                        for(var i = 0; i < kv.Rows.length; i++)
                        {
                            if(kv.Rows[i])
                            {
                                blklib.descDict[_global.appdatapath + "/" + kv.Rows[i].asseturl] = kv.Rows[i].desc;
                            }
                        }
                    }
                }
            }

            {
                //没有加载到文件也设置一个不然重复不停的加载
                blklib.descDict.push("*");
            }

            blklib.UpdataBlkTree();
        }, true);
    }
}