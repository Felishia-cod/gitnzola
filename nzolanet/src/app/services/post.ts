import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Auth } from './auth';

export interface Comment {
  id: number;
  userId: number;
  userName: string;
  userHandle: string;
  userAvatar: string;
  text: string;
  time: string;
  likes: number;
  likedByUser?: boolean;
  replies: Comment[];
  showReplyInput?: boolean;
  replyText?: string;
  isEditing?: boolean;
  editText?: string;
  saved?: boolean;
  eliminado?: boolean;
  removido_por_admin?: boolean;
  post_id?: number;
  conteudo?: string;
}

export interface Post {
  id: number;
  userId: number;
  userName: string;
  userHandle: string;
  userAvatar: string;
  time: string;
  text: string;
  image?: string;
  video?: string;
  bgColor?: string;
  bazes: number;
  comments: Comment[];
  commentsCount: number;
  liked?: boolean;
  saved?: boolean;
  showComments: boolean;
  newCommentText: string;
  showMenu?: boolean;
  isEditing?: boolean;
  editText?: string;
  eliminado?: boolean;
  timestamp?: number;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private apiUrl = 'https://nzolanet-back.onrender.com';
  private postsSubject = new BehaviorSubject<Post[]>([]);
  public posts$ = this.postsSubject.asObservable();
  
