function ScriptDescParser() {
}

ScriptDescParser.Parse = function (_statement, _blk_data, _limitLen, _params) {
    _statement.MatchSpecChar('%');
    let left_stack = new Array();
    for (let i = 0; i < _statement.state_str.length; i++) {
        let char = _statement.state_str[i];
        if (char == '[') {
            left_stack.push(i);
        } else if (char == ']') {
            if (left_stack.length > 0) {
                let begin_index = left_stack[left_stack.length - 1];
                let end_index = i;
                let sub_result = ScriptDescParser.Parse_Internal(
                    new Statement(_statement.begin_index + begin_index, end_index, _statement.state_str.substr(begin_index + 1, end_index - begin_index - 1)), _blk_data, _params);
                left_stack.pop();
                if (sub_result == undefined) continue;
                _statement.Replace(begin_index, end_index, sub_result.state_str);
                i = begin_index;
            } else {
                return undefined;
            }
        }
    }
    if (_limitLen != undefined && _limitLen > 0 && _statement.state_str.length > _limitLen) {
        _statement.state_str = _statement.state_str.substr(0, 80) + "......";
    }
    return _statement;

}

ScriptDescParser.Parse_Internal = function (_statement, _blk_data, _params) {
    let func_get_first_second = function (_statement, _index) {
        let last = new Statement(0, _index - 1, _statement.state_str.substr(0, _index));
        let next = new Statement(_index + 1, _statement.state_str.length - _index,
            _statement.state_str.substr(_index + 1, _statement.state_str.length - _index - 1));

        let first = undefined;
        let second = undefined;
        if (last != undefined && next != undefined && last.state_str.length > 0 && next.state_str.length > 0) {
            if (last.state_str == 'true' || last.state_str == 'false') {
                first = ScriptDescParser.GetBoolValue(last, _blk_data);
            } else //if (_blk_data.hasOwnProperty(last.state_str) || _blk_data[last.state_str] != undefined) {
            {
                first = ScriptDescParser.GetObjValue(last, _blk_data);
            }
            if (next.state_str == 'true' || next.state_str == 'false') {
                second = ScriptDescParser.GetBoolValue(next, _blk_data);
            } else //if (_blk_data.hasOwnProperty(next.state_str) || _blk_data[next.state_str] != undefined) {
            {
                second = ScriptDescParser.GetObjValue(next, _blk_data);
            }
        }
        return {'first': first, 'second': second};
    };

    let func_get_result = function (_statement, _index1, _index2) {
        let last = new Statement(0, _index1 - 1, _statement.state_str.substr(0, _index1));
        let next1 = new Statement(_index1 + 1, _index2 - 1,
            _statement.state_str.substr(_index1 + 1, _index2 - 1 - _index1));
        let next2 = new Statement(_index2 + 1, _statement.state_str.length - _index2,
            _statement.state_str.substr(_index2 + 1, _statement.state_str.length - _index2 - 1));
        if (last != undefined && next1 != undefined && next2 != undefined && last.state_str.length > 0 && next1.state_str.length > 0 && next2.state_str.length > 0) {
            if (last.state_str == 'true') {
                if (next1.state_str[0] == '#') {
                    let param = next1.state_str.substr(1, next1.state_str.length - 1);
                    if (param != undefined) {
                        return ScriptDescParser.GetObjPropValue(_blk_data, param);
                    }
                }
                return next1.state_str;
            } else if (last.state_str == 'false') {
                if (next2.state_str[0] == '#') {
                    let param = next2.state_str.substr(1, next2.state_str.length - 1);
                    if (param != undefined) {
                        return ScriptDescParser.GetObjPropValue(_blk_data, param);
                    }
                }
                return next2.state_str;
            }
        }
    };
    if (_statement.IsHtml())
        return _statement;
    if (_statement.state_str.indexOf('?') != -1 || _statement.state_str.indexOf(':') != -1) {
        let index1 = _statement.state_str.indexOf('?');
        let index2 = _statement.state_str.indexOf(':');
        if (index1 > 0 || index2 > 0) {
            let result = func_get_result(_statement, index1, index2);
            if (result == undefined) return undefined;
            _statement.state_str = result.toString();
        }
    } else if (_statement.state_str.indexOf('&') != -1) {
        let index = _statement.state_str.indexOf('&');
        if (index > 0) {
            let result = func_get_first_second(_statement, index);
            if (result == undefined) return undefined;
            _statement.state_str = result.first == true && result.second == true || result.first == result.second ? 'true' : 'false';
        }
    } else if (_statement.state_str.indexOf('|') != -1) {
        let index = _statement.state_str.indexOf('|');
        if (index > 0) {
            let result = func_get_first_second(_statement, index);
            if (result == undefined) return undefined;
            _statement.state_str = (result.first == true || result.second == true) ? 'true' : 'false';
        }
    } else if (_statement.state_str.indexOf('=') != -1) {
        let index = _statement.state_str.indexOf('=');
        if (index > 0) {
            let result = func_get_first_second(_statement, index);
            if (result == undefined) return undefined;
            _statement.state_str = (result.first == result.second) ? 'true' : 'false';
        }
    } else if (_statement.state_str.indexOf('!') != -1) {
        let index = _statement.state_str.indexOf('!');
        if (index > 0) {
            let result = func_get_first_second(_statement, index);
            if (result == undefined) return undefined;
            _statement.state_str = (result.first != result.second) ? 'true' : 'false';
        }

    } else if (_statement.state_str.indexOf('#') != -1) {
        let index = _statement.state_str.indexOf('#');
        if (index >= 0) {
            let result = _statement.state_str.substr(index + 1, _statement.state_str.length - index - 1);
            if (result != undefined && result.length > 0) {
                _statement.state_str = ScriptDescParser.GetObjPropValue(_blk_data, result);
            }
        }
    } else if (_statement.state_str.indexOf('-') != -1) {
        let index = _statement.state_str.indexOf('-');
        if (index >= 0) {
            let result = _statement.state_str.substr(index + 1, _statement.state_str.length - index - 1);
            if (result != undefined && result.length > 0) {
                _statement.state_str = _params.hasOwnProperty(result) || _params[result] != undefined ? _params[result] : undefined;
            }
        }
    }

    if (_statement.state_str == undefined || _statement.state_str.length <= 0) {
        _statement.state_str = '<font color="red">' + "empty" + '</font>';
    }
    return _statement;
}

