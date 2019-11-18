/**
 * selfie.js
 * 
 * See LICENSE for licensing information
 */
'use strict';
 
const video = document.querySelector('video');
const progress = document.getElementById('progress');
const canvas = window.canvas = document.querySelector('canvas');

const constraints = {
  audio: false,
  video: {
    facingMode: "user",
    width: { min: 480, ideal: 1280 },
    height: { min: 360, ideal: 720 }
  }
};

function handleSuccess(stream) {
  window.stream = stream;
  video.srcObject = stream;
}

function handleError(error) {
  console.log('Could not open the camera: ', error.message, error.name);
}

function stop(stream) {
  stream.getTracks().forEach(function(track) {
    track.stop();
  });  
}

/**
 * Receives raw imageData upon clicking the image
 * See: https://developer.mozilla.org/en-US/docs/Web/API/ImageData
 */
function classify(tensors) {
  if (config.offline != '') {
    progress.textContent = config.offline;
    return;
  }

  let message = [];
  // Prepare our POST request and setup event handlers
  let xhr = new window.XMLHttpRequest()

  xhr.open('POST', config.models[config.model].url, true)
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')

  xhr.upload.addEventListener("progress", function(evt){
    if (evt.lengthComputable) {
      let percentComplete = Math.round(evt.loaded / evt.total);
      progress.textContent = (percentComplete * 100) + '%';
      if (percentComplete === 1) {
        progress.textContent = 'Upload to Tensorflow backend completed. Waiting for results..';
      }
    }
  }, false);

  xhr.onloadstart = function (e) {
    progress.textContent = '0%';
  }

  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
      progress.textContent = '';
      let resp = JSON.parse(xhr.responseText);
      let prediction = resp.predictions[0];

      if (prediction.num_detections == 0) {
        message.push('No recognizable objects found.');
      } else {
        for (let i = 0; i < prediction.num_detections; i++) {
          if (prediction.detection_scores[i] > 0) {
            message.push(defs[config.model][prediction.detection_classes[i]] + ' (' + Math.round((prediction.detection_scores[i] * 100)) + '%)');
          }
        }
      }
    }
  }

  xhr.onloadend = function (e) {
    for (let i = 0; i < message.length; i++) {
      progress.textContent += message[i];
      if (i < (message.length - 1)) {
        progress.textContent += ', ';
      }
    }
  }
  
  // return the tensors as a nested array
  tensors.array().then(function(array) {
    let obj = {"instances": [array]};
    let payload = JSON.stringify(obj);
    xhr.send(payload);
  });
}

/**
 * Event handler for clicking on the picture
 */
canvas.onclick = video.onclick = async function() {
  if (video.hasAttribute("hidden")) {
    progress.setAttribute("hidden", "true");
    navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
    video.removeAttribute("hidden");
    canvas.setAttribute("hidden", "true");
  } else {
    stop(stream);
    
    canvas.removeAttribute("hidden");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    let ctx = canvas.getContext('2d');
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    progress.removeAttribute("hidden");
    video.setAttribute("hidden", "true");

    // generate tensors and resize them
    let tensors = tf.browser.fromPixels(canvas);
    let newDim = [400, Math.round(canvas.height * (400 / canvas.width))];

    let resized = tf.image.resizeBilinear(tensors, newDim);
    classify(resized);
  }
};

// Initialize the camera upon loading the page -and this script- to the clients
navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
