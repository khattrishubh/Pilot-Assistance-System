import { Volume2, VolumeX, Pause, Play, Square, Settings } from 'lucide-react'
import { useState } from 'react'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'

const TTSControls = ({ text, briefingData, className = '', size = 'default' }) => {
  const [showSettings, setShowSettings] = useState(false)
  const [rate, setRate] = useState(0.9)
  const [pitch, setPitch] = useState(1.0)
  const [volume, setVolume] = useState(0.8)

  const {
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
  } = useSpeechSynthesis()

  const handleSpeak = () => {
    if (briefingData) {
      speakWeatherBriefing(briefingData, {
        rate,
        pitch,
        volume,
        onStart: () => console.log('Started speaking briefing'),
        onEnd: () => console.log('Finished speaking briefing'),
        onError: (error) => console.error('Speech error:', error)
      })
    } else if (text) {
      speak(text, {
        rate,
        pitch,
        volume
      })
    }
  }

  const handleStop = () => {
    stop()
  }

  const handlePause = () => {
    if (isPaused) {
      resume()
    } else {
      pause()
    }
  }

  if (!isSupported) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <VolumeX className="h-4 w-4 text-slate-400" />
        <span className="text-xs text-slate-500">Speech not supported</span>
      </div>
    )
  }

  const buttonSizes = {
    small: 'p-1',
    default: 'p-2',
    large: 'p-3'
  }

  const iconSizes = {
    small: 'h-3 w-3',
    default: 'h-4 w-4',
    large: 'h-5 w-5'
  }

  const duration = estimateDuration(briefingData?.voiceBriefing?.text || text || '')

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Main control buttons */}
      <div className="flex items-center space-x-1">
        {!isSpeaking ? (
          <button
            onClick={handleSpeak}
            disabled={(!text && !briefingData)}
            className={`${buttonSizes[size]} bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2`}
            title="Start voice briefing"
          >
            <Volume2 className={iconSizes[size]} />
            {size === 'large' && <span>Play</span>}
          </button>
        ) : (
          <div className="flex space-x-1">
            <button
              onClick={handlePause}
              className={`${buttonSizes[size]} bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors`}
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? (
                <Play className={iconSizes[size]} />
              ) : (
                <Pause className={iconSizes[size]} />
              )}
            </button>
            <button
              onClick={handleStop}
              className={`${buttonSizes[size]} bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors`}
              title="Stop"
            >
              <Square className={iconSizes[size]} />
            </button>
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`${buttonSizes[size]} bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors`}
          title="Voice settings"
        >
          <Settings className={iconSizes[size]} />
        </button>
      </div>

      {/* Status and duration */}
      {size !== 'small' && (
        <div className="text-xs text-slate-500">
          {isSpeaking && (
            <span className="text-blue-600 font-medium">
              {isPaused ? 'Paused' : 'Speaking...'}
            </span>
          )}
          {duration > 0 && !isSpeaking && (
            <span>~{duration}s</span>
          )}
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50 min-w-64">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Voice Settings</h4>
          
          {/* Voice selection */}
          {voices.length > 0 && (
            <div className="mb-3">
              <label className="block text-xs text-slate-600 mb-1">Voice</label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = voices.find(v => v.name === e.target.value)
                  setSelectedVoice(voice)
                }}
                className="w-full text-xs border border-slate-300 rounded px-2 py-1"
              >
                {voices
                  .filter(voice => voice.lang.startsWith('en'))
                  .map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Speed control */}
          <div className="mb-3">
            <label className="block text-xs text-slate-600 mb-1">
              Speed: {rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Pitch control */}
          <div className="mb-3">
            <label className="block text-xs text-slate-600 mb-1">
              Pitch: {pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Volume control */}
          <div className="mb-3">
            <label className="block text-xs text-slate-600 mb-1">
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TTSControls