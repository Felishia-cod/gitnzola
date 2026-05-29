import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Auth } from './auth';

export interface FollowDTO {
  id: string;
  seguidor_id: string;
  seguido_id: string;
  status: string;
  criado_em: string;
  seguidor_nome?: string;
  seguidor_username?: string;
  seguidor_foto_perfil?: string;
  seguido_nome?: string;
  seguido_username?: string;
  seguido_foto_perfil?: string;
}

@Injectable({ providedIn: 'root' })
export class FollowService {
  private apiUrl = 'https://nzolanet-back.onrender.com';

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {}

  private headers() {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  async follow(seguidoId: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/?route=follow&action=follow`,
          { seguido_id: seguidoId },
          { headers: this.headers() }
        )
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.error?.message || 'Erro ao seguir' };
    }
  }

  async unfollow(seguidoId: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.delete(
          `${this.apiUrl}/?route=follow&action=unfollow&seguido_id=${seguidoId}`,
          { headers: this.headers() }
        )
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.error?.message || 'Erro ao deixar de seguir' };
    }
  }

  async isFollowing(seguidoId: string): Promise<boolean> {
    const token = this.auth.getToken();
    if (!token) return false;

    try {
      const response: any = await firstValueFrom(
        this.http.get(
          `${this.apiUrl}/?route=follow&action=isFollowing&seguido_id=${seguidoId}`,
          { headers: this.headers() }
        )
      );
      return response.success && (response.data?.is_following === true || response.data?.isFollowing === true);
    } catch (error) {
      return false;
    }
  }

  async getFollowers(userId?: string): Promise<FollowDTO[]> {
    const token = this.auth.getToken();
    if (!token) return [];

    try {
      let url = `${this.apiUrl}/?route=follow&action=followers`;
      if (userId) url += `&user_id=${userId}`;

      const response: any = await firstValueFrom(
        this.http.get(url, { headers: this.headers() })
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async getFollowing(userId?: string): Promise<FollowDTO[]> {
    const token = this.auth.getToken();
    if (!token) return [];

    try {
      let url = `${this.apiUrl}/?route=follow&action=following`;
      if (userId) url += `&user_id=${userId}`;

      const response: any = await firstValueFrom(
        this.http.get(url, { headers: this.headers() })
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async getPedidosPendentes(): Promise<FollowDTO[]> {
    const token = this.auth.getToken();
    if (!token) return [];

    try {
      const response: any = await firstValueFrom(
        this.http.get(
          `${this.apiUrl}/?route=follow&action=pedidosPendentes`,
          { headers: this.headers() }
        )
      );

      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async aceitar(seguidorId: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.put(
          `${this.apiUrl}/?route=follow&action=aceitar`,
          { seguidor_id: seguidorId },
          { headers: this.headers() }
        )
      );
      return response;
    } catch (error: any) {
      return { success: false };
    }
  }

  async rejeitar(seguidorId: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.delete(
          `${this.apiUrl}/?route=follow&action=rejeitar`,
          { headers: this.headers(), body: { seguidor_id: seguidorId } }
        )
      );
      return response;
    } catch (error: any) {
      return { success: false };
    }
  }
}
