var FrameTypes = {}

//FrameType  aabbccdd 每一段不能超过100
//aa 底色
FrameTypes.None = 0;
FrameTypes.BlockFrame = 1;
FrameTypes.BlockTweenFrame = 2;
FrameTypes.BlockKeyFrame = 3;
FrameTypes.BlockAtkBoxFrame = 4;
FrameTypes.BlockTweenKeyFrame = 5;

//bb
FrameTypes.BlockScriptFrame = 8;
FrameTypes.BlockNonAtkNonFxScriptFrame =9;
FrameTypes.BlockAtkNonFxScriptFrame = 10;
FrameTypes.BlockNonAtkFxScriptFrame = 11;
FrameTypes.BlockAtkFxScriptFrame = 12;

//cc
FrameTypes.BlockMoveScriptFrame = 13;
FrameTypes.BlockMoveStopScriptFrame = 14;

//dd
FrameTypes.BlockCreateScriptFrame = 15;
FrameTypes.BlockLinearTweenFrame = 16;


FrameTypes.GetFrameInfo = function (frameindex
                                    ,   blockdata)
{
    let offsetindex = frameindex - blockdata.begin;
    let bkfs = blockdata.keyframes;
    let outdata = null;

    if(bkfs)
    {
        for(let zkf = 0;zkf < bkfs.length; zkf ++)
        {
            let keyfd = bkfs[zkf];
            if(keyfd.id == offsetindex)
            {
                outdata = keyfd;
                break;
            }
        }
    }

    let sdata = outdata ? outdata.data : null;
    let box = outdata ? outdata.box : null;
    let tweenType = null;
    if(outdata && outdata.vals && outdata.vals.tween)
    {
        tweenType = outdata.vals.tween.__cls__;
    }
    let blockType = blockdata.opOption;
    let curType = FrameTypes.GetFrameType(blockType,tweenType, sdata, box);
    /*return {    data:outdata
        ,       frameType:outdata ? 
                (box && box.AttackBoxes && box.AttackBoxes.length > 0 ?  FrameTypes.BlockAtkBoxFrame:
            (scripts && scripts.length > 0 ?  FrameTypes.BlockScriptFrame:FrameTypes.BlockKeyFrame))
            : FrameTypes.BlockFrame
    };*/
    return {    data:outdata,       
                frameType:curType
    };
}

FrameTypes.GetFrameType = function(blockType, tweenType, sdata, box)
{
    //底色
    let aa = blockType == 31 ? FrameTypes.BlockTweenFrame : FrameTypes.BlockFrame;
    if(sdata || box)
    {
        aa = FrameTypes.BlockKeyFrame;
    }
    if(box && box.AttackBoxes && box.AttackBoxes.length > 0)
    {
        aa = FrameTypes.BlockAtkBoxFrame;
    }
    
    let scripts = null;
    if(sdata)
    {
        scripts = sdata.scripts;
    }
     

    let bb = 0;
    let cc = 0;
    let dd = 0;
    if(scripts && scripts.length > 0)
    {
        let fx = false;
        let hit = false;
        let move = false;
        let movestop = false;
        let createentity = false;
        //脚本
        for(let idx = 0;idx < scripts.length; idx++)
        {
            if(scripts[idx] == null) 
            {
                console.error("frame script is null");
                continue;
            }
            
            let kfddata = _global.editor.context.kfdtable.get_kfddata(scripts[idx].__cls__);
            if(kfddata && kfddata.extend == "KFProgressData")
            {
                aa = FrameTypes.BlockTweenKeyFrame;
            }

            if(scripts[idx].__cls__ == "TSHitTestScriptData")
            {
                hit = true;
            }
            else if(scripts[idx].__cls__ == "GSPlayVisualFXScriptData")
            {
                fx = true;
            }
            else if(scripts[idx].__cls__ == "TSMoveScriptData")
            {
                /*let kfdData = kfdTable.get_kfddata(scripts[idx].__cls__);
                for (let i = 0; i < this.kfdData.propertys.length; i++) {
                    let prop = this.kfdData.propertys[i];
                    if(prop.name == "bStop")
                    {
                    }
                    
                }*/
                if(scripts[idx].bStop)
                {
                    movestop = true;
                }
                
                move = true;
            }
            else if(scripts[idx].__cls__ == "GSCreateEntityData")
            {
                createentity = true;
            }
        }
        if(hit)
        {
            if(fx) 
            {
                bb = FrameTypes.BlockAtkFxScriptFrame;
            }
            else
            {
                bb = FrameTypes.BlockAtkNonFxScriptFrame;
            }
        }
        else
        {
            if(fx) 
            {
                bb = FrameTypes.BlockNonAtkFxScriptFrame;
            }
            else
            {
                bb = FrameTypes.BlockNonAtkNonFxScriptFrame;
            }
        }

        
        if(movestop)
        {
            cc = FrameTypes.BlockMoveStopScriptFrame;
        }
        else if(move)
        {
            cc = FrameTypes.BlockMoveScriptFrame;
        }


        if(createentity)
        {
            dd = FrameTypes.BlockCreateScriptFrame;
        }
    }
    else
    {
        if(tweenType == "LinearTweenOperation")
        {
            dd = FrameTypes.BlockLinearTweenFrame;
        }
    }
    
    return aa * 1000000 + bb * 10000 + cc * 100 + dd;
}

