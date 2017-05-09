import os
from functools import wraps
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

def check_auth(username, password):
    token = mPulse.getToken1(username, password)
    return token != None


def authenticate():
    """Sends a 401 response that enables basic auth"""
    return Response(
        'Could not verify your access level for that URL.\n'
        'You have to login with proper credentials', 401,
        {'WWW-Authenticate': 'Basic realm="Login Required"'}
    )

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

@app.route('/')
@requires_auth
def index():
    auth = request.authorization
    if not 'token' in request.cookies:
        mPulseInstance = createmPulseInstance(username=auth.username, password=auth.password)
        response = app.make_response(render_template("index.html", name="index"))
        response.set_cookie('token', mPulseInstance.token)
        return response
    else:
        return render_template("index.html", name="index")

@app.route("/chart.js")
def chart():
    return render_template("chart.js", name="chartjs")

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
