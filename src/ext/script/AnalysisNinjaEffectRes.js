require("../../../libs/amd-loader");
const {KFByteArray} = require("../../../libs/kf/KFData/Utils/FKByteArray");
const {ScriptSearch} = require("./ScriptSearch");
const {KFDJson} = require("../../../libs/kf/KFData/Format/KFDJson");
const {KFHttpFileIO} = require("../../../libs/kf/KFNetwork/Http/KFHttpFileIO");
const {IKFFileIO_Type} = require("../../../libs/kf/Core/FileIO/IKFFileIO");
const {HttpRequest_Type} = require("../../../libs/kf/KFNetwork/Http/Request/HttpRequest");
const {WebHttpRequest} = require("../../../libs/kf/KFNetwork/Http/Request/web/WebHttpRequest");
const {KFDTable} = require("../../../libs/kf/KFData/Format/KFDTable");

const fs = require('fs');
const path = require('path');


const appdatapath = process.argv[2] || "";
const kfdpath = process.argv[3] || "";
const dir_name = process.argv[4] || "";
const specifiedIDs = process.argv[5] || "";


let resObj = {};
let effectObj = {};
let curveObj = {};
let gninjaId = "60001";
function VFXScriptProc(scriptData) 
{
    if(scriptData && scriptData.IsSelf != false)
    {
        if(effectObj[gninjaId])
        {
            if(scriptData.IsSenseEnv == null || scriptData.IsSenseEnv == false)
            {
                if(scriptData.VisualFXID && scriptData.VisualFXID != "" && effectObj[gninjaId].indexOf(scriptData.VisualFXID) === -1)
                {
                    effectObj[gninjaId].push(scriptData.VisualFXID);
                }
            }
            else
            {
                if(scriptData.EnvVisualFxID)
                {
                    if(scriptData.EnvVisualFxID.Land_Fx_Name && scriptData.EnvVisualFxID.Land_Fx_Name != "" && effectObj[gninjaId].indexOf(scriptData.EnvVisualFxID.Land_Fx_Name) === -1)
                        effectObj[gninjaId].push(scriptData.EnvVisualFxID.Land_Fx_Name);
                    if(scriptData.EnvVisualFxID.Water_Fx_Name && scriptData.EnvVisualFxID.Water_Fx_Name != "" && effectObj[gninjaId].indexOf(scriptData.EnvVisualFxID.Water_Fx_Name) === -1)
                        effectObj[gninjaId].push(scriptData.EnvVisualFxID.Water_Fx_Name);
                    if(scriptData.EnvVisualFxID.WallTree_Fx_Name && scriptData.EnvVisualFxID.WallTree_Fx_Name != "" && effectObj[gninjaId].indexOf(scriptData.EnvVisualFxID.WallTree_Fx_Name) === -1)
                        effectObj[gninjaId].push(scriptData.EnvVisualFxID.WallTree_Fx_Name);
                }
            }    
        }
    }
}

