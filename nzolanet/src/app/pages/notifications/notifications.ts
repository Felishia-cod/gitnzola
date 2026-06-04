import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, NotificationDTO } from '../../services/notification';
import { FollowService, FollowDTO } from '../../services/follow';
import { UserService, UserData } from '../../services/user';

interface Activity {
  id: number;
  type: 'baze' | 'comment' | 'follow';
  userName: string;
  userHandle: string;
  userAvatar: string;
  action: string;
  postId?: number;
  userId?: string;
  comment?: string;
  time: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
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
    private followService: FollowService,
    private userService: UserService,
    private router: Router
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
      userName: (n as any).remetente_nome || (n as any).nome || (n as any).name || (n as any).display_name || (n as any).full_name || (n as any).remetente_username || (n as any).username || 'Alguém',
      userHandle: (n as any).remetente_username ? `@${(n as any).remetente_username}` : ((n as any).username ? `@${(n as any).username}` : '@user'),
      userAvatar: (n as any).remetente_foto_perfil || (n as any).foto_perfil || (n as any).avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E",
      action: this.mapAction(n.tipo),
      postId: n.referencia_id ? parseInt(n.referencia_id) : undefined,
      userId: n.remetente_id,
      time: this.formatTime(n.criado_em)
    }));
    await this.fillMissingUserNames();
  }

  private async fillMissingUserNames() {
    const idsToFetch = new Set<string>();
    for (const a of this.recentActivities) {
      if (a.userName === 'Alguém' && a.userId) {
        idsToFetch.add(a.userId);
      }
    }
    if (idsToFetch.size === 0) return;

    const promises = Array.from(idsToFetch).map(id => this.userService.loadUserProfileById(id));
    const results = await Promise.all(promises);
    const userMap = new Map<string, UserData>();
    for (const u of results) {
      if (u) userMap.set(u.id, u);
    }

    for (const a of this.recentActivities) {
      if (a.userName === 'Alguém' && a.userId) {
        const user = userMap.get(a.userId);
        if (user) {
          a.userName = user.name;
          a.userHandle = user.handle;
          a.userAvatar = user.avatar;
        }
      }
    }
  }

  private async loadPedidosPendentes() {
    const pedidos = await this.followService.getPedidosPendentes();

    this.incomingRequests = pedidos.map((p: FollowDTO) => ({
      id: p.id,
      userId: p.seguidor_id,
      name: (p as any).seguidor_nome || (p as any).nome || (p as any).name || (p as any).display_name || (p as any).full_name || (p as any).seguidor_username || (p as any).username || 'Alguém',
      handle: (p as any).seguidor_username ? `@${(p as any).seguidor_username}` : ((p as any).username ? `@${(p as any).username}` : '@user'),
      avatar: (p as any).seguidor_foto_perfil || (p as any).foto_perfil || (p as any).avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E"
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

  navigateToActivity(activity: Activity) {
    if (activity.type === 'follow' && activity.userId) {
      this.router.navigate(['/feed/perfil', activity.userId]);
    } else if (activity.postId) {
      this.router.navigate(['/feed'], { queryParams: { postId: activity.postId } });
    }
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
