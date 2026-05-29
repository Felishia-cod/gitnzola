import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { Auth } from '../../services/auth';
import { UserService, UserData } from '../../services/user';
import { PostService, Post, Comment } from '../../services/post';

interface AppUser {
  id: number;
  name: string;
  email: string;
  handle: string;
  avatar: string;
  bio: string;
  is_admin: number;
  is_active: number;
  privacy: string;
}

interface Report {
  id: number;
  reporter_id: number;
  referencia_tipo: 'post' | 'comment';
  referencia_id: number;
  motivo: string;
  descricao: string;
  status: 'pendente' | 'resolvido' | 'ignorado';
  criado_em: string;
  alvo_conteudo?: string;
  alvo_autor?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  currentUser: UserData = {
    id: 'admin-1', 
    name: 'Admin',
    handle: '@admin',
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E",
    bio: 'Administrador do NzolaNet',
    email: 'admin@nzolanet.ao',
    location: 'Luanda, Angola',
    joinedDate: 'Janeiro 2026',
    postsCount: 0,
    amigosCount: 0,
    followersCount: 0,
    privacy: 'public',
    coverImage: '' // ADICIONADO: coverImage
  };

  activeTab: string = 'users';
  
  users: AppUser[] = [];
  allPosts: Post[] = [];
  comments: Comment[] = [];
  reports: Report[] = [];

  searchUserTerm: string = '';
  searchReportTerm: string = '';

  showReportModal: boolean = false;
  selectedReport: Report | null = null;
  
  showUserPostsModal: boolean = false;
  selectedUserPosts: Post[] = [];
  selectedUserName: string = '';
  selectedUserAvatar: string = '';

  showConfirmModal: boolean = false;
  confirmAction: any = null;
  confirmMessage: string = '';

  showUserProfileModal: boolean = false;
  selectedProfileUser: AppUser | null = null;
  profileTab: string = 'posts';
  profileUserPosts: Post[] = [];
  profileFollowers: AppUser[] = [];
  profileFollowing: AppUser[] = [];

  private postsSubscription: Subscription | null = null;

  private apiUrl = 'https://nzolanet-back.onrender.com';

  constructor(
    private userService: UserService,
    private postService: PostService,
    private auth: Auth,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    const userData = this.userService.getCurrentUser();
    if (userData) {
      this.currentUser = userData;
    }
    
    this.userService.userData$.subscribe((userData: UserData | null) => {
      if (userData) {
        this.currentUser = userData;
      }
    });    
    
    this.loadUsers();
    this.loadReports();
    
    this.allPosts = this.postService.getPosts().filter(p => !p.eliminado);
    
    this.postsSubscription = this.postService.posts$.subscribe((posts: Post[]) => {
      console.log('🔄 Admin: Posts atualizados, total:', posts.length);
      this.allPosts = posts.filter(p => !p.eliminado);
      
      if (this.showUserPostsModal && this.selectedUserName) {
        this.selectedUserPosts = this.allPosts.filter(p => p.userName === this.selectedUserName);
        console.log(`📝 Posts de ${this.selectedUserName} atualizados:`, this.selectedUserPosts.length);
      }
    });
    
    this.checkPendingReports();
  }

  ngOnDestroy() {
    if (this.postsSubscription) {
      this.postsSubscription.unsubscribe();
    }
  }

  checkPendingReports() {
    const pendingCount = this.reports.filter(r => r.status === 'pendente').length;
    if (pendingCount > 0) {
      console.log(`🔔 ${pendingCount} denúncia(s) pendente(s)`);
    }
  }

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

  private getHeaders() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  async loadUsers() {
    const endpoints = [
      `${this.apiUrl}/?route=user&action=pesquisarUtilizadores&q=a`,
      `${this.apiUrl}/?route=admin&action=listarUtilizadores`,
      `${this.apiUrl}/?route=user&action=todos`,
      `${this.apiUrl}/?route=admin&action=listarUsers`
    ];

    for (const endpoint of endpoints) {
      try {
        const response: any = await firstValueFrom(this.http.get(endpoint, this.getHeaders()));
        let usersData: any[] | null = null;
        if (response.success && Array.isArray(response.data)) {
          usersData = response.data;
        } else if (Array.isArray(response)) {
          usersData = response;
        } else if (response.success && response.users && Array.isArray(response.users)) {
          usersData = response.users;
        }
        if (usersData && usersData.length > 0) {
          const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E";
          this.users = usersData.map((u: any) => ({
            id: parseInt(u.id || '0'),
            name: u.nome || u.name || '',
            email: u.email || '',
            handle: u.handle || `@${u.username || (u.nome || '').toLowerCase().replace(/\s/g, '')}`,
            avatar: this.normalizeUrl(u.foto_perfil || u.avatar, fallback),
            bio: u.bio || '',
            is_admin: u.is_admin ? 1 : 0,
            is_active: u.ativo !== undefined ? (u.ativo ? 1 : 0) : 1,
            privacy: u.privacidade === 'privado' ? 'privado' : 'publico'
          }));
          console.log('✅ Admin: users carregados da BD:', this.users.length, '- endpoint:', endpoint);
          return;
        }
      } catch (error) {
        console.log('⚠️ Admin: tentativa falhou para', endpoint);
        continue;
      }
    }
    console.log('❌ Admin: todos os endpoints falharam, users vazio');
    this.users = [];
  }

