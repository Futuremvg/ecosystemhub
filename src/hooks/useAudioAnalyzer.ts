import { useRef, useState, useCallback, useEffect } from "react";

interface AudioAnalyzerState {
  volume: number; // 0-1 normalized volume
  frequencies: number[]; // Array of frequency band levels (0-1)
  isAnalyzing: boolean;
}

const NUM_FREQUENCY_BANDS = 32;

export function useAudioAnalyzer() {
  const [state, setState] = useState<AudioAnalyzerState>({
    volume: 0,
    frequencies: new Array(NUM_FREQUENCY_BANDS).fill(0),
    isAnalyzing: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const analyze = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const bufferLength = analyserRef.current.frequencyBinCount;

    // Calculate overall volume (RMS)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArrayRef.current[i] * dataArrayRef.current[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    const normalizedVolume = Math.min(1, rms / 128); // Normalize to 0-1

    // Calculate frequency bands with smoothing
    const bandsPerSection = Math.floor(bufferLength / NUM_FREQUENCY_BANDS);
    const frequencies: number[] = [];
    
    for (let i = 0; i < NUM_FREQUENCY_BANDS; i++) {
      let bandSum = 0;
      const startIndex = i * bandsPerSection;
      const endIndex = Math.min(startIndex + bandsPerSection, bufferLength);
      
      for (let j = startIndex; j < endIndex; j++) {
        bandSum += dataArrayRef.current[j];
      }
      
      const bandAvg = bandSum / bandsPerSection;
      frequencies.push(Math.min(1, bandAvg / 255)); // Normalize to 0-1
    }

    setState(prev => ({
      ...prev,
      volume: normalizedVolume * 0.3 + prev.volume * 0.7, // Smooth volume
      frequencies: frequencies.map((f, i) => f * 0.4 + (prev.frequencies[i] || 0) * 0.6), // Smooth frequencies
    }));

    animationFrameRef.current = requestAnimationFrame(analyze);
  }, []);

  const startAnalyzing = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      mediaStreamRef.current = stream;

      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyser node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      // Connect microphone to analyser
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      setState(prev => ({ ...prev, isAnalyzing: true }));
      
      // Start animation loop
      animationFrameRef.current = requestAnimationFrame(analyze);
      
    } catch (error) {
      console.error("Error starting audio analyzer:", error);
    }
  }, [analyze]);

  const stopAnalyzing = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disconnect source
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;

    setState({
      volume: 0,
      frequencies: new Array(NUM_FREQUENCY_BANDS).fill(0),
      isAnalyzing: false,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalyzing();
    };
  }, [stopAnalyzing]);

  return {
    ...state,
    startAnalyzing,
    stopAnalyzing,
  };
}