Timeline.prototype._drawInit = function()
{
    this.FRAMEINCRLENGTH = 250;
    this.FRAMEINCRDELTA = 50;
    this.maxframecount = this.FRAMEINCRLENGTH;

    let vscontent = domui.vscroll.content;
    vscontent.width(this.maxframecount * this.frameWidth + "px");
}



Timeline.prototype.ResizeMaxFrames = function(statelength)
{
    this._SetTODTimeLineHeaderInfo();
    this.maxframecount = this.FRAMEINCRLENGTH;
    this.headframeCount = this.FRAMEINCRLENGTH;
    
    while(this.maxframecount < statelength + this.FRAMEINCRDELTA)
    {
        this.maxframecount += this.FRAMEINCRLENGTH;
        this.headframeCount += this.FRAMEINCRLENGTH;
    }

    this.vscroll.content.width(this.maxframecount * this.frameWidth + "px");
    this._drawHeaderFrames();
    this._redrawAllLayers();
}

/////////////draw header/////////////////////////////////
Timeline.prototype._drawHeaderFrames = function()
{
    var c2d = this.hfFrame.get(0).getContext("2d");

    c2d.canvas.width = this.frameWidth * this.headframeCount;
    c2d.canvas.height = this.hframeHeight;

    c2d.beginPath();
    c2d.strokeStyle = "rgb(220,220,220)";    //设定描边颜色为红色，只要写在.stroke()方法前面即可

    for(var i = 0 ;i < this.headframeCount; i ++)
    {
        this._drawHFrame(c2d,i,0,false);
    }

    c2d.stroke();  //描边
}

Timeline.prototype._drawHFrame = function(c2d,index,type,cc)
{
    let realindex = index;

    if(index >= this.maxframecount)
    {
        index = this.maxframecount;
    }

    var x = index * this.frameWidth;
    var y = this.hframeHeight;

    if(cc)
    {
        c2d.clearRect(x - 1,0,this.frameWidth + 1,this.hframeHeight);
    }

    var centerx = x + this.frameWidth * 0.5;
    c2d.moveTo(centerx,y * 0.8);
    c2d.lineTo(centerx,y);
    //console.log(centerx);
    //c2d.fillStyle = this.fillStyles[frameType];
    //c2d.fillRect(x,y,this.frameWidth - 1,this.frameHeight - 1);
    var framec = realindex;

    if(!this._TODDrawHeader(framec, c2d, x, y, realindex))
    {
        if((framec % 5) == 0)
        {
            c2d.fillStyle = "rgb(220,220,220)";
            c2d.strokeStyle = "rgb(220,220,220)";
            var num = framec.toString().length;
            c2d.fillText(framec + "",(x+9)-(num*2.5),(y * 0.75)-5);
        }
        if(this.currentHeadFrame == realindex)
        {
            c2d.stroke();

            c2d.fillStyle = "rgb(250,0,0)";
            c2d.fillRect(x + 1,0,this.frameWidth - 1,this.hframeHeight);

            //console.log(x,0, this.frameWidth, this.hframeHeight);


            c2d.beginPath();
            //c2d.fillStyle = "rgb(88,0,0)";
            //c2d.fillText(framec + "",x,y * 0.25);

            c2d.fillStyle = "rgb(220,220,220)";
            c2d.strokeStyle = "rgb(220,220,220)";
        }
    }
}

