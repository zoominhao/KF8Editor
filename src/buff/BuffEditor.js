
_global.Event.on("OnBlkSaved", function (blkdata, context) {
    if (!_global.editor || !_global.editor.blkattrib || !_global.editor.blkattrib.buffEditor) {
        return;
    }

    let ret = blkdata.path.search(/StatusGroups/);
    if (ret == -1) return;

    // 当前是总表，保存至分表
    if (blkdata.path.endsWith("SpecialStatusInfos.blk")) {
        BuffEditor.SaveAll(context, blkdata);
    } else {
        // 当前是分表，保存至总表
        BuffEditor.SaveSub(context, blkdata);
    }
});


function BuffEditor(editor) {
    this.editor = editor;
    this.edit_window = null;
    this.modify_buff_item_array = [];
    this.del_id_array = [];
    this.blkpath = "";
    this.role_common_min_id = 10000;
    this.role_common_max_id = 899999;
    this.level_common_min_id = 900000;
    this.level_common_max_id = 999999;
    this.cur_window_edit_buff_id = 0;
}

BuffEditor.prototype.OnBeforeEdit = function (blkpath) {
    this.blkpath = blkpath;
    this.modify_buff_item_array.length = 0;
    this.del_id_array.length = 0;
    this.cur_window_edit_buff_id = 0;
}

BuffEditor.prototype.OnAfterEdit = function (uidatas) {
    let blkpath = this.blkpath;
    if (!blkpath || (!blkpath.endsWith("SSEFInfo.blk") && !blkpath.endsWith("SpecialStatusInfos.blk"))) {
        return;
    }
    // // 特效表按类型显示行背景色
    // this.editor.tg.treegrid({
    //     rowStyler: function(row){
    //         let effect_type = row.value.EffectType;
    //         if (!effect_type) return;
    //         //return 'background-color:pink;color:blue;font-weight:bold;';
    //         //return 'background-color:#6293BB;color:#fff;'; // return inline style
    //         // the function can return predefined css class and inline style
    //         // return {class:'r1', style:{'color:#fff'}};
    //     }
    // });
    //
    // TODO 不知道为啥再LOAD一次才有颜色,Rows下面才会展开
    this.editor.tg.treegrid('loadData', uidatas);
    this.editor.tg.treegrid("expandAll");
}

BuffEditor.prototype.EditOneBuff = function (uidata) {
    if (!this.edit_window) {
        this.edit_window = new BuffWindow($('#kfdEdtWin'), uidata._editor.kfdtable);
    }

    let buff_item = uidata.value;
    let buff_idx = -1;
    for (var i = 0; i < uidata._src.length; i++) {
        if (uidata._src[i].StatusID == buff_item.StatusID) {
            buff_idx = i;
            break;
        }
    }
    let title_str = buff_item.StatusID.toString() + '-' + buff_item.Name;
    this.cur_window_edit_buff_id = buff_item.StatusID;
    this.edit_window.open({title: title_str, src: buff_item, inprops: {"target": {"__state__": "open"}}})
    this.edit_window.beforeCloseFunc = function () {
        //this.editor.Edit(this.editor.curData, this.editor.curInprops);
        let select_row = this.editor.tg.treegrid("getSelected");
        this.editor.tg.treegrid("reload", select_row.id);
        //this.editor.tg.treegrid("expand", uidata._parent.id);
        //this.editor.tg.treegrid("scrollTo", select_row.id);
    }.bind(this);
}

