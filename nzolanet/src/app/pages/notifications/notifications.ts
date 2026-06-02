import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, NotificationDTO } from '../../services/notification';
import { FollowService, FollowDTO } from '../../services/follow';

interface Activity {
  id: number;
  type: 'baze' | 'comment' | 'follow';
  userName: string;
  userHandle: string;
  userAvatar: string;
  action: string;
  postId?: number;
  comment?: string;
  time: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  incomingRequests: any[] = [];
  recentActivities: Activity[] = [];
  isLoading = true;
  private notifSub: Subscription | null = null;

  constructor(
    private notificationService: NotificationService,
    private followService: FollowService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    if (this.notifSub) this.notifSub.unsubscribe();
  }

  private async loadData() {
    this.isLoading = true;

    await Promise.all([
      this.loadNotifications(),
      this.loadPedidosPendentes()
    ]);

    this.isLoading = false;
  }

  private async loadNotifications() {
    await this.notificationService.loadNotifications();
    const apiNotifs = this.notificationService.getNotifications();

    this.recentActivities = apiNotifs.map((n: NotificationDTO) => ({
      id: parseInt(n.id || '0'),
      type: this.mapTipo(n.tipo),
      userName: n.remetente_nome || 'Alguém',
      userHandle: n.remetente_username ? `@${n.remetente_username}` : '@user',
      userAvatar: n.remetente_foto_perfil || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E",
      action: this.mapAction(n.tipo),
      postId: n.referencia_id ? parseInt(n.referencia_id) : undefined,
      time: this.formatTime(n.criado_em)
    }));
  }

  private async loadPedidosPendentes() {
    const pedidos = await this.followService.getPedidosPendentes();

    this.incomingRequests = pedidos.map((p: FollowDTO) => ({
      id: p.id,
      userId: p.seguidor_id,
      name: p.seguidor_nome || 'Alguém',
      handle: p.seguidor_username ? `@${p.seguidor_username}` : '@user',
      avatar: p.seguidor_foto_perfil || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E"
    }));
  }

  private mapTipo(tipo: string): 'baze' | 'comment' | 'follow' {
    if (tipo === 'baze') return 'baze';
    if (tipo === 'comment' || tipo === 'comentario') return 'comment';
    return 'follow';
  }

  private mapAction(tipo: string): string {
    switch (tipo) {
      case 'baze': return 'deu baze ao teu post';
      case 'comment':
      case 'comentario': return 'comentou';
      case 'follow': return 'começou a seguir-te';
      default: return 'interagiu contigo';
    }
  }

  async acceptRequest(requestId: string) {
    const request = this.incomingRequests.find(r => r.id === requestId);
    if (!request) return;

    const result = await this.followService.aceitar(request.userId);
    if (result.success) {
      this.incomingRequests = this.incomingRequests.filter(r => r.id !== requestId);
      await this.loadNotifications();
    }
  }

  async rejectRequest(requestId: string) {
    const request = this.incomingRequests.find(r => r.id === requestId);
    if (!request) return;

    const result = await this.followService.rejeitar(request.userId);
    if (result.success) {
      this.incomingRequests = this.incomingRequests.filter(r => r.id !== requestId);
    }
  }

  refresh() {
    this.loadData();
  }

  private formatTime(dateString: string): string {
    if (!dateString) return 'agora';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 1) return `${timeStr}`;
      if (minutes < 60) return `${timeStr}`;
      if (hours < 24) return `${timeStr}`;
      if (days === 1) return `Ontem às ${timeStr}`;
      if (days < 7) return `há ${days} dias`;
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${timeStr}`;
    } catch (e) {
      return 'agora';
    }
  }
}
