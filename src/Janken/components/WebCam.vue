<template>
  <video ref="video" height="224" width="224" autoplay></video>
</template>

<script>
export default {
  data() {
    return {
      video: null
    }
  },
  mounted() {
    this.stream()
  },
  methods: {
    stream() {
      this.video = this.$refs.video
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          this.video.srcObject = stream
        })
    }
  }
}
</script>
