import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E";

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl = 'https://nzolanet-back.onrender.com';

  constructor(private http: HttpClient) {
    console.log('🔐 Auth service criado');
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

  private mapUser(backend: any): any {
    if (!backend) {
      return this.getEmptyUser();
    }
    return {
      id: backend.id?.toString() || Date.now().toString(),
      name: backend.nome || backend.name || backend.display_name || backend.full_name || backend.username || '',
      email: backend.email || '',
      handle: backend.handle || `@${backend.username || (backend.nome || backend.name || backend.display_name || backend.full_name || '').toLowerCase().replace(/\s/g, '')}`,
      avatar: this.normalizeUrl(backend.foto_perfil || backend.avatar || backend.foto || backend.profile_picture, DEFAULT_AVATAR),
      bio: backend.bio || '',
      location: '',
      joinedDate: backend.criado_em || backend.created_at || new Date().toLocaleDateString('pt-PT'),
      postsCount: parseInt(backend.postsCount || backend.total_posts || 0),
      amigosCount: parseInt(backend.amigosCount || backend.following_count || 0),
      followersCount: parseInt(backend.followersCount || backend.followers_count || 0),
      privacy: (backend.privacidade === 'privado' || backend.privacy === 'private') ? 'private' : 'public',
      coverImage: this.normalizeUrl(backend.foto_capa || backend.coverImage || backend.cover_image || ''),
      is_admin: !!backend.is_admin,
      username: backend.username || ''
    };
  }

  private getEmptyUser() {
    return {
      id: Date.now().toString(),
      name: '',
      email: '',
      handle: '',
      avatar: DEFAULT_AVATAR,
      bio: '',
      location: '',
      joinedDate: new Date().toLocaleDateString('pt-PT'),
      postsCount: 0,
      amigosCount: 0,
      followersCount: 0,
      privacy: 'public' as const,
      coverImage: '',
      is_admin: false,
      username: ''
    };
  }

  login(email: string, password: string): Observable<any> {
    const url = `${this.apiUrl}/?route=auth&action=login`;
    console.log('🔐 A fazer login para:', email);

    return this.http.post<any>(url, { email, password }).pipe(
      tap(response => {
        console.log('📦 Resposta do login (tap):', JSON.stringify(response).substring(0, 300));

        if (response?.success) {
          const data = response.data || response;
          const token = data.token || response.token;
          const user = data.user || response.user || data;

          console.log('🔑 Token encontrado:', !!token);
          console.log('👤 User encontrado:', !!user);

          if (token) {
            localStorage.setItem('token', token);
            console.log('✅ Token salvo no localStorage');
          } else {
            console.error('❌ Token não encontrado na resposta');
          }

          if (user) {
            const userData = this.mapUser(user);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ User salvo no localStorage:', userData.name);
          } else {
            console.error('❌ User não encontrado na resposta');
          }
        } else {
          console.error('❌ Login failed:', response?.message);
        }
      })
    );
  }

  register(data: any): Observable<any> {
    const url = `${this.apiUrl}/?route=auth&action=registar`;
    return this.http.post<any>(url, data).pipe(
      tap(response => {
        console.log('📦 Resposta do registo:', JSON.stringify(response).substring(0, 200));
        if (response?.success) {
          const userData = response.data || response.user;
          if (userData) {
            const mapped = this.mapUser(userData);
            localStorage.setItem('user', JSON.stringify(mapped));
          }
        }
      })
    );
  }

  esqueceuSenha(email: string): Observable<any> {
    const url = `${this.apiUrl}/?route=auth&action=esqueceuPassword`;
    return this.http.post<any>(url, { email });
  }

  redefinirSenha(token: string, password: string): Observable<any> {
    const url = `${this.apiUrl}/?route=auth&action=redefinirPassword`;
    return this.http.post<any>(url, { token, password });
  }

  alterarSenha(passwordAtual: string, novaPassword: string): Observable<any> {
    const token = this.getToken();
    const url = `${this.apiUrl}/?route=user&action=alterarPassword`;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(
      url,
      { password_atual: passwordAtual, password_nova: novaPassword },
      { headers }
    );
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    return token;
  }

  getUser(): any {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (!user.id) {
          user.id = Date.now().toString();
          localStorage.setItem('user', JSON.stringify(user));
        }
        return user;
      } catch (e) {
        console.error('❌ Erro ao parsear user do localStorage');
        return null;
      }
    }
    return null;
  }

  getUserId(): string | null {
    const user = this.getUser();
    return user ? user.id : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    const isValid = !!token && token.length > 0 && !!user;

    if (!isValid && token) {
      this.logout();
    }

    return isValid;
  }

  updateUserData(updates: Partial<any>): void {
    const currentUser = this.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/?route=auth&action=logout`, {}).subscribe({
        error: () => {}
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userCoverImage');
    localStorage.removeItem('privacySettings');
    localStorage.removeItem('followingUsers');
    localStorage.removeItem('followersUsers');
    localStorage.removeItem('savedPostsIds');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('friends');
    localStorage.removeItem('incomingRequests');
    localStorage.removeItem('outgoingRequests');
    localStorage.removeItem('savedPosts');
  }
}
