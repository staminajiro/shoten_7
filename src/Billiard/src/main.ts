import { trasformToRectangle } from "./image_processing"

const constraints = { audio: false, video: { width: 500, height: 500} };
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;
navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
        const video = document.getElementById("video") as HTMLVideoElement;
        video.srcObject = stream;
        video.onloadedmetadata = function (e) {
            video.play();
        };
    });
const camera_canvas = document.createElement('canvas');
const rectangleCanvas = document.getElementById('rectangle_canvas') as HTMLCanvasElement;
camera_canvas.width = constraints.video.width
camera_canvas.height = constraints.video.height
rectangleCanvas.width = 160
rectangleCanvas.height = 290
const tl = { x: 0, y: 0 };
const tr = { x: 0, y: 0 };
const bl = { x: 0, y: 0 };
const br = { x: 0, y: 0 };

function updateVertex() {
    const tl_x = document.getElementById('tl_x') as HTMLInputElement;
    const tl_y = document.getElementById('tl_y') as HTMLInputElement;
    const tr_x = document.getElementById('tr_x') as HTMLInputElement;
    const tr_y = document.getElementById('tr_y') as HTMLInputElement;
    const bl_x = document.getElementById('bl_x') as HTMLInputElement;
    const bl_y = document.getElementById('bl_y') as HTMLInputElement;
    const br_x = document.getElementById('br_x') as HTMLInputElement;
    const br_y = document.getElementById('br_y') as HTMLInputElement;
    // y方向が直感と反対なので反転
    tl.x = Number(tl_x.value);
    tl.y = camera_canvas.height - Number(tl_y.value);
    tr.x = Number(tr_x.value);
    tr.y = camera_canvas.height - Number(tr_y.value);
    bl.x = Number(bl_x.value);
    bl.y = camera_canvas.height - Number(bl_y.value);
    br.x = Number(br_x.value);
    br.y = camera_canvas.height - Number(br_y.value);
}

setInterval(function () {
    updateVertex();
    const video = document.getElementById("video") as HTMLVideoElement;
    camera_canvas.getContext("2d")!.drawImage(video, 0, 0);
    const rectangleImage = trasformToRectangle(camera_canvas, tl, tr, bl, br, rectangleCanvas);
    rectangleCanvas.getContext("2d")!.clearRect(0, 0, rectangleCanvas.width, rectangleCanvas.height);
    rectangleCanvas.getContext("2d")!.drawImage(rectangleImage, 0, 0);
}, 1000 / 0.5); //0.5fps lol
