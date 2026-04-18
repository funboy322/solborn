/**
 * Sound Design System for SolBorn
 * Generates all UI feedback sounds programmatically using Web Audio API
 * No external audio files required - pure oscillator synthesis
 *
 * Lazy initialization respects Chrome autoplay policies
 */

interface AudioContextConfig {
  sampleRate: number
  masterVolume: number
}

class SoundGenerator {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private config: AudioContextConfig = {
    sampleRate: 44100,
    masterVolume: 0.3,
  }

  private initAudioContext(): void {
    if (this.audioContext !== null) return

    if (typeof window === 'undefined') return

    try {
      const audioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!audioContextClass) return

      this.audioContext = new audioContextClass()

      // Master gain for volume control
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this.config.masterVolume
      this.masterGain.connect(this.audioContext.destination)

      // Resume context on user interaction if needed (iOS)
      if (this.audioContext.state === 'suspended') {
        const resumeAudio = () => {
          this.audioContext?.resume()
          document.removeEventListener('click', resumeAudio)
          document.removeEventListener('touchend', resumeAudio)
        }
        document.addEventListener('click', resumeAudio)
        document.addEventListener('touchend', resumeAudio)
      }
    } catch (error) {
      console.warn('Web Audio API not available:', error)
    }
  }

  private getContext(): AudioContext | null {
    this.initAudioContext()
    return this.audioContext
  }

  /**
   * XP Gain Sound
   * Bright, cheerful "chirp" - ascending tone with quick fade
   * Duration: 100ms
   * Frequency: 800Hz rising to 1200Hz
   */
  xpGain(): void {
    const ctx = this.getContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const duration = 0.1
    const endTime = now + duration

    // Oscillator
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(1200, now + duration * 0.7)
    osc.frequency.exponentialRampToValueAtTime(800, endTime)

    // Envelope
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.4, now)
    env.gain.exponentialRampToValueAtTime(0.01, endTime)

    osc.connect(env)
    env.connect(this.masterGain)

    osc.start(now)
    osc.stop(endTime)
  }

  /**
   * Evolve Sound
   * Epic, triumphant evolution tone - ascending sweep with harmonic richness
   * Duration: 1.5 seconds
   * Frequency: 300Hz rising to 900Hz with harmonic overtones
   */
  evolve(): void {
    const ctx = this.getContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const duration = 1.5
    const endTime = now + duration

    // Primary oscillator
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(300, now)
    osc1.frequency.exponentialRampToValueAtTime(900, now + duration * 0.8)
    osc1.frequency.setValueAtTime(900, endTime)

    // Harmonic overtone (adds richness)
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(600, now)
    osc2.frequency.exponentialRampToValueAtTime(1800, now + duration * 0.8)
    osc2.frequency.setValueAtTime(1800, endTime)

    // Envelope with sustain
    const env1 = ctx.createGain()
    env1.gain.setValueAtTime(0, now)
    env1.gain.linearRampToValueAtTime(0.5, now + duration * 0.3)
    env1.gain.setValueAtTime(0.5, now + duration * 0.8)
    env1.gain.exponentialRampToValueAtTime(0.01, endTime)

    const env2 = ctx.createGain()
    env2.gain.setValueAtTime(0, now)
    env2.gain.linearRampToValueAtTime(0.2, now + duration * 0.3)
    env2.gain.setValueAtTime(0.2, now + duration * 0.8)
    env2.gain.exponentialRampToValueAtTime(0.005, endTime)

    osc1.connect(env1)
    osc2.connect(env2)
    env1.connect(this.masterGain)
    env2.connect(this.masterGain)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(endTime)
    osc2.stop(endTime)
  }

  /**
   * Mint Sound
   * Technological blockchain sound - digital "glitch" with pitch variation
   * Duration: 800ms
   * Creates a retro-digital effect with pitch modulation
   */
  mint(): void {
    const ctx = this.getContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const duration = 0.8
    const endTime = now + duration

    // Main oscillator
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(400, now)

    // Pitch modulation (LFO-style)
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(8, now)

    const lfoGain = ctx.createGain()
    lfoGain.gain.setValueAtTime(150, now)

    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    // Envelope
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.35, now)
    env.gain.exponentialRampToValueAtTime(0.05, now + duration * 0.6)
    env.gain.exponentialRampToValueAtTime(0.01, endTime)

    // Low-pass filter for digital character
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2000, now)
    filter.frequency.exponentialRampToValueAtTime(1000, endTime)

    osc.connect(filter)
    filter.connect(env)
    env.connect(this.masterGain)

    lfo.start(now)
    osc.start(now)
    lfo.stop(endTime)
    osc.stop(endTime)
  }

  /**
   * Click Sound
   * Soft button click - brief percussive attack with quick decay
   * Duration: 50ms
   * Frequency: 1500Hz burst
   */
  click(): void {
    const ctx = this.getContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const duration = 0.05
    const endTime = now + duration

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1500, now)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.25, now)
    env.gain.exponentialRampToValueAtTime(0.01, endTime)

    osc.connect(env)
    env.connect(this.masterGain)

    osc.start(now)
    osc.stop(endTime)
  }

  /**
   * Deploy Sound
   * Triumphant success tone - ascending major chord progression
   * Duration: 1.0 second
   * Creates a "mission accomplished" feeling with harmonic content
   */
  deploy(): void {
    const ctx = this.getContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const duration = 1.0
    const endTime = now + duration

    // Root note (fundamental)
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(523.25, now) // C5

    // Third (major chord)
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(659.25, now) // E5

    // Fifth
    const osc3 = ctx.createOscillator()
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(783.99, now) // G5

    // Quick frequency rise for "triumph"
    osc1.frequency.exponentialRampToValueAtTime(587.33, now + duration * 0.2) // D5
    osc2.frequency.exponentialRampToValueAtTime(739.99, now + duration * 0.2) // F#5
    osc3.frequency.exponentialRampToValueAtTime(880, now + duration * 0.2) // A5

    // Envelope with sustain
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(0.45, now + duration * 0.15)
    env.gain.setValueAtTime(0.45, now + duration * 0.8)
    env.gain.exponentialRampToValueAtTime(0.01, endTime)

    osc1.connect(env)
    osc2.connect(env)
    osc3.connect(env)
    env.connect(this.masterGain)

    osc1.start(now)
    osc2.start(now)
    osc3.start(now)
    osc1.stop(endTime)
    osc2.stop(endTime)
    osc3.stop(endTime)
  }

  /**
   * Message Sound
   * Subtle notification tone - quiet, non-intrusive
   * Duration: 80ms
   * Frequency: 1200Hz with fast attack and decay
   */
  message(): void {
    const ctx = this.getContext()
    if (!ctx || !this.masterGain) return

    const now = ctx.currentTime
    const duration = 0.08
    const endTime = now + duration

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.15, now)
    env.gain.exponentialRampToValueAtTime(0.02, endTime)

    osc.connect(env)
    env.connect(this.masterGain)

    osc.start(now)
    osc.stop(endTime)
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume))
    if (this.masterGain) {
      this.masterGain.gain.value = this.config.masterVolume
    }
  }

  /**
   * Mute all sounds
   */
  mute(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = 0
    }
  }

  /**
   * Unmute sounds
   */
  unmute(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = this.config.masterVolume
    }
  }
}

// Singleton instance
const soundGenerator = new SoundGenerator()

/**
 * Public SFX API
 * Usage: SFX.xpGain(), SFX.evolve(), etc.
 */
export const SFX = {
  xpGain: () => soundGenerator.xpGain(),
  evolve: () => soundGenerator.evolve(),
  mint: () => soundGenerator.mint(),
  click: () => soundGenerator.click(),
  deploy: () => soundGenerator.deploy(),
  message: () => soundGenerator.message(),
  setVolume: (volume: number) => soundGenerator.setVolume(volume),
  mute: () => soundGenerator.mute(),
  unmute: () => soundGenerator.unmute(),
}

export type { AudioContextConfig }