ScriptDescParser.GetObjDesc = function (obj_data, cls_type) {
    if (obj_data == undefined) return undefined;
    if (cls_type == undefined) {
        cls_type = (obj_data.hasOwnProperty('__cls__') || obj_data['__cls__'] != undefined) ? obj_data['__cls__'] : undefined;
        if (cls_type == undefined) return undefined;
    }
    if (cls_type != undefined && KFDEditor.FDEditorWindow != undefined) {
        let cls_desc = KFDEditor.FDEditorWindow.GetClsObjDesc(cls_type, cls_type);
        if (cls_desc != undefined && cls_desc.length > 0) {
            let result = ScriptDescParser.Parse(new Statement(0, cls_desc.length, cls_desc), obj_data);
            return result != undefined ? result.state_str : cls_desc;
        } else {
            return '{Obj:+' + cls_type + '}';
        }
    }
    return "{Object}"
}

ScriptDescParser.GetObjPropValue = function (obj_data, key_name) {
    let result_value = undefined;
    let value_data = undefined;
    let prop_data = undefined;
    if (obj_data.hasOwnProperty('__cls__')) {
        let all_props = KFDEditor.FDEditorWindow._GetAllKFDProperty(obj_data.__cls__);
        if (all_props != undefined)
            for (let i = 0; i < all_props.length; i++) {
                if (all_props[i].name == key_name) {
                    prop_data = all_props[i];
                    break;
                }
            }
    }
    value_data = obj_data.hasOwnProperty(key_name) || obj_data[key_name] != undefined
        ? obj_data[key_name]
        : (prop_data != undefined ? prop_data.default : undefined);

    if (value_data != undefined) {
        ///判断该值是否为kfname
        if((prop_data.hasOwnProperty('type') || prop_data['type'] != undefined) && prop_data['type'] == 'kfname')
            result_value = value_data.toString();
        ///判断该值是否被定义为枚举类型，并加以翻译
        else if (prop_data.hasOwnProperty('enum') || prop_data['enum'] != undefined) {
            let enum_props = KFDEditor.FDEditorWindow._GetAllKFDProperty(prop_data['enum']);
            if (enum_props != undefined && enum_props.length > 0) {
                value_data = Number(value_data);
                if (isNaN(value_data))
                    value_data = Number(enum_props[0].default);
                for (let i = 0; i < enum_props.length; i++) {
                    if (value_data == Number(enum_props[i].default)) {
                        value_data = (enum_props[i].hasOwnProperty('cname') || enum_props[i]['cname'] != undefined) ? enum_props[i]['cname'] : enum_props[i]['name'];
                        break;
                    }
                }
            }
        } else if (value_data instanceof Array) {
            let str = '{';
            for (let i = 0; i < value_data.length; i++) {
                let element = value_data[i];
                let color_str = i % 2 == 0 ? "#454545" : "#636262";
                if (element instanceof Object) {
                    str += '<font style="background-color:' + color_str + '; color:white">' + ScriptDescParser.GetObjDesc(element, prop_data != undefined ? prop_data.otype : undefined) + '</font>';
                } else {
                    str += '<font style="background-color:' + color_str + '; color:white">' + element.toString() + '</font>';
                }
                if (i != value_data.length - 1)
                    str += "; "; //<br>
            }
            result_value = str + '}';
        } else if (value_data instanceof Object) {
            result_value = ScriptDescParser.GetObjDesc(value_data, value_data["__cls__"]);
        }
        if (result_value == undefined && value_data != undefined)
            result_value = value_data.toString();
        // 音频脚本显示bug补丁
        if (result_value == "" && value_data != undefined && value_data.event && value_data.event.value)
            result_value = value_data.event.value.toString();
    }
    return result_value;
}