BuffEditor.prototype.EditOneBuffEffect = function (uidata) {
    if (!this.edit_window) {
        this.edit_window = new KFDEdtWrapWindow($('#kfdEdtWin'), uidata._editor.kfdtable);
    }
    let effect_item = uidata.value;
    let effect_idx = -1;
    for (var i = 0; i < uidata._src.length; i++) {
        if (uidata._src[i].EffectId == effect_item.EffectId) {
            effect_idx = i;
            break;
        }
    }
    let title_str = effect_item.EffectId.toString() + '-' + effect_item.Desc;
    this.edit_window.open({title: title_str, src: effect_item, inprops: {"target": {"__state__": "open"}}})
    this.edit_window.beforeCloseFunc = function () {
        //this.editor.Edit(this.editor.curData, this.editor.curInprops);
        let select_row = this.editor.tg.treegrid("getSelected");
        this.editor.tg.treegrid("reload", select_row.id);
        //this.editor.tg.treegrid("expand", uidata._parent.id);
    }.bind(this);
}

BuffEditor.OnBuffChange = function (uidata) {
    if (!_global.editor || !_global.editor.blkattrib || !_global.editor.blkattrib.buffEditor) return;
    let buff_editor = _global.editor.blkattrib.buffEditor;
    let blkpath = buff_editor.blkpath;
    // BUFF总表，加入BUFF修改列表
    if (!blkpath || !blkpath.endsWith("SpecialStatusInfos.blk")) {
        return;
    }
    if (uidata.uivalue == "#edit_delete") {
        buff_editor.del_id_array.push(uidata.value.StatusID);
    } else {
        let rows = buff_editor.editor.curData.data.object.Rows;
        for (let buff_item of rows) {
            if (buff_item.StatusID != buff_editor.cur_window_edit_buff_id) continue;
            let exist = false;
            for (let modify_buff_item of buff_editor.modify_buff_item_array) {
                if (modify_buff_item.StatusID == buff_item.StatusID) {
                    modify_buff_item = buff_item;
                    exist = true;
                    break;
                }
            }
            if (!exist) {
                buff_editor.modify_buff_item_array.push(buff_item);
            }
            break;
        }
    }
}

BuffEditor.SaveAll = function (context, all_blkdata) {
    let p = all_blkdata.path;
    let ret = p.search("SpecialStatusInfos.blk");
    let sub_table_path = p.substr(0, ret) + "SSInfo/";
    let buff_editor = _global.editor.blkattrib.buffEditor;

    // 找出修改的分表
    let sub_table_path_set = new Set();
    for (let buff_item of buff_editor.modify_buff_item_array) {
        let blk_name = BuffEditor.GetBlkNameByBuffId(buff_item.StatusID);
        let sub_path = sub_table_path + blk_name;
        sub_table_path_set.add(sub_path);
    }
    for (let buff_id of buff_editor.del_id_array) {
        let blk_name = BuffEditor.GetBlkNameByBuffId(buff_id);
        let sub_path = sub_table_path + blk_name;
        sub_table_path_set.add(sub_path);
    }
    let sub_table_save_cnt = 0;
    for (let sub_path of sub_table_path_set) {
        context.LoadBlk(sub_path, function (ret, sub_blkdata, sub_blkpath) {
            ++ sub_table_save_cnt;
            do {
                if (!ret || !sub_blkdata || !sub_blkdata.blk || !sub_blkdata.blk.data) break;
                let sub_buff = KFDJson.read_value(sub_blkdata.blk.data.bytes, false);
                if (!sub_buff) break;
                // 修改分表BUFF
                for (let buff_item of buff_editor.modify_buff_item_array) {
                    let table_name = BuffEditor.GetBlkNameByBuffId(buff_item.StatusID);
                    if (!sub_path.endsWith(table_name)) {
                        continue;
                    }
                    let exist = false;
                    for (let j = 0; j < sub_buff.Rows.length; ++ j) {
                        if (sub_buff.Rows[j].StatusID == buff_item.StatusID) {
                            sub_buff.Rows[j] = buff_item;
                            exist = true;
                            break;
                        }
                    }
                    if (!exist) {
                        sub_buff.Rows.push(buff_item);
                    }
                }
                // 删除的BUFF
                for (let buff_id of buff_editor.del_id_array) {
                    let table_name = BuffEditor.GetBlkNameByBuffId(buff_id);
                    if (!sub_path.endsWith(table_name)) {
                        continue;
                    }
                    for (let j = 0; j < sub_buff.Rows.length; ++ j) {
                        if (sub_buff.Rows[j].StatusID == buff_id) {
                            sub_buff.Rows.splice(j, 1);
                            --j;
                            break;
                        }
                    }
                }

                // 分表保存
                sub_blkdata.blk.data.bytes.SetPosition(0);
                KFDJson.write_value(sub_blkdata.blk.data.bytes, sub_buff);
                sub_blkdata.blk.data.bytes.SetPosition(0);
                context.__SaveBlk(sub_blkdata, null, true, false);
            }while (0);

            // 清空修改信息
            if (sub_table_save_cnt >= sub_table_path_set.size) {
                buff_editor.del_id_array.length = 0;
                buff_editor.modify_buff_item_array.length = 0;
            }

        }, true);
    }
}

