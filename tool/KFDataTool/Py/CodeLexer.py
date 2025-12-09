import re
import string


def is_whitespace(c):
    for i in string.whitespace:
        if c == i:
            return True
    return False

def is_token_delimiter(c):
    if c == ',':
        return True 
    if c == '=':
        return True 
    if c == ')':
        return True 
    return False

def is_token_valid_char(c):
    if is_whitespace(c):
        return False
    if is_token_delimiter(c):
        return False
    return True

class CodeToken(object):
    TOKEN_None = 0
    TOKEN_Identifier = 1
    TOKEN_Symbol = 2
    TOKEN_Const = 3

    def __init__(self) -> None:
        self.token_type = CodeToken.TOKEN_None 
        self.content = ""
        self.startPosition = 0
        self.startLine = 0
        pass

    pass


class CodeLexer(object):
    def __init__(self, fdata) -> None:
        self.__fileData = fdata
        self.__dataSize = len(fdata)

        self.__prevLine = 0
        self.__prevPostion = 0
        self.__currLine = 0
        self.__currPosition = 0

        pass

    def line_number(self):
        return self.__currLine

    def position(self):
        return self.__currPosition

    def get_char(self):
        self.__prevPostion = self.__currPosition
        self.__prevLine = self.__currLine
        c = self.peek_char()
        self.__currPosition += 1
        if c == "\n":
            self.__currLine += 1
        return c

    def peek_char(self):
        if self.__currPosition >= self.__dataSize:
            return 0
        return self.__fileData[self.__currPosition]

    def get_leading_char(self):
        while True:
            c = self.get_char()
            if is_whitespace(c):
                continue
            else:
                break
        return c

    def unget_char(self):
        self.__currPosition = self.__prevPostion
        self.__currLine = self.__prevLine
        pass

    def is_finished(self):
        return self.__currPosition >= self.__dataSize

    def get_left_of_current_line(self):
        line = ""
        pos = self.__currPosition
        while pos < self.__dataSize:
            c = self.__fileData[pos]
            if c == "\n":
                break
            line += c
            pos += 1
        return line

    def skip_whitespace(self):
        while True:
            c = self.get_char()
            if is_whitespace(c):
                continue
            else:
                break
        self.unget_char()
        pass

    def is_blank_line(self):
        pos = self.__currPosition
        while pos < self.__dataSize:
            c = self.__fileData[pos]
            if not is_whitespace(c):
                return False
            if c == "\n":
                break
            pos += 1
        return True

    def skip_current_line(self):
        while True:
            c = self.get_char()
            if c == "\n" or self.is_finished():
                break
        pass

    def advance_by_regex(self, regex_string):
        line = self.get_left_of_current_line()
        match_object = re.match(regex_string, line)
        if match_object:
            content = match_object.group()
            self.__currPosition += len(content)
            return content

        return None

    def get_token(self):
        c = self.get_leading_char()
        if c == 0:
            self.unget_char()
            return None

        token = CodeToken()
        token.startPosition = self.__prevPostion
        token.startLine = self.__prevLine

        if is_token_delimiter(c):
            token.token_type = CodeToken.TOKEN_Symbol
            token.content = c
            return token

        while True:
            token.content += c
            c = self.get_char()
            if not is_token_valid_char(c):
                break
        self.unget_char()

        token.token_type = CodeToken.TOKEN_Identifier
        return token

    def get_raw_token(self, stoplist="\n"):
        c = self.get_leading_char()
        if c == 0:
            self.unget_char()
            return None

        token = CodeToken()
        token.startPosition = self.__prevPostion
        token.startLine = self.__prevLine

        while c != 0 and c not in stoplist:
            token.content += c
            c = self.get_char()
        self.unget_char()

        token.token_type = CodeToken.TOKEN_Const
        return token

    def unget_token(self, token):
        self.__currPosition = token.startPosition
        self.__currLine = token.startLine
        pass

    def peek_token(self):
        token = self.get_token()
        self.unget_token(token)
        return token

    def require_token(self, token_string):
        token = self.get_token()
        if token:
            if isinstance(token_string, str) and token.content == token_string:
                return True
            if isinstance(token_string, list) and token.content in token_string:
                return True
        self.unget_token(token)
        return False

    pass
