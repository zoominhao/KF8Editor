#pragma once

#include "KF8TypeDef.h"

// 用来定义一些方便使用的宏或方法

#define REG(i) _context.As<vKFScriptContext>().Get(i)
#define RT() _this.GetValue("*")
#define SELF() vKFVarPathUtil::GetVarObj(_context.As<vKFScriptContext>(), _this, vkfname("_self"))

