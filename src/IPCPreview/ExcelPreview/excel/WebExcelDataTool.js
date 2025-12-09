/** Webdata数据转化工具
*
 *  */

class WebExcelDataTool{}

WebExcelDataTool.kfdtable = {};
WebExcelDataTool.ExcelTableLibs = {};

WebExcelDataTool.KFDataToExcelData = function (kfData)
{
    switch (WebExcelDataTool.GetTableNameFromShellData(kfData))
    {
        case "KF8StaticSkillGroupSheet":
        case "HDStaticSkillGroupSheet":
            return WebExcelDataTool.KF8StaticSkillGroupSheetToWebExcelData(kfData);
        default:
            return WebExcelDataTool.CheckKFDataTableProp(kfData);
    }
}
//kf数据中过滤出需要表格显示的属性
WebExcelDataTool.CheckKFDataTableProp = function (kfData)
{
    let firstTableName = WebExcelDataTool.GetTableNameFromShellData(kfData);
    let firstTable = WebExcelDataTool.GetTable(firstTableName);
    if (firstTable && firstTable.unknowtags && firstTable.unknowtags.length>0)
    {
        for (let i=0; i<firstTable.unknowtags.length; i++)
        {
            if (firstTable.unknowtags[i].tag == "TABLEPROP")
            {
                let tablePropName = firstTable.unknowtags[i].val;
                for (let i=0; i<firstTable.propertys.length; i++)
                {
                    if (firstTable.propertys[i].name == tablePropName)
                    {
                        let eSheetTable = WebExcelDataTool.CreateTableObject(WebExcelDataTool.AddExcelTableNameFlag(firstTableName));
                        eSheetTable.propertys.push(firstTable.propertys[i]);
                        //create data
                        let exData = WebExcelDataTool.InstanceDataObject(eSheetTable, false);
                        exData[tablePropName] = kfData[tablePropName];
                        this.cachekfData = kfData;
                        this.cacheTablePropName = tablePropName;
                        return exData;
                    }
                }
                break;
            }
        }
    }
    this.cachekfData = null;
    return kfData;
}

WebExcelDataTool.ExcelDataToKFData = function (excelData)
{
    switch (WebExcelDataTool.GetTableNameFromShellData(excelData))
    {
        case "Excel_KF8StaticSkillGroupSheet":
        case "Excel_HDStaticSkillGroupSheet":
            return WebExcelDataTool.WebExcelDataToKF8StaticSkillGroupSheet(excelData);
        default:
            if (this.cachekfData)
            {
                this.cachekfData[this.cacheTablePropName] = excelData[this.cacheTablePropName];
                return this.cachekfData;
            }
            return excelData;
    }
}

