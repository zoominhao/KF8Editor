Timeline.prototype._inputInit = function()
{
    let doKeyDown = function (event) {
        let handled;
        if (event.key !== undefined) {
            handled = event.key;
        }
        if (handled && !_global.PreventShortKey) {
            // 如果事件已处理，则禁止“双重操作”
            if (handled == "Delete") {
                event.preventDefault();
                _global.timeline.RemoveBlockFrame();
            } 
        }
        if (_global.timeline.IsPlot && _global.timeline.uiFrameFocused)//鼠标在时间轴区域
        {
            if (_global.timeline.currentFrame >= 0)//有选中帧
            {
                if(event.ctrlKey && handled == "c")
                {
                    _global.timeline.CopyFrame();
                }
                else if(event.ctrlKey && handled == "v")
                {
                    _global.timeline.PasteFrame();
                }
                else if(event.ctrlKey && handled == "x")
                {
                    _global.timeline.CutFrame();
                }
                else if(event.shiftKey && handled == "F6")
                {
                    _global.timeline.CreateKeyFrame(1);
                }
                else if(handled == "F5")
                {
                    _global.timeline.IncreaseBlock();
                }
                else if(handled == "F6")
                {
                    _global.timeline.CreateKeyFrame();
                }
                else if(handled == "F7")
                {
                    _global.timeline.DiscreaseBlock();
                }
            }
            if(event.shiftKey && handled == "F1")
            {
                _global.timeline.CreateLayer(9);
            }
            else if(event.shiftKey && handled == "F2")
            {
                _global.timeline.CreateLayer(5);
            }
            else if(event.shiftKey && handled == "F3")
            {
                _global.timeline.CreateLayer(6);
            }
            else if(event.shiftKey && handled == "F4")
            {
                _global.timeline.CreateLayer(0);
            }
            else if(handled == "1")
            {
                _global.timeline.CreateLayer(7);
            }
            else if(handled == "2")
            {
                _global.timeline.CreateLayer(8);
            }
            else if(handled == "3")
            {
                _global.timeline.CreateLayer(10);
            }
            else if(handled == "4")
            {
                _global.timeline.CreateLayer(11);
            }
            else if(handled == "5")
            {
                _global.timeline.CreateLayer(12);
            }
            else if(handled == "F1")
            {
                _global.timeline.CreateLayer(1);
            }
            else if(handled == "F2")
            {
                _global.timeline.CreateLayer(2);
            }
            else if(handled == "F3")
            {
                _global.timeline.CreateLayer(3);
            }
            else if(handled == "F4")
            {
                _global.timeline.CreateLayer(4);
            }
        }
        //Entity区也可使用
        if (_global.timeline.assetId.indexOf("App/Entity/") != -1 && _global.timeline.uiFrameFocused)
        {
            if(handled == "3")
            {
                var MaxFrame = _global.timeline.currentState.length - 1;
                _global.timeline.CreateLayer(10);
                _global.timeline.currentFrame = MaxFrame;
                _global.timeline.IncreaseBlock();
            }
            else if(handled == "4")
            {
                var MaxFrame = _global.timeline.currentState.length - 1;
                _global.timeline.CreateLayer(11);
                _global.timeline.currentFrame = MaxFrame;
                _global.timeline.IncreaseBlock();
            }
            else if(handled == "5")
            {
                var MaxFrame = _global.timeline.currentState.length - 1;
                _global.timeline.CreateLayer(12);
                _global.timeline.currentFrame = MaxFrame;
                _global.timeline.IncreaseBlock();
            }
            if (_global.timeline.currentFrame >= 0)//有选中帧
            {
                if(handled == "F5")
                {
                    _global.timeline.IncreaseBlock();
                }
                else if(handled == "F6")
                {
                    _global.timeline.CreateKeyFrame();
                }
                else if(handled == "F7")
                {
                    _global.timeline.DiscreaseBlock();
                }
                else if(event.ctrlKey && handled == "c")
                {
                    _global.timeline.CopyFrame();
                }
                else if(event.ctrlKey && handled == "v")
                {
                    _global.timeline.PasteFrame();
                }
                else if(event.ctrlKey && handled == "x")
                {
                    _global.timeline.CutFrame();
                }
                else if(event.ctrlKey && handled == "z")
                {
                    _global.editor.edaction.UndoAction();
                }
                else if(event.ctrlKey && handled == "y")
                {
                    _global.editor.edaction.RedoAction();
                }
            }
        }
    };

    window.addEventListener("keydown", doKeyDown);
}