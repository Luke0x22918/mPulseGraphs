import os
from mPulse import mPulse
from flask import Flask, render_template, request, Response, session, redirect
app = Flask(__name__)

LOG_LEVEL = 2

mPulseCache = {}

def log(message, level=1):
    if (level <= LOG_LEVEL):
        print(message)

def createmPulseInstance(username, password):
    APIkey = "C2NRZ-PALRU-BXBQR-ULJ9A-XD2AB"
    mPulseInstance = mPulse(username, password, APIkey)
    return mPulseInstance

@app.route('/')
def index():
    if 'logged_in' in session:
        print("Render index..")
        return render_template("index.html", name="index")
    else:
        return render_template("login_page.html", name="login_page")

@app.route("/chart.js")
def chart():
    return render_template("chart.js", name="chartjs")

@app.route("/login", methods=["GET", "POST"])
def login():
    response = None
    if request.method == "POST":
        if 'logged_in' in session:
            response = "Already logged in"
        else:
            username, password = request.form['username'], request.form['password']
            mPulseInstance = createmPulseInstance(username, password)
            if not mPulseInstance.token:
                response = "Invalid credentials"
            else:
                session['logged_in'] = True
                session['username'] = username
                mPulseCache[username] = mPulseInstance
                response = redirect("/")
    return response or "A post request is required to use this page."


@app.route("/mPulse/<parameter>")
def mPulsePage(parameter):
    username = session['username']
    mPulseInstance = mPulseCache[username]
    query_string = ("%s?%s") % (parameter, request.query_string.decode('utf-8'))
    response_data = mPulseInstance.getData(query_string)
    log("Sending payload", level=2)
    return Response(response_data, mimetype="application/json")


app.secret_key = os.urandom(24)
