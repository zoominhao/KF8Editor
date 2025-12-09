class WebExcelDescription{}

WebExcelDescription.ReloadExcelLabelCell = function (row, column, celldata, index = 0)
{
    if(parent._global.editor.blkdata.exceldesc)
    {
        if(parent._global.editor.blkdata.exceldesc.states)
        {
            if(parent._global.editor.blkdata.exceldesc.states[index])
            {
                if(parent._global.editor.blkdata.exceldesc.states[index].colorTable)
                {
                    if(parent._global.editor.blkdata.exceldesc.states[index].colorTable[1000 * row + column])
                    {
                        celldata["v"]["fc"] = parent._global.editor.blkdata.exceldesc.states[index].colorTable[1000 * row + column];
                    }
                }
                if(parent._global.editor.blkdata.exceldesc.states[index].backgroundTable)
                {
                    if(parent._global.editor.blkdata.exceldesc.states[index].backgroundTable[1000 * row + column])
                    {
                        celldata["v"]["bg"] = parent._global.editor.blkdata.exceldesc.states[index].backgroundTable[1000 * row + column];
                    }
                }
            }
        }
    }
    return celldata;
}

WebExcelDescription.SaveExcelLabel = function (currentsheets, index)
{
    let Ischanged = false;

    this.colorTable = {};
    for(let i = 0;i < currentsheets[index].celldata.length; i++)
    {
        if(currentsheets[index].celldata[i].v.fc != "#000000")
        {
            let row = currentsheets[index].celldata[i]["r"];
            let column = currentsheets[index].celldata[i]["c"];
            this.colorTable[1000 * row + column] = currentsheets[index].celldata[i].v.fc;
            Ischanged = true;
        }
    }

    this.backgroundTable = {};
    for(let i = 0;i < currentsheets[index].celldata.length; i++)
    {
        if(currentsheets[index].celldata[i]["r"] != 0 && currentsheets[index].celldata[i].v.bg != "#ffffff")
        {
            let row = currentsheets[index].celldata[i]["r"];
            let column = currentsheets[index].celldata[i]["c"];
            this.backgroundTable[1000 * row + column] = currentsheets[index].celldata[i].v.bg;
            Ischanged = true;
        }
    }
    if(!Ischanged)
        return;

    //let P = parent._global.editor.blkdata;
    // let Q;

    if(!parent._global.editor.blkdata.exceldesc && (this.backgroundTable || this.colorTable))
    {
        parent._global.editor.blkdata.exceldescpath = parent._global.editor.blkdata.path.replace(".blk", "/excel.json").replace("App/Data/App", "EditorOnly/DataDesc");
        parent._global.editor.blkdata.exceldesc = {"__cls__":"KFExcelDescInfo"};
        parent._global.editor.blkdata.exceldesc.states = [];
        let Cur = {"__cls__":"KFExcelStateInfo"};
        Cur.colorTable = this.colorTable;
        Cur.backgroundTable = this.backgroundTable;
        parent._global.editor.blkdata.exceldesc.states.push(Cur);

    }
    else
    {
        if(parent._global.editor.blkdata.exceldesc.states[index])
        {
            parent._global.editor.blkdata.exceldesc.states[index].colorTable = this.colorTable;
            parent._global.editor.blkdata.exceldesc.states[index].backgroundTable = this.backgroundTable;
        }
        else
        {
            let Cur = {"__cls__":"KFExcelStateInfo"};
            Cur.colorTable = this.colorTable;
            Cur.backgroundTable = this.backgroundTable;
            parent._global.editor.blkdata.exceldesc.states.push(Cur);
        }
    }
}