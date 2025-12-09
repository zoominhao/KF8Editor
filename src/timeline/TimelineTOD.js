Timeline.prototype._TODInit = function()
{
    this.stateprop = domui.stateprop;
    this.stateselcontainer = domui.stateselcontainer;
    this.statepropcontainer = domui.statepropcontainer;

    _global.Event.on("OnFrameDataSelected", this.SetTODAttr.bind(this));
    //net
    _global.Event.on("OnTODObjChanged", this.SetTODAttrFormNet.bind(this));
    _global.Event.on("OnTODFrameIndexChanged", this.SetTODFrameIndex.bind(this));
}

Timeline.prototype.SetTODAttr = function(kfframedata, frameattribui){
    this.TODUpdateAttrs(this.currentState, this.currentLayer < 0 ? 0 : this.currentLayer, 
        this.currentFrame < 0 ? 0 : this.currentFrame);
}

Timeline.prototype.SetTODAttrFormNet = function(obj){
    if(this.IsTOD)
    {
        this.SetTODFrameDyncAttr(obj, obj != null);
        this.TODUpdateAttrs(this.currentState, this.currentLayer < 0 ? 0 : this.currentLayer, 
            this.currentFrame < 0 ? 0 : this.currentFrame);
    }
}

Timeline.prototype.TODUpdateAttrs = function(state, layerid = 0, frameid = 0)
{
    let timeline = this;
    let timelinedata = this.tldata;
    if(timelinedata && timelinedata.states && this.assetId && this.assetId.indexOf("TOD") != -1)
    {
        this.statepropcontainer.panel({
    		closed: false,
    	});

        let formatterAttris = this.TODAttriSets(state ? state : this.currentState, layerid, frameid);
        this.IsOpenLoad = false;
        this.stateprop.tree({
            formatter:function(node){
                return node.name;
            },
            data: formatterAttris,
            onSelect:function (node){
            },
    
            onLoadSuccess:function(node,data){  
                if(!timeline.IsTOD)
                {
                    timeline.IsTOD = true;
                    let todCtrl = _global.editor.todCtrl;
                    if(todCtrl)
                    {
                        todCtrl.IsTOD = true;
                        todCtrl.CurTODId = timeline.assetId;
                        todCtrl.ShowTODOps(!_global.editor.IsPause); //控制播放的
                    }
                }
             }
            });
            return true;
    }
    else
    {
        this.statepropcontainer.panel({
    		closed: true,
    	});

        this.IsTOD = false;
        let todCtrl = _global.editor.todCtrl;

        if(todCtrl)
        {
            todCtrl.IsTOD = false;
            todCtrl.CurTODId = "";
            todCtrl.ShowTODOps(!_global.editor.IsPause);
        }
        return false;
    }
}


