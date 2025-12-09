Timeline.prototype._PlotInit = function()
{
    let self = this;
    this.IsPlot = false;
    _global.Event.on("OnFrameDataSelected", this.SetPlotAttr.bind(this));
    // _global.Event.on("OnFrameObjChanged", this.SetPlotAttrFormNet.bind(this));
    _global.Event.on("OnFrameObjChanged", function (obj) {
        if (!obj) return;
        // TODO 临时处理，这个消息有时太频繁了，会导致编辑器卡死，在非编辑态情况下，对其降频处理
        if (!self._OnFrameObjChangedContext) {
            self._OnFrameObjChangedContext = {};
        }
        let ctx = self._OnFrameObjChangedContext;
        if (!obj.Editing) {
            ctx.NetObj = obj;
            ctx.Changed = true;
            if (!ctx.Interval) {
                // 500ms设置一次
                ctx.Interval = setInterval(function () {
                    if (ctx.NetObj && ctx.NetObj.InstName === _global.editor.SelectedInst) {
                        if (ctx.Changed) {
                            self.SetPlotAttrFormNet(ctx.NetObj);
                            ctx.Changed = false;
                        }
                    } else {
                        if (ctx.Interval) {
                            clearInterval(ctx.Interval);
                            ctx.Interval = null;
                        }
                        ctx.NetObj = null;
                        ctx.Changed = false;
                    }
                }, 500);
                // 马上处理一次
                self.SetPlotAttrFormNet(ctx.NetObj);
            }
        } else {
            if (ctx.Interval) {
                clearInterval(ctx.Interval);
                ctx.Interval = null;
            }
            // 马上处理
            self.SetPlotAttrFormNet(ctx.NetObj);
        }
    });
    _global.Event.on("OnPlotFrameIndexChanged", this.SetPlotFrameIndex.bind(this));

    $("#edittype").tabs({
        onSelect:function(title){
            if(title == "本地")
            {
                _global.editor.PlotActors = {};
            }
        }
    });
    this.SetPlotAttr();
}

