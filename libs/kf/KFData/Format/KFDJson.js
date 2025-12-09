// noinspection JSUnresolvedVariable

define(["require", "exports", "../Utils/FKByteArray", "./KFD", "./KFDTable", "./KFDName", "./KFBytes", "../../Core/Log/KFLog"],
    function (require, exports, FKByteArray_1, KFD_1, KFDTable_1, KFDName_1, KFBytes_1, KFLog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let KFDJson = /** @class */ (function () {
        function KFDJson() {
        }
        KFDJson._read_base_value = function (bytearr, valtype, skip, value, typename) {
            if (skip === void 0) { skip = false; }
            if (value === void 0) { value = null; }
            if (typename === void 0) { typename = ""; }
            let retval = value;
            switch (valtype) {
                case KFD_1.KFDataType.OT_INT8:
                    if (skip)
                        bytearr.Skip(1);
                    else
                        retval = bytearr.readByte();
                    break;
                case KFD_1.KFDataType.OT_UINT8:
                    if (skip)
                        bytearr.Skip(1);
                    else
                        retval = bytearr.readUnsignedByte();
                    break;
                case KFD_1.KFDataType.OT_INT16:
                    if (skip)
                        bytearr.Skip(2);
                    else
                        retval = bytearr.readShort();
                    break;
                case KFD_1.KFDataType.OT_UINT16:
                    if (skip)
                        bytearr.Skip(2);
                    else
                        retval = bytearr.readUnsignedShort();
                    break;
                case KFD_1.KFDataType.OT_INT32:
                    if (skip)
                        bytearr.Skip(4);
                    else
                        retval = bytearr.readInt();
                    break;
                case KFD_1.KFDataType.OT_UINT32:
                    if (skip)
                        bytearr.Skip(4);
                    else
                        retval = bytearr.readUnsignedInt();
                    break;
                case KFD_1.KFDataType.OT_FLOAT:
                    if (skip)
                        bytearr.Skip(4);
                    else
                        retval = bytearr.readFloat();
                    break;
                case KFD_1.KFDataType.OT_DOUBLE:
                    if (skip)
                        bytearr.Skip(8);
                    else
                        retval = bytearr.readDouble();
                    break;
                case KFD_1.KFDataType.OT_STRING:
                    if (skip) {
                        bytearr.skipstring();
                    } else {
                        retval = bytearr.readstring();
                        if (typename === "kfname") {
                            retval = new KFDName_1.KFDName(retval);
                        }
                    }
                    break;
                case KFD_1.KFDataType.OT_BYTES:
                    if (skip) {
                        bytearr.skipstring();
                    } else {
                        ///js时的字节全部转化成对象字节
                        if (!retval) {
                            retval = new KFBytes_1.KFBytes();
                            retval.bytes = new FKByteArray_1.KFByteArray();
                        }
                        else {
                            retval.bytes.length = 0;
                        }
                        bytearr.readkfbytes(retval.bytes);
                    }
                    break;
                case KFD_1.KFDataType.OT_BOOL:
                    if (skip)
                        bytearr.Skip(1);
                    else
                        retval = bytearr.readBoolean();
                    break;
                case KFD_1.KFDataType.OT_VARINT: {
                        if (skip) {
                            bytearr.readvarint64();
                        } else {
                            retval = bytearr.readvarint64();
                            if (KFD_1.KFDataType.GetTypeID(typename) !== KFD_1.KFDataType.OT_INT64) {
                                retval = Number(retval);
                            }
                        }
                    }
                    break;
                case KFD_1.KFDataType.OT_VARUINT: {
                        if (skip) {
                            bytearr.readvaruint64();
                        } else {
                            retval = bytearr.readvaruint64();
                            if (KFD_1.KFDataType.GetTypeID(typename) !== KFD_1.KFDataType.OT_UINT64) {
                                retval = Number(retval);
                            }
                        }
                    }
                    break;
                case KFD_1.KFDataType.OT_INT64:
                    if (skip) {
                        bytearr.Skip(8);
                    } else {
                        retval = bytearr.readInt64();
                    }
                    break;
                case KFD_1.KFDataType.OT_UINT64:
                    if (skip) {
                        bytearr.Skip(8);
                    } else {
                        retval = bytearr.readUInt64();
                    }
                    break;
                case KFD_1.KFDataType.OT_UNKNOW:
                default:
                    break;
            }
            return retval;
        };
        KFDJson.init_object = function (data, kfddata) {
            if (kfddata) {
                ///构造函数
                if (data == null) {
                    if (kfddata.__new__) {
                        data = kfddata.__new__();
                        if (data == null) {
                            data = {};
                            KFLog_1.LOG_ERROR("{0} NEW INSTANCE IS NULL", kfddata.class);
                        }
                    } else {
                        data = {};
                    }
                }
                let initparam = kfddata.__init__;
                if (initparam) {
                    initparam.func.call(initparam.thisobj, data, kfddata, KFDTable_1.KFDTable.kfdTB);
                }
            }
            return data;
        };
        KFDJson._read_object_value = function (bytearr, valtype, kfddata, skip, val) {
            if (kfddata === void 0) { kfddata = null; }
            if (skip === void 0) { skip = false; }
            if (val === void 0) { val = null; }
            let retval = val;
            if (skip) {
                let deep = 0;
                while (true) {
                    let pid = bytearr.readvaruint();
                    if (pid === KFD_1.KFDataType.OBJ_PROP_ID_BEGIN) {
                        deep += 1;
                    } else if (pid === KFD_1.KFDataType.OBJ_PROP_ID_END) {
                        deep -= 1;
                        if (deep <= 0)
                            break;
                    } else {
                        KFDJson.read_value(bytearr, true);
                    }
                }
            }
            else {
                let deep = 0;
                let obj = (val != null ? val : null);
                if (obj == null) {
                    ///如果提共了实初化函数则调用初始化
                    obj = KFDJson.init_object(obj, kfddata);
                }
                let currKFDData = kfddata;
                let stack = [];
                while (true) {
                    let pid = bytearr.readvaruint();
                    if (pid === KFD_1.KFDataType.OBJ_PROP_ID_BEGIN) {
                        if (deep !== 0) {
                            let child = KFDTable_1.KFDTable.find_extend_kfddata(currKFDData);
                            stack.push(currKFDData);
                            currKFDData = child;
                        }
                        deep += 1;
                    } else if (pid === KFD_1.KFDataType.OBJ_PROP_ID_END) {
                        deep -= 1;
                        if (deep <= 0)
                            break;
                        else
                            currKFDData = stack.pop();
                    } else {
                        let pinfo = KFDTable_1.KFDTable.find_prop_info(currKFDData, pid);
                        if (pinfo != null) {
                            let read = pinfo.read;
                            let readfunc = obj[read];
                            if (readfunc) {
                                let vtype = bytearr.readByte();
                                if (vtype === KFD_1.KFDataType.OT_BYTES) {
                                    let bytesize = bytearr.readvaruint();
                                    let opos = bytearr.GetPosition();
                                    readfunc.call(obj, bytearr, bytesize);
                                    bytearr.SetPosition(opos + bytesize);
                                } else {
                                    bytearr.Skip(-1);
                                    KFDJson.read_value(bytearr, true);
                                }
                            } else {
                                let pname = pinfo["name"];
                                let propobj = obj[pname];
                                let retval_1 = KFDJson.read_value(bytearr, false, propobj, pinfo);
                                obj[pname] = retval_1;
                                let rcall = pinfo.call;
                                if (rcall) {
                                    let callfunc = obj[rcall];
                                    if (callfunc) {
                                        callfunc.call(obj, retval_1);
                                    }
                                }
                            }
                        } else {
                            KFDJson.read_value(bytearr, true);
                        }
                    }
                }
                retval = obj;
            }
            return retval;
        };
        KFDJson._read_array_value = function (bytearr, valtype, skip, val, propinfo) {
            if (skip === void 0) { skip = false; }
            if (val === void 0) { val = null; }
            if (propinfo === void 0) { propinfo = null; }
            let retval = val;
            if (valtype === KFD_1.KFDataType.OT_ARRAY) {
                let size = bytearr.readvaruint();
                let otype = bytearr.readUnsignedByte();
                if (KFD_1.KFDataType.Is_UnknowOrBaseType(otype)) {
                    if (skip) {
                        while (size > 0) {
                            KFDJson._read_base_value(bytearr, otype, true);
                            size -= 1;
                        }
                    } else {
                        let typename = "";
                        if (propinfo)
                            typename = propinfo.otype;
                        if (retval == null)
                            retval = [];
                        else
                            retval.length = 0;
                        while (size > 0) {
                            retval.push(KFDJson._read_base_value(bytearr, otype, false, null, typename));
                            size -= 1;
                        }
                    }
                } else {
                    if (otype === KFD_1.KFDataType.OT_ARRAY || otype === KFD_1.KFDataType.OT_MIXARRAY) {
                        if (skip) {
                            while (size > 0) {
                                KFDJson._read_array_value(bytearr, otype, true);
                                size -= 1;
                            }
                        } else {
                            if (retval == null) {
                                //全新的读取
                                let arrobj = [];
                                while (size > 0) {
                                    arrobj.push(KFDJson._read_array_value(bytearr, otype));
                                    size -= 1;
                                }
                                retval = arrobj;
                            } else {
                                ///更新读取
                                retval.length = size;
                                for (let i = 0; i < size; i++) {
                                    let itval = retval[i];
                                    if (itval) {
                                        KFDJson._read_array_value(bytearr, otype, false, itval);
                                    } else {
                                        retval[i] = KFDJson._read_array_value(bytearr, otype);
                                    }
                                }
                            }
                        }
                    } else if (otype === KFD_1.KFDataType.OT_OBJECT || otype === KFD_1.KFDataType.OT_MIXOBJECT) {
                        if (skip) {
                            while (size > 0) {
                                KFDJson._read_object_value(bytearr, otype, null, true);
                                size -= 1;
                            }
                        } else {
                            let kfddata = null;
                            if (otype === KFD_1.KFDataType.OT_OBJECT && propinfo) {
                                kfddata = KFDTable_1.KFDTable.kfdTB.get_kfddata(propinfo["otype"]);
                            }
                            if (retval == null) {
                                let objarr = [];
                                while (size > 0) {
                                    objarr.push(KFDJson._read_object_value(bytearr, otype, kfddata));
                                    size -= 1;
                                }
                                retval = objarr;
                            } else {
                                retval.length = size;
                                for (let i = 0; i < size; i++) {
                                    let itmval = retval[i];
                                    if (itmval) {
                                        KFDJson._read_object_value(bytearr, otype, kfddata, false, itmval);
                                    } else {
                                        retval[i] = KFDJson._read_object_value(bytearr, otype, kfddata);
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (valtype === KFD_1.KFDataType.OT_MIXARRAY) {
                let size = bytearr.readvaruint();
                if (skip) {
                    while (size > 0) {
                        KFDJson.read_value(bytearr, true);
                        size -= 1;
                    }
                } else {
                    if (retval == null) {
                        let arrobj = [];
                        while (size > 0) {
                            arrobj.push(KFDJson.read_value(bytearr, false));
                            size -= 1;
                        }
                        retval = arrobj;
                    } else {
                        retval.length = size;
                        for (let i = 0; i < size; i++) {
                            let itmval = retval[i];
                            if (itmval) {
                                KFDJson.read_value(bytearr, false, itmval);
                            } else {
                                retval[i] = KFDJson.read_value(bytearr, false);
                            }
                        }
                    }
                }
            }
            return retval;
        };
        KFDJson.read_value = function (bytearr, skip, jsonobj, propinfo) {
            if (skip === void 0) { skip = false; }
            if (jsonobj === void 0) { jsonobj = null; }
            if (propinfo === void 0) { propinfo = null; }
            let retval = jsonobj;
            let size = bytearr.bytesAvailable;
            if (size > 0) {
                let valueType = bytearr.readUnsignedByte();
                if (KFD_1.KFDataType.Is_UnknowOrBaseType(valueType)) {
                    ///支持下NULL空对象
                    if (valueType === KFD_1.KFDataType.OT_NULL) {
                        retval = null;
                    } else {
                        let typename = "";
                        if (propinfo) {
                            typename = propinfo.type;
                        }
                        retval = KFDJson._read_base_value(bytearr, valueType, skip, jsonobj, typename);
                    }
                } else {
                    if (valueType === KFD_1.KFDataType.OT_ARRAY || valueType === KFD_1.KFDataType.OT_MIXARRAY) {
                        retval = KFDJson._read_array_value(bytearr, valueType, skip, jsonobj, propinfo);
                    } else if (valueType === KFD_1.KFDataType.OT_OBJECT) {
                        let kfddata = null;
                        if (propinfo != null)
                            kfddata = KFDTable_1.KFDTable.kfdTB.get_kfddata(propinfo["otype"]);
                        retval = KFDJson._read_object_value(bytearr, valueType, kfddata, skip, jsonobj);
                    } else if (valueType === KFD_1.KFDataType.OT_MIXOBJECT) {
                        let classid = bytearr.readvaruint();
                        let classname = null;
                        if (classid === 1) {
                            classname = bytearr.readstring();
                        }
                        let kfddata = null;
                        if (classname)
                            kfddata = KFDTable_1.KFDTable.kfdTB.get_kfddata(classname);
                        retval = KFDJson._read_object_value(bytearr, valueType, kfddata, skip, jsonobj);
                        //设置类名吧MIX对象
                        if (retval && kfddata) {
                            retval["__cls__"] = kfddata["class"];
                        }
                    }
                }
            }
            return retval;
        };
        KFDJson.write_value = function (bytearr, jsonobj, propinfo, attribFlags) {
            if (propinfo === void 0) { propinfo = null; }
            if (attribFlags === void 0) { attribFlags = null; }
            if (jsonobj != null) {
                let valueType = KFD_1.KFDataType.OT_NULL;
                let kfddata = null;
                if (propinfo) {
                    valueType = KFD_1.KFDataType.GetTypeID(propinfo["type"]);
                    if (valueType === KFD_1.KFDataType.OT_MIXOBJECT) {
                        ///从对象是MIXOBJECT则是从对角属性中获取
                        kfddata = KFDTable_1.KFDTable.kfdTB.get_kfddata(jsonobj["__cls__"]);
                    }
                } else if (jsonobj && jsonobj["__cls__"]) {
                    ///此处有问题如果获取到属性应该用已经获取到的类型
                    ///不应该用__cls__来绑架类型
                    kfddata = KFDTable_1.KFDTable.kfdTB.get_kfddata(jsonobj["__cls__"]);
                    valueType = KFD_1.KFDataType.OT_MIXOBJECT;
                }
                bytearr.writeByte(valueType);
                if (valueType === KFD_1.KFDataType.OT_NULL) {
                    // do nothing
                } else if (KFD_1.KFDataType.Is_UnknowOrBaseType(valueType)) {
                    KFDJson._write_base_value(bytearr, valueType, jsonobj);
                } else {
                    if (valueType === KFD_1.KFDataType.OT_ARRAY || valueType === KFD_1.KFDataType.OT_MIXARRAY) {
                        KFDJson._write_array_value(bytearr, valueType, jsonobj, propinfo, attribFlags);
                    } else if (valueType === KFD_1.KFDataType.OT_OBJECT) {
                        kfddata = KFDTable_1.KFDTable.kfdTB.get_kfddata(propinfo["otype"]);
                        KFDJson._write_object_value(bytearr, valueType, jsonobj, kfddata, attribFlags);
                    } else if (valueType === KFD_1.KFDataType.OT_MIXOBJECT) {
                        if (kfddata) {
                            bytearr.writevaruint(1);
                            bytearr.writestring(kfddata["class"]);
                        } else {
                            bytearr.writevaruint(0);
                        }
                        KFDJson._write_object_value(bytearr, valueType, jsonobj, kfddata, attribFlags);
                    }
                }
            } else {
                bytearr.writeByte(KFD_1.KFDataType.OT_NULL);
            }
        };
        KFDJson._write_base_value = function (bytearr, dataType, valObject) {
            if (dataType === KFD_1.KFDataType.OT_UNKNOW)
                return;
            switch (dataType) {
                case KFD_1.KFDataType.OT_INT8:
                case KFD_1.KFDataType.OT_UINT8:
                    bytearr.writeByte(valObject);
                    break;
                case KFD_1.KFDataType.OT_INT16:
                    bytearr.writeShort(valObject);
                    break;
                case KFD_1.KFDataType.OT_UINT16:
                    bytearr.writeUnsignedShort(valObject);
                    break;
                case KFD_1.KFDataType.OT_INT32:
                    bytearr.writeInt(valObject);
                    break;
                case KFD_1.KFDataType.OT_UINT32:
                    bytearr.writeUnsignedInt(valObject);
                    break;
                case KFD_1.KFDataType.OT_INT64:
                    bytearr.writeInt64(valObject);
                    break;
                case KFD_1.KFDataType.OT_UINT64:
                    bytearr.writeUInt64(valObject);
                    break;
                case KFD_1.KFDataType.OT_FLOAT:
                    bytearr.writeFloat(valObject);
                    break;
                case KFD_1.KFDataType.OT_DOUBLE:
                    bytearr.writeDouble(valObject);
                    break;
                case KFD_1.KFDataType.OT_STRING:
                    ///类型判定
                    if (valObject instanceof KFDName_1.KFDName) {
                        valObject = valObject.toString();
                    }
                    bytearr.writestring(valObject);
                    break;
                case KFD_1.KFDataType.OT_BYTES:
                    if (valObject instanceof KFBytes_1.KFBytes || valObject.bytes) {
                        let bytesobj = valObject.object;
                        let bytes = valObject.bytes;
                        if (bytesobj) {
                            if (bytes == null) {
                                bytes = new FKByteArray_1.KFByteArray();
                                valObject.bytes = bytes;
                            }
                            bytes.length = 0;
                            ///尝试自定义的写
                            let write = bytesobj.write;
                            if (write) {
                                write.call(bytesobj, bytes);
                            } else {
                                KFDJson.write_value(bytes, bytesobj);
                            }
                            bytearr.writekfBytes(bytes);
                        }
                        else if (bytes == null) {
                            bytearr.writestring("");
                        } else {
                            //直接写入二进制吧
                            bytearr.writekfBytes(bytes);
                        }
                    } else {
                        bytearr.writestring("");
                    }
                    ///=============
                    break;
                case KFD_1.KFDataType.OT_BOOL:
                    bytearr.writeBoolean(valObject);
                    break;
                case KFD_1.KFDataType.OT_VARINT:
                    bytearr.writevarint(valObject);
                    break;
                case KFD_1.KFDataType.OT_VARUINT:
                    bytearr.writevaruint(valObject);
                    break;
            }
        };
        KFDJson._write_array_value = function (bytearr, valtype, val, propinfo, attribFlags) {
            if (attribFlags === void 0) { attribFlags = null; }
            let arrval = val;
            let arrsize = arrval.length;
            let oType = 0;
            let kfddata = null;
            if (propinfo && propinfo["otype"]) {
                let otypestr = propinfo["otype"];
                oType = KFD_1.KFDataType.GetTypeID(otypestr);
                if (oType === 0) {
                    kfddata = KFDTable_1.KFDTable.kfdTB.get_kfddata(otypestr);
                    if (kfddata) {
                        if (valtype === KFD_1.KFDataType.OT_ARRAY)
                            oType = KFD_1.KFDataType.OT_OBJECT;
                        else
                            oType = KFD_1.KFDataType.OT_MIXOBJECT;
                    }
                }
            }
            if (valtype === KFD_1.KFDataType.OT_ARRAY) {
                if (oType !== 0 && KFD_1.KFDataType.Is_UnknowOrBaseType(oType)) {
                    bytearr.writevaruint(arrsize);
                    bytearr.writeByte(oType);
                    for (let i = 0; i < arrsize; i++) {
                        let item = arrval[i];
                        KFDJson._write_base_value(bytearr, oType, item);
                    }
                } else {
                    if (oType === 0 || oType === KFD_1.KFDataType.OT_ARRAY || oType === KFD_1.KFDataType.OT_MIXARRAY) {
                        ///不支持
                        bytearr.writevaruint(0);
                        bytearr.writeByte(KFD_1.KFDataType.OT_NULL);
                    } else if (oType === KFD_1.KFDataType.OT_OBJECT || oType === KFD_1.KFDataType.OT_MIXOBJECT) {
                        bytearr.writevaruint(arrsize);
                        bytearr.writeByte(oType);
                        if (oType === KFD_1.KFDataType.OT_MIXOBJECT) { }
                        for (let i = 0; i < arrsize; i++) {
                            let item = arrval[i];
                            let attribFlag = attribFlags ? attribFlags._flags_[i] : null;
                            KFDJson._write_object_value(bytearr, oType, item, kfddata, attribFlag);
                        }
                    }
                }
            } else if (valtype === KFD_1.KFDataType.OT_MIXARRAY) {
                bytearr.writevaruint(arrsize);
                for (let i = 0; i < arrsize; i++) {
                    let item = arrval[i];
                    let attribFlag = attribFlags ? attribFlags._flags_[i] : null;
                    KFDJson.write_value(bytearr, item, null, attribFlag);
                }
            }
        };
        KFDJson._write_object_value = function (bytearr, dataType, objectval, kfddata, attribFlags) {
            if (attribFlags === void 0) { attribFlags = null; }
            bytearr.writevaruint(KFD_1.KFDataType.OBJ_PROP_ID_BEGIN);
            if (kfddata) {
                let extendcls = kfddata["extend"];
                if (extendcls) {
                    let extenddata = KFDTable_1.KFDTable.kfdTB.get_kfddata(extendcls);
                    if (extenddata != null) {
                        KFDJson._write_object_value(bytearr, dataType, objectval, extenddata, attribFlags);
                    }
                }
                let valarr = kfddata["propertys"];
                for (let _i = 0, valarr_1 = valarr; _i < valarr_1.length; _i++) {
                    let item = valarr_1[_i];
                    let pid = item["id"];
                    let name_1 = item["name"];
                    // 对于编辑器，都认为非网络环境，对于标记NET=only字段，不写入，跳过
                    if (item["net"] && (item["net"].toLowerCase() === "only")) {
                        continue;
                    }
                    let attribFlag = null;
                    if (attribFlags && !attribFlags._all_) {
                        //略过不需要写的属性
                        attribFlag = attribFlags[name_1];
                        if (!attribFlag || attribFlag._w_ === false) {
                            continue;
                        } else if (attribFlag._w_) {
                            //_w_可写
                            //已经写过就重置属性状态
                            attribFlag._w_ = false;
                        }
                    }
                    if (objectval.hasOwnProperty(name_1) &&
                        pid !== KFD_1.KFDataType.OBJ_PROP_ID_BEGIN &&
                        pid !== KFD_1.KFDataType.OBJ_PROP_ID_END) {
                        bytearr.writevaruint(pid);
                        let write = item.write;
                        let writefunc = objectval[write];
                        if (writefunc) {
                            KFDJson.ClearUseBuff.length = 0;
                            bytearr.writeByte(KFD_1.KFDataType.OT_BYTES);
                            writefunc.call(objectval, KFDJson.ClearUseBuff, attribFlag);
                            bytearr.writekfBytes(KFDJson.ClearUseBuff);
                        } else {
                            KFDJson.write_value(bytearr, objectval[name_1], item, attribFlag);
                        }
                    }
                }
            }
            bytearr.writevaruint(KFD_1.KFDataType.OBJ_PROP_ID_END);
        };
        KFDJson.ClearUseBuff = new FKByteArray_1.KFByteArray();
        return KFDJson;
    }());
    exports.KFDJson = KFDJson;
});