define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let KFDataType = /** @class */ (function () {
        function KFDataType() {
        }
        // 初始化
        KFDataType._Initialize = function () {
            if (KFDataType.Type_to_ids == null) {
                let Base_Type_ids = {};
                Base_Type_ids["int8"] = KFDataType.OT_INT8;
                Base_Type_ids["uint8"] = KFDataType.OT_UINT8;
                Base_Type_ids["int16"] = KFDataType.OT_INT16;
                Base_Type_ids["uint16"] = KFDataType.OT_UINT16;
                Base_Type_ids["int"] = KFDataType.OT_INT32;
                Base_Type_ids["int32"] = KFDataType.OT_INT32;
                Base_Type_ids["uint32"] = KFDataType.OT_UINT32;
                Base_Type_ids["uint"] = KFDataType.OT_UINT32;
                Base_Type_ids["float"] = KFDataType.OT_FLOAT;
                Base_Type_ids["double"] = KFDataType.OT_DOUBLE;
                Base_Type_ids["num1"] = KFDataType.OT_FLOAT;
                Base_Type_ids["num2"] = KFDataType.OT_DOUBLE;
                Base_Type_ids["kfstr"] = KFDataType.OT_STRING;
                Base_Type_ids["kfname"] = KFDataType.OT_STRING;
                Base_Type_ids["null"] = KFDataType.OT_NULL;
                Base_Type_ids["kfBytes"] = KFDataType.OT_BYTES;
                Base_Type_ids["bool"] = KFDataType.OT_BOOL;
                Base_Type_ids["varint"] = KFDataType.OT_VARINT;
                Base_Type_ids["varuint"] = KFDataType.OT_VARUINT;
                Base_Type_ids["int64"] = KFDataType.OT_INT64;
                Base_Type_ids["uint64"] = KFDataType.OT_UINT64;
                KFDataType.Base_Type_ids = Base_Type_ids;

                let Type_to_ids = {};
                for (let keystr in Base_Type_ids) {
                    Type_to_ids[keystr] = Base_Type_ids[keystr];
                }
                Type_to_ids["arr"] = KFDataType.OT_ARRAY;
                Type_to_ids["mixarr"] = KFDataType.OT_MIXARRAY;
                Type_to_ids["object"] = KFDataType.OT_OBJECT;
                Type_to_ids["mixobject"] = KFDataType.OT_MIXOBJECT;
                let ID_to_types = {};
                for (let keystr in Type_to_ids) {
                    ID_to_types[Type_to_ids[keystr]] = keystr;
                }
                KFDataType.Type_to_ids = Type_to_ids;
                KFDataType.ID_to_types = ID_to_types;

                let NumIntEnum = {};
                NumIntEnum[KFDataType.OT_INT8] = true;
                NumIntEnum[KFDataType.OT_UINT8] = true;
                NumIntEnum[KFDataType.OT_INT16] = true;
                NumIntEnum[KFDataType.OT_UINT16] = true;
                NumIntEnum[KFDataType.OT_INT32] = true;
                NumIntEnum[KFDataType.OT_UINT32] = true;
                NumIntEnum[KFDataType.OT_INT64] = true;
                NumIntEnum[KFDataType.OT_UINT64] = true;
                NumIntEnum[KFDataType.OT_VARINT] = true;
                NumIntEnum[KFDataType.OT_VARUINT] = true;
                KFDataType.NumIntEnum = NumIntEnum;
            }
        };

        // 是否为整型，不包括bool型
        KFDataType.Is_Integer = function (type) {
            KFDataType._Initialize();
            return KFDataType.NumIntEnum[type] === true;
        };
        // 是否为浮点型
        KFDataType.Is_Float = function (type) {
            return type === KFDataType.OT_FLOAT || type === KFDataType.OT_DOUBLE;
        };
        // 是否为数量，不包括bool型
        KFDataType.Is_Number = function (type) {
            return KFDataType.Is_Integer(type) || KFDataType.Is_Float(type);
        };
        KFDataType.Is_BaseTypeStr = function (typestr) {
            KFDataType._Initialize();
            return KFDataType.Base_Type_ids[typestr] != null;
        };
        KFDataType.Is_UnknowOrBaseType = function (type) {
            return type <= KFDataType.OT_UINT64 || type === KFDataType.OT_VARINT;
        };
        KFDataType.Is_ArrayOrObjectType = function (type) {
            return type >= KFDataType.OT_ARRAY && type <= KFDataType.OT_MIXOBJECT;
        };
        KFDataType.GetTypeID = function (type) {
            KFDataType._Initialize();
            let ret = KFDataType.Type_to_ids[type];
            return ret == null ? 0 : ret;
        };
        KFDataType.OT_UNKNOW = 0x00;
        KFDataType.OT_INT8 = 0x01;
        KFDataType.OT_UINT8 = 0x02;
        KFDataType.OT_INT16 = 0x03;
        KFDataType.OT_UINT16 = 0x04;
        KFDataType.OT_INT32 = 0x05;
        KFDataType.OT_UINT32 = 0x06;
        KFDataType.OT_FLOAT = 0x07;
        KFDataType.OT_DOUBLE = 0x08;
        KFDataType.OT_STRING = 0x09;
        KFDataType.OT_NULL = 0x0A;
        KFDataType.OT_BYTES = 0x0B;
        KFDataType.OT_BOOL = 0x0C;
        KFDataType.OT_VARUINT = 0x0D;
        KFDataType.OT_INT64 = 0x0E;
        KFDataType.OT_UINT64 = 0x0F;
        KFDataType.OT_ARRAY = 0x10;
        KFDataType.OT_MIXARRAY = 0x11;
        KFDataType.OT_OBJECT = 0x12;
        KFDataType.OT_MIXOBJECT = 0x13;
        KFDataType.OT_VARINT = 0x14;
        KFDataType.OBJ_PROP_ID_BEGIN = 0X7F;
        KFDataType.OBJ_PROP_ID_END = 0;
        KFDataType.ID_to_types = null;
        KFDataType.Base_Type_ids = null;
        KFDataType.Type_to_ids = null;
        KFDataType.NumIntEnum = {};
        KFDataType.NumFloatEnum = {};
        return KFDataType;
    }());
    exports.KFDataType = KFDataType;
});