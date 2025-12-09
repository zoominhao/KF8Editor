#for $includestr in $includes 
\#include "${includestr}"
#end for

namespace ${NS} {
#for $data in $datas
    KFDFieldResult ${data.class}R::GetField(kfAny obj, const kfname& fieldname, kfAny index) {
        KFDFieldResult result;
        if (!obj) return result;
        #if len($data.propertys) != 0
        ${data.class}* typeobject = static_cast<${data.class}*>(obj);
        result.IsSuccess = true;
        result.FieldName = fieldname;
        #end if
#for $prop in $data.propertys
        static const kfname __k_${prop.name} = "${prop.name}";
        if (fieldname == __k_${prop.name}) {
    #if $prop.type in ["map", "mixmap", "omap", "mixomap"]
            if (index) {
            #if $baseids.get($prop.second_otype) == None 
                result.IsGCObject = std::is_base_of<KFGCObject, ${prop.second_otype}>::value;
                #if $prop.type == "map" or $prop.type == "omap"
                result.FieldType = OT_OBJECT;
                #else
                result.FieldType = OT_MIXOBJECT;
                #end if
                result.ClsName = "$prop.second_otype";
            #else
                result.FieldType = ${baseids.get($prop.second_otype)};
                #if $prop.second_otype == "kfname"
                result.IsFieldTypeKFName = true;
                #end if
            #end if
                auto mapkey = static_cast<${prop.first_otype}*>(index);
                if (typeobject->${prop.name}.count(*mapkey)) {
                #if $prop.type == "map" or $prop.type == "omap"
                    result.FieldValue = &(typeobject->${prop.name}[*mapkey]);
                #else
                    #if "refptr" in $prop
                    result.FieldValue = typeobject->${prop.name}[*mapkey].${prop.refptr}();
                    #else
                    result.FieldValue = typeobject->${prop.name}[*mapkey];
                    #end if
                #end if
                }
            } else {
            #if $prop.type == "map"
                result.IsMap = true;
            #else if $prop.type == "mixmap"
                result.IsMixMap = true;
            #else if $prop.type == "omap"
                result.IsOMap = true;
            #else if $prop.type == "mixomap"
                result.IsMixOMap = true;
            #end if
                result.FieldType = ${typeids.get($prop.first_otype)};
            #if $baseids.get($prop.second_otype) == None 
                result.IsElemGCObject = std::is_base_of<KFGCObject, ${prop.second_otype}>::value;
                #if $prop.type == "map" or $prop.type == "omap"
                result.SecondType = OT_OBJECT;
                #else
                result.SecondType = OT_MIXOBJECT;
                #end if
                result.ClsName = "$prop.second_otype";
            #else
                result.SecondType = ${baseids.get($prop.second_otype)};
            #end if
                result.FieldValue = &(typeobject->${prop.name});
            }
    #else if $prop.type in ["arr", "mixarr"]
            if (index) {
            #if $baseids.get($prop.otype) == None 
                result.IsGCObject = std::is_base_of<KFGCObject, ${prop.otype}>::value;
                #if $prop.type == "arr"
                result.FieldType = OT_OBJECT;
                #else
                result.FieldType = OT_MIXOBJECT;
                #end if
                result.ClsName = "$prop.otype";
            #else
                result.FieldType = ${baseids.get($prop.otype)};
                #if $prop.otype == "kfname"
                result.IsFieldTypeKFName = true;
                #end if
            #end if
                auto& arritms = typeobject->${prop.name};
            #if "arrsize" in $prop
                uint32 arrsize = kf_2_uint32(arritms.${prop.arrsize}());
            #else
                uint32 arrsize = kf_2_uint32(arritms.size());
            #end if
                uint32 arrindex = *(static_cast<uint32*>(index));
                if (arrindex < arrsize) {
                #if $prop.type == "arr"
                    result.FieldValue = &(arritms[arrindex]);
                #else
                    #if "refptr" in $prop
                    result.FieldValue = arritms[arrindex].${prop.refptr}();
                    #else
                    result.FieldValue = arritms[arrindex];
                    #end if
                #end if
                }
            } else {
            #if $prop.type == "arr"
                result.FieldType = OT_ARRAY;
            #else
                result.FieldType = OT_MIXARRAY;
            #end if
            #if $baseids.get($prop.otype) == None 
                result.IsElemGCObject = std::is_base_of<KFGCObject, ${prop.otype}>::value;
                #if $prop.type == "arr"
                result.SecondType = OT_OBJECT;
                #else
                result.SecondType = OT_MIXOBJECT;
                #end if
                result.ClsName = "$prop.otype";
            #else
                result.SecondType = ${baseids.get($prop.otype)};
            #end if
                result.FieldValue = &(typeobject->${prop.name});
            }
    #else if $prop.type == "object"
            result.IsGCObject = std::is_base_of<KFGCObject, ${prop.otype}>::value;
            result.FieldType = OT_OBJECT;
            result.FieldValue = &(typeobject->${prop.name});
            result.ClsName = "$prop.otype";
    #else if $prop.type == "mixobject"
            result.IsGCObject = std::is_base_of<KFGCObject, ${prop.otype}>::value;
            result.FieldType = OT_MIXOBJECT;
        #if "refptr" in $prop
            result.FieldValue = typeobject->${prop.name}.${prop.refptr}();
        #else
            result.FieldValue = typeobject->${prop.name};
        #end if
            result.ClsName = "$prop.otype";
    #else
            result.FieldType = ${baseids.get($prop.type)};
            result.FieldValue = &(typeobject->${prop.name});
            #if $prop.type == "kfname"
            result.IsFieldTypeKFName = true;
            #end if
    #end if
            return result;
        }
#end for
        #if $data.extend
        return ${data.extend}R::GetField(obj, fieldname, index);
        #else
        #if len($data.propertys) != 0
        result.IsSuccess = false;
        result.FieldName = 0;
        #end if
        return result;
        #end if
    }

