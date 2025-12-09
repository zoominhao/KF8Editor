Timeline.prototype._renderBlockInit = function()
{
    let self = this;
   //滚动鼠标滚轮
   document.getElementById('framecontent').addEventListener('mousewheel',function (evt)
   {
       if(evt.altKey)
       {
           if(evt.wheelDelta < 0 && self.sizerate > 0.3)
           {
                self.sizerate -= 0.1;
                self.frameWidth = 20 * self.sizerate;
                self.ResizeMaxFrames(self.currentState.length);
           }
           if(evt.wheelDelta > 0 && self.sizerate < 1.5)
           {
                self.sizerate += 0.1;
                self.frameWidth = 20 * self.sizerate;
                self.ResizeMaxFrames(self.currentState.length);
           }
       }
       else if(evt.ctrlKey)//左右滑动时间轴
       {
           let scrollbar = $('#tlvscrollbar')[0];
           let scrollLeft = scrollbar.scrollLeft;
           let scrollWidth = scrollbar.scrollWidth;
           let offset = 300 * self.sizerate;
           if(evt.wheelDelta < 0 && scrollLeft < scrollWidth)
                scrollbar.scrollLeft += offset;
           else if(evt.wheelDelta > 0 && scrollLeft > 0)
                scrollbar.scrollLeft -= offset;
       }
       else
       {
           self.ModifyRenderStateBlock(CVEventPosition(evt), evt.wheelDelta);
       }

   },false);
}

Timeline.prototype._renderBlockChangeState = function(stateData)
{
     /// animation blend data
   this._updateRenderStateData(this.GetRenderState(stateData.id), stateData);
}

Timeline.prototype._renderBlockClick = function(evt)
{
    let flag = false;
    if(evt.ctrlKey)
    {
        flag = true;
        this.AddRenderStateBlock(CVEventPosition(evt));
    }
    else if(evt.altKey)
    {
        flag = true;
        this.RemoveRenderStateBlock(CVEventPosition(evt));
    }
    return flag;
}

Timeline.prototype.ModifyRenderStateBlock = function(point, delta)
{
    let frameindex = Math.floor(point.x / this.frameWidth);
    let layerindex = Math.floor(point.y / this.frameHeight);
    if(this.currentState.layers == null || this.currentState.layers[0].blocks == null) return;
    let layerdata = this.currentState.layers[0];
    let blockdata = layerdata.blocks[0];
    let deltaSpeed = 1;
    if(this.RenderStatesFrameExist(frameindex) && blockdata)
    {
        let frameinfo = this.GetRenderStateFrame(frameindex);
   
        let length = delta > 0 ? frameinfo.length + deltaSpeed : frameinfo.length - deltaSpeed;
        this.currentState.length = delta > 0 ? layerdata.length + deltaSpeed : layerdata.length - deltaSpeed;
        layerdata.length = delta > 0 ? layerdata.length + deltaSpeed : layerdata.length - deltaSpeed;
        
        let lastend = blockdata.end;
        blockdata.end = delta > 0 ? blockdata.end + deltaSpeed : blockdata.end - deltaSpeed;
       
        
        let frameInterval1 =  (frameinfo.length + (delta > 0 ? deltaSpeed : (-1 * deltaSpeed))) / (frameinfo.length * frameinfo.speed);
        let frameInterval2 =  frameinfo.length / (frameinfo.length * frameinfo.speed);

        let repeatedIdx = new Array();
        for(let i = 0; i < blockdata.keyframes.length; ++i)
        {
            //处理frameinfo后面的关键帧
            if(blockdata.keyframes[i].id >= frameinfo.frameId + frameinfo.length)
            {
                blockdata.keyframes[i].id = delta > 0 ? blockdata.keyframes[i].id + deltaSpeed : blockdata.keyframes[i].id - deltaSpeed;
            }
            //处理frameinfo内的关键帧插值问题
            else if(blockdata.keyframes[i].id > frameinfo.frameId)
            {

                let nextId = Math.round(Math.round((blockdata.keyframes[i].id - frameinfo.frameId) / frameInterval2) * frameInterval1) + frameinfo.frameId;
                for(let j = 0; j < blockdata.keyframes.length; ++j)
                {
                    if(blockdata.keyframes[j].id == nextId)
                    {
                        repeatedIdx.push({pos:i, id:nextId});
                    }
                }
                blockdata.keyframes[i].id = nextId;
            }
        }

        //删除重复关键帧
        let todel = new Array();
        for(let i = 0; i < blockdata.keyframes.length; ++i)
        {
            for(let j = 0; j < repeatedIdx.length; ++j)
            {
                if(blockdata.keyframes[i].id == repeatedIdx[j].id && i != repeatedIdx[j].pos)
                {
                    todel.push(repeatedIdx[j].pos);
                }
            }
        }

        for(let i = 0; i < todel.length; ++i)
        {
            blockdata.keyframes.splice(todel[i], 1);
        }
        
        //处理frameinfo后面的其他frameinfo
        let curRenderState = this.GetRenderState(this.currentState.id);
        for(let renderFrame of curRenderState.frames)
        {
            if(renderFrame.frameId >= frameinfo.frameId + frameinfo.length )
            {
                renderFrame.frameId = delta > 0 ? renderFrame.frameId + deltaSpeed : renderFrame.frameId - deltaSpeed;
            }
        }

        if(length <= 0)
        {
            this.RemoveRenderBlock(frameindex);
        }
        else
        {
            let speed = (frameinfo.length / length) * frameinfo.speed;
            this.ModifyRenderBlock(frameindex, length, speed);
        }


        let drawEnd = lastend > blockdata.end ? lastend : blockdata.end;
        let drawFrames = [];
        for(let i = blockdata.begin; i < drawEnd; ++i)
        {
            drawFrames.push(i);
        }
        this._drawFrameIndexs(drawFrames, layerindex);
        this.OnFrameChange();
        
    }
}