Timeline.prototype.setHeaderCurrentFrame = function(frameindex, ignoreevent)
{
    if(frameindex < 0)
        return;

    if(this.currentHeadFrame == frameindex)
    {
        return;
    }

    let oldframe = this.currentHeadFrame;
    this.currentHeadFrame = frameindex;

    var c2d = this.hfFrame.get(0).getContext("2d");
    c2d.beginPath();
    c2d.strokeStyle = "rgb(220,220,220)";

    this._drawHFrame(c2d,oldframe,0,true);

    let framec = oldframe;
    if((framec % 5) == 0 || framec == 1)
    {
        this._drawHFrame(c2d,oldframe - 1,0,true);
    }else{
        framec = oldframe + 2;
        if((framec % 5) == 0 || framec == 1){
            this._drawHFrame(c2d,oldframe + 1,0,true);
        }
    }

    this._drawHFrame(c2d,frameindex,0,true);

    c2d.stroke();  //描边

    _global.editorConfig.CurrentFrameIndex = frameindex;

    $('#headframelabel').html(frameindex);
    if (!ignoreevent) {
        _global.Event.emit("OnFrameChange", frameindex);
    }
}


/////////////draw layer/////////////////////////////////
Timeline.prototype._redrawAllLayers = function()
{
    if(!this.currentState) return;
    let layers = this.currentState.layers;
    let layerCount = layers.length;
    let frameCount = this.maxframecount;

    let newwidth = this.frameWidth * frameCount;
    let newheight = this.frameHeight * layerCount;
    let cv  = this.c2d.canvas;

    if(newwidth != cv.width || newheight != cv.height)
    {
        cv.width = newwidth;
        cv.height = newheight;
    }
    else
    {
        this.c2d.clearRect(0,0,newwidth,newheight);
    }

    for(let i = 0 ;i < layerCount ;i ++)
    {
        let layerData = layers[i];
        this._drawFrames(i, frameCount, layerData,false);
    }

    this._reloadHeaders({total:layerCount,rows:layers});
    this.SelectedLayer(this.currentLayer,true, this.currentFrame);
}

Timeline.prototype._redrawIndexLayers = function(indexs)
{
    let layers = this.currentState.layers;
    for(let i = 0 ;i < indexs.length ;i ++)
    {
        let index = indexs[i];
        if(index < layers.length)
        {
            let layerData = layers[index];
            this._drawFrames(index, this.maxframecount, layerData, true);
        }
    }
}



/////////////draw frames/////////////////////////////////
Timeline.prototype._drawFrames = function(layerIndex, frameCount, lydata, cc)
{
    let x = 0;
    let y = layerIndex * this.frameHeight;
    let w = frameCount * this.frameWidth;
    let h = this.frameHeight;

    if(cc)
    {
        this.c2d.clearRect(x,y,w,h);
    }

    ///把BLCK平铺一下数据
    let tldata = this._GetFrameBlock(0, lydata);

    for(let i = 0;i < frameCount; i ++)
    {
        this._drawFrame(layerIndex,i,tldata.frameTypes[i],false);
    }

    this._PlotDrawFrames(layerIndex, lydata);
    this._PlotDrawSpecialBox(layerIndex, lydata);
    this._DescDrawFrames(layerIndex);
}

Timeline.prototype._drawFrameIndexs = function(frameindexs, layerIndex)
{
    if(layerIndex == null)
    {
        layerIndex = this.currentLayer;
    }

    let layerdata = this.currentState.layers[layerIndex];

    for(let i = 0;i < frameindexs.length; i ++)
    {
        let frameindex = frameindexs[i];
        let framedata = this._GetFrameBlock(frameindex, layerdata, true);

        this._drawFrame(layerIndex, frameindex, framedata.frameType,true);
    }
    this._PlotDrawFrames(layerIndex, layerdata);
    this._PlotDrawSpecialBox(layerIndex, layerdata);
    this._DescDrawFrames(layerIndex);
}

