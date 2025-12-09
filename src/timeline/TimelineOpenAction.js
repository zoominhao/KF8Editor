Timeline.prototype._openActionInit = function()
{
    this.openaction = new Array();
    this.currentState = null;
    this.currentLayer = -1;
    this.currentFrame = -1;
    this.currentHeadFrame = 0;
}

Timeline.prototype._openState = function(stateData)
{
    if(this.currentState)
    {
        this._setOldAction(this.currentState.id, this.currentLayer, this.currentFrame, _global.seqId);
    }

    this.currentState = stateData;
    _global.stateId = this.currentState.id;
    stateId = this.currentState.id;

    let curaction = this.openaction[stateId];
    if(curaction)
    {
        this.currentLayer = curaction.lId;
        this.currentFrame = curaction.fId;
        //this.currentHeadFrame = -1;
    }
    else
    {
        this.currentLayer = -1;
        this.currentFrame = -1;
        //this.currentHeadFrame = -1;
    }
    this._initlayers();
    this.OnFrameChange();

    _global.Event.emit("OnStateChange", this.currentState);

    this.setHeaderCurrentFrame(curaction && curaction.fId > 0? curaction.fId : 0);

   if(curaction)
   {
        let layerdata = this.currentState.layers[this.currentLayer];
        let blocks = layerdata ? layerdata.blocks : [];
        let flag = false;
        for(let i = 0 ; i < blocks.length ; i++)
        {
            if(blocks[i] && blocks[i].keyframes)
            {
                for(let j = 0 ; j < blocks[i].keyframes.length ; j++)
                {
                    if(blocks[i].keyframes[j].id == this.currentFrame - blocks[i].begin)
                    {
                        flag = true;
                        break;
                    }
                }
            }
            if(flag)
                break;
        }
        if(flag)
        {
            if(KFDEditor.EditKFFrameData)
            {
                if (curaction.sId >= 0) {
                    KFDEditor.EditKFFrameDataByName(this.frameattribui, "data", curaction.sId, curaction.fieldPath);
                }
                if (curaction.fieldPath) delete curaction.fieldPath;
            }
        }
   }
}


Timeline.prototype._setOldAction = function(stateId, layerId, frameId, seqId, fieldPath)
{
    let action = {"lId":layerId, "fId":frameId, "sId":seqId};
    if (fieldPath) action.fieldPath = fieldPath;
    this.openaction[stateId] = action;
}

Timeline.prototype._checkAutoOpenAction = function () {
    if (_global.autotimelinesubpath) {
        let subpath = _global.autotimelinesubpath;
        if (subpath.hasOwnProperty("StateId")) {
            this._autoOpenStateId = subpath.StateId;
            this._setOldAction(subpath.StateId, subpath.LayerId, subpath.FrameId, subpath.ScriptId, subpath.FieldPath);
        }
        _global.autotimelinesubpath = null;
    }
    return this._autoOpenStateId ? this._autoOpenStateId : 0;
}
