# This script is used to quickly extract data from the command line
# Note: a credentials.json with the username and password is required to use this script

import sys
import json
from mPulse import mPulse

if (len(sys.argv) <= 1):
    raise Exception("Data argument is required.")

def prettyPrintJSON(jsonString):
    parsed = json.loads(jsonString)
    return json.dumps(parsed, indent=4, sort_keys=True)

def main():
    file = open("credentials.json", 'r')
    credentials = json.loads(file.read())
    username = credentials['username']
    password = credentials['password']
    APIkey = "MSCAV-P74JG-WRADB-C552Z-VWWYJ"
    mPulseInstance = mPulse(username, password, APIkey)
    file.close()

    data = sys.argv[1]
    response = mPulseInstance.getData(data)
    try:
        print(
            prettyPrintJSON(response)
        )
    except:
        print(response)

if __name__ == "__main__":
    main()