BuffEditor.SaveSub = function (context, sub_blkdata) {
    let p = sub_blkdata.path;
    let ret = p.search(/SSInfo/);
    if (ret == -1) return;
    let all_table_path = p.substr(0, ret) + "SpecialStatusInfos.blk";
    let all_context = context;
    all_context.LoadBlk(all_table_path, function (ret, all_blkdata, all_blkpath) {
            if (!ret || !all_blkdata || !all_blkdata.blk || !all_blkdata.blk.data) return;
            let all_buff = KFDJson.read_value(all_blkdata.blk.data.bytes, false);
            if (!all_buff) return;

            let all_table_change = false;
            let is_role_common_table = p.endsWith("RoleCommon.blk");
            let is_level_common_table = p.endsWith("LevelCommon.blk");

            // 全表删除不存在的ID
            for (var i = 0; i < all_buff.Rows.length; i++) {
                // 是分表范围内的ID
                let status_id = all_buff.Rows[i].StatusID;
                let is_sub_buff = false;
                if (status_id >= this.role_common_min_id && status_id <= this.role_common_max_id && is_role_common_table) {
                    is_sub_buff = true;
                }
                else if (status_id >= this.level_common_min_id && status_id <= this.level_common_max_id && is_level_common_table) {
                    is_sub_buff = true;
                }
                else {
                    let sub_table_id = parseInt(status_id / 10000);
                    let sub_table_name = sub_table_id.toString() + ".blk";
                    if (sub_table_id > 10000 && p.endsWith(sub_table_name)) {
                        is_sub_buff = true;
                    }
                }
                // 不是分表的BUFFID
                if (!is_sub_buff) continue;
                let exist = false;
                let sub_rows = sub_blkdata.blk.data.object.Rows;
                for (var j = 0; j < sub_rows.length; j++) {
                    let buff_item = sub_rows[j];
                    let sub_status_id = buff_item.StatusID;
                    if (sub_status_id == status_id) {
                        exist = true;
                        break;
                    }
                }
                // ID在分表不存在，总表删除
                if (!exist) {
                    all_buff.Rows.splice(i, 1);
                    i--;
                    all_table_change = true;
                }
            }

            // 全表增加新ID
            let sub_rows = sub_blkdata.blk.data.object.Rows;
            if (sub_rows) {
                for (var i = 0; i < sub_rows.length; i++) {
                    let exist = false;
                    let new_item = sub_rows[i];
                    for (var j = 0; j < all_buff.Rows.length; j++) {
                        if (new_item.StatusID == all_buff.Rows[j].StatusID) {
                            exist = true;
                            all_buff.Rows[j] = new_item;
                            break;
                        }
                    }
                    if (!exist) {
                        all_buff.Rows.push(new_item);
                    }
                    all_table_change = true;
                }
            }

            all_blkdata.blk.data.bytes.SetPosition(0);
            if (all_table_change) {
                KFDJson.write_value(all_blkdata.blk.data.bytes, all_buff);
                all_blkdata.blk.data.bytes.SetPosition(0);
                all_context.__SaveBlk(all_blkdata, null, true, false);
            }

            // 清空修改信息
            let buff_editor = _global.editor.blkattrib.buffEditor;
            buff_editor.del_id_array.length = 0;
            buff_editor.modify_buff_item_array.length = 0;

        }, true
    );
}

