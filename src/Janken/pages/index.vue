<template>
  <v-layout column justify-center>
    <v-flex xs12 sm8 md6 text-center>
      <v-card>
        <v-card-title class="align-center"></v-card-title>
        <web-cam ref="webcam" />
        <div>
          {{ labels[(pred + 1) % 3] }}
        </div>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import * as tf from '@tensorflow/tfjs'
import * as tfd from '@tensorflow/tfjs-data'
import WebCam from '../components/WebCam.vue'

export default {
  components: {
    WebCam
  },
  data() {
    return {
      labels: ['チョキ', 'グー', 'パー'],
      probs: [0, 0, 0],
      pred: ''
    }
  },
  mounted() {
    Promise.all([this.setupCamera(), this.loadModel()]).then(
      setInterval(this.predict, 200)
    )
  },
  methods: {
    async setupCamera() {
      this.cam = await tfd.webcam(this.$refs.webcam.video)
    },
    async loadModel() {
      this.model = await tf.loadLayersModel('/model/model.json')
    },
    async predict() {
      let img = await this.cam.capture()
      // スケーリング
      img = img.div(tf.scalar(127.5)).sub(tf.scalar(1))
      this.probs = await this.model.predict(img.expandDims(0)).data()
      this.a = img
      this.pred = this.argmax(this.probs)
    },
    argmax(arr) {
      let idx = 0
      let val = -Infinity
      for (const [i, v] of arr.entries()) {
        if (val < v) {
          idx = i
          val = v
        }
      }
      return idx
    }
  }
}
</script>
