import os
from mPulse import mPulse
from flask import Flask, render_template, request, Response, session, redirect
app = Flask(__name__)

LOG_LEVEL = 2

def log(message, level=1):
    if (level <= LOG_LEVEL):
        print(message)

def createmPulseInstance(username=None, password=None, token=None):
    APIkey = "C2NRZ-PALRU-BXBQR-ULJ9A-XD2AB"
    mPulseInstance = mPulse(username, password, APIkey) if username else mPulse(token, APIkey)
    return mPulseInstance

@app.route('/')
def index():
    if 'token' in request.cookies:
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
        if 'token' in request.cookies:
            response = "Already logged in"
        else:
            username, password = request.form['username'], request.form['password']
            mPulseInstance = createmPulseInstance(username=username, password=password)
            if not mPulseInstance.token:
                response = "Invalid credentials"
            else:
                redirect_to_index = redirect("/")
                response = app.make_response(redirect_to_index)
                response.set_cookie('token', mPulseInstance.token)

    return response or render_template("login_page.html", name="login_page")

@app.route("/logout")
def logout():
    redirect_to_index = redirect("/login")
    response = app.make_response(redirect_to_index)
    response.set_cookie('token', '', expires=0)
    return response


@app.route("/mPulse/<parameter>")
def mPulsePage(parameter):
    token = request.cookies['token']
    mPulseInstance = createmPulseInstance(token=token)
    query_string = ("%s?%s") % (parameter, request.query_string.decode('utf-8'))
    response_data = mPulseInstance.getData(query_string)
    if len(response_data) != 1:
        log("Sending payload", level=2)
        return Response(response_data, mimetype="application/json")
    else:
        response = app.make_response("Invalid token")
        response.set_cookie('token', '', expires=0)
        return response


app.secret_key = os.urandom(24)
