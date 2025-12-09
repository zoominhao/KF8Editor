///定义
function WebExcel(divid)
{
    this.init(divid);
}
WebExcel.prototype.init = function(divid)
{
    if (divid!=null)this.divid = divid;
    //Configuration item
    this.options = {
        container: this.divid, //WebExcelArea is the container id
        title: 'Excel', // 设定表格名称
        lang: 'zh',
        showinfobar: false,
        sheetFormulaBar: false,
        data:[],
        hook:{
            /*
            columnTitleCellRenderAfter:WebExcel.prototype.OnColumnTitleUpdated.bind(this),
            cellUpdated:function(r,c,oldValue, newValue, isRefresh){
                //console.info('cellUpdated',r,c,oldValue, newValue, isRefresh)
            },*/
            cellMousedownBefore:function(cell,postion,sheetFile,ctx){
                if (cell==null || cell.ff==null || cell.ff!=4)
                {
                    //console.log(cell,postion);
                    luckysheet.setCellFormat(postion.r, postion.c, "ff", 4);
                }
            },
            sheetMousemove:function(cell,postion,sheetFile,moveState,ctx){
                // console.log(cell,postion,sheetFile,moveState,ctx);
                this.optionSheets = luckysheet.getAllSheets();
                if (this.status==1 && this.sheets.length > this.optionSheets.length)
                {
                    for (let i=0; this.sheets.length; i++)
                    {
                        if (!this.hasOwnSheetOnExcel(this.sheets[i]))
                        {
                            this.sheets.splice(i, 1);
                            for (let j=0; j<this.sheets.length; j++)
                            {
                                let sheetLink = this.getSheetLink(this.sheets[j]);
                                let arr = sheetLink.split("|");
                                if (j != parseInt(arr[1]))
                                {
                                    this.replaceSheetLink(this.sheets[j], sheetLink, arr[0]+"|"+i);
                                }
                            }
                            return ;
                        }
                    }
                }
            }.bind(this),
            sheetActivate:function(index, isPivotInitial, isNewSheet){
                // console.info(index, isPivotInitial, isNewSheet)
                this.updateState(index);
                if (this.status==1 && this.sheets.length < this.optionSheets.length && this.sheetArrayTable!=null)
                {
                    this.status = 0;
                    this.addSonSheetData();
                    let config = this.createOptionSheetConfig(this.sheets[this.sheets.length-1], this.sheets.length-1);
                    luckysheet.setSheetAdd({sheetObject:config, order:this.sheets.length-1});
                    setTimeout(function (){
                        let osheets = luckysheet.getAllSheets();
                        luckysheet.setSheetDelete({order:osheets.length-1});
                        this.status = 1;
                    }.bind(this), 10);
                }
                /*else if (this.status==1 && this.sheets.length > this.optionSheets.length)
                {
                    for (let i=0; this.sheets.length; i++)
                    {
                        if (!this.hasOwnSheetOnExcel(this.sheets[i]))
                        {
                            this.sheets.splice(i, 1);
                            for (let j=0; j<this.sheets.length; j++)
                            {
                                let sheetLink = this.getSheetLink(this.sheets[j]);
                                let arr = sheetLink.split("|");
                                if (j != parseInt(arr[1]))
                                {
                                    this.replaceSheetLink(this.sheets[j], sheetLink, arr[0]+"|"+i);
                                }
                            }
                            return ;
                        }
                    }
                }*/
            }.bind(this)
        }
         };
    this.sheets = [];
    this.curOrder = 0;
    this.status = 0; ///0:ready 1:started
}
WebExcel.prototype.replaceSheetLink = function (sheet, oldLink, newLink)
{
    sheet.link = sheet.link.replace(oldLink, newLink);
    for (let i=0; i<sheet.gridList.length; i++)
    {
        sheet.gridList[i].link = sheet.gridList[i].link.replace(oldLink, newLink);
        for (let j=0; j<sheet.gridList[i].relation.length; j++)
        {
            sheet.gridList[i].relation[j].link = sheet.gridList[i].relation[j].link.replace(oldLink, newLink);
        }
    }
    this.status = 0;
    this.options.data = [];
    this.initOptionsSheet();
    luckysheet.destroy();
    luckysheet.create(this.options);
    this.status = 1;
}
WebExcel.prototype.hasOwnSheetOnExcel = function (sheet)
{
    for (let i=0; i<this.optionSheets.length; i++)
    {
        let sheetLink = sheet.link;
        if (sheet.gridList.length > 2) sheetLink=sheet.gridList[1].link;
        if (this.optionSheets[i].name == sheetLink)
            return true;
    }
    return false;
}
WebExcel.prototype.getSheetLink = function (sheet)
{
    let sheetLink = sheet.link;
    if (sheet.gridList.length > 2) sheetLink=sheet.gridList[1].link;
    return sheetLink;
}
WebExcel.prototype.openWebExcel = function(options)
{
    luckysheet.create(options);
    this.status = 1;
}
WebExcel.prototype.createOptionSheetConfig = function (sheetData, order)
{
    let sheetName = this.getSheetLink(sheetData);
    let config =  {
        "name": sheetName, //工作表名称
        "color": "", //工作表颜色
        "index": order, //工作表索引
        "status": order==0?1:0, //激活状态
        "order": order, //工作表的下标
        "hide": 0,//是否隐藏
        "row": 500, //行数
        "column": 18, //列数
        "defaultRowHeight": 19, //自定义行高
        "defaultColWidth": 73, //自定义列宽
        "celldata": [], //初始化使用的单元格数据
        "config": {
            "merge":{}, //合并单元格
            "rowlen":{"0":30}, //表格行高
            "columnlen":{}, //表格列宽
            //"rowhidden":{}, //隐藏行
            //"colhidden":{}, //隐藏列
            "borderInfo": [{
                    "rangeType": "range",
                    "borderType": "border-all",
                    "style": "1",
                    "color": "#eeeeee",
                    "range": [{
                        "row": [0, 300],
                        "column": [0, 80]
                    }]
                }], //边框
            //"authority":{}, //工作表保护

        },
        "scrollLeft": 0, //左右滚动条位置
        "scrollTop": 0, //上下滚动条位置
        "luckysheet_select_save": [], //选中的区域
        "calcChain": [],//公式链
        "isPivotTable":false,//是否数据透视表
        "pivotTable":{},//数据透视表设置
        "filter_select": {},//筛选范围
        "filter": null,//筛选配置
        "luckysheet_alternateformat_save": [], //交替颜色
        "luckysheet_alternateformat_save_modelCustom": [], //自定义交替颜色
        "luckysheet_conditionformat_save": {},//条件格式
        /* 冻结 s*
                                      // 1、冻结首行
            "frozen":{'type':'row'},
            // 2、冻结行
            frozen:{
                range: {row_focus: 2, column_focus: 1},
                type: "rangeRow"
            },
            // 3、冻结列
            frozen:{
                range: {row_focus: 2, column_focus: 1},
                type: "rangeColumn"
            },
            // 4、冻结行列
            frozen:{
                    range: {row_focus: 7, column_focus: 1},
                    type: "rangeBoth"
                }*/
        "frozen": {type: 'rangeRow',
            range: {row_focus: 0, column_focus: 0}}, //冻结行列配置
        "chart": [], //图表配置
        "zoomRatio":1, // 缩放比例
        "image":[], //图片
        "showGridLines": 1, //是否显示网格线
        "dataVerification":{} //数据验证配置
    };
    let rowCount = 0;
    for (let j=0; j<sheetData.gridList.length; j++)
    {
        if (sheetData.gridList[j].relation.length > 0)
        {
            if (j == sheetData.gridList.length-1)
                config.frozen.range.row_focus = rowCount;
            sheetData.gridList[j].row = rowCount;
            this.createExcelLabel(sheetData.gridList[j].relation, sheetData.gridList[j].row, sheetData.gridList[j].rowLen, sheetData.gridList[j].arrDeep, config, j);
            this.writeDataToExcel(sheetData.gridList[j].data, sheetData.gridList[j].row+1, sheetData.gridList[j].table, sheetData.gridList[j].link, config, sheetData.gridList[j].relation, j);
            rowCount += sheetData.gridList[j].rowLen+1;
        }
    }
    return config;
}
WebExcel.prototype.updateState = function (index)
{
    this.optionSheets = luckysheet.getAllSheets();
    for (let i=0; i<this.optionSheets.length; i++)
    {
        if (this.optionSheets[i].index == index)
        {
            this.curOrder = i;
            if (this.curOrder < this.sheets.length)
            {
                let gridList = this.sheets[this.curOrder].gridList;
                this.relation = gridList[gridList.length-1].relation;
            }
            return;
        }
    }

}
WebExcel.prototype.createGridData = function (table, link, data, index)
{
    let temp = {}
    temp.table = table;
    temp.link = link;
    temp.data = data;
    temp.arrDeep = this.getArrDeepOfLink(link);
    temp.index = index;
    temp.row = 0;//初始化配置表时计算
    temp.rowLen = 1;
    temp.isArr = false;
    if (temp.data.push)
    {
        temp.rowLen = 500;
        temp.isArr = true;
    }
    temp.relation = this.buildRelationFromGrid(temp);
    return temp;
}
WebExcel.prototype.createSheetData = function (order, link, data)
{
    let temp = {}
    temp.order = order;
    temp.link = link;
    temp.data = data;
    temp.table = WebExcelDataTool.GetTable(WebExcelDataTool.GetTableNameFromShellData(data));
    temp.gridList = [];
    return temp;
}
//=========================API============================================
WebExcel.prototype.resetAndWriteData = function (data)
{
    if (data==null)return;
    if (data.frozen)
        this.frozen = data.frozen;
    if (data.exData)
        this.data = data.exData;
    else
        this.data = data;
    this.firstTable = WebExcelDataTool.GetTable(WebExcelDataTool.GetTableNameFromShellData(this.data));
    this.addSheetData(this.data, "data");
    this.initOptionsSheet();

    this.ModifyColumn();

    this.openWebExcel(this.options);
    this.updateState(0);
}
WebExcel.prototype.initOptionsSheet = function ()
{
    for (let i=0; i<this.sheets.length; i++)
    {
        let config = this.createOptionSheetConfig(this.sheets[i], i);
        if (this.frozen)
            config.frozen = this.frozen;
        this.options.data.push(config);
    }
}
WebExcel.prototype.addSonSheetData = function ()
{
    let sheetData = this.sheets[this.sheets.length-1];
    let data = WebExcelDataTool.InstanceDataObject(this.sheetArrayTable, false);
    let link = this.getSheetLink(sheetData);
    this.addSheetData(data, link.replace("|"+(this.sheets.length-1), "|"+this.sheets.length));
}
WebExcel.prototype.addSheetData = function (data, link)
{
    if (data==null) return ;
    let tableName = WebExcelDataTool.GetTableNameFromShellData(data);
    if (tableName==null) return ;
    let firstTable = WebExcelDataTool.GetTable(tableName);
    if (firstTable==null) return ;
    let temp = this.createSheetData(this.sheets.length,link, data);
    this.sheets.push(temp);

    temp.gridList.push(this.createGridData(firstTable, temp.link, temp.data, 0));
    for (let i=0; i<firstTable.propertys.length; i++)
    {
        let prop = firstTable.propertys[i];
        if (WebExcelDataTool.IsExattribProperty(prop))
        {
            let nTable = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(prop));
            let list = temp.data[prop.name];
            if (list==null)list=[];
            if (this.isRowArrayProperty(prop))
            {
                temp.arr = list;
                temp.gridList.push(this.createGridData(nTable, temp.link+"."+prop.name, list, 1));
            }
            else if (this.isSheetArrayProperty(prop))
            {
                this.sheetArrayTable = nTable;
                for (let j=0; j<list.length; j++)
                {
                    if (j==0 && temp.link.indexOf(".")<0)
                    {
                        temp.gridList.push(this.createGridData(nTable, temp.link+"."+prop.name+"|"+j, list[j], 1));
                        let fin = this.findRowArray(list[j], nTable,temp.link+"."+prop.name+"|"+j);
                        if (fin != null)
                            temp.gridList.push(this.createGridData(fin.table, fin.link, fin.data, 2));
                    }
                    else
                    {
                        this.addSheetData(list[j], temp.link+"."+prop.name+"|"+j);
                        //let ns = this.createSheetData(this.sheets.length, temp.link+"."+prop.name+"|"+j, list[j]);
                        //this.sheets.push(ns);
                        //ns.gridList.push(this.createGridData(nTable, ns.link, list[j], 0));
                    }
                }
            }
            break;
        }
    }
}
WebExcel.prototype.findRowArray = function (data, table, link)
{
    if (data==null) data={};
    for (let i=0; i<table.propertys.length; i++) {
        let prop = table.propertys[i];
        if (this.isRowArrayProperty(prop)) {
            let nTable = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(prop));
            return {data:data[prop.name], table:nTable, link:link+"."+prop.name};
        }
    }
    return null;
}

