import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
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
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://nzolanet-back.onrender.com';
  private userDataSubject = new BehaviorSubject<UserData | null>(null);
  public userData$ = this.userDataSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {
    this.loadUserFromLocalStorage();
  }

  private loadUserFromLocalStorage() {
    const savedUser = this.auth.getUser();
    if (savedUser && savedUser.id) {
      console.log('📦 Usuário carregado do localStorage:', savedUser.name);
      this.userDataSubject.next(savedUser);
    }
  }

  getCurrentUser(): UserData | null {
    return this.userDataSubject.value;
  }

  updateUserData(updates: Partial<UserData>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      this.userDataSubject.next(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('📦 UserData atualizado:', updatedUser);
    }
  }

  async loadUserProfile(): Promise<UserData | null> {
    const token = this.auth.getToken();
    
    if (!token) {
      console.error('❌ Sem token para carregar perfil');
      return this.getCurrentUser();
    }

    try {
      // CORREÇÃO: Usar 'obterPerfil' em vez de 'perfil' (conforme backend)
      const url = `${this.apiUrl}/?route=user&action=obterPerfil`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.http.get(url, { headers })
      );
      
      console.log('📦 Resposta do perfil:', response);

      // Verificar diferentes formatos de resposta
      let userData = null;
      
      if (response.success && response.data?.user) {
        userData = response.data.user;
      } else if (response.success && response.user) {
        userData = response.user;
      } else if (response.user) {
        userData = response.user;
      } else if (response.data) {
        userData = response.data;
      }
      
      if (userData) {
        const fullUserData: UserData = {
          id: userData.id?.toString() || Date.now().toString(),
          name: userData.name || userData.username || '',
          email: userData.email || '',
          handle: userData.handle || '@' + (userData.name || '').toLowerCase().replace(/\s/g, ''),
          avatar: userData.avatar || 'https://i.pravatar.cc/150?img=1',
          bio: userData.bio || '',
          location: userData.location || '',
          joinedDate: userData.created_at || new Date().toLocaleDateString('pt-PT'),
          postsCount: userData.postsCount || 0,
          amigosCount: userData.amigosCount || 0,
          followersCount: userData.followersCount || 0,
          privacy: userData.privacy || 'public'
        };
        
        this.userDataSubject.next(fullUserData);
        localStorage.setItem('user', JSON.stringify(fullUserData));
        console.log('✅ Perfil carregado:', fullUserData.name);
        return fullUserData;
      } else {
        console.error('❌ Erro ao carregar perfil:', response);
        const cached = this.getCurrentUser();
        if (cached) {
          console.log('📦 Usando dados do localStorage como fallback');
          return cached;
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Erro na requisição do perfil:', error);
      const cached = this.getCurrentUser();
      if (cached) {
        console.log('📦 Usando dados do localStorage após erro');
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
      // CORREÇÃO: Usar 'editarPerfil' em vez de 'atualizar' (conforme backend)
      const url = `${this.apiUrl}/?route=user&action=editarPerfil`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      // Mapear campos para o que o backend espera
      const body: any = {};
      if (data.name) body.nome = data.name;
      if (data.bio) body.bio = data.bio;
      if (data.location) body.localizacao = data.location;
      if (data.privacy) body.privacidade = data.privacy;

      const response: any = await firstValueFrom(
        this.http.put(url, body, { headers })
      );

      console.log('📦 Perfil atualizado:', response);

      if (response.success) {
        this.updateUserData(data);
      }

      return response;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      return { success: false, message: 'Erro ao atualizar perfil' };
    }
  }

  async uploadAvatar(file: File): Promise<string | null> {
    const token = this.auth.getToken();
    
    if (!token) {
      return null;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const url = `${this.apiUrl}/?route=media&action=upload`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.http.post(url, formData, { headers })
      );

      if (response.success && response.data?.url) {
        this.updateUserData({ avatar: response.data.url });
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao upload avatar:', error);
      return null;
    }
  }

  async uploadCover(file: File): Promise<string | null> {
    const token = this.auth.getToken();
    
    if (!token) {
      return null;
    }

    const formData = new FormData();
    formData.append('cover', file);

    try {
      const url = `${this.apiUrl}/?route=media&action=uploadCover`;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });

      const response: any = await firstValueFrom(
        this.http.post(url, formData, { headers })
      );

      if (response.success && response.data?.url) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao upload capa:', error);
      return null;
    }
  }

  blockAccount(email: string): void {
    console.log('Conta bloqueada:', email);
  }
}