import requests

class mPulse:
    def __init__(self, *args):
        if len(args) == 3:
            self.token = self.getToken1(args[0], args[1])
            self.APIkey = args[2]
        else:
            self.token = args[0]
            self.APIkey = args[1]

    @staticmethod
    def getToken1(username, password):
        try:
            URL = "https://mpulse.soasta.com/concerto/services/rest/RepositoryService/v1/Tokens"
            fp = requests.put(URL, data='{"userName":"%s","password":"%s"}' % (username, password), headers={"Content-type":"application/json"})
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
