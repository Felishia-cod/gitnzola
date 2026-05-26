import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FriendRequest {
  id: string;
  userId: string;
  name: string;
  handle: string;
  avatar: string;
}

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
export class NotificationsComponent {
  // Pedidos de amizade recebidos
  incomingRequests: FriendRequest[] = [
    {
      id: '1',
      userId: 'u4',
      name: 'Mbala João',
      handle: '@mbala',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
    },
    {
      id: '2',
      userId: 'u5',
      name: 'Sumbe Costa',
      handle: '@sumbe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
    }
  ];

  // Atividades recentes
  recentActivities: Activity[] = [
    {
      id: 1,
      type: 'baze',
      userName: 'Nzinga Domingos',
      userHandle: '@nzinga',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      action: 'deu baze ao teu post',
      postId: 1,
      time: 'há 5 min'
    },
    {
      id: 2,
      type: 'comment',
      userName: 'Kiala Bento',
      userHandle: '@kiala_b',
      userAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',
      action: 'comentou',
      comment: 'Top demais! 🔥',
      postId: 2,
      time: 'há 1 hora'
    },
    {
      id: 3,
      type: 'follow',
      userName: 'Lukeni Afonso',
      userHandle: '@lukeni',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      action: 'começou a seguir-te',
      time: 'há 3 horas'
    }
  ];

  acceptRequest(requestId: string) {
    // Remove o pedido da lista
    const acceptedRequest = this.incomingRequests.find(r => r.id === requestId);
    
    this.incomingRequests = this.incomingRequests.filter(r => r.id !== requestId);
    
    // Adiciona uma atividade de que seguiu de volta
    if (acceptedRequest) {
      const newActivity: Activity = {
        id: Date.now(),
        type: 'follow',
        userName: 'Você',
        userHandle: '@voce',
        userAvatar: '',
        action: `começou a seguir ${acceptedRequest.name}`,
        time: 'agora'
      };
      this.recentActivities = [newActivity, ...this.recentActivities];
    }
    
    console.log('Pedido aceito:', requestId);
  }

  rejectRequest(requestId: string) {
    this.incomingRequests = this.incomingRequests.filter(r => r.id !== requestId);
    console.log('Pedido rejeitado:', requestId);
  }
}