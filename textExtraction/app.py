from flask import Flask, request, redirect, url_for, render_template, session
from flask_session import Session  # To use server-side sessions
from werkzeug.utils import secure_filename
from helper import extract_text_from_pdf,create_clusters
import os

app = Flask(__name__)
path = '/Users/sam/Documents/VU/Thesis/Code/textExtraction/'

# Set a random secret key and configure server-side sessions
app.secret_key = os.urandom(24)
SESSION_TYPE = 'filesystem'
app.config.from_object(__name__)
Session(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'pdfFile' not in request.files:
        return "No file part"
    file = request.files['pdfFile']
    course_name = request.form.get('courseName')
    course_code = request.form.get('courseCode')
    if file.filename == '':
        return "No selected file"
    if file and course_name and course_code:
        filename = secure_filename(file.filename)
        file.save(os.path.join(path, filename))
        return redirect(url_for('uploaded_file', filename=filename, course_name=course_name, course_code=course_code))

@app.route('/uploads/<filename>/<course_name>/<course_code>')
def uploaded_file(filename, course_name, course_code):
    title_topic_dict = extract_text_from_pdf(filename)
    session['title_topic_dict'] = title_topic_dict  # Store the dictionary in session
    return redirect(url_for('topic_simplification'))  # Redirect to topic_simplification

@app.route('/topic_simplification', methods=['GET', 'POST'])
def topic_simplification():
    title_topic_dict = session.get('title_topic_dict', {})  # Get the dictionary from session

    if request.method == 'POST':
        new_value = request.form.get('new_value')
        key = request.form.get('key')
        index = int(request.form.get('index'))

        # Update the dictionary with the new value
        title_topic_dict[key][index] = new_value
        session['title_topic_dict'] = title_topic_dict  # Update the dictionary in session

        return redirect(url_for('topic_simplification'))  # Redirect back to topic_simplification to process next value

    else:
        long_value_key = long_value = index = None
        for k, v in title_topic_dict.items():  # Loop through all items
            for i, topic in enumerate(v):  # Loop through all topics in each item
                if len(topic) > 40:  # If a topic is too long
                    long_value_key = k
                    long_value = topic
                    index = i
                    break
            if long_value is not None:  # If a long topic has been found
                break

        if long_value_key is not None:
            return render_template('topic_simplification.html', long_value_key=long_value_key, long_value=long_value, index=index)
        else:
            return redirect(url_for('processing'))  # If no long values left, move to processing


@app.route('/clustering')
def clustering():
    title_topic_dict = session.get('title_topic_dict', {})  # Get the cleaned dictionary from session
    clusters, sorted_clusters = create_clusters(list(title_topic_dict.values()))
    # Handle the clusters and sorted_clusters as needed
    return render_template('clusters.html', clusters=clusters, sorted_clusters=sorted_clusters)

@app.route('/processing')
def processing():
    title_topic_dict = session.get('title_topic_dict', {})  # Get the simplified dictionary from session
    session['title_topic_dict'] = title_topic_dict  # Save the cleaned dictionary back into session
    return redirect(url_for('clustering'))

if __name__ == '__main__':
    app.run(port=5000, debug=True)
