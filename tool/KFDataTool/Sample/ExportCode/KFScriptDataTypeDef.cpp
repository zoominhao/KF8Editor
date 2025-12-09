#include "KFScriptDataTypeDef.h"

#include "KFScriptDataF.h"


namespace KF
{

     kfMap<kfstr,int32> KFScriptDataTypeDef::KeyTypes = { {"",0}
              ,{"KFScriptData" ,KF_ST_ENUM_KFScriptData }
     };

     KFScriptData* KFScriptDataTypeDef::Create(uint32 keytype)
     {
        KFScriptData* obj = NULL;

        switch(keytype)
        {
             case KF_ST_ENUM_KFScriptData :
                obj = new KFScriptData();
             break;
            default:
                obj = new KFScriptData();
                break;
        }
        if(obj != NULL)
        {  
            obj->type = keytype;
        }
        return obj;
     }

     KFScriptData* KFScriptDataTypeDef::Read(KFByteArray& buffarr,KFScriptData* obj/* = nullptr*/)
     {
            uint8 valueType = buffarr.ReadUByte(); /// type is object
            if(valueType == OT_NULL)
            { 
                return nullptr;
            }
            else if(valueType != OT_MIXOBJECT)
            {
                buffarr.Skip(-1);
                KFDataFormat::SkipValue(buffarr);
                return nullptr;
            }


            uint32 clsid = buffarr.ReadVarUInt();///clsid
            int32 keytype = obj != nullptr ? obj->type : -1;

            switch(clsid)
            {
             case 1001 :

                if (keytype != KF_ST_ENUM_KFScriptData)
                {
                    return KFScriptDataF::Read(buffarr);
                }
                else
                    return KFScriptDataF::Read(buffarr,(KFScriptData*)obj);
                default:
                    KFDataFormat::SkipObject(buffarr);
                    break;
            }

            return NULL;
     }

    void KFScriptDataTypeDef::Write(KFByteArray& buffarr,KFScriptData* obj)
    {
    	if(obj == NULL) 
        {
            buffarr.WriteByte(OT_NULL);
            return;
        }

        buffarr.WriteByte(OT_MIXOBJECT);///objecttype
        int32 keytype = obj->type;

        switch(keytype)
        {
            default:
               buffarr.WriteVarUInt(1001);
               KFScriptDataF::Write(buffarr,obj);
               break;
        }
    }
}
