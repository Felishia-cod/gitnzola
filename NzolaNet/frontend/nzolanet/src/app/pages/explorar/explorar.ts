import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService, Post, Comment } from '../../services/post';
import { UserService, UserData } from '../../services/user';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './explorar.html',
  styleUrls: ['./explorar.scss']
})
export class ExplorarComponent implements OnInit {
  trendingPosts: Post[] = [];
  showPostModal: boolean = false;
  selectedPost: Post | null = null;
  newCommentText: string = '';
  
  currentUser: UserData = {
    id: 'explore-user', // ADICIONADO: id obrigatório
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
    coverImage: '' // ADICIONADO: coverImage
  };
  
  me: { id: string; name: string; handle: string; avatar: string } = {
    id: '0',
    name: '',
    handle: '',
    avatar: ''
  };
  
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
    // CORREÇÃO: Verificar se userData não é null
    if (userData) {
      this.currentUser = userData;
      this.me = {
        id: userData.id || '0',
        name: userData.name,
        handle: userData.handle,
        avatar: userData.avatar
      };
    }

    this.postService.posts$.subscribe(posts => {
      const activePosts = posts.filter(p => !p.eliminado);
      this.trendingPosts = [...activePosts].sort((a, b) => b.bazes - a.bazes).slice(0, 12);
    });
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
    if (!this.selectedPost || !this.newCommentText.trim()) return;
    
    const newComment: Comment = {
      id: Date.now(),
      userId: this.me.id,
      userName: this.me.name,
      userHandle: this.me.handle,
      userAvatar: this.me.avatar,
      text: this.newCommentText,
      time: 'agora',
      likes: 0,
      replies: [],
      showReplyInput: false,
      replyText: '',
      isEditing: false,
      editText: '',
      saved: false,
      likedByUser: false // ADICIONADO: campo obrigatório
    };
    
    this.selectedPost.comments.unshift(newComment);
    this.selectedPost.commentsCount++;
    this.postService.updatePost(this.selectedPost);
    this.newCommentText = '';
  }

  likePostComment(commentId: number) {
    if (!this.selectedPost) return;
    const comment = this.findCommentInPost(this.selectedPost.comments, commentId);
    if (comment) {
      if (comment.userId === this.me.id) {
        this.showAlert('Ação não permitida', 'Você não pode dar like no seu próprio comentário!', 'warning');
        return;
      }
      if (!comment.likedByUser) {
        comment.likedByUser = true;
        comment.likes++;
        this.postService.updatePost(this.selectedPost);
      } else {
        this.showAlert('Aviso', 'Você já deu like neste comentário!', 'warning');
      }
    }
  }

  private findCommentInPost(comments: Comment[], commentId: number): Comment | null {
    for (const comment of comments) {
      if (comment.id === commentId) return comment;
      for (const reply of comment.replies) {
        if (reply.id === commentId) return reply;
      }
    }
    return null;
  }

  toggleBaze(post: Post) {
    if (post.userId === this.me.id) {
      this.showAlert('Ação não permitida', 'Você não pode dar baze no seu próprio post!', 'warning');
      return;
    }
    
    post.liked = !post.liked;
    post.bazes += post.liked ? 1 : -1;
    this.postService.updatePost(post);
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