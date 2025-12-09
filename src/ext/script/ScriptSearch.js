define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ScriptSearch = /** @class */ (function () {
        function ScriptSearch() {
            this.EmbededScripts = {"TSSearchTargetScriptData" : ["SuccessExecutes", "FailureExecutes"],
                "GSSwitchBranchScriptData" : ["CaseExecutes", "CaseExecutes.SuccessExecutes"],
            "GSBranchScriptData" : ["SuccessExecute", "FailureExecute"],
            "TSCollisionTestScriptData" : ["SuccessExecutes", "attrExecutes.executes"]};
        }
        ScriptSearch.Test = function () {
            return 3;
        };

        ScriptSearch.prototype.SearchGraphScript = function (blkdata, scriptName, includEmbed, cb) {
            if (!blkdata || !blkdata.graph) return;
            let data = blkdata.graph.data;
            if (!data || !data.blocks) return;
        
            for (let block of data.blocks) {
                if (block.frame && block.frame.scripts) {
                    for (let i in block.frame.scripts) {
                        let script = block.frame.scripts[i];
                        if (script && script.__cls__ == scriptName)
                        {
                            if(cb) cb(script);
                        }
                        else
                        {
                            if(includEmbed) this.ScriptSearchProc(script, scriptName, cb);
                        }
                    }
                }
            }
        };
        
        ScriptSearch.prototype.SearchTimelineScript = function (blkdata, scriptName, includEmbed, cb) {
            if (!blkdata || !blkdata.timeline) return;
            let states = blkdata.timeline.states;
            for (let state of states) {
                if (!state.layers) continue;
                for (let layerId in state.layers) {
                    let layer = state.layers[layerId];
                    if (!layer.blocks) continue;
                    for (let block of layer.blocks) {
                        if (!block.keyframes) continue;
                        for (let frame of block.keyframes) {
                            if (!frame.data || !frame.data.scripts) continue;
                            for (let i in frame.data.scripts) {
                                let script = frame.data.scripts[i];
                                if (script && script.__cls__ == scriptName) 
                                {
                                    if(cb) cb(script);
                                }
                                else
                                {
                                    if(includEmbed) this.ScriptSearchProc(script, scriptName, cb);
                                }
                            }
                        }
                    }
                }
            }
        };
        
        ScriptSearch.prototype.ScriptSearchProc = function (scriptData, scriptName, cb) {
        
            for (let key in this.EmbededScripts) {
                if(scriptData.__cls__ == key)
                {
                    for(let emScriptAttr of this.EmbededScripts[key])
                    {
                        var emSubScriptAttrs = emScriptAttr.split(".");
                        if(emSubScriptAttrs.length == 1)
                        {
                            this.ScriptSearchSubProc(scriptData[emSubScriptAttrs[0]], scriptName, cb);
                        }
                        else if(emSubScriptAttrs.length == 2)
                        {
                            let finalAttr = scriptData[emSubScriptAttrs[0]];
                            if(finalAttr != null)
                            {
                                if(finalAttr.hasOwnProperty("length"))
                                {
                                    for(let subfinalAttr of finalAttr)
                                    {
                                        this.ScriptSearchSubProc(subfinalAttr[emSubScriptAttrs[1]], scriptName, cb);
                                    }
                                }
                                else
                                {
                                    this.ScriptSearchSubProc(finalAttr[emSubScriptAttrs[1]], scriptName, cb);
                                }
                            }
                        }
                        else
                        {
                            //不支持两层以上嵌套属性，这种结构的脚本有问题，需要考虑重构
                        }
                    }
                }
            }
        
        };
        
        ScriptSearch.prototype.ScriptSearchSubProc = function (finalAttr, scriptName, cb){
            if(finalAttr != null)
            {
                if(finalAttr.hasOwnProperty("length"))
                {
                    for(let embededScript of finalAttr)
                    {
                        if(embededScript.__cls__ == scriptName)
                        {
                            if(cb) cb(embededScript);
                        }
                        else
                        {
                            this.ScriptSearchProc(embededScript, scriptName, cb);
                        }
                    }
                }
                else
                {
                    if(finalAttr.__cls__ == scriptName)
                    {
                        if(cb) cb(finalAttr);
                    }
                    else
                    {
                        this.ScriptSearchProc(finalAttr, scriptName, cb);
                    }
                }
            }
        };

        return ScriptSearch;
    }());
    exports.ScriptSearch = ScriptSearch;
});