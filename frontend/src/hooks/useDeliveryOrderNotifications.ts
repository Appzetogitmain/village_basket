import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { OrderNotificationData } from '../services/api/delivery/deliveryOrderNotificationService';
import { acceptOrder, rejectOrder } from '../services/api/delivery/deliveryOrderNotificationService';
import { getAuthToken, getSocketBaseURL } from '../services/api/config';

interface NotificationState {
    currentNotification: OrderNotificationData | null;
    notificationQueue: OrderNotificationData[];
    isConnected: boolean;
    error: string | null;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 2000;

const getDeliveryBoyId = (user: { id?: string; _id?: string } | null) => {
    if (!user) return null;
    const id = user.id ?? user._id;
    return id ? String(id) : null;
};

export const useDeliveryOrderNotifications = () => {
    const { isAuthenticated, user, token } = useAuth();
    const { showToast } = useToast();
    const [state, setState] = useState<NotificationState>({
        currentNotification: null,
        notificationQueue: [],
        isConnected: false,
        error: null,
    });

    const socketRef = useRef<Socket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const manualAudioRef = useRef<HTMLAudioElement | null>(null);
    const connectSocketRef = useRef<() => void>(() => {});

    const deliveryBoyId = getDeliveryBoyId(user);
    const isDeliveryUser = isAuthenticated && user?.userType === 'Delivery' && !!deliveryBoyId;

    const stopNotificationAlert = useCallback(() => {
        if (manualAudioRef.current) {
            manualAudioRef.current.pause();
            manualAudioRef.current.currentTime = 0;
            manualAudioRef.current = null;
        }

        if ('vibrate' in navigator) {
            navigator.vibrate(0);
        }
    }, []);

    const removeNotificationByOrderId = useCallback((orderId: string) => {
        setState(prev => {
            const remainingQueue = prev.notificationQueue.filter(
                notification => notification.orderId !== orderId
            );

            if (prev.currentNotification?.orderId === orderId) {
                const nextNotification = remainingQueue[0] || null;
                return {
                    ...prev,
                    currentNotification: nextNotification,
                    notificationQueue: remainingQueue.slice(1),
                };
            }

            return {
                ...prev,
                notificationQueue: remainingQueue,
            };
        });
    }, []);

    const enqueueNotification = useCallback((orderData: OrderNotificationData) => {
        setState(prev => {
            const alreadyVisible = prev.currentNotification?.orderId === orderData.orderId;
            const alreadyQueued = prev.notificationQueue.some(
                notification => notification.orderId === orderData.orderId
            );

            if (alreadyVisible || alreadyQueued) {
                return prev;
            }

            if (prev.currentNotification) {
                return {
                    ...prev,
                    notificationQueue: [...prev.notificationQueue, orderData],
                };
            }

            return {
                ...prev,
                currentNotification: orderData,
            };
        });
    }, []);

    const disconnectSocket = useCallback(() => {
        stopNotificationAlert();

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, [stopNotificationAlert]);

    const attemptReconnect = useCallback(() => {
        reconnectAttemptsRef.current += 1;

        if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
            setState(prev => ({
                ...prev,
                error: 'Unable to connect. Please refresh the page.',
            }));
            return;
        }

        const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1);

        reconnectTimeoutRef.current = setTimeout(() => {
            disconnectSocket();
            connectSocketRef.current();
        }, delay);
    }, [disconnectSocket]);

