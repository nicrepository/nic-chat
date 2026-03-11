import React, { useState, useRef } from 'react';
import { Client4 } from 'mattermost-redux/client';
import './nic_voice_player.scss';

// Ícones SVG minimalistas
const PlayIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>;
const PauseIcon = () => <svg viewBox="0 0 24 24" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>;
const DownloadIcon = () => <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/></svg>;

type Props = {
    fileId: string;
    durationProp?: number | string;
};

const NicVoicePlayer = ({ fileId, durationProp }: Props) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [nativeDuration, setNativeDuration] = useState(0);

    // Tratamento blindado: Garante que o valor do banco sempre será lido como Número
    const dbDuration = Math.round(Number(durationProp)) || 0;
    
    // Fonte da verdade: Se o banco tem a duração, usa ela. Senão, tenta a nativa.
    const activeDuration = dbDuration > 0 ? dbDuration : nativeDuration;

    const audioSrc = Client4.getFileUrl(fileId);
    const downloadUrl = `${audioSrc}?download=1`;

    // --- EVENTOS NATIVOS DO REACT (Fim dos bugs de atraso de estado) ---
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            const duration = audioRef.current.duration;
            if (isFinite(duration) && duration > 0) {
                setNativeDuration(duration);
            }
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio || activeDuration === 0) return;

        const newTime = (Number(e.target.value) / 100) * activeDuration;
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (time: number) => {
        if (!isFinite(time) || isNaN(time)) return "00:00";
        const mins = Math.floor(time / 60).toString().padStart(2, '0');
        const secs = Math.floor(time % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // A barra agora é reativa em tempo real com o activeDuration
    const progressPercentage = activeDuration > 0 ? (currentTime / activeDuration) * 100 : 0;

    return (
        <div className="nic-voice-player">
            {/* O React agora gerencia os eventos da mídia diretamente */}
            <audio 
                ref={audioRef} 
                src={audioSrc} 
                preload="metadata" 
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
            
            <button className="nic-voice-play-btn" onClick={togglePlay}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            
            <div className="nic-voice-timeline">
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={progressPercentage} 
                    onChange={handleSeek} 
                    className="nic-voice-scrubber"
                />
            </div>
            
            <div className="nic-voice-timer">
                {formatTime(currentTime)} / {formatTime(activeDuration)}
            </div>

            <a 
                href={downloadUrl} 
                download={`nic_voice_${fileId}.webm`}
                className="nic-voice-download-btn"
                title="Baixar Áudio"
                target="_blank"
                rel="noopener noreferrer"
            >
                <DownloadIcon />
            </a>
        </div>
    );
};

export default NicVoicePlayer;