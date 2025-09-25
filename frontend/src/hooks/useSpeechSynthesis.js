import { useState, useRef, useEffect } from 'react'

export const useSpeechSynthesis = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const utteranceRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
      
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices()
        setVoices(availableVoices)
        
        // Try to find a good English voice
        const englishVoice = availableVoices.find(voice => 
          voice.lang.startsWith('en') && voice.localService
        ) || availableVoices.find(voice => voice.lang.startsWith('en'))
        
        if (englishVoice && !selectedVoice) {
          setSelectedVoice(englishVoice)
        }
      }
      
      loadVoices()
      speechSynthesis.addEventListener('voiceschanged', loadVoices)
      
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      }
    }
  }, [selectedVoice])

  const speak = (text, options = {}) => {
    if (!isSupported || !text) return false

    // Stop any current speech
    stop()

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    // Set voice options
    utterance.voice = selectedVoice
    utterance.rate = options.rate || 0.9
    utterance.pitch = options.pitch || 1.0
    utterance.volume = options.volume || 0.8

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
      options.onStart && options.onStart()
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
      utteranceRef.current = null
      options.onEnd && options.onEnd()
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setIsSpeaking(false)
      setIsPaused(false)
      utteranceRef.current = null
      options.onError && options.onError(event.error)
    }

    utterance.onpause = () => {
      setIsPaused(true)
      options.onPause && options.onPause()
    }

    utterance.onresume = () => {
      setIsPaused(false)
      options.onResume && options.onResume()
    }

    try {
      speechSynthesis.speak(utterance)
      return true
    } catch (error) {
      console.error('Failed to start speech synthesis:', error)
      return false
    }
  }

  const stop = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    setIsPaused(false)
    utteranceRef.current = null
  }

  const pause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause()
    }
  }

  const resume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume()
    }
  }

  const speakWeatherBriefing = (briefingData, options = {}) => {
    if (!briefingData) return false

    let briefingText = ''

    // Build comprehensive briefing text
    if (briefingData.route) {
      briefingText += `Flight briefing for route ${briefingData.route.origin} to ${briefingData.route.destination}. `
    }

    if (briefingData.summary) {
      const severity = briefingData.summary.worstSeverity
      if (severity === 'critical') {
        briefingText += 'Critical weather conditions detected. Immediate attention required. '
      } else if (severity === 'caution') {
        briefingText += 'Caution advised due to weather conditions. '
      } else {
        briefingText += 'Weather conditions are suitable for flight. '
      }

      if (briefingData.summary.criticalAlerts && briefingData.summary.criticalAlerts.length > 0) {
        briefingText += `${briefingData.summary.criticalAlerts.length} critical alerts. `
        briefingData.summary.criticalAlerts.slice(0, 3).forEach(alert => {
          briefingText += `${alert.airport}: ${alert.message}. `
        })
      }

      if (briefingData.summary.recommendations && briefingData.summary.recommendations.length > 0) {
        briefingText += 'Recommendations: '
        briefingData.summary.recommendations.slice(0, 2).forEach(rec => {
          briefingText += `${rec}. `
        })
      }
    }

    if (briefingData.voiceBriefing && briefingData.voiceBriefing.text) {
      briefingText = briefingData.voiceBriefing.text
    }

    briefingText += ' End of briefing.'

    // Clean up text for better speech
    const cleanText = briefingText
      .replace(/°/g, ' degrees ')
      .replace(/(\d+)Z/g, '$1 zulu')
      .replace(/\b([A-Z]{4})\b/g, (match) => match.split('').join(' '))
      .replace(/\s+/g, ' ')
      .trim()

    return speak(cleanText, {
      rate: 0.85, // Slower for aviation briefing
      ...options
    })
  }

  const estimateDuration = (text) => {
    if (!text) return 0
    // Average speaking rate: ~150 words per minute for aviation briefings
    const words = text.split(/\s+/).length
    return Math.ceil((words / 150) * 60)
  }

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    stop,
    pause,
    resume,
    speakWeatherBriefing,
    estimateDuration
  }
}

export default useSpeechSynthesis