function CurveScriptProc(scriptData)
{
    if(scriptData && scriptData.IsSelf != false)
    {
        if(curveObj[gninjaId])
        {
            // 曲线移动
            if(scriptData.CurveName && scriptData.CurveName != "" && curveObj[gninjaId].indexOf(scriptData.CurveName) === -1)
            {
                curveObj[gninjaId].push(scriptData.CurveName);
            }
            // 使用镜头
            else if(scriptData.CamCurveMovieParams)
            {
                if(scriptData.CamCurveMovieParams.LocationCurveID && scriptData.CamCurveMovieParams.LocationCurveID != "" && curveObj[gninjaId].indexOf(scriptData.CamCurveMovieParams.LocationCurveID) === -1)
                {
                    curveObj[gninjaId].push(scriptData.CamCurveMovieParams.LocationCurveID);
                }
                if(scriptData.CamCurveMovieParams.RotationCurveID && scriptData.CamCurveMovieParams.RotationCurveID != "" && curveObj[gninjaId].indexOf(scriptData.CamCurveMovieParams.RotationCurveID) === -1)
                {
                    curveObj[gninjaId].push(scriptData.CamCurveMovieParams.RotationCurveID);
                }
                if(scriptData.CamCurveMovieParams.FOVCurveID && scriptData.CamCurveMovieParams.FOVCurveID != "" && curveObj[gninjaId].indexOf(scriptData.CamCurveMovieParams.FOVCurveID) === -1)
                {
                    curveObj[gninjaId].push(scriptData.CamCurveMovieParams.FOVCurveID);
                }
                if(scriptData.CamCurveMovieParams.OffsetCurveID && scriptData.CamCurveMovieParams.OffsetCurveID != "" && curveObj[gninjaId].indexOf(scriptData.CamCurveMovieParams.OffsetCurveID) === -1)
                {
                    curveObj[gninjaId].push(scriptData.CamCurveMovieParams.OffsetCurveID);
                }
            }
            // 设置特效参数
            else
            {
                if(scriptData.RadialBlur_Curve && scriptData.RadialBlur_Curve != "" && curveObj[gninjaId].indexOf(scriptData.RadialBlur_Curve) === -1)
                {
                    curveObj[gninjaId].push(scriptData.RadialBlur_Curve);
                }
                if(scriptData.WhiteBlackBlink_Curve && scriptData.WhiteBlackBlink_Curve != "" && curveObj[gninjaId].indexOf(scriptData.WhiteBlackBlink_Curve) === -1)
                {
                    curveObj[gninjaId].push(scriptData.WhiteBlackBlink_Curve);
                }
                if(scriptData.ColorDispersion_Curve && scriptData.ColorDispersion_Curve != "" && curveObj[gninjaId].indexOf(scriptData.ColorDispersion_Curve) === -1)
                {
                    curveObj[gninjaId].push(scriptData.ColorDispersion_Curve);
                }
            }
        }
    }
}
 
function LoadBlk(metapath, callback) {
    let lindex = metapath.lastIndexOf("/");
    let blkname = metapath.substr(lindex + 1);
    let filedir = metapath.substr(0, lindex);
    let asseturl = metapath;///相对路径

    if (filedir.indexOf(":") == -1
        && filedir.startsWith("/") == false) {
        //相对路径
        filedir = appdatapath + "/" + filedir;
    } else {
        //绝对路径转相对路径
        asseturl = metapath.replace(appdatapath + "/", "");
    }
    filedir += "/";
    metapath = filedir + blkname;
    /*HttpRequest_Type.meta = WebHttpRequest.Meta;
    IKFFileIO_Type.meta = KFHttpFileIO.Meta;
    IKFFileIO_Type.new_default();*/

    //构造kfd data table
    let kfdfilePaths = ["Kungfu8.kfd", "kf8GamePlay.kfd", "RA.kfd"];
    let kfdtable = KFDTable.kfdTB;
    let kfdNewFuncs = {};
    for (let i = 0; i < kfdfilePaths.length; i++) {
        kfdfilePaths[i] = kfdpath + "/" + kfdfilePaths[i];

        let kfdbytedata = fs.readFileSync(kfdfilePaths[i]);
        let kfddatajson = JSON.parse(kfdbytedata);

        kfdtable.add_kfd(kfddatajson, function (kfddata) {
            let newfunc = kfdNewFuncs[kfddata.class];
            if (newfunc) {
                kfddata.__new__ = newfunc;
            }
        });
    }
    //构造kfd data table

    let loadAniAndGraph = function (blkobj, dirpath) {
        let blkdata = {blk: blkobj, dir: dirpath, path: metapath, asseturl: asseturl};
        let timelinedata = fs.readFileSync(dirpath + "timeline.data");
        let timelineByteArrary = new KFByteArray(timelinedata);
        timelineByteArrary.SetPosition(0);
        let timelineobj = KFDJson.read_value(timelineByteArrary);
        timelineobj = timelineobj == null ? {} : timelineobj;
        if(timelineobj)
        {
            blkdata.timeline = timelineobj;
            blkdata.timelinepath = dirpath + "timeline.data";
        }

        let graphdata = fs.readFileSync(dirpath + "graph.data");
        let graphByteArrary = new KFByteArray(graphdata);
        graphByteArrary.SetPosition(0);
        let graphobj = KFDJson.read_value(graphByteArrary);
        graphobj = graphobj == null ? {} : graphobj;
        if(graphobj)
        {
            blkdata.graph = graphobj;
            blkdata.graphpath = dirpath + "graph.data";
        }

        if (callback) {
            callback(true, blkdata, metapath);
        }
    }

    //加载blk meta
    let metadata = fs.readFileSync(metapath);
    let metaByteArrary = new KFByteArray(metadata);
    metaByteArrary.SetPosition(0);
    let blkobj = KFDJson.read_value(metaByteArrary);

    if(blkobj != null)
    {
        console.log("read success ...");
        loadAniAndGraph(blkobj, filedir + blkname.replace(".blk", "") + "/");
    }
    else
    {
        console.error("decode fail:" + metapath);
        if (callback)
        {
            callback(false, null, metapath);
        }
    }
    //加载blk meta
}