WebExcelDataTool.KF8StaticSkillGroupSheetToWebExcelData = function (kfData)
{
    let sheetTableName = WebExcelDataTool.GetTableNameFromShellData(kfData);
    let sheetTable = WebExcelDataTool.GetTable(sheetTableName);
    let rowsProp = sheetTable.propertys[0];
    let rowsTable = WebExcelDataTool.GetTable(rowsProp.otype);
    let skillInfosProp;
    let skillInfosTable;
    let tablePropNameSkillInfos = "skillInfos";
    //createTable Sheet
    let eSheetTable = WebExcelDataTool.CreateTableObject(WebExcelDataTool.AddExcelTableNameFlag(sheetTableName));
    eSheetTable.propertys.push(WebExcelDataTool.CreateTablePropertyObject(rowsProp.name, rowsProp.type, WebExcelDataTool.AddExcelTableNameFlag(rowsProp.otype), rowsProp.unknowtags));
    //createTable Rows
    let eRowsTable = WebExcelDataTool.CreateTableObject(WebExcelDataTool.AddExcelTableNameFlag(rowsProp.otype));
    for (let i=0; i<rowsTable.propertys.length; i++)
    {
        if (rowsTable.propertys[i].name == tablePropNameSkillInfos)
        {
            skillInfosProp = rowsTable.propertys[i];
            skillInfosTable = WebExcelDataTool.GetTable(rowsTable.propertys[i].otype);
        }
        else
        {
            let propObj = WebExcelDataTool.CopyTablePropertyObject(rowsTable.propertys[i]);
            propObj.isbaseProp = true;//标记根属性
            eRowsTable.propertys.push(propObj);
        }
    }
    let propObj = WebExcelDataTool.CreateTablePropertyObject("Index", "int32");
    propObj.isExcelProp = true;
    eRowsTable.propertys.unshift(propObj);
    //addTableProp skillInfos
    for (let i=0; i<skillInfosTable.propertys.length; i++)
    {
        let propObj = WebExcelDataTool.CopyTablePropertyObject(skillInfosTable.propertys[i]);
        propObj.isArrProp = true;//标记数组属性
        eRowsTable.propertys.push(propObj);
    }
    //create data
    let exData = WebExcelDataTool.InstanceDataObject(eSheetTable, true);
    if (kfData.Rows)
    {
        let count = 0;
        for (let i=0; i<kfData.Rows.length; i++)
        {
            let rowBaseData = {};
            for (let key in kfData.Rows[i])
            {
                if (key != tablePropNameSkillInfos)
                    rowBaseData[key] = kfData.Rows[i][key];
            }
            if (kfData.Rows[i][tablePropNameSkillInfos].length == 0)
            {
                let rowData = {};
                rowData.Index = 0;
                for (let key in rowBaseData)
                    rowData[key] = rowBaseData[key];
                WebExcelDataTool.SetTableNameToShellData(rowData, eRowsTable.class);
                exData.Rows[count] = rowData;
                count++;
            }
            else
            {
                for (let j=0; j<kfData.Rows[i][tablePropNameSkillInfos].length; j++)
                {
                    let rowData = {};
                    rowData.Index = j;
                    for (let key in rowBaseData)
                        rowData[key] = rowBaseData[key];
                    for (let key in kfData.Rows[i][tablePropNameSkillInfos][j])
                        rowData[key] = kfData.Rows[i][tablePropNameSkillInfos][j][key];
                    WebExcelDataTool.SetTableNameToShellData(rowData, eRowsTable.class);
                    exData.Rows[count] = rowData;
                    count++;
                }
            }
        }
    }
    let excelData = {};
    excelData.exData = exData;
    excelData.frozen = {type: 'rangeBoth',
    range: {row_focus: 0, column_focus: 1}};
    return excelData;
}

WebExcelDataTool.WebExcelDataToKF8StaticSkillGroupSheet = function (excelData)
{
    let eSheetTable = WebExcelDataTool.GetTable(WebExcelDataTool.GetTableNameFromShellData(excelData));
    let eRowsTable = WebExcelDataTool.GetTable(eSheetTable.propertys[0].otype);
    let sheetTable = WebExcelDataTool.GetTable(WebExcelDataTool.RemoveExcelTableNameFlag(eSheetTable.class));
    let rowsTable = WebExcelDataTool.GetTable(WebExcelDataTool.RemoveExcelTableNameFlag(eRowsTable.class));
    let tablePropNameSkillInfos = "skillInfos";

    let SkillInfoTableName = eSheetTable.class.indexOf("_HD")<0 ? "KF8SkillInfo" : "HDSkillInfo"; //RA_V 新类型兼容

    let kfData = WebExcelDataTool.InstanceDataObject(sheetTable, false);
    if (excelData.Rows)
    {
        let count = -1;
        let curuid = 0;
        let arrIndex = 0;
        for (let i=0; i<excelData.Rows.length; i++)
        {
            if (excelData.Rows[i].uid==0)
                continue;
            if (curuid != excelData.Rows[i].uid)
            {
                count++;
                arrIndex = 0;
                curuid = excelData.Rows[i].uid;
                kfData.Rows[count] = {};
                kfData.Rows[count][tablePropNameSkillInfos] = [];
                for (let j=0; j<eRowsTable.propertys.length; j++)
                {
                    if (eRowsTable.propertys[j].isbaseProp && excelData.Rows[i][eRowsTable.propertys[j].name]!=null)
                        kfData.Rows[count][eRowsTable.propertys[j].name] = excelData.Rows[i][eRowsTable.propertys[j].name];
                }
                WebExcelDataTool.SetTableNameToShellData(kfData.Rows[count], rowsTable.class);
            }
            let skillInfo = {};
            for (let j=0; j<eRowsTable.propertys.length; j++)
            {
                if (eRowsTable.propertys[j].isArrProp && excelData.Rows[i][eRowsTable.propertys[j].name]!=null)
                    skillInfo[eRowsTable.propertys[j].name] = excelData.Rows[i][eRowsTable.propertys[j].name];
            }
            WebExcelDataTool.SetTableNameToShellData(skillInfo, SkillInfoTableName);
            kfData.Rows[count][tablePropNameSkillInfos].push(skillInfo);
            arrIndex++;
        }
    }
    return kfData;
}