WebExcel.prototype.readDataFromExcel = function ()
{
    this.refreshSheetsFromExcel();
    let data=WebExcelDataTool.InstanceDataObject(this.firstTable, false);
    for (let i=0; i<this.sheets.length; i++)
        data = this.createDataFromSheet(this.sheets[i], data);

    return data;
}
WebExcel.prototype.createDataFromSheet = function (sheet, data)
{
    if (data==null) data=WebExcelDataTool.InstanceDataObject(sheet.table, false);
    for (let i=0; i<sheet.gridList.length; i++)
    {
        let links = sheet.gridList[i].link.split(".");
        let curTable = this.firstTable;
        let curData = data;
        for (let j=1; j<links.length; j++)
        {
            let link = links[j];
            if (link.indexOf("|") >= 0)
            {
                let arr = link.split("|");
                let index = arr[1];
                link = arr[0];
                if (curData[link] == null) curData[link] = [];
                if (j == links.length-1)
                    curData[link][index] = sheet.gridList[i].data;
                else
                {
                    let prop = this.getPropertyFromTableByName(curTable, link);
                    curTable = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(prop));
                    if (curData[link][index] == null)
                        curData[link][index] = WebExcelDataTool.InstanceDataObject(curTable, false);
                    curData = curData[link][index];
                }
            }
            else
            {
                if (j == links.length-1)
                    curData[link] = sheet.gridList[i].data;
                else
                {
                    let prop = this.getPropertyFromTableByName(curTable, link);
                    curTable = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(prop));
                    if (curData[link] == null)
                        curData[link] = WebExcelDataTool.InstanceDataObject(curTable, false);
                    curData = curData[link];
                }
            }
        }
    }
    return data;
}


