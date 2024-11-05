import random

from flask import Flask, flash, redirect, render_template, request, session, get_flashed_messages, g
from flask_session import Session
from flask_wtf import FlaskForm
from wtforms import FileField, SubmitField
from wtforms.validators import InputRequired
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import datetime
import os

app = Flask(__name__)

app.config["SESSION_PERMANENT"] = False  # Session will be cleared when user closes their browser
app.config["SESSION_TYPE"] = "filesystem"  # Session data will be stored on the file system
app.config["SECRET_KEY"] = "test"
app.config["UPLOAD_FOLDER"] = "static/files"
Session(app)  # Initialise the session with the configs

class Upload(FlaskForm):
    file = FileField("File", validators=[InputRequired()])
    submit = SubmitField("Submit")


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect('data.db')
    return g.db

@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/editor")
def editor():
    return render_template("editor.html")

@app.route("/edgers")
def edgers():
    return render_template("edgers.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    session.clear()
    show = False
    message = ""
    if request.method == "POST":
        db = get_db()
        cursor = db.cursor()

        if not request.form.get("username") or not request.form.get("password"):
            show = True
            message = "Please fill out all fields"
        else:
            cursor = db.execute("SELECT * FROM users WHERE name = ?", (request.form.get("username"),))
            result = cursor.fetchone()
            if result is None:
                show = True
                message = "User not found"
            elif not check_password_hash(result[1], request.form.get("password")):
                show = True
                message = "Incorrect Password"
            else:
                cursor = db.execute("SELECT id FROM users WHERE name = ?", (request.form.get("username"),))
                session["user_id"] = cursor.fetchone()[0]
                return redirect("/")
    return render_template("login.html", show=show, message=message)

@app.route("/register", methods=["GET", "POST"])
def register():
    session.clear()
    show = False
    message = ""
    if request.method == "POST":
        if not request.form.get("username") or not request.form.get("password"):
            show = True
            message = "Please fill in all fields"
        elif request.form.get("password") != request.form.get("password_check"):
            show = True
            message = "Passwords do not match"
        elif not request.form.get("username") and not request.form.get("password"):
            show = True
            message = "Please fill in all fields"
        else:
            db = get_db()
            dbcursor = db.cursor()
            dbcursor.execute("INSERT INTO users (name, hash) VALUES (?, ?)", (request.form.get("username"),
                                                                generate_password_hash(request.form.get("password"))))
            db.commit()
            #session["user_id"] =
            dbcursor = db.execute("SELECT id FROM users WHERE name = ?", (request.form.get("username"),))
            session["user_id"] = dbcursor.fetchone()[0]
            return redirect("/")
    return render_template("register.html", show=show, message=message)


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route("/profile", methods=["GET", "POST"])
def profile():
    message = ""
    db = get_db()
    cursor = db.execute("SELECT name FROM users WHERE id = ?", (session["user_id"], ))
    username = cursor.fetchone()[0]
    form = Upload()
    filename = "default.jpg"
    if form.validate_on_submit():
        file = form.file.data
        name = "profile_" + str(session["user_id"])
        for x in range(len(file.filename)):
            if x >= len(file.filename) - 4:
                name = name + file.filename[x]

        file.save(os.path.join(os.path.abspath(os.path.dirname(__file__)), app.config["UPLOAD_FOLDER"],
                               secure_filename(name)))  # Then save it in the path
        message = "File Successfully Uploaded"
    try:
        if os.path.isfile(os.path.join(os.path.abspath(os.path.dirname(__file__)), app.config["UPLOAD_FOLDER"],
                               secure_filename(name))):
            filename = name
    except UnboundLocalError:
        filename = "default.jpg"

    return render_template("profile.html", form=form, message=message, filename=filename, name=username)