function DoAnalysis(ninjaIDArr, dir_name)
{
    let i = 0;
    let loadNext = function () {
        if (i < ninjaIDArr.length) {
            let ninjaID = ninjaIDArr[i];
            let fxArr = new Array();
            let curveArr = new Array();
            effectObj[ninjaID+""] = fxArr;
            curveObj[ninjaID+""] = curveArr;
            console.log("analysis id: " + ninjaID);
            let scriptSearch = new ScriptSearch();
            gninjaId = ninjaID;
            LoadBlk("App/Entity/" + dir_name + "/" + ninjaID + ".blk", function (ret, blkdata, blkpath) {
                // 特效
                scriptSearch.SearchGraphScript(blkdata, "GSPlayVisualFXScriptData", true, VFXScriptProc);
                scriptSearch.SearchTimelineScript(blkdata, "GSPlayVisualFXScriptData", true, VFXScriptProc);
                // 曲线
                scriptSearch.SearchGraphScript(blkdata, "TSMoveByCurveData", true, CurveScriptProc);
                scriptSearch.SearchTimelineScript(blkdata, "TSMoveByCurveData", true, CurveScriptProc);
                scriptSearch.SearchGraphScript(blkdata, "TSUseCameraData", true, CurveScriptProc);
                scriptSearch.SearchTimelineScript(blkdata, "TSUseCameraData", true, CurveScriptProc);
                scriptSearch.SearchGraphScript(blkdata, "GSSetFxParamData", true, CurveScriptProc);
                scriptSearch.SearchTimelineScript(blkdata, "GSSetFxParamData", true, CurveScriptProc);
                i += 1;
                loadNext();
            }, true);
        } else {
            console.log("analysis finish");
            //删除init
            delete curveObj["__init__"];
            delete effectObj["__init__"];

            //替换common和common-m的key为Common
            if (dir_name == "Role")
            {
                effectObj["Common"] = effectObj["common"];
                delete effectObj["common"];
                curveObj["Common"] = curveObj["common"];
                delete curveObj["common"];
            }
            else if (dir_name == "Monster")
            {
                effectObj["Common"] = effectObj["common_M"];
                delete effectObj["common_M"];
                curveObj["Common"] = curveObj["common_M"];
                delete curveObj["common_M"];
            }

            resObj["Effects"] = effectObj;
            resObj["Curves"] = curveObj;
            let resString = JSON.stringify(resObj);

            let refpath = appdatapath + "/_res_.data";
            fs.writeFile(refpath, resString, (err) => {
                if(err) {
                    console.log(err);
                }
                else{
                    console.log("write success ...");
                }
            });
        }
    }

    loadNext();
}

function Analysis()
{
    if(appdatapath == "") console.error("appdatapath is not valid");
    if(kfdpath == "") console.error("kfdpath is not valid");
    if(dir_name == "") console.error("dir_name is not valid");

    var ninjaIDArr = new Array();
    if(specifiedIDs == "")
    {
        console.log("start full ninjas analysis...");
        fs.readdir(appdatapath + "/App/Entity/" + dir_name + "/", (err, files) => {
            if (err)
                console.log("search dir fail: " + err);
            else {
                files.forEach(file => {
                    if (path.extname(file) == ".blk")
                    {
                        let ninjaid = file.substr(0, file.lastIndexOf("."));
                        ninjaIDArr.push(ninjaid);
                    }
                })
                DoAnalysis(ninjaIDArr, dir_name);
            }
        })

    }
    else
    {
        ninjaIDArr = specifiedIDs.split(",");
        DoAnalysis(ninjaIDArr, dir_name);
    }
}

Analysis();