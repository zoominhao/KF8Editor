import logging
import subprocess
import threading
import argparse
import sys
import os

from tornado import ioloop, process, web, websocket

from pyls_jsonrpc import streams

try:
    import ujson as json
except Exception:  # pylint: disable=broad-except
    import json

log = logging.getLogger(__name__)
raPath = "C:/RA"
paths = []

def getPath(path):
    for dirpath, dirnames, filenams in os.walk(path):
        for name in dirnames:
            if (name == "Code"):
                paths.append(os.path.join(dirpath, name).replace('\\','/'))



class LanguageServerWebSocketHandler(websocket.WebSocketHandler):
    """Setup tornado websocket handler to host an external language server."""

    writer = None

    def open(self, *args, **kwargs):
        log.info("Spawning ccls subprocess")
        clangPath =     raPath + "/Tools/KF8Editor/tool/wasi-sdk-14.0/lib/clang/13.0.0"
        includePath =   raPath + "/Tools/KF8Editor/tool/CompileVMCode/include"
        generatedPath = raPath + "/RA_NB/Content/EditorOnly/Include/Generated"
        appPath =       raPath + "/RA_NB/Content/App/Data/App"
        getPath(appPath)
        initArgs = '--init={"capabilities": {"foldingRangeProvider": false}, "index": {"onChange": true, "trackDependency":2}, "clang": {"resourceDir": "' + clangPath +'","extraArgs":["-I' + includePath +'","-I' + generatedPath
        for codePath in paths:
            print(codePath)
            initArgs += '","-I'+ codePath
        initArgs += '"]} }'
        print(initArgs)
        # Create an instance of the language server
        proc = process.Subprocess(
            ['./tool/ccls/ccls', initArgs],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE
        )

        # Create a writer that formats json messages with the correct LSP headers
        self.writer = streams.JsonRpcStreamWriter(proc.stdin)

        # Create a reader for consuming stdout of the language server. We need to
        # consume this in another thread
        def consume():
            # Start a tornado IOLoop for reading/writing to the process in this thread
            ioloop.IOLoop()
            reader = streams.JsonRpcStreamReader(proc.stdout)
            reader.listen(lambda msg: self.write_message(json.dumps(msg)))

        thread = threading.Thread(target=consume)
        thread.daemon = True
        thread.start()

    def on_message(self, message):
        """Forward client->server messages to the endpoint."""
        self.writer.write(json.loads(message))

    def check_origin(self, origin):
        return True



    #parser = argparse.ArgumentParser()
    #parser.add_argument("--host", type=str, default="127.0.0.1")
    #parser.add_argument("--port", type=int, default=3000)
    #args = parser.parse_args()
if __name__ == "__main__":
    print("=================================================================")
    host = "127.0.0.1"
    port = 3333
    print("Started Web Socket at ws://{}:{}/cpp".format(host, port))
    raPath = sys.argv[1].replace('\\','/')
    raPath += '../../../..'
    print(raPath)
    print("=================================================================")
    app = web.Application([
    (r"/cpp", LanguageServerWebSocketHandler),
    ])
    app.listen(port, address=host)
    ioloop.IOLoop.current().start()
    
