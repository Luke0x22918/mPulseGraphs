import sys
import json
from mPulse import mPulse

if (len(sys.argv) <= 1):
    raise Exception("Data argument is required.")

def prettyPrintJSON(jsonString):
    parsed = json.loads(jsonString)
    return json.dumps(parsed, indent=4, sort_keys=True)

def main():
    username = "qg78hw"
    password = "Welkom01"
    APIkey = "C2NRZ-PALRU-BXBQR-ULJ9A-XD2AB"
    mPulseInstance = mPulse(username, password, APIkey)

    data = sys.argv[1]
    response = mPulseInstance.getData(data)
    print(
        prettyPrintJSON(response)
    )

if __name__ == "__main__":
    main()