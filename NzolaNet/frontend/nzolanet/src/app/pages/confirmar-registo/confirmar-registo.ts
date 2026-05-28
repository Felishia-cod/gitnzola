import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-confirmar-registo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmar-registo.html',
  styleUrls: ['./confirmar-registo.scss']
})
export class ConfirmarRegistoComponent implements OnInit, OnDestroy {
  countdown: number = 10;
  private interval: any;
  email: string = '';
  jaVerificado: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Verificar se veio com parâmetro de já verificado
    this.route.queryParams.subscribe(params => {
      this.jaVerificado = params['ja_verificado'] === '1';
      
      // Se a conta já estava verificada, redirecionar mais rápido
      if (this.jaVerificado) {
        this.countdown = 3;
      }
    });
    
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  startCountdown() {
    this.interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.interval);
        this.goToLogin();
      }
    }, 1000);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}