//=========================导入数据前创建表头=================================================
WebExcel.prototype.buildRelationFromGrid = function (grid)
{
    if (grid.data.push)
    {
        return this.buildRelationFromArr(grid.data, grid.table, grid.link);
    }
    else
    {   //Object类型处理
        let excelTable = {};
        excelTable = this.extendExcelTableFromData(excelTable, grid.data, grid.table, grid.table.class, false);
        let relation = [];
        this.extendRelation(grid.link, excelTable, relation);
        if (relation.length==0) return [];
        ///排序
        let rs = [];
        rs.push(relation[0]);
        for (let i=1; i<relation.length; i++)
        {
            for (let j=0; j<rs.length; j++)
            {
                let l0 = this.getLengthOfLink(relation[i].link);
                if (relation[i].tableLink.indexOf(".FVector")>=0)
                    l0--;
                let l1 = this.getLengthOfLink(relation[j].link);
                if (relation[j].tableLink.indexOf(".FVector")>=0)
                    l1--;

                if (l0 < l1)
                {
                    rs.splice(j, 0, relation[i]);
                    break;
                }
                else if (j == rs.length-1)
                {
                    rs.push(relation[i]);
                    break;
                }
            }
        }
        return rs;
    }
}
WebExcel.prototype.buildRelationFromArr = function (data, table, link)
{
    let excelTable = {};
    if (data==null || data.length==0)
        excelTable = this.extendExcelTableFromData(excelTable, data, table, table.class);
    else
    {
        for (let i=0; i<data.length; i++)
            excelTable = this.extendExcelTableFromData(excelTable, data[i], table, table.class);
    }

    let relation = [];
    this.extendRelation(link, excelTable, relation);
    if (relation.length==0) return [];
    ///排序
    let rs = [];
    rs.push(relation[0]);
    for (let i=1; i<relation.length; i++)
    {
        for (let j=0; j<rs.length; j++)
        {
            let l0 = this.getLengthOfLink(relation[i].link);
            if (relation[i].tableLink.indexOf(".FVector")>=0)
                l0--;
            let l1 = this.getLengthOfLink(relation[j].link);
            if (relation[j].tableLink.indexOf(".FVector")>=0)
                l1--;
            if (l0 < l1)
            {
                rs.splice(j, 0, relation[i]);
                break;
            }
            else if (j == rs.length-1)
            {
                rs.push(relation[i]);
                break;
            }
        }
    }
    return rs;
}
WebExcel.prototype.extendExcelTableFromData = function (excelTable, val, table, tableLink, canExtendArr=true)
{
    if (excelTable==null) excelTable= {};
    if (val==null) val= {};
    for (let i=0; i<table.propertys.length; i++)
    {
        let prop = table.propertys[i];
        excelTable = this.extendExcelTablePropFromData(excelTable, val, prop, tableLink, canExtendArr);
    }
    return excelTable;
}
WebExcel.prototype.extendExcelTablePropFromData = function (excelTable, val, tableProp, tableLink, canExtendArr=true)
{
    //if (val[tableProp.name]!=null)
    //{
        if (canExtendArr && WebExcelDataTool.IsArrayProperty(tableProp))
        {
            if (excelTable[tableProp.name]==null) excelTable[tableProp.name] = [];
            let len = WebExcelDataTool.GetArrLenOfProperty(tableProp);
            if (val[tableProp.name] != null)
                len = len > val[tableProp.name].length ? len : val[tableProp.name].length;
            for (let i=0; i<len; i++)
            {
                if (WebExcelDataTool.IsOtypeProperty(tableProp))
                {
                    let table = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(tableProp));
                    if (val[tableProp.name]==null) val[tableProp.name]=[];
                    excelTable[tableProp.name][i] = this.extendExcelTableFromData(excelTable[tableProp.name][i], val[tableProp.name][i], table,tableLink+"."+table.class, canExtendArr);
                }
                else
                    excelTable[tableProp.name][i] = tableLink;
            }
        }
        else if (!WebExcelDataTool.IsArrayProperty(tableProp) && WebExcelDataTool.IsOtypeProperty(tableProp))
        {
            let table = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(tableProp));
            excelTable[tableProp.name] = this.extendExcelTableFromData(excelTable[tableProp.name], val[tableProp.name], table, tableLink+"."+table.class, canExtendArr);
        }
        else if (!WebExcelDataTool.IsArrayProperty(tableProp) && !WebExcelDataTool.IsOtypeProperty(tableProp))
        {
            if (!WebExcelDataTool.IsEditProperty(tableProp) || !WebExcelDataTool.GetEditOfProperty(tableProp)=="NO")
                excelTable[tableProp.name] = tableLink;
        }
    /*}
    else
    {
        if (!this.isArrayProperty(tableProp) && !WebExcelDataTool.IsOtypeProperty(tableProp))
            excelTable[tableProp.name] = tableLink;
    }*/
    return excelTable;
}
WebExcel.prototype.extendRelation = function (link, val, relation)
{
    let nextlink;
    if (val instanceof Array)
    {
        for (let i=0; i<val.length; i++)
        {
            nextlink = link+"|"+i;
            this.extendRelation(nextlink, val[i], relation);
        }
    }
    else if (val instanceof Object)
    {
        for (let key in val)
        {
            nextlink = link+"."+key;
            this.extendRelation(nextlink, val[key], relation);
        }
    }
    else
    {
        relation.push({link:link, tableLink:val});
    }
}
WebExcel.prototype.createExcelLabel = function (relation, rowIndex, rowLength, arrDeep, dataConfig, gridlistindex = 0)
{
    let curInd = "";
    let curLen = 0;
    let count = 0;
    for (let i=0; i<relation.length; i++)
    {
        let l = this.getLengthOfLink(relation[i].link);
        let index = this.getArrIndexOfLink(relation[i].link);
        if (curLen!=l || curInd!=index)
        {
            this.setExcelPartingLine(i, rowIndex, rowLength, dataConfig);
            count++;
        }
        curInd = index;
        curLen = l;

        let table = WebExcelDataTool.GetTable(this.getLastNameOfLink(relation[i].tableLink));
        let prop = this.getPropertyFromTableByName(table, this.getLastNameOfLink(relation[i].link));
        let lable = this.getPropertyLable(prop);
        //当属性是FVector时,合并lable名称
        let subLable = "";
        let tableLinkArr = relation[i].tableLink.split(".");
        if (tableLinkArr.length>0 && tableLinkArr[tableLinkArr.length-1]=="FVector")
        {
            let linkArr = relation[i].link.split(".");
            if (linkArr.length>=2)
            {
                lable = linkArr[linkArr.length-2];
                subLable = "."+linkArr[linkArr.length-1];
            }
        }

        if (this.getArrDeepOfLink(relation[i].link) > arrDeep)
            this.setExcelLabelCell(relation, dataConfig, rowIndex, i, lable+this.getArrLastIndexOfLink(relation[i].link)+subLable, relation[i].link, count, gridlistindex);
        else
            this.setExcelLabelCell(relation, dataConfig, rowIndex, i, lable+subLable, relation[i].link, count, gridlistindex);
        if (this.isEnumTypeProperty(prop))
        {
            let enumTable = WebExcelDataTool.GetTable(this.getEnumTypeOfProperty(prop));
            let listStr = this.getEnumNameListStr(enumTable);
            this.setExcelDropDownList(i, listStr, rowIndex+1, rowLength, dataConfig);
        }
        else if (this.isDEnumTypeProperty(prop))
        {
            let denumfile = this.getDEnumTypeOfProperty(prop);
            let listStr = this.getDEnumNameListStr(denumfile);
            this.setExcelDropDownList(i, listStr, rowIndex+1, rowLength, dataConfig);
        }
    }
}


