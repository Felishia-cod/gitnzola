import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostService, Post } from '../../services/post';
import { UserService, UserData } from '../../services/user';

@Component({
  selector: 'app-guardados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './guardados.html',
  styleUrls: ['./guardados.scss']
})
export class GuardadosComponent implements OnInit {
  savedPosts: Post[] = [];
  
  currentUser: UserData = {
    id: 'guardados-user', // ADICIONADO: id obrigatório
    name: 'Tu (Demo)',
    handle: '@demo',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    bio: 'Estudante do ISPTEC · A construir o NzolaNet 🇦🇴',
    email: 'demo@nzolanet.ao',
    location: 'Luanda, Angola',
    joinedDate: 'Maio 2026',
    postsCount: 128,
    amigosCount: 1,
    followersCount: 1200,
    privacy: 'public',
    coverImage: '' // ADICIONADO: coverImage (opcional mas recomendado)
  };
  
  showPostModal: boolean = false;
  selectedPost: Post | null = null;
  
  showAlertModal: boolean = false;
  alertTitle: string = '';
  alertMessage: string = '';
  alertType: 'error' | 'success' | 'warning' | 'info' = 'error';

  constructor(
    private postService: PostService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const userData = this.userService.getCurrentUser();
    if (userData) {
      this.currentUser = { ...userData };
    }
    this.loadSavedPosts();
    
    this.postService.posts$.subscribe(() => {
      this.loadSavedPosts();
    });
  }

  loadSavedPosts() {
    const savedIds = localStorage.getItem('savedPostsIds');
    if (savedIds) {
      try {
        const savedPostIds = JSON.parse(savedIds);
        const allPosts = this.postService.getPosts();
        this.savedPosts = allPosts.filter(post => savedPostIds.includes(post.id));
        console.log('Posts guardados carregados:', this.savedPosts.length);
      } catch (e) {
        console.error('Erro ao carregar posts guardados:', e);
        this.savedPosts = [];
      }
    } else {
      this.savedPosts = [];
    }
  }

  openPostModal(post: Post) {
    this.selectedPost = post;
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

  removeSaved(postId: number) {
    const savedIds = localStorage.getItem('savedPostsIds');
    if (savedIds) {
      let savedPostIds = JSON.parse(savedIds);
      savedPostIds = savedPostIds.filter((id: number) => id !== postId);
      localStorage.setItem('savedPostsIds', JSON.stringify(savedPostIds));
      this.loadSavedPosts();
      this.showAlert('Removido', 'Post removido dos guardados!', 'success');
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
}