Timeline.prototype._drawFrame = function(layerIndex,frameIndex,frameType,clear)
{
    let x = frameIndex * this.frameWidth;
    let y = layerIndex * this.frameHeight;

    if(clear)
    {
        this.c2d.clearRect(x,y,this.frameWidth,this.frameHeight);
    }

    let Isban = false;
    if(this.currentState && this.currentState.layers)
    {
        Isban = this.currentState.layers[layerIndex].option.ban;
    }
    

    let framestyle = Isban ? this._GetGrayColor(70, 70, 70) : "rgb(70,70,70)";

    if(layerIndex == this.currentLayer)
    {
        if(frameIndex == this.currentFrame)
        {
            this.c2d.fillStyle = Isban ? this._GetGrayColor(250,89,89) : "rgb(250,89,89)";
        }
        else
            this.c2d.fillStyle = Isban ? this._GetGrayColor(0,82,163) : "rgb(0,82,163)";
  
        this.c2d.fillRect(x,y,this.frameWidth,this.frameHeight);
    }

    let aa = parseInt(frameType / 1000000);
    let bb = parseInt((frameType - aa * 1000000) / 10000);
    let cc = parseInt((frameType - aa * 1000000 - bb * 10000) / 100);
    let dd = frameType - aa * 1000000 - bb * 10000 - cc * 100;

    switch (aa)
    {
        case FrameTypes.BlockFrame:
            framestyle = Isban ? this._GetGrayColor(188,188,255) : "rgb(188,188,255)";
            break;
        case FrameTypes.BlockTweenFrame:
            framestyle = Isban ? this._GetGrayColor(220,220,255) : "rgb(220,220,255)";
            break;
        case FrameTypes.BlockAtkBoxFrame:
            framestyle = Isban ? this._GetGrayColor(255,126,126) : "rgb(255,126,126)";
            break;
        case FrameTypes.BlockTweenKeyFrame:
            framestyle = Isban ? this._GetGrayColor(88,180,220) : "rgb(88,180,220)";
            break; 
        case FrameTypes.BlockKeyFrame:
        case FrameTypes.BlockScriptFrame:
            framestyle = Isban ? this._GetGrayColor(88,88,255) : "rgb(88,88,255)";
            break;
        default:
            break;
    }

    this.c2d.fillStyle = framestyle;
    this.c2d.fillRect(x + 1,y + 1,this.frameWidth - 2,this.frameHeight - 2);

    
    if(this.RenderStatesFrameExist(frameIndex) && layerIndex == 0)
    {
        //this._drawCircle(x + this.frameWidth / 2, y + this.frameHeight / 2, this.frameWidth * 0.2, "rgb(100,200,100)");
        this._drawCircle(x + this.frameWidth / 2, y + this.frameHeight * 0.8, this.frameWidth * 0.2, Isban ? this._GetGrayColor(100,200,100) : "rgb(100,200,100)");
    }

    if(bb == FrameTypes.BlockNonAtkNonFxScriptFrame)
    {
        this._drawCircle(x + this.frameWidth / 2, y + this.frameHeight / 2, this.frameWidth * 0.4, "white");
        this._drawCircle(x + this.frameWidth / 2, y + this.frameHeight / 2, this.frameWidth * 0.2, "black");
    }
    else if(bb == FrameTypes.BlockAtkNonFxScriptFrame)
    {
        this._drawCircle(x + this.frameWidth / 2, y + this.frameHeight / 2, this.frameWidth * 0.4, "white");
        this._drawCircle(x + this.frameWidth / 2, y + this.frameHeight / 2, this.frameWidth * 0.2, Isban ? this._GetGrayColor(255,0,0) : "rgb(255,0,0)");
    }
    
    else if(bb == FrameTypes.BlockNonAtkFxScriptFrame)
    {
        this._drawCircle(x + this.frameWidth / 2, y + this.frameHeight / 2, this.frameWidth * 0.4, Isban ? this._GetGrayColor(255,255,0) : "rgb(255,255,0)");
        this._drawCircle(x + this.frameWidth / 2, y + this.frameHeight / 2, this.frameWidth * 0.2, "black");
    }
    else if(bb == FrameTypes.BlockAtkFxScriptFrame)
    {
        this._drawCircle(x + this.frameWidth / 2, y + this.frameHeight / 2, this.frameWidth * 0.4, Isban ? this._GetGrayColor(255,255,0) : "rgb(255,255,0)");
        this._drawCircle(x + this.frameWidth / 2, y + this.frameHeight / 2, this.frameWidth * 0.2, Isban ? this._GetGrayColor(255,0,0) : "rgb(255,0,0)");
    }
    else if(bb == FrameTypes.BlockScriptFrame)
    {
        this._drawText("s", x + this.frameWidth / 2, y + this.frameHeight / 2, "white"); //理论上走不到这个分支
    }


    if(cc == FrameTypes.BlockMoveScriptFrame)
    {
        this._drawTriangle(x, y, this.frameWidth, this.frameHeight, "rb", "black");
        //this._drawText("M", x + this.frameWidth - 5, y + this.frameHeight - 5, "black");
    }
    else if(cc == FrameTypes.BlockMoveStopScriptFrame)
    {
        this._drawTriangle(x, y, this.frameWidth, this.frameHeight, "rb", "white");
    }

    if(dd == FrameTypes.BlockCreateScriptFrame)
    {
        this._drawTriangle(x, y, this.frameWidth, this.frameHeight, "lt", "white");
        //this._drawText("Y", x + 5, y + 5, "black");
    }
    else if(dd == FrameTypes.BlockLinearTweenFrame)
    {
        this._drawLine(x, y + this.frameHeight / 2, this.frameWidth + x, y + this.frameHeight / 2, Isban ? this._GetGrayColor(160,160,20) : "rgb(160,160,20)");
    }
}

