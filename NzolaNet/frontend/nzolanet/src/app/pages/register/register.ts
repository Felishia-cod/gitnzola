import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  RouterLink,
  Router
} from '@angular/router';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {

  name: string = '';
  handle: string = '';
  email: string = '';
  password: string = '';
  confirm: string = '';
  accept: boolean = false;
  genero: string = '';
  dataNascimento: string = '';

  err: string | null = null;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private auth: Auth
  ) {}

  // Validar data de nascimento
  validarDataNascimento(data: string): { valida: boolean; idade: number; mensagem: string } {
    if (!data) {
      return { valida: false, idade: 0, mensagem: 'Seleccione a sua data de nascimento.' };
    }

    const partes = data.split('-');
    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const dia = parseInt(partes[2], 10);

    const hoje = new Date();
    const dataNasc = new Date(ano, mes - 1, dia);

    // Verifica se é data futura
    if (dataNasc > hoje) {
      return { valida: false, idade: 0, mensagem: 'A data de nascimento não pode ser no futuro.' };
    }

    // Calcula idade
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    const mesDiff = hoje.getMonth() - dataNasc.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < dataNasc.getDate())) {
      idade--;
    }

    if (idade < 18) {
      return { valida: false, idade: idade, mensagem: `Tens ${idade} anos. É necessário ter pelo menos 18 anos.` };
    }

    return { valida: true, idade: idade, mensagem: '' };
  }

  submit() {

    this.err = null;

    // Validação da data de nascimento
    const validacaoData = this.validarDataNascimento(this.dataNascimento);
    if (!validacaoData.valida) {
      this.err = validacaoData.mensagem;
      return;
    }

    // Verifica género
    if (!this.genero) {
      this.err = 'Seleccione o seu género.';
      return;
    }

    // verifica passwords
    if (this.password !== this.confirm) {
      this.err = 'As palavras-passe não coincidem.';
      return;
    }

    // verifica termos
    if (!this.accept) {
      this.err = 'Aceite os termos.';
      return;
    }

    this.isLoading = true;

    // username sem @
    const username = this.handle.replace('@', '');

    // Data já está no formato YYYY-MM-DD
    const dataFormatada = this.dataNascimento;

    // chama backend
    this.auth.register({

      nome: this.name,
      username: username,
      email: this.email,
      password: this.password,
      genero: this.genero,
      data_nascimento: dataFormatada

    }).subscribe({

      next: (response) => {

        console.log(response);
        this.isLoading = false;

        if (response.success) {
          alert('Conta criada com sucesso');
          this.router.navigate(['/login']);
        } else {
          this.err = response.message;
        }

      },

      error: (error) => {
        console.log(error);
        this.isLoading = false;
        this.err = 'Erro ao registrar';
      }

    });

  }
}