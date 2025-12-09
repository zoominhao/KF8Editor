#include "FVectorF.h"
#include "KFTestObjectAF.h"
#include "KFTestObjectBF.h"

namespace KF {
    KFDFieldResult FVectorR::GetField(kfAny obj, const kfname& fieldname, kfAny index) {
        KFDFieldResult result;
        if (!obj) return result;
        FVector* typeobject = static_cast<FVector*>(obj);
        result.IsSuccess = true;
        result.FieldName = fieldname;
        static const kfname __k_X = "X";
        if (fieldname == __k_X) {
            result.FieldType = 7;
            result.FieldValue = &(typeobject->X);
            return result;
        }
        static const kfname __k_Y = "Y";
        if (fieldname == __k_Y) {
            result.FieldType = 7;
            result.FieldValue = &(typeobject->Y);
            return result;
        }
        static const kfname __k_Z = "Z";
        if (fieldname == __k_Z) {
            result.FieldType = 7;
            result.FieldValue = &(typeobject->Z);
            return result;
        }
        result.IsSuccess = false;
        result.FieldName = 0;
        return result;
    }

    bool FVectorR::SetField(kfAny obj, const kfname& fieldname, kfAny field, kfAny index) {
        if (!obj) return false;
        FVector* typeobject = static_cast<FVector*>(obj);
        static const kfname __k_X = "X";
        if (fieldname == __k_X) {
            typeobject->X = *static_cast<num1*>(field);
            return true;
        }
        static const kfname __k_Y = "Y";
        if (fieldname == __k_Y) {
            typeobject->Y = *static_cast<num1*>(field);
            return true;
        }
        static const kfname __k_Z = "Z";
        if (fieldname == __k_Z) {
            typeobject->Z = *static_cast<num1*>(field);
            return true;
        }
        return false;
    }

    kfAny FVectorR::Clone(kfAny obj) {
        kfAny ret = kfNewObject(FVector);
        if (!FVectorR::Copy(obj, ret)) return nullptr;
        return ret;
    }

    bool FVectorR::Copy(kfAny src, kfAny dest) {
        if (!src || !dest) return false;
        FVector* tsrc = static_cast<FVector*>(src);
        FVector* tdest = static_cast<FVector*>(dest);
        tdest->X = tsrc->X;
        tdest->Y = tsrc->Y;
        tdest->Z = tsrc->Z;
        return true;
    }

    FVector* FVectorR::CloneFVector(FVector* obj) {
        return static_cast<FVector*>(KFDataFormat::CloneAnyObject("FVector", obj));
    }
    bool FVectorR::CopyFVector(FVector* src, FVector* dest) {
        return KFDataFormat::CopyAnyObject("FVector", src, "FVector", dest);
    }

    KFDFieldResult KFTestObjectAR::GetField(kfAny obj, const kfname& fieldname, kfAny index) {
        KFDFieldResult result;
        if (!obj) return result;
        KFTestObjectA* typeobject = static_cast<KFTestObjectA*>(obj);
        result.IsSuccess = true;
        result.FieldName = fieldname;
        static const kfname __k_scale = "scale";
        if (fieldname == __k_scale) {
            result.IsGCObject = std::is_base_of<KFGCObject, FVector>::value;
            result.FieldType = OT_OBJECT;
            result.FieldValue = &(typeobject->scale);
            result.ClsName = "FVector";
            return result;
        }
        static const kfname __k_value1 = "value1";
        if (fieldname == __k_value1) {
            result.FieldType = 7;
            result.FieldValue = &(typeobject->value1);
            return result;
        }
        result.IsSuccess = false;
        result.FieldName = 0;
        return result;
    }

    bool KFTestObjectAR::SetField(kfAny obj, const kfname& fieldname, kfAny field, kfAny index) {
        if (!obj) return false;
        KFTestObjectA* typeobject = static_cast<KFTestObjectA*>(obj);
        static const kfname __k_scale = "scale";
        if (fieldname == __k_scale) {
            if (!kfCopyObject(&(typeobject->scale), static_cast<FVector*>(field))) return false;
            return true;
        }
        static const kfname __k_value1 = "value1";
        if (fieldname == __k_value1) {
            typeobject->value1 = *static_cast<float*>(field);
            return true;
        }
        return false;
    }

    kfAny KFTestObjectAR::Clone(kfAny obj) {
        kfAny ret = kfNewObject(KFTestObjectA);
        if (!KFTestObjectAR::Copy(obj, ret)) return nullptr;
        return ret;
    }

    bool KFTestObjectAR::Copy(kfAny src, kfAny dest) {
        if (!src || !dest) return false;
        KFTestObjectA* tsrc = static_cast<KFTestObjectA*>(src);
        KFTestObjectA* tdest = static_cast<KFTestObjectA*>(dest);
        if (!FVectorR::Copy(&tsrc->scale, &tdest->scale)) return false;
        tdest->value1 = tsrc->value1;
        return true;
    }

