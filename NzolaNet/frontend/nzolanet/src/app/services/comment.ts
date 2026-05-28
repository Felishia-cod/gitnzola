import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Auth } from './auth';

export interface CommentDTO {
  id: string;
  user_id: string;
  post_id: string;
  conteudo: string;
  eliminado: boolean;
  removido_por_admin: boolean;
  criado_em: string;
  atualizado_em: string;
  autor_nome?: string;
  autor_username?: string;
  autor_foto_perfil?: string;
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private apiUrl = 'https://nzolanet-back.onrender.com';

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {}

  private getHeaders() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  async getByPost(postId: string, page = 1, limit = 50): Promise<CommentDTO[]> {
    const token = this.auth.getToken();
    if (!token) return [];

    try {
      const response: any = await firstValueFrom(
        this.http.get(
          `${this.apiUrl}/?route=comment&action=getByPost&post_id=${postId}&page=${page}&limit=${limit}`,
          { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
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

  async create(postId: string, conteudo: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.post(
          `${this.apiUrl}/?route=comment&action=create`,
          { post_id: postId, conteudo },
          this.getHeaders()
        )
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.error?.message || 'Erro ao criar comentário' };
    }
  }

  async update(commentId: string, conteudo: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.put(
          `${this.apiUrl}/?route=comment&action=update`,
          { id: commentId, conteudo },
          this.getHeaders()
        )
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.error?.message || 'Erro ao atualizar comentário' };
    }
  }

  async delete(commentId: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.delete(
          `${this.apiUrl}/?route=comment&action=delete&id=${commentId}`,
          { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
        )
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.error?.message || 'Erro ao eliminar comentário' };
    }
  }
}