    const connectSocket = useCallback(() => {
        if (!isDeliveryUser || !deliveryBoyId) {
            return;
        }

        const authToken = token || getAuthToken('delivery');
        if (!authToken) {
            setState(prev => ({
                ...prev,
                isConnected: false,
                error: 'Authentication required for delivery notifications',
            }));
            return;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        disconnectSocket();

        const socket = io(getSocketBaseURL(), {
            auth: { token: authToken },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: INITIAL_RECONNECT_DELAY,
            reconnectionDelayMax: 10000,
            timeout: 20000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            reconnectAttemptsRef.current = 0;
            setState(prev => ({
                ...prev,
                isConnected: true,
                error: null,
            }));

            socket.emit('join-delivery-notifications', deliveryBoyId);
        });

        socket.on('joined-notifications-room', () => {
            // Room joined successfully
        });

        socket.on('connect_error', (error) => {
            setState(prev => ({
                ...prev,
                isConnected: false,
                error: `Connection failed: ${error.message}`,
            }));
            attemptReconnect();
        });

        socket.on('disconnect', (reason) => {
            setState(prev => ({
                ...prev,
                isConnected: false,
            }));

            if (reason === 'io server disconnect' || reason === 'io client disconnect') {
                return;
            }

            attemptReconnect();
        });

        socket.on('new-order', (orderData: OrderNotificationData) => {
            enqueueNotification(orderData);
        });

        socket.on('order-assigned-manually', (data: any) => {
            try {
                stopNotificationAlert();
                const audio = new Audio('/assets/sound/delivery-alert.mp3');
                manualAudioRef.current = audio;
                audio.play().catch(() => undefined);

                if ('vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200]);
                }
            } catch {
                // Ignore audio init failures
            }

            const message = data.message || 'You have been manually assigned to a new order!';

            if (data.orderData) {
                enqueueNotification(data.orderData as OrderNotificationData);
            } else {
                showToast(message, 'success');
            }

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Order Assigned', {
                    body: message,
                    icon: '/favicon.ico',
                });
            }
        });

        socket.on('order-accepted', (data: { orderId: string }) => {
            stopNotificationAlert();
            removeNotificationByOrderId(data.orderId);
        });

        socket.on('order-rejected-by-all', (data: { orderId: string }) => {
            stopNotificationAlert();
            removeNotificationByOrderId(data.orderId);
        });

        socket.on('error', () => {
            setState(prev => ({
                ...prev,
                error: 'Notification service error',
            }));
        });
    }, [
        attemptReconnect,
        deliveryBoyId,
        disconnectSocket,
        enqueueNotification,
        isDeliveryUser,
        removeNotificationByOrderId,
        showToast,
        stopNotificationAlert,
        token,
    ]);

    connectSocketRef.current = connectSocket;

    const handleAccept = useCallback(async (orderId: string, navigate?: (path: string) => void) => {
        if (!socketRef.current || !deliveryBoyId) {
            return { success: false, message: 'Not connected or user not found' };
        }

        try {
            stopNotificationAlert();
            const result = await acceptOrder(socketRef.current, orderId, deliveryBoyId);

            if (result.success) {
                removeNotificationByOrderId(orderId);
                if (navigate) {
                    navigate(`/delivery/orders/${orderId}`);
                }
            } else if (result.message === 'Order notification not found') {
                removeNotificationByOrderId(orderId);
            }

            return result;
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to accept order' };
        }
    }, [deliveryBoyId, removeNotificationByOrderId, stopNotificationAlert]);

    const handleReject = useCallback(async (orderId: string) => {
        if (!socketRef.current || !deliveryBoyId) {
            return { success: false, message: 'Not connected or user not found', allRejected: false };
        }

        stopNotificationAlert();
        removeNotificationByOrderId(orderId);

        try {
            return await rejectOrder(socketRef.current, orderId, deliveryBoyId);
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to reject order',
                allRejected: false,
            };
        }
    }, [deliveryBoyId, removeNotificationByOrderId, stopNotificationAlert]);

    const clearCurrentNotification = useCallback(() => {
        stopNotificationAlert();
        setState(prev => {
            const nextNotification = prev.notificationQueue[0] || null;
            return {
                ...prev,
                currentNotification: nextNotification,
                notificationQueue: prev.notificationQueue.slice(1),
            };
        });
    }, [stopNotificationAlert]);

    useEffect(() => {
        if (!isDeliveryUser) {
            disconnectSocket();
            setState({
                currentNotification: null,
                notificationQueue: [],
                isConnected: false,
                error: null,
            });
            return;
        }

        connectSocket();

        return () => {
            disconnectSocket();
        };
    }, [connectSocket, disconnectSocket, isDeliveryUser]);

    return {
        currentNotification: state.currentNotification,
        notificationQueue: state.notificationQueue,
        isConnected: state.isConnected,
        error: state.error,
        acceptOrder: handleAccept,
        rejectOrder: handleReject,
        clearNotification: clearCurrentNotification,
        socket: socketRef.current,
    };
};
