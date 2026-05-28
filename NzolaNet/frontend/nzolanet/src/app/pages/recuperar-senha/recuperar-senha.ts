import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-recuperar-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-senha.html',
  styleUrls: ['./recuperar-senha.scss']
})
export class RecuperarSenhaComponent implements OnInit {
  step: 1 | 2 = 1;
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  token: string = '';
  msg: string | null = null;
  err: string | null = null;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: Auth
  ) {}

  ngOnInit() {
    // Pega o token da URL (ex: /recuperar-senha/TOKEN)
    this.route.params.subscribe(params => {
      console.log('Token da URL:', params['token']);
      if (params['token']) {
        this.token = params['token'];
        this.step = 2;
      }
    });
  }

  // Passo 1: Enviar email para recuperação
  sendResetEmail() {
    if (!this.email) {
      this.err = 'Por favor, insira o email';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.err = 'Por favor, insira um email válido';
      return;
    }

    this.isLoading = true;
    this.err = null;
    this.msg = null;

    this.authService.esqueceuSenha(this.email).subscribe({
      next: (response: any) => {
        console.log('Resposta do servidor:', response);
        
        // O backend retorna { success: true, message: "..." }
        if (response.success === true) {
          this.msg = response.message || `Email de recuperação enviado! Verifique sua caixa de entrada.`;
          // Redireciona para o login após 3 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.err = response.message || 'Erro ao enviar email de recuperação';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro na requisição:', error);
        this.err = error.error?.message || 'Erro ao conectar com o servidor';
        this.isLoading = false;
      }
    });
  }

  // Passo 2: Redefinir senha com o token da URL
  resetPassword() {
    // Validações
    if (!this.password) {
      this.err = 'Por favor, insira a nova palavra-passe';
      return;
    }
    
    if (!this.confirmPassword) {
      this.err = 'Por favor, confirme a palavra-passe';
      return;
    }

    if (this.password.length < 6) {
      this.err = 'A palavra-passe deve ter pelo menos 6 caracteres';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.err = 'As palavras-passe não coincidem';
      return;
    }

    if (!this.token) {
      this.err = 'Token inválido. Solicite uma nova recuperação.';
      return;
    }

    this.isLoading = true;
    this.err = null;
    this.msg = null;

    console.log('Enviando token:', this.token);
    console.log('Enviando nova senha:', this.password);

    this.authService.redefinirSenha(this.token, this.password).subscribe({
      next: (response: any) => {
        console.log('Resposta do servidor:', response);
        
        // O backend retorna { success: false, message: "Token inválido..." }
        if (response.success === true) {
          this.msg = response.message || 'Palavra-passe redefinida com sucesso!';
          this.isLoading = false;
          
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          // Se o token for inválido (success === false)
          this.err = response.message || 'Token inválido ou expirado. Solicite uma nova recuperação.';
          this.isLoading = false;
          
          // Opcional: Voltar para o passo 1 após 3 segundos se token inválido
          setTimeout(() => {
            this.step = 1;
            this.token = '';
          }, 3000);
        }
      },
      error: (error) => {
        console.error('Erro na requisição:', error);
        this.err = error.error?.message || 'Token inválido ou expirado. Solicite uma nova recuperação.';
        this.isLoading = false;
        
        // Voltar para o passo 1 em caso de erro
        setTimeout(() => {
          this.step = 1;
          this.token = '';
        }, 3000);
      }
    });
  }

  // Métodos chamados pelo template
  askCode() {
    this.sendResetEmail();
  }

  reset() {
    this.resetPassword();
  }
}