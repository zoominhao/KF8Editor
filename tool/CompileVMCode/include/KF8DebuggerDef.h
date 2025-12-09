//
// Created by gatesgao on 2021/11/24.
//

#ifndef KUNGFU8_KF8DEBUGGER_H
#define KUNGFU8_KF8DEBUGGER_H


#include <stdio.h>
#include "vector"

#ifndef EMBED_VM_CODE

///外部日志函数
extern "C" void _KFLog(int, const char[], const char*, int, int);


#define LOG(MSG, ...)                                                                \
       {                                                                             \
            int sz = std::snprintf(nullptr, 0, MSG, ##__VA_ARGS__);                  \
            std::vector<char> buf(sz + 1);                                           \
            std::snprintf(&buf[0], buf.size(), MSG, ##__VA_ARGS__);                  \
            _KFLog(__LINE__, __FUNCTION__, &buf[0], buf.size(), -1);                 \
        }



#define INFO(MSG, ...)                                                               \
        {                                                                            \
            int sz = std::snprintf(nullptr, 0, MSG, ##__VA_ARGS__);                  \
            std::vector<char> buf(sz + 1);                                           \
            std::snprintf(&buf[0], buf.size(), MSG, ##__VA_ARGS__);                  \
            _KFLog(__LINE__, __FUNCTION__, &buf[0], buf.size(), 0);                  \
        }




#define LOG_WARNING(MSG, ...)                                                        \
        {                                                                            \
            int sz = std::snprintf(nullptr, 0, MSG, ##__VA_ARGS__);                  \
            std::vector<char> buf(sz + 1);                                           \
            std::snprintf(&buf[0], buf.size(), MSG, ##__VA_ARGS__);                  \
            _KFLog(__LINE__, __FUNCTION__, &buf[0],buf.size(), 1);                   \
        }



#define LOG_ERROR(MSG, ...)                                                          \
        {                                                                            \
            int sz = std::snprintf(nullptr, 0, MSG, ##__VA_ARGS__);                  \
            std::vector<char> buf(sz + 1);                                           \
            std::snprintf(&buf[0], buf.size(), MSG, ##__VA_ARGS__);                  \
            _KFLog(__LINE__, __FUNCTION__, &buf[0],buf.size(), 2);                   \
        }

#define LOG_TAG(MSG, ...)

#define LOG_IF(COND, MSG, ...) if (COND) { LOG(MSG, ##__VA_ARGS__); }
#define LOG_WARNING_IF(COND, MSG, ...) if (COND) { LOG_WARNING(MSG, ##__VA_ARGS__); }
#define LOG_ERROR_IF(COND, MSG, ...) if (COND) { LOG_ERROR(MSG, ##__VA_ARGS__); }
#define LOG_TAG_IF(COND, MSG, ...) if (COND) { LOG_TAG(MSG, ##__VA_ARGS__); }

#define return_if(cond) if(cond) { return; } 
#define return_and_log_if(cond) if(cond) { LOG("check if(" #cond ") failed"); return; } 
#define return_and_tag_if(cond) if(cond) { LOG_TAG("check if(" #cond ") failed"); return; } 
#define return_and_warn_if(cond) if(cond) { LOG_WARNING("check if(" #cond ") failed"); return; } 
#define return_and_error_if(cond) if(cond) { LOG_ERROR("check if(" #cond ") failed"); return; } 
#define returnv_if(cond, ret) if(cond) { return ret; } 
#define returnv_and_log_if(cond, ret) if(cond) { LOG("check if(" #cond ") failed"); return ret; } 
#define returnv_and_tag_if(cond, ret) if(cond) { LOG_TAG("check if(" #cond ") failed"); return ret; } 
#define returnv_and_warn_if(cond, ret) if(cond) { LOG_WARNING("check if(" #cond ") failed"); return ret; } 
#define returnv_and_error_if(cond, ret) if(cond) { LOG_ERROR("check if(" #cond ") failed"); return ret; } 

#define return_msg_if(cond, format, ...) \
    if(cond) { LOG("check if(" #cond ") failed, " format, ##__VA_ARGS__); return; } 
#define return_and_tag_msg_if(cond, format, ...) \
    if(cond) { LOG_TAG("check if(" #cond ") failed, " format, ##__VA_ARGS__); return; } 
#define return_and_warn_msg_if(cond, format, ...) \
    if(cond) { LOG_WARNING("check if(" #cond ") failed, " format, ##__VA_ARGS__); return; } 
#define return_and_error_msg_if(cond, format, ...) \
    if(cond) { LOG_ERROR("check if(" #cond ") failed, " format, ##__VA_ARGS__); return; } 
#define returnv_msg_if(cond, ret, format, ...) \
    if(cond) { LOG("check if(" #cond ") failed, " format, ##__VA_ARGS__); return ret; } 
#define returnv_and_tag_msg_if(cond, ret, format, ...) \
    if(cond) { LOG_TAG("check if(" #cond ") failed, " format, ##__VA_ARGS__); return ret; } 
#define returnv_and_warn_msg_if(cond, ret, format, ...) \
    if(cond) { LOG_WARNING("check if(" #cond ") failed, " format, ##__VA_ARGS__); return ret; } 
#define returnv_and_error_msg_if(cond, ret, format, ...) \
    if(cond) { LOG_ERROR("check if(" #cond ") failed, " format, ##__VA_ARGS__); return ret; }

#define return_and_warn_log(format, ...) { LOG_WARNING(format, ##__VA_ARGS__); return; }
#define return_and_error_log(format, ...) { LOG_ERROR(format, ##__VA_ARGS__); return; }
#define returnv_and_warn_log(ret, format, ...) { LOG_WARNING(format, ##__VA_ARGS__); return ret; }
#define returnv_and_error_log(ret, format, ...) { LOG_ERROR(format, ##__VA_ARGS__); return ret; }

#else


#endif
#endif //KUNGFU8_KF8DEBUGGER_H
