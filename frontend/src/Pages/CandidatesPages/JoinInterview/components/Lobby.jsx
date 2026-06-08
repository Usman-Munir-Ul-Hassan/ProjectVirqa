'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, Volume2, Play, Square, Wifi, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

const Lobby = ({ onJoin, userName, role }) => {
    const [isMicOn, setIsMicOn] = useState(true);
    const [micPermission, setMicPermission] = useState('checking'); // 'checking', 'granted', 'denied'
    const [audioStream, setAudioStream] = useState(null);
    const [volumeLevel, setVolumeLevel] = useState(0);
    const [speakerTesting, setSpeakerTesting] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [networkStatus, setNetworkStatus] = useState('checking'); // 'checking', 'good', 'poor'

    const animationRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const testAudioRef = useRef(null);

    // Initialize test audio
    useEffect(() => {
        testAudioRef.current = new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3');
        testAudioRef.current.onended = () => setSpeakerTesting(false);
    }, []);

    // Network Status Check
    useEffect(() => {
        const checkNetwork = () => {
            setNetworkStatus(navigator.onLine ? 'good' : 'poor');
        };
        // Initial delay for UX
        const timer = setTimeout(checkNetwork, 1000);
        window.addEventListener('online', () => setNetworkStatus('good'));
        window.addEventListener('offline', () => setNetworkStatus('poor'));
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('online', () => setNetworkStatus('good'));
            window.removeEventListener('offline', () => setNetworkStatus('poor'));
        };
    }, []);

    // Audio stream & visualization setup
    useEffect(() => {
        let stream = null;

        const startAudio = async () => {
            if (isMicOn) {
                try {
                    setMicPermission('checking');
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    setAudioStream(stream);
                    setMicPermission('granted');

                    // Audio Visualization Setup
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                    analyserRef.current = audioContextRef.current.createAnalyser();
                    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                    sourceRef.current.connect(analyserRef.current);
                    analyserRef.current.fftSize = 256;

                    const bufferLength = analyserRef.current.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);

                    const draw = () => {
                        if (!analyserRef.current) return;
                        analyserRef.current.getByteFrequencyData(dataArray);

                        let sum = 0;
                        for (let i = 0; i < bufferLength; i++) {
                            sum += dataArray[i];
                        }
                        const average = sum / bufferLength;
                        setVolumeLevel(average);

                        animationRef.current = requestAnimationFrame(draw);
                    };

                    draw();

                } catch (error) {
                    console.error("Error accessing microphone:", error);
                    setMicPermission('denied');
                    setIsMicOn(false);
                }
            } else {
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                    setAudioStream(null);
                }
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
                setVolumeLevel(0);
            }
        };

        startAudio();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [isMicOn]);

    const toggleMic = () => {
        // If denied, we can't toggle back easily without user changing browser settings, but we can try
        if (micPermission === 'denied' && !isMicOn) {
            setIsMicOn(true);
        } else {
            setIsMicOn(!isMicOn);
        }
    };

    const toggleSpeakerTest = () => {
        if (!testAudioRef.current) return;
        if (speakerTesting) {
            testAudioRef.current.pause();
            testAudioRef.current.currentTime = 0;
            setSpeakerTesting(false);
        } else {
            testAudioRef.current.play().catch(e => console.error("Audio play failed:", e));
            setSpeakerTesting(true);
        }
    };

    const isReadyToJoin = micPermission === 'granted' && termsAccepted && networkStatus === 'good';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 lg:p-8 font-sans">
            <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row h-auto lg:min-h-[600px]">

                {/* Left: Device Check & Visualization */}
                <div className="w-full lg:w-1/2 bg-gray-900 p-8 flex flex-col items-center justify-center relative">
                    {/* Animated Audio Visualizer Circle */}
                    <div className="relative flex items-center justify-center mb-12 mt-8">
                        {micPermission === 'granted' && isMicOn && (
                            <>
                                <div className="absolute w-40 h-40 bg-indigo-500/30 rounded-full transition-all duration-75 ease-out"
                                    style={{ transform: `scale(${1 + (volumeLevel / 50)})`, opacity: 0.5 }}></div>
                                <div className="absolute w-40 h-40 bg-indigo-500/20 rounded-full transition-all duration-100 ease-out delay-75"
                                    style={{ transform: `scale(${1 + (volumeLevel / 40)})`, opacity: 0.3 }}></div>
                            </>
                        )}

                        <div className={`relative w-40 h-40 rounded-full flex items-center justify-center border-4 shadow-2xl z-10 transition-colors ${micPermission === 'denied' ? 'bg-red-900/50 border-red-500' : 'bg-gray-800 border-gray-700'}`}>
                            {micPermission === 'denied' ? (
                                <ShieldAlert size={48} className="text-red-500" />
                            ) : isMicOn ? (
                                <Mic size={48} className="text-white" />
                            ) : (
                                <MicOff size={48} className="text-red-500" />
                            )}
                        </div>
                    </div>

                    <div className="w-full max-w-sm space-y-6">
                        <div className="text-center">
                            <h3 className="text-white font-medium text-xl mb-2">Microphone Check</h3>
                            {micPermission === 'checking' && <p className="text-indigo-400">Requesting permissions...</p>}
                            {micPermission === 'denied' && <p className="text-red-400">Microphone access denied. Please allow it in your browser settings.</p>}
                            {micPermission === 'granted' && (
                                <p className="text-gray-400 text-sm">
                                    {isMicOn ? (volumeLevel > 5 ? "Great! We can hear you clearly." : "Speak into your microphone...") : "Microphone is muted"}
                                </p>
                            )}
                        </div>

                        {/* Mic Toggle Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={toggleMic}
                                className={`flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-all ${isMicOn && micPermission === 'granted' ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-red-500 text-white hover:bg-red-600'}`}
                            >
                                {isMicOn && micPermission === 'granted' ? (
                                    <> <MicOff size={18} /> Mute Microphone </>
                                ) : (
                                    <> <Mic size={18} /> Turn On Microphone </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Join Details & System Status */}
                <div className="w-full lg:w-1/2 p-8 flex flex-col justify-between bg-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Settings size={150} />
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Lobby</h1>
                        <p className="text-gray-500 mb-8">Please complete the system checks below before joining your AI-powered interview session.</p>

                        <div className="space-y-4 mb-8">
                            {/* Network Check */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${networkStatus === 'good' ? 'bg-green-100 text-green-600' : networkStatus === 'checking' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                        <Wifi size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Network Connection</p>
                                        <p className="text-xs text-gray-500">{networkStatus === 'checking' ? 'Checking...' : networkStatus === 'good' ? 'Stable and ready' : 'Poor or disconnected'}</p>
                                    </div>
                                </div>
                                {networkStatus === 'good' && <CheckCircle2 className="text-green-500" size={20} />}
                                {networkStatus === 'poor' && <AlertCircle className="text-red-500" size={20} />}
                            </div>

                            {/* Speaker Check */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                                        <Volume2 size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Speaker Output</p>
                                        <p className="text-xs text-gray-500">Test your speakers/headphones</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={toggleSpeakerTest}
                                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-indigo-600"
                                >
                                    {speakerTesting ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                </button>
                            </div>

                            {/* Mic Status Summary */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${micPermission === 'granted' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <Mic size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Microphone Input</p>
                                        <p className="text-xs text-gray-500">{micPermission === 'granted' ? 'Connected and authorized' : 'Action required'}</p>
                                    </div>
                                </div>
                                {micPermission === 'granted' ? <CheckCircle2 className="text-green-500" size={20} /> : <AlertCircle className="text-red-500" size={20} />}
                            </div>
                        </div>

                        {/* Interviewee Details */}
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50 mb-6">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                {userName.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                                <p className="text-xs text-indigo-600 font-medium">Applying for: {role}</p>
                            </div>
                        </div>

                        {/* Terms Agreement */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center mt-0.5">
                                <input 
                                    type="checkbox" 
                                    className="peer sr-only"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                />
                                <div className="w-5 h-5 border-2 border-gray-300 rounded transition-colors peer-checked:bg-indigo-600 peer-checked:border-indigo-600 peer-focus:ring-2 peer-focus:ring-indigo-600/20"></div>
                                <CheckCircle2 size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                I confirm my equipment is working, I am in a quiet environment, and I agree to the <span className="text-indigo-600 underline">recording of this session</span> for evaluation purposes.
                            </span>
                        </label>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={onJoin}
                            disabled={!isReadyToJoin}
                            className={`w-full py-4 px-6 rounded-xl font-bold shadow-lg transition-all transform flex items-center justify-center gap-2 ${
                                isReadyToJoin 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02] active:scale-[0.98] shadow-indigo-500/30' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            }`}
                        >
                            Start Interview
                        </button>
                        {!isReadyToJoin && (
                            <p className="text-center text-xs text-red-500 mt-3 font-medium">
                                * Please complete all system checks and accept the terms to continue.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
