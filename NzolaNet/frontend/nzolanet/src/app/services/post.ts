import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { Auth } from './auth';

export interface Comment {
  id: number;
  userId: string;
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
  userId: string;
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

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E";

@Injectable({ providedIn: 'root' })

export class PostService {
  private apiUrl = 'https://nzolanet-back.onrender.com';
  private postsSubject = new BehaviorSubject<Post[]>([]);
  public posts$ = this.postsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {
    this.loadPostsFromAPI();
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

  private mapPost(backend: any): Post {
    let imageUrl: string | undefined;
    let videoUrl: string | undefined;

    if (backend.media) {
      if (typeof backend.media === 'object' && backend.media !== null) {
        if (backend.media.tipo === 'imagem' && backend.media.url) {
          imageUrl = this.normalizeUrl(backend.media.url);
        } else if (backend.media.tipo === 'video' && backend.media.url) {
          videoUrl = this.normalizeUrl(backend.media.url);
        }
      }
    }

    return {
      id: parseInt(backend.id || '0'),
      userId: (backend.user_id || '').toString(),
      userName: backend.autor_nome || 'Carregando...',
      userHandle: backend.autor_username
        ? `@${backend.autor_username}`
        : `@${(backend.autor_nome || '').toLowerCase().replace(/\s/g, '')}`,
      userAvatar: this.normalizeUrl(backend.autor_foto_perfil, DEFAULT_AVATAR),
      time: this.formatTime(backend.criado_em),
      text: backend.conteudo || '',
      image: imageUrl,
      video: videoUrl,
      bgColor: backend.cor || undefined,
      bazes: backend.total_bazes || 0,
      comments: [],
      commentsCount: backend.total_comentarios || 0,
      liked: backend.user_liked || false,
      saved: false,
      showComments: false,
      newCommentText: '',
      timestamp: new Date(backend.criado_em || Date.now()).getTime()
    };
  }

  private mapComments(backend: any[]): Comment[] {
    if (!backend || !Array.isArray(backend)) return [];
    return backend.map((c: any) => ({
      id: parseInt(c.id || '0'),
      userId: (c.user_id || c.userId || '').toString(),
      userName: c.autor_nome || c.user_name || 'Usuário',
      userHandle: c.autor_username
        ? `@${c.autor_username}`
        : `@${(c.autor_nome || 'user').toLowerCase().replace(/\s/g, '')}`,
      userAvatar: this.normalizeUrl(c.autor_foto_perfil || c.user_avatar, DEFAULT_AVATAR),
      text: c.conteudo || c.text || '',
      time: this.formatTime(c.criado_em),
      likes: 0,
      likedByUser: false,
      replies: [],
      eliminado: c.eliminado || false,
      removido_por_admin: c.removido_por_admin || false,
      post_id: c.post_id
    }));
  }

  async loadPostsFromAPI(): Promise<void> {
    try {
      const token = this.auth.getToken();
      if (!token) return;

      const response: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/?route=post&action=feed&page=1&limit=50`, this.getHeaders())
      );

      let postsData: any[] | null = null;
      if (response.success && Array.isArray(response.data)) {
        postsData = response.data;
      } else if (Array.isArray(response)) {
        postsData = response;
      }

      if (postsData && postsData.length > 0) {
        const posts = postsData.map(p => this.mapPost(p));
        this.postsSubject.next(posts);
      } else {
        this.postsSubject.next([]);
      }
    } catch (error) {
      this.postsSubject.next([]);
    }
  }

  async addPost(postData: { conteudo: string; media?: File[]; backgroundColor?: string }): Promise<any> {
    const token = this.auth.getToken();
    if (!token) {
      return { success: false, message: 'Não autenticado' };
    }

    try {
      const body: any = { conteudo: postData.conteudo };
      if (postData.backgroundColor) {
        body.cor = postData.backgroundColor;
      }
      const response: any = await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/?route=post&action=criar`,
          body,
          this.getHeaders()
        )
      );

      if (response.success) {
        console.log('📦 Resposta do servidor:', JSON.stringify(response));
        if (postData.media && postData.media.length > 0) {
          await this.loadPostsFromAPI();
          const posts = this.getPosts();
          const novoPost = posts.length > 0 ? posts[0] : null;
          const postId = response.data?.id || response.id || response.post_id || (novoPost ? novoPost.id.toString() : null);
          console.log('📎 Post criado, id:', postId, 'ficheiros:', postData.media.length);
          if (postId) {
            const uploadOk = await this.uploadMedia(postId, postData.media);
            if (!uploadOk) {
              console.warn('⚠️ Post criado mas media falhou.');
            } else {
              console.log('✅ Media enviada com sucesso');
            }
          } else {
            console.error('❌ Não foi possível obter o post_id');
          }
          await this.loadPostsFromAPI();
          return { success: true, message: 'Publicação criada com sucesso!' };
        }
        await this.loadPostsFromAPI();
        return { success: true, message: 'Publicação criada com sucesso!' };
      }
      return response;
    } catch (error: any) {
      return { success: false, message: error.error?.message || 'Erro ao criar publicação' };
    }
  }

