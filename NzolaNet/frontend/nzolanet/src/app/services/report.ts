import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Auth } from './auth';

export interface ReportDTO {
  id: string;
  reporter_id: string;
  referencia_id: string;
  referencia_tipo: string;
  motivo: string;
  descricao?: string;
  status: string;
  resolvido_por?: string;
  criado_em: string;
  resolvido_em?: string;
  reporter_nome?: string;
  reporter_username?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = 'https://nzolanet-back.onrender.com';
  private reportsSubject = new BehaviorSubject<ReportDTO[]>([]);
  public reports$ = this.reportsSubject.asObservable();

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

  async create(reportData: {
    referencia_tipo: string;
    referencia_id: string;
    motivo: string;
    descricao?: string;
  }): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false, message: 'Não autenticado' };

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
      return { success: false, message: error.error?.message || 'Erro ao enviar denúncia' };
    }
  }

  async getAll(page = 1, limit = 20): Promise<ReportDTO[]> {
    const token = this.auth.getToken();
    if (!token) return [];

    try {
      const response: any = await firstValueFrom(
        this.http.get(
          `${this.apiUrl}/?route=report&action=listarReports&page=${page}&limit=${limit}`,
          { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) }
        )
      );

      if (response.success && Array.isArray(response.data)) {
        this.reportsSubject.next(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async resolve(reportId: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.put(
          `${this.apiUrl}/?route=admin&action=resolverReport`,
          { id: reportId, acao: 'apenas_resolver' },
          this.getHeaders()
        )
      );
      return response;
    } catch (error: any) {
      return { success: false };
    }
  }

  async ignore(reportId: string): Promise<any> {
    const token = this.auth.getToken();
    if (!token) return { success: false };

    try {
      const response: any = await firstValueFrom(
        this.http.put(
          `${this.apiUrl}/?route=admin&action=ignorarReport`,
          { id: reportId },
          this.getHeaders()
        )
      );
      return response;
    } catch (error: any) {
      return { success: false };
    }
  }

  getReports(): ReportDTO[] {
    return this.reportsSubject.value;
  }
}
