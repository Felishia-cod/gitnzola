import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Auth } from './auth';

export interface UserData {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar: string;
  bio: string;
  location: string;
  joinedDate: string;
  postsCount: number;
  amigosCount: number;
  followersCount: number;
  privacy: 'public' | 'private';
  coverImage?: string;
  username?: string;
  is_admin?: boolean;
}

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Ccircle fill='%23d1d5db' cx='24' cy='15' r='9'/%3E%3Cpath fill='%23d1d5db' d='M8 44c0-9 7-16 16-16s16 7 16 16'/%3E%3C/svg%3E";

@Injectable({
  providedIn: 'root'
})

export class UserService {
  private apiUrl = 'https://nzolanet-back.onrender.com';
  private userDataSubject = new BehaviorSubject<UserData | null>(null);

  private normalizeUrl(url: string | null | undefined): string {
    if (!url) return DEFAULT_AVATAR;
    if (url.includes('localhost')) {
      return url.replace(/https?:\/\/localhost:\d+\/NzolaNet\/backend/g, this.apiUrl);
    }
    if (url.startsWith('/NzolaNet/backend')) {
      return this.apiUrl + url.replace('/NzolaNet/backend', '');
    }
    return url;
  }
  public userData$ = this.userDataSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {
    this.loadUserFromLocalStorage();
  }

  private mapUser(backend: any): UserData {
    return {
      id: backend.id?.toString() || Date.now().toString(),
      name: backend.nome || backend.name || '',
      email: backend.email || '',
      handle: backend.handle || `@${backend.username || (backend.nome || '').toLowerCase().replace(/\s/g, '')}`,
      avatar: this.normalizeUrl(backend.foto_perfil || backend.avatar || DEFAULT_AVATAR),
      bio: backend.bio || '',
      location: '',
      joinedDate: backend.criado_em || new Date().toLocaleDateString('pt-PT'),
      postsCount: backend.postsCount || 0,
      amigosCount: 0,
      followersCount: 0,
      privacy: backend.privacidade === 'privado' ? 'private' : 'public',
      coverImage: this.normalizeUrl(backend.foto_capa || backend.coverImage || ''),
      username: backend.username || '',
      is_admin: !!backend.is_admin
    };
  }

  private loadUserFromLocalStorage() {
    const savedUser = this.auth.getUser();
    if (savedUser && savedUser.id) {
      this.userDataSubject.next(savedUser);
    }
  }

  getCurrentUser(): UserData | null {
    return this.userDataSubject.value;
  }

  setUser(user: UserData): void {
    this.userDataSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearUser(): void {
    this.userDataSubject.next(null);
    localStorage.removeItem('user');
  }

  updateUserData(updates: Partial<UserData>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      this.userDataSubject.next(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  async loadUserProfile(): Promise<UserData | null> {
    const token = this.auth.getToken();

    if (!token) {
      return this.getCurrentUser();
    }

    try {
      const url = `${this.apiUrl}/?route=user&action=obterPerfil`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.http.get(url, { headers })
      );

      let userData = null;
      if (response.success && response.data) {
        userData = response.data;
      } else if (response.user) {
        userData = response.user;
      }

      if (userData) {
        const fullUserData = this.mapUser(userData);
        this.userDataSubject.next(fullUserData);
        localStorage.setItem('user', JSON.stringify(fullUserData));
        return fullUserData;
      } else {
        const cached = this.getCurrentUser();
        if (cached) {
          return cached;
        }
        return null;
      }
    } catch (error) {
      const cached = this.getCurrentUser();
      if (cached) {
        return cached;
      }
      return null;
    }
  }

  async updateProfile(data: any): Promise<any> {
    const token = this.auth.getToken();

    if (!token) {
      return { success: false, message: 'Não autenticado' };
    }

    try {
      const url = `${this.apiUrl}/?route=user&action=editarPerfil`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const body: any = {};
      if (data.name) body.nome = data.name;
      if (data.bio) body.bio = data.bio;
      if (data.privacy) body.privacidade = data.privacy === 'private' ? 'privado' : 'publico';

      const response: any = await firstValueFrom(
        this.http.put(url, body, { headers })
      );

      if (response.success) {
        this.updateUserData(data);
      }

      return response;
    } catch (error) {
      return { success: false, message: 'Erro ao atualizar perfil' };
    }
  }

  async uploadAvatar(file: File): Promise<string | null> {
    const token = this.auth.getToken();
    if (!token) return null;

    const formData = new FormData();
    formData.append('foto', file);

    try {
      const url = `${this.apiUrl}/?route=upload&action=fotoPerfil`;
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      const response: any = await firstValueFrom(
        this.http.post(url, formData, { headers })
      );

      const avatarUrl = response.data?.url || response.data?.foto_perfil || response.data?.foto || response.url || response.foto_perfil || response.foto || null;
      if (avatarUrl) {
        const normalized = this.normalizeUrl(avatarUrl);
        this.updateUserData({ avatar: normalized });
        return normalized;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async uploadCover(file: File): Promise<string | null> {
    const token = this.auth.getToken();

    if (!token) {
      return null;
    }

    const formData = new FormData();
    formData.append('foto', file);

    try {
      const url = `${this.apiUrl}/?route=upload&action=fotoCapa`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.http.post(url, formData, { headers })
      );

      const coverUrl = response.data?.url || response.data?.foto_capa || response.url || response.foto_capa || null;
      if (coverUrl) {
        return this.normalizeUrl(coverUrl);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async loadUserProfileById(userId: string): Promise<UserData | null> {
    const token = this.auth.getToken();
    if (!token) return null;

    try {
      const url = `${this.apiUrl}/?route=user&action=obterPerfilDeUtilizador&id=${userId}`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.http.get(url, { headers })
      );

      if (response.success && response.data) {
        return this.mapUser(response.data);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async removeAvatar(): Promise<boolean> {
    const token = this.auth.getToken();
    if (!token) return false;

    try {
      const url = `${this.apiUrl}/?route=user&action=removerFotoPerfil`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.http.delete(url, { headers })
      );

      if (response.success) {
        this.updateUserData({ avatar: DEFAULT_AVATAR });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async searchUsers(query: string): Promise<any[]> {
    const token = this.auth.getToken();
    if (!token) return [];

    try {
      const url = `${this.apiUrl}/?route=user&action=pesquisarUtilizadores&q=${encodeURIComponent(query)}`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.http.get(url, { headers })
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data.map((u: any) => this.mapUser(u));
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  blockAccount(email: string): void {
    console.log('Conta bloqueada:', email);
  }
}
