# coding: utf-8
from flask import Flask, request, make_response, jsonify, render_template
import os
import werkzeug
from datetime import datetime
from PIL import Image

app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

UPLOAD_DIR = 'dest'

@app.route('/')
def index():
   return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_multipart():
    file_key = 'canvas-image'
    if file_key not in request.files:
        return make_response(jsonify({'result':'uploadFile is required.'}))

    file = request.files[file_key]
    fileName = file.filename
    if not fileName:
        return make_response(jsonify({'result':'filename must not empty.'}))
    image_type = request.form.get('type', '')
    saveFileName = image_type + datetime.now().strftime('_%Y%m%d_%H%M%S') + '.jpg'
    upload_dir = os.path.join(UPLOAD_DIR, image_type)
    save_path = os.path.join(upload_dir, saveFileName)
    os.makedirs(upload_dir, exist_ok=True)
    file.save(save_path)

    print(saveFileName, fileName)
    img = Image.open(save_path)
    img_resize = crop_max_square(img).resize((300, 300)).convert('RGB')
    img_resize.save(save_path)
    return make_response(jsonify({'result':'upload OK.'}))

@app.route('/clean')
def clean():
    dirs =  os.walk('dest')
    error_images = []
    for directory, sub_directory, filenames in dirs:
        if not filenames:
            continue
        for filename in filenames:
            filepath = os.path.join(directory,  filename)
            print(filepath)
            try:
                Image.open(filepath).load()
            except:
                print("error🍎", filepath)
                error_images.append(filepath)
                os.remove(filepath)
    return jsonify(error_images)

@app.errorhandler(werkzeug.exceptions.RequestEntityTooLarge)
def handle_over_max_file_size(error):
    print('werkzeug.exceptions.RequestEntityTooLarge')
    return 'result : file size is overed.'

def crop_center(pil_img, crop_width, crop_height):
    img_width, img_height = pil_img.size
    return pil_img.crop(((img_width - crop_width) // 2,
                         (img_height - crop_height) // 2,
                         (img_width + crop_width) // 2,
                         (img_height + crop_height) // 2))

def crop_max_square(pil_img):
    return crop_center(pil_img, min(pil_img.size), min(pil_img.size))

if __name__ == '__main__':
    # app.run()
    app.run(debug=True)