//=========================导入数据步骤=================================================
WebExcel.prototype.writeDataToExcel = function (data, rowIndex, table, link, dataConfig, relation, gridlistindex = 0)
{
    if (data.push)
    {
        for (let i=0; i<data.length; i++)
            this.extendWriteData(i+rowIndex, link, data[i], table, dataConfig, relation, gridlistindex);
    }
    else
        this.extendWriteData(rowIndex, link, data, table, dataConfig, relation, gridlistindex);
}
WebExcel.prototype.extendWriteData = function (index, link, val, table, dataConfig, relation, gridlistindex = 0)
{
    let nextlink;
    //for (let key in val)
    for (let j=0; j<table.propertys.length; j++)
    {
        let prop = table.propertys[j];
        let key = prop.name;
        //if (this.hasOwnPropertyInTable(key, table))
        //{
            //let prop = this.getPropertyFromTableByName(table, key);
            if (WebExcelDataTool.IsArrayProperty(prop))
            {
                if (val[key]==null) break;
                for (let i=0; i<val[key].length; i++)
                {
                    nextlink = link+"."+key+"|"+i;
                    if (WebExcelDataTool.IsOtypeProperty(prop))
                    {
                        let newTable = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(prop));
                        this.extendWriteData(index, nextlink, val[key][i], newTable, dataConfig, relation, gridlistindex);
                    }
                    else
                        this.setExcelCell(dataConfig, index, this.getRelationIndex(nextlink, relation), val[key][i], prop, gridlistindex);
                }
            }
            else if (WebExcelDataTool.IsOtypeProperty(prop))
            {
                if (val[key]==null) break;
                nextlink = link+"."+key;
                let newTable = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(prop));
                this.extendWriteData(index, nextlink, val[key], newTable, dataConfig, relation);
            }
            else
            {
                nextlink = link+"."+key;
                this.setExcelCell(dataConfig, index, this.getRelationIndex(nextlink, relation), val[key], prop);
            }
        //}
    }
}


//=========================导出数据步骤=====================================================
WebExcel.prototype.refreshSheetsFromExcel = function ()
{
    this.optionSheets = luckysheet.getAllSheets();
    for (let j=0; j<this.optionSheets.length; j++)
    {
        let rowIndex = 0;
        if (this.optionSheets[j].order >= this.sheets.length) continue;
        let sheet = this.sheets[this.optionSheets[j].order];
        for (let k=0; k<sheet.gridList.length; k++)
        {
            let grid = sheet.gridList[k];
            if (grid.relation.length == 0) continue;
            let links = this.getExcelLabelLinks(this.optionSheets[j], rowIndex);
            let excelTable = {};
            for (let i=0; i<links.length; i++)
            {
                let propNames = links[i].split(".");
                excelTable = this.extendExcelTableFromELabel(excelTable, propNames, i);
            }
            let relation = [];
            this.extendRelation("data", excelTable, relation);
            ///排序
            let rs = [];
            for (let i=0; i<relation.length; i++)
            {
                rs[relation[i].tableLink] = {};
                rs[relation[i].tableLink].link = this.replaceLink(relation[i].link, grid.link);
            }
            grid.relation = rs;
            grid.rowLen = this.getExcelRowLength(this.optionSheets[j], rowIndex+1);
            if (grid.isArr)
            {
                grid.data = [];
                for (let i=0; i<grid.rowLen; i++)
                {
                    let values = this.getExcelRowValues(this.optionSheets[j], rowIndex+i+1);
                    if (values.length==0) break;
                    grid.data.push(this.createGridDataFromExcel(values, grid));
                }
            }
            else
                grid.data = this.createGridDataFromExcel(this.getExcelRowValues(this.optionSheets[j], rowIndex+1), grid);
            rowIndex += grid.rowLen+1;

        }

        WebExcelDescription.SaveExcelLabel(this.optionSheets, 0);

    }

}

