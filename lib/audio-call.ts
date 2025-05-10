// Konfigurasi ICE server
export const iceServers = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
}

// Kelas untuk mengelola koneksi WebRTC untuk panggilan suara
export class AudioCallConnection {
  peerConnection: RTCPeerConnection
  localStream: MediaStream | null = null
  remoteStream: MediaStream | null = null
  onIceCandidate: (candidate: RTCIceCandidate) => void
  onTrack: (stream: MediaStream) => void
  onConnectionStateChange: (state: RTCPeerConnectionState) => void

  constructor(
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onTrack: (stream: MediaStream) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void,
  ) {
    this.peerConnection = new RTCPeerConnection(iceServers)
    this.onIceCandidate = onIceCandidate
    this.onTrack = onTrack
    this.onConnectionStateChange = onConnectionStateChange

    // Set up event handlers
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(event.candidate)
      }
    }

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0]
      this.onTrack(this.remoteStream)
    }

    this.peerConnection.onconnectionstatechange = () => {
      this.onConnectionStateChange(this.peerConnection.connectionState)
    }
  }

  // Menambahkan stream audio lokal
  async addLocalAudioStream() {
    try {
      // Hanya minta akses audio, tanpa video
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream) {
          this.peerConnection.addTrack(track, this.localStream)
        }
      })
      return this.localStream
    } catch (error) {
      console.error("Error getting user audio:", error)
      throw error
    }
  }

  // Membuat offer
  async createOffer() {
    try {
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)
      return offer
    } catch (error) {
      console.error("Error creating offer:", error)
      throw error
    }
  }

  // Membuat answer
  async createAnswer() {
    try {
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)
      return answer
    } catch (error) {
      console.error("Error creating answer:", error)
      throw error
    }
  }

  // Menerima offer
  async receiveOffer(offer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    } catch (error) {
      console.error("Error receiving offer:", error)
      throw error
    }
  }

  // Menerima answer
  async receiveAnswer(answer: RTCSessionDescriptionInit) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (error) {
      console.error("Error receiving answer:", error)
      throw error
    }
  }

  // Menambahkan ICE candidate
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.error("Error adding ICE candidate:", error)
      throw error
    }
  }

  // Menutup koneksi
  close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
    }
    this.peerConnection.close()
  }

  // Mute/unmute audio
  setMuted(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted
      })
    }
  }
}
