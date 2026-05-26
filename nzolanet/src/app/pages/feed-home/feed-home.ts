import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService, UserData } from '../../services/user';
import { PostService, Post, Comment } from '../../services/post';

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
  selectedPostColor: string = '';
  showEmojiPicker: boolean = false;
  showColorPickerForNewPost: boolean = false;
  savedPosts: Post[] = [];
  
  showReportModal: boolean = false;
  reportTargetType: 'post' | 'comment' = 'post';
  reportTargetId: number = 0;
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

  me = {
    id: 0,
    name: '',
    handle: '',
    avatar: ''
  };

  emojis = ['😂', '❤️', '😍', '👍', '🎉', '🥰', '🙏', '🥺', '😭', '✨'];
  
  colorPalette = [
    { name: 'Roxo', code: '#6366F1' },
    { name: 'Rosa', code: '#EC4899' },
    { name: 'Laranja', code: '#F59E0B' },
    { name: 'Verde', code: '#10B981' },
    { name: 'Vermelho', code: '#EF4444' },
    { name: 'Roxo escuro', code: '#8B5CF6' },
    { name: 'Ciano', code: '#06B6D4' },
    { name: 'Verde limão', code: '#84CC16' }
  ];
  
  trendingTopics = [
    { tag: '#Kuduro2026', count: '12,4K posts' },
    { tag: '#PalancaNegra', count: '8,1K posts' },
    { tag: '#NzolaNet', count: '5,7K posts' },
    { tag: '#Luanda', count: '3,9K posts' }
  ];
  
  // REMOVIDO: allAvailableUsers mockado - usar dados reais do backend
  followingUsers: number[] = [];
  followersUsers: number[] = [];
  suggestions: any[] = [];

  private postsSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;

  constructor(
    private userService: UserService,
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit() {
    // Carregar dados do usuário logado
    this.userSubscription = this.userService.userData$.subscribe((userData: UserData | null) => {
      if (userData) {
        this.currentUser = userData;
        this.me = {
          id: parseInt(userData.id || '0'),
          name: userData.name,
          handle: userData.handle,
          avatar: userData.avatar || this.getDefaultAvatar()
        };
        console.log('👤 Usuário logado:', this.me);
      }
    });

    this.loadFollowingUsers();
    this.loadFollowersUsers();

    // Inscrever para atualizações de posts
    this.postsSubscription = this.postService.posts$.subscribe((posts: Post[]) => {
      console.log('📢 Posts atualizados no feed:', posts.length);
      // Usar os posts diretamente do serviço, sem filtrar por allAvailableUsers
      this.filteredPosts = [...posts].sort((a, b) => b.id - a.id);
      this.loadSavedPosts();
    });

    this.loadSuggestions();

    // Atualizar timestamps a cada minuto
    setInterval(() => {
      this.updatePostTimes();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.postsSubscription) {
      this.postsSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // Avatar padrão fixo (não muda a cada refresh)
  private getDefaultAvatar(): string {
    return 'https://i.pravatar.cc/150?img=1';
  }
  
  private updatePostTimes() {
    for (const post of this.filteredPosts) {
      if (post.timestamp) {
        post.time = this.formatTime(post.timestamp);
      }
    }
  }
  
  formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
      return 'agora';
    } else if (minutes < 60) {
      return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (hours < 24) {
      return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
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
  
  private loadSuggestions() {
    // Sugestões vazias por enquanto - serão carregadas do backend depois
    this.suggestions = [];
  }
  
  sendFriendRequest(userId: number) {
    if (this.followingUsers.includes(userId)) {
      this.showAlert('Aviso', 'Você já segue este usuário!', 'warning');
      return;
    }
    
    this.followingUsers.push(userId);
    this.saveFollowingUsers();
    this.showAlert('Sucesso', 'Pedido enviado!', 'success');
    this.loadSuggestions();
  }
  
  acceptFriendRequest(userId: number) {
    if (!this.followersUsers.includes(userId)) {
      this.followersUsers.push(userId);
      this.saveFollowersUsers();
      this.showAlert('Sucesso', 'Amizade aceita!', 'success');
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

  openReportPostModal(postId: number, postContent: string, postAuthor: string) {
    this.reportTargetType = 'post';
    this.reportTargetId = postId;
    this.reportTargetContent = postContent;
    this.reportMotivo = '';
    this.reportDescricao = '';
    this.showReportModal = true;
  }

  openReportCommentModal(commentId: number, commentContent: string, commentAuthor: string) {
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
    if (!this.reportMotivo) {
      this.showAlert('Erro', 'Por favor, seleccione um motivo para a denúncia.', 'error');
      return;
    }
    
    const result = await this.postService.submitReport({
      referencia_tipo: this.reportTargetType,
      referencia_id: this.reportTargetId,
      motivo: this.reportMotivo,
      descricao: this.reportDescricao
    });
    
    if (result?.success) {
      this.showAlert('Denúncia Enviada', 'A sua denúncia foi registada com sucesso.', 'success');
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

  saveEditPost(post: Post) {
    if (post.editText?.trim()) {
      post.text = post.editText;
      post.isEditing = false;
      post.editText = '';
      this.postService.updatePost(post);
      this.showAlert('Sucesso', 'Publicação editada com sucesso!', 'success');
    }
  }

  cancelEditPost(post: Post) {
    post.isEditing = false;
    post.editText = '';
  }

  async deletePost(postId: number) {
    this.showConfirm('Eliminar Publicação', 'Tem certeza que deseja eliminar esta publicação?', async () => {
      const result = await this.postService.deletePost(postId);
      if (result?.success) {
        this.savedPosts = this.savedPosts.filter(p => p.id !== postId);
        this.saveToLocalStorage();
        this.showAlert('Sucesso', 'Publicação eliminada com sucesso!', 'success');
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

  toggleColorPickerForNewPost() {
    this.showColorPickerForNewPost = !this.showColorPickerForNewPost;
  }

  selectPostColor(colorCode: string) {
    this.selectedPostColor = colorCode;
    this.showColorPickerForNewPost = false;
  }

  removeSelectedColor() {
    this.selectedPostColor = '';
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

  async publish() {
    if (!this.composer.trim() && !this.selectedImageFile && !this.selectedVideoFile) {
      this.showAlert('Erro', 'Adicione um texto, imagem ou vídeo para publicar.', 'error');
      return;
    }
    
    if (this.selectedImageFile && this.selectedVideoFile) {
      this.showAlert('Erro', 'Escolha apenas imagem OU vídeo, não ambos.', 'error');
      return;
    }
    
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
      this.selectedPostColor = '';
      this.showColorPickerForNewPost = false;
      this.showAlert('Sucesso', 'Publicação criada com sucesso!', 'success');
      // Forçar recarregamento imediato
      setTimeout(() => {
        this.postService.refreshPosts();
      }, 500);
    } else {
      this.showAlert('Erro', result?.message || 'Erro ao criar publicação', 'error');
    }
  }

  async toggleBaze(postId: number) {
    const post = this.filteredPosts.find(p => p.id === postId);
    if (!post) return;
    
    if (post.userId === this.me.id) {
      this.showAlert('Ação não permitida', 'Você não pode dar baze no seu próprio post!', 'warning');
      return;
    }
    
    let result;
    if (post.liked) {
      result = await this.postService.unlikePost(postId);
    } else {
      result = await this.postService.likePost(postId);
    }
    
    if (result?.success === false) {
      this.showAlert('Erro', result?.message || 'Erro ao processar baze', 'error');
    }
  }

  toggleComments(postId: number) {
    const post = this.filteredPosts.find(p => p.id === postId);
    if (post) {
      post.showComments = !post.showComments;
    }
  }

  async addComment(postId: number) {
    const post = this.filteredPosts.find(p => p.id === postId);
    if (post && post.newCommentText?.trim()) {
      const result = await this.postService.addComment(postId, post.newCommentText);
      if (result?.success) {
        post.newCommentText = '';
      } else {
        this.showAlert('Erro', result?.message || 'Erro ao adicionar comentário', 'error');
      }
    }
  }

  toggleReplyInput(comment: Comment) {
    comment.showReplyInput = !comment.showReplyInput;
    if (!comment.replyText) comment.replyText = '';
  }

  async addReply(postId: number, parentComment: Comment) {
    if (!parentComment.replyText?.trim()) return;
    
    const result = await this.postService.addComment(postId, parentComment.replyText);
    if (result?.success) {
      parentComment.replyText = '';
      parentComment.showReplyInput = false;
    } else {
      this.showAlert('Erro', result?.message || 'Erro ao adicionar resposta', 'error');
    }
  }

  likeComment(postId: number, commentId: number) {
    console.log('Like no comentário:', commentId);
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

  async deleteComment(postId: number, commentId: number) {
    this.showConfirm('Eliminar Comentário', 'Tem certeza que deseja eliminar este comentário?', async () => {
      const result = await this.postService.deleteComment(commentId);
      if (result?.success) {
        this.showAlert('Sucesso', 'Comentário eliminado com sucesso!', 'success');
      } else {
        this.showAlert('Erro', result?.message || 'Erro ao eliminar comentário', 'error');
      }
    });
  }

  getPostBodyStyle(post: Post) {
    if (post.bgColor && !post.image && !post.video) {
      return { 'background-color': post.bgColor };
    }
    return {};
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