Timeline.prototype._PlotDrawFrames = function(layerIndex, layerdata)
{
    let blocks = layerdata ? layerdata.blocks : [];
    for(let indexBlock = 0; indexBlock < blocks.length; indexBlock ++)
    {
        let blockData = blocks[indexBlock];
        if (blockData && blockData.keyframes)
        {
            for(let indexFrame = 0; indexFrame < blockData.keyframes.length; indexFrame ++)
            {
                let frameData = blockData.keyframes[indexFrame].data;
                let beginFrameIndex = blockData.begin + blockData.keyframes[indexFrame].id;
                if (frameData && frameData.scripts)
                {
                    for(let indexScript = 0; indexScript < frameData.scripts.length; indexScript ++)
                    {
                        let scriptData = frameData.scripts[indexScript];
                        if (scriptData && scriptData.__cls__)
                        {
                            let table = _global.editor.context.kfdtable.get_kfddata(scriptData.__cls__);
                            let beginLineX = beginFrameIndex * this.frameWidth + (this.frameWidth/2);
                            let endLineX;
                            let lineY;
                            if(table && table.extend == "KFProgressData" && scriptData.TotalFrames)
                            {
                                lineY = layerIndex * this.frameHeight+2;
                                //if (beginFrameIndex==0) beginFrameIndex=-1;
                                endLineX = (beginFrameIndex+scriptData.TotalFrames) * this.frameWidth - (this.frameWidth/3);
                                this._drawLine(beginLineX, lineY, endLineX, lineY, "rgb(0,255,255)");
                                this._drawUShape(endLineX-(this.frameWidth*0.3), lineY, this.frameWidth*0.3, this.frameHeight*0.28, "rgb(0,255,255)", 0.8, "black");
                            }
                            if (table && table.class =="TSPlayUIData" && (scriptData.setType==undefined || scriptData.setType<=1))
                            {
                                let totalFrame = 0;
                                let dialogSpeed = 1;
                                let answerCDFrames = 0;
                                let dialogType = 0;
                                let txtDialog = "";
                                let txtAnswer = "";
                                if (scriptData.setType==1 && scriptData.DialogPageAndAnswersParams && scriptData.DialogPageAndAnswersParams.DialogPageParams)
                                {
                                    dialogType = scriptData.setType;

                                    if (scriptData.DialogPageAndAnswersParams.DialogPageParams.dialogSpeed && scriptData.DialogPageAndAnswersParams.DialogPageParams.dialogSpeed > 0)
                                        dialogSpeed = scriptData.DialogPageAndAnswersParams.DialogPageParams.dialogSpeed;
                                    if (scriptData.DialogPageAndAnswersParams.DialogPageParams.dialogIndex != "")
                                        txtDialog = this.GetDialogTxtBySheet(scriptData.DialogPageAndAnswersParams.DialogPageParams.dialogIndex).dialog;
                                    if (txtDialog == "")
                                        txtDialog = scriptData.DialogPageAndAnswersParams.DialogPageParams.txtNpcDialog;
                                    if (scriptData.DialogPageAndAnswersParams.CountDown>0)
                                        answerCDFrames = Math.ceil(scriptData.DialogPageAndAnswersParams.CountDown/0.017);
                                    if (scriptData.DialogPageAndAnswersParams.DialogAnswersParams != undefined)
                                    {

                                        for (let i=0; i<scriptData.DialogPageAndAnswersParams.DialogAnswersParams.length; i++)
                                        {
                                            if (scriptData.DialogPageAndAnswersParams.DialogAnswersParams[i].jumpFrameIndex>0)
                                                txtAnswer += "["+scriptData.DialogPageAndAnswersParams.DialogAnswersParams[i].jumpFrameIndex+"]";
                                            else
                                                txtAnswer += "[-1]";
                                        }
                                    }
                                }
                                else if ((!scriptData.hasOwnProperty("setType")||scriptData.setType==0) && scriptData.DialogPageParams)
                                {
                                    if (scriptData.DialogPageParams.dialogSpeed && scriptData.DialogPageParams.dialogSpeed > 0)
                                        dialogSpeed = scriptData.DialogPageParams.dialogSpeed;
                                    if (scriptData.DialogPageParams.dialogIndex != "")
                                        txtDialog = this.GetDialogTxtBySheet(scriptData.DialogPageParams.dialogIndex).dialog;
                                    if (txtDialog == "")
                                        txtDialog = scriptData.DialogPageParams.txtNpcDialog;
                                }
                                if (txtDialog!=undefined && txtDialog != "")
                                {
                                    totalFrame = Math.ceil(txtDialog.length / dialogSpeed);
                                }
                                if (totalFrame > 0)
                                {
                                    lineY = layerIndex * this.frameHeight + 4;
                                    endLineX = (beginFrameIndex + totalFrame + 1) * this.frameWidth - (this.frameWidth/3);
                                    let color = "rgb(255,0,0)";
                                    this._drawLine(beginLineX, lineY, endLineX, lineY, color);
                                    this._drawUShape(endLineX-(this.frameWidth*0.3), lineY, this.frameWidth*0.3, this.frameHeight*0.14, color, 0.8, "black");
                                    this._drawDialogText(txtDialog, beginLineX, lineY, endLineX);
                                    if (dialogType==1)
                                    {
                                        color="rgb(0,100,255)";
                                        this._drawDialogText(txtAnswer, endLineX, lineY, endLineX, color);
                                        beginLineX = endLineX;
                                        endLineX = (beginFrameIndex + totalFrame + answerCDFrames + 1) * this.frameWidth - (this.frameWidth/3);
                                        this._drawLine(beginLineX, lineY, endLineX, lineY, color);
                                        this._drawUShape(endLineX-(this.frameWidth*0.3), lineY, this.frameWidth*0.3, this.frameHeight*0.14, color, 0.8, "black");
                                    }
                                }
                            }
                            //绘制动画原始帧长信息
                            if(table.class == "TSPlayAnimationData")
                            {
                                let url = scriptData.AnimUrl;
                                let color = "rgb(255,0,0)";
                                let InitialFrames = 0;
                                InitialFrames = this.GetSpecialAnimConfig(url);
                                if(InitialFrames >= 1)
                                {
                                    if (scriptData.bUseSpecialParams)
                                    {
                                        if (scriptData.PlayFrameCount>0 && scriptData.PlayFrameCount+1<InitialFrames)
                                            InitialFrames = scriptData.PlayFrameCount+1;
                                        if (scriptData.OffsetStartFrame > 0)
                                            InitialFrames -= scriptData.OffsetStartFrame;
                                    }
                                    if (InitialFrames > scriptData.totalFrames)
                                        InitialFrames = scriptData.totalFrames;
                                    lineY = layerIndex * this.frameHeight + 4;
                                    endLineX = (beginFrameIndex + InitialFrames) * this.frameWidth - (this.frameWidth/3);
                                    this._drawLine(beginLineX, lineY, endLineX, lineY, color);
                                    this._drawUShape(endLineX-(this.frameWidth*0.3), lineY, this.frameWidth*0.3, this.frameHeight*0.14, color, 0.8, "black");
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

Timeline.prototype._PlotSelect = function(row)
{
    if(this.IsPlot && row && row.blocks && row.blocks.length > 0)
    {
        if(row.blocks[0].target && row.blocks[0].target.instname)
        {
            var instnameStr = row.blocks[0].target.instname.toString();
            instnameStr = instnameStr.substring(instnameStr.lastIndexOf(".") + 1)
            if(_global.editor.PlotActors && _global.editor.PlotActors[instnameStr] != null)
            {
                _global.editor.PlotActors[instnameStr].Set('Selected', true);
                _global.editor.SelectedInst = instnameStr;
            }
                        
        }
    } 
}

Timeline.prototype.PlotUpdateAttrs = function(state, layerid = 0, frameid = 0)
{
    let timeline = this;
    let timelinedata = this.tldata;
    if(timelinedata && timelinedata.states && timelinedata.states.length == 1 && this.assetId && this.assetId.indexOf("Plot") != -1)
    {
        this.ChangeState(0, false);
        var westregion = $('#statecontainer').layout('panel', 'west');
        westregion.panel('setTitle', '属性');
        $('#statecontainer').layout();
        
        let formatterAttris = this.PlotAttriSets(state ? state : this.currentState, layerid, frameid);

        if (this.IsPlot)
        {
            timeline.sizerate = 0.8;
            timeline.frameWidth = 20 * timeline.sizerate;
            timeline.ResizeMaxFrames(timeline.currentState.length);
        }
        this.statesel.tree({
            formatter:function(node){
                return node.name;
            },
            data: formatterAttris,
            onSelect:function (node){
            },
    
            onLoadSuccess:function(node,data){  
                if(!timeline.IsPlot)
                {
                    timeline.IsPlot = true;
                    let plotCtrl = _global.editor.plotCtrl;
                    if(plotCtrl)
                    {
                        plotCtrl.IsPlot = true;
                        plotCtrl.CurPlotId = timeline.assetId;
                        plotCtrl.ShowPlotOps(!_global.editor.IsPause);
                    }
                }
             }
            });
            return true;
        }
        else
        {
            this.IsPlot = false;
            if (!_global.editor || !_global.editor.plotCtrl)
                return false;

            let plotCtrl = _global.editor.plotCtrl;
            if(plotCtrl)
            {
                plotCtrl.IsPlot = false;
                plotCtrl.CurPlotId = "";
                plotCtrl.ShowPlotOps(!_global.editor.IsPause);
            }
            return false;
        }
}

Timeline.prototype.SetPlotAttr = function(kfframedata, frameattribui){
    this.PlotUpdateAttrs(this.currentState, this.currentLayer < 0 ? 0 : this.currentLayer, 
        this.currentFrame < 0 ? 0 : this.currentFrame);
}

Timeline.prototype.SetPlotAttrFormNet = function(obj){
    if(this.IsPlot)
    {
        this.SetPlotFrameDyncAttr(obj, obj != null);
        this.PlotUpdateAttrs(this.currentState, this.currentLayer < 0 ? 0 : this.currentLayer, 
            this.currentFrame < 0 ? 0 : this.currentFrame);
    }
}

Timeline.prototype.PlotAttriSets = function(curstate, layerid, frameid)
{
    var attriSets = new Array();

    if(curstate && curstate.layers && curstate.layers.length > layerid)
    {
        var curLayer = curstate.layers[layerid];
        if(curLayer && curLayer.blocks)
        {
            for(var i = 0; i < curLayer.blocks.length; ++i)
            {
                if(curLayer.blocks[i].begin <= frameid && curLayer.blocks[i].end > frameid)
                {
                    var curblock = curLayer.blocks[i];
                    
                    var curPObj = {};
                    curPObj.iconCls = "";
                    curPObj.name = curLayer.name;
                    curPObj.id = 100000;
                    curPObj.state = "open";
                    curPObj.text = curLayer.name;
                    curPObj.children = [];
                    attriSets.push(curPObj);

                    if(curblock.keyframes)
                    {
                        for(var j = 0; j < curblock.keyframes.length; ++j)
                        {
                            if(curblock.keyframes[j].id == frameid)
                            {
                                var curFrame = curblock.keyframes[j];
                                if(curblock.opOption != 31)  //非补间轴，删除帧补间数据
                                {
                                    //清空帧上的value数据
                                    for(var x = 0; x < curLayer.blocks.length; ++x)
                                    {
                                        var tosetblock = curLayer.blocks[x];
                                        if(tosetblock.keyframes != null)
                                        {
                                            for(var y = 0; y < tosetblock.keyframes.length; ++y)
                                            {
                                                tosetblock.keyframes[y].vals = null;
                                            }
                                        }
                                    }
                                }

                                if(curblock.opOption == 31 && curFrame && curFrame.vals && curFrame.vals.nameArr)
                                {
                                    var offset = 0;
                                    for(var m = 0; m < curFrame.vals.nameArr.length; m++)
                                    {
                                        var attribs = [];
                                        switch(curFrame.vals.nameArr[m])
                                        {
                                            case 0x11:   //KFFrameValueName::Fov
                                                attribs = ["Fov"];
                                            break;
                                            case 0x13:   //KFFrameValueName::POSITION3
                                                attribs = ["position_x","position_y","position_z"];
                                            break;
                                            case 0x43:
                                            case 0x23:   //KFFrameValueName::ROTATION3
                                                attribs = ["rotation_pitch","rotation_yaw","rotation_roll"];
                                            break;
                                            case 0x33:   //KFFrameValueName::SCALE3
                                                attribs = ["scale_x","scale_y","scale_z"];
                                            break;
                                        }
                                   
                                        for(var n = 0; n < attribs.length; n++)
                                        {
                                            var curObj = {};
                                            curObj.iconCls = "";
                                            curObj.name = attribs[n] + " : " + 0;
                                            if(curFrame.vals.valArr && curFrame.vals.valArr[offset + n])
                                            {
                                                curObj.name = attribs[n] + " : " + curFrame.vals.valArr[offset + n];
                                            }
                                            curObj.id = 100000 + m;
                                            curObj.state = "open";
                                            curObj.text = attribs[n];
                                            curPObj.children.push(curObj);
                                        }
                                        offset += (curFrame.vals.nameArr[m] & 0xF);
                                    }
                                    break;
                                }
                                
                            }
                        }
                        
                    }
                    break;
                }
            }
        }
        
    }

    return attriSets;
}

//先把transform全部保存
Timeline.prototype.SetPlotFrameDyncAttr = function(netObj, force)
{
    if(this.currentState == null || this.currentLayer < 0 || this.currentFrame < 0 || !_global.editor.IsPause) return;

    if(this.currentState && this.currentState.layers && this.currentState.layers.length > this.currentLayer)
    {
        var curLayer = this.currentState.layers[this.currentLayer];
        if(curLayer && curLayer.blocks)
        {
            for(var i = 0; i < curLayer.blocks.length; ++i)
            {
                if(curLayer.blocks[i].begin <= this.currentFrame && curLayer.blocks[i].end > this.currentFrame)
                {
                    if(netObj == null)
                    {
                        if(curLayer.blocks[i].target)
                        {
                            var instnameStr = curLayer.blocks[i].target.instname.toString();
                            instnameStr = instnameStr.substring(instnameStr.lastIndexOf(".") + 1);
                            netObj = _global.editor.PlotActors[instnameStr];
                        }
                    }

                    if(netObj == null) return;
                    for(var j = 0; j < curLayer.blocks[i].keyframes.length; ++j)
                    {
                        if(curLayer.blocks[i].keyframes[j].id == this.currentFrame)
                        {
                            var curFrame = curLayer.blocks[i].keyframes[j];
                            
                            if(curFrame && curFrame.vals)
                            {
                                if(!curFrame.vals.valArr) curFrame.vals.valArr = new Array();
                                if(!curFrame.vals.nameArr) curFrame.vals.nameArr = new Array();
                                var totalLen = 0;
                                for(var k = 0; k < curFrame.vals.nameArr.length; ++k)
                                {
                                    totalLen += (curFrame.vals.nameArr[k] & 0xF);
                                }
                                if(force || curFrame.vals.valArr.length < totalLen)
                                {
                                    var offset = 0;
                                    for(var m = 0; m < curFrame.vals.nameArr.length; m++)
                                    {
                                        switch(curFrame.vals.nameArr[m])
                                        {
                                            case 0x11:   //KFFrameValueName::Fov
                                                curFrame.vals.valArr[offset] = netObj.fov;
                                                curFrame.vals.nameArr[m] = 0x11;
                                                break;
                                            case 0x13:   //KFFrameValueName::POSITION3
                                                curFrame.vals.valArr[offset + 0] = netObj.location.X;
                                                curFrame.vals.valArr[offset + 1] = netObj.location.Y;
                                                curFrame.vals.valArr[offset + 2] = netObj.location.Z;
                                                curFrame.vals.nameArr[m] = 0x13;
                                            break;
                                            case 0x23:   //KFFrameValueName::ROTATION3
                                                curFrame.vals.valArr[offset + 0] = netObj.rotation.Pitch;
                                                curFrame.vals.valArr[offset + 1] = netObj.rotation.Yaw;
                                                curFrame.vals.valArr[offset + 2] = netObj.rotation.Roll;
                                                curFrame.vals.nameArr[m] = 0x23;
                                            break;
                                            case 0x43:   //KFFrameValueName::NORMROTATION3
                                                curFrame.vals.valArr[offset + 0] = netObj.rotation.Pitch;
                                                curFrame.vals.valArr[offset + 1] = netObj.rotation.Yaw;
                                                curFrame.vals.valArr[offset + 2] = netObj.rotation.Roll;
                                                let prevFrame = null;
                                                for(var x = 0; x < curLayer.blocks[i].keyframes.length; ++x)
                                                {
                                                    if(curLayer.blocks[i].keyframes[x].id < curFrame.id)
                                                    {
                                                        if(prevFrame == null || prevFrame.id < curLayer.blocks[i].keyframes[x].id)
                                                            prevFrame = curLayer.blocks[i].keyframes[x];
                                                    }
                                                }

                                                if(prevFrame && prevFrame.vals)
                                                {
                                                    if(prevFrame.vals.valArr[offset + 0] - curFrame.vals.valArr[offset + 0] > 180) curFrame.vals.valArr[offset + 0] += 360; 
                                                    else if(prevFrame.vals.valArr[offset + 0] - curFrame.vals.valArr[offset + 0] < -180) curFrame.vals.valArr[offset + 0] -= 360; 
                                                    if(prevFrame.vals.valArr[offset + 1] - curFrame.vals.valArr[offset + 1] > 180) curFrame.vals.valArr[offset + 1] += 360; 
                                                    else if(prevFrame.vals.valArr[offset + 1] - curFrame.vals.valArr[offset + 1] < -180) curFrame.vals.valArr[offset + 1] -= 360; 
                                                    if(prevFrame.vals.valArr[offset + 2] - curFrame.vals.valArr[offset + 2] > 180) curFrame.vals.valArr[offset + 2] += 360; 
                                                    else if(prevFrame.vals.valArr[offset + 2] - curFrame.vals.valArr[offset + 2] < -180) curFrame.vals.valArr[offset + 2] -= 360; 
                                                }
                                                
                                                curFrame.vals.nameArr[m] = 0x43;
                                            break;
                                            case 0x33:   //KFFrameValueName::SCALE3
                                                curFrame.vals.valArr[offset + 0] = netObj.scale.X;
                                                curFrame.vals.valArr[offset + 1] = netObj.scale.Y;
                                                curFrame.vals.valArr[offset + 2] = netObj.scale.Z;
                                                curFrame.vals.nameArr[m] = 0x33;   
                                            break;
                                        }
                                        offset += (curFrame.vals.nameArr[m] & 0xF);
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
            }
        }
    }
}

Timeline.prototype.SetPlotFrameIndex = function(obj){
    if(this.IsPlot)
    {
        if(obj.FrameIndex != -1){
            this.setHeaderCurrentFrame(obj.FrameIndex, true);
        }
    }
}

Timeline.prototype.GetDialogTxtBySheet = function(txtId)
{
    let arr = txtId.split("_");
    if (arr.length > 1)
    {

        if (!this.NpcDialogSheetData || this.cacheDialogIndex!=arr[1])
        {
            this.NpcDialogSheetData = this.LoadDialogTxtSheet(arr[1]);
            this.cacheDialogIndex = arr[1];
        }

        if (this.NpcDialogSheetData)
        {
            for (let i=0; i<this.NpcDialogSheetData.length; i++)
            {
                if (this.NpcDialogSheetData[i].txtId == txtId)
                    return this.NpcDialogSheetData[i];
            }
        }
    }

    return {dialog:""};
}

Timeline.prototype.LoadDialogTxtSheet = function(fileName)
{
    var dialogPath = _global.appdatapath + "/App/GameData/Words/Dialog/"+fileName+".blk";
    if (fileExists(dialogPath))
    {
        let blkdata = IKFFileIO_Type.instance.syncLoadFile(dialogPath);
        if(blkdata)
        {
            let bytearr = new KFByteArray(blkdata);
            let blkobj = KFDJson.read_value(bytearr);
            if(blkobj)
            {
                if(blkobj.data)
                {
                    let kv = KFDJson.read_value(blkobj.data.bytes, false);
                    if(kv && kv.Rows)
                    {
                        return kv.Rows;
                    }
                }
            }
        }
    }
}

Timeline.prototype._drawDialogText = function(txt, x, y, maxWidth, color="rgb(255,255,255)")
{
    this.c2d.font = "bold 20px Arial";
    this.c2d.strokeStyle = "rgb(0,0,255)";
    this.c2d.strokeText(txt, x+13, y+25, maxWidth);
    this.c2d.font = "bold 20px Arial";
    this.c2d.fillStyle = color;
    this.c2d.fillText(txt, x+13, y+25, maxWidth);
    //this.c2d.textAlign = "center";
    //this.c2d.textBaseline = 'middle';
}

Timeline.prototype.LoadAnimConfigSheet = function()
{
    var dialogPath = _global.appdatapath + "/App/Editor/PlotAnimsConfig.blk";
    if (fileExists(dialogPath))
    {
        let blkdata = IKFFileIO_Type.instance.syncLoadFile(dialogPath);
        if(blkdata)
        {
            let bytearr = new KFByteArray(blkdata);
            let blkobj = KFDJson.read_value(bytearr);
            if(blkobj)
            {
                if(blkobj.data)
                {
                    let kv = KFDJson.read_value(blkobj.data.bytes, false);
                    if(kv && kv.Rows)
                    {
                        return kv.Rows;
                    }
                }
            }
        }
    }
}

Timeline.prototype.GetSpecialAnimConfig = function(AnimUrl)
{
    if (!this.AnimConfigSheetData)
    {
        this.AnimConfigSheetData = this.LoadAnimConfigSheet();
    }

    if (this.AnimConfigSheetData)
    {
        for (let i=0; i<this.AnimConfigSheetData.length; i++)
        {
            if (this.AnimConfigSheetData[i].value == AnimUrl)
                return this.AnimConfigSheetData[i].desc;
        }
    }

    return 0;
}