import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { OrderNotificationData } from '../../../services/api/delivery/deliveryOrderNotificationService';

interface OrderNotificationCardProps {
    notification: OrderNotificationData;
    onAccept: (orderId: string) => Promise<{ success: boolean; message: string }>;
    onReject: (orderId: string) => Promise<{ success: boolean; message: string; allRejected: boolean }>;
}

export default function OrderNotificationCard({
    notification,
    onAccept,
    onReject,
}: OrderNotificationCardProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);
    const vibrationPatternRef = useRef<number[]>([200, 100, 200, 100, 200]);

    // Vibrate on notification (if supported)
    const vibrate = useCallback((pattern?: number | number[]) => {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern || vibrationPatternRef.current);
            } catch (error) {
                console.log('Vibration not supported or blocked:', error);
            }
        }
    }, []);

    // Initialize audio with better error handling
    useEffect(() => {
        const audio = new Audio('/assets/sound/delivery-alert.mp3');
        audio.loop = true;
        audio.volume = 0.8;

        // Set up error handlers
        const handleAudioError = (error: Event) => {
            console.error('Audio error:', error);
            setAudioError('Audio file could not be loaded');
        };

        const handleAudioAbort = () => {
            console.log('Audio playback aborted');
        };

        const handleAudioStalled = () => {
            console.log('Audio playback stalled');
        };

        audio.addEventListener('error', handleAudioError);
        audio.addEventListener('abort', handleAudioAbort);
        audio.addEventListener('stalled', handleAudioStalled);

        audioRef.current = audio;

        // Vibrate when notification appears
        vibrate();

        // Try to play audio with better permission handling
        const playAudio = async () => {
            try {
                // Check if audio is ready
                if (audio.readyState >= 2) {
                    await audio.play();
                    setHasUserInteracted(true);
                    setAudioError(null);
                } else {
                    // Wait for audio to load
                    audio.addEventListener('canplaythrough', async () => {
                        try {
                            await audio.play();
                            setHasUserInteracted(true);
                            setAudioError(null);
                        } catch (playError: any) {
                            console.log('Audio autoplay blocked:', playError);
                            if (playError.name === 'NotAllowedError') {
                                setAudioError('Tap to enable sound');
                            } else if (playError.name === 'NotSupportedError') {
                                setAudioError('Audio not supported');
                            }
                        }
                    }, { once: true });

                    // Load the audio
                    audio.load();
                }
            } catch (error: any) {
                console.log('Audio autoplay blocked:', error);
                if (error.name === 'NotAllowedError') {
                    setAudioError('Tap to enable sound');
                } else if (error.name === 'NotSupportedError') {
                    setAudioError('Audio not supported');
                } else {
                    setAudioError('Audio playback failed');
                }
            }
        };

        playAudio();

        return () => {
            audio.removeEventListener('error', handleAudioError);
            audio.removeEventListener('abort', handleAudioAbort);
            audio.removeEventListener('stalled', handleAudioStalled);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [vibrate]);

    // Play audio on user interaction with better error handling
    const handleUserInteraction = async () => {
        if (!hasUserInteracted && audioRef.current) {
            try {
                // Ensure audio is loaded
                if (audioRef.current.readyState < 2) {
                    audioRef.current.load();
                }
                await audioRef.current.play();
                setHasUserInteracted(true);
                setAudioError(null);
            } catch (error: any) {
                console.error('Failed to play audio:', error);
                if (error.name === 'NotAllowedError') {
                    setAudioError('Audio permission denied');
                } else if (error.name === 'NotSupportedError') {
                    setAudioError('Audio not supported on this device');
                } else {
                    setAudioError('Failed to play audio');
                }
            }
        }
    };

    // Stop audio when component unmounts or notification is dismissed
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const handleAccept = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        // Stop audio and vibration
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        // Stop any ongoing vibration
        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }

        try {
            const result = await onAccept(notification.orderId);
            if (!result.success) {
                // Suppress alert for "Order notification not found" as it's handled by the hook clearing the notification
                if (result.message !== 'Order notification not found') {
                    alert(result.message || 'Failed to accept order');
                }
                setIsProcessing(false);
                // Resume audio if accept failed
                if (audioRef.current && hasUserInteracted) {
                    audioRef.current.play().catch(console.error);
                    vibrate(); // Resume vibration
                }
            }
        } catch (error) {
            console.error('Error accepting order:', error);
            alert('Failed to accept order');
            setIsProcessing(false);
            // Resume audio if accept failed
            if (audioRef.current && hasUserInteracted) {
                audioRef.current.play().catch(console.error);
                vibrate(); // Resume vibration
            }
        }
    };

    const handleReject = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        // Stop audio and vibration
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        // Stop any ongoing vibration
        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }

        try {
            const result = await onReject(notification.orderId);
            if (!result.success) {
                // Suppress alert for "Order notification not found"
                if (result.message !== 'Order notification not found') {
                    alert(result.message || 'Failed to reject order');
                }
                // Resume audio if reject failed
                if (audioRef.current && hasUserInteracted) {
                    audioRef.current.play().catch(console.error);
                    vibrate(); // Resume vibration
                }
            }
        } catch (error) {
            console.error('Error rejecting order:', error);
            alert('Failed to reject order');
            // Resume audio if reject failed
            if (audioRef.current && hasUserInteracted) {
                audioRef.current.play().catch(console.error);
                vibrate(); // Resume vibration
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const formatAddress = () => {
        const { address, city, state, pincode, landmark } = notification.deliveryAddress;
        return `${address}${landmark ? `, Near ${landmark}` : ''}, ${city}${state ? `, ${state}` : ''} - ${pincode}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed top-2 left-2 right-2 sm:top-4 sm:left-auto sm:right-4 sm:w-[350px] z-[9999] font-poppins"
            onClick={handleUserInteraction}
            onMouseEnter={handleUserInteraction}
            onTouchStart={handleUserInteraction}
        >
            <div className="village-card paper-texture organic-radius bg-white p-5 border-2 border-[#8B3D28]/30 shadow-2xl relative overflow-hidden ring-4 ring-[#8B3D28]/5">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
                
                {/* Header with pulsing indicator */}
                <div className="flex items-center justify-between mb-5 flex-wrap gap-2 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 bg-[#8B3D28] rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 w-2.5 h-2.5 bg-[#8B3D28] rounded-full animate-ping opacity-50"></div>
                        </div>
                        <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-village-umber">New Assignment</h3>
                    </div>
                    {(audioError || !hasUserInteracted) && (
                        <div className="text-[8px] font-black uppercase tracking-widest text-stone-400 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100 italic">
                            {audioError || 'TAP TO ACTIVATE SONAR'}
                        </div>
                    )}
                </div>

                {/* Order Information */}
                <div className="space-y-4 mb-6 relative z-10">
                    <div className="bg-stone-50/50 p-3 rounded-2xl border border-stone-100/50 shadow-inner">
                        <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest mb-1.5 opacity-80">MARK-ID</p>
                        <p className="text-sm font-black text-village-umber tracking-tight italic">{notification.orderNumber}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest mb-1 opacity-80">PATRON</p>
                            <p className="text-[11px] font-black text-village-umber leading-snug line-clamp-1">{notification.customerName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest mb-1 opacity-80">VALUATION</p>
                            <p className="text-sm font-black text-[#4A7C59] tracking-tighter italic">{"\u20B9"}{notification.total.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-start gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-stone-200 mt-1 shrink-0"></div>
                         <div>
                            <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest mb-1 opacity-80">DROPOFF SECTOR</p>
                            <p className="text-[10px] font-bold text-stone-400 leading-relaxed uppercase tracking-tight line-clamp-2">{formatAddress()}</p>
                         </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 relative z-10">
                    <button
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-400 font-black text-[9px] uppercase tracking-[0.2em] rounded-2xl transition-all disabled:opacity-50 active:scale-95 border-none outline-none shadow-inner"
                    >
                        {isProcessing ? 'SCANNING...' : 'DECLINE'}
                    </button>
                    <button
                        onClick={handleAccept}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 bg-[#8B3D28] hover:bg-[#3D2B1F] text-white font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-[#8B3D28]/30 border-none outline-none relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] group-hover:scale-110 transition-transform"></div>
                        <span className="relative z-10">{isProcessing ? 'RESERVING...' : 'ACCEPT'}</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