function SearchFiles(seachpath, pattern, endfunc){
    let allpaths = [];
    IKFFileIO_Type.instance.asyncGetFilePaths(allpaths, seachpath, false, pattern, function (ret, data, path) {
        if (path == "" && endfunc && ret) {
            endfunc(allpaths);
        }
    });
}

BuffEditor.CollapseRows = function (editor, uidata) {
    for (var i = 0; i < uidata.children.length; i++) {
        if (uidata.children[i].state == "open") {
            editor.tg.treegrid("collapse", uidata.children[i].id);
        }
        //uidata._parent.children[i].state = "closed";
    }
}

BuffEditor.SortRows = function (editor, uidata) {
    let sheet_name = editor.curData.data.object.__cls__;
    if (BuffEditor.IsBuffSheet(sheet_name)) {
        let buff_compare_func = function (left, right) {
            if (left.StatusID == right.StatusID) return 0;
            if (left.StatusID < right.StatusID) return -1;
            return 1;
        };
        editor.curData.data.object.Rows.sort(buff_compare_func);
    } else if (BuffEditor.IsEffectSheet(sheet_name)) {
        let effect_compare_func = function (left, right) {
            if (left.EffectId == right.EffectId) return 0;
            if (left.EffectId < right.EffectId) return -1;
            return 1;
        };
        editor.curData.data.object.Rows.sort(effect_compare_func);
    }
    editor.Edit(editor.curData, editor.curInprops);
    editor.tg.treegrid("expand", uidata.id);
}

BuffEditor.IsBuffSheet = function (sheet_name) {
    return sheet_name == "KF8SpecialStatusSheet";
}

BuffEditor.IsEffectSheet = function (sheet_name) {
    return sheet_name == "KF8SSEFSheet";
}

// BUFF总表、效果表只显示ID+名字
BuffEditor.OnlyShowBrief = function (blkpath) {
    if (blkpath) {
        let blk_array = ["SpecialStatusInfos.blk", "SSEFInfo.blk", "RoleCommon.blk", "LevelCommon.blk"];
        for (let blk_name of blk_array) {
            if (blkpath.endsWith(blk_name)) return true;
        }
    }
    return false;
}

// BUFF表额外功能
BuffEditor.RowsFormatter = function (editor, uidata) {
    if (uidata.name != "Rows") return '';
    let sheet_name = uidata._src.__cls__;
    if (!BuffEditor.IsBuffSheet(sheet_name) && !BuffEditor.IsEffectSheet(sheet_name)) return '';
    // BUFF总表、效果表显示排序
    let add_str = '';
    if (BuffEditor.OnlyShowBrief(editor.buffEditor.blkpath)) {
        add_str += '    ' + '<a href="#" onclick="KFDEditor.sortRows(event, KFDEditor.instance.' + editor.id + ',' + uidata.id + ',this, 99999)">排序</a>';
    } else {
        add_str += '    ' + '<a href="#" onclick="KFDEditor.collapseRows(event, KFDEditor.instance.' + editor.id + ',' + uidata.id + ',this, 99999)">折叠</a>';
    }
    add_str += '<span style="padding:20px;">'+ uidata.children.length.toString() +'</span>';
    return add_str;
}

// 通过buffid取buff表名字
BuffEditor.GetBlkNameByBuffId = function (buff_id) {
    if (buff_id >= 10000 && buff_id <= 899999) {
        return "RoleCommon.blk";
    }
    if (buff_id >= 900000 && buff_id <= 999999) {
        return  "LevelCommon.blk";
    }
    let sub_table_id = parseInt(buff_id / 10000);
    return (sub_table_id.toString() + ".blk");
}

