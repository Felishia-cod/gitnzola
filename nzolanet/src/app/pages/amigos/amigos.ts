import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserService, UserData } from '../../services/user';
import { Auth } from '../../services/auth';

interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  privacy: 'public' | 'private';
}

@Component({
  selector: 'app-amigos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './amigos.html',
  styleUrls: ['./amigos.scss']
})
export class AmigosComponent implements OnInit {
  private apiUrl = 'https://nzolanet-back.onrender.com';

  private normalizeUrl(url: string | null | undefined, fallback: string = ''): string {
    if (!url) return fallback;
    if (url.includes('localhost')) {
      return url.replace(/https?:\/\/localhost:\d+\/NzolaNet\/backend/g, this.apiUrl);
    }
    if (url.startsWith('/NzolaNet/backend')) {
      return this.apiUrl + url.replace('/NzolaNet/backend', '');
    }
    return url;
  }
  
  users: User[] = [];           // Usuários da BD
  friends: string[] = [];       // IDs dos amigos
  incomingRequests: string[] = []; // Pedidos recebidos
  outgoingRequests: string[] = []; // Pedidos enviados
  
  currentUser: User = {
    id: '',
    name: '',
    handle: '',
    avatar: '',
    bio: '',
    privacy: 'public'
  };
  
  myPrivacy: 'public' | 'private' = 'public';
  searchTerm: string = '';
  filteredUsers: User[] = [];
  isLoading: boolean = false;

  constructor(
    private userService: UserService,
    private auth: Auth,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    // Carregar dados do usuário logado
    const userData = this.userService.getCurrentUser();
    if (userData) {
      this.myPrivacy = userData.privacy;
      this.currentUser = {
        id: userData.id,
        name: userData.name,
        handle: userData.handle,
        avatar: userData.avatar,
        bio: userData.bio,
        privacy: userData.privacy
      };
    }
    
    // Carregar dados de amigos e pedidos do localStorage
    this.loadFriendsData();
    this.loadRequestsData();
    
    // Carregar usuários da BD
    this.loadUsersFromAPI();
  }
  