Timeline.prototype.TODAttriSets = function(curstate, layerid, frameid)
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
                                        var curPAttrib = "";
                                        switch(curFrame.vals.nameArr[m])
                                        {
                                            case 0x1b:   //KF8FrameAttr::DIRECTIONLIGHT
                                                curPAttrib = "DirL";
                                                attribs = ["RotatorX", "Intensity", "Color_r", "Color_g", "Color_b", 
                                                "NearShadowColor_r", "NearShadowColor_g", "NearShadowColor_b", 
                                                "FarShadowColor_r", "FarShadowColor_g", "FarShadowColor_b"];
                                            break;
                                            case 0x24:   //KF8FrameAttr::SKYLIGHT
                                                curPAttrib = "SkyL";
                                                attribs = ["Intensity", "Color_r", "Color_g", "Color_b"];
                                            break;
                                        }
                                   
                                        var curPAttrObj = {};
                                        curPAttrObj.iconCls = "";
                                        curPAttrObj.name = curPAttrib;
                                        curPAttrObj.id = 100000 + m * 100;
                                        curPAttrObj.state = "open";
                                        curPAttrObj.text = curPAttrib;
                                        curPAttrObj.children = [];
                                        curPObj.children.push(curPAttrObj);

                                        for(var n = 0; n < attribs.length; n++)
                                        {
                                            var curAttrObj = {};
                                            curAttrObj.iconCls = "";
                                            curAttrObj.name = attribs[n] + " : " + 0;
                                            if(curFrame.vals.valArr && curFrame.vals.valArr[offset + n])
                                            {
                                                curAttrObj.name = attribs[n] + " : " + curFrame.vals.valArr[offset + n];
                                            }
                                            curAttrObj.id = 100000 + n + m * 100 + 1;
                                            curAttrObj.state = "open";
                                            curAttrObj.text = attribs[n];
                                            curPAttrObj.children.push(curAttrObj);
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



Timeline.prototype.SetTODFrameDyncAttr = function(netObj, force)
{
    //if(this.currentState == null || this.currentLayer < 0 || this.currentFrame < 0 || !_global.editor.IsPause) return;
    if(netObj == null) return;
    if(this.frameattribui && this.frameattribui.curData && this.frameattribui.curData.vals && this.frameattribui.curData.vals.nameArr)
    {
        var curFrame = this.frameattribui.curData;
        for(var i = 0; i < this.frameattribui.curData.vals.nameArr.length; i++)
        {
            var offset = 0;
            for(var m = 0; m < curFrame.vals.nameArr.length; m++)
            {
                switch(curFrame.vals.nameArr[m])
                {
                    case 0x1b:   //KF8FrameAttr::DIRECTIONLIGHT
                        curFrame.vals.valArr[offset + 0] = netObj.DirL_RotatorX;
                        curFrame.vals.valArr[offset + 1] = netObj.DirL_Intensity;
                        curFrame.vals.valArr[offset + 2] = netObj.DirL_Color.X;
                        curFrame.vals.valArr[offset + 3] = netObj.DirL_Color.Y;
                        curFrame.vals.valArr[offset + 4] = netObj.DirL_Color.Z;
                        curFrame.vals.valArr[offset + 5] = netObj.DirL_NearShadowColor.X;
                        curFrame.vals.valArr[offset + 6] = netObj.DirL_NearShadowColor.Y;
                        curFrame.vals.valArr[offset + 7] = netObj.DirL_NearShadowColor.Z;
                        curFrame.vals.valArr[offset + 8] = netObj.DirL_FarShadowColor.X;
                        curFrame.vals.valArr[offset + 9] = netObj.DirL_FarShadowColor.Y;
                        curFrame.vals.valArr[offset + 10] = netObj.DirL_FarShadowColor.Z;

                        curFrame.vals.nameArr[m] = 0x1b;
                        break;
                    case 0x24:   //KF8FrameAttr::SKYLIGHT
                        curFrame.vals.valArr[offset + 0] = netObj.SkyL_Intensity;
                        curFrame.vals.valArr[offset + 1] = netObj.SkyL_Color.X;
                        curFrame.vals.valArr[offset + 2] = netObj.SkyL_Color.Y;
                        curFrame.vals.valArr[offset + 3] = netObj.SkyL_Color.Z;
                        curFrame.vals.nameArr[m] = 0x24;
                        break;
                }
                offset += (curFrame.vals.nameArr[m] & 0xF);
            }
        }
        this.OnFrameChange();
    }
/*    if(this.currentState && this.currentState.layers && this.currentState.layers.length > this.currentLayer)
    {
        var curLayer = this.currentState.layers[this.currentLayer];
        if(curLayer && curLayer.blocks)
        {
            for(var i = 0; i < curLayer.blocks.length; ++i)
            {
                if(curLayer.blocks[i].begin <= this.currentFrame && curLayer.blocks[i].end > this.currentFrame)
                {
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
                                            case 0x1b:   //KF8FrameAttr::DIRECTIONLIGHT
                                                curFrame.vals.valArr[offset + 0] = netObj.DirL_RotatorX;
                                                curFrame.vals.valArr[offset + 1] = netObj.DirL_Intensity;
                                                curFrame.vals.valArr[offset + 2] = netObj.DirL_Color.X;
                                                curFrame.vals.valArr[offset + 3] = netObj.DirL_Color.Y;
                                                curFrame.vals.valArr[offset + 4] = netObj.DirL_Color.Z;
                                                curFrame.vals.valArr[offset + 5] = netObj.DirL_NearShadowColor.X;
                                                curFrame.vals.valArr[offset + 6] = netObj.DirL_NearShadowColor.Y;
                                                curFrame.vals.valArr[offset + 7] = netObj.DirL_NearShadowColor.Z;
                                                curFrame.vals.valArr[offset + 8] = netObj.DirL_FarShadowColor.X;
                                                curFrame.vals.valArr[offset + 9] = netObj.DirL_FarShadowColor.Y;
                                                curFrame.vals.valArr[offset + 10] = netObj.DirL_FarShadowColor.Z;
                                                
                                                curFrame.vals.nameArr[m] = 0x1b;
                                                break;
                                            case 0x24:   //KF8FrameAttr::SKYLIGHT
                                                curFrame.vals.valArr[offset + 0] = netObj.SkyL_Intensity;
                                                curFrame.vals.valArr[offset + 1] = netObj.SkyL_Color.X;
                                                curFrame.vals.valArr[offset + 2] = netObj.SkyL_Color.Y;
                                                curFrame.vals.valArr[offset + 3] = netObj.SkyL_Color.Z;
                                                curFrame.vals.nameArr[m] = 0x24;
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
    }*/

}

Timeline.prototype.SetTODFrameIndex = function(obj){
    if(this.IsTOD)
    {
        if(obj.FrameIndex != -1){
            this.setHeaderCurrentFrame(obj.FrameIndex, true);
        }
    }
}


Timeline.prototype._TODTimeLineDefaultSet = function(tldata)
{
    if(this.assetId && this.assetId.indexOf("TOD") != -1)
    {
        for(let state of tldata.states)
        {
            if(!state.hasOwnProperty("loop"))
            {
                state.loop = true;
            }
        }
        //this.statepropcontainer.panel('open');
    }
    else
    {
        //this.statepropcontainer.panel('close');
    }
}

Timeline.prototype._TODTimeLineTabName = function()
{
    if(this.assetId && this.assetId.indexOf("TOD") != -1)
    {
        return "区域集";
    }
    else
    {
        return "";
    }
}

Timeline.prototype._IsTODTimeLine = function()
{
    return this.assetId && this.assetId.indexOf("TOD") != -1;
}

Timeline.prototype._SetTODTimeLineHeaderInfo = function()
{
    if(this.assetId && this.assetId.indexOf("TOD") != -1)
    {
        this.FRAMEINCRLENGTH = 48 * 30;
        this.FRAMEINCRDELTA = -1;
        this.frameWidth = 30;
    }
    else
    {
        this.FRAMEINCRLENGTH = 250;
        this.FRAMEINCRDELTA = 50;
    }
}

Timeline.prototype._TODDrawHeader = function(framec, c2d, x, y, realindex)
{
    if(this.assetId && this.assetId.indexOf("TOD") != -1)
    {
        if((framec % 5) == 0)
        {
            c2d.fillStyle = "rgb(220,220,220)";
            c2d.strokeStyle = "rgb(220,220,220)";
            c2d.fillText(this._FormatTime(framec / 60) + ":" + this._FormatTime(framec % 60), x, y * 0.75);
            //c2d.fillText(parseInt(framec / 60) + (parseInt(framec % 60) > 9 ? ":" : ":0") + parseInt(framec % 60), x, y * 0.75);
        }
        if(this.currentHeadFrame == realindex)
        {
            c2d.stroke();

            c2d.fillStyle = "rgb(250,0,0)";
            c2d.fillRect(x + 13,0,this.frameWidth - 25,this.hframeHeight);
            c2d.beginPath();
            c2d.fillStyle = "rgb(220,220,220)";
            c2d.strokeStyle = "rgb(220,220,220)";
        }
        return true
    }
    return false;
}

Timeline.prototype._FormatTime = function(num)
{
    if(num < 0) return "00";
    if(num < 10) return "0"+parseInt(num);
    return parseInt(num);
}