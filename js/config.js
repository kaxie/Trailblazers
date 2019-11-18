/**
 * selfie configuration
 *
 * Author: ferenc.szekely@gmail.com
 * License: MIT
 *
 * Copyright (c) 2019 Ferenc Székely
 */
let config = {
  // offline message
  offline: '',//"The uMEC APIs will be available shortly.",
  
  // model to be used for predictions by default
  model: "ssdlite_mobilenet_v2_coco_2018_05_09",

  // list of different models
  // other models require deployment to uMEC
  models: {
    ssdlite_mobilenet_v2_coco_2018_05_09: {
      url: "http://micromec.org:32002/v1/models/ssdlite_mobilenet_v2_coco_2018_05_09:predict"
    }
  }
}