  private async uploadMedia(postId: string, files: File[]): Promise<boolean> {
    let allOk = true;
    const token = this.auth.getToken();
    if (!token) return false;

    for (const file of files) {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('post_id', postId);

      try {
        console.log('📤 Enviando media para post', postId, '- ficheiro:', file.name, file.size);
        const res: any = await firstValueFrom(
          this.http.post(
            `${this.apiUrl}/?route=upload&action=media&token=${encodeURIComponent(token)}`,
            formData,
            { responseType: 'text' as 'json' }
          ).pipe(timeout(30000))
        );
        console.log('📥 Resposta upload (texto):', res);
        const parsed = typeof res === 'string' ? JSON.parse(res) : res;
        if (!parsed?.success) {
          console.error('Upload devolveu erro:', parsed);
          allOk = false;
        }
      } catch (error: any) {
        console.error('❌ Erro ao fazer upload de media:', error.status, error.message);
        if (error.error) console.error('   Corpo da resposta:', error.error);
        allOk = false;
      }
    }
    return allOk;
  }

  async deletePost(postId: number): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false, message: 'Não autenticado' };

    try {
      const response: any = await firstValueFrom(
        this.http.delete(`${this.apiUrl}/?route=post&action=eliminar&id=${postId}`, this.getHeaders())
      );

      return response;
    } catch (error: any) {
      return { success: false, message: error.error?.message || 'Erro ao deletar publicação' };
    }
  }

  async likePost(postId: number): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/?route=baze&action=like`,
          { post_id: postId.toString() },
          this.getHeaders()
        )
      );
      return response;
    } catch (error: any) {
      return { success: false };
    }
  }

  async unlikePost(postId: number): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.delete(
          `${this.apiUrl}/?route=baze&action=unlike&post_id=${postId}`,
          this.getHeaders()
        )
      );
      return response;
    } catch (error: any) {
      return { success: false };
    }
  }

  async addComment(postId: number, conteudo: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/?route=comment&action=create`,
          { post_id: postId.toString(), conteudo },
          this.getHeaders()
        )
      );
      return response;
    } catch (error: any) {
      return { success: false };
    }
  }

  async deleteComment(commentId: number): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.delete(
          `${this.apiUrl}/?route=comment&action=delete&id=${commentId}`,
          this.getHeaders()
        )
      );
      return response;
    } catch (error: any) {
      return { success: false };
    }
  }

  async submitReport(reportData: any): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/?route=report&action=create`,
          reportData,
          this.getHeaders()
        )
      );
      return response;
    } catch (error: any) {
      return { success: false };
    }
  }

  async loadCommentsByPost(postId: number): Promise<Comment[]> {
    const token = this.auth.getToken();
    if (!token) return [];

    try {
      const response: any = await firstValueFrom(
        this.http.get(
          `${this.apiUrl}/?route=comment&action=getByPost&post_id=${postId}&page=1&limit=50`,
          this.getHeaders()
        )
      );

      if (response.success && Array.isArray(response.data)) {
        return this.mapComments(response.data);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    const token = this.auth.getToken();
    if (!token) return [];

    try {
      const response: any = await firstValueFrom(
        this.http.get(
          `${this.apiUrl}/?route=post&action=meusPosts&page=1&limit=50`,
          this.getHeaders()
        )
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data.map((p: any) => this.mapPost(p));
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async getUserPostsById(userId: string): Promise<Post[]> {
    const token = this.auth.getToken();
    if (!token) return [];

    try {
      const response: any = await firstValueFrom(
        this.http.get(
          `${this.apiUrl}/?route=post&action=postsDeUtilizador&user_id=${userId}&page=1&limit=50`,
          this.getHeaders()
        )
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data.map((p: any) => this.mapPost(p));
      }
      return [];
    } catch (error) {
      return [];
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

  async refreshPosts(): Promise<void> {
    await this.loadPostsFromAPI();
  }

  clearPosts(): void {
    this.postsSubject.next([]);
  }
}
