import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl = 'https://nzolanet-back.onrender.com';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    console.log('🔐 Tentando login para:', email);
    
    const url = `${this.apiUrl}/?route=auth&action=login`;
    
    return this.http.post<any>(url, { email, password }).pipe(
      tap(response => {
        console.log('📦 Resposta completa do login:', response);
        
        if (response.success) {
          const token = response.token;
          const user = response.user;
          
          if (token) {
            localStorage.setItem('token', token);
            console.log('✅ Token salvo no localStorage');
          } else {
            console.error('❌ Token não encontrado');
          }
          
          if (user) {
            // CORREÇÃO: Garantir que todos os campos necessários existam
            const userData: any = {
              id: user.id?.toString() || user.user_id?.toString() || Date.now().toString(),
              name: user.name || user.username || email.split('@')[0],
              email: user.email || email,
              handle: user.handle || `@${(user.name || email.split('@')[0]).toLowerCase().replace(/\s/g, '')}`,
              avatar: user.avatar || user.profile_picture || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70),
              bio: user.bio || user.biography || '',
              location: user.location || user.city || '',
              joinedDate: user.created_at || user.joinedDate || new Date().toLocaleDateString('pt-PT'),
              postsCount: user.postsCount || user.total_posts || 0,
              amigosCount: user.amigosCount || user.following_count || 0,
              followersCount: user.followersCount || user.followers_count || 0,
              privacy: user.privacy || user.profile_privacy || 'public',
              coverImage: user.coverImage || user.cover_image || '',
              isAdmin: user.is_admin === true || user.isAdmin === true || user.is_admin === 1,
              is_admin: user.is_admin === true || user.isAdmin === true || user.is_admin === 1
            };

            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ User salvo no localStorage:', userData.name);
            console.log('✅ User ID:', userData.id);
            console.log('✅ User admin flag:', userData.is_admin);
          } else {
            console.error('❌ User não encontrado na resposta');
          }
        } else {
          console.error('❌ Login falhou:', response.message);
        }
      })
    );
  }

  register(data: any): Observable<any> {
    const url = `${this.apiUrl}/?route=auth&action=registar`;
    return this.http.post<any>(url, data).pipe(
      tap(response => {
        console.log('📦 Resposta do registro:', response);
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
          if (response.user) {
            const userData = {
              id: response.user.id?.toString() || Date.now().toString(),
              name: response.user.name || data.name,
              email: response.user.email || data.email,
              handle: response.user.handle || `@${(data.name || '').toLowerCase().replace(/\s/g, '')}`,
              avatar: response.user.avatar || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70),
              bio: response.user.bio || '',
              location: response.user.location || '',
              joinedDate: new Date().toLocaleDateString('pt-PT'),
              postsCount: 0,
              amigosCount: 0,
              followersCount: 0,
              privacy: 'public',
              coverImage: ''
            };
            localStorage.setItem('user', JSON.stringify(userData));
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
    return localStorage.getItem('token');
  }

  getUser(): any {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // CORREÇÃO: Verificar se o user tem ID
        if (!user.id) {
          console.warn('⚠️ User sem ID no localStorage');
          user.id = Date.now().toString();
          localStorage.setItem('user', JSON.stringify(user));
        }
        return user;
      } catch (e) {
        console.error('❌ Erro ao parsear user do localStorage:', e);
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
    const isValid = token !== null && token.length > 0 && user !== null;
    
    if (!isValid && token) {
      // Se tem token mas não tem user, limpar
      this.logout();
    }
    
    return isValid;
  }

  // CORREÇÃO: Método para atualizar os dados do usuário no localStorage
  updateUserData(updates: Partial<any>): void {
    const currentUser = this.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('📦 User atualizado no localStorage:', updatedUser.name);
    }
  }

  logout(): void {
    console.log('🚪 Fazendo logout...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userCoverImage');
    localStorage.removeItem('privacySettings');
    localStorage.removeItem('followingUsers');
    localStorage.removeItem('followersUsers');
    localStorage.removeItem('savedPostsIds');
    // Limpar também outros itens que podem estar causando conflitos
    localStorage.removeItem('currentUser');
    console.log('✅ Logout completo');
  }
}