ScriptDescParser.IsNotEndChar = function (_char) {
    if (char == '&' || char == '|' || char == '=' || char == '!' || char == ':' || char == '?') {
        return true;
    }
    return false;
}

ScriptDescParser.IsStatementChar = function (_char) {
    if (char == '&' || char == '|' || char == '=' || char == '!' || char == ':' || char == '?' || char == 'true' || char == 'false') {
        return true;
    }
    return false;
}

ScriptDescParser.GetLastStatement = function (_ary, _cur_index) {
    if (_cur_index <= 0 || _cur_index >= _ary.length || _ary[_cur_index].state_str.length <= 0) {
        return undefined;
    }
    return _ary[_cur_index - 1];
}

ScriptDescParser.GetNextStatement = function (_ary, _cur_index) {
    if (_cur_index < 0 || _cur_index >= _ary.length - 1 || _ary[_cur_index].state_str.length <= 0) {
        return undefined;
    }
    return _ary[_cur_index + 1];
}

ScriptDescParser.GetBoolValue = function (_statement, _blk_data) {
    let result = false;
    if (_statement.state_str.length <= 0) return result;
    if (_statement.state_str.indexOf('#') == 0 && _blk_data != undefined) {
        let key_name = _statement.state_str.substr(1, _statement.state_str.length - 1);
        if (key_name.length > 0) {
            let value = ScriptDescParser.GetObjPropValue(_blk_data, key_name);
            result = value == true || value.length > 0;
        }
    } else {
        result = _statement.state_str == 'true' ? true : false;
    }
    return result;
}

ScriptDescParser.GetObjValue = function (_statement, _blk_data) {
    let result = undefined;
    if (_statement.state_str.indexOf('#') == 0 && _blk_data != undefined) {
        let key_name = _statement.state_str.substr(1, _statement.state_str.length - 1);
        if (key_name.length > 0) {
            result = ScriptDescParser.GetObjPropValue(_blk_data, key_name);
        }
    } else {
        result = _statement.state_str;
    }
    return result;
}

function Statement(_b_index, _e_index, _state_str) {
    this.begin_index = _b_index;
    this.end_index = _e_index;
    this.state_str = _state_str.trim();
}

Statement.prototype.Replace = function (_b_index, _e_index, _replace) {
    if (this.state_str != undefined && this.state_str.length > 0) {
        let substr = this.state_str.substr(_b_index, _e_index - _b_index + 1);
        this.state_str = this.state_str.replace(substr, _replace);
    }
}

Statement.prototype.MatchSpecChar = function (_char) {
    if (this.state_str != undefined && this.state_str.length > 0) {
        let _index = 0;
        do {
            _index = this.state_str.indexOf(_char, _index);
            if (_index == -1) break;
            let sub_str = this.state_str.substr(_index, 3);
            if (sub_str == '%44') {
                this.state_str = this.state_str.replace(sub_str, ',');
            } else if (sub_str == '%40') {
                this.state_str = this.state_str.replace(sub_str, '(');
            } else if (sub_str == '%41') {
                this.state_str = this.state_str.replace(sub_str, ')');
            }
            _index++;
        } while (_index != -1);
    }
}

Statement.prototype.IsHtml = function () {
    return this.state_str[0] == '<' && this.state_str[this.state_str.length - 1] == '>';
}