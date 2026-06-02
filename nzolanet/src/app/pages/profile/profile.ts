import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { UserService, UserData } from '../../services/user';
import { PostService, Post, Comment } from '../../services/post';
import { Auth } from '../../services/auth';
import { Subscription } from 'rxjs';

interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: UserData | null = null;
  userPosts: Post[] = [];
  coverImage: string = '';
  privacyStatus: 'public' | 'private' = 'public';
  isLoading: boolean = true;
  errorMessage: string = '';

  showPostModal: boolean = false;
  selectedPost: Post | null = null;
  newCommentText: string = '';

  amigos: User[] = [];
  followers: User[] = [];

  showModal: boolean = false;
  modalTitle: string = '';
  modalUsers: User[] = [];
  searchQuery: string = '';
  showEditModal: boolean = false;

  isOwnProfile: boolean = true;
  viewedUserId: string | null = null;
  viewedUser: UserData | null = null;
  
  editForm = {
    name: '',
    bio: '',
    location: '',
    avatar: ''
  };

  passwordForm: PasswordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  private userSubscription: Subscription | null = null;
  private postsSubscription: Subscription | null = null;

  constructor(
    private userService: UserService,
    private postService: PostService,
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('🚀 ProfileComponent iniciado');

    // Verificar token
    const token = this.auth.getToken();
    if (!token) {
      console.error('❌ Token não encontrado');
      this.router.navigate(['/login']);
      return;
    }

    // Verificar se há um ID na rota (visualizando outro perfil)
    const profileId = this.route.snapshot.paramMap.get('id');
    const currentUserData = this.userService.getCurrentUser();

    if (profileId && currentUserData?.id !== profileId) {
      // Visualizando perfil de outro usuário
      this.isOwnProfile = false;
      this.viewedUserId = profileId;
      await this.loadOtherUserProfile(profileId);
    } else {
      this.isOwnProfile = true;

      // 1. Primeiro, verificar se já tem usuário em cache
      if (currentUserData) {
        console.log('📦 Usuário do cache:', currentUserData.name);
        this.setCurrentUser(currentUserData);
        this.isLoading = false;
        this.cdr.detectChanges();
      }

      // 2. Subscrever para futuras atualizações
      this.userSubscription = this.userService.userData$.subscribe(user => {
        if (user) {
          console.log('📢 Atualização do UserService:', user.name);
          this.setCurrentUser(user);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });

      // 3. Carregar perfil do backend (se necessário)
      if (!currentUserData) {
        console.log('🔄 Carregando perfil do backend...');
        await this.userService.loadUserProfile();
      }

      // 4. Timeout de segurança
      setTimeout(() => {
        if (!this.currentUser && !this.errorMessage) {
          console.error('❌ Timeout: perfil não carregado');
          this.errorMessage = 'Erro ao carregar perfil. Tente novamente.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      }, 8000);

      // 5. Carregar posts
      this.postsSubscription = this.postService.posts$.subscribe(posts => {
        if (this.currentUser?.id) {
          this.userPosts = posts.filter(p => p.userId === this.currentUser!.id && !p.eliminado);
          this.fillPostUserNames(this.currentUser);
          if (this.currentUser) {
            this.currentUser.postsCount = this.userPosts.length;
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  private fillPostUserNames(user: UserData | null) {
    if (!user) return;
    for (const post of this.userPosts) {
      if (!post.userName && post.userHandle) {
        if (post.userId === user.id && user.name) {
          post.userName = user.name;
        } else {
          post.userName = post.userHandle.replace('@', '');
        }
      }
    }
  }

  private async loadOtherUserProfile(userId: string) {
    const userData = await this.userService.loadUserProfileById(userId);
    if (userData) {
      this.viewedUser = userData;
      this.currentUser = userData;
      this.privacyStatus = userData.privacy;
      this.isLoading = false;
      this.cdr.detectChanges();

      // Carregar posts deste usuário
      const posts = await this.postService.getUserPostsById(userId);
      this.userPosts = posts.filter(p => !p.eliminado);
      this.fillPostUserNames(userData);
      if (this.viewedUser) {
        this.viewedUser.postsCount = this.userPosts.length;
      }
      this.cdr.detectChanges();
    } else {
      this.errorMessage = 'Utilizador não encontrado.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private setCurrentUser(user: UserData) {
    this.currentUser = user;
    this.privacyStatus = user.privacy;
    this.editForm = {
      name: user.name,
      bio: user.bio,
      location: user.location,
      avatar: user.avatar
    };
    const savedCover = localStorage.getItem('userCoverImage');
    this.coverImage = savedCover || user.coverImage || '';
    console.log('✅ currentUser definido:', this.currentUser?.name);
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.postsSubscription) {
      this.postsSubscription.unsubscribe();
    }
  }

  openPostModal(post: Post) {
    this.selectedPost = post;
    this.newCommentText = '';
    this.showPostModal = true;
  }

  closePostModal() {
    this.showPostModal = false;
    this.selectedPost = null;
  }

  closePostModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('post-modal-overlay')) {
      this.closePostModal();
    }
  }

  addCommentToPost() {
    if (!this.selectedPost || !this.newCommentText.trim() || !this.currentUser) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: this.currentUser.id ? this.currentUser.id : '999',
      userName: this.currentUser.name,
      userHandle: this.currentUser.handle,
      userAvatar: this.currentUser.avatar,
      text: this.newCommentText,
      time: 'agora',
      likes: 0,
      replies: [],
      showReplyInput: false,
      replyText: '',
      isEditing: false,
      editText: '',
      saved: false,
      likedByUser: false
    };
    
    this.selectedPost.comments.unshift(newComment);
    this.selectedPost.commentsCount++;
    this.postService.updatePost(this.selectedPost);
    this.newCommentText = '';
  }

  likePostComment(commentId: string) {
    if (!this.selectedPost) return;
    const comment = this.findCommentInPost(this.selectedPost.comments, commentId);
    if (comment) {
      if (comment.userId === (this.currentUser?.id || '999')) {
        return;
      }
      if (!comment.likedByUser) {
        comment.likedByUser = true;
        comment.likes++;
        this.postService.updatePost(this.selectedPost);
      }
    }
  }

  private findCommentInPost(comments: Comment[], commentId: string): Comment | null {
    for (const comment of comments) {
      if (comment.id === commentId) return comment;
      for (const reply of comment.replies) {
        if (reply.id === commentId) return reply;
      }
    }
    return null;
  }

  get filteredUsers(): User[] {
    if (!this.searchQuery.trim()) {
      return this.modalUsers;
    }
    const query = this.searchQuery.toLowerCase();
    return this.modalUsers.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.handle.toLowerCase().includes(query)
    );
  }

  get privacyIcon(): string {
    return this.privacyStatus === 'public' ? '🌍' : '🔒';
  }

  get privacyText(): string {
    return this.privacyStatus === 'public' ? 'Público' : 'Privado';
  }

  async setPrivacy(status: 'public' | 'private') {
    this.privacyStatus = status;
    if (this.currentUser) {
      await this.userService.updateProfile({ privacy: status });
    }
  }

  openAmigos() {
    this.modalTitle = 'Amigos';
    this.modalUsers = [...this.amigos];
    this.searchQuery = '';
    this.showModal = true;
  }

  openFollowers() {
    this.modalTitle = 'Seguidores';
    this.modalUsers = [...this.followers];
    this.searchQuery = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  closeModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  openEditModal() {
    if (this.currentUser) {
      this.editForm = {
        name: this.currentUser.name,
        bio: this.currentUser.bio,
        location: this.currentUser.location,
        avatar: this.currentUser.avatar
      };
    }
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  closeEditModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('edit-modal-overlay')) {
      this.closeEditModal();
    }
  }

  async saveProfile() {
    if (!this.currentUser) return;
    
    const result = await this.userService.updateProfile({
      name: this.editForm.name,
      bio: this.editForm.bio,
      location: this.editForm.location
    });
    
    if (result.success) {
      if (this.currentUser) {
        this.currentUser.name = this.editForm.name;
        this.currentUser.bio = this.editForm.bio;
        this.currentUser.location = this.editForm.location;
      }
      alert('Perfil atualizado com sucesso!');
    } else {
      alert(result.message || 'Erro ao atualizar perfil');
    }
    
    this.closeEditModal();
  }

  async openCoverUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const url = await this.userService.uploadCover(file);
        if (url) {
          this.coverImage = url;
          localStorage.setItem('userCoverImage', url);
          alert('Capa atualizada com sucesso!');
        } else {
          alert('Erro ao atualizar capa');
        }
      }
    };
    input.click();
  }

  async openAvatarUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const url = await this.userService.uploadAvatar(file);
        if (url) {
          this.editForm.avatar = url;
          if (this.currentUser) {
            this.currentUser.avatar = url;
          }
          alert('Foto de perfil atualizada com sucesso!');
        } else {
          alert('Erro ao atualizar foto de perfil');
        }
      }
    };
    input.click();
  }

  async removeAvatar() {
    if (!confirm('Tens a certeza que queres remover a foto de perfil?')) return;
    const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E";
    this.editForm.avatar = defaultAvatar;
    if (this.currentUser) {
      this.currentUser.avatar = defaultAvatar;
    }
    await this.userService.removeAvatar();
    alert('Foto de perfil removida.');
  }

  goBack() {
    this.router.navigate(['/feed']);
  }

  followBack(userId: string) {
    console.log('Seguir de volta:', userId);
  }

  async changePassword() {
    if (!this.passwordForm.currentPassword) {
      alert('Por favor, insira a senha atual');
      return;
    }
    
    if (!this.passwordForm.newPassword) {
      alert('Por favor, insira a nova senha');
      return;
    }
    
    if (this.passwordForm.newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }
    
    try {
      const result: any = await this.auth.alterarSenha(
        this.passwordForm.currentPassword,
        this.passwordForm.newPassword
      ).toPromise();
      
      if (result && result.success) {
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        alert('Senha alterada com sucesso!');
      } else {
        alert(result?.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      alert('Erro ao alterar senha');
    }
  }

  logout() {
    this.userService.clearUser();
    this.postService.clearPosts();
    this.auth.logout();
    window.location.href = '/login';
  }
}