Timeline.prototype._PlotDrawSpecialBox = function(layerIndex, layerdata)
{
    let blocks = layerdata ? layerdata.blocks : [];
    for(let indexBlock = 0; indexBlock < blocks.length; indexBlock++)
    {
        let blockData = blocks[indexBlock];
        if (!blockData || !blockData.keyframes) continue;
        //sort
        function compare(p){ //这是比较函数
            return function(m,n){
                var a = m[p];
                var b = n[p];
                return a - b; //升序
            }
        }
        blockData.keyframes.sort(compare("id"));

        for(let indexFrame = 0; indexFrame < blockData.keyframes.length; indexFrame++)
        {
            let frameBox = blockData.keyframes[indexFrame].box;
            let beginFrameIndex = blockData.keyframes[indexFrame].id;
            if(!frameBox || !frameBox.SpecialBoxes || frameBox.SpecialBoxes.length == 0) continue;
            let defendTagHit = false;
            let DodgeTagHit = false;
            for(let indexBox = 0; indexBox < frameBox.SpecialBoxes.length; indexBox++)
            {
                let specialbox = frameBox.SpecialBoxes[indexBox];
                if(specialbox.type == 3 || (specialbox.perfectLevel && specialbox.perfectLevel > 0)) continue;   //非完美框
                let curTag = specialbox.tag;
                if(curTag != 4 && curTag != 5) continue;
                if(curTag == 4 && defendTagHit) continue;
                if(curTag == 5 && DodgeTagHit) continue;

                if(curTag == 4) defendTagHit = true;
                if(curTag == 5) DodgeTagHit = true;
                
                let endIndexFrame = blockData.end;
                for(let nextIndexFrame = indexFrame + 1; nextIndexFrame < blockData.keyframes.length; nextIndexFrame++)
                {
                    let nextFrameBox = blockData.keyframes[nextIndexFrame].box;
                    if(!nextFrameBox || !nextFrameBox.SpecialBoxes || nextFrameBox.SpecialBoxes.length == 0) continue;
                    let breakflag = false;
                    for(let nextIndexBox = 0; nextIndexBox < nextFrameBox.SpecialBoxes.length; nextIndexBox++)
                    {
                        let nextSpecialbox = nextFrameBox.SpecialBoxes[nextIndexBox];
                        //if(nextSpecialbox.perfectLevel && nextSpecialbox.perfectLevel > 0) continue;   //非完美框
                        let nextTag = nextSpecialbox.tag;
                        if(nextTag == curTag)
                        {
                            breakflag = true;
                            break;
                        }
                    }
                    
                    if(breakflag) 
                    {
                        endIndexFrame = blockData.keyframes[nextIndexFrame].id;
                        break;
                    }
                }

                if(curTag == 4) //防御格挡框
                {
                    let lineHeight = layerIndex * this.frameHeight + 5;
                    let beginLineX = beginFrameIndex * this.frameWidth + (this.frameWidth/2);
                    let endLineX = endIndexFrame * this.frameWidth - (this.frameWidth/3);
                    this._drawLine(beginLineX, lineHeight, endLineX, lineHeight, "rgb(0,255,255)");
                    this._drawUShape(endLineX-(this.frameWidth*0.3), lineHeight, this.frameWidth*0.3, this.frameHeight*0.28, "rgb(0,255,255)", 0.8, "black");
                }
                else if(curTag == 5) //闪避框
                {
                    let lineHeight = layerIndex * this.frameHeight + 10;
                    let beginLineX = beginFrameIndex * this.frameWidth + (this.frameWidth/2);
                    let endLineX = endIndexFrame * this.frameWidth - (this.frameWidth/3);
                    this._drawLine(beginLineX, lineHeight, endLineX, lineHeight, "rgb(0,0,0)");
                    this._drawUShape(endLineX-(this.frameWidth*0.3), lineHeight, this.frameWidth*0.3, this.frameHeight*0.28, "rgb(0,0,0)", 0.8, "black");
                }
            }    
        }
    }
}