WebExcel.prototype.replaceLink = function (link, linkHead)
{
    let arr0 = link.split(".");
    let arr1 = linkHead.split(".");
    let str = "";
    for (let i=0; i<arr0.length; i++)
    {
        if (i < arr1.length)
        {
            str += arr1[i]+".";
        }
        else
            str += arr0[i]+".";
    }
    return str.substring(0,str.length-1);
}
WebExcel.prototype.extendExcelTableFromELabel = function (excelTable, propNames, index)
{
    if (excelTable==null) excelTable={};
    let temp = excelTable;
    for (let i=1; i<propNames.length; i++)
    {
        let propName = propNames[i];
        if (propName.indexOf("|") >= 0)
        {
            let pna = propName.split("|")[0];
            let arrIndex = parseInt(propName.split("|")[1]);
            if (i == propNames.length-1)
            {
                if (temp[pna] == null) temp[pna]=[];
                temp[pna].push(index);
                break;
            }
            else
            {
                if (temp[pna] == null) temp[pna] = [];
                if (temp[pna][arrIndex] == null) temp[pna][arrIndex]={};
                temp = temp[pna][arrIndex];
            }
        }
        else
        {
            if (i == propNames.length-1)
            {
                if (temp[propName] == null)
                    temp[propName] = index;
                else
                    excelTable = this.extendExcelTableArrayFromELabel(excelTable, propNames, index);
                break;
            }
            else
            {
                if (temp[propName] == null) temp[propName]={};
                temp = temp[propName];
            }
        }
    }
    return excelTable;
}
WebExcel.prototype.extendExcelTableArrayFromELabel = function (excelTable, propNames, index)
{
    let temp = excelTable;
    for (let i=1; i<propNames.length; i++)
    {
        let propName = propNames[i];
        if (propName.indexOf("|") >= 0)
        {
            let pna = propName.split("|")[0];
            if (temp[pna] == null) temp[pna] = [];
            temp[pna].push({});
            excelTable = this.extendExcelTableFromELabel(excelTable, propNames, index);
            break;
        }
        else
        {
            if (temp[propName] == null) break;
            temp = temp[propName];
        }
    }
    return excelTable;
}
WebExcel.prototype.createGridDataFromExcel = function (values, grid)
{
    let data = WebExcelDataTool.InstanceDataObject(grid.table, false);
    for (let i=0; i<values.length; i++)
    {
        if (values[i] != null)
        {
            let link = grid.relation[i].link.replace(grid.link, "data");
            data = this.fillGridData(data, values[i], link, grid.table);
        }
    }
    return data;
}
WebExcel.prototype.fillGridData = function (data, value, link, firstTable)
{
    let propNamesArray = link.split(".");
    let curData = data;
    let prop;
    let table = firstTable;
    for (let i=1; i<propNamesArray.length; i++)
    {
        let propName = propNamesArray[i];
        if (propName.indexOf("|") >= 0)
        {
            let arr = propName.split("|");
            prop = this.getPropertyFromTableByName(table, arr[0]);
            if (curData[arr[0]] == null) curData[arr[0]] = [];
            if (i == propNamesArray.length-1)
            {
                if (this.isEnumTypeProperty(prop))
                {
                    let enumTable = WebExcelDataTool.GetTable(this.getEnumTypeOfProperty(prop));
                    curData[arr[0]][parseInt(arr[1])] = WebExcelDataTool.MakeDataValue(this.getEnumValueByLabel(enumTable, value), prop);
                }
                else if (this.isDEnumTypeProperty(prop))
                {
                    let denumflie = this.getDEnumTypeOfProperty(prop);
                    curData[arr[0]][parseInt(arr[1])] = WebExcelDataTool.MakeDataValue(this.getDEnumValueByLabel(denumflie, value), {type:"int32"});
                }
                else
                    curData[arr[0]][parseInt(arr[1])] = WebExcelDataTool.MakeDataValue(value, prop);
            }
            else
            {
                table = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(prop));
                if (curData[arr[0]][parseInt(arr[1])] == null)
                    curData[arr[0]][parseInt(arr[1])] = WebExcelDataTool.InstanceDataObject(table, false);
                curData = curData[arr[0]][parseInt(arr[1])];
            }
        }
        else
        {
            prop = this.getPropertyFromTableByName(table, propName);
            if (i == propNamesArray.length-1)
            {
                if (this.isEnumTypeProperty(prop))
                {
                    let enumTable = WebExcelDataTool.GetTable(this.getEnumTypeOfProperty(prop));
                    curData[propName] = WebExcelDataTool.MakeDataValue(this.getEnumValueByLabel(enumTable, value), prop);

                }
                else if (this.isDEnumTypeProperty(prop))
                {
                    let denumflie = this.getDEnumTypeOfProperty(prop);
                    curData[propName] = WebExcelDataTool.MakeDataValue(this.getDEnumValueByLabel(denumflie, value), prop);
                }
                else
                    curData[propName] = WebExcelDataTool.MakeDataValue(value, prop);
            }
            else
            {
                table = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(prop));
                if (curData[propName] == null)
                {
                    curData[propName] = WebExcelDataTool.InstanceDataObject(table, false);
                }
                curData = curData[propName];
            }
        }
    }
    return data;
}

///===========================Excel Utils==========================================
WebExcel.prototype.setExcelCell = function (dataConfig, row, column, value, prop, gridlistindex = 0)
{
    if (column == -1) return ;
    if (value==null || value==undefined)
    {
       if (this.isDefaultProperty(prop))
       {
           value = this.getDefaultProperty(prop);
           if (value.indexOf("::") >= 0)
           {
               let dename = value.split("::")[1];
               let enumTable = WebExcelDataTool.GetTable(this.getEnumTypeOfProperty(prop));
               value = this.getEnumPropByName(enumTable, dename).default;
           }
       }
       else
           return ;
    }

    let lable;
    if (this.isEnumTypeProperty(prop))
    {
        let enumTable = WebExcelDataTool.GetTable(this.getEnumTypeOfProperty(prop));
        let enumProp = this.getEnumPropByDefaultValue(enumTable, value);
        if (enumProp != null)
            lable = this.getPropertyLable(enumProp);
    }
    else if (this.isDEnumTypeProperty(prop))
    {
        let denumflie = this.getDEnumTypeOfProperty(prop);
        let enumProp = this.getDEnumPropByDefaultValue(denumflie, value);
        if (enumProp != null)
            lable = enumProp.desc;
    }
    else
    {
        lable = WebExcelDataTool.ReadDataValue(value, prop);
    }
    if(typeof(lable) == "boolean" || lable == "false" || lable == "true")
    {
        if(lable == "true")
            lable = true;
        else if(lable == "false")
            lable = false;
        this.setExcelCheckBox(column, "TRUE", "FALSE", lable, row, dataConfig);
    }

    if (this.status == 0)
    {
        let celldata = {
            "r": row,
            "c": column,
            "v": {
                "ct": { //单元格值格式
                    "fa": "General",  //格式名称为自动格式
                    "t": "n" //格式类型为数字类型
                },
                "v": lable, //内容的原始值
                "m": lable, //内容的显示值
                "bg": "#ffffff", //背景为
                "ff": 4, // 字体为 "Arial"
                "fc": "#000000", //字体颜色为
                "fs": 10, //字体大小为 9px
                "ht": 0, //水平居中
                "vt": 0, //垂直居中
                "tb": 2, //文本自动换行
            }
        };

        celldata = WebExcelDescription.ReloadExcelLabelCell(row, column, celldata, gridlistindex);
        dataConfig.celldata.push(celldata);
    }
    else
        luckysheet.setCellFormat(row, column, "v", lable);
}


