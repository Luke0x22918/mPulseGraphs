import http.server
import socketserver
import urllib
import json
import sys
from mPulse import mPulse

LOG_LEVEL = 2

def log(message, level=1):
    if (level <= LOG_LEVEL):
        print(message)


def createmPulseInstance():
    username = "xxxx"
    password = "xxxx"
    APIkey = "C2NRZ-PALRU-BXBQR-ULJ9A-XD2AB"
    mPulseInstance = mPulse(username, password, APIkey)
    return mPulseInstance

mPulseInstance = createmPulseInstance()

class Handler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        responseData = mPulseInstance.getData(self.path)
        self.respond(responseData)

    def do_POST(self):
        length = int(self.headers['Content-Length'])
        request_data = urllib.parse.parse_qs(self.rfile.read(length).decode('utf-8'))

        print("Post request with the data: ", request_data)
            

    def respond(self, responseJSON, status_code=200):
        self.send_response(status_code)
        self.set_headers()
        self.end_headers()

        responseJSON = json.dumps(responseJSON) if type(responseJSON) == dict else responseJSON
        log("Sending payload", level=2)
        self.wfile.write(responseJSON.encode("utf-8"))

    def send_error(self, errorMessage, status_code=400):
        self.send_response(status_code)
        self.set_headers()
        self.wfile.write(('{"ErrorMessage": "%s"}' % errorMessage).encode("utf-8"))

    def set_headers(self):
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Credentials", True)
        self.send_header("Access-Control-Allow-Origin", "null")
        self.end_headers()

def main():
    port = 8000 if len(sys.argv) <= 1 else int(sys.argv[1])

    print('Server listening on port %d...' % (port))
    httpd = socketserver.TCPServer(('', port), Handler)
    httpd.serve_forever()

if __name__ == "__main__":
    main()