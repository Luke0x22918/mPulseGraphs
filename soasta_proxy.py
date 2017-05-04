from mPulse import mPulse
from flask import Flask, render_template, request, Response
app = Flask(__name__)

LOG_LEVEL = 2

def log(message, level=1):
    if (level <= LOG_LEVEL):
        print(message)

def createmPulseInstance():
    username = "qg78hw"
    password = "Welkom01"
    APIkey = "C2NRZ-PALRU-BXBQR-ULJ9A-XD2AB"
    mPulseInstance = mPulse(username, password, APIkey)
    return mPulseInstance

mPulseInstance = createmPulseInstance()

@app.route('/')
def index():
    return render_template("index.html", name="index")

@app.route("/chart.js")
def chart():
    return render_template("chart.js", name="chartjs")

@app.route("/mPulse/<parameter>")
def mPulse(parameter):
    query_string = ("%s?%s") % (parameter, request.query_string.decode('utf-8'))
    response_data = mPulseInstance.getData(query_string)
    log("Sending payload", level=2)
    return Response(response_data, mimetype="application/json")