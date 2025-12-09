
#include "{{CLASS}}TypeDef.h"

{% for index, kfd in data.kfddatas %}
#include "{{kfd.class}}F.h"
{%end%}


{% if not DEF_ENUM%}
{% if info.TYPE == 1%}
#include "Script/KFScriptType.h"
{%end%}
{%end%}
namespace {{NS}}
{

     kfMap<kfstr,int32> {{CLASS}}TypeDef::KeyTypes = { {"",0}
{% for index, kfd in data.kfddatas %}
              ,{"{{kfd.class}}" ,KF_ST_ENUM_{{kfd.class}} }
{% if kfd.CTYPEIDS != None%}
{% for index2, tindex in kfd.CTYPEIDS %}
              ,{"{{kfd.class}}{{tindex}}" ,KF_ST_ENUM_{{kfd.class}}{{tindex}}}
{% end %}
{% end %}
{% end %}
     };

     {{CLASS}}* {{CLASS}}TypeDef::Create(uint32 keytype)
     {
        {{CLASS}}* obj = NULL;

        switch(keytype)
        {
{% for index, kfd in data.kfddatas %}
             case KF_ST_ENUM_{{kfd.class}} :
{% if kfd.CTYPEIDS != None%}
{% for index2, tindex in kfd.CTYPEIDS %}
             case KF_ST_ENUM_{{kfd.class}}{{tindex}}:
{% end %}
{% end %}
                obj = new {{kfd.class}}();
             break;
{%end%}
            default:
                obj = new {{CLASS}}();
                break;
        }
        if(obj != NULL)
        {  
            obj->{{KEY_PROP_NAME}} = keytype;
        }
        return obj;
     }

     {{CLASS}}* {{CLASS}}TypeDef::Read(KFByteArray& buffarr,{{CLASS}}* obj/* = nullptr*/)
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
            int32 keytype = obj != nullptr ? obj->{{KEY_PROP_NAME}} : -1;

            switch(clsid)
            {
{% for index, kfd in data.kfddatas %}
             case {{kfd.clsid}} :

                if (keytype != KF_ST_ENUM_{{kfd.class}})
                {
                    return {{kfd.class}}F::Read(buffarr);
                }
                else
                    return {{kfd.class}}F::Read(buffarr,({{kfd.class}}*)obj);
{%end%}
                default:
                    KFDataFormat::SkipObject(buffarr);
                    break;
            }

            return NULL;
     }

    void {{CLASS}}TypeDef::Write(KFByteArray& buffarr,{{CLASS}}* obj)
    {
    	if(obj == NULL) 
        {
            buffarr.WriteByte(OT_NULL);
            return;
        }

        buffarr.WriteByte(OT_MIXOBJECT);///objecttype
        int32 keytype = obj->{{KEY_PROP_NAME}};

        switch(keytype)
        {
{% for index, kfd in data.kfddatas %}
        {% if kfd.class != CLASS%}
             case KF_ST_ENUM_{{kfd.class}} :
{% if kfd.CTYPEIDS != None%}
{% for index2, tindex in kfd.CTYPEIDS %}
             case KF_ST_ENUM_{{kfd.class}}{{tindex}}:
{% end %}
{% end %}
                buffarr.WriteVarUInt({{kfd.clsid}});
                {{kfd.class}}F::Write(buffarr,({{kfd.class}}*)(obj));
             break;
        {%end%}
{%end%}
            default:
               buffarr.WriteVarUInt({{CLSID}});
               {{CLASS}}F::Write(buffarr,obj);
               break;
        }
    }
}