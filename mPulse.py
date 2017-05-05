import requests

class mPulse:
    def __init__(self, username, password, APIkey):
        self.username = username
        self.password = password
        self.APIkey = APIkey
        self.token = self.getToken1()


    def getToken1(self):
        try:
            URL = "https://mpulse.soasta.com/concerto/services/rest/RepositoryService/v1/Tokens"
            fp = requests.put(URL, data='{"userName":"%s","password":"%s"}' % (self.username, self.password), headers={"Content-type":"application/json"})
            js = fp.json()
            return js['token']
        except:
            print("Failed to get the token.")

    def getData(self, data):
        try:
            addformat = "&format=json" if ("?" in data) else "?format=json"
            URL = "https://mpulse.soasta.com/concerto/mpulse/api/v2/"+self.APIkey+"/"+data+addformat
            fp = requests.get(URL, headers={"Authentication": self.token})
            return fp.content.decode('utf-8')
        except:
            print("Failed to obtain the data with the parameters /%s." % (data))
