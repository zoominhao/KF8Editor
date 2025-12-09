#include "FVectorF.h"
#include "KFTestObjectAF.h"
#include "KFTestObjectBF.h"

namespace KF
{
    FVector* FVectorF::Read(KFByteArray& buffarr,FVector* obj) {
        if(obj == nullptr) {
            obj = kfNewObject(FVector);
        }

        int32 cpos = buffarr.GetPosition();
        uint32 id = buffarr.ReadVarUInt();
        ///Deal with problems if there is no inheritance before
        if(id != OBJ_PROP_ID_BEGIN) {
            buffarr.SetPosition(cpos);
            return obj;
        }

        id = buffarr.ReadVarUInt();

        while(id != OBJ_PROP_ID_END) {
            switch(id) {
            case 1:
                baseTypeReadTV(buffarr, 7, num1, obj->X);
                break;
            case 2:
                baseTypeReadTV(buffarr, 7, num1, obj->Y);
                break;
            case 3:
                baseTypeReadTV(buffarr, 7, num1, obj->Z);
                break;
            case OBJ_PROP_ID_END:
                break;
            case OBJ_PROP_ID_BEGIN:
                ///Processing if there is a class inheritance before
                ///Inheritance has disappeared
                buffarr.Skip(-1);
                KFDataFormat::SkipObject(buffarr);
                break;
            default:
                KFDataFormat::SkipValue(buffarr);
                break;
            }

            id = buffarr.ReadVarUInt();
        }

        return obj;
    }

