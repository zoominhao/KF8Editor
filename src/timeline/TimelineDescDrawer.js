//刷新右键菜单功能项
Timeline.prototype.UpdateFrameDescMenu = function()
{
    this.curBlockDescState = 1;
    let stateDesc = this._getStateDescByStateID(this.currentState.id);
    if (stateDesc && stateDesc.layers && stateDesc.layers[this.currentLayer])
    {
        this.curBlockDesc = this._getFrameBlockDesc(this.currentFrame, stateDesc.layers[this.currentLayer]);
        if(this.curBlockDesc)
            this.curBlockDescState = 2;
    }

    if (this.curBlockDescState == 1)
    {
        let btn0 = $("#frameDescBtn0" );
        btn0[0].innerHTML = "<div class=\"menu-text\" data-options=\"iconCls:'icon-add'\" style=\"height: 30px; line-height: 30px;\">添加色块标识</div><div class=\"menu-icon icon-add\"></div>";
        let btn1 = $("#frameDescBtn1" );
        btn1[0].innerHTML = "<div class=\"menu-text\" style=\"height: 30px; line-height: 30px;\">延长色块标识</div>";
        this.curBlockDescState = 1;
    }
    else if (this.curBlockDescState == 2)
    {
        let btn0 = $("#frameDescBtn0" );
        btn0[0].innerHTML = "<div class=\"menu-text\" data-options=\"iconCls:'icon-remove'\" style=\"height: 30px; line-height: 30px;\">删除色块标识</div><div class=\"menu-icon icon-remove\"></div>";
        let btn1 = $("#frameDescBtn1" );
        btn1[0].innerHTML = "<div class=\"menu-text\" style=\"height: 30px; line-height: 30px;\">修改色块颜色</div>";
        this.curBlockDescState = 2;
    }
}
//添加或删除色块标识事件
Timeline.prototype.AddOrRemoveEdBlock = function(e)
{
    if(this.currentFrame < 0)
    {
        Nt("没有选中的帧");
        return;
    }

    if (this.curBlockDescState == 1)
    {
        if(_global.editor && _global.editor.edaction)
            _global.editor.edaction.AddAction();

        if (!_global.editor.blkdata.tldesc)
        {
            this._CreateKFTimelineEdInfo();
        }

        let stateDesc = this._getStateDescByStateID(this.currentState.id);
        if (!stateDesc.layers) stateDesc.layers=[];
        if (!stateDesc.layers[this.currentLayer])
            this._CreateKFTimelayerEdInfo(this.currentLayer, stateDesc);
        let layerdata = stateDesc.layers[this.currentLayer];
        ///判断是否被块占了
        let retdata = this._getFrameBlockDesc(this.currentFrame,layerdata);
        if(retdata)
        {
            Nt("帧已经被其他块占用!");
            return;
        }
        this._PushKFTimelineEdInfo(layerdata);
        this._drawFrameIndexs([this.currentFrame]);
        this.OnFrameChange(true);
        this.OpenColorWindow();
    }
    else if (this.curBlockDescState == 2)
    {
        if (this.currentFrame==this.curBlockDesc.begin || this.currentFrame==this.curBlockDesc.end-1)
        {
            let stateDesc = this._getStateDescByStateID(this.currentState.id);
            let layerdata = stateDesc.layers[this.currentLayer];
            this._removeFrameBlockDesc(this.curBlockDesc, layerdata);
        }
        else
        {
            if (this.currentFrame-this.curBlockDesc.begin > this.curBlockDesc.end-this.currentFrame)
                this.curBlockDesc.end--;
            else
                this.curBlockDesc.begin++;
        }
        this._drawFrameIndexs([this.currentFrame]);
        this.OnFrameChange(true);
    }
}
//延长或编辑色块标识事件
Timeline.prototype.ProlongOrChangeEdBlockFrame = function()
{
    if (this.curBlockDescState == 1)
    {
        let stateDesc = this._getStateDescByStateID(this.currentState.id);
        if (!stateDesc || !stateDesc.layers || !stateDesc.layers[this.currentLayer]) return;
        let layerdata = stateDesc.layers[this.currentLayer];
        let retdata = this._getBeforBlockDesc(this.currentFrame, layerdata);
        let blockdata = retdata.block;

        if(blockdata)
        {
            if(retdata.inblock)
            {
                Nt("色块标识已经包括此帧");
            }else
            {
                if(_global.editor && _global.editor.edaction)
                    _global.editor.edaction.AddAction();
                blockdata.end = this.currentFrame + 1;
                this._redrawIndexLayers([this.currentLayer]);
                this.OnFrameChange(true);
            }
        }
        else
        {
            Nt("请先添加色块标识!");
        }
    }
    else if (this.curBlockDescState == 2)
    {
        this.OpenColorWindow();
    }
}
Timeline.prototype.SetColorWindowPos = function(mouseX, mouseY)
{
    this.colorWindowPos = {};
    this.colorWindowPos.x = mouseX+30;
    this.colorWindowPos.y = mouseY+160;
}
//打开配色窗口
Timeline.prototype.OpenColorWindow = function()
{
    $('#colorwindow').window({
        left: this.colorWindowPos.x,
        top: this.colorWindowPos.y
    });
    $("#colorwindow" ).window('open');
    $('#frameDescColor').color({
        onChange: function(value){
            //...
            this.curBlockDesc.color = value;
            this._drawFrameIndexs([this.currentFrame]);
            this.OnFrameChange(true);
            $("#colorwindow" ).window('close');
        }.bind(this)
    });
}
//绘制色块
Timeline.prototype._DescDrawFrames = function(layerIndex)
{
    let stateDesc = this._getStateDescByStateID(this.currentState.id);
    if (!stateDesc || !stateDesc.layers || !stateDesc.layers[layerIndex]) return;
    let layerdata = stateDesc.layers[layerIndex];
    let blocks = layerdata ? layerdata.blocks : [];
    for (let z = 0; z < blocks.length; z++)
    {
        let block = blocks[z];
        if (block)
        {
            let color = block.color;
            let beginLineX = block.begin * this.frameWidth + (this.frameWidth/2);
            let endLineX = block.end * this.frameWidth - (this.frameWidth/2);
            let lineY = layerIndex * this.frameHeight+(this.frameHeight/2);
            this._drawCircle(beginLineX, lineY, this.frameWidth*0.17, color);
            this._drawCircle(endLineX, lineY, this.frameWidth*0.17, color);
            this._drawLine(beginLineX, lineY, endLineX, lineY, color);
        }
    }
}