WebExcel.prototype.setExcelLabelCell = function (relation, dataConfig, rowIndex, column, Value, tableName="", bgColorType=0, gridlistindex = 0)
{
    let row = rowIndex;
    bgColorType = bgColorType%2;
    let bgColor = bgColorType==0? "#eeeeee" : "#cfcfcf";
    let cellWidth = Value.length;
    if (cellWidth < 4) cellWidth=4;
    cellWidth *= 15;
    if (this.status == 0)
    {
        let celldata = {
            "r": row,
            "c": column,
            "v": {
                "ct": { //单元格值格式
                    "fa": "General",  //格式名称为自动格式
                    "t": "n" //格式类型为数字类型
                },
                "v": Value, //内容的原始值
                "m": Value, //内容的显示值
                "bg": bgColor, //背景为 "#f6b26b"
                "ff": 4, // 字体为 "Arial"
                "fc": "#000000", //字体颜色为 "#990000"
                "bl": 1, //字体加粗
                "it": 0, //字体斜体
                "fs": 10, //字体大小为 9px
                "cl": 0, //启用删除线
                "ht": 0, //水平居中
                "vt": 0, //垂直居中
                //"tr": 2, //文字旋转 -45°
                "tb": 2, //文本自动换行
                "link": tableName,  //数据关系
                /*"ps": { //批注
                    "left": 0, //批注框左边距
                    "top": -100, //批注框上边距
                    "width": 0, //批注框宽度
                    "height": 0, //批注框高度
                    "value": "", //批准内容
                    "isshow": false     //批注框为显示状态
                },*/
                //"f": "=SUM(233)" //单元格是一个求和公式
            }
        };
       // celldata = WebExcelDescription.ReloadExcelLabelCell(row, column, celldata, gridlistindex);
        dataConfig.celldata.push(celldata);
        /*
        let wid = this.getColumnTitleWidth(relation, column);
        if (wid < cellWidth)
        {
            wid = cellWidth;
            this.setColumnTitleWidth(column, wid);
        }
        dataConfig.config.columnlen[column.toString()] = wid;
        */

        return ;
    }

    /*luckysheet.setCellFormat(row, column, "m", Value);
    //luckysheet.setCellFormat(row, column, "ps", {value:tableName});
    //luckysheet.setCellFormat(row, column, "bd", {borderType: "border-right",style: 1, color: "#0fff00"});
    //luckysheet.setCellFormat(row, column, "bl", 1);
    //luckysheet.setCellFormat(row, column, "bg", bgColor);
    //let dic = {};dic[column] = cellWidth;
    //luckysheet.setColumnWidth(dic);
    this.addExcelCmd("setCellFormat", [row, column, "ps", {value:tableName}], true);
    this.addExcelCmd("setCellFormat", [row, column, "bd", {borderType: "border-right",style: 1, color: "#0fff00"}]);
    this.addExcelCmd("setCellFormat", [row, column, "bl", 1]);
    this.addExcelCmd("setCellFormat", [row, column, "bg", bgColor]);*/
}
WebExcel.prototype.setExcelPartingLine = function (column, rowIndex, rowLength, dataConfig, color="#eeeeee")
{
    if (this.status == 0)
    {
        dataConfig.config.borderInfo.push( {
            "rangeType": "range",
            "borderType": "border-left",
            "style": "13",
            "color": color,
            "range": [{
                "row": [rowIndex, rowLength],
                "column": [column, column]
            }]
        });
        return ;
    }

    /*for (let i=0; i<this.rowMax; i++)
    {
        this.addExcelCmd("setCellFormat", [i, column, "bd", {borderType: "border-left",style: 13, color: color}]);
        //luckysheet.setCellFormat(i, column, "bd", {borderType: "border-left",style: 13, color: color});
    }*/
}
WebExcel.prototype.setExcelDropDownList = function (column, listStr, rowIndex, rowLength, dataConfig)
{
    let dataVerification = {
        "type": "dropdown",
        "type2": null,
        "value1": listStr,
        "value2": "",
        "checked": false,
        "remote": false,
        "prohibitInput": true,
        "hintShow": false,
        "hintText": ""
    };
    if (this.status == 0)
    {
        for (let i=0; i<rowLength; i++)
        {
            let ind = i+rowIndex;
            dataConfig.dataVerification[ind+"_"+column] = dataVerification;
        }
        return;
    }

    //this.addExcelCmd("setDataVerification", [dataVerification, {range:{row:[1, this.rowMax],column:[column, column]}}], true);
}

WebExcel.prototype.setExcelCheckBox = function (column, value1, value2, checked, row, dataConfig)
{
    let dataVerification = {
        "type": "checkbox",
        "type2": null,
        "value1": value1,
        "value2": value2,
        "checked": checked,
        "remote": false,
        "prohibitInput": false,
        "hintShow": false,
        "hintText": ""
    };
    if (this.status == 0)
    {
        dataConfig.dataVerification[row+"_"+column] = dataVerification;
        return;
    }
}
WebExcel.prototype.getExcelLabelLinks = function (optionSheet, row)
{
    let links = [];   let i=0;
    while (1)
    {
        if (optionSheet.data[row][i]!=null && optionSheet.data[row][i].link!=null)
        {
            links.push(optionSheet.data[row][i].link);
            i++;
        }
        else
            break;

    }
    return links;
}
WebExcel.prototype.isExcelEmptyRow = function (optionSheet, rowIndex)
{
    if ((optionSheet.data[rowIndex][0]==null || optionSheet.data[rowIndex][0].v==null)
        && (optionSheet.data[rowIndex][1]==null || optionSheet.data[rowIndex][1].v==null)
        && (optionSheet.data[rowIndex][2]==null || optionSheet.data[rowIndex][2].v==null))
        return true;
    return false;
}
WebExcel.prototype.getExcelRowValues = function (optionSheet, rowIndex)
{
    let labels = [];
    if (optionSheet.data[rowIndex] != null)
    {
        if (this.isExcelEmptyRow(optionSheet, rowIndex)) return labels;
        for (let i=0; i<optionSheet.data[rowIndex].length; i++)
        {
            if (optionSheet.data[rowIndex][i] != null)
                labels.push(optionSheet.data[rowIndex][i].v);
            else
                labels.push(null);
        }
    }
    return labels;
}
WebExcel.prototype.getExcelRowLength = function (optionSheet, rowStartIndex)
{
    let c = 0;
    for (let i = rowStartIndex; i<optionSheet.data.length; i++)
    {
        if (optionSheet.data[i][0]!=null && optionSheet.data[i][0].link!=null)
            return c;
        c++;
    }
    c = 0;
    for (let i = rowStartIndex; i<optionSheet.data.length; i++)
    {
        if (this.isExcelEmptyRow(optionSheet, i))
            return c;
        c++;
    }
    return 0;
}
/*
WebExcel.prototype.OnColumnTitleUpdated = function(rowNum,postion,ctx)
{
    if (this.status == 0) return;
    //console.info('columnTitleCellRenderAfter', rowNum, postion);
    //postion = {c: 17, left: 1168, width: 61, height: 19};
    this.setColumnTitleWidth(this.relation, postion.c, postion.width);
}
 */

