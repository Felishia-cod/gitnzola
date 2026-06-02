import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService, UserData } from '../../services/user';
import { PostService, Post, Comment } from '../../services/post';
import { FollowService } from '../../services/follow';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed-home.html',
  styleUrls: ['./feed-home.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  filteredPosts: Post[] = [];
  
  composer: string = '';
  selectedImage: string | null = null;
  selectedVideo: string | null = null;
  selectedImageFile: File | null = null;
  selectedVideoFile: File | null = null;
  showEmojiPicker: boolean = false;
  savedPosts: Post[] = [];
  isPublishing: boolean = false;
  isDeleting: boolean = false;
  isReporting: boolean = false;
  editingPostId: string = '';
  
  showReportModal: boolean = false;
  reportTargetType: 'post' | 'comment' = 'post';
  reportTargetId: string = '';
  reportTargetContent: string = '';
  reportMotivo: string = '';
  reportDescricao: string = '';
  reportMotivos = ['spam', 'ofensivo', 'inapropriado', 'desinformacao', 'violencia', 'outro'];
  
  showAlertModal: boolean = false;
  alertTitle: string = '';
  alertMessage: string = '';
  alertType: 'error' | 'success' | 'warning' | 'info' = 'error';
  
  showConfirmModal: boolean = false;
  confirmTitle: string = '';
  confirmMessage: string = '';
  confirmCallback: (() => void) | null = null;

  bazeUsers: { [postId: string]: { name: string; handle: string }[] } = {};
  hoveredBazePost: string = '';
  
  currentUser: UserData = {
    id: '',
    name: '',
    handle: '',
    avatar: '',
    bio: '',
    email: '',
    location: '',
    joinedDate: '',
    postsCount: 0,
    amigosCount: 0,
    followersCount: 0,
    privacy: 'public'
  };

  me: { id: string; name: string; handle: string; avatar: string } = {
    id: '0',
    name: '',
    handle: '',
    avatar: ''
  };

  emojis = ['😂', '❤️', '😍', '👍', '🎉', '🥰', '🙏', '🥺', '😭', '✨'];

  followingUsers: number[] = [];
  followersUsers: number[] = [];
  suggestions: any[] = [];

  private postsSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;

  constructor(
    private userService: UserService,
    private postService: PostService,
    private followService: FollowService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // Carregar dados do usuário logado
    const currentUserData = this.userService.getCurrentUser();
    
    if (currentUserData) {
      if (currentUserData.is_admin) {
        this.router.navigate(['/admin']);
        return;
      }
      this.setCurrentUserData(currentUserData);
    } else {
      const userData = await this.userService.loadUserProfile();
      if (userData) {
        if (userData.is_admin) {
          this.router.navigate(['/admin']);
          return;
        }
        this.setCurrentUserData(userData);
      }
    }

    this.userSubscription = this.userService.userData$.subscribe((userData: UserData | null) => {
      if (userData) {
        if (userData.is_admin) {
          this.router.navigate(['/admin']);
          return;
        }
        this.setCurrentUserData(userData);
      }
    });

    this.loadFollowingUsers();
    this.loadFollowersUsers();

    // Forçar carregamento de posts
    this.postService.refreshPosts();

    // Inscrever para atualizações de posts
    this.postsSubscription = this.postService.posts$.subscribe((posts: Post[]) => {

      this.filteredPosts = [...posts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      this.fillPostUserNames();
      this.loadSavedPosts();
    });

    await this.loadSuggestions();
    this.cdr.detectChanges();

    // Atualizar timestamps a cada minuto
    setInterval(() => {
      this.updatePostTimes();
    }, 60000);
  }

  private setCurrentUserData(userData: UserData) {
    this.currentUser = userData;
    this.me = {
      id: userData.id || '0',
      name: userData.name,
      handle: userData.handle,
      avatar: userData.avatar || this.getDefaultAvatar()
    };
  }

  goToProfile(userId: string) {
    this.router.navigate(['/feed/perfil', userId]);
  }

  ngOnDestroy() {
    if (this.postsSubscription) {
      this.postsSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private fillPostUserNames() {
    for (const post of this.filteredPosts) {
      if (!post.userName && post.userHandle) {
        if (post.userId === this.me.id && this.me.name) {
          post.userName = this.me.name;
        } else {
          post.userName = post.userHandle.replace('@', '');
        }
      }
    }
  }

  onImgError(event: Event) {
    const el = event.target as HTMLElement;
    el.style.display = 'none';
  }

  private getDefaultAvatar(): string {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E";
  }
  
  private updatePostTimes() {
    for (const post of this.filteredPosts) {
      if (post.timestamp) {
        post.time = this.formatTime(post.timestamp);
      }
    }
  }
  
  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${timeStr}`;
    if (minutes < 60) return `${timeStr}`;
    if (hours < 24) return `${timeStr}`;
    if (days === 1) return `Ontem às ${timeStr}`;
    if (days < 7) return `há ${days} dias`;
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${timeStr}`;
  }
  
  private loadFollowingUsers() {
    const saved = localStorage.getItem('followingUsers');
    if (saved) {
      this.followingUsers = JSON.parse(saved);
    } else {
      this.followingUsers = [];
      this.saveFollowingUsers();
    }
  }
  
  private saveFollowingUsers() {
    localStorage.setItem('followingUsers', JSON.stringify(this.followingUsers));
  }
  
  private loadFollowersUsers() {
    const saved = localStorage.getItem('followersUsers');
    if (saved) {
      this.followersUsers = JSON.parse(saved);
    } else {
      this.followersUsers = [];
      this.saveFollowersUsers();
    }
  }
  
  private saveFollowersUsers() {
    localStorage.setItem('followersUsers', JSON.stringify(this.followersUsers));
  }
  
  private async loadSuggestions() {
    try {
      const users = await this.userService.searchUsers('a');
      const filtered = users.filter(u => u.id !== this.me.id && !this.followingUsers.includes(Number(u.id)));
      this.suggestions = filtered.slice(0, 7).map(u => ({
        id: Number(u.id),
        name: u.name,
        handle: u.handle,
        avatar: u.avatar
      }));
    } catch (error) {
      this.suggestions = [];
    }
    if (this.suggestions.length === 0) {
      this.suggestions = [
        { id: 4, name: 'João Silva', handle: '@joaosilva', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
        { id: 5, name: 'Maria Santos', handle: '@marias', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
        { id: 6, name: 'Paulo Mendes', handle: '@paulom', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }
      ];
    }
    this.cdr.detectChanges();
  }
  
  async sendFriendRequest(userId: number) {
    if (this.followingUsers.includes(userId)) {
      this.showAlert('Aviso', 'Você já segue este usuário!', 'warning');
      return;
    }

    const result = await this.followService.follow(userId.toString());
    if (result.success) {
      this.followingUsers.push(userId);
      this.saveFollowingUsers();
      this.showAlert('Sucesso', 'Pedido enviado!', 'success');
      this.loadSuggestions();
    } else {
      this.showAlert('Erro', result.message || 'Erro ao enviar pedido', 'error');
    }
  }

  async acceptFriendRequest(userId: number) {
    const result = await this.followService.aceitar(userId.toString());
    if (result.success) {
      if (!this.followersUsers.includes(userId)) {
        this.followersUsers.push(userId);
        this.saveFollowersUsers();
      }
      this.showAlert('Sucesso', 'Amizade aceita!', 'success');
    } else {
      this.showAlert('Erro', 'Erro ao aceitar pedido', 'error');
    }
  }
  
  seeAllFriends() {
    this.router.navigate(['/feed/amigos']);
  }

  private loadSavedPosts() {
    const savedIds = localStorage.getItem('savedPostsIds');
    if (savedIds) {
      try {
        const savedPostIds = JSON.parse(savedIds);
        this.savedPosts = this.filteredPosts.filter(post => savedPostIds.includes(post.id));
        
        for (const post of this.filteredPosts) {
          post.saved = this.savedPosts.some(p => p.id === post.id);
        }
      } catch (e) {
        console.error('Erro ao carregar posts guardados:', e);
        this.savedPosts = [];
      }
    } else {
      this.savedPosts = [];
    }
  }

  private saveToLocalStorage() {
    const savedPostIds = this.savedPosts.map(post => post.id);
    localStorage.setItem('savedPostsIds', JSON.stringify(savedPostIds));
  }

  openReportPostModal(postId: string, postContent: string, postAuthor: string) {
    this.reportTargetType = 'post';
    this.reportTargetId = postId;
    this.reportTargetContent = postContent;
    this.reportMotivo = '';
    this.reportDescricao = '';
    this.showReportModal = true;
  }

  openReportCommentModal(commentId: string, commentContent: string, commentAuthor: string) {
    this.reportTargetType = 'comment';
    this.reportTargetId = commentId;
    this.reportTargetContent = commentContent;
    this.reportMotivo = '';
    this.reportDescricao = '';
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
  }

  closeReportModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('report-modal-overlay')) {
      this.closeReportModal();
    }
  }

  async submitReport() {
    if (!this.reportMotivo || this.isReporting) return;
    this.isReporting = true;
    const result = await this.postService.submitReport({
      referencia_tipo: this.reportTargetType,
      referencia_id: this.reportTargetId,
      motivo: this.reportMotivo,
      descricao: this.reportDescricao
    });
    this.isReporting = false;
    if (result?.success) {
      this.closeReportModal();
    } else {
      this.showAlert('Erro', result?.message || 'Erro ao enviar denúncia', 'error');
    }
  }

  toggleMenu(post: Post) {
    for (const p of this.filteredPosts) {
      if (p !== post) {
        p.showMenu = false;
      }
    }
    post.showMenu = !post.showMenu;
  }

  editPost(post: Post) {
    post.isEditing = true;
    post.editText = post.text;
    post.showMenu = false;
  }

  async saveEditPost(post: Post) {
    if (!post.editText?.trim() || this.editingPostId === post.id) return;
    this.editingPostId = post.id;
    const result = await this.postService.editPost(post.id, post.editText);
    this.editingPostId = '';
    if (result?.success) {
      post.text = post.editText;
      post.isEditing = false;
      post.editText = '';
      this.postService.updatePost(post);
    } else {
      this.showAlert('Erro', result?.message || 'Erro ao editar publicação', 'error');
    }
  }

  cancelEditPost(post: Post) {
    post.isEditing = false;
    post.editText = '';
  }

  async deletePost(postId: string) {
    if (this.isDeleting) return;
    this.showConfirm('Eliminar Publicação', 'Tem certeza que deseja eliminar esta publicação?', async () => {
      if (this.isDeleting) return;
      this.isDeleting = true;
      const result = await this.postService.deletePost(postId);
      this.isDeleting = false;
      if (result?.success) {
        this.filteredPosts = this.filteredPosts.filter(p => p.id !== postId);
        this.savedPosts = this.savedPosts.filter(p => p.id !== postId);
        this.saveToLocalStorage();
      } else {
        this.showAlert('Erro', result?.message || 'Erro ao eliminar publicação', 'error');
      }
    });
  }

  savePost(post: Post) {
    post.saved = !post.saved;
    if (post.saved) {
      if (!this.savedPosts.some(p => p.id === post.id)) {
        this.savedPosts.push(post);
      }
      this.showAlert('Sucesso', 'Publicação guardada nos favoritos!', 'success');
    } else {
      this.savedPosts = this.savedPosts.filter(p => p.id !== post.id);
      this.showAlert('Info', 'Publicação removida dos favoritos.', 'info');
    }
    this.saveToLocalStorage();
    post.showMenu = false;
  }

  addEmoji(emoji: string) {
    this.composer += emoji;
    this.showEmojiPicker = false;
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedImageFile = file;
        const reader = new FileReader();
        reader.onload = (event: any) => {
          this.selectedImage = event.target.result;
          if (this.selectedVideo) this.selectedVideo = null;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  removeImage() {
    this.selectedImage = null;
    this.selectedImageFile = null;
  }

  uploadVideo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 50 * 1024 * 1024) {
          this.showAlert('Erro', 'O vídeo deve ter no máximo 50MB.', 'error');
          return;
        }
        this.selectedVideoFile = file;
        const reader = new FileReader();
        reader.onload = (event: any) => {
          this.selectedVideo = event.target.result;
          if (this.selectedImage) this.selectedImage = null;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  removeVideo() {
    this.selectedVideo = null;
    this.selectedVideoFile = null;
  }

  // MÉTODO PUBLISH MELHORADO
  async publish() {
    // Validar se tem conteúdo
    if (!this.composer.trim() && !this.selectedImageFile && !this.selectedVideoFile) {
      this.showAlert('Erro', 'Adicione um texto, imagem ou vídeo para publicar.', 'error');
      return;
    }
    
    // Validar se não está tentando enviar imagem e vídeo juntos
    if (this.selectedImageFile && this.selectedVideoFile) {
      this.showAlert('Erro', 'Escolha apenas imagem OU vídeo, não ambos.', 'error');
      return;
    }
    
    // Prevenir múltiplos envios
    if (this.isPublishing) {
      return;
    }
    
    this.isPublishing = true;

    try {
      const mediaFiles: File[] = [];
      if (this.selectedImageFile) {
        mediaFiles.push(this.selectedImageFile);
      }
      if (this.selectedVideoFile) {
        mediaFiles.push(this.selectedVideoFile);
      }
      
      const result = await this.postService.addPost({
        conteudo: this.composer || '',
        media: mediaFiles.length > 0 ? mediaFiles : undefined
      });
      
      if (result?.success) {
        this.composer = '';
        this.selectedImage = null;
        this.selectedVideo = null;
        this.selectedImageFile = null;
        this.selectedVideoFile = null;

        this.showAlert('Sucesso', 'Publicação criada com sucesso!', 'success');
      } else {
        this.showAlert('Erro', result?.message || 'Erro ao criar publicação', 'error');
      }
    } catch (error) {

      this.showAlert('Erro', 'Ocorreu um erro ao publicar. Tente novamente.', 'error');
    } finally {
      this.isPublishing = false;
      this.cdr.detectChanges();
    }
  }

  async loadBazeUsers(postId: string) {
    if (!this.bazeUsers[postId]) {
      this.bazeUsers[postId] = await this.postService.getBazeUsers(postId);
    }
    this.hoveredBazePost = postId;
  }

  hideBazeTooltip() {
    this.hoveredBazePost = '';
  }

  async toggleBaze(postId: string) {
    const post = this.filteredPosts.find(p => p.id === postId);
    if (!post) return;

    const wasLiked = post.liked;
    post.liked = !post.liked;
    post.bazes += post.liked ? 1 : -1;

    const result = post.liked
      ? await this.postService.likePost(postId)
      : await this.postService.unlikePost(postId);

    if (result?.success === false) {
      post.liked = wasLiked;
      post.bazes += wasLiked ? 1 : -1;
      if (!result?.alreadyProcessed) {
        this.showAlert('Erro', result?.message || 'Erro ao processar baze', 'error');
      }
    } else {
      this.postService.setLikedState(postId, post.liked);
    }
  }

  async toggleComments(postId: string) {
    const post = this.filteredPosts.find(p => p.id === postId);
    if (post) {
      post.showComments = !post.showComments;
      if (post.showComments && post.comments.length === 0) {
        post.comments = await this.postService.loadCommentsByPost(postId);
        this.fillCommentUserNames(post);
      }
    }
  }

  private fillCommentUserNames(post: Post) {
    for (const comment of post.comments) {
      if (!comment.userName && comment.userHandle) {
        if (comment.userId === this.me.id && this.me.name) {
          comment.userName = this.me.name;
        } else {
          comment.userName = comment.userHandle.replace('@', '');
        }
      }
      if (comment.replies) {
        for (const reply of comment.replies) {
          if (!reply.userName && reply.userHandle) {
            if (reply.userId === this.me.id && this.me.name) {
              reply.userName = this.me.name;
            } else {
              reply.userName = reply.userHandle.replace('@', '');
            }
          }
        }
      }
    }
  }

  async addComment(postId: string) {
    const post = this.filteredPosts.find(p => p.id === postId);
    if (post && post.newCommentText?.trim()) {
      const result = await this.postService.addComment(postId, post.newCommentText);
      if (result?.success) {
        post.newCommentText = '';
        post.comments = await this.postService.loadCommentsByPost(postId);
        this.fillCommentUserNames(post);
        post.commentsCount = post.comments.length;
      } else {
        this.showAlert('Erro', result?.message || 'Erro ao adicionar comentário', 'error');
      }
    }
  }

  toggleReplyInput(comment: Comment) {
    comment.showReplyInput = !comment.showReplyInput;
    if (!comment.replyText) comment.replyText = '';
  }

  async addReply(postId: string, parentComment: Comment) {
    if (!parentComment.replyText?.trim()) return;
    
    const result = await this.postService.addComment(postId, parentComment.replyText);
    if (result?.success) {
      parentComment.replyText = '';
      parentComment.showReplyInput = false;
    } else {
      this.showAlert('Erro', result?.message || 'Erro ao adicionar resposta', 'error');
    }
  }

  async likeComment(postId: string, commentId: string) {
    const post = this.filteredPosts.find(p => p.id === postId);
    if (!post) return;

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) return;

    comment.likedByUser = !comment.likedByUser;
    comment.likes += comment.likedByUser ? 1 : -1;

    const result = comment.likedByUser
      ? await this.postService.likeComment(commentId)
      : await this.postService.unlikeComment(commentId);

    if (result?.success === false) {
      comment.likedByUser = !comment.likedByUser;
      comment.likes += comment.likedByUser ? 1 : -1;
    }
  }

  editComment(comment: Comment) {
    comment.isEditing = true;
    comment.editText = comment.text;
  }

  saveEditComment(comment: Comment) {
    if (comment.editText?.trim()) {
      comment.text = comment.editText;
      comment.isEditing = false;
      this.showAlert('Sucesso', 'Comentário editado com sucesso!', 'success');
    }
  }

  cancelEditComment(comment: Comment) {
    comment.isEditing = false;
    comment.editText = '';
  }

  async deleteComment(postId: string, commentId: string) {
    this.showConfirm('Eliminar Comentário', 'Tem certeza que deseja eliminar este comentário?', async () => {
      const result = await this.postService.deleteComment(commentId);
      if (result?.success) {
        const post = this.filteredPosts.find(p => p.id === postId);
        if (post) {
          post.comments = await this.postService.loadCommentsByPost(postId);
          post.commentsCount = post.comments.length;
        }
        this.showAlert('Sucesso', 'Comentário eliminado com sucesso!', 'success');
      } else {
        this.showAlert('Erro', result?.message || 'Erro ao eliminar comentário', 'error');
      }
    });
  }

  isOwnComment(comment: Comment): boolean {
    return comment.userId === this.me.id;
  }

  isOwnReply(reply: Comment): boolean {
    return reply.userId === this.me.id;
  }

  isOwnPost(post: Post): boolean {
    return post.userId === this.me.id;
  }

  showAlert(title: string, message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') {
    this.alertTitle = title;
    this.alertMessage = message;
    this.alertType = type;
    this.showAlertModal = true;
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        this.closeAlertModal();
      }, 3000);
    }
  }
  
  closeAlertModal() {
    this.showAlertModal = false;
  }
  
  showConfirm(title: string, message: string, callback: () => void) {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmCallback = callback;
    this.showConfirmModal = true;
  }
  
  closeConfirmModal() {
    this.showConfirmModal = false;
    this.confirmCallback = null;
  }
  
  confirmAction() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.closeConfirmModal();
  }
}