    bool ${data.class}R::SetField(kfAny obj, const kfname& fieldname, kfAny field, kfAny index) {
        if (!obj) return false;
        #if len($data.propertys) != 0
        ${data.class}* typeobject = static_cast<${data.class}*>(obj);
        #end if
#for $prop in $data.propertys
        static const kfname __k_${prop.name} = "${prop.name}";
        if (fieldname == __k_${prop.name}) {
    #if $prop.type == "map" or $prop.type == "mixmap" or $prop.type == "omap" or $prop.type == "mixomap"
            if (!index) return false;
            auto mapkey = static_cast<${prop.first_otype}*>(index);
        #if $prop.type == "map" or $prop.type == "omap"
            typeobject->${prop.name}[*mapkey] = *static_cast<${prop.second_otype}*>(field);
        #else
            typeobject->${prop.name}[*mapkey] = static_cast<${prop.second_otype}*>(field);
        #end if
    #else if $prop.type == "arr" or $prop.type == "mixarr"
            if (!index) return false;
            auto& arritms = typeobject->${prop.name};
        #if "arrsize" in $prop
            uint32 arrsize = kf_2_uint32(arritms.${prop.arrsize}());
        #else
            uint32 arrsize = kf_2_uint32(arritms.size());
        #end if
            auto arrindex = *static_cast<uint32*>(index);
            if (arrindex < arrsize) {
            #if $prop.type == "arr"
                arritms[arrindex] = *static_cast<${prop.otype}*>(field);
            #else
                arritms[arrindex] = static_cast<${prop.otype}*>(field);
            #end if
            }
    #else if $prop.type == "object"
            if (!kfCopyObject(&(typeobject->${prop.name}), static_cast<${prop.otype}*>(field))) return false;
    #else if $prop.type == "mixobject"
            typeobject->${prop.name} = static_cast<${prop.otype}*>(field);
    #else if $prop.type == "kfBytes"
            // typeobject->${prop.name} = static_cast<${prop.type}*>(field);
    #else
            typeobject->${prop.name} = *static_cast<${prop.type}*>(field);
    #end if
    #if $prop.type == "kfBytes"
            return false;
    #else
            return true;
    #end if
        }
#end for
        #if $data.extend
        return ${data.extend}R::SetField(obj, fieldname, field, index);
        #else
        return false;
        #end if
    }

    kfAny ${data.class}R::Clone(kfAny obj) {
        kfAny ret = kfNewObject(${data.class});
        if (!${data.class}R::Copy(obj, ret)) return nullptr;
        return ret;
    }