    void FVectorF::Write(KFByteArray& buffarr,FVector* obj,KFDDirtys* dirtys) {
        if (!obj) return;
        buffarr.WriteVarUInt(OBJ_PROP_ID_BEGIN);

        EKFDPropertyFlag flag;
        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->X, dirtys, flag)) {
            buffarr.WriteVarUInt(1); // pid
            num1WriteTV(buffarr,obj->X);
        }

        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->Y, dirtys, flag)) {
            buffarr.WriteVarUInt(2); // pid
            num1WriteTV(buffarr,obj->Y);
        }

        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->Z, dirtys, flag)) {
            buffarr.WriteVarUInt(3); // pid
            num1WriteTV(buffarr,obj->Z);
        }

        buffarr.WriteVarUInt(OBJ_PROP_ID_END);
    }

    bool FVectorF::Diff(FVector* old_obj,FVector* new_obj,KFDDirtys* dirtys) {
        if(!old_obj || !new_obj) {
            return old_obj != new_obj;
        }

        bool is_changed = false;
        EKFDPropertyFlag flag;
        flag = EKFDPropertyFlag::Default;
        if(IsFieldNeedToDiff(dirtys, flag) && !IsKFDValueEqual(old_obj->X, new_obj->X)) {
            if(dirtys) dirtys->MarkField(new_obj, &new_obj->X);
            is_changed = true;
        }
        flag = EKFDPropertyFlag::Default;
        if(IsFieldNeedToDiff(dirtys, flag) && !IsKFDValueEqual(old_obj->Y, new_obj->Y)) {
            if(dirtys) dirtys->MarkField(new_obj, &new_obj->Y);
            is_changed = true;
        }
        flag = EKFDPropertyFlag::Default;
        if(IsFieldNeedToDiff(dirtys, flag) && !IsKFDValueEqual(old_obj->Z, new_obj->Z)) {
            if(dirtys) dirtys->MarkField(new_obj, &new_obj->Z);
            is_changed = true;
        }
        return is_changed;
    }

    FVector* FVectorF::CompactRead(KFByteArray& buffarr,FVector* obj)
    {
        uint8 option = buffarr.ReadUByte();
        if (option == 0) return nullptr;

        if(obj == nullptr) {
            obj = kfNewObject(FVector);
        }
        num1ReadV(buffarr,obj->X);
        num1ReadV(buffarr,obj->Y);
        num1ReadV(buffarr,obj->Z);

        return obj;
    }

    void FVectorF::CompactWrite(KFByteArray& buffarr,FVector* obj) {
        if (!obj) {
            buffarr.WriteByte(0); // NULL
            return;
        }
        buffarr.WriteByte(1); // NOT NULL

        num1WriteV(buffarr,obj->X);
        num1WriteV(buffarr,obj->Y);
        num1WriteV(buffarr,obj->Z);
    }

    FVector* FVectorF::ReadFVector(KFByteArray& buffarr,FVector* obj /*= nullptr*/) {
        return static_cast<FVector*>(KFDataFormat::ReadAnyObject(buffarr, "FVector", obj));
    }
    void FVectorF::WriteFVector(KFByteArray& buffarr,FVector* obj,KFDDirtys* dirtys) {
        KFDataFormat::WriteAnyObject(buffarr, "FVector", obj, dirtys);
    }
    bool FVectorF::DiffFVector(FVector* old_obj,FVector* new_obj,KFDDirtys* dirtys) {
        return KFDataFormat::DiffAnyObject("FVector", old_obj, "FVector", new_obj, dirtys);
    }
    FVector* FVectorF::CompactReadFVector(KFByteArray& buffarr,FVector* obj /*= nullptr*/) {
        return static_cast<FVector*>(KFDataFormat::CompactReadAnyObject(buffarr, obj));
    }
    void FVectorF::CompactWriteFVector(KFByteArray& buffarr,FVector* obj) {
        KFDataFormat::CompactWriteAnyObject(buffarr, "FVector", obj);
    }

    KFTestObjectA* KFTestObjectAF::Read(KFByteArray& buffarr,KFTestObjectA* obj) {
        if(obj == nullptr) {
            obj = kfNewObject(KFTestObjectA);
        }

        int32 cpos = buffarr.GetPosition();
        uint32 id = buffarr.ReadVarUInt();
        ///Deal with problems if there is no inheritance before
        if(id != OBJ_PROP_ID_BEGIN) {
            buffarr.SetPosition(cpos);
            return obj;
        }

        id = buffarr.ReadVarUInt();

        while(id != OBJ_PROP_ID_END) {
            switch(id) {
            case 1:
                if(buffarr.ReadUByte() == OT_OBJECT) {
                    FVectorF::Read(buffarr,&obj->scale);
                } else {
                    buffarr.Skip(-1);
                    KFDataFormat::SkipValue(buffarr);
                }
                break;
            case 2:
                baseTypeReadTV(buffarr, 7, float, obj->value1);
                break;
            case OBJ_PROP_ID_END:
                break;
            case OBJ_PROP_ID_BEGIN:
                ///Processing if there is a class inheritance before
                ///Inheritance has disappeared
                buffarr.Skip(-1);
                KFDataFormat::SkipObject(buffarr);
                break;
            default:
                KFDataFormat::SkipValue(buffarr);
                break;
            }

            id = buffarr.ReadVarUInt();
        }

        return obj;
    }

    void KFTestObjectAF::Write(KFByteArray& buffarr,KFTestObjectA* obj,KFDDirtys* dirtys) {
        if (!obj) return;
        buffarr.WriteVarUInt(OBJ_PROP_ID_BEGIN);

        EKFDPropertyFlag flag;
        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->scale, dirtys, flag)) {
            buffarr.WriteVarUInt(1); // pid
            buffarr.WriteByte(OT_OBJECT);///write object type
            FVectorF::Write(buffarr,&obj->scale,dirtys);
        }

        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->value1, dirtys, flag)) {
            buffarr.WriteVarUInt(2); // pid
            floatWriteTV(buffarr,obj->value1);
        }

        buffarr.WriteVarUInt(OBJ_PROP_ID_END);
    }

    bool KFTestObjectAF::Diff(KFTestObjectA* old_obj,KFTestObjectA* new_obj,KFDDirtys* dirtys) {
        if(!old_obj || !new_obj) {
            return old_obj != new_obj;
        }

        bool is_changed = false;
        EKFDPropertyFlag flag;
        flag = EKFDPropertyFlag::Default;
        if(IsFieldNeedToDiff(dirtys, flag) && FVectorF::Diff(&old_obj->scale, &new_obj->scale, dirtys)) {
            if(dirtys) dirtys->MarkField(new_obj, &new_obj->scale);
            is_changed = true;
        }
        flag = EKFDPropertyFlag::Default;
        if(IsFieldNeedToDiff(dirtys, flag) && !IsKFDValueEqual(old_obj->value1, new_obj->value1)) {
            if(dirtys) dirtys->MarkField(new_obj, &new_obj->value1);
            is_changed = true;
        }
        return is_changed;
    }

    KFTestObjectA* KFTestObjectAF::CompactRead(KFByteArray& buffarr,KFTestObjectA* obj)
    {
        uint8 option = buffarr.ReadUByte();
        if (option == 0) return nullptr;

        if(obj == nullptr) {
            obj = kfNewObject(KFTestObjectA);
        }
        FVectorF::CompactRead(buffarr,&obj->scale);
        floatReadV(buffarr,obj->value1);

        return obj;
    }

    void KFTestObjectAF::CompactWrite(KFByteArray& buffarr,KFTestObjectA* obj) {
        if (!obj) {
            buffarr.WriteByte(0); // NULL
            return;
        }
        buffarr.WriteByte(1); // NOT NULL

        FVectorF::CompactWrite(buffarr,&obj->scale);
        floatWriteV(buffarr,obj->value1);
    }

    KFTestObjectA* KFTestObjectAF::ReadKFTestObjectA(KFByteArray& buffarr,KFTestObjectA* obj /*= nullptr*/) {
        return static_cast<KFTestObjectA*>(KFDataFormat::ReadAnyObject(buffarr, "KFTestObjectA", obj));
    }
    void KFTestObjectAF::WriteKFTestObjectA(KFByteArray& buffarr,KFTestObjectA* obj,KFDDirtys* dirtys) {
        KFDataFormat::WriteAnyObject(buffarr, "KFTestObjectA", obj, dirtys);
    }
    bool KFTestObjectAF::DiffKFTestObjectA(KFTestObjectA* old_obj,KFTestObjectA* new_obj,KFDDirtys* dirtys) {
        return KFDataFormat::DiffAnyObject("KFTestObjectA", old_obj, "KFTestObjectA", new_obj, dirtys);
    }
    KFTestObjectA* KFTestObjectAF::CompactReadKFTestObjectA(KFByteArray& buffarr,KFTestObjectA* obj /*= nullptr*/) {
        return static_cast<KFTestObjectA*>(KFDataFormat::CompactReadAnyObject(buffarr, obj));
    }
    void KFTestObjectAF::CompactWriteKFTestObjectA(KFByteArray& buffarr,KFTestObjectA* obj) {
        KFDataFormat::CompactWriteAnyObject(buffarr, "KFTestObjectA", obj);
    }

    KFTestObjectB* KFTestObjectBF::Read(KFByteArray& buffarr,KFTestObjectB* obj) {
        if(obj == nullptr) {
            obj = kfNewObject(KFTestObjectB);
        }

        int32 cpos = buffarr.GetPosition();
        uint32 id = buffarr.ReadVarUInt();
        ///Deal with problems if there is no inheritance before
        if(id != OBJ_PROP_ID_BEGIN) {
            buffarr.SetPosition(cpos);
            return obj;
        }

        id = buffarr.ReadVarUInt();

        while(id != OBJ_PROP_ID_END) {
            switch(id) {
            case 1:
                {
                    ///mix object self checking 
                    auto oldval = obj->objectA.GetPtr();
                    auto newval = KFTestObjectAF::ReadKFTestObjectA(buffarr,oldval);
                    if(oldval != newval) {
                        obj->objectA = newval;
                        obj->objectA._MoreThenOne();
                    }
                }
                break;
            case 2:
                {
                    ///mix object self checking 
                    auto oldval = obj->objectB.GetPtr();
                    auto newval = KFTestObjectAF::ReadKFTestObjectA(buffarr,oldval);
                    if(oldval != newval) {
                        obj->objectB = newval;
                        obj->objectB._MoreThenOne();
                    }
                }
                break;
            case 3:
                {
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_MIXARRAY) {
                        uint32 arrsize = buffarr.ReadVarUInt();
                        obj->objectA_array.clear();/// clear arr Memory Leak

                        for(uint32 i = 0 ;i < arrsize; i ++) {
                            KFTestObjectA* itm = KFTestObjectAF::ReadKFTestObjectA(buffarr);
                            if(itm) {
                                obj->objectA_array.push_back(itm);
                                itm->_MoreThenOne();
                            } else {
                                LOG_WARNING("KFTestObjectA read failed");
                            }
                        }
                    } else if(valueType == OT_BYTES) { // delta mode
                        uint32 arrsize = buffarr.ReadVarUInt();
                        uint32 changesize = buffarr.ReadVarUInt();
                        obj->objectA_array.resize(arrsize);
                        for(uint32 i = 0 ;i < changesize; i ++) {
                            uint32 cidx = buffarr.ReadVarUInt();
                            if (cidx < arrsize) {
                                KFTestObjectA* olditm = obj->objectA_array[cidx].GetPtr();
                                KFTestObjectA* newitm = KFTestObjectAF::ReadKFTestObjectA(buffarr, olditm);
                                if(newitm != olditm) {
                                    obj->objectA_array[cidx] = newitm;
                                    if (newitm) newitm->_MoreThenOne();
                                }
                            }
                        }
                    } else {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr);
                    }
                }
                break;
            case 4:
                {
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_MIXARRAY) {
                        uint32 arrsize = buffarr.ReadVarUInt();
                        obj->objectB_array.clear();/// clear arr Memory Leak

                        for(uint32 i = 0 ;i < arrsize; i ++) {
                            KFTestObjectA* itm = KFTestObjectAF::ReadKFTestObjectA(buffarr);
                            if(itm) {
                                obj->objectB_array.push_back(itm);
                                itm->_MoreThenOne();
                            } else {
                                LOG_WARNING("KFTestObjectA read failed");
                            }
                        }
                    } else if(valueType == OT_BYTES) { // delta mode
                        uint32 arrsize = buffarr.ReadVarUInt();
                        uint32 changesize = buffarr.ReadVarUInt();
                        obj->objectB_array.resize(arrsize);
                        for(uint32 i = 0 ;i < changesize; i ++) {
                            uint32 cidx = buffarr.ReadVarUInt();
                            if (cidx < arrsize) {
                                KFTestObjectA* olditm = obj->objectB_array[cidx].GetPtr();
                                KFTestObjectA* newitm = KFTestObjectAF::ReadKFTestObjectA(buffarr, olditm);
                                if(newitm != olditm) {
                                    obj->objectB_array[cidx] = newitm;
                                    if (newitm) newitm->_MoreThenOne();
                                }
                            }
                        }
                    } else {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr);
                    }
                }
                break;
            case 5:
                {
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_BYTES) {
                        int32 len = buffarr.ReadVarUInt();
                        int32 origin_position = buffarr.GetPosition();

                        uint8 option_bits = buffarr.ReadUByte();
                        bool is_delta_mode = (option_bits & 0x1);
                        uint32 mapsize = buffarr.ReadVarUInt();
                        buffarr.Skip(1);

                        uint32 mapkey;
                        if (is_delta_mode) {
                            for(uint32 i = 0; i < mapsize; ++i) {
                                bool is_delete = buffarr.ReadBool();
                                uint32ReadV(buffarr, mapkey);
                                if (is_delete) {
                                    obj->objectA_map.erase(mapkey);
                                } else {
                                    KFTestObjectA* olditm = obj->objectA_map[mapkey].GetPtr();
                                    KFTestObjectA* newitm = KFTestObjectAF::ReadKFTestObjectA(buffarr, olditm);
                                    if (newitm != olditm) {
                                        obj->objectA_map[mapkey] = newitm;
                                        if (newitm) {
                                            newitm->_MoreThenOne();
                                        }
                                    }
                                }
                            }
                        } else {
                            obj->objectA_map.clear();
                            for(uint32 i = 0; i < mapsize; ++i) {
                                uint32ReadV(buffarr, mapkey);
                                KFTestObjectA* itm = KFTestObjectAF::ReadKFTestObjectA(buffarr);
                                if(itm) {
                                    obj->objectA_map[mapkey] = itm;
                                    itm->_MoreThenOne();
                                } else {
                                    LOG_WARNING("KFTestObjectA read failed");
                                }
                            }
                        }

                        buffarr.SetPosition(origin_position + len);
                    } else {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr);
                    }
                }
                break;
            case 6:
                {
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_BYTES) {
                        int32 len = buffarr.ReadVarUInt();
                        int32 origin_position = buffarr.GetPosition();

                        uint8 option_bits = buffarr.ReadUByte();
                        bool is_delta_mode = (option_bits & 0x1);
                        uint32 mapsize = buffarr.ReadVarUInt();
                        buffarr.Skip(1);

                        uint32 mapkey;
                        if (is_delta_mode) {
                            for(uint32 i = 0; i < mapsize; ++i) {
                                bool is_delete = buffarr.ReadBool();
                                uint32ReadV(buffarr, mapkey);
                                if (is_delete) {
                                    obj->objectB_map.erase(mapkey);
                                } else {
                                    KFTestObjectA* olditm = obj->objectB_map[mapkey].GetPtr();
                                    KFTestObjectA* newitm = KFTestObjectAF::ReadKFTestObjectA(buffarr, olditm);
                                    if (newitm != olditm) {
                                        obj->objectB_map[mapkey] = newitm;
                                        if (newitm) {
                                            newitm->_MoreThenOne();
                                        }
                                    }
                                }
                            }
                        } else {
                            obj->objectB_map.clear();
                            for(uint32 i = 0; i < mapsize; ++i) {
                                uint32ReadV(buffarr, mapkey);
                                KFTestObjectA* itm = KFTestObjectAF::ReadKFTestObjectA(buffarr);
                                if(itm) {
                                    obj->objectB_map[mapkey] = itm;
                                    itm->_MoreThenOne();
                                } else {
                                    LOG_WARNING("KFTestObjectA read failed");
                                }
                            }
                        }

                        buffarr.SetPosition(origin_position + len);
                    } else {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr);
                    }
                }
                break;
            case OBJ_PROP_ID_END:
                break;
            case OBJ_PROP_ID_BEGIN:
                ///Processing if there is a class inheritance before
                ///Inheritance has disappeared
                buffarr.Skip(-1);
                KFDataFormat::SkipObject(buffarr);
                break;
            default:
                KFDataFormat::SkipValue(buffarr);
                break;
            }

            id = buffarr.ReadVarUInt();
        }

        return obj;
    }

    void KFTestObjectBF::Write(KFByteArray& buffarr,KFTestObjectB* obj,KFDDirtys* dirtys) {
        if (!obj) return;
        buffarr.WriteVarUInt(OBJ_PROP_ID_BEGIN);

        EKFDPropertyFlag flag;
        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->objectA, dirtys, flag)) {
            buffarr.WriteVarUInt(1); // pid
            KFTestObjectAF::WriteKFTestObjectA(buffarr,obj->objectA.GetPtr(),dirtys);
        }

        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->objectB, dirtys, flag)) {
            buffarr.WriteVarUInt(2); // pid
            KFTestObjectAF::WriteKFTestObjectA(buffarr,obj->objectB.GetPtr(),dirtys);
        }

        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->objectA_array, dirtys, flag)) {
            buffarr.WriteVarUInt(3); // pid
            if (dirtys && dirtys->IsDiffMode()) { // delta mode
                buffarr.WriteByte(OT_BYTES);
                auto& arritms = obj->objectA_array;
                uint32 arrsize = kf_2_uint32(arritms.size());
                buffarr.WriteVarUInt(arrsize);
                auto& change_indexs = dirtys->GetMarkArrayFieldIndex(obj, &obj->objectA_array);
                buffarr.WriteVarUInt(kf_2_uint32(change_indexs.size()));
                for(auto i :change_indexs) {
                    buffarr.WriteVarUInt(i);
                    KFTestObjectAF::WriteKFTestObjectA(buffarr,arritms[i].GetPtr(),dirtys);
                }
            } else {
                buffarr.WriteByte(17);///write mixarr type
                auto& arritms = obj->objectA_array;
                uint32 arrsize = kf_2_uint32(arritms.size());
                buffarr.WriteVarUInt(arrsize);
                for(uint32 i = 0; i < arrsize; ++i) {
                    KFTestObjectAF::WriteKFTestObjectA(buffarr,arritms[i].GetPtr(),dirtys);
                }
            }
        }

        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->objectB_array, dirtys, flag)) {
            buffarr.WriteVarUInt(4); // pid
            if (dirtys && dirtys->IsDiffMode()) { // delta mode
                buffarr.WriteByte(OT_BYTES);
                auto& arritms = obj->objectB_array;
                uint32 arrsize = kf_2_uint32(arritms.size());
                buffarr.WriteVarUInt(arrsize);
                auto& change_indexs = dirtys->GetMarkArrayFieldIndex(obj, &obj->objectB_array);
                buffarr.WriteVarUInt(kf_2_uint32(change_indexs.size()));
                for(auto i :change_indexs) {
                    buffarr.WriteVarUInt(i);
                    KFTestObjectAF::WriteKFTestObjectA(buffarr,arritms[i].GetPtr(),dirtys);
                }
            } else {
                buffarr.WriteByte(17);///write mixarr type
                auto& arritms = obj->objectB_array;
                uint32 arrsize = kf_2_uint32(arritms.size());
                buffarr.WriteVarUInt(arrsize);
                for(uint32 i = 0; i < arrsize; ++i) {
                    KFTestObjectAF::WriteKFTestObjectA(buffarr,arritms[i].GetPtr(),dirtys);
                }
            }
        }

        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->objectA_map, dirtys, flag)) {
            buffarr.WriteVarUInt(5); // pid
            auto& static_buffarr = KFDataFormat::ClearUseBuff;
            static_buffarr.Clear();
            auto& mapitms = obj->objectA_map;
            if (dirtys && dirtys->IsDiffMode()) { // delta mode
                static_buffarr.WriteByte(0x3);
                static_buffarr.WriteVarUInt(dirtys->GetMarkMapFieldChangeCnt<uint32>(obj, &obj->objectA_map));
                static_buffarr.WriteByte(ConvertInt2VarInt(6));// first value type
                for(auto& item : mapitms) {
                    bool is_delete = false;
                    if (dirtys->IsMarkMapFieldChange<uint32>(obj, &obj->objectA_map, item.first, is_delete)) {
                        static_buffarr.WriteBool(is_delete);
                        uint32WriteV(static_buffarr,item.first);
                        if (!is_delete) {
                            KFTestObjectAF::WriteKFTestObjectA(static_buffarr,item.second.GetPtr(),dirtys);
                        }
                    }
                }
            } else {
                static_buffarr.WriteByte(0x2);
                static_buffarr.WriteVarUInt(kf_2_uint32(mapitms.size()));
                static_buffarr.WriteByte(ConvertInt2VarInt(6));// first value type
                for(auto& item : mapitms)
                {
                    uint32WriteV(static_buffarr,item.first);
                    KFTestObjectAF::WriteKFTestObjectA(static_buffarr,item.second.GetPtr(),dirtys);
                }
            }
            buffarr.WriteByte(OT_BYTES);
            buffarr.WritekfBytes(static_buffarr);
        }

        flag = EKFDPropertyFlag::Default;
        if (IsFieldNeedToWrite(obj, &obj->objectB_map, dirtys, flag)) {
            buffarr.WriteVarUInt(6); // pid
            auto& static_buffarr = KFDataFormat::ClearUseBuff;
            static_buffarr.Clear();
            auto& mapitms = obj->objectB_map;
            if (dirtys && dirtys->IsDiffMode()) { // delta mode
                static_buffarr.WriteByte(0x3);
                static_buffarr.WriteVarUInt(dirtys->GetMarkMapFieldChangeCnt<uint32>(obj, &obj->objectB_map));
                static_buffarr.WriteByte(ConvertInt2VarInt(6));// first value type
                for(auto& item : mapitms) {
                    bool is_delete = false;
                    if (dirtys->IsMarkMapFieldChange<uint32>(obj, &obj->objectB_map, item.first, is_delete)) {
                        static_buffarr.WriteBool(is_delete);
                        uint32WriteV(static_buffarr,item.first);
                        if (!is_delete) {
                            KFTestObjectAF::WriteKFTestObjectA(static_buffarr,item.second.GetPtr(),dirtys);
                        }
                    }
                }
            } else {
                static_buffarr.WriteByte(0x2);
                static_buffarr.WriteVarUInt(kf_2_uint32(mapitms.size()));
                static_buffarr.WriteByte(ConvertInt2VarInt(6));// first value type
                for(auto& item : mapitms)
                {
                    uint32WriteV(static_buffarr,item.first);
                    KFTestObjectAF::WriteKFTestObjectA(static_buffarr,item.second.GetPtr(),dirtys);
                }
            }
            buffarr.WriteByte(OT_BYTES);
            buffarr.WritekfBytes(static_buffarr);
        }

        buffarr.WriteVarUInt(OBJ_PROP_ID_END);
    }

    bool KFTestObjectBF::Diff(KFTestObjectB* old_obj,KFTestObjectB* new_obj,KFDDirtys* dirtys) {
        if(!old_obj || !new_obj) {
            return old_obj != new_obj;
        }

        bool is_changed = false;
        EKFDPropertyFlag flag;
        flag = EKFDPropertyFlag::Default;
        if(IsFieldNeedToDiff(dirtys, flag) && KFTestObjectAF::DiffKFTestObjectA(old_obj->objectA.GetPtr(), new_obj->objectA.GetPtr(), dirtys)) {
            if(dirtys) dirtys->MarkField(new_obj, &new_obj->objectA);
            is_changed = true;
        }
        flag = EKFDPropertyFlag::Default;
        if(IsFieldNeedToDiff(dirtys, flag) && KFTestObjectAF::DiffKFTestObjectA(old_obj->objectB.GetPtr(), new_obj->objectB.GetPtr(), dirtys)) {
            if(dirtys) dirtys->MarkField(new_obj, &new_obj->objectB);
            is_changed = true;
        }
        flag = EKFDPropertyFlag::Default;
        {
            std::function<bool(kfRef<KFTestObjectA>&, kfRef<KFTestObjectA>&, KFDDirtys*)> diff_fn =
                [](kfRef<KFTestObjectA>& o, kfRef<KFTestObjectA>& n, KFDDirtys* d)->bool{
                return KFTestObjectAF::DiffKFTestObjectA(o.GetPtr(), n.GetPtr(), d);
            };
            auto& old_items = old_obj->objectA_array;
            auto& new_items = new_obj->objectA_array;
            is_changed |= IsFieldNeedToDiff(dirtys, flag) && KFDDiffArray(new_obj, old_items, new_items, diff_fn, dirtys);
        }
        flag = EKFDPropertyFlag::Default;
        {
            std::function<bool(kfRef<KFTestObjectA>&, kfRef<KFTestObjectA>&, KFDDirtys*)> diff_fn =
                [](kfRef<KFTestObjectA>& o, kfRef<KFTestObjectA>& n, KFDDirtys* d)->bool{
                return KFTestObjectAF::DiffKFTestObjectA(o.GetPtr(), n.GetPtr(), d);
            };
            auto& old_items = old_obj->objectB_array;
            auto& new_items = new_obj->objectB_array;
            is_changed |= IsFieldNeedToDiff(dirtys, flag) && KFDDiffArray(new_obj, old_items, new_items, diff_fn, dirtys);
        }
        flag = EKFDPropertyFlag::Default;
        {
            std::function<bool(kfRef<KFTestObjectA>&, kfRef<KFTestObjectA>&, KFDDirtys*)> diff_fn =
                [](kfRef<KFTestObjectA>& o, kfRef<KFTestObjectA>& n, KFDDirtys* d)->bool{
                return KFTestObjectAF::DiffKFTestObjectA(o.GetPtr(), n.GetPtr(), d);
            };
            auto& old_items = old_obj->objectA_map;
            auto& new_items = new_obj->objectA_map;
            is_changed |= IsFieldNeedToDiff(dirtys, flag) && KFDDiffMap(new_obj, old_items, new_items, diff_fn, dirtys);
        }
        flag = EKFDPropertyFlag::Default;
        {
            std::function<bool(kfRef<KFTestObjectA>&, kfRef<KFTestObjectA>&, KFDDirtys*)> diff_fn =
                [](kfRef<KFTestObjectA>& o, kfRef<KFTestObjectA>& n, KFDDirtys* d)->bool{
                return KFTestObjectAF::DiffKFTestObjectA(o.GetPtr(), n.GetPtr(), d);
            };
            auto& old_items = old_obj->objectB_map;
            auto& new_items = new_obj->objectB_map;
            is_changed |= IsFieldNeedToDiff(dirtys, flag) && KFDDiffMap(new_obj, old_items, new_items, diff_fn, dirtys);
        }
        return is_changed;
    }

    KFTestObjectB* KFTestObjectBF::CompactRead(KFByteArray& buffarr,KFTestObjectB* obj)
    {
        uint8 option = buffarr.ReadUByte();
        if (option == 0) return nullptr;

        if(obj == nullptr) {
            obj = kfNewObject(KFTestObjectB);
        }
        {
            auto oldval = obj->objectA.GetPtr();
            auto newval = KFTestObjectAF::CompactReadKFTestObjectA(buffarr,oldval);
            if(oldval != newval) {
                obj->objectA = newval;
                obj->objectA._MoreThenOne();
            }
        }
        {
            auto oldval = obj->objectB.GetPtr();
            auto newval = KFTestObjectAF::CompactReadKFTestObjectA(buffarr,oldval);
            if(oldval != newval) {
                obj->objectB = newval;
                obj->objectB._MoreThenOne();
            }
        }
        {
            uint32 arrsize = buffarr.ReadVarUInt();
            obj->objectA_array.clear();/// clear arr Memory Leak

            for(uint32 i = 0 ;i < arrsize; i ++) {
                KFTestObjectA* itm = KFTestObjectAF::CompactReadKFTestObjectA(buffarr);
                if(itm) {
                    obj->objectA_array.push_back(itm);
                    itm->_MoreThenOne();
                } else {
                    LOG_WARNING("KFTestObjectA read failed");
                }
            }
        }
        {
            uint32 arrsize = buffarr.ReadVarUInt();
            obj->objectB_array.clear();/// clear arr Memory Leak

            for(uint32 i = 0 ;i < arrsize; i ++) {
                KFTestObjectA* itm = KFTestObjectAF::CompactReadKFTestObjectA(buffarr);
                if(itm) {
                    obj->objectB_array.push_back(itm);
                    itm->_MoreThenOne();
                } else {
                    LOG_WARNING("KFTestObjectA read failed");
                }
            }
        }
        {
            uint32 mapsize = buffarr.ReadVarUInt();
            obj->objectA_map.clear();

            uint32 mapkey;
            for(uint32 i = 0; i < mapsize; ++i) {
                uint32ReadV(buffarr,mapkey);
                KFTestObjectA* itm = KFTestObjectAF::CompactReadKFTestObjectA(buffarr);
                if(itm) {
                    obj->objectA_map[mapkey] = itm;
                    itm->_MoreThenOne();
                } else {
                    LOG_WARNING(" read failed");
                }
            }
        }
        {
            uint32 mapsize = buffarr.ReadVarUInt();
            obj->objectB_map.clear();

            uint32 mapkey;
            for(uint32 i = 0; i < mapsize; ++i) {
                uint32ReadV(buffarr,mapkey);
                KFTestObjectA* itm = KFTestObjectAF::CompactReadKFTestObjectA(buffarr);
                if(itm) {
                    obj->objectB_map[mapkey] = itm;
                    itm->_MoreThenOne();
                } else {
                    LOG_WARNING(" read failed");
                }
            }
        }

        return obj;
    }

    void KFTestObjectBF::CompactWrite(KFByteArray& buffarr,KFTestObjectB* obj) {
        if (!obj) {
            buffarr.WriteByte(0); // NULL
            return;
        }
        buffarr.WriteByte(1); // NOT NULL

        KFTestObjectAF::CompactWriteKFTestObjectA(buffarr,obj->objectA.GetPtr());
        KFTestObjectAF::CompactWriteKFTestObjectA(buffarr,obj->objectB.GetPtr());
        {
            auto& arritms = obj->objectA_array;
            uint32 arrsize = kf_2_uint32(arritms.size());
            buffarr.WriteVarUInt(arrsize);
            for(uint32 i = 0 ;i < arrsize; i ++) {
                KFTestObjectAF::CompactWriteKFTestObjectA(buffarr,arritms[i].GetPtr());
            }
        }
        {
            auto& arritms = obj->objectB_array;
            uint32 arrsize = kf_2_uint32(arritms.size());
            buffarr.WriteVarUInt(arrsize);
            for(uint32 i = 0 ;i < arrsize; i ++) {
                KFTestObjectAF::CompactWriteKFTestObjectA(buffarr,arritms[i].GetPtr());
            }
        }
        {
            auto& mapitms = obj->objectA_map;
            buffarr.WriteVarUInt(kf_2_uint32(mapitms.size()));
            for(auto& item : mapitms) {
                uint32WriteV(buffarr,item.first);
                KFTestObjectAF::CompactWriteKFTestObjectA(buffarr,item.second.GetPtr());
            }
        }
        {
            auto& mapitms = obj->objectB_map;
            buffarr.WriteVarUInt(kf_2_uint32(mapitms.size()));
            for(auto& item : mapitms) {
                uint32WriteV(buffarr,item.first);
                KFTestObjectAF::CompactWriteKFTestObjectA(buffarr,item.second.GetPtr());
            }
        }
    }

    KFTestObjectB* KFTestObjectBF::ReadKFTestObjectB(KFByteArray& buffarr,KFTestObjectB* obj /*= nullptr*/) {
        return static_cast<KFTestObjectB*>(KFDataFormat::ReadAnyObject(buffarr, "KFTestObjectB", obj));
    }
    void KFTestObjectBF::WriteKFTestObjectB(KFByteArray& buffarr,KFTestObjectB* obj,KFDDirtys* dirtys) {
        KFDataFormat::WriteAnyObject(buffarr, "KFTestObjectB", obj, dirtys);
    }
    bool KFTestObjectBF::DiffKFTestObjectB(KFTestObjectB* old_obj,KFTestObjectB* new_obj,KFDDirtys* dirtys) {
        return KFDataFormat::DiffAnyObject("KFTestObjectB", old_obj, "KFTestObjectB", new_obj, dirtys);
    }
    KFTestObjectB* KFTestObjectBF::CompactReadKFTestObjectB(KFByteArray& buffarr,KFTestObjectB* obj /*= nullptr*/) {
        return static_cast<KFTestObjectB*>(KFDataFormat::CompactReadAnyObject(buffarr, obj));
    }
    void KFTestObjectBF::CompactWriteKFTestObjectB(KFByteArray& buffarr,KFTestObjectB* obj) {
        KFDataFormat::CompactWriteAnyObject(buffarr, "KFTestObjectB", obj);
    }

}