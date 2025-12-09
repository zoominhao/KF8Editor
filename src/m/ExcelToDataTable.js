define(["require", "exports"],function(require, exports) {
    function ExcelToDataTable(context){
        this.context = context;
        this.pathdir = "";
        this.blkname = "";
        this.assetdir = "";
    }

    ExcelToDataTable.prototype.Import = function (folder) {

        this.pathdir = folder + "/";
        this.assetdir = this.pathdir.replace(this.context.appdatapath + "/","");

        let filepaths = fileOpenDialog({properties: ['openFile']});
        if(filepaths && filepaths.length > 0){
            filepath = filepaths[0].replace(/\\/g,"/");
            if(filepath.indexOf("xls") != -1){
                this.LoadXlS(filepath);
            }
        }
    };

    ExcelToDataTable.prototype.LoadXlS = function(filepath){
        let self = this;
        IKFFileIO_Type.instance.asyncLoadFile(filepath,function (ret,data,path) {

            if(ret){

                let starti = path.lastIndexOf("/");
                if(starti == -1)
                    starti = path.lastIndexOf("\\");

                self.blkname = path.substring(starti + 1, path.lastIndexOf("."));

                let xlsdata = XLSX.read(data, {type: 'array'});
                let sheet1 = xlsdata.Sheets.Sheet1;
                let jsondata = XLSX.utils.sheet_to_json(sheet1);
                self.ToDataTable(jsondata);
            }

        });

    }


    ExcelToDataTable.prototype.CreateTypeVar = function(typename,value){
        switch (typename) {

            case "BLKVar":
                return {__cls__:"BLKVar",value:null,name:""};
            case "SDBLKVars":
                return {__cls__:"SDBLKVars",value:[]};
            case "SDBLKVarsDef":
                return {__cls__:"SDBLKVarsDef",name:"",value:[]};
            case "BLKVarDef":
                return {__cls__: "BLKVarDef",name:""};
            case "int32":
                return {__cls__:"SDInt32",value:parseInt(value)};
            case "float":
                return {__cls__:"SDFloat",value:parseFloat(value)};
            case "string":
                return {__cls__:"SDString",value:value + ""};
            case "bool":
                return {__cls__:"SDBool",value:(value == "true")};
            case "array":
                return {__cls__:"SDArray",value:[]};
            case "array<string>":
                var arrobj =  {__cls__:"SDStringArray",value:[]};

                if(value)
                {
                    var strarr = value.split(",");
                   for(var i = 0; i < strarr.length; i ++)
                   {
                       arrobj.value.push(strarr[i]);
                   }
                }

                return arrobj;
            case "array<int32>":
                var arrobj = {__cls__:"SDInt32Array",value:[]};
                if(value)
                {
                    var strarr = value.split(",");
                    for(var i = 0; i < strarr.length; i ++)
                    {
                        arrobj.value.push(parseInt(strarr[i]));
                    }
                }
                return arrobj;
            case "array<float>":
                var arrobj = {__cls__:"SDFloatArray",value:[]};
                if(value)
                {
                    var strarr = value.split(",");
                    for(var i = 0; i < strarr.length; i ++)
                    {
                        arrobj.value.push(parseFloat(strarr[i]));
                    }
                }
                return arrobj;
            case "vector":
                return {__cls__: "kfVector3", x:0,y:0,z:0};

        }
        return {__cls__:"SDString",value:""};
    }


    ExcelToDataTable.prototype.ToDataTable = function(arr){
        ///定义字段名称
        var rowdata = arr[0];
        var name2varname = {};
        var vardefs = [];

        for(var name in rowdata)
        {
            var def = {};
            def.name = rowdata[name];
            def.label = name;
            name2varname[name] = def;
            vardefs.push(def);
        }
        ///定义类型
        rowdata = arr[1];
        for(var name in rowdata)
        {
            var def = name2varname[name];
            def.type = rowdata[name];
        }

        ///定义结构体或数组
        rowdata = arr[2];
        for(var name in rowdata)
        {
            var typename = rowdata[name];

            if(typename != "-")
            {
                var def = name2varname[name];
                def.group = typename;
            }
        }

        ///整合一下字义的结构体
        var SDBLKVarsDefGroup = {};
        var SDBLKVarsDef = this.CreateTypeVar("SDBLKVarsDef");
        SDBLKVarsDef.name = "root";
        var pkeyname = "";

        for(var vi = 0; vi <vardefs.length ; vi ++){
            var vardef = vardefs[vi];

            var BLKVarDef = this.CreateTypeVar("BLKVarDef");

            BLKVarDef.name = vardef.name;
            BLKVarDef.value = this.CreateTypeVar(vardef.type);
            BLKVarDef.label = vardef.label;

            if(vardef.group == undefined || vardef.group == "pkey")
            {
                SDBLKVarsDef.value.push(BLKVarDef);
                if(vardef.group == "pkey")
                    pkeyname = vardef.name;
            }
            else
                {
                var group = SDBLKVarsDefGroup[vardef.group];
                if(group == null)
                {
                    group = this.CreateTypeVar("BLKVarDef");
                    group.name = vardef.group;
                    group.value = this.CreateTypeVar("SDBLKVarsDef");

                    SDBLKVarsDefGroup[vardef.group] = group;
                    SDBLKVarsDef.value.push(group);
                }
                group.value.value.push(BLKVarDef);
            }
        }

        ///数据
        var AllDatas = [];
        for(var i = 3; i < arr.length; i ++)
        {
            var RD = arr[i];
            var SDBLKVars = this.CreateTypeVar("SDBLKVars");
            var BLKVarsMap = {};

            for(var rowname in RD)
            {
                var varvalue = RD[rowname];
                var vardef = name2varname[rowname];
                var blkvar = this.CreateTypeVar("BLKVar");
                blkvar.name = vardef.name;
                blkvar.value = this.CreateTypeVar(vardef.type, varvalue);

                if(vardef.group && vardef.group != "pkey"){
                    var childvars = BLKVarsMap[vardef.group];
                    if(childvars == null)
                    {
                        childvars = this.CreateTypeVar("BLKVar");
                        childvars.name = vardef.group;
                        childvars.value = this.CreateTypeVar("SDBLKVars");
                        BLKVarsMap[vardef.group] = childvars;

                        SDBLKVars.value.push(childvars);
                    }

                    childvars.value.value.push(blkvar);
                }else{
                    SDBLKVars.value.push(blkvar);
                }
            }

            AllDatas.push(SDBLKVars);
        }

        this.ExportDataTable(SDBLKVarsDef, AllDatas, pkeyname)
    }

    ExcelToDataTable.prototype.ExportDataTable = function(struct, rows, pkey)
    {
        let metadata = {"__cls__":"KFMetaData"};

        metadata.name = this.blkname;
        metadata.type = "KFDataTable";

        let kfbytes = new KFBytes();
        kfbytes.object = {__cls__:"KFDataTable", "struct":struct, "rows":rows, "pkey":pkey};
        metadata.data = kfbytes;

        let blkdata = {};

        blkdata.blk = metadata;
        blkdata.path = this.pathdir + this.blkname + ".blk";
        blkdata.asseturl = this.assetdir + this.blkname + ".blk";

        //this.context.SaveBlk();
        let self = this;

        this.context.SaveBlkList([blkdata],null,function (ret) {

            Msg((ret ? "文件保存成功:" : "文件保存失败:") + blkdata.path,1);

        if(ret){
            ///更新资源库
            self.context.UpdateBLKPaths();
        }
    });

    }

    exports.ExcelToDataTable = ExcelToDataTable;
})