    KFTestObjectA* KFTestObjectAR::CloneKFTestObjectA(KFTestObjectA* obj) {
        return static_cast<KFTestObjectA*>(KFDataFormat::CloneAnyObject("KFTestObjectA", obj));
    }
    bool KFTestObjectAR::CopyKFTestObjectA(KFTestObjectA* src, KFTestObjectA* dest) {
        return KFDataFormat::CopyAnyObject("KFTestObjectA", src, "KFTestObjectA", dest);
    }

    KFDFieldResult KFTestObjectBR::GetField(kfAny obj, const kfname& fieldname, kfAny index) {
        KFDFieldResult result;
        if (!obj) return result;
        KFTestObjectB* typeobject = static_cast<KFTestObjectB*>(obj);
        result.IsSuccess = true;
        result.FieldName = fieldname;
        static const kfname __k_objectA = "objectA";
        if (fieldname == __k_objectA) {
            result.IsGCObject = std::is_base_of<KFGCObject, KFTestObjectA>::value;
            result.FieldType = OT_MIXOBJECT;
            result.FieldValue = typeobject->objectA.GetPtr();
            result.ClsName = "KFTestObjectA";
            return result;
        }
        static const kfname __k_objectB = "objectB";
        if (fieldname == __k_objectB) {
            result.IsGCObject = std::is_base_of<KFGCObject, KFTestObjectA>::value;
            result.FieldType = OT_MIXOBJECT;
            result.FieldValue = typeobject->objectB.GetPtr();
            result.ClsName = "KFTestObjectA";
            return result;
        }
        static const kfname __k_objectA_array = "objectA_array";
        if (fieldname == __k_objectA_array) {
            if (index) {
                result.IsGCObject = std::is_base_of<KFGCObject, KFTestObjectA>::value;
                result.FieldType = OT_MIXOBJECT;
                result.ClsName = "KFTestObjectA";
                auto& arritms = typeobject->objectA_array;
                uint32 arrsize = kf_2_uint32(arritms.size());
                uint32 arrindex = *(static_cast<uint32*>(index));
                if (arrindex < arrsize) {
                    result.FieldValue = arritms[arrindex].GetPtr();
                }
            } else {
                result.FieldType = OT_MIXARRAY;
                result.IsElemGCObject = std::is_base_of<KFGCObject, KFTestObjectA>::value;
                result.SecondType = OT_MIXOBJECT;
                result.ClsName = "KFTestObjectA";
                result.FieldValue = &(typeobject->objectA_array);
            }
            return result;
        }
        static const kfname __k_objectB_array = "objectB_array";
        if (fieldname == __k_objectB_array) {
            if (index) {
                result.IsGCObject = std::is_base_of<KFGCObject, KFTestObjectA>::value;
                result.FieldType = OT_MIXOBJECT;
                result.ClsName = "KFTestObjectA";
                auto& arritms = typeobject->objectB_array;
                uint32 arrsize = kf_2_uint32(arritms.size());
                uint32 arrindex = *(static_cast<uint32*>(index));
                if (arrindex < arrsize) {
                    result.FieldValue = arritms[arrindex].GetPtr();
                }
            } else {
                result.FieldType = OT_MIXARRAY;
                result.IsElemGCObject = std::is_base_of<KFGCObject, KFTestObjectA>::value;
                result.SecondType = OT_MIXOBJECT;
                result.ClsName = "KFTestObjectA";
                result.FieldValue = &(typeobject->objectB_array);
            }
            return result;
        }
        static const kfname __k_objectA_map = "objectA_map";
        if (fieldname == __k_objectA_map) {
            if (index) {
                result.IsGCObject = std::is_base_of<KFGCObject, KFTestObjectA>::value;
                result.FieldType = OT_MIXOBJECT;
                result.ClsName = "KFTestObjectA";
                auto mapkey = static_cast<uint32*>(index);
                if (typeobject->objectA_map.count(*mapkey)) {
                    result.FieldValue = typeobject->objectA_map[*mapkey].GetPtr();
                }
            } else {
                result.IsMixMap = true;
                result.FieldType = 6;
                result.IsElemGCObject = std::is_base_of<KFGCObject, KFTestObjectA>::value;
                result.SecondType = OT_MIXOBJECT;
                result.ClsName = "KFTestObjectA";
                result.FieldValue = &(typeobject->objectA_map);
            }
            return result;
        }
        static const kfname __k_objectB_map = "objectB_map";
        if (fieldname == __k_objectB_map) {
            if (index) {
                result.IsGCObject = std::is_base_of<KFGCObject, KFTestObjectA>::value;
                result.FieldType = OT_MIXOBJECT;
                result.ClsName = "KFTestObjectA";
                auto mapkey = static_cast<uint32*>(index);
                if (typeobject->objectB_map.count(*mapkey)) {
                    result.FieldValue = typeobject->objectB_map[*mapkey].GetPtr();
                }
            } else {
                result.IsMixMap = true;
                result.FieldType = 6;
                result.IsElemGCObject = std::is_base_of<KFGCObject, KFTestObjectA>::value;
                result.SecondType = OT_MIXOBJECT;
                result.ClsName = "KFTestObjectA";
                result.FieldValue = &(typeobject->objectB_map);
            }
            return result;
        }
        result.IsSuccess = false;
        result.FieldName = 0;
        return result;
    }

