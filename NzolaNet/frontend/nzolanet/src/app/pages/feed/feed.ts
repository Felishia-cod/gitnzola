import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { UserService, UserData } from '../../services/user';
import { PostService, Post } from '../../services/post';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss']
})
export class FeedComponent implements OnInit {
  incomingCount: number = 0;
  userAvatar: string = '';
  
  searchQuery: string = '';
  searchResults: any[] = [];
  showSearchResults: boolean = false;
  
  me = {
    id: 999,
    name: '',
    handle: '',
    avatar: ''
  };
  
  allUsers: any[] = [];
  
  showPostModal: boolean = false;
  composer: string = '';
  selectedImage: string | null = null;
  selectedVideo: string | null = null;
  selectedImageFile: File | null = null;
  selectedVideoFile: File | null = null;
  selectedPostColor: string = '';
  showEmojiPicker: boolean = false;
  showColorPicker: boolean = false;
  
  showAlertModal: boolean = false;
  alertTitle: string = '';
  alertMessage: string = '';
  alertType: 'error' | 'success' | 'warning' | 'info' = 'error';
  
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
  
  suggestions = [
    { id: 4, name: 'João Silva', handle: '@joaosilva', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    { id: 5, name: 'Maria Santos', handle: '@marias', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
    { id: 6, name: 'Paulo Mendes', handle: '@paulom', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }
  ];

  constructor(
    private userService: UserService,
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.userData$.subscribe((userData: UserData | null) => {
      if (userData) {
        this.userAvatar = userData.avatar;
        this.me.name = userData.name;
        this.me.handle = userData.handle;
        this.me.avatar = userData.avatar;
      }
    });
    
    const userData = this.userService.getCurrentUser();
    if (userData) {
      this.userAvatar = userData.avatar;
      this.me.name = userData.name;
      this.me.handle = userData.handle;
      this.me.avatar = userData.avatar;
    }
    
    this.initUsersList();
    this.loadIncomingRequestsCount();
    
    window.addEventListener('storage', (event) => {
      if (event.key === 'incomingRequests') {
        this.loadIncomingRequestsCount();
      }
    });
  }
  
  initUsersList() {
    this.allUsers = [
      { id: 'u1', name: 'Nzinga Domingos', handle: '@nzinga', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', bio: 'Fotógrafa em Luanda 📸', type: 'user' },
      { id: 'u2', name: 'Kiala Bento', handle: '@kiala_b', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100', bio: 'Chef · Muamba é vida 🍲', type: 'user' },
      { id: 'u3', name: 'Lukeni Afonso', handle: '@lukeni', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', bio: 'DJ Kuduro 🔥', type: 'user' },
      { id: 'u4', name: 'Mbala João', handle: '@mbala', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', bio: 'Programador Angular', type: 'user' },
      { id: 'u5', name: 'Sumbe Costa', handle: '@sumbe', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', bio: 'Designer UI/UX', type: 'user' },
      { id: 'u6', name: 'Kianda Silva', handle: '@kianda', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', bio: 'Jornalista', type: 'user' },
      { id: 'u7', name: 'Tukula Pedro', handle: '@tukula', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100', bio: 'Músico', type: 'user' },
      { id: 'u8', name: 'Kimera Sofia', handle: '@kimera', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100', bio: 'Ativista', type: 'user' }
    ];
  }
  
  onSearch() {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }
    
    const query = this.searchQuery.toLowerCase().trim();
    this.searchResults = [];
    
    const matchedUsers = this.allUsers.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.handle.toLowerCase().includes(query) ||
      (user.bio && user.bio.toLowerCase().includes(query))
    );
    
    matchedUsers.forEach(user => {
      this.searchResults.push({ ...user, type: 'user', icon: '👤' });
    });
    
    const matchedHashtags = this.trendingTopics.filter(topic => 
      topic.tag.toLowerCase().includes(query)
    );
    
    matchedHashtags.forEach(hashtag => {
      this.searchResults.push({
        id: hashtag.tag,
        name: hashtag.tag,
        handle: hashtag.tag,
        avatar: null,
        bio: `${hashtag.count} publicações`,
        type: 'hashtag',
        icon: '#️⃣'
      });
    });
    
    this.showSearchResults = this.searchResults.length > 0;
  }
  
  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
  }
  
  goToProfile(userId: string) {
    this.clearSearch();
    this.router.navigate(['/feed/perfil', userId]);
  }
  
  goToHashtag(hashtag: string) {
    this.clearSearch();
    this.router.navigate(['/feed/explorar'], { queryParams: { q: hashtag } });
  }
  
  loadIncomingRequestsCount() {
    const savedIncoming = localStorage.getItem('incomingRequests');
    if (savedIncoming) {
      const incoming = JSON.parse(savedIncoming);
      this.incomingCount = incoming.length;
    } else {
      const initialRequests = ['u2', 'u4'];
      localStorage.setItem('incomingRequests', JSON.stringify(initialRequests));
      this.incomingCount = initialRequests.length;
    }
  }

  openPostModal() {
    this.showPostModal = true;
    this.composer = '';
    this.selectedImage = null;
    this.selectedVideo = null;
    this.selectedImageFile = null;
    this.selectedVideoFile = null;
    this.selectedPostColor = '';
    this.showEmojiPicker = false;
    this.showColorPicker = false;
  }
  
  closePostModal() {
    this.showPostModal = false;
    this.composer = '';
    this.selectedImage = null;
    this.selectedVideo = null;
    this.selectedImageFile = null;
    this.selectedVideoFile = null;
    this.selectedPostColor = '';
    this.showEmojiPicker = false;
    this.showColorPicker = false;
  }
  
  closePostModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closePostModal();
    }
  }
  
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }
  
  toggleColorPicker() {
    this.showColorPicker = !this.showColorPicker;
  }
  
  addEmoji(emoji: string) {
    this.composer += emoji;
    this.showEmojiPicker = false;
  }
  
  selectPostColor(colorCode: string) {
    this.selectedPostColor = colorCode;
    this.showColorPicker = false;
  }
  
  removeSelectedColor() {
    this.selectedPostColor = '';
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
  
  async publishPost() {
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
      this.closePostModal();
      this.showAlert('Sucesso', 'Publicação criada com sucesso!', 'success');
    } else {
      this.showAlert('Erro', result?.message || 'Erro ao criar publicação', 'error');
    }
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

  sendFriendRequest(userId: number) {
    console.log('Pedido enviado para usuário:', userId);
  }
}