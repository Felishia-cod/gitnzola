import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Auth } from './auth';

export interface NotificationDTO {
  id: string;
  destinatario_id: string;
  remetente_id: string;
  tipo: string;
  referencia_id?: string;
  referencia_tipo?: string;
  lida: boolean;
  criado_em: string;
  remetente_nome?: string;
  remetente_username?: string;
  remetente_foto_perfil?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = 'https://nzolanet-back.onrender.com';
  private notificationsSubject = new BehaviorSubject<NotificationDTO[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  private lastLoadTime: number = 0;
  private cacheDuration: number = 10000; // 10 segundos

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {}  // loadNotifications é chamado sob demanda para evitar lentidão no startup

  private getHeaders() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  async loadNotifications(page = 1, limit = 30): Promise<void> {
    const token = this.auth.getToken();
    if (!token) return;

    const now = Date.now();
    if (now - this.lastLoadTime < this.cacheDuration && this.notificationsSubject.value.length > 0) {
      return;
    }

    try {
      const response: any = await firstValueFrom(
        this.http.get(
          `${this.apiUrl}/?route=notification&action=getAll&page=${page}&limit=${limit}`,
          { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
        )
      );

      if (response.success && Array.isArray(response.data)) {
        this.notificationsSubject.next(response.data);
        const unread = response.data.filter((n: NotificationDTO) => !n.lida).length;
        this.unreadCountSubject.next(unread);
        this.lastLoadTime = Date.now();
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    const token = this.auth.getToken();
    if (!token) return;

    try {
      await firstValueFrom(
        this.http.put(
          `${this.apiUrl}/?route=notification&action=markAsRead`,
          { id: notificationId },
          { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
        )
      );
      await this.loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    const token = this.auth.getToken();
    if (!token) return;

    try {
      await firstValueFrom(
        this.http.put(
          `${this.apiUrl}/?route=notification&action=markAllAsRead`,
          {},
          { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
        )
      );
      await this.loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }

  getNotifications(): NotificationDTO[] {
    return this.notificationsSubject.value;
  }

  refreshNotifications(): void {
    this.loadNotifications();
  }
}