    bool KFTestObjectBR::SetField(kfAny obj, const kfname& fieldname, kfAny field, kfAny index) {
        if (!obj) return false;
        KFTestObjectB* typeobject = static_cast<KFTestObjectB*>(obj);
        static const kfname __k_objectA = "objectA";
        if (fieldname == __k_objectA) {
            typeobject->objectA = static_cast<KFTestObjectA*>(field);
            return true;
        }
        static const kfname __k_objectB = "objectB";
        if (fieldname == __k_objectB) {
            typeobject->objectB = static_cast<KFTestObjectA*>(field);
            return true;
        }
        static const kfname __k_objectA_array = "objectA_array";
        if (fieldname == __k_objectA_array) {
            if (!index) return false;
            auto& arritms = typeobject->objectA_array;
            uint32 arrsize = kf_2_uint32(arritms.size());
            auto arrindex = *static_cast<uint32*>(index);
            if (arrindex < arrsize) {
                arritms[arrindex] = static_cast<KFTestObjectA*>(field);
            }
            return true;
        }
        static const kfname __k_objectB_array = "objectB_array";
        if (fieldname == __k_objectB_array) {
            if (!index) return false;
            auto& arritms = typeobject->objectB_array;
            uint32 arrsize = kf_2_uint32(arritms.size());
            auto arrindex = *static_cast<uint32*>(index);
            if (arrindex < arrsize) {
                arritms[arrindex] = static_cast<KFTestObjectA*>(field);
            }
            return true;
        }
        static const kfname __k_objectA_map = "objectA_map";
        if (fieldname == __k_objectA_map) {
            if (!index) return false;
            auto mapkey = static_cast<uint32*>(index);
            typeobject->objectA_map[*mapkey] = static_cast<KFTestObjectA*>(field);
            return true;
        }
        static const kfname __k_objectB_map = "objectB_map";
        if (fieldname == __k_objectB_map) {
            if (!index) return false;
            auto mapkey = static_cast<uint32*>(index);
            typeobject->objectB_map[*mapkey] = static_cast<KFTestObjectA*>(field);
            return true;
        }
        return false;
    }

    kfAny KFTestObjectBR::Clone(kfAny obj) {
        kfAny ret = kfNewObject(KFTestObjectB);
        if (!KFTestObjectBR::Copy(obj, ret)) return nullptr;
        return ret;
    }

    bool KFTestObjectBR::Copy(kfAny src, kfAny dest) {
        if (!src || !dest) return false;
        KFTestObjectB* tsrc = static_cast<KFTestObjectB*>(src);
        KFTestObjectB* tdest = static_cast<KFTestObjectB*>(dest);
        if (!KFTestObjectAR::CopyKFTestObjectA(tsrc->objectA.GetPtr(), tdest->objectA.GetPtr())) return false;
        if (!KFTestObjectAR::CopyKFTestObjectA(tsrc->objectB.GetPtr(), tdest->objectB.GetPtr())) return false;
        tdest->objectA_array.clear();
        for (const auto& item : tsrc->objectA_array) {
            auto newitem = KFTestObjectAR::CloneKFTestObjectA(item.GetPtr());
            if (!newitem) return false;
            newitem->_MoreThenOne();
            tdest->objectA_array.push_back(newitem);
        }
        tdest->objectB_array.clear();
        for (const auto& item : tsrc->objectB_array) {
            auto newitem = KFTestObjectAR::CloneKFTestObjectA(item.GetPtr());
            if (!newitem) return false;
            newitem->_MoreThenOne();
            tdest->objectB_array.push_back(newitem);
        }
        tdest->objectA_map.clear();
        for (auto& item : tsrc->objectA_map) {
            auto newitem = KFTestObjectAR::CloneKFTestObjectA(item.second.GetPtr());
            if (!newitem) return false;
            newitem->_MoreThenOne();
            tdest->objectA_map[item.first] = newitem;
        }
        tdest->objectB_map.clear();
        for (auto& item : tsrc->objectB_map) {
            auto newitem = KFTestObjectAR::CloneKFTestObjectA(item.second.GetPtr());
            if (!newitem) return false;
            newitem->_MoreThenOne();
            tdest->objectB_map[item.first] = newitem;
        }
        return true;
    }

    KFTestObjectB* KFTestObjectBR::CloneKFTestObjectB(KFTestObjectB* obj) {
        return static_cast<KFTestObjectB*>(KFDataFormat::CloneAnyObject("KFTestObjectB", obj));
    }
    bool KFTestObjectBR::CopyKFTestObjectB(KFTestObjectB* src, KFTestObjectB* dest) {
        return KFDataFormat::CopyAnyObject("KFTestObjectB", src, "KFTestObjectB", dest);
    }

}