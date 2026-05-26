
// src/app/services/report.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Report {
  id: string;
  reporter_id: string;
  reporter_name: string;
  referencia_tipo: 'post' | 'comment';
  referencia_id: number;
  motivo: string;
  descricao: string;
  status: 'pendente' | 'resolvido' | 'ignorado';
  criado_em: string;
  alvo_nome?: string;
  alvo_conteudo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private reportsSubject = new BehaviorSubject<Report[]>([]);
  reports$ = this.reportsSubject.asObservable();

  constructor() {
    this.loadInitialReports();
  }

  private loadInitialReports() {
    const initialReports: Report[] = [];
    this.reportsSubject.next(initialReports);
  }

  addReport(report: Omit<Report, 'id' | 'criado_em' | 'status'>) {
    const currentReports = this.reportsSubject.value;
    const newReport: Report = {
      ...report,
      id: Date.now().toString(),
      criado_em: new Date().toISOString(),
      status: 'pendente'
    };
    this.reportsSubject.next([newReport, ...currentReports]);
    return newReport;
  }

  getReports(): Report[] {
    return this.reportsSubject.value;
  }

  getPendingReports(): Report[] {
    return this.reportsSubject.value.filter(r => r.status === 'pendente');
  }

  resolveReport(reportId: string, status: 'resolvido' | 'ignorado') {
    const currentReports = this.reportsSubject.value;
    const index = currentReports.findIndex(r => r.id === reportId);
    if (index !== -1) {
      currentReports[index].status = status;
      this.reportsSubject.next([...currentReports]);
    }
  }
}