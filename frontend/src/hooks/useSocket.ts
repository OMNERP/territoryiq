'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/index';
import toast from 'react-hot-toast';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function useSocket() {
  const { accessToken, user } = useAuthStore();
  const { fetchLiveMrs } = useDashboardStore();
  const connected = useRef(false);

  useEffect(() => {
    if (!accessToken || connected.current) return;

    socket = io(WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      connected.current = true;
    });

    socket.on('disconnect', () => {
      connected.current = false;
    });

    // Live MR location updates
    socket.on('mr:location:update', () => {
      fetchLiveMrs();
    });

    // Visit check-in alerts
    socket.on('visit:checkin', (data: any) => {
      if (['admin','sales_manager','regional_manager'].includes(user?.role || '')) {
        toast.success(`${data.mrName || 'MR'} checked in`, { duration: 3000 });
      }
    });

    // New alert
    socket.on('alert:new', (alert: any) => {
      const colors: Record<string, string> = {
        critical: '🔴', warning: '🟡', info: '🔵',
      };
      toast(`${colors[alert.severity] || ''} ${alert.title}`, {
        duration: 6000,
        style: {
          background: '#161b2e',
          color: '#e8eaf0',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      });
    });

    return () => {
      socket?.disconnect();
      socket = null;
      connected.current = false;
    };
  }, [accessToken]);

  return {
    socket,
    emit: (event: string, data?: any) => socket?.emit(event, data),
    on:   (event: string, cb: (...args: any[]) => void) => {
      socket?.on(event, cb);
      return () => socket?.off(event, cb);
    },
  };
}

export function emitGpsUpdate(lat: number, lng: number, accuracy?: number) {
  socket?.emit('gps:update', { lat, lng, accuracy });
}
