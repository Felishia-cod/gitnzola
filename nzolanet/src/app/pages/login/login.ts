import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { UserService } from '../../services/user';
import { PostService } from '../../services/post';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {

  loginForm: FormGroup;
  isLoading = false;
  currentUser: any = null;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private userService: UserService,
    private postService: PostService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    
    // Se já estiver logado, redirecionar
    if (this.auth.isAuthenticated()) {
      const user = this.auth.getUser();
      if (user?.is_admin) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/feed']);
      }
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.auth.login(email, password).subscribe({
      next: async (response) => {
        console.log('Resposta do login:', JSON.stringify(response).substring(0, 300));
        this.isLoading = false;

        if (response.success) {
          this.currentUser = response.data?.user;
          const user = this.auth.getUser();
          if (user) {
            this.userService.setUser(user);
          }
          await this.postService.refreshPosts();
          alert('Login efetuado com sucesso!');
          if (user?.is_admin) {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/feed']);
          }
        } else {
          alert(response.message || 'Erro ao fazer login');
        }
      },
      error: (error) => {
        console.error('Erro no login:', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          alert('Email ou senha incorretos');
        } else {
          alert('Erro ao conectar com o servidor. Tente novamente.');
        }
      }
    });
  }
}