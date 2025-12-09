\#include "${CLASS}TypeDef.h"

#if not $DEF_ENUM
#if $info.TYPE == 1
\#include "Script/KFScriptType.h"
#end if
#end if
namespace ${NS} {
    kfMap<kfstr,int32> ${CLASS}TypeDef::KeyTypes = {{"",0}};

    ${CLASS}* ${CLASS}TypeDef::Create(uint32 keytype) {
        ${CLASS}* obj = nullptr;
        return obj;
    }

    ${CLASS}* ${CLASS}TypeDef::Read(KFByteArray& buffarr,${CLASS}* obj/* = nullptr*/) {
        #if $kfd.typeid != -1
        kfstr clsname;
        ${CLASS}* anyObj = static_cast<${CLASS}*>(KFDataFormat::ReadAnyObject(buffarr, clsname, obj));
        if(anyObj) {
            anyObj->${KEY_PROP_NAME} = clsname;
        }
        return anyObj;
        #else
        return static_cast<${CLASS}*>(KFDataFormat::ReadAnyObject(buffarr, obj));
        #end if
    }

    void ${CLASS}TypeDef::Write(KFByteArray& buffarr, ${CLASS}* obj, KFDDirtys* dirtys) {
        const kfstr& clsname = GetClassName(obj);
        KFDataFormat::WriteAnyObject(buffarr, clsname, obj, dirtys);
    }

    bool ${CLASS}TypeDef::Diff(${CLASS}* old_obj, ${CLASS}* new_obj, KFDDirtys* dirtys) {
        const kfstr& old_clsname = GetClassName(old_obj);
        const kfstr& new_clsname = GetClassName(new_obj);
        return KFDataFormat::DiffAnyObject(old_clsname, old_obj, new_clsname, new_obj, dirtys);
    }

    ${CLASS}* ${CLASS}TypeDef::CompactRead(KFByteArray& buffarr,${CLASS}* obj/* = nullptr*/) {
        #if $kfd.typeid != -1
        kfstr clsname;
        ${CLASS}* anyObj = static_cast<${CLASS}*>(KFDataFormat::CompactReadAnyObject(buffarr, clsname, obj));
        if(anyObj) { anyObj->${KEY_PROP_NAME} = clsname; }
        return anyObj;
        #else
        return static_cast<${CLASS}*>(KFDataFormat::CompactReadAnyObject(buffarr, obj));
        #end if
    }

    void ${CLASS}TypeDef::CompactWrite(KFByteArray& buffarr, ${CLASS}* obj) {
        const kfstr& clsname = GetClassName(obj);
        KFDataFormat::CompactWriteAnyObject(buffarr, clsname, obj);
    }

    ${CLASS}* ${CLASS}TypeDef::Clone(${CLASS}* obj) {
        const kfstr& clsname = GetClassName(obj);
        return static_cast<${CLASS}*>(KFDataFormat::CloneAnyObject(clsname, obj));
    }

    bool ${CLASS}TypeDef::Copy(${CLASS}* src, ${CLASS}* dest) {
        const kfstr& srcname = GetClassName(src);
        const kfstr& destname = GetClassName(dest);
        return KFDataFormat::CopyAnyObject(srcname, src, destname, dest);
    }

    const kfstr& ${CLASS}TypeDef::GetClassName(${CLASS}* object) {
        #if $kfd.typeid == -1
        return object ? object->ClassType() : NULLSTR;
        #else
        return object ? object->${KEY_PROP_NAME}.ToString() : NULLSTR;
        #end if
    }
}
