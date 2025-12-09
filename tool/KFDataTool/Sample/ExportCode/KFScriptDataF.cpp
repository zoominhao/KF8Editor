#include "KFScriptDataF.h"
#include "KFScriptDataTypeDef.h"

namespace KF
{
     KFScriptData* KFScriptDataF::Read(KFByteArray& buffarr,KFScriptData* obj)
     {
        if(obj == NULL)
        {
            obj = new KFScriptData();
        }

        int32 cpos = buffarr.GetPosition();
        uint32 id = buffarr.ReadVarUInt();
        ///Deal with problems if there is no inheritance before
        if(id != OBJ_PROP_ID_BEGIN)
        {
            buffarr.SetPosition(cpos);
            return obj;
        }


        cpos = buffarr.GetPosition();
        id = buffarr.ReadVarUInt();

        while(id != OBJ_PROP_ID_END)
        {
            switch(id)
            {

                case 1:

               if(buffarr.ReadUByte() == 5) 
              {
                //buffarr.Skip(1);/// type is base value
                int32Read(buffarr,obj->type);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 2:

               if(buffarr.ReadUByte() == 5) 
              {
                //buffarr.Skip(1);/// type is base value
                int32Read(buffarr,obj->argInt);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 3:

               if(buffarr.ReadUByte() == 9) 
              {
                //buffarr.Skip(1);/// type is base value
                kfstrRead(buffarr,obj->argStr);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 4:

               if(buffarr.ReadUByte() == 5) 
              {
                //buffarr.Skip(1);/// type is base value
                int32Read(buffarr,obj->_i);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 5:

               if(buffarr.ReadUByte() == 5) 
              {
                //buffarr.Skip(1);/// type is base value
                int32Read(buffarr,obj->_v);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 6:

               if(buffarr.ReadUByte() == 5) 
              {
                //buffarr.Skip(1);/// type is base value
                int32Read(buffarr,obj->_f);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
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

     void KFScriptDataF::Write(KFByteArray& buffarr,KFScriptData* obj)
     {
        if(obj == NULL) return;
        buffarr.WriteVarUInt(OBJ_PROP_ID_BEGIN);


        buffarr.WriteVarUInt(1);///property id
        int32WriteVal(buffarr,obj->type);

        buffarr.WriteVarUInt(2);///property id
        int32WriteVal(buffarr,obj->argInt);

        buffarr.WriteVarUInt(3);///property id
        kfstrWriteVal(buffarr,obj->argStr);

        buffarr.WriteVarUInt(4);///property id
        int32WriteVal(buffarr,obj->_i);

        buffarr.WriteVarUInt(5);///property id
        int32WriteVal(buffarr,obj->_v);

        buffarr.WriteVarUInt(6);///property id
        int32WriteVal(buffarr,obj->_f);


        buffarr.WriteVarUInt(OBJ_PROP_ID_END);
     }

        KFScriptData* KFScriptDataF::ReadKFScriptData(KFByteArray& buffarr,KFScriptData* obj /*= nullptr*/)
        {
            return KFScriptDataTypeDef::Read(buffarr,obj);
        }

        void KFScriptDataF::WriteKFScriptData(KFByteArray& buffarr,KFScriptData* obj)
        {
            KFScriptDataTypeDef::Write(buffarr,obj);
        }


}
