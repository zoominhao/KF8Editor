#include "BaseATypeDef.h"

namespace KF
{
     BaseA* BaseATypeDef::Create(uint32 keytype)
     {
        BaseA* obj = NULL;

        switch(keytype)
        {
             case KF_ST_ENUM_BaseA :
                obj = new BaseA();
             break;
             case KF_ST_ENUM_ClsB :
                obj = new ClsB();
             break;
            default:
                obj = new BaseA();
                break;
        }
        if(obj != NULL)
        {  
            obj->id = keytype;
        }
        return obj;
     }

     BaseA* BaseATypeDef::Read(KFByteArray& buffarr)
     {
            uint8 valueType = buffarr.ReadUByte(); /// type is object
            if(valueType == OT_NULL)
            { 
                return nullptr;
            }

            uint32 clsid = buffarr.ReadVarUInt();///clsid

            switch(clsid)
            {
             case 1004 :
                return BaseAF::Read(buffarr);
             case 1005 :
                return ClsBF::Read(buffarr);
                default:
                    KFDataFormat::SkipObject(buffarr);
                    break;
            }

            return NULL;
     }

    void BaseATypeDef::Write(KFByteArray& buffarr,BaseA* obj)
    {
    	if(obj == NULL) 
        {
            buffarr.WriteByte(OT_NULL);
            return;
        }

        buffarr.WriteByte(OT_MIXOBJECT);///objecttype
        int32 keytype = obj->id;

        switch(keytype)
        {
             case KF_ST_ENUM_ClsB :
                buffarr.WriteVarUInt(1005);
                ClsBF::Write(buffarr,(ClsB*)(obj));
             break;
            default:
               buffarr.WriteVarUInt(1004);
               BaseAF::Write(buffarr,obj);
               break;
        }
    }
}