Timeline.prototype.RemoveRenderStateBlock = function(point)
{
    let frameindex = Math.floor(point.x / this.frameWidth);
    let layerindex = Math.floor(point.y / this.frameHeight);
    if (this.renderStates)
    {
        if(!this.RenderStatesFrameExist(frameindex))
        {
            Nt("该段无帧控制数据");
            return;
        }
        
        this.RemoveRenderBlock(frameindex);
        if(this.currentState && this.currentState.layers && this.currentState.layers[0])
        {
            if(this.currentState.layers[0].blocks && this.currentState.layers[0].blocks[0])
            {
                let curBlock = this.currentState.layers[0].blocks[0];
                let drawFrames = [];
                for(let i = curBlock.begin; i < curBlock.end; ++i)
                {
                    drawFrames.push(i);
                }
                this._drawFrameIndexs(drawFrames, layerindex);
                this.OnFrameChange();
            }
        }
    }
}

Timeline.prototype.AddRenderStateBlock = function(point)
{
    let frameindex = Math.floor(point.x / this.frameWidth);
    let layerindex = Math.floor(point.y / this.frameHeight);
    let hasSet = false;

    if(this.renderStates)
    {
        if(this.RenderStatesFrameExist(frameindex) && this.markRenderFrameId == -1)
        {
            hasSet = true;
            Nt("该段已经设置帧控制数据");
        }
        if(!hasSet)
        {
            let drawFrames = new Array();
            if(this.markRenderFrameId == -1)
            {
                this.markRenderFrameId = frameindex;
                this.AddRenderBlock(frameindex);
                drawFrames.push(frameindex);
            }
            else
            {
                if(this.markRenderFrameId == frameindex)
                {
                    this.markRenderFrameId = -1; //取消
                    this.RemoveRenderBlock(frameindex);
                    drawFrames.push(frameindex);
                }
                else
                {
                    let frameId = this.markRenderFrameId;
                    let length = frameindex - this.markRenderFrameId + 1;
                    if(this.markRenderFrameId > frameindex)
                    {
                        frameId = frameindex;
                        length = this.markRenderFrameId - frameindex + 1;
                    }
                    this.ModifyRenderBlock(frameId, length, 1);
                    this.markRenderFrameId = -1;

                    for(let i = frameId; i < frameId + length; ++i)
                    {
                        drawFrames.push(i);
                    }
                }
            }


            this._drawFrameIndexs(drawFrames, layerindex);
            this.OnFrameChange();
        }
    }
}


