#include "ClsBF.h"

namespace KF
{
     ClsB* ClsBF::Read(KFByteArray& buffarr,ClsB* obj)
     {
        if(obj == NULL)
        {
            obj = new ClsB();
        }

        int32 cpos = buffarr.GetPosition();
        uint32 id = buffarr.ReadVarUInt();
        ///Deal with problems if there is no inheritance before
        if(id != OBJ_PROP_ID_BEGIN)
        {
            buffarr.SetPosition(cpos);
            return obj;
        }

        BaseAF::Read(buffarr,obj);

        cpos = buffarr.GetPosition();
        id = buffarr.ReadVarUInt();

        while(id != OBJ_PROP_ID_END)
        {
            switch(id)
            {

                case 1:

               if(buffarr.ReadUByte() == 1) 
              {
                //buffarr.Skip(1);/// type is base value
                int8Read(buffarr,obj->type);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 2:

               if(buffarr.ReadUByte() == 9) 
              {
                //buffarr.Skip(1);/// type is base value
                kfstrRead(buffarr,obj->des);
              }
              else
              {
                 buffarr.Skip(-1);
                 KFDataFormat::SkipValue(buffarr);
              }
                    break;
                case 3:

                {
                    //buffarr.Skip(1); /// type is array or object
                    uint8 valueType = buffarr.ReadUByte();
                    if(valueType == OT_ARRAY)
                    {
                        uint32 arrsize = buffarr.ReadVarUInt();
                        buffarr.Skip(1); /// array object type
                        obj->argArr.clear();/// clear arr
                        for(uint32 i = 0 ;i < arrsize; i ++)
                        {
                            int32 itm;
                            int32Read(buffarr,itm);
                            obj->argArr.push_back(itm);
                        }
                    }
                    else if(valueType == OT_OBJECT)
                    {
                       ///a virtual object
                       auto& arrval = obj->argArr;
                       auto arrsize = arrval.size();
                       auto arrindex = buffarr.ReadVarUInt(); /// OBJ_PROP_ID_BEGIN

                       while(arrindex != OBJ_PROP_ID_END)
                       {
                            if(arrindex != OBJ_PROP_ID_BEGIN)
                            {
                                arrindex = arrindex - (arrindex > OBJ_PROP_ID_BEGIN ? 2 : 1);

                                if(arrindex < arrsize)
                                {
                                    auto& itm = obj->argArr[arrindex];
                                    int32Read(buffarr,itm);
                                }
                                else
                                {
                                    int32 itm;
                                    int32Read(buffarr,itm);
                                    obj->argArr.push_back(itm);
                                }
                            }
                            arrindex = buffarr.ReadVarUInt();
                       }
                    }else
                    {
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

     void ClsBF::Write(KFByteArray& buffarr,ClsB* obj)
     {
        if(obj == NULL) return;
        buffarr.WriteVarUInt(OBJ_PROP_ID_BEGIN);
        BaseAF::Write(buffarr,obj);


        buffarr.WriteVarUInt(1);///property id
        int8WriteVal(buffarr,obj->type);

        buffarr.WriteVarUInt(2);///property id
        kfstrWriteVal(buffarr,obj->des);

        buffarr.WriteVarUInt(3);///property id
        {
            buffarr.WriteByte(16);///write arr type
            
            auto& arritms = obj->argArr;
            uint32 arrsize = kf_2_uint32(arritms.size());
            buffarr.WriteVarUInt(arrsize);

            buffarr.WriteByte(5);///write base value type
            for(uint32 i = 0 ;i < arrsize; i ++)
            {
                int32Write(buffarr,arritms[i]);
            }
        }


        buffarr.WriteVarUInt(OBJ_PROP_ID_END);
     }


        ClsB* ClsBF::ReadClsB(KFByteArray& buffarr,ClsB* obj /*= nullptr*/)
        {
            uint8 valueType = buffarr.ReadUByte(); /// type is object
            if(valueType == OT_NULL)
            {
                return nullptr;
            }
            else if(valueType == OT_OBJECT)
            {
                return ClsBF::Read(buffarr,obj);
            }
            else if(valueType == OT_MIXOBJECT)
            {
                uint32 clsid = buffarr.ReadVarUInt();///clsid
                return ClsBF::Read(buffarr,obj);
            }
            else
            {
                buffarr.Skip(-1);
                KFDataFormat::SkipValue(buffarr);
            }

            return nullptr;
        }

        void ClsBF::WriteClsB(KFByteArray& buffarr,ClsB* obj)
        {
           if(obj == NULL)
            {
                buffarr.WriteByte(OT_NULL);
                return;
            }

            buffarr.WriteByte(OT_MIXOBJECT);///objecttype
            buffarr.WriteVarUInt(1005);
            ClsBF::Write(buffarr,obj);
        }

}