  // Cache de usuários para não buscar repetidamente
  private usersCache: Map<string, any> = new Map();

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {
    this.loadPostsFromAPI();
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

  private getFormDataHeaders() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  async loadPostsFromAPI(): Promise<void> {
    try {
      const token = this.auth.getToken();
      if (!token) {
        console.error('❌ Sem token');
        return;
      }

      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/?route=post&action=feed&page=1&limit=50`, this.getHeaders())
      );
      
      console.log('📦 Feed carregado (RAW):', response);
      
      let postsData = null;
      if (response.success && response.data && Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data && Array.isArray(response.data)) {
        postsData = response.data;
      } else if (Array.isArray(response)) {
        postsData = response;
      }
      
      if (postsData && postsData.length > 0) {
        // Para cada post, buscar os dados do usuário
        const postsWithUsers = await this.enrichPostsWithUserData(postsData);
        this.postsSubject.next(postsWithUsers);
        console.log('✅ Feed atualizado com', postsWithUsers.length, 'posts com dados de usuário');
      } else {
        console.log('📭 Nenhum post encontrado');
        this.postsSubject.next([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar feed:', error);
      this.postsSubject.next([]);
    }
  }

  // Método para enriquecer os posts com dados do usuário
  private async enrichPostsWithUserData(posts: any[]): Promise<Post[]> {
    const enrichedPosts: Post[] = [];
    
    for (const post of posts) {
      // Obter o userId
      const userId = post.user_id || post.userId;
      
      let userData = null;
      
      // Verificar se já temos o usuário em cache
      if (userId && this.usersCache.has(userId.toString())) {
        userData = this.usersCache.get(userId.toString());
        console.log(`📦 Usuário ${userId} encontrado no cache`);
      } else if (userId) {
        // Buscar dados do usuário do backend
        userData = await this.fetchUserById(userId);
        if (userData && userId) {
          this.usersCache.set(userId.toString(), userData);
        }
      }
      
      // Criar o post enriquecido
      enrichedPosts.push(this.transformSinglePost(post, userData));
    }
    
    return enrichedPosts;
  }

  // Buscar usuário por ID
  private async fetchUserById(userId: number): Promise<any> {
    try {
      const token = this.auth.getToken();
      if (!token) return null;
      
      const url = `${this.apiUrl}/?route=user&action=obterPerfilDeUtilizador&id=${userId}`;
      const response: any = await firstValueFrom(
        this.http.get(url, this.getHeaders())
      );
      
      console.log(`📦 Usuário ${userId} carregado:`, response);
      
      let userData = null;
      if (response.success && response.data) {
        userData = response.data;
      } else if (response.user) {
        userData = response.user;
      } else if (response.data?.user) {
        userData = response.data.user;
      }
      
      return userData;
    } catch (error) {
      console.error(`❌ Erro ao buscar usuário ${userId}:`, error);
      return null;
    }
  }

  private transformSinglePost(post: any, userData: any): Post {
    let imageUrl = undefined;
    let videoUrl = undefined;
    
    if (post.media) {
      if (Array.isArray(post.media)) {
        const imageMedia = post.media.find((m: any) => m.tipo === 'imagem');
        const videoMedia = post.media.find((m: any) => m.tipo === 'video');
        if (imageMedia?.url) imageUrl = this.fixMediaUrl(imageMedia.url);
        if (videoMedia?.url) videoUrl = this.fixMediaUrl(videoMedia.url);
      } else if (typeof post.media === 'object' && post.media !== null) {
        if (post.media.tipo === 'imagem') imageUrl = this.fixMediaUrl(post.media.url);
        if (post.media.tipo === 'video') videoUrl = this.fixMediaUrl(post.media.url);
      }
    }
    
    // Usar os dados do usuário se disponíveis, senão usar fallback
    return {
      id: post.id || 0,
      userId: userData?.id || post.user_id || 0,
      userName: userData?.name || userData?.username || 'Carregando...',
      userHandle: userData?.handle || `@${(userData?.name || '').toLowerCase().replace(/\s/g, '')}`,
      userAvatar: userData?.avatar || 'https://i.pravatar.cc/150?img=1',
      time: this.formatTime(post.criado_em),
      text: post.conteudo || '',
      image: imageUrl,
      video: videoUrl,
      bazes: post.bazes_count || 0,
      comments: [],
      commentsCount: post.comments_count || 0,
      liked: post.user_liked || false,
      saved: false,
      showComments: false,
      newCommentText: '',
      timestamp: new Date(post.criado_em || Date.now()).getTime()
    };
  }

  private transformPosts(apiPosts: any[]): Post[] {
    if (!apiPosts || !Array.isArray(apiPosts)) return [];
    
    return apiPosts.map((post: any) => {
      let imageUrl = undefined;
      let videoUrl = undefined;
      
      if (post.media) {
        if (Array.isArray(post.media)) {
          const imageMedia = post.media.find((m: any) => m.tipo === 'imagem');
          const videoMedia = post.media.find((m: any) => m.tipo === 'video');
          if (imageMedia?.url) imageUrl = this.fixMediaUrl(imageMedia.url);
          if (videoMedia?.url) videoUrl = this.fixMediaUrl(videoMedia.url);
        } else if (typeof post.media === 'object' && post.media !== null) {
          if (post.media.tipo === 'imagem') imageUrl = this.fixMediaUrl(post.media.url);
          if (post.media.tipo === 'video') videoUrl = this.fixMediaUrl(post.media.url);
        }
      }
      
      // Se o backend já incluiu os dados do usuário
      const userData = post.user || {};
      const hasUserData = userData.name || post.user_name;
      
      return {
        id: post.id || 0,
        userId: userData.id || post.user_id || 0,
        userName: userData.name || post.user_name || (hasUserData ? 'Usuário' : 'Carregando...'),
        userHandle: userData.handle || post.user_handle || `@usuario`,
        userAvatar: userData.avatar || post.user_avatar || 'https://i.pravatar.cc/150?img=1',
        time: this.formatTime(post.criado_em),
        text: post.conteudo || '',
        image: imageUrl,
        video: videoUrl,
        bazes: post.bazes_count || 0,
        comments: [],
        commentsCount: post.comments_count || 0,
        liked: post.user_liked || false,
        saved: false,
        showComments: false,
        newCommentText: '',
        timestamp: new Date(post.criado_em || Date.now()).getTime()
      };
    });
  }

  private fixMediaUrl(url: string): string {
    if (!url) return '';
    return url.replace(/http:\/\/localhost:\d+/g, this.apiUrl);
  }

  async addPost(postData: { conteudo: string; media?: File[] }): Promise<any> {
    const token = this.auth.getToken();
    if (!token) {
      return { success: false, message: 'Não autenticado' };
    }

    const formData = new FormData();
    formData.append('conteudo', postData.conteudo);
    
    if (postData.media && postData.media.length > 0) {
      for (const file of postData.media) {
        formData.append('media[]', file);
      }
    }

    console.log('📤 Enviando post:', {
      conteudo: postData.conteudo,
      mediaCount: postData.media?.length || 0
    });

    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/?route=post&action=criar`, formData, this.getFormDataHeaders())
      );
      
      console.log('📦 Resposta do backend:', response);
      
      if (response.success) {
        await this.loadPostsFromAPI();
        return { success: true, message: 'Publicação criada com sucesso!' };
      }
      return response;
    } catch (error: any) {
      console.error('❌ Erro ao criar post:', error);
      return { success: false, message: error.error?.message || 'Erro ao criar publicação' };
    }
  }

  async deletePost(postId: number): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false, message: 'Não autenticado' };

    try {
      const response: any = await firstValueFrom(
        this.http.delete(`${this.apiUrl}/?route=post&action=eliminar&id=${postId}`, this.getHeaders())
      );
      
      if (response.success) {
        await this.loadPostsFromAPI();
      }
      return response;
    } catch (error: any) {
      console.error('Erro ao deletar post:', error);
      return { success: false, message: error.error?.message || 'Erro ao deletar publicação' };
    }
  }

  async likePost(postId: number): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/?route=baze&action=like`, 
          { post_id: postId }, 
          this.getHeaders()
        )
      );
      
      if (response.success) {
        await this.loadPostsFromAPI();
      }
      return response;
    } catch (error: any) {
      console.error('Erro ao dar like:', error);
      return { success: false };
    }
  }

  async unlikePost(postId: number): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.delete(`${this.apiUrl}/?route=baze&action=unlike&post_id=${postId}`, this.getHeaders())
      );
      
      if (response.success) {
        await this.loadPostsFromAPI();
      }
      return response;
    } catch (error: any) {
      console.error('Erro ao remover like:', error);
      return { success: false };
    }
  }

  async addComment(postId: number, conteudo: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/?route=comment&action=criar`,
          { post_id: postId, conteudo },
          this.getHeaders()
        )
      );
      
      if (response.success) {
        await this.loadPostsFromAPI();
      }
      return response;
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
      return { success: false };
    }
  }

  async deleteComment(commentId: number): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.delete(`${this.apiUrl}/?route=comment&action=eliminar&id=${commentId}`, this.getHeaders())
      );
      
      if (response.success) {
        await this.loadPostsFromAPI();
      }
      return response;
    } catch (error: any) {
      console.error('Erro ao deletar comentário:', error);
      return { success: false };
    }
  }

  async submitReport(reportData: any): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/?route=report&action=criar`, reportData, this.getHeaders())
      );
      return response;
    } catch (error: any) {
      console.error('Erro ao enviar denúncia:', error);
      return { success: false };
    }
  }

  private formatTime(dateString: string): string {
    if (!dateString) return 'agora';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (minutes < 1) return 'agora';
      if (minutes < 60) return `há ${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
      if (hours < 24) return `há ${hours} ${hours === 1 ? 'h' : 'hs'}`;
      return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    } catch (e) {
      return 'agora';
    }
  }

  getPosts(): Post[] {
    return this.postsSubject.value;
  }

  updatePost(post: Post) {
    const posts = this.postsSubject.value;
    const index = posts.findIndex(p => p.id === post.id);
    if (index !== -1) {
      posts[index] = post;
      this.postsSubject.next([...posts]);
    }
  }

  refreshPosts(): void {
    this.loadPostsFromAPI();
  }
}