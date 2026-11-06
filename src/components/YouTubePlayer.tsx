import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { MOVIE_DATA } from '../types';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { EducationalCreditLine } from './EducationalCreditLine';

export interface YouTubePlayerHandle {
  playSegment: (start: number, end: number, loop: boolean, onSegmentEnd?: () => void) => void;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  setSpeed: (rate: number) => void;
  stopSegmentTracking: () => void;
}

interface Props {
  onReady?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  playbackRate?: number;
  showCredit?: boolean;
}

// Global declaration for YouTube Iframe API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, Props>(
  ({ onReady, onTimeUpdate, playbackRate = 1.0, showCredit = true }, ref) => {
    const containerIdRef = useRef<string>(`yt-player-${Math.random().toString(36).substring(2, 9)}`);
    const playerRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Segment tracking refs
    const segmentRef = useRef<{
      start: number;
      end: number;
      loop: boolean;
      onSegmentEnd?: () => void;
      loopTimer: any;
      active: boolean;
    }>({
      start: MOVIE_DATA.practiceStart,
      end: MOVIE_DATA.practiceEnd,
      loop: false,
      loopTimer: null,
      active: false,
    });

    const intervalRef = useRef<any>(null);

    // Load YouTube API script once
    useEffect(() => {
      let isMounted = true;

      const initPlayer = () => {
        if (!isMounted) return;
        if (!window.YT || !window.YT.Player) return;

        try {
          playerRef.current = new window.YT.Player(containerIdRef.current, {
            videoId: MOVIE_DATA.videoId,
            playerVars: {
              start: Math.floor(MOVIE_DATA.practiceStart),
              end: Math.ceil(MOVIE_DATA.practiceEnd),
              playsinline: 1,
              rel: 0,
              modestbranding: 1,
              controls: 1,
              cc_load_policy: 0,
            },
            events: {
              onReady: () => {
                if (!isMounted) return;
                setIsReady(true);
                if (playbackRate && playerRef.current?.setPlaybackRate) {
                  playerRef.current.setPlaybackRate(playbackRate);
                }
                onReady?.();
              },
              onStateChange: (event: any) => {
                if (!isMounted) return;
                // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
                if (event.data === 1) {
                  setIsPlaying(true);
                } else {
                  setIsPlaying(false);
                }
              },
              onError: (event: any) => {
                console.warn('YouTube Player error code:', event.data);
                // 101 or 150 = cannot be embedded
                if (isMounted) {
                  setHasError(true);
                }
              },
            },
          });
        } catch (err) {
          console.error('Error creating YouTube player:', err);
          if (isMounted) {
            setHasError(true);
          }
        }
      };

      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        const existingScript = document.getElementById('youtube-iframe-api-script');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api-script';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(tag);
        }

        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevReady) prevReady();
          initPlayer();
        };
      }

      return () => {
        isMounted = false;
        if (segmentRef.current.loopTimer) {
          clearTimeout(segmentRef.current.loopTimer);
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          try {
            playerRef.current.destroy();
          } catch (e) {
            // ignore cleanup errors
          }
        }
      };
    }, []);

    // Sync playback rate prop if changed externally
    useEffect(() => {
      if (isReady && playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
        playerRef.current.setPlaybackRate(playbackRate);
      }
    }, [playbackRate, isReady]);

    // Interval checker for segment boundaries (every 100ms as required by PRD)
    useEffect(() => {
      intervalRef.current = setInterval(() => {
        if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') {
          return;
        }

        try {
          const currentTime = playerRef.current.getCurrentTime();
          onTimeUpdate?.(currentTime);

          if (segmentRef.current.active) {
            const { start, end, loop, onSegmentEnd } = segmentRef.current;

            // When current time >= sentence.end
            if (currentTime >= end) {
              playerRef.current.pauseVideo();
              segmentRef.current.active = false;
              onSegmentEnd?.();

              if (loop) {
                // If Loop is on, wait 1.5 seconds (time for learner to speak), then play same sentence again
                if (segmentRef.current.loopTimer) {
                  clearTimeout(segmentRef.current.loopTimer);
                }
                segmentRef.current.loopTimer = setTimeout(() => {
                  if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                    playerRef.current.seekTo(start, true);
                    playerRef.current.playVideo();
                    segmentRef.current.active = true;
                  }
                }, 1500);
              }
            }
          }
        } catch (e) {
          // ignore transient iframe polling issues
        }
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [onTimeUpdate]);

    useImperativeHandle(
      ref,
      () => ({
        playSegment: (start: number, end: number, loop: boolean, onSegmentEnd?: () => void) => {
          if (!playerRef.current || typeof playerRef.current.seekTo !== 'function') return;

          if (segmentRef.current.loopTimer) {
            clearTimeout(segmentRef.current.loopTimer);
          }

          segmentRef.current = {
            start,
            end,
            loop,
            onSegmentEnd,
            loopTimer: null,
            active: true,
          };

          try {
            playerRef.current.seekTo(start, true);
            playerRef.current.playVideo();
          } catch (e) {
            console.warn('Could not start playback:', e);
          }
        },
        play: () => {
          if (playerRef.current?.playVideo) {
            playerRef.current.playVideo();
          }
        },
        pause: () => {
          if (segmentRef.current.loopTimer) {
            clearTimeout(segmentRef.current.loopTimer);
          }
          segmentRef.current.active = false;
          if (playerRef.current?.pauseVideo) {
            playerRef.current.pauseVideo();
          }
        },
        seekTo: (seconds: number) => {
          if (playerRef.current?.seekTo) {
            playerRef.current.seekTo(seconds, true);
          }
        },
        getCurrentTime: () => {
          if (playerRef.current?.getCurrentTime) {
            try {
              return playerRef.current.getCurrentTime();
            } catch (e) {
              return 0;
            }
          }
          return 0;
        },
        setSpeed: (rate: number) => {
          if (playerRef.current?.setPlaybackRate) {
            playerRef.current.setPlaybackRate(rate);
          }
        },
        stopSegmentTracking: () => {
          if (segmentRef.current.loopTimer) {
            clearTimeout(segmentRef.current.loopTimer);
          }
          segmentRef.current.active = false;
        },
      }),
      []
    );

    return (
      <div className="w-full bg-black rounded-xl overflow-hidden shadow-md flex flex-col">
        {/* 16:9 Aspect Ratio Container */}
        <div className="relative w-full aspect-video bg-neutral-900 flex items-center justify-center overflow-hidden">
          {hasError ? (
            <div className="absolute inset-0 bg-neutral-900 p-6 flex flex-col items-center justify-center text-center text-white z-20">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
              <p className="text-base font-medium mb-1">
                This video can't play inside the app.
              </p>
              <p className="text-sm text-neutral-400 mb-4">
                앱 내 재생이 제한된 영상입니다. 아래 버튼으로 유튜브에서 열어 시청할 수 있습니다.
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${MOVIE_DATA.videoId}&t=${Math.floor(MOVIE_DATA.practiceStart)}s`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors shadow-sm"
              >
                <span>Tap to open it on YouTube</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-xs text-neutral-400 mt-3">
                Sentence text, recording, and self-check still work seamlessly!
              </p>
            </div>
          ) : (
            <>
              <div id={containerIdRef.current} className="w-full h-full" />
              {!isReady && (
                <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center text-neutral-400 text-sm gap-2">
                  <div className="w-6 h-6 border-2 border-neutral-400 border-t-white rounded-full animate-spin" />
                  <span>Loading clip...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mandatory One-Line Educational Credit */}
        {showCredit && <EducationalCreditLine className="bg-neutral-950 text-neutral-400 border-t border-neutral-800" />}
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';
