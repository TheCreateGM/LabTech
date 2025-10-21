import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error'
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: any;

  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  private messages$ = new Subject<any>();

  constructor() {}

  connect(token: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionStatus$.next(ConnectionStatus.CONNECTING);

    // Convert HTTP URL to WebSocket URL
    const wsUrl = (environment.apiUrl || 'http://localhost:3000')
      .replace('http://', 'ws://')
      .replace('https://', 'wss://');

    try {
      this.socket = new WebSocket(`${wsUrl}/ws?token=${token}`);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.connectionStatus$.next(ConnectionStatus.CONNECTED);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Send authentication message
        this.send('authenticate', { token });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messages$.next(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatus$.next(ConnectionStatus.ERROR);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionStatus$.next(ConnectionStatus.DISCONNECTED);
        this.attemptReconnect(token);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.connectionStatus$.next(ConnectionStatus.ERROR);
    }
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.connectionStatus$.next(ConnectionStatus.DISCONNECTED);
  }

  send(event: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  on(event: string): Observable<any> {
    return new Observable(observer => {
      const subscription = this.messages$.subscribe(message => {
        if (message.event === event) {
          observer.next(message.data);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus$.asObservable();
  }

  isConnected(): boolean {
    return this.connectionStatus$.value === ConnectionStatus.CONNECTED;
  }
}
