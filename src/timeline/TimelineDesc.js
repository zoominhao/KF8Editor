Timeline.prototype._descInit = function () {
    this.lockgenbox = domui.lockgenbox;
    this.remarkbox = domui.remarkbox;
    this.remarksflag = true;

    this.stateCategory.textbox({
        value: _global.editor.blkdata.tldesc && _global.editor.blkdata.tldesc.stateCategory ? _global.editor.blkdata.tldesc.stateCategory : "",
        onChange: function (nValue)
        {
            if(_global.editor.blkdata.tldesc)
            {
                _global.editor.blkdata.tldesc.stateCategory = nValue;
            }
            else
            {
                _global.editor.blkdata.tldesc = { "__cls__": "KFTimelineEdInfo" };
                _global.editor.blkdata.tldescpath = _global.editor.blkdata.timelinepath.replace(".data", ".desc").replace("App/Data/App", "EditorOnly/DataDesc");
                _global.editor.blkdata.tldesc.states = [];
                _global.editor.blkdata.tldesc.stateCategory = nValue;
                Timeline.CreateDescFile(_global.editor.blkdata.tldescpath);
            }
        }
    });
}

Timeline.prototype._CreateKFTimelineEdInfo = function ()
{
    _global.editor.blkdata.tldesc = {"__cls__": "KFTimelineEdInfo"};
    _global.editor.blkdata.tldescpath = _global.editor.blkdata.timelinepath.replace(".data", ".desc").replace("App/Data/App", "EditorOnly/DataDesc");
    _global.editor.blkdata.tldesc.states = [];
    let obj = {"__cls__":"KFTimestateEdInfo"};
    obj.id = this.currentState.id;
    _global.editor.blkdata.tldesc.states.push(obj);
    Timeline.CreateDescFile(_global.editor.blkdata.tldescpath);
}

Timeline.prototype._CreateKFTimelayerEdInfo = function (layerIndex, stateDesc)
{
    if (!stateDesc.layers) stateDesc.layers=[];
    stateDesc.layers[layerIndex] = {"__cls__":"KFTimelayerEdInfo", blocks:[]};
    for (let i=0; i<stateDesc.layers.length; i++)
    {
        if (!stateDesc.layers[i])
            stateDesc.layers[i] = {"__cls__":"KFTimelayerEdInfo", blocks:[]};
    }
}

Timeline.prototype._PushKFTimelineEdInfo = function (layerdata)
{
    this.curBlockDesc = {"__cls__":"KFTimeBlockEdInfo"};
    this.curBlockDesc.label = "timeblock" + layerdata.blocks.length;
    this.curBlockDesc.begin = this.currentFrame;
    this.curBlockDesc.end = this.currentFrame + 1;
    this.curBlockDesc.color = "#cc0000";
    layerdata.blocks.push(this.curBlockDesc);
}

Timeline.prototype._getStateDescByStateID = function (stateID)
{
    if (_global.editor.blkdata && _global.editor.blkdata.tldesc && _global.editor.blkdata.tldesc.states)
    {
        for (let statedesc of _global.editor.blkdata.tldesc.states) {
            if (statedesc.id == stateID) {
                return statedesc;
            }
        }
    }
    return null;
}

Timeline.prototype._getFrameBlockDesc = function(frameindex, layerdata)
{
    let blockdata = null;
    let blocks = layerdata ? layerdata.blocks : [];

    for (let z = 0; z < blocks.length; z++)
    {
        let block = blocks[z];

        if (frameindex >= block.begin && frameindex < block.end)
        {
            blockdata = block;
            return blockdata;
        }
    }
    return null;
}

Timeline.prototype._removeFrameBlockDesc = function(blockdata, layerdata)
{
    let blocks = layerdata ? layerdata.blocks : [];

    for (let z = 0; z < blocks.length; z++)
    {
        let block = blocks[z];

        if (blockdata.begin == block.begin && blockdata.end==block.end)
        {
            blocks.splice(z, 1);
            return;
        }
    }
}

Timeline.prototype._getBeforBlockDesc = function(frameindex, layerdata)
{
    let blockdata = null;
    let inblock = false;
    let beforeend = -1;//上一个块的END
    let blocks = layerdata ? layerdata.blocks : [];

    for (let z=0; z<blocks.length; z++)
    {
        let block = blocks[z];

        if(frameindex>=block.begin && frameindex<block.end)
        {
            blockdata = block;
            inblock = true;
            break;
        }
        else if(frameindex >= block.end)
        {
            if(block.end > beforeend)
            {
                blockdata = block;
                beforeend = block.end;
            }
        }
    }

    return {block:blockdata
        ,inblock:inblock};
}