// 根据效果类型取字体颜色和效果名称
BuffEditor.GetEffectFontColor = function (effect_type) {
    //kuiobj.name = '<span style="color:#b1bb96">'+ row_item.EffectId.toString() + '-' + row_item.Desc +'</span>';
    let font_color = 'color:#f78a0b';
    switch (effect_type) {
        case 1: // 改变整形属性值
        case 2: // 改变浮点形属性值
        case 6: // 改变字符串形属性值
            font_color = 'color:#65a3b8';
            break;
        case 4: // 执行脚本
            font_color = 'color:#b1bb96';
            break;
        case 5: // 播放特效
        case 8: // 修改材质
            font_color = 'color:#f78a0b';
            break;
        default:
            font_color = 'color:#fad988';
            break;
    }
    return font_color;
}

// 根据效果类型取名称
BuffEditor.GetEffectTypeName = function (effect_type) {
    const name_array = ["unknow", "改变整形属性值", "改变浮点形属性值", "修改技能CD", "执行脚本", "播放特效", "改变字符串形属性值", "体力自动恢复", "修改材质", "韧性自动恢复"];
    if (effect_type < 0 || effect_type >= name_array.length) {
        effect_type = 0;
    }
    return name_array[effect_type];
}

// BUFF表显示ID+BUFF名字
BuffEditor.SetShowName = function (kuiobj) {
    let sheet_name = kuiobj._parent._src.__cls__;
    let row_item = kuiobj.value;
    if (BuffEditor.IsBuffSheet(sheet_name)) {
        kuiobj.name = "undefine"
        //if (typeof(row_item.StatusID) != "undefined") {
        if (row_item.StatusID) {
            kuiobj.name = row_item.StatusID.toString() + '-' + row_item.Name;
        }
        kuiobj.uivalue = "#edit_delete"
    }
    else if (BuffEditor.IsEffectSheet(sheet_name)) {
        let effect_type = row_item.EffectType;
        let font_color = BuffEditor.GetEffectFontColor(effect_type);
        kuiobj.name = '<span style="' + font_color + '">' + 'undefine' +'</span>';
        //if (typeof(row_item.EffectId) != "undefined") {
        if (row_item.EffectId) {
            kuiobj.name = '<span style="' + font_color + '">' + row_item.EffectId.toString() + '-' + row_item.Desc +'</span>';
        }
        kuiobj.uivalue = "#edit_delete"
    }
}

// 效果表每一行增加类型名称
BuffEditor.FormatRowItem = function (uidata) {
    let effect_type = uidata.value.EffectType;
    if (!effect_type) {
        return '';
    }
    let font_color = BuffEditor.GetEffectFontColor(effect_type);
    let name_str = BuffEditor.GetEffectTypeName(effect_type);
    return '<span style="' + font_color + ';padding:100px;">' + name_str  +'</span>';
    //return '<span style="color:#b1bb96;padding:100px;">'+ name_str +'</span>';
}

// BUFF文本框改变事件
// let ontextchanged_str = "";
// let ontextchanged_method = '"KFDEditor.textboxTextChange(KFDEditor.instance.'
//     + editor.id
//     + ',' + uidata.id
//     + ', this,'
//     + castfunc + ')"';
// if (uidata._src.data)
// {
//     let sheet_name = uidata._src.data.object.__cls__;
//     if (sheet_name == "KF8SpecialStatusSheet" || sheet_name == "KF8SSEFSheet")
//     {
//         ontextchanged_str = ' onChange=' + ontextchanged_method;
//     }
// }
// else if (uidata._src.__cls__ == "KF8SpecialStatusInfo")
// {
//     ontextchanged_str = ' onChange=' + ontextchanged_method;
// }