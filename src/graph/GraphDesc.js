GraphApp.prototype.EditColor = function () {
    if (this.nodecanvas.SelectedNodes.length == 0) return;

    let self = this;

    if (!this.nodeColorWin) {
        this.nodeColorWin = $('#nodecolorwindow');
        this.nodeColorWin.window({
            onBeforeClose: function () {
                if (self.editColorOnSelectNodeChanged) {
                    self.nodecanvas.Event.off("OnSelectNodeChanged", self.editColorOnSelectNodeChanged, self);
                }
                self.editColorOnSelectNodeChanged = null;
            }
        })
    }

    this.nodeColorWin.window('open');

    $('#nodelinecolor').color({
        value: this.GetSelectedNodeColorStr().lineColor,
        onChange: function(value){
            let c = parseInt(value.replace("#","0x"),16);
            for (let node of self.nodecanvas.SelectedNodes) {
                node.SetLineColor(c);
                node.drawbackground();
            }
        }
    });
    $('#nodebgcolor').color({
        value: this.GetSelectedNodeColorStr().bgColor,
        onChange: function(value){
            let c = parseInt(value.replace("#","0x"),16);
            for (let node of self.nodecanvas.SelectedNodes) {
                node.SetBgColor(c);
                node.drawbackground();
            }
        }
    });

    this.editColorOnSelectNodeChanged = function () {
        $('#nodelinecolor').color({
            value: this.GetSelectedNodeColorStr().lineColor,
        });
        $('#nodebgcolor').color({
            value: this.GetSelectedNodeColorStr().bgColor,
        });
    }
    this.nodecanvas.Event.on("OnSelectNodeChanged", this.editColorOnSelectNodeChanged, this);
}

GraphApp.prototype.GetSelectedNodeColorStr = function () {
    let nodes = this.nodecanvas.SelectedNodes;
    let colorstr = {lineColor:"", bgColor:""};
    let color = nodes.length > 0 ? nodes[0].GetColor() : null;
    if (color) {
        colorstr.lineColor = "#" + color.lineColor.toString(16);
        colorstr.bgColor = "#" + color.bgColor.toString(16);
    }
    return colorstr;
}

GraphNode.prototype.GetColor = function () {
    let color = {lineColor: this.style.linecolor, bgColor: this.style.bgcolor};
    if (!this.blockdata) return color;
    if (_global.editor.blkdata && _global.editor.blkdata.graphdesc) {
        let nodename = this.blockdata.name;
        let graphdesc = _global.editor.blkdata.graphdesc;
        if (graphdesc.blocks && nodename) {
            for (let block of graphdesc.blocks) {
                if (block.name.toString() !== nodename.toString()) continue;
                if (block.lineColor) color.lineColor = block.lineColor;
                if (block.bgColor) color.bgColor = block.bgColor;
                break;
            }
        }
    }
    return color;
}

GraphNode.GetOrCreateBlockDesc = function (nodename, create = false) {
    if (!_global.editor.blkdata) return null;
    let graphdesc = null;
    let blockdesc = null;
    if (_global.editor.blkdata.graphdesc) {
        graphdesc = _global.editor.blkdata.graphdesc;
        if (graphdesc.blocks) {
            for (let block of graphdesc.blocks) {
                if (block.name.toString() !== nodename.toString()) continue;
                blockdesc = block;
                break;
            }
        }
    } else if (create) {
        let kv = {};
        kv.__cls__ = "KFGraphEdInfo";
        let kvkfd = _global.editor.context.kfdtable.get_kfddata(kv.__cls__);
        KFDJson.init_object(kv, kvkfd);
        _global.editor.blkdata.graphdesc = kv;
        _global.editor.blkdata.graphdescpath = _global.editor.blkdata.graphpath.replace(".data", ".desc").replace("App/Data/App", "EditorOnly/DataDesc");
        if (!fileExists(_global.editor.blkdata.graphdescpath)) {
            let descpath = _global.editor.blkdata.graphdescpath.replace("/graph.desc", "");
            IKFFileIO_Type.instance.asyncCreateDir(descpath);  //这是个异步操作，如果此时马上保存可能有问题
        }
        graphdesc = _global.editor.blkdata.graphdesc;
    }

    if (!create) return blockdesc;

    if (!graphdesc.blocks)
    {
        graphdesc.blocks = [];
    }
    if (!blockdesc) {
        let kv = {};
        kv.__cls__ = "KFGraphBlockEdInfo";
        let kvkfd = _global.editor.context.kfdtable.get_kfddata(kv.__cls__);
        KFDJson.init_object(kv, kvkfd);
        kv.name = nodename;
        graphdesc.blocks.push(kv);
        blockdesc = kv;
    }
    return blockdesc;
}

GraphNode.prototype.GetOrCreateBlockDesc = function (create = false) {
    if (!this.blockdata) return null;
    return GraphNode.GetOrCreateBlockDesc(this.blockdata.name, create);
}

GraphNode.prototype.SetBgColor = function (color) {
    let blockdesc = this.GetOrCreateBlockDesc(true);
    if (blockdesc) blockdesc.bgColor = color;
}

GraphNode.prototype.SetLineColor = function (color) {
    let blockdesc = this.GetOrCreateBlockDesc(true);
    if (blockdesc) blockdesc.lineColor = color;
}

GraphNode.IsFolded = function (nodename) {
    let blockdesc = GraphNode.GetOrCreateBlockDesc(nodename, false);
    if (blockdesc && blockdesc.folded) return blockdesc.folded;
    return false;
}

GraphNode.prototype.IsFolded = function () {
    if (!this.blockdata) return false;
    return GraphNode.IsFolded(this.blockdata.name);
}

GraphNode.prototype.SetFolded = function (folded) {
    let blockdesc = this.GetOrCreateBlockDesc(true);
    if (blockdesc) blockdesc.folded = folded;
}

_global.Event.on('FrameDataSelectedSeqIDChanged', function (seqID) {
    if (_global.editor && _global.editor.blkdata && _global.editor.IsInGraph()) {
        if (!GraphNode.nodeState) GraphNode.nodeState = {};
        let fullNodeName = _global.editor.blkdata.asseturl + "_" + _global.currentGraphNodeName;
        GraphNode.nodeState[fullNodeName] = {seqID: seqID};
    }
});

GraphNode.getNodeState = function (node) {
    if (node && node.blockdata && _global.editor && _global.editor.blkdata && GraphNode.nodeState) {
        return GraphNode.nodeState[_global.editor.blkdata.asseturl + "_" + node.blockdata.name.toString()];
    }
    return null;
}

GraphNode.prototype.getLastSelectedSeqID = function () {
    let state = GraphNode.getNodeState(this);
    if (state && state.hasOwnProperty('seqID')) return state.seqID;
    return 0;
}
