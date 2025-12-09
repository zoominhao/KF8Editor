

require("../../../libs/amd-loader");
const {KFByteArray} = require("../../../libs/kf/KFData/Utils/FKByteArray");
const fs = require('fs');
const path = require('path');

//_refs_.data

const appdatapath = process.argv[2] || "";

function travel(dir,callback)
{
    fs.readdirSync(dir).forEach((file)=>{
        var pathname=path.join(dir,file)
        if(fs.statSync(pathname).isDirectory()){
            travel(pathname,callback)
        }else{
            callback(pathname)
        }
    })
}

let RefObject = {};
travel(appdatapath + "/Refs",function(filepath)
{
    let data = fs.readFileSync(filepath);
    let bytesarr = new KFByteArray(data);

    bytesarr.SetPosition(0);

    let jsonstr = bytesarr.readstring();
    let refobj = JSON.parse(jsonstr);

    if(refobj && refobj.asseturl && refobj.info)
    {
        RefObject[refobj.asseturl] =  refobj.info;
    }

    console.log(">>>", filepath);
});

let RetRefString = JSON.stringify(RefObject);
let saveByteArray = new KFByteArray();

saveByteArray.writestring(RetRefString);

let refpath = appdatapath + "/_refs_.data";
fs.writeFile(refpath, new Uint8Array(saveByteArray.buffer), (err) => {
    if(err) {
        console.log(err);
    }
    else{
        console.log("create success ...");
    }
});

