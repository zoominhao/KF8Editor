KFDEditor.prototype.PreEdit = function (uidatas) {
    var flag = false;
    // 针对Vals数据显示问题
    if (uidatas && uidatas.length > 2 && uidatas[1]) {
        if (uidatas[1]._prop && uidatas[1]._prop.otype == "KFFrameValues" && uidatas[1]._src) {
            this.ProcessVals(uidatas[1]._src.vals);
            this.ProcessValChildren(uidatas[1].children, uidatas[1]._src.vals);

            flag = true;
        }
    }

    // 针对Boxs数据显示问题
    if (uidatas && uidatas.length > 3 && uidatas[2]) {
        if (uidatas[2]._prop && uidatas[2]._prop.otype == "KFFrameBox" && uidatas[2]._src) {
            this.ProcessBoxs(uidatas);

            flag = true;
        }
    }
    return flag;
}


KFDEditor.prototype.ProcessVals = function (vals) {
    if (vals == null) return;
    if (!vals.valArr) vals.valArr = new Array();
    if (!vals.nameArr) vals.nameArr = new Array();
    var totalLen = 0;
    for (var k = 0; k < vals.nameArr.length; ++k) {
        totalLen += (vals.nameArr[k] & 0xF);
    }
    let tmpvalArr = $.extend(true, {}, vals.valArr)
    let vallength = vals.valArr.length;
    if (vals.valArr.length != totalLen) {
        vals.valArr = Array(totalLen).fill(0);

        var offset = 0;
        for (var m = 0; m < vals.nameArr.length; m++) {
            switch (vals.nameArr[m]) {
                case 0x11:   //KFFrameValueName::Fov
                    vals.valArr[offset + 0].name = offset + 0 < vallength ? tmpvalArr[offset + 0] : 0;
                    break;
                case 0x13:   //KFFrameValueName::POSITION3
                case 0x43:
                case 0x23:   //KFFrameValueName::ROTATION3
                case 0x33:   //KFFrameValueName::SCALE3
                    vals.valArr[offset + 0] = offset + 0 < vallength ? tmpvalArr[offset + 0] : 0;
                    vals.valArr[offset + 1] = offset + 1 < vallength ? tmpvalArr[offset + 1] : 0;
                    vals.valArr[offset + 2] = offset + 2 < vallength ? tmpvalArr[offset + 2] : 0;
                    break;
                case 0x1b:   //KF8FrameAttr::DIRECTIONLIGHT
                    vals.valArr[offset + 0] = offset + 0 < vallength ? tmpvalArr[offset + 0] : 0;
                    vals.valArr[offset + 1] = offset + 1 < vallength ? tmpvalArr[offset + 1] : 0;
                    vals.valArr[offset + 2] = offset + 2 < vallength ? tmpvalArr[offset + 2] : 0;
                    vals.valArr[offset + 3] = offset + 3 < vallength ? tmpvalArr[offset + 3] : 0;
                    vals.valArr[offset + 4] = offset + 4 < vallength ? tmpvalArr[offset + 4] : 0;
                    vals.valArr[offset + 5] = offset + 5 < vallength ? tmpvalArr[offset + 5] : 0;
                    vals.valArr[offset + 6] = offset + 6 < vallength ? tmpvalArr[offset + 6] : 0;
                    vals.valArr[offset + 7] = offset + 7 < vallength ? tmpvalArr[offset + 7] : 0;
                    vals.valArr[offset + 8] = offset + 8 < vallength ? tmpvalArr[offset + 8] : 0;
                    vals.valArr[offset + 9] = offset + 9 < vallength ? tmpvalArr[offset + 9] : 0;
                    vals.valArr[offset + 10] = offset + 10 < vallength ? tmpvalArr[offset + 10] : 0;

                    vals.nameArr[m] = 0x1b;
                    break;
                case 0x24:   //KF8FrameAttr::SKYLIGHT
                    vals.valArr[offset + 0] = offset + 0 < vallength ? tmpvalArr[offset + 0] : 0;
                    vals.valArr[offset + 1] = offset + 1 < vallength ? tmpvalArr[offset + 1] : 0;
                    vals.valArr[offset + 2] = offset + 2 < vallength ? tmpvalArr[offset + 2] : 0;
                    vals.valArr[offset + 3] = offset + 3 < vallength ? tmpvalArr[offset + 3] : 0;
                    vals.nameArr[m] = 0x24;
                    break;
            }
            offset += (vals.nameArr[m] & 0xF);
        }
    }

}

