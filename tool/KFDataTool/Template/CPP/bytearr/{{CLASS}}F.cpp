#for $includestr in $includes 
\#include "${includestr}"
#end for

namespace ${NS}
{
#for $data in $datas
    ${data.class}* ${data.class}F::Read(KFByteArray& buffarr,${data.class}* obj) {
        if(obj == nullptr) {
            #if $data.newfunc != None
            obj = ${data.newfunc}(buffarr);
            #else
            obj = kfNewObject(${data.class});
            #end if
        }

        int32 cpos = buffarr.GetPosition();
        uint32 id = buffarr.ReadVarUInt();
        ///Deal with problems if there is no inheritance before
        if(id != OBJ_PROP_ID_BEGIN) {
            buffarr.SetPosition(cpos);
            return obj;
        }

        #if $data.extend 
        ${data.extend}F::Read(buffarr,obj);
        #end if
        id = buffarr.ReadVarUInt();

        while(id != OBJ_PROP_ID_END) {
            switch(id) {
        #for $prop in $data.propertys
            case ${prop.id}:
            #if $prop.read != None
                {
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_BYTES) {
                        int32 len = buffarr.ReadVarUInt();
                        int32 origin_position = buffarr.GetPosition();
                        obj->${prop.read}(buffarr, len);
                        buffarr.SetPosition(origin_position + len);
                    } else {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr); 
                    }
                }
            #else if $prop.type == "map" or $prop.type == "omap" 
                {
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_BYTES) {
                        int32 len = buffarr.ReadVarUInt();
                        int32 origin_position = buffarr.GetPosition();

                        uint8 option_bits = buffarr.ReadUByte();
                        bool is_delta_mode = (option_bits & 0x1);
                        uint32 mapsize = buffarr.ReadVarUInt();
                        buffarr.Skip(2);

                        ${prop.first_otype} mapkey;
                        if (is_delta_mode) {
                            for(uint32 i = 0; i < mapsize; ++i) {
                                bool is_delete = buffarr.ReadBool();
                                ${prop.first_otype}ReadV(buffarr, mapkey);
                                if (is_delete) {
                                    obj->${prop.name}.erase(mapkey);
                                } else {
                                #if $baseids.get($prop.second_otype) == None 
                                    ${prop.second_otype}F::Read(buffarr,&(obj->${prop.name}[mapkey]));
                                #else
                                    ${prop.second_otype}ReadV(buffarr, obj->${prop.name}[mapkey]);
                                #end if
                                }
                            }
                        } else {
                            obj->${prop.name}.clear();
                            for(uint32 i = 0; i < mapsize; ++i) {
                                ${prop.first_otype}ReadV(buffarr, mapkey);
                            #if $baseids.get($prop.second_otype) == None 
                                ${prop.second_otype}F::Read(buffarr,&(obj->${prop.name}[mapkey]));
                            #else
                                ${prop.second_otype}ReadV(buffarr, obj->${prop.name}[mapkey]);
                            #end if
                            }
                        }

                        buffarr.SetPosition(origin_position + len);
                    } else {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr);
                    }
                }
            #else if $prop.type == "mixmap" or $prop.type == "mixomap" 
                {
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_BYTES) {
                        int32 len = buffarr.ReadVarUInt();
                        int32 origin_position = buffarr.GetPosition();

                    #if $baseids.get($prop.second_otype) == None 
                        uint8 option_bits = buffarr.ReadUByte();
                        bool is_delta_mode = (option_bits & 0x1);
                        uint32 mapsize = buffarr.ReadVarUInt();
                        buffarr.Skip(1);

                        ${prop.first_otype} mapkey;
                        if (is_delta_mode) {
                            for(uint32 i = 0; i < mapsize; ++i) {
                                bool is_delete = buffarr.ReadBool();
                                ${prop.first_otype}ReadV(buffarr, mapkey);
                                if (is_delete) {
                                    obj->${prop.name}.erase(mapkey);
                                } else {
                                #if "refptr" in $prop
                                    ${prop.second_otype}* olditm = obj->${prop.name}[mapkey].${prop.refptr}();
                                #else
                                    ${prop.second_otype}* olditm = obj->${prop.name}[mapkey];
                                #end if
                                    ${prop.second_otype}* newitm = ${prop.second_otype}F::Read${prop.second_otype}(buffarr, olditm);
                                    if (newitm != olditm) {
                                        obj->${prop.name}[mapkey] = newitm;
                                        if (newitm) {
                                        #if "refone" in $prop
                                            newitm->${prop.refone}();
                                        #end if
                                        }
                                    }
                                }
                            }
                        } else {
                            obj->${prop.name}.clear();
                            for(uint32 i = 0; i < mapsize; ++i) {
                                ${prop.first_otype}ReadV(buffarr, mapkey);
                                ${prop.second_otype}* itm = ${prop.second_otype}F::Read${prop.second_otype}(buffarr);
                                if(itm) {
                                    obj->${prop.name}[mapkey] = itm;
                                #if "refone" in $prop
                                    itm->${prop.refone}();
                                #end if
                                } else {
                                    LOG_WARNING("${prop.second_otype} read failed");
                                }
                            }
                        }
                    #else
                        #silent $sys.stderr.write("mixmap Only supports the definition of the Object type\n")
                    #end if

                        buffarr.SetPosition(origin_position + len);
                    } else {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr);
                    }
                }
            #else if $prop.type == "arr" 
                {
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_ARRAY) {
                        uint32 arrsize = buffarr.ReadVarUInt();
                    #if "clear" in $prop 
                        obj->${prop.clear}();
                    #else
                        #if "arrclear" in $prop
                        obj->${prop.name}.${prop.arrclear}();
                        #else
                        obj->${prop.name}.clear();/// clear arr
                        #end if
                    #end if

                    #if $baseids.get($prop.otype) == None
                        buffarr.Skip(1);
                        for(uint32 i = 0 ;i < arrsize; i ++) {
                        #if "arrpush" in $prop
                            obj->${prop.name}.${prop.arrpush}(${prop.otype}());
                        #else
                            obj->${prop.name}.push_back(${prop.otype}());
                        #end if
                        #if "arrback" in $prop
                            auto& itm = obj->${prop.name}.${prop.arrback}();
                        #else
                            auto& itm = obj->${prop.name}.back();
                        #end if
                            ${prop.otype}F::Read(buffarr,&itm);
                        #if "call" in $prop 
                            ///如果有CALL需要调用下元素的CALL
                            obj->${prop.call}(itm);
                        #end if
                        }
                    #else
                        uint8 item_type = buffarr.ReadUByte();
                        for(uint32 i = 0 ;i < arrsize; i ++) {
                            ${prop.otype} itm;
                            baseTypeReadV(buffarr, item_type, ${prop.otype}, itm);
                            #if "arrpush" in $prop
                            obj->${prop.name}.${prop.arrpush}(itm);
                            #else
                            obj->${prop.name}.push_back(itm);
                            #end if
                        }
                    #end if
                    } else if(valueType == OT_BYTES) { // delta mode
                        uint32 arrsize = buffarr.ReadVarUInt();
                        uint32 changesize = buffarr.ReadVarUInt();
                        obj->${prop.name}.resize(arrsize);
                    #if $baseids.get($prop.otype) == None 
                        buffarr.Skip(1);
                        for(uint32 i = 0; i < changesize; ++i) {
                            uint32 cidx = buffarr.ReadVarUInt();
                            if (cidx < arrsize) {
                                ${prop.otype}F::Read(buffarr,&(obj->${prop.name}[cidx]));
                            #if "call" in $prop 
                                ///如果有CALL需要调用下元素的CALL
                                obj->${prop.call}(itm);
                            #end if
                            }
                        }
                    #else
                        uint8 item_type = buffarr.ReadUByte();
                        for(uint32 i = 0; i < arrsize; ++i) {
                            uint32 cidx = buffarr.ReadVarUInt();
                            if (cidx < arrsize) {
                                baseTypeReadV(buffarr, item_type, ${prop.otype}, obj->${prop.name}[cidx]);
                            }
                        }
                    #end if
                    } else {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr);
                    }
                }
            #else if $prop.type == "mixarr" 
                {
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_MIXARRAY) {
                        uint32 arrsize = buffarr.ReadVarUInt();
                    #if "clear" in $prop 
                        obj->${prop.clear}();
                    #else
                        #if $prop.arrclear != None
                        obj->${prop.name}.${prop.arrclear}();
                        #else
                        obj->${prop.name}.clear();/// clear arr Memory Leak
                        #end if
                    #end if

                    #if $baseids.get($prop.otype) == None 
                        for(uint32 i = 0 ;i < arrsize; i ++) {
                            ${prop.otype}* itm = ${prop.otype}F::Read${prop.otype}(buffarr);
                            if(itm) {
                            #if "call" in $prop 
                                obj->${prop.call}(itm);
                            #end if
                            #if "read" in $prop
                                obj->${prop.read}(itm);
                            #else if $prop.arrpush != None
                                obj->${prop.name}.${prop.arrpush}(itm);
                            #else
                                obj->${prop.name}.push_back(itm);
                            #end if
                            #if "refone" in $prop
                                itm->${prop.refone}();
                            #end if
                            } else {
                                LOG_WARNING("${prop.otype} read failed");
                            }
                        }
                    #else
                        #silent $sys.stderr.write("mixarr Only supports the definition of the Object type\n")
                    #end if
                    } else if(valueType == OT_BYTES) { // delta mode
                        uint32 arrsize = buffarr.ReadVarUInt();
                        uint32 changesize = buffarr.ReadVarUInt();
                        obj->${prop.name}.resize(arrsize);
                    #if $baseids.get($prop.otype) == None 
                        for(uint32 i = 0 ;i < changesize; i ++) {
                            uint32 cidx = buffarr.ReadVarUInt();
                            if (cidx < arrsize) {
                            #if "refptr" in $prop
                                ${prop.otype}* olditm = obj->${prop.name}[cidx].${prop.refptr}();
                            #else
                                ${prop.otype}* olditm = obj->${prop.name}[cidx];
                            #end if
                                ${prop.otype}* newitm = ${prop.otype}F::Read${prop.otype}(buffarr, olditm);
                                if(newitm != olditm) {
                                    obj->${prop.name}[cidx] = newitm;
                                #if "call" in $prop 
                                    obj->${prop.call}(newitm);
                                #end if
                                #if "refone" in $prop
                                    if (newitm) newitm->${prop.refone}();
                                #end if
                                }
                            }
                        }
                    #else
                        #silent $sys.stderr.write("mixarr Only supports the definition of the Object type\n")
                    #end if
                    } else {
                        buffarr.Skip(-1);
                        KFDataFormat::SkipValue(buffarr);
                    }
                }
            #else if $prop.type == "object" 
                if(buffarr.ReadUByte() == OT_OBJECT) {
                    ${prop.otype}F::Read(buffarr,&obj->${prop.name});
                } else {
                    buffarr.Skip(-1);
                    KFDataFormat::SkipValue(buffarr);
                }
            #else if $prop.type == "mixobject" 
                {
                    ///mix object self checking 
                #if "refptr" in $prop
                    auto oldval = obj->${prop.name}.${prop.refptr}();
                    auto newval = ${prop.otype}F::Read${prop.otype}(buffarr,oldval);
                    if(oldval != newval) {
                    #if "clear" in $prop
                        obj->${prop.clear}();
                    #end if
                        obj->${prop.name} = newval;
                    #if "refone" in $prop
                        obj->${prop.name}.${prop.refone}();
                    #end if
                    }
                #else
                    auto oldval = obj->${prop.name};
                    auto newval = ${prop.otype}F::Read${prop.otype}(buffarr,oldval);
                    if(oldval != newval) {
                    #if "clear" in $prop
                        obj->${prop.clear}();
                    #else
                        kfDel(obj->${prop.name});
                    #end if
                        obj->${prop.name} = newval;
                    }
                #end if
                }
            #else
                baseTypeReadTV(buffarr, ${baseids.get($prop.type)}, ${prop.type}, obj->${prop.name});
            #end if
                break;
        #end for
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

    void ${data.class}F::Write(KFByteArray& buffarr,${data.class}* obj,KFDDirtys* dirtys) {
        if (!obj) return;
        buffarr.WriteVarUInt(OBJ_PROP_ID_BEGIN);
        #if $data.extend
        ${data.extend}F::Write(buffarr,obj,dirtys);
        #end if

        #if len($data.propertys) != 0
        EKFDPropertyFlag flag;
        #end if
#for $prop in $data.propertys
    #if $prop.transient == 1
        flag = EKFDPropertyFlag::Transient;
    #else if $prop.net == "never"
        flag = EKFDPropertyFlag::NetNever;
    #else if $prop.net == "only"
        flag = EKFDPropertyFlag::NetOnly;
    #else
        flag = EKFDPropertyFlag::Default;
    #end if
        if (IsFieldNeedToWrite(obj, &obj->${prop.name}, dirtys, flag)) {
            buffarr.WriteVarUInt(${prop.id}); // pid
    #if $prop.write != None
            buffarr.WriteByte(OT_BYTES);
            KFDataFormat::ClearUseBuff.Clear();
            obj->${prop.write}(KFDataFormat::ClearUseBuff);
            buffarr.WritekfBytes(KFDataFormat::ClearUseBuff);
    #else if $prop.type == "map" or $prop.type == "omap"
            auto& static_buffarr = KFDataFormat::ClearUseBuff;
            static_buffarr.Clear();
            auto& mapitms = obj->${prop.name};
            if (dirtys && dirtys->IsDiffMode()) { // delta mode
                static_buffarr.WriteByte(0x1);
                static_buffarr.WriteVarUInt(dirtys->GetMarkMapFieldChangeCnt<${prop.first_otype}>(obj, &obj->${prop.name}));
                static_buffarr.WriteByte(ConvertInt2VarInt(${baseids.get($prop.first_otype)}));// first value type
            #if $baseids.get($prop.second_otype) == None 
                static_buffarr.WriteByte(OT_OBJECT); // second value type
            #else
                static_buffarr.WriteByte(ConvertInt2VarInt(${baseids.get($prop.second_otype)}));// second value type
            #end if
                for(auto& item : mapitms) {
                    bool is_delete = false;
                    if (dirtys->IsMarkMapFieldChange<${prop.first_otype}>(obj, &obj->${prop.name}, item.first, is_delete)) {
                        static_buffarr.WriteBool(is_delete);
                        ${prop.first_otype}WriteV(static_buffarr,item.first);
                        if (!is_delete) {
                        #if $baseids.get($prop.second_otype) == None 
                            ${prop.second_otype}F::Write(static_buffarr,&item.second,dirtys);
                        #else
                            ${prop.second_otype}WriteV(static_buffarr,item.second);
                        #end if
                        }
                    }
                }
            } else {
                static_buffarr.WriteByte(0x0);
                static_buffarr.WriteVarUInt(kf_2_uint32(mapitms.size()));
                static_buffarr.WriteByte(ConvertInt2VarInt(${baseids.get($prop.first_otype)}));// first value type
            #if $baseids.get($prop.second_otype) == None 
                static_buffarr.WriteByte(OT_OBJECT); // second value type
            #else
                static_buffarr.WriteByte(ConvertInt2VarInt(${baseids.get($prop.second_otype)}));// second value type
            #end if
                for(auto& item : mapitms) {
                    ${prop.first_otype}WriteV(static_buffarr,item.first);
                #if $baseids.get($prop.second_otype) == None 
                    ${prop.second_otype}F::Write(static_buffarr,&item.second,dirtys);
                #else
                    ${prop.second_otype}WriteV(static_buffarr,item.second);
                #end if
                }
            }
            buffarr.WriteByte(OT_BYTES);
            buffarr.WritekfBytes(static_buffarr);
    #else if $prop.type == "mixmap" or $prop.type == "mixomap"
            auto& static_buffarr = KFDataFormat::ClearUseBuff;
            static_buffarr.Clear();
            auto& mapitms = obj->${prop.name};
            if (dirtys && dirtys->IsDiffMode()) { // delta mode
                static_buffarr.WriteByte(0x3);
                static_buffarr.WriteVarUInt(dirtys->GetMarkMapFieldChangeCnt<${prop.first_otype}>(obj, &obj->${prop.name}));
                static_buffarr.WriteByte(ConvertInt2VarInt(${baseids.get($prop.first_otype)}));// first value type
                for(auto& item : mapitms) {
                    bool is_delete = false;
                    if (dirtys->IsMarkMapFieldChange<${prop.first_otype}>(obj, &obj->${prop.name}, item.first, is_delete)) {
                        static_buffarr.WriteBool(is_delete);
                        ${prop.first_otype}WriteV(static_buffarr,item.first);
                        if (!is_delete) {
                        #if "refptr" in $prop
                            ${prop.second_otype}F::Write${prop.second_otype}(static_buffarr,item.second.${prop.refptr}(),dirtys);
                        #else
                            ${prop.second_otype}F::Write${prop.second_otype}(static_buffarr,item.second,dirtys);
                        #end if
                        }
                    }
                }
            } else {
                static_buffarr.WriteByte(0x2);
                static_buffarr.WriteVarUInt(kf_2_uint32(mapitms.size()));
                static_buffarr.WriteByte(ConvertInt2VarInt(${baseids.get($prop.first_otype)}));// first value type
                for(auto& item : mapitms)
                {
                    ${prop.first_otype}WriteV(static_buffarr,item.first);
                #if "refptr" in $prop
                    ${prop.second_otype}F::Write${prop.second_otype}(static_buffarr,item.second.${prop.refptr}(),dirtys);
                #else
                    ${prop.second_otype}F::Write${prop.second_otype}(static_buffarr,item.second,dirtys);
                #end if
                }
            }
            buffarr.WriteByte(OT_BYTES);
            buffarr.WritekfBytes(static_buffarr);
    #else if $prop.type == "arr" 
            if (dirtys && dirtys->IsDiffMode()) { // delta mode
                buffarr.WriteByte(OT_BYTES);///write arr type
                auto& arritms = obj->${prop.name};
            #if "arrsize" in $prop
                uint32 arrsize = kf_2_uint32(arritms.${prop.arrsize}());
            #else
                uint32 arrsize = kf_2_uint32(arritms.size());
            #end if
                buffarr.WriteVarUInt(arrsize);
                auto& change_indexs = dirtys->GetMarkArrayFieldIndex(obj, &obj->${prop.name});
                buffarr.WriteVarUInt(kf_2_uint32(change_indexs.size()));
            #if $baseids.get($prop.otype) == None 
                buffarr.WriteByte(OT_OBJECT);///write object type
                for(auto i: change_indexs) {
                    buffarr.WriteVarUInt(i);
                    ${prop.otype}F::Write(buffarr,&arritms[i],dirtys);
                }
            #else
                buffarr.WriteByte(ConvertInt2VarInt(${baseids.get($prop.otype)}));///write base value type
                for(auto i: change_indexs) {
                    buffarr.WriteVarUInt(i);
                    ${prop.otype}WriteV(buffarr,arritms[i]);
                }
            #end if
            } else {
                buffarr.WriteByte(${typeids.get($prop.type)});///write arr type
                auto& arritms = obj->${prop.name};
            #if "arrsize" in $prop
                uint32 arrsize = kf_2_uint32(arritms.${prop.arrsize}());
            #else
                uint32 arrsize = kf_2_uint32(arritms.size());
            #end if
                buffarr.WriteVarUInt(arrsize);

            #if $baseids.get($prop.otype) == None 
                buffarr.WriteByte(OT_OBJECT);///write object type
                for(uint32 i = 0; i < arrsize; ++i) {
                    ${prop.otype}F::Write(buffarr,&arritms[i],dirtys);
                }
            #else
                buffarr.WriteByte(ConvertInt2VarInt(${baseids.get($prop.otype)}));///write base value type
                for(uint32 i = 0; i < arrsize; ++i) {
                    ${prop.otype}WriteV(buffarr,arritms[i]);
                }
            #end if
            }
    #else if $prop.type == "mixarr" 
            if (dirtys && dirtys->IsDiffMode()) { // delta mode
                buffarr.WriteByte(OT_BYTES);
                auto& arritms = obj->${prop.name};
                #if "arrsize" in $prop
                uint32 arrsize = kf_2_uint32(arritms.${prop.arrsize}());
                #else
                uint32 arrsize = kf_2_uint32(arritms.size());
                #end if
                buffarr.WriteVarUInt(arrsize);
                auto& change_indexs = dirtys->GetMarkArrayFieldIndex(obj, &obj->${prop.name});
                buffarr.WriteVarUInt(kf_2_uint32(change_indexs.size()));
                for(auto i :change_indexs) {
                    buffarr.WriteVarUInt(i);
                #if "refptr" in $prop
                    ${prop.otype}F::Write${prop.otype}(buffarr,arritms[i].${prop.refptr}(),dirtys);
                #else
                    ${prop.otype}F::Write${prop.otype}(buffarr,arritms[i],dirtys);
                #end if
                }
            } else {
                buffarr.WriteByte(${typeids.get($prop.type)});///write mixarr type
            #if "write" in $prop
                obj->${prop.write}(buffarr);
            #else
                auto& arritms = obj->${prop.name};
                #if "arrsize" in $prop
                uint32 arrsize = kf_2_uint32(arritms.${prop.arrsize}());
                #else
                uint32 arrsize = kf_2_uint32(arritms.size());
                #end if
                buffarr.WriteVarUInt(arrsize);
                for(uint32 i = 0; i < arrsize; ++i) {
                #if "refptr" in $prop
                    ${prop.otype}F::Write${prop.otype}(buffarr,arritms[i].${prop.refptr}(),dirtys);
                #else
                    ${prop.otype}F::Write${prop.otype}(buffarr,arritms[i],dirtys);
                #end if
                }
            #end if
            }
    #else if $prop.type == "object" 
            buffarr.WriteByte(OT_OBJECT);///write object type
            ${prop.otype}F::Write(buffarr,&obj->${prop.name},dirtys);
    #else if $prop.type == "mixobject" 
        #if "refptr" in $prop
            ${prop.otype}F::Write${prop.otype}(buffarr,obj->${prop.name}.${prop.refptr}(),dirtys);
        #else
            ${prop.otype}F::Write${prop.otype}(buffarr,obj->${prop.name},dirtys);
        #end if
    #else
            ${prop.type}WriteTV(buffarr,obj->${prop.name});
    #end if
        }

#end for
        buffarr.WriteVarUInt(OBJ_PROP_ID_END);
    }

    bool ${data.class}F::Diff(${data.class}* old_obj,${data.class}* new_obj,KFDDirtys* dirtys) {
        if(!old_obj || !new_obj) {
            return old_obj != new_obj;
        }

        bool is_changed = false;
        #if $data.extend 
        is_changed |= ${data.extend}F::Diff(old_obj, new_obj, dirtys);
        #end if
        #if len($data.propertys) != 0
        EKFDPropertyFlag flag;
        #end if
#for $prop in $data.propertys
    #if $prop.transient == 1
        flag = EKFDPropertyFlag::Transient;
    #else if $prop.net == "never"
        flag = EKFDPropertyFlag::NetNever;
    #else if $prop.net == "only"
        flag = EKFDPropertyFlag::NetOnly;
    #else
        flag = EKFDPropertyFlag::Default;
    #end if
    #if $prop.diff != None
        {
            if(IsFieldNeedToDiff(dirtys, flag) && new_obj->${prop.diff}(old_obj)) {
                if(dirtys) dirtys->MarkField(new_obj, &new_obj->${prop.name});
                is_changed = true;
            }
        }
    #else if $prop.type == "map" or $prop.type == "omap"
        {
            std::function<bool(${prop.second_otype}&, ${prop.second_otype}&, KFDDirtys*)> diff_fn =
                [](${prop.second_otype}& o, ${prop.second_otype}& n, KFDDirtys* d)->bool{
            #if $baseids.get($prop.second_otype) == None 
                return ${prop.second_otype}F::Diff(&o, &n, d);
            #else
                return !IsKFDValueEqual(o, n);
            #end if
            };
            auto& old_items = old_obj->${prop.name};
            auto& new_items = new_obj->${prop.name};
            is_changed |= IsFieldNeedToDiff(dirtys, flag) && KFDDiffMap(new_obj, old_items, new_items, diff_fn, dirtys);
        }
    #else if $prop.type == "mixmap" or $prop.type == "mixomap"
        {
            #if "refptr" in $prop
            std::function<bool(kfRef<${prop.second_otype}>&, kfRef<${prop.second_otype}>&, KFDDirtys*)> diff_fn =
                [](kfRef<${prop.second_otype}>& o, kfRef<${prop.second_otype}>& n, KFDDirtys* d)->bool{
                return ${prop.second_otype}F::Diff${prop.second_otype}(o.${prop.refptr}(), n.${prop.refptr}(), d);
            #else
            std::function<bool(${prop.second_otype}*&, ${prop.second_otype}*&, KFDDirtys*)> diff_fn =
                [](${prop.second_otype}*& o, ${prop.second_otype}*& n, KFDDirtys* d)->bool{
                return ${prop.second_otype}F::Diff${prop.second_otype}(o, n, d);
            #end if
            };
            auto& old_items = old_obj->${prop.name};
            auto& new_items = new_obj->${prop.name};
            is_changed |= IsFieldNeedToDiff(dirtys, flag) && KFDDiffMap(new_obj, old_items, new_items, diff_fn, dirtys);
        }
    #else if $prop.type == "arr"
        {
            std::function<bool(${prop.otype}&, ${prop.otype}&, KFDDirtys*)> diff_fn =
                [](${prop.otype}& o, ${prop.otype}& n, KFDDirtys* d)->bool{
            #if $baseids.get($prop.otype) == None 
                return ${prop.otype}F::Diff(&o, &n, d);
            #else
                return !IsKFDValueEqual(o, n);
            #end if
            };
            auto& old_items = old_obj->${prop.name};
            auto& new_items = new_obj->${prop.name};
            is_changed |= IsFieldNeedToDiff(dirtys, flag) && KFDDiffArray(new_obj, old_items, new_items, diff_fn, dirtys);
        }
    #else if $prop.type == "mixarr"
        {
            #if "refptr" in $prop
            std::function<bool(kfRef<${prop.otype}>&, kfRef<${prop.otype}>&, KFDDirtys*)> diff_fn =
                [](kfRef<${prop.otype}>& o, kfRef<${prop.otype}>& n, KFDDirtys* d)->bool{
                return ${prop.otype}F::Diff${prop.otype}(o.${prop.refptr}(), n.${prop.refptr}(), d);
            #else
            std::function<bool(${prop.otype}*&, ${prop.otype}*&, KFDDirtys*)> diff_fn =
                [](${prop.otype}*& o, ${prop.otype}*& n, KFDDirtys* d)->bool{
                return ${prop.otype}F::Diff${prop.otype}(o, n, d);
            #end if
            };
            auto& old_items = old_obj->${prop.name};
            auto& new_items = new_obj->${prop.name};
            is_changed |= IsFieldNeedToDiff(dirtys, flag) && KFDDiffArray(new_obj, old_items, new_items, diff_fn, dirtys);
        }
    #else if $prop.type == "object" 
        if(IsFieldNeedToDiff(dirtys, flag) && ${prop.otype}F::Diff(&old_obj->${prop.name}, &new_obj->${prop.name}, dirtys)) {
            if(dirtys) dirtys->MarkField(new_obj, &new_obj->${prop.name});
            is_changed = true;
        }
    #else if $prop.type == "mixobject" 
        #if "refptr" in $prop
        if(IsFieldNeedToDiff(dirtys, flag) && ${prop.otype}F::Diff${prop.otype}(old_obj->${prop.name}.${prop.refptr}(), new_obj->${prop.name}.${prop.refptr}(), dirtys)) {
        #else
        if(IsFieldNeedToDiff(dirtys, flag) && ${prop.otype}F::Diff${prop.otype}(old_obj->${prop.name}, new_obj->${prop.name}, dirtys)) {
        #end if
            if(dirtys) dirtys->MarkField(new_obj, &new_obj->${prop.name});
            is_changed = true;
        }
    #else
        if(IsFieldNeedToDiff(dirtys, flag) && !IsKFDValueEqual(old_obj->${prop.name}, new_obj->${prop.name})) {
            if(dirtys) dirtys->MarkField(new_obj, &new_obj->${prop.name});
            is_changed = true;
        }
    #end if
#end for
        return is_changed;
    }

    ${data.class}* ${data.class}F::CompactRead(KFByteArray& buffarr,${data.class}* obj)
    {
        uint8 option = buffarr.ReadUByte();
        if (option == 0) return nullptr;

        if(obj == nullptr) {
            #if $data.newfunc != None
            obj = ${data.newfunc}(buffarr);
            #else
            obj = kfNewObject(${data.class});
            #end if
        }
        #if $data.extend 

        ${data.extend}F::CompactRead(buffarr,obj);

        #end if
#for $prop in $data.propertys
    #if $prop.transient == 1
        // transient: {${prop.name}}, skip
    #else if $prop.net == "never"
        // net never: {${prop.name}}, skip
    #else if $prop.read != None
        {
            int32 len = buffarr.ReadVarUInt();
            int32 origin_position = buffarr.GetPosition();
            obj->${prop.read}(buffarr, len);
            buffarr.SetPosition(origin_position + len);
        }
    #else if $prop.type == "map" or $prop.type == "omap"
        {
            uint32 mapsize = buffarr.ReadVarUInt();
            obj->${prop.name}.clear();

            ${prop.first_otype} mapkey;
            for(uint32 i = 0; i < mapsize; ++i) {
                ${prop.first_otype}ReadV(buffarr,mapkey);
            #if $baseids.get($prop.second_otype) == None 
                ${prop.second_otype}F::CompactRead(buffarr,&(obj->${prop.name}[mapkey]));
            #else
                ${prop.second_otype}ReadV(buffarr,obj->${prop.name}[mapkey]);
            #end if
            }
        }
    #else if $prop.type == "mixmap" or $prop.type == "mixomap"
        {
            uint32 mapsize = buffarr.ReadVarUInt();
            obj->${prop.name}.clear();

        #if $baseids.get($prop.second_otype) == None 
            ${prop.first_otype} mapkey;
            for(uint32 i = 0; i < mapsize; ++i) {
                ${prop.first_otype}ReadV(buffarr,mapkey);
                ${prop.second_otype}* itm = ${prop.second_otype}F::CompactRead${prop.second_otype}(buffarr);
                if(itm) {
                    obj->${prop.name}[mapkey] = itm;
                #if "call" in $prop 
                    obj->${prop.call}(itm);
                #end if
                #if "refone" in $prop
                    itm->${prop.refone}();
                #end if
                } else {
                    LOG_WARNING("${prop.otype} read failed");
                }
            }
        #else
            #silent $sys.stderr.write("mixmap or mixomap Only supports the definition of the Object type\n")
        #end if
        }
    #else if $prop.type == "arr" 
        {
            uint32 arrsize = buffarr.ReadVarUInt();
        #if "clear" in $prop 
            obj->${prop.clear}();
        #else
            #if "arrclear" in $prop
            obj->${prop.name}.${prop.arrclear}();
            #else
            obj->${prop.name}.clear();/// clear arr
            #end if
        #end if

        #if $baseids.get($prop.otype) == None 
            for(uint32 i = 0 ;i < arrsize; i ++) {
            #if "arrpush" in $prop
                obj->${prop.name}.${prop.arrpush}(${prop.otype}());
            #else
                obj->${prop.name}.push_back(${prop.otype}());
            #end if
            #if "arrback" in $prop
                auto& itm = obj->${prop.name}.${prop.arrback}();
            #else
                auto& itm = obj->${prop.name}.back();
            #end if
                ${prop.otype}F::CompactRead(buffarr,&itm);
                ///如果有CALL需要调用下元素的CALL
            #if "call" in $prop 
                obj->${prop.call}(itm);
            #end if
            }
        #else
            for(uint32 i = 0 ;i < arrsize; i ++) {
                ${prop.otype} itm;
                ${prop.otype}ReadV(buffarr,itm);
                #if "arrpush" in $prop
                obj->${prop.name}.${prop.arrpush}(itm);
                #else
                obj->${prop.name}.push_back(itm);
                #end if
            }
        #end if
        }
    #else if $prop.type == "mixarr" 
        {
            uint32 arrsize = buffarr.ReadVarUInt();
        #if "clear" in $prop 
            obj->${prop.clear}();
        #else
            #if $prop.arrclear != None
            obj->${prop.name}.${prop.arrclear}();
            #else
            obj->${prop.name}.clear();/// clear arr Memory Leak
            #end if
        #end if

        #if $baseids.get($prop.otype) == None 
            for(uint32 i = 0 ;i < arrsize; i ++) {
                ${prop.otype}* itm = ${prop.otype}F::CompactRead${prop.otype}(buffarr);
                if(itm) {
                #if "call" in $prop 
                    obj->${prop.call}(itm);
                #end if
                #if "read" in $prop
                    obj->${prop.read}(itm);
                #else if $prop.arrpush != None
                    obj->${prop.name}.${prop.arrpush}(itm);
                #else
                    obj->${prop.name}.push_back(itm);
                #end if
                #if "refone" in $prop
                    itm->${prop.refone}();
                #end if
                } else {
                    LOG_WARNING("${prop.otype} read failed");
                }
            }
        #else
            #silent $sys.stderr.write("mixarr Only supports the definition of the Object type\n")
        #end if
        }
    #else if $prop.type == "object" 
        ${prop.otype}F::CompactRead(buffarr,&obj->${prop.name});
    #else if $prop.type == "mixobject" 
        {
        #if "refptr" in $prop
            auto oldval = obj->${prop.name}.${prop.refptr}();
            auto newval = ${prop.otype}F::CompactRead${prop.otype}(buffarr,oldval);
            if(oldval != newval) {
            #if "clear" in $prop
                obj->${prop.clear}();
            #end if
                obj->${prop.name} = newval;
            #if "refone" in $prop
                obj->${prop.name}.${prop.refone}();
            #end if
            }
        #else
            auto oldval = obj->${prop.name};
            auto newval = ${prop.otype}F::CompactRead${prop.otype}(buffarr,oldval);
            if(oldval != newval) {
            #if "clear" in $prop
                obj->${prop.clear}();
            #else
                kfDel(obj->${prop.name});
            #end if
                obj->${prop.name} = newval;
            }
        #end if
        }
    #else
        ${prop.type}ReadV(buffarr,obj->${prop.name});
    #end if
#end for

        return obj;
    }

    void ${data.class}F::CompactWrite(KFByteArray& buffarr,${data.class}* obj) {
        if (!obj) {
            buffarr.WriteByte(0); // NULL
            return;
        }
        buffarr.WriteByte(1); // NOT NULL
        #if $data.extend
        ${data.extend}F::CompactWrite(buffarr,obj);
        #end if

#for $prop in $data.propertys
    #if $prop.transient == 1
        // transient: {${prop.name}}, skip
    #else if $prop.net == "never"
        // net never: {${prop.name}}, skip
    #else if $prop.write != None
        {
            KFDataFormat::ClearUseBuff.Clear();
            obj->${prop.write}(KFDataFormat::ClearUseBuff);
            buffarr.WritekfBytes(KFDataFormat::ClearUseBuff);
        }
    #else if $prop.type == "map" or $prop.type == "omap"
        {
            auto& mapitms = obj->${prop.name};
            buffarr.WriteVarUInt(kf_2_uint32(mapitms.size()));
            for(auto& item : mapitms) {
                ${prop.first_otype}WriteV(buffarr,item.first);
            #if $baseids.get($prop.second_otype) == None
                ${prop.second_otype}F::CompactWrite(buffarr,&item.second);
            #else
                ${prop.second_otype}WriteV(buffarr,item.second);
            #end if
            }
        }
    #else if $prop.type == "mixmap" or $prop.type == "mixomap"
        {
            auto& mapitms = obj->${prop.name};
            buffarr.WriteVarUInt(kf_2_uint32(mapitms.size()));
            for(auto& item : mapitms) {
                ${prop.first_otype}WriteV(buffarr,item.first);
            #if "refptr" in $prop
                ${prop.second_otype}F::CompactWrite${prop.second_otype}(buffarr,item.second.${prop.refptr}());
            #else
                ${prop.second_otype}F::CompactWrite${prop.second_otype}(buffarr,item.second);
            #end if
            }
        }
    #else if $prop.type == "arr"
        {
            auto& arritms = obj->${prop.name};
        #if "arrsize" in $prop
            uint32 arrsize = kf_2_uint32(arritms.${prop.arrsize}());
        #else
            uint32 arrsize = kf_2_uint32(arritms.size());
        #end if
            buffarr.WriteVarUInt(arrsize);

        #if $baseids.get($prop.otype) == None
            for(uint32 i = 0 ;i < arrsize; i ++) {
                ${prop.otype}F::CompactWrite(buffarr,&arritms[i]);
            }
        #else
            for(uint32 i = 0 ;i < arrsize; i ++) {
                ${prop.otype}WriteV(buffarr,arritms[i]);
            }
        #end if
        }
    #else if $prop.type == "mixarr"
        #if "write" in $prop
        obj->${prop.write}(buffarr);
        #else
        {
            auto& arritms = obj->${prop.name};
            #if "arrsize" in $prop
            uint32 arrsize = kf_2_uint32(arritms.${prop.arrsize}());
            #else
            uint32 arrsize = kf_2_uint32(arritms.size());
            #end if
            buffarr.WriteVarUInt(arrsize);
            for(uint32 i = 0 ;i < arrsize; i ++) {
            #if "refptr" in $prop
                ${prop.otype}F::CompactWrite${prop.otype}(buffarr,arritms[i].${prop.refptr}());
            #else
                ${prop.otype}F::CompactWrite${prop.otype}(buffarr,arritms[i]);
            #end if
            }
        }
        #end if
    #else if $prop.type == "object"
        ${prop.otype}F::CompactWrite(buffarr,&obj->${prop.name});
    #else if $prop.type == "mixobject"
        #if "refptr" in $prop
        ${prop.otype}F::CompactWrite${prop.otype}(buffarr,obj->${prop.name}.${prop.refptr}());
        #else
        ${prop.otype}F::CompactWrite${prop.otype}(buffarr,obj->${prop.name});
        #end if
    #else
        ${prop.type}WriteV(buffarr,obj->${prop.name});
    #end if
#end for
    }

#if $data.typedef == 1 
    ${data.class}* ${data.class}F::Read${data.class}(KFByteArray& buffarr,${data.class}* obj /*= nullptr*/) {
        return ${data.class}TypeDef::Read(buffarr,obj);
    }
    void ${data.class}F::Write${data.class}(KFByteArray& buffarr,${data.class}* obj,KFDDirtys* dirtys) {
        ${data.class}TypeDef::Write(buffarr,obj,dirtys);
    }
    bool ${data.class}F::Diff${data.class}(${data.class}* old_obj, ${data.class}* new_obj,KFDDirtys* dirtys) {
        return ${data.class}TypeDef::Diff(old_obj, new_obj, dirtys);
    }
    ${data.class}* ${data.class}F::CompactRead${data.class}(KFByteArray& buffarr,${data.class}* obj /*= nullptr*/) {
        return ${data.class}TypeDef::CompactRead(buffarr,obj);
    }
    void ${data.class}F::CompactWrite${data.class}(KFByteArray& buffarr,${data.class}* obj) {
        ${data.class}TypeDef::CompactWrite(buffarr,obj);
    }
#else
    ${data.class}* ${data.class}F::Read${data.class}(KFByteArray& buffarr,${data.class}* obj /*= nullptr*/) {
        return static_cast<${data.class}*>(KFDataFormat::ReadAnyObject(buffarr, "${data.class}", obj));
    }
    void ${data.class}F::Write${data.class}(KFByteArray& buffarr,${data.class}* obj,KFDDirtys* dirtys) {
        KFDataFormat::WriteAnyObject(buffarr, "${data.class}", obj, dirtys);
    }
    bool ${data.class}F::Diff${data.class}(${data.class}* old_obj,${data.class}* new_obj,KFDDirtys* dirtys) {
        return KFDataFormat::DiffAnyObject("${data.class}", old_obj, "${data.class}", new_obj, dirtys);
    }
    ${data.class}* ${data.class}F::CompactRead${data.class}(KFByteArray& buffarr,${data.class}* obj /*= nullptr*/) {
        return static_cast<${data.class}*>(KFDataFormat::CompactReadAnyObject(buffarr, obj));
    }
    void ${data.class}F::CompactWrite${data.class}(KFByteArray& buffarr,${data.class}* obj) {
        KFDataFormat::CompactWriteAnyObject(buffarr, "${data.class}", obj);
    }
#end if

#end for
}