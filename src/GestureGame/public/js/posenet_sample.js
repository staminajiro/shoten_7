/** 
* @license
* Copyright Copyright 2018 Google Inc. All Rights Reserved.
* Apache License Version 2.0（「本ライセンス」）に基づいてライセンスされます。
* あなたがこのファイルを使用するためには、本ライセンスに従わなければなりません。
* 本ライセンスのコピーは下記の場所から入手できます。
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* 適用される法律または書面での同意によって命じられない限り、
* 本ライセンスに基づいて頒布されるソフトウェアは、明示黙示を問わず、
* いかなる保証も条件もなしに「現状のまま」頒布されます。
* 本ライセンスでの権利と制限を規定した文言については、本ライセンスを参照してください。
*/
/*
* このプログラムは
* https://github.com/tensorflow/tfjs-models/tree/master/posenet/demos
* および
* https://github.com/tensorflow/tfjs-models/blob/master/posenet/demos/camera.js
* をもとに作成しました。
*/
const imageScaleFactor = 0.5;
const outputStride = 16;
const flipHorizontal = false;
const contentWidth = 800;
const contentHeight = 600;
const ballNum = 2;
const colors = ["red","blue","green"];
const fontLayout = "bold 50px Arial";
const lineWidth = 2;

let stats = new Stats();
let balls = [];
let score = 0;
let timeLimit = 200;
let printLimit = timeLimit / 10;
let naviko = new Image();
let navScale = 1;
let net;
let video;

var annimationCallbackId ;
//naviko.src = "naviko.png"
balls = initBalls(ballNum);
bindPage();

async function bindPage() {
    net = await posenet.load();
    try {
        video = await loadVideo();
    } catch(e) {
        console.error(e);
        return;
    }
    detectPoseInRealTime(video, net);
}

async function loadVideo() {
    const video = await setupCamera();
    video.play();
    return video;
}

async function setupCamera() {
    const video = document.getElementById('video');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
            'audio': false,
            'video': true});
        video.srcObject = stream;

        return new Promise(resolve => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } else {
        const errorMessage = "This browser does not support video capture, or this device does not have a camera";
        alert(errorMessage);
        return Promise.reject(errorMessage);
    }
}

function detectPoseInRealTime(video, net) {
    // init vars
    stats = new Stats();
    balls = [];
    balls = initBalls(ballNum);
    score = 0;
    timeLimit = 200;
    printLimit = timeLimit / 10;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const flipHorizontal = true; // since images are being fed from a webcam

    var loopstarttime = new Date();
    var looptmptime = new Date();
    async function poseDetectionFrame() {
        stats.begin();
        let poses = [];
        const pose = await net.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride);
        poses.push(pose);

        ctx.clearRect(0, 0, contentWidth,contentHeight);

        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-contentWidth, 0);
        ctx.drawImage(video, 0, 0, contentWidth, contentHeight);
        ctx.restore();

	if (timeLimit % 10 == 0) {
        looptmptime = new Date();
        console.log(looptmptime-loopstarttime)
        loopstarttime = looptmptime
        printLimit = timeLimit / 10;
	}
	ctx.font = fontLayout;
	ctx.fillStyle = "blue";
	ctx.fillText(printLimit, 670, 70);
	ctx.fill();

	if (timeLimit == 0) {
	    ctx.font = fontLayout;
	    ctx.fillStyle = "red";
	    ctx.fillText("TIME UP", 300, 300);
        ctx.fill();
        return;
	} else {
        poses.forEach(({ s, keypoints }) => {
		    //drawNaviko(keypoints[0],keypoints[1],ctx);
		    drawWristPoint(keypoints[9],ctx);
            drawWristPoint(keypoints[10],ctx);
            drawSkeleton(keypoints, 0.5, ctx);
		    ballsDecision(ctx,[keypoints[9],keypoints[10]]);
            });
	}

	ctx.font = fontLayout;
	ctx.fillStyle = "red";
	ctx.fillText(score, 70, 70);
	ctx.fill();
	timeLimit -= 1;
	if(timeLimit <= 0){
	    timeLimit = 0;
	}
    stats.end();
    annimationCallbackId = requestAnimationFrame(poseDetectionFrame);
    }
    poseDetectionFrame();
}

function drawWristPoint(wrist,ctx){
    ctx.beginPath();
    ctx.arc(wrist.position.x , wrist.position.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "pink";
    ctx.fill();
}

function drawNaviko(nose, leye, ctx){
    navScale = (leye.position.x - nose.position.x - 50) / 20;
    if (navScale < 1) navScale = 1;
    let nw = naviko.width * navScale;
    let nh = naviko.height * navScale;
    ctx.drawImage(naviko,nose.position.x - nh / 2 , nose.position.y - nh / 1.5, nw, nh);
}

function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
    const adjacentKeyPoints =
        posenet.getAdjacentKeyPoints(keypoints, minConfidence);
  
    adjacentKeyPoints.forEach((keypoints) => {
      drawSegment(
          toTuple(keypoints[0].position), toTuple(keypoints[1].position), color,
          scale, ctx);
    });
  }

function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

function toTuple({y, x}) {
    return [y, x];
  }

function ballsDecision(ctx,wrists){
    for(i=0;i<ballNum;i++){
        balls[i].y += 30;
        if (balls[i].y > contentHeight) {
            balls[i] = resetBall();
            return;
        }  else {
	    wrists.forEach((wrist) => {
		if((balls[i].x - 50)  <= wrist.position.x && wrist.position.x <= (balls[i].x + 50) &&
		   (balls[i].y - 50) <= wrist.position.y && wrist.position.y <= (balls[i].y + 50)){
		    score += 10;
		    balls[i] = resetBall();
		}
	    });
	    ctx.beginPath();
            ctx.arc(balls[i].x , balls[i].y, 25, 0, 2 * Math.PI);
            ctx.fillStyle = balls[i].color
            ctx.fill();
        }
    }
}

function resetBall(){
    color = Math.floor(Math.random()*3);
    return {color:colors[color], x:Math.floor(Math.random()*(contentWidth  - 50) + 50), y:0}
}

function initBalls(n=2){
    let x,y
    let initBalls = []
    for(i=0;i<n;i++){
        let ball = resetBall();
        initBalls.push(ball);
    }
    return initBalls;
}
