import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
    id: 'admin-1', // ADICIONADO: id
    name: 'Admin',
    handle: '@admin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
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

  private postsSubscription: Subscription | null = null;

  constructor(
    private userService: UserService,
    private postService: PostService,
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

  loadUsers() {
    this.users = [
      { id: 1, name: 'Admin NzolaNet', email: 'admin@nzolanet.ao', handle: '@admin', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', bio: 'Administrador', is_admin: 1, is_active: 1, privacy: 'publico' },
      { id: 2, name: 'Tu (Demo)', email: 'demo@nzolanet.ao', handle: '@demo', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', bio: 'Utilizador Demo', is_admin: 0, is_active: 1, privacy: 'publico' },
      { id: 3, name: 'Nzinga Domingos', email: 'nzinga@nzolanet.ao', handle: '@nzinga', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', bio: 'Fotógrafa', is_admin: 0, is_active: 1, privacy: 'publico' },
      { id: 4, name: 'Kiala Bento', email: 'kiala@nzolanet.ao', handle: '@kiala_b', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100', bio: 'Chef', is_admin: 0, is_active: 1, privacy: 'publico' },
      { id: 5, name: 'Lukeni Afonso', email: 'lukeni@nzolanet.ao', handle: '@lukeni', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', bio: 'DJ', is_admin: 0, is_active: 0, privacy: 'privado' },
      { id: 6, name: 'Mbala João', email: 'mbala@nzolanet.ao', handle: '@mbala', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', bio: 'Programador', is_admin: 0, is_active: 1, privacy: 'publico' }
    ];
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
    return user ? user.avatar : '';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-PT');
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}