///===========================Storage Utils==========================================
/*
WebExcel.prototype.setColumnTitleWidth = function (relation, column, value)
{
    if (column < relation.length)
        this.setConfig("ColumnTitleWidth_"+relation[column].link, value);
}
WebExcel.prototype.getColumnTitleWidth = function (relation, column)
{
    let val = this.getConfig("ColumnTitleWidth_"+relation[column].link);
    if (val==null || val=="NaN")
        return 0;
    else
        return parseInt(val);
}
WebExcel.prototype.setConfig = function (key, value)
{
    if (this.config == null) this.config = {};
    if (this.config[key] == null)
        this.config[key] = this.getConfig(key);

    if (this.config[key] != value)
    {
        this.config[key] = value;
      //  if (typeof(Storage) !== "undefined")
              //  localStorage.setItem("webexcel:"+key,value);
    }

}
WebExcel.prototype.getConfig = function (key)
{
    if (this.config == null) this.config = {};
    if (this.config[key] != null)
        return this.config[key];
  //  if (typeof(Storage) !== "undefined")
     //   this.config[key] = localStorage.getItem("webexcel:"+key);
    return this.config[key];
}
 */
///===========================Table Utils==========================================
WebExcel.prototype.hasOwnPropertyInTable = function (propName, table)
{
    for (let j=0; j<table.propertys.length; j++)
    {
        if (table.propertys[j].name == propName)
            return true;
    }
    return false;
}
WebExcel.prototype.isDefaultProperty = function (property)
{
    if (property.hasOwnProperty("default") && property.default)
        return true;
    else
        return false;
}
WebExcel.prototype.getDefaultProperty = function (property)
{
    if (property.hasOwnProperty("default"))
        return property["default"];
    else
        return "";
}
WebExcel.prototype.isRowArrayProperty = function (property)
{
    let ex = WebExcelDataTool.GetExattribOfProperty(property);
    if (ex && ex==1)
        return true;
    else
        return false;
}
WebExcel.prototype.isSheetArrayProperty = function (property)
{
    let ex = WebExcelDataTool.GetExattribOfProperty(property);
    if (ex && ex==2)
        return true;
    else
        return false;
}


WebExcel.prototype.isDEnumTypeProperty = function (property)
{
    let EnumTableName = WebExcelDataTool.GetTagOfProperty(property, "DENUM");
    if (EnumTableName)
        return true;
    else
        return false;
}
WebExcel.prototype.getDEnumTypeOfProperty = function (property)
{
    let EnumTableName = WebExcelDataTool.GetTagOfProperty(property, "DENUM");
    if (EnumTableName)
        return EnumTableName;
}
WebExcel.prototype.getDEnumNameListStr = function (denumfile)
{
    if (denumfile == null) return null;
    let denumArr = KFDPropTool.GetEnumData(denumfile);
    if(denumArr)
    {
        let str = "";
        for (let i = 0; i < denumArr.length; i++)
        {
            let eump = denumArr[i];
            if (i < denumArr.length-1)
                str += eump.desc+",";
            else
                str += eump.desc;
        }
        return str;
    }
    return null;
}
WebExcel.prototype.getDEnumPropByLabel = function (denumfile, lableName)
{
    if (denumfile == null) return null;
    let denumArr = KFDPropTool.GetEnumData(denumfile);
    if(denumArr)
    {
        for (let i = 0; i < denumArr.length; i++)
        {
            let eump = denumArr[i];
            if (eump.desc == lableName)
                return eump;
        }
    }
    return null;
}
WebExcel.prototype.getDEnumPropByDefaultValue = function (denumfile, value)
{
    if (denumfile == null) return null;
    let denumArr = KFDPropTool.GetEnumData(denumfile);
    if(denumArr)
    {
        for (let i = 0; i < denumArr.length; i++)
        {
            let eump = denumArr[i];
            if (eump.value == value)
                return eump;
        }
    }
    return null;
}
WebExcel.prototype.getDEnumValueByLabel = function (denumfile, lableName)
{
    let prop = this.getDEnumPropByLabel(denumfile, lableName);
    if (prop)
        return prop.value;
    return null;
}



WebExcel.prototype.isEnumTypeProperty = function (property)
{
    if (property.hasOwnProperty("enum"))
        return true;
    else
        return false;
}
WebExcel.prototype.getEnumTypeOfProperty = function (property)
{
    if (property.hasOwnProperty("enum"))
        return property["enum"];
}
WebExcel.prototype.getEnumNameListStr = function (enumTable)
{
    if (enumTable == null) return null;
    let str = "";
    for (let i=0; i<enumTable.propertys.length; i++)
    {
        if (i < enumTable.propertys.length-1)
            str += this.getPropertyLable(enumTable.propertys[i])+",";
        else
            str += this.getPropertyLable(enumTable.propertys[i]);
    }
    return str;
}
WebExcel.prototype.getEnumPropByLabel = function (enumTable, lableName)
{
    if (enumTable == null) return null;
    for (let i=0; i<enumTable.propertys.length; i++)
    {
        if (lableName == this.getPropertyLable(enumTable.propertys[i]))
            return enumTable.propertys[i];
    }
}
WebExcel.prototype.getEnumPropByName = function (enumTable, propName)
{
    if (enumTable == null) return null;
    for (let i=0; i<enumTable.propertys.length; i++)
    {
        if (propName == enumTable.propertys[i].name)
            return enumTable.propertys[i];
    }
}
WebExcel.prototype.getEnumPropByDefaultValue = function (enumTable, defaultValue)
{
    if (enumTable == null) return null;
    for (let i=0; i<enumTable.propertys.length; i++)
    {
        let prop = enumTable.propertys[i];
        if (WebExcelDataTool.ReadDataValue(prop.default, prop) == WebExcelDataTool.ReadDataValue(defaultValue, prop))
            return prop;
    }
    return null;
}
WebExcel.prototype.getEnumValueByLabel = function (enumTable, lableName)
{
    let prop = this.getEnumPropByLabel(enumTable, lableName);
    if (prop)
        return prop.default;
    return null;
}
WebExcel.prototype.getPropertyByOtype = function (table, otype)
{
    let arr = [];
    for (let j=0; j<table.propertys.length; j++)
    {
        let classname = WebExcelDataTool.GetOtypeOfProperty(table.propertys[j]);
        if (classname && otype==classname)
            arr.push(table.propertys[j]);
    }
    return arr;
}
WebExcel.prototype.getPropertyFromTableByName = function (table, propName)
{
    for (let j=0; j<table.propertys.length; j++)
    {
        if (table.propertys[j].name == propName)
            return table.propertys[j];
    }
}
WebExcel.prototype.getPropertyLable = function (prop)
{
    return parent["KFDTable"].getPropertyLable(prop);
}
WebExcel.prototype.hasClassPropertyInData = function (data)
{
    if (data.hasOwnProperty())
        return true;
    return false;
}