KFDEditor.prototype.ProcessValChildren = function (children, vals) {
    if (children == null || children[0] == null || children[0].children == null) return;
    if (vals == null || vals.valArr == null) return;
    children[0].uivalue = "#NoAdd";
    /*if(children[1])
    {
        children[1].relateUiId = children[0].id;
        for(var i = 0; i < children[1].children.length - 1; ++i)
        {
            children[1].children[i].uivalue = "";
        }
    }*/ //触发刷新 TODO

    var arrchildren = children[0].children;
    var start = arrchildren.length;
    for (var i = 0; i < start; ++i) {
        arrchildren[i].uivalue = "";
    }
    if (children[0].children.length < vals.valArr.length) {
        for (var i = start; i < vals.valArr.length; ++i) {
            let oprop = {type: "num1", name: i, enum: undefined};
            let kuiobj = this._newuidata(oprop, children[0]);

            kuiobj.name = i + "test";
            kuiobj.value = vals.valArr[i];
            kuiobj.vtype = 7;
            kuiobj._src = vals.valArr;
            kuiobj._prop = oprop;
            kuiobj.uivalue = "";

            arrchildren.push(kuiobj);
        }
    }

    var offset = 0;
    for (var m = 0; m < vals.nameArr.length; m++) {
        switch (vals.nameArr[m]) {
            case 0x11:   //KFFrameValueName::Fov
                arrchildren[offset + 0].name = "镜头FOV";
                break;
            case 0x13:   //KFFrameValueName::POSITION3
                arrchildren[offset + 0].name = "position_x";
                arrchildren[offset + 1].name = "position_y";
                arrchildren[offset + 2].name = "position_z";
                break;
            case 0x21:   //KFFrameValueName::DIALOG
                arrchildren[offset + 0].name = "dialog";
                break;
            case 0x14:   //KFFrameValueName::COLOR
                arrchildren[offset + 0].name = "color_r";
                arrchildren[offset + 1].name = "color_g";
                arrchildren[offset + 2].name = "color_b";
                arrchildren[offset + 3].name = "color_a";
                break;
            case 0x43:
            case 0x23:   //KFFrameValueName::ROTATION3
                arrchildren[offset + 0].name = "rotation_pitch";
                arrchildren[offset + 1].name = "rotation_yaw";
                arrchildren[offset + 2].name = "rotation_roll";
                break;
            case 0x33:   //KFFrameValueName::SCALE3
                arrchildren[offset + 0].name = "scale_x";
                arrchildren[offset + 1].name = "scale_y";
                arrchildren[offset + 2].name = "scale_z";
                break;
            case 0x1b:   //KF8FrameAttr::DIRECTIONLIGHT
                arrchildren[offset + 0].name = "RotatorX";
                arrchildren[offset + 1].name = "Intensity";
                arrchildren[offset + 2].name = "Color_r";
                arrchildren[offset + 3].name = "Color_g";
                arrchildren[offset + 4].name = "Color_b";
                arrchildren[offset + 5].name = "NearShadowColor_r";
                arrchildren[offset + 6].name = "NearShadowColor_g";
                arrchildren[offset + 7].name = "NearShadowColor_b";
                arrchildren[offset + 8].name = "FarShadowColor_r";
                arrchildren[offset + 9].name = "FarShadowColor_g";
                arrchildren[offset + 10].name = "FarShadowColor_b";
                break;
            case 0x24:   //KF8FrameAttr::SKYLIGHT
                arrchildren[offset + 0].name = "Intensity";
                arrchildren[offset + 1].name = "Color_r";
                arrchildren[offset + 2].name = "Color_g";
                arrchildren[offset + 3].name = "Color_b";
                break;
            case 0x53:   //KFFrameValueName::CINECAMERA
                arrchildren[offset + 0].name = "聚焦距离";
                arrchildren[offset + 1].name = "光圈";
                arrchildren[offset + 2].name = "焦距";
                break;
        }

        // 转移val
        let valsChildren = new Array();
        for(var k = 0; k < vals.nameArr[m] % 16; k++)
        {
            arrchildren[offset + k]._parent = children[1].children[m];
            valsChildren.push(arrchildren[offset + k]);
        }
        children[1].children[m].children = valsChildren;

        offset += (vals.nameArr[m] & 0xF);
    }

    // 针对offset多出的部分进行删除
    arrchildren.splice(offset);
}

KFDEditor.prototype.ProcessBoxs = function (uidatas) {
    if (uidatas == null) return;
    if (uidatas[2].children == null) return;
    if (uidatas[2].children.length < 3) return;
    // 更改数据名称
    uidatas[2].children[0].uicolor = 'black'
    uidatas[2].children[1].uicolor = 'black'
    uidatas[2].children[2].uicolor = 'black'
    for(var i = 0 ; i < uidatas[2].children[0].children.length; i++)
    {
        uidatas[2].children[0].children[i].name = "受击" + i;
        uidatas[2].children[0].children[i].uicolor = 'black';
    }
    for(var i = 0 ; i < uidatas[2].children[1].children.length; i++)
    {
        uidatas[2].children[1].children[i].name = "攻击" + i;
        uidatas[2].children[1].children[i].uicolor = 'black';
    }
    for(var i = 0 ; i < uidatas[2].children[2].children.length; i++)
    {
        uidatas[2].children[2].children[i].name = "特殊" + i;
        uidatas[2].children[2].children[i].uicolor = 'black';
    }

    // 非特殊框无特殊框类型
    for(var i = 0 ; i < uidatas[2].children[0].children.length; i++)
    {
        uidatas[2].children[0].children[i].children.splice(7, 1);
    }
    for(var i = 0 ; i < uidatas[2].children[1].children.length; i++)
    {
        uidatas[2].children[1].children[i].children.splice(7, 1);
    }

    //颜色区分


    this.tg.treegrid({
        rowStyler:function(index,row){
            if(index.name.indexOf("受击") != -1
                || (index._parent && index._parent.name.indexOf("受击") != -1)
                || (index._parent && index._parent._parent && index._parent._parent.name.indexOf("受击") != -1))
                return 'background-color:lightblue;color:black;font-weight:bold;';
            if(index.name.indexOf("攻击") != -1
                || (index._parent && index._parent.name.indexOf("攻击") != -1)
                || (index._parent && index._parent._parent && index._parent._parent.name.indexOf("攻击") != -1))
                return 'background-color:LightCoral ;color:black;font-weight:bold;';
            if(index.name.indexOf("特殊") != -1
                || (index._parent && index._parent.name.indexOf("特殊") != -1)
                || (index._parent && index._parent._parent && index._parent._parent.name.indexOf("特殊") != -1))
                return 'background-color:lightyellow;color:black;font-weight:bold;';
        }
    });
}