Timeline.prototype._GetGrayColor = function(R, G, B)
{
    var gray = R*0.299 + G*0.587 + B*0.114;
    return "rgb(" + gray + "," + gray + "," + gray +")";
}

Timeline.prototype._drawLine = function(x1,y1,x2,y2,color,lineWidth=2)
{
    this.c2d.beginPath();
    //this.c2d.fillStyle = color;
    //this.c2d.lineStyle = color;
   
    this.c2d.lineWidth = lineWidth;
    this.c2d.moveTo(x1, y1);
    this.c2d.lineTo(x2, y2);
    this.c2d.strokeStyle = color;
    this.c2d.stroke();
    this.c2d.closePath();
    this.c2d.fill();
    this.c2d.restore();
}

Timeline.prototype._drawUShape = function(x,y,width,height,color,lineWidth=0.5,strokeStyle="black")
{
    this.c2d.beginPath();
    this.c2d.fillStyle = color;
    this.c2d.lineWidth = lineWidth;
    this.c2d.strokeStyle = strokeStyle;
    this.c2d.moveTo(x, y);
    this.c2d.lineTo(x, y+height);
    this.c2d.lineTo(x+width, y+height);
    this.c2d.lineTo(x+width, y);
    this.c2d.fill();
    this.c2d.stroke();
    this.c2d.restore();
}

Timeline.prototype._drawSquare = function(x,y,width,height,color)
{
    this.c2d.beginPath();
    this.c2d.fillStyle = color;
    this.c2d.lineWidth = lineWidth;
    this.c2d.strokeStyle = strokeStyle;
    this.c2d.moveTo(x, y);
    this.c2d.lineTo(x+width, y);
    this.c2d.lineTo(x+width, y+height);
    this.c2d.lineTo(x, y+height);
    this.c2d.lineTo(x, y);
    this.c2d.fill();
    this.c2d.stroke();
    this.c2d.restore();
}

Timeline.prototype._drawCircle = function(x,y,radius,color)
{
    this.c2d.beginPath();
    this.c2d.fillStyle = color;
    this.c2d.lineWidth = 0.5;
    this.c2d.strokeStyle = "black";
    this.c2d.arc(x, y, radius, 0, Math.PI*2);
    this.c2d.fill();
    this.c2d.stroke();
    this.c2d.restore();
}

Timeline.prototype._drawTriangle = function(x,y,width,height, corner, color, scale = 0.5)  //等腰直角三角形
{
    this.c2d.beginPath();
    this.c2d.fillStyle = color;
    this.c2d.lineStyle = color;
    this.c2d.strokeStyle = "black";
    this.c2d.lineWidth = 0.5;
  
    if(corner == "lt")
    {
        this.c2d.moveTo(x, y);
        this.c2d.lineTo(x, y + width * scale);
        this.c2d.lineTo(x + width * scale, y);
    }
    else if(corner == "rt")
    {
        this.c2d.moveTo(x + width, y);
        this.c2d.lineTo(x + width, y + width * scale);
        this.c2d.lineTo(x + width * (1 - scale), y);
    }
    else if(corner == "lb")
    {
        this.c2d.moveTo(x, y + height);
        this.c2d.lineTo(x + width * scale, y + height);
        this.c2d.lineTo(x, y + height - width * scale);
    }
    else if(corner == "rb")
    {
        this.c2d.moveTo(x + width, y + height);
        this.c2d.lineTo(x + width, y + height - width * scale);
        this.c2d.lineTo(x + width * (1- scale), y + height);
    }

    this.c2d.closePath();
    this.c2d.fill();
    this.c2d.stroke();
    this.c2d.restore();
}

Timeline.prototype._drawText = function(txt, x, y, color)
{
    this.c2d.font = "10px Arial";
    this.c2d.fillStyle = color;
    this.c2d.textAlign = "center";
    this.c2d.textBaseline = 'middle';
    this.c2d.fillText(txt, x, y);
}