  private getHeaders() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }
  
  async loadUsersFromAPI() {
    this.isLoading = true;
    const token = this.auth.getToken();
    
    if (!token) {
      console.error('❌ Sem token');
      this.isLoading = false;
      return;
    }
    
    try {
      const endpoints = [
        `${this.apiUrl}/?route=user&action=pesquisarUtilizadores&q=a`,
        `${this.apiUrl}/?route=user&action=listar`,
        `${this.apiUrl}/?route=user&action=todos`,
        `${this.apiUrl}/?route=admin&action=listarUsers`
      ];

      let usersData: any[] = [];

      for (const endpoint of endpoints) {
        try {
          const response: any = await this.http.get(endpoint, this.getHeaders()).toPromise();
          let data: any[] | null = null;
          if (response.success && Array.isArray(response.data)) {
            data = response.data;
          } else if (Array.isArray(response)) {
            data = response;
          } else if (response.success && response.users && Array.isArray(response.users)) {
            data = response.users;
          }
          if (data && data.length > 0) {
            usersData = data;
            console.log('📦 Usuários carregados de:', endpoint);
            break;
          }
        } catch {
          continue;
        }
      }
      
      if (usersData.length > 0) {
        this.users = usersData.map((user: any) => ({
          id: user.id?.toString() || '',
          name: user.name || user.nome || user.username || '',
          handle: user.handle || `@${(user.username || user.nome || user.name || '').toLowerCase().replace(/\s/g, '')}`,
          avatar: this.normalizeUrl(user.avatar || user.foto_perfil, "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E"),
          bio: user.bio || '',
          privacy: user.privacy === 'private' ? 'private' : 'public'
        }));
        
        console.log('✅ Usuários carregados:', this.users.length);
      } else {
        this.loadMockUsers();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      this.loadMockUsers();
    } finally {
      this.isLoading = false;
    }
  }
  
  async searchUsers() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [];
      return;
    }
    
    this.isLoading = true;
    const token = this.auth.getToken();
    
    if (!token) {
      console.error('❌ Sem token');
      this.isLoading = false;
      return;
    }
    
    try {
      const query = encodeURIComponent(this.searchTerm.trim());
      const url = `${this.apiUrl}/?route=user&action=pesquisarUtilizadores&q=${query}`;
      const response: any = await this.http.get(url, this.getHeaders()).toPromise();
      
      console.log('📦 Resultados da pesquisa:', response);
      
      let usersData = [];
      if (response.success && response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (Array.isArray(response)) {
        usersData = response;
      }
      
      if (usersData.length > 0) {
        this.filteredUsers = usersData.map((user: any) => ({
          id: user.id?.toString() || '',
          name: user.name || user.username || '',
          handle: user.handle || `@${(user.name || '').toLowerCase().replace(/\s/g, '')}`,
          avatar: this.normalizeUrl(user.avatar || user.foto_perfil, "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E"),
          bio: user.bio || '',
          privacy: user.privacy === 'private' ? 'private' : 'public'
        }));
      } else {
        this.filteredUsers = [];
      }
    } catch (error) {
      console.error('❌ Erro na pesquisa:', error);
      // Fallback para busca local
      this.filteredUsers = this.users.filter(user => 
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        user.handle.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } finally {
      this.isLoading = false;
    }
  }
  
  // Fallback para dados mockados apenas se a API falhar
  private loadMockUsers() {
    this.users = [
      { id: '1', name: 'Nzinga Domingos', handle: '@nzinga', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', bio: 'Fotógrafa em Luanda 📸', privacy: 'public' },
      { id: '2', name: 'Kiala Bento', handle: '@kiala_b', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100', bio: 'Chef · Muamba é vida 🍲', privacy: 'private' },
      { id: '3', name: 'Lukeni Afonso', handle: '@lukeni', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', bio: 'DJ Kuduro 🔥', privacy: 'public' },
      { id: '4', name: 'Mbala João', handle: '@mbala', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', bio: 'Programador Angular', privacy: 'private' },
    ];
    console.log('📦 Usando dados mockados (fallback)');
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.filteredUsers = [];
  }
  
  private loadFriendsData() {
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      this.friends = JSON.parse(savedFriends);
    } else {
      this.friends = [];
      this.saveFriendsData();
    }
  }
  
  private saveFriendsData() {
    localStorage.setItem('friends', JSON.stringify(this.friends));
  }
  
  private loadRequestsData() {
    const savedIncoming = localStorage.getItem('incomingRequests');
    if (savedIncoming) {
      this.incomingRequests = JSON.parse(savedIncoming);
    } else {
      this.incomingRequests = [];
      this.saveRequestsData();
    }
    
    const savedOutgoing = localStorage.getItem('outgoingRequests');
    if (savedOutgoing) {
      this.outgoingRequests = JSON.parse(savedOutgoing);
    } else {
      this.outgoingRequests = [];
      this.saveRequestsData();
    }
  }
  
  private saveRequestsData() {
    localStorage.setItem('incomingRequests', JSON.stringify(this.incomingRequests));
    localStorage.setItem('outgoingRequests', JSON.stringify(this.outgoingRequests));
  }
  
  getUser(id: string): User | undefined {
    if (id === this.currentUser.id) return this.currentUser;
    return this.users.find(u => u.id === id);
  }
  
  get suggestedUsers(): User[] {
    const excludedIds = [...this.friends, ...this.incomingRequests, ...this.outgoingRequests, this.currentUser.id];
    return this.users.filter(u => !excludedIds.includes(u.id));
  }
  
  isFriend(userId: string): boolean {
    return this.friends.includes(userId);
  }
  
  sendRequest(userId: string) {
    const user = this.getUser(userId);
    if (!user) return;
    
    if (this.friends.includes(userId)) {
      console.log(`${user.name} já é seu amigo`);
      return;
    }
    
    if (this.outgoingRequests.includes(userId)) {
      console.log(`Pedido já enviado para ${user.name}`);
      return;
    }
    
    if (this.incomingRequests.includes(userId)) {
      this.acceptRequest(userId);
      return;
    }
    
    if (user.privacy === 'public') {
      this.friends = [...this.friends, userId];
      this.saveFriendsData();
      console.log(`✨ Você começou a seguir ${user.name} (perfil público)!`);
      this.searchUsers();
    } else {
      this.outgoingRequests = [...this.outgoingRequests, userId];
      this.saveRequestsData();
      console.log(`📨 Pedido de amizade enviado para ${user.name} (perfil privado). Aguardando aprovação.`);
      this.searchUsers();
    }
  }
  
  acceptRequest(userId: string) {
    this.incomingRequests = this.incomingRequests.filter(id => id !== userId);
    if (!this.friends.includes(userId)) {
      this.friends = [...this.friends, userId];
    }
    this.saveFriendsData();
    this.saveRequestsData();
    const userName = this.getUser(userId)?.name;
    console.log(`✅ Pedido aceito: ${userName} agora é seu amigo`);
    this.searchUsers();
  }
  
  rejectRequest(userId: string) {
    this.incomingRequests = this.incomingRequests.filter(id => id !== userId);
    this.saveRequestsData();
    const userName = this.getUser(userId)?.name;
    console.log(`❌ Pedido rejeitado: ${userName}`);
    this.searchUsers();
  }
  
  cancelRequest(userId: string) {
    this.outgoingRequests = this.outgoingRequests.filter(id => id !== userId);
    this.saveRequestsData();
    const userName = this.getUser(userId)?.name;
    console.log(`❌ Pedido cancelado para ${userName}`);
    this.searchUsers();
  }
  
  unfriend(userId: string) {
    this.friends = this.friends.filter(id => id !== userId);
    this.saveFriendsData();
    this.outgoingRequests = this.outgoingRequests.filter(id => id !== userId);
    this.incomingRequests = this.incomingRequests.filter(id => id !== userId);
    this.saveRequestsData();
    const userName = this.getUser(userId)?.name;
    console.log(`🚫 Amigo removido: ${userName}`);
    this.searchUsers();
  }
  
  getButtonText(userId: string): string {
    const user = this.getUser(userId);
    if (user?.privacy === 'public') {
      return 'Seguir';
    }
    return 'Adicionar';
  }
  
  viewProfile(userId: string) {
    this.router.navigate(['/feed/perfil', userId]);
  }

  showPendingStatus(userId: string): boolean {
    return this.outgoingRequests.includes(userId);
  }
  
  hasIncomingRequest(userId: string): boolean {
    return this.incomingRequests.includes(userId);
  }
}