Timeline.prototype._setState = function () {
    let self = this;
    let lockgen = function () {
        if (_global.editor.blkdata && _global.editor.blkdata.tldesc && _global.editor.blkdata.tldesc.states) {
            for (let statedesc of _global.editor.blkdata.tldesc.states) {
                if (statedesc.id == self.currentState.id) {
                    return !statedesc.genHurtBox;
                }
            }
        }
        return false;
    }

    this.lockgenbox.checkbox({
        checked: lockgen()
        , onChange: function (checked) {
            var node = $("#statesel").tree('getSelected');
            $("#statesel").tree('update', {
                target: node.target,
                iconCls: checked?"icon-lockfile":"icon-statekey"
            });
            if (_global.editor.blkdata) {
                if (!_global.editor.blkdata.tldesc) {
                    _global.editor.blkdata.tldesc = { "__cls__": "KFTimelineEdInfo" };
                    _global.editor.blkdata.tldescpath = _global.editor.blkdata.timelinepath.replace(".data", ".desc").replace("App/Data/App", "EditorOnly/DataDesc");
                    _global.editor.blkdata.tldesc.states = [];
                    Timeline.CreateDescFile(_global.editor.blkdata.tldescpath);
                }
                let existflag = false;
                for (let statedesc of _global.editor.blkdata.tldesc.states) {
                    if (statedesc.id == self.currentState.id) {
                        existflag = true;
                        statedesc.genHurtBox = !checked;
                        break;
                    }
                }
                if (!existflag) {
                    _global.editor.blkdata.tldesc.states.push({ id: self.currentState.id, genHurtBox: !checked, remarks:"" });
                }
            }
        }
    });
    this.remarkbox.checkbox({
        checked: (self.remarksflag == true)
        , onChange: function (checked){
            self.remarksflag = checked;
            self.UpdateStates();
        }
    });
}


Timeline.CreateDescFile = function (tlddeadpath) {
    if (!fileExists(tlddeadpath)) {
        let postdir = tlddeadpath.substring(tlddeadpath.indexOf("DataDesc") + 9);
        let predir = tlddeadpath.substring(0, tlddeadpath.indexOf("DataDesc") + 8);
        postdir = postdir.replace("/timeline.desc", "");
        postdir = postdir.split('/');
        let paths = [];
        for(let curpostdir of postdir)
        {
            predir = predir + "/" + curpostdir;
            if (!fileExists(predir)) 
            {
                paths.push(predir);
            }
        }

        IKFFileIO_Type.instance.asyncCreateDir(paths);  //这是个异步操作，如果此时马上保存可能有问题
    }
}

Timeline.prototype.RenameState = function () {
    $.messager.prompt('添加备注', '请输入想要的备注', function(r) {
        if (r != null) {
            var node = $("#statesel").tree('getSelected');
            var name = node.name;
            node.remarks = r;
            var index = name.indexOf("_");
            if(index != -1)
            {
                name = name.substr(0, index);
            }

            $("#statesel").tree('update', {
                target: node.target,
                name: name
            });

            if (_global.editor.blkdata) {
                if (!_global.editor.blkdata.tldesc) {
                    _global.editor.blkdata.tldesc = { "__cls__": "KFTimelineEdInfo" };
                    _global.editor.blkdata.tldescpath = _global.editor.blkdata.timelinepath.replace(".data", ".desc").replace("App/Data/App", "EditorOnly/DataDesc");
                    _global.editor.blkdata.tldesc.states = [];
                    Timeline.CreateDescFile(_global.editor.blkdata.tldescpath);
                }
                let existflag = false;
                for (let statedesc of _global.editor.blkdata.tldesc.states) {
                    if (statedesc.id == node.id) {
                        existflag = true;
                        statedesc.remarks = r;
                        break;
                    }
                }
                if (!existflag) {
                    _global.editor.blkdata.tldesc.states.push({ id: node.id, genHurtBox: false , remarks: r });
                }
            }

            _global.timeline.currentState.remarks = r;
        }
    });
}