  loadReports() {
    this.reports = [
      { id: 1, reporter_id: 2, referencia_tipo: 'post', referencia_id: 1, motivo: 'Spam', descricao: 'Publicação repetitiva', status: 'pendente', criado_em: new Date().toISOString(), alvo_conteudo: 'O pôr-do-sol na Marginal...', alvo_autor: 'Nzinga Domingos' },
      { id: 2, reporter_id: 3, referencia_tipo: 'comment', referencia_id: 101, motivo: 'Ofensivo', descricao: 'Comentário ofensivo', status: 'pendente', criado_em: new Date().toISOString(), alvo_conteudo: 'Comentário ofensivo...', alvo_autor: 'Kiala Bento' }
    ];
  }

  get filteredUsers() {
    if (!this.searchUserTerm) return this.users;
    const term = this.searchUserTerm.toLowerCase();
    return this.users.filter(u => 
      u.name.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term) ||
      u.handle.toLowerCase().includes(term)
    );
  }

  get filteredReports() {
    if (!this.searchReportTerm) return this.reports;
    const term = this.searchReportTerm.toLowerCase();
    return this.reports.filter(r => 
      r.motivo.toLowerCase().includes(term) ||
      (r.alvo_conteudo && r.alvo_conteudo.toLowerCase().includes(term))
    );
  }

  get pendingReportsCount() {
    return this.reports.filter(r => r.status === 'pendente').length;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  toggleUserActive(userId: number) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.is_active = user.is_active === 1 ? 0 : 1;
    }
  }

  toggleUserRole(userId: number) {
    const user = this.users.find(u => u.id === userId);
    if (user && user.email !== 'admin@nzolanet.ao') {
      user.is_admin = user.is_admin === 1 ? 0 : 1;
    }
  }

  deleteUser(userId: number) {
    this.showConfirm('Tens a certeza que queres eliminar este utilizador?', () => {
      this.users = this.users.filter(u => u.id !== userId);
      this.closeConfirm();
    });
  }

  deletePost(postId: number) {
    this.showConfirm('Tens a certeza que queres eliminar este post?', () => {
      this.postService.deletePost(postId);
      this.closeConfirm();
    });
  }

  getUserPostsCount(userId: number): number {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      const count = this.allPosts.filter(p => p.userName === user.name).length;
      return count;
    }
    return 0;
  }

  viewUserPosts(userId: number) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.selectedUserName = user.name;
      this.selectedUserAvatar = user.avatar;
      this.selectedUserPosts = this.allPosts.filter(p => p.userName === user.name);
      this.showUserPostsModal = true;
    }
  }

  closeUserPostsModal() {
    this.showUserPostsModal = false;
    this.selectedUserPosts = [];
  }

  closeUserPostsModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeUserPostsModal();
    }
  }

  viewReportDetails(report: Report) {
    this.selectedReport = report;
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
    this.selectedReport = null;
  }

  closeReportModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeReportModal();
    }
  }

  resolveReportFromModal() {
    if (this.selectedReport) {
      this.resolveReport(this.selectedReport);
      this.closeReportModal();
    }
  }

  ignoreReportFromModal() {
    if (this.selectedReport) {
      this.ignoreReport(this.selectedReport);
      this.closeReportModal();
    }
  }

  resolveReport(report: Report) {
    const action = report.referencia_tipo === 'post' ? 'post' : 'comentário';
    this.showConfirm(`Tens a certeza que queres eliminar este ${action}?`, () => {
      if (report.referencia_tipo === 'post') {
        this.postService.deletePost(report.referencia_id);
      }
      report.status = 'resolvido';
      this.closeConfirm();
    });
  }

  ignoreReport(report: Report) {
    this.showConfirm('Tens a certeza que queres ignorar esta denúncia?', () => {
      report.status = 'ignorado';
      this.closeConfirm();
    });
  }

  showConfirm(message: string, action: () => void) {
    this.confirmMessage = message;
    this.confirmAction = action;
    this.showConfirmModal = true;
  }

  closeConfirm() {
    this.showConfirmModal = false;
    this.confirmAction = null;
  }

  executeConfirm() {
    if (this.confirmAction) {
      this.confirmAction();
    }
  }

  getUserName(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user ? user.name : userId.toString();
  }

  getUserAvatar(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E";
    return user ? user.avatar || fallback : fallback;
  }

  openUserProfile(userId: number) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    this.selectedProfileUser = user;
    this.profileTab = 'posts';
    this.profileUserPosts = this.allPosts.filter(p => p.userName === user.name);
    this.profileFollowers = this.users.filter(u => u.id !== userId && u.is_active === 1).slice(0, 3);
    this.profileFollowing = this.users.filter(u => u.id !== userId && u.is_active === 1 && u.id <= 4);
    this.showUserProfileModal = true;
  }

  closeUserProfileModal() {
    this.showUserProfileModal = false;
    this.selectedProfileUser = null;
    this.profileUserPosts = [];
    this.profileFollowers = [];
    this.profileFollowing = [];
  }

  setProfileTab(tab: string) {
    this.profileTab = tab;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-PT');
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}