Timeline.prototype.RenderStatesFrameExist = function(frameId)
{
    let curRenderState = this.GetRenderState(this.currentState.id);
    if(curRenderState == null || !curRenderState.frames) return false;
    for(let renderFrame of curRenderState.frames)
    {
        if(renderFrame.frameId <= frameId && renderFrame.frameId + renderFrame.length > frameId)
        {
            return true;
        }
    }
    return false;
}

Timeline.prototype.RemoveRenderBlock = function(frameId)
{
    let curRenderState = this.GetRenderState(this.currentState.id);
    if(curRenderState == null || curRenderState.frames == undefined) return;

    for(let i = 0; i < curRenderState.frames.length; ++i)
    {
        if(curRenderState.frames[i].frameId <= frameId && curRenderState.frames[i].frameId + curRenderState.frames[i].length > frameId)
        {
            curRenderState.frames.splice(i, 1);
            return;
        }
    }
}

Timeline.prototype.AddRenderBlock = function(frameId)
{
    let curRenderState = this.AddRenderStateData(this.currentState.id);
    if(curRenderState.frames == undefined) curRenderState.frames = [];

    curRenderState.frames.push({frameId:frameId, name:"", length:1, speed:1});
}

Timeline.prototype.ModifyRenderBlock = function(frameId, length, speed)
{
    let curRenderState = this.GetRenderState(this.currentState.id);
    if(curRenderState != null) 
    {
        for(let i = 0; i < curRenderState.frames.length; ++i)
        {
            if(curRenderState.frames[i].frameId <= frameId && curRenderState.frames[i].frameId + curRenderState.frames[i].length > frameId)
            {
                curRenderState.frames[i].length = length;
                curRenderState.frames[i].speed = speed;
                return;
            }
        }
    }    
}

Timeline.prototype.GetRenderStateFrame = function(frameId)
{
    let curRenderState = this.GetRenderState(this.currentState.id);
    if(curRenderState != null) 
    {
        for(let renderFrame of curRenderState.frames)
        {
            if(renderFrame.frameId <= frameId && renderFrame.frameId + renderFrame.length > frameId)
            {
                return renderFrame;
            }
        }
    }   
    return null; 
}

Timeline.prototype.GetRenderState = function(stateId)
{
    for(let i = 0; i < this.renderStates.length; ++i)
    {
        if(this.renderStates && this.renderStates[i] && this.renderStates[i].id == stateId)
        {
            return this.renderStates[i];
        }
    }
    return null;
}

Timeline.prototype.RemoveRenderState = function(stateId)
{
    for(let i = 0; i < this.renderStates.length; ++i)
    {
        if(this.renderStates[i].id == stateId)
        {
            this.renderStates.splice(i,1);
            break;
        }
    }
}

Timeline.prototype.AddRenderStateData = function(stateId)
{
    let rstate = this.GetRenderState(stateId);
    if(rstate == null)
    {
        rstate = {};
        rstate.id = stateId;
        rstate.__cls__ = "KF8TLRenderData";
        this.renderStates.push(rstate);
    }
    return rstate;
}

Timeline.prototype._updateRenderStateData = function (rdStateData, state)
{
    let self = this;
    let flag = (rdStateData == null);
    let addAnimBtn = this.domui.timelineAddAnim;

    addAnimBtn._flag = flag
    addAnimBtn._state = state;

    addAnimBtn.text(flag ? "+Blend" : "-Blend");
    addAnimBtn.off('click');
    addAnimBtn.click(
        function ()
        {
            if(addAnimBtn._flag)
            {
                self._updateRenderStateData(self.AddRenderStateData(addAnimBtn._state.id), addAnimBtn._state);
            }
            else
            {
                self.RemoveRenderState(addAnimBtn._state.id);
                self._updateRenderStateData(null, addAnimBtn._state);
            }
        });

    this.domui.timelineEdtTile.text(state.name);
    if(rdStateData && rdStateData.__cls__ != "KF8TLRenderData")
    {
        rdStateData.__cls__ = "KF8TLRenderData";
    }

    this.moreinfoui.Edit(rdStateData, {frames: false,id:false});
}