///===========================Relation Utils==========================================
WebExcel.prototype.getLastNameOfLink = function (link)
{
    let arr = link.split(".");
    if (arr.length > 0)
    {
        let str = arr[arr.length-1];
        if (str.indexOf("|") < 0)
            return arr[arr.length-1];
        else
        {
            let arr = str.split("|");
            return arr[0];
        }
    }
    else
        return "";
}
WebExcel.prototype.getLengthOfLink = function (link)
{
    let arr = link.split(".");
    let len = arr.length;
    return len;
}
WebExcel.prototype.getArrIndexOfLink = function (link)
{
    let arr = link.split(".");
    let index = [];
    for (let i=arr.length-1; i>=0; i--)
    {
        if (arr[i].indexOf("|") >= 0)
        {
            let inds = arr[i].split("|");
            index.push(inds[1]);
        }
    }
    let str = "";
    for (let i=0; i<index.length; i++)
    {
        str += "|"+index[i];
    }
    return str;
}
WebExcel.prototype.getArrDeepOfLink = function (link)
{
    let arr = link.split("|");
    return arr.length;
}
WebExcel.prototype.getArrLastIndexOfLink = function (link)
{
    let arr = link.split(".");
    let index = [];
    for (let i=arr.length-1; i>=0; i--)
    {
        if (arr[i].indexOf("|") >= 0)
        {
            let inds = arr[i].split("|");
            return inds[1];
        }
    }
    return "";
}
WebExcel.prototype.getRelationIndex = function (link, relation)
{
    for (let i=0; i<relation.length; i++)
    {
        if (link == relation[i].link)
            return i;
    }
    return -1;
}
WebExcel.prototype.getRelationLink = function (index, relation)
{
    if (relation && index>=0 && index<relation.length)
        return relation[index];
    else
        return "";
}

///================================================================
WebExcel.log = function (msg)
{
    let dateobj = new Date;
    let format = " [yyyy/MM/dd hh:mm:ss]";
    var date = {
        "M+": dateobj.getMonth() + 1,
        "d+": dateobj.getDate(),
        "h+": dateobj.getHours(),
        "m+": dateobj.getMinutes(),
        "s+": dateobj.getSeconds(),
        "q+": Math.floor((dateobj.getMonth() + 3) / 3),
        "S+": dateobj.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (dateobj.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1
                ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    console.log(msg + format);
}
WebExcel.prototype.addExcelCmd = function (funcName, args, isPriority=false)
{
    if (this.cmdData==null) this.cmdData = [];
    if (isPriority)
        this.cmdData.unshift({funcName:funcName, args:args});
    else
        this.cmdData.push({funcName:funcName, args:args});
}
WebExcel.runExcelCmd = function ()
{
    if (webExcel.cmdData && webExcel.cmdData.length > 0)
    {
        WebExcel.log(webExcel.cmdData.length);
        let cdata = webExcel.cmdData.shift();
        let args = cdata.args;
        switch (args.length)
        {
            case 1:luckysheet[cdata.funcName](args[0]);break;
            case 2:luckysheet[cdata.funcName](args[0],args[1]);break;
            case 3:luckysheet[cdata.funcName](args[0],args[1],args[2]);break;
            case 4:luckysheet[cdata.funcName](args[0],args[1],args[2],args[3]);break;
            case 5:luckysheet[cdata.funcName](args[0],args[1],args[2],args[3],args[4]);break;
            case 6:luckysheet[cdata.funcName](args[0],args[1],args[2],args[3],args[4],args[5]);break;
            case 7:luckysheet[cdata.funcName](args[0],args[1],args[2],args[3],args[4],args[5],args[6]);break;
            default:luckysheet[cdata.funcName]();break;
        }

        setTimeout(WebExcel.runExcelCmd, 100);
    }
}
///==========================self-adaptive row/column======================================
WebExcel.prototype.ModifyColumn = function ()
{
    if(this.options && this.options.data)
    {
        for(let i = 0;i < this.options.data.length; i++)
        {
            for(let j = 0;j < this.options.data[i].celldata.length; j++)
            {
                let curValue = this.options.data[i].celldata[j]['v']['v'];
                let Rlength, Clength;
                if(typeof(curValue) == "string")
                {
                    curValue = curValue.replace(/[\u0391-\uFFE5]/g,"aa").length;
                    Clength = Math.max(60, curValue * 7 + 6);
                }
                else if(typeof(curValue) == "number")
                {
                    curValue = curValue.toString().length;
                    Clength = Math.max(60, curValue * 7 + 6);
                }
                else
                {
                    Clength = 60;
                }
                if(Clength > 300)
                {
                    Rlength = Math.ceil(Clength / 300) * 20;
                    Clength = 300;
                }
                else
                {
                    Rlength = 20;
                }



                let rowkey = this.options.data[i].celldata[j]['r'];
                if(!this.options.data[i].config.rowlen[rowkey])
                {
                    this.options.data[i].config.rowlen[rowkey] = Rlength;
                }
                else if(this.options.data[i].config.rowlen[rowkey] < Rlength)
                {
                    this.options.data[i].config.rowlen[rowkey] = Rlength;
                }

                let columnkey = this.options.data[i].celldata[j]['c'];
                if(!this.options.data[i].config.columnlen[columnkey])
                {
                    this.options.data[i].config.columnlen[columnkey] = Clength;
                }
                else if(this.options.data[i].config.columnlen[columnkey] < Clength)
                {
                    this.options.data[i].config.columnlen[columnkey] = Clength;
                }
            }
        }
    }
}