WebExcelDataTool.InstanceDataObject = function (table, isExtendArr)
{
    let temp = {};
    WebExcelDataTool.SetTableNameToShellData(temp, table.class);
    for (let i=0; i<table.propertys.length; i++)
    {
        let prop = table.propertys[i];
        temp[prop.name] = WebExcelDataTool.InstanceDataProp(prop, isExtendArr);
    }
    return temp;
}
WebExcelDataTool.InstanceDataProp = function (tableProp, isExtendArr)
{
    if (WebExcelDataTool.IsArrayProperty(tableProp))
    {
        let arr = [];
        if (isExtendArr)
        {
            let len = WebExcelDataTool.GetArrLenOfProperty(tableProp);
            for (let i=0; i<len; i++)
            {
                if (WebExcelDataTool.IsOtypeProperty(tableProp))
                    arr.push(WebExcelDataTool.InstanceDataObject(WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(tableProp)), isExtendArr));
                else
                    arr.push(WebExcelDataTool.MakeDataValue(tableProp.default, tableProp));
            }
        }
        return arr;
    }
    else if (WebExcelDataTool.IsOtypeProperty(tableProp))
    {
        let table = WebExcelDataTool.GetTable(WebExcelDataTool.GetOtypeOfProperty(tableProp));
        return WebExcelDataTool.InstanceDataObject(table);
    }
    else
        return WebExcelDataTool.MakeDataValue(tableProp.default, tableProp);
}
//==========================================================================
WebExcelDataTool.GetOtypeOfProperty = function (tableProp)
{
    if (tableProp.hasOwnProperty("otype"))
        return tableProp["otype"];
    else if (tableProp.hasOwnProperty("class"))
        return tableProp["class"];
    else
        return "";
}
WebExcelDataTool.IsOtypeProperty = function (tableProp)
{
    if (tableProp.hasOwnProperty("otype"))
    {
        let spstr = "int8,uint8,int16,uint16,int,int32,uint32,uint,float,double,num1,num2,kfstr,kfname,null,kfBytes,bool,varuint,int64,uint64,hdNum";
        if (spstr.indexOf(tableProp["otype"]) >= 0)
            return false;
        return true;
    }
    else
        return false;
}
WebExcelDataTool.IsArrayProperty = function (tableProp)
{
    if (tableProp.hasOwnProperty("type") && tableProp["type"].indexOf("arr") >= 0)
        return true;
    else
        return false;
}
WebExcelDataTool.IsExattribProperty = function (property)
{
    let ex = WebExcelDataTool.GetExattribOfProperty(property);
    if (ex != null)
        return true;
    else
        return false;
}
WebExcelDataTool.GetTagOfProperty = function(tableProp,tagName)
{
    if(tableProp && tableProp.unknowtags)
    {
        for(let item of tableProp.unknowtags)
        {
            if(item.tag == tagName)
                return item.val;
        }
    }
    return null;
}
WebExcelDataTool.GetExattribOfProperty = function (tableProp)
{
    return WebExcelDataTool.GetTagOfProperty(tableProp, "EXATTRIB");
}
WebExcelDataTool.IsEditProperty = function (property)
{
    let ex = WebExcelDataTool.GetEditOfProperty(property);
    if (ex != null)
        return true;
    else
        return false;
}
WebExcelDataTool.GetEditOfProperty = function (tableProp)
{
    return WebExcelDataTool.GetTagOfProperty(tableProp, "EDIT");
}
WebExcelDataTool.GetArrLenOfProperty = function(tableProp)
{
    let len = WebExcelDataTool.GetTagOfProperty(tableProp, "COLLEN");
    if (len != null)
        return len;
    return 1;
}
//==========================================================================
WebExcelDataTool.CreateTableObject = function (className)
{
    let excelTable = {};
    excelTable.class = className;
    excelTable.propertys = [];
    WebExcelDataTool.AddToExcelTableLibs(excelTable);
    return excelTable;
}
WebExcelDataTool.CreateTablePropertyObject = function (name, type, otype, unknowtags)
{
    let obj = {};
    obj.name = name;
    obj.type = type;
    if (otype)
        obj.otype = otype;
    if (unknowtags)
        obj.unknowtags = unknowtags;
    return obj;
}
WebExcelDataTool.CopyTablePropertyObject = function (tableProp)
{
    let obj = {};
    for (let key in tableProp)
        obj[key] = tableProp[key];
    return obj;
}
WebExcelDataTool.GetTable = function (tableName)
{
    let table = WebExcelDataTool.kfdtable.get_kfddata(tableName);
    if (table == null)
        table = WebExcelDataTool.ExcelTableLibs[tableName];
    return table;
}
WebExcelDataTool.AddToExcelTableLibs = function (table)
{
    WebExcelDataTool.ExcelTableLibs[table.class] = table;
}
WebExcelDataTool.AddExcelTableNameFlag = function (KFTableName)
{
    return "Excel_"+KFTableName;
}
WebExcelDataTool.RemoveExcelTableNameFlag = function (ExcelTableName)
{
    if (ExcelTableName.indexOf("Excel_") >= 0)
    {
        let arr = ExcelTableName.split("Excel_");
        return arr[1];
    }
    return ExcelTableName;
}
//获取外壳数据(顶层数据)的Table名
WebExcelDataTool.GetTableNameFromShellData = function (data)
{
    if (data.push && data.length>0)//数组
    {
        return data[0]["__cls__"];
    }
    return data["__cls__"];
}
//设置外壳数据(顶层数据)的Table名
WebExcelDataTool.SetTableNameToShellData = function (data, tableName)
{
    data["__cls__"] = tableName;
    return data;
}
WebExcelDataTool.ReadDataValue = function (data, tableProp)
{
    switch (tableProp.type)
    {
        case "kfname":
            return data.toString();
        case "object":
            if (tableProp.hasOwnProperty("otype"))
            {
                switch (tableProp.otype)
                {
                    case "hdNum":
                        let xx = new hdNumHelper(data.rawValue);
                        return xx.ToNumber();
                }
            }
            return data;
        default:
            return data;
    }
}
WebExcelDataTool.MakeDataValue = function (value, tableProp)
{
    switch (tableProp.type)
    {
        case "kfname":
            let kfdn = new parent["KFDName"](value);
            return kfdn;
        case "kfstr":
            if (value)
                return value.toString();
            else
                return value;
        case "bool":
            if (value == "true" || value==true || value=="TRUE")
                return true;
            else
                return false;
        case "object":
            if (tableProp.hasOwnProperty("otype"))
            {
                switch (tableProp.otype)
                {
                    case "hdNum":
                        let kfdn = {rawValue:0};
                        let xx = new hdNumHelper(value);
                        kfdn.rawValue = xx.GetRawValue();
                        return kfdn;
                }
            }
            return value;
        default:
            return value;
    }
}