    bool ${data.class}R::Copy(kfAny src, kfAny dest) {
        if (!src || !dest) return false;
        #if $data.extend
        if (!${data.extend}R::Copy(src, dest)) return false;
        #end if
        #if len($data.propertys) != 0
        ${data.class}* tsrc = static_cast<${data.class}*>(src);
        ${data.class}* tdest = static_cast<${data.class}*>(dest);
        #end if
#for $prop in $data.propertys
    #if $prop.read != None
        {
            KFDataFormat::ClearUseBuff.Clear();
            tsrc->${prop.write}(KFDataFormat::ClearUseBuff);
            int32 bytelen = KFDataFormat::ClearUseBuff.AvailableSize();
            KFDataFormat::ClearUseBuff.SetPosition(0);
            tdest->${prop.read}(KFDataFormat::ClearUseBuff, bytelen);
        }
    #else if $prop.type == "map" or $prop.type == "omap"
        #if $baseids.get($prop.second_otype) == None
        tdest->${prop.name}.clear();
        for (auto& item : tsrc->${prop.name}) {
            if (!${prop.second_otype}R::Copy(&item.second, &(tdest->${prop.name}[item.first]))) return false;
        }
        #else
        tdest->${prop.name} = tsrc->${prop.name};
        #end if
    #else if $prop.type == "mixmap" or $prop.type == "mixomap"
        tdest->${prop.name}.clear();
        for (auto& item : tsrc->${prop.name}) {
            #if "refptr" in $prop
            auto newitem = ${prop.second_otype}R::Clone${prop.second_otype}(item.second.${prop.refptr}());
            #else
            auto newitem = ${prop.second_otype}R::Clone${prop.second_otype}(item.second);
            #end if
            if (!newitem) return false;
            #if "refone" in $prop
            newitem->${prop.refone}();
            #end if
            tdest->${prop.name}[item.first] = newitem;
        }
    #else if $prop.type == "arr"
        #if $baseids.get($prop.otype) == None
        tdest->${prop.name}.clear();
        tdest->${prop.name}.resize(tsrc->${prop.name}.size());
        for (size_t idx = 0; idx < tsrc->${prop.name}.size(); ++idx) {
            if (!${prop.otype}R::Copy(&(tsrc->${prop.name}[idx]), &(tdest->${prop.name}[idx]))) return false;
        }
        #else
        tdest->${prop.name} = tsrc->${prop.name};
        #end if
    #else if $prop.type == "mixarr"
        tdest->${prop.name}.clear();
        for (const auto& item : tsrc->${prop.name}) {
            #if "refptr" in $prop
            auto newitem = ${prop.otype}R::Clone${prop.otype}(item.${prop.refptr}());
            #else
            auto newitem = ${prop.otype}R::Clone${prop.otype}(item);
            #end if
            if (!newitem) return false;
            #if "refone" in $prop
            newitem->${prop.refone}();
            #end if
            tdest->${prop.name}.push_back(newitem);
        }
    #else if $prop.type == "object"
        if (!${prop.otype}R::Copy(&tsrc->${prop.name}, &tdest->${prop.name})) return false;
    #else if $prop.type == "mixobject"
        #if "refptr" in $prop
        if (!${prop.otype}R::Copy${prop.otype}(tsrc->${prop.name}.${prop.refptr}(), tdest->${prop.name}.${prop.refptr}())) return false;
        #else
        if (!${prop.otype}R::Copy${prop.otype}(tsrc->${prop.name}, tdest->${prop.name})) return false;
        #end if
    #else
        tdest->${prop.name} = tsrc->${prop.name};
    #end if
#end for
        return true;
    }

#if $data.typedef == 1 
    ${data.class}* ${data.class}R::Clone${data.class}(${data.class}* obj) {
        return ${data.class}TypeDef::Clone(obj);
    }
    bool ${data.class}R::Copy${data.class}(${data.class}* src, ${data.class}* dest) {
        return ${data.class}TypeDef::Copy(src, dest);
    }
#else
    ${data.class}* ${data.class}R::Clone${data.class}(${data.class}* obj) {
        return static_cast<${data.class}*>(KFDataFormat::CloneAnyObject("${data.class}", obj));
    }
    bool ${data.class}R::Copy${data.class}(${data.class}* src, ${data.class}* dest) {
        return KFDataFormat::CopyAnyObject("${data.class}", src, "${data.class}", dest);
    }
#end if

#end for
}