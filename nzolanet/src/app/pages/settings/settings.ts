// settings.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService, UserData } from '../../services/user';
import { Auth } from '../../services/auth';

interface PrivacySettings {
  profileVisibility: 'publico' | 'privado';
  showEmail: boolean;
  searchableByEmail: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.scss']
})
export class SettingsComponent implements OnInit {
  currentEmail: string = '';
  isAuthenticated: boolean = true;

  privacy: PrivacySettings = {
    profileVisibility: 'publico',
    showEmail: true,
    searchableByEmail: true
  };

  showTermosModal: boolean = false;
  showPrivacidadeModal: boolean = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private auth: Auth
  ) {}

  ngOnInit() {
    const userData = this.userService.getCurrentUser();
    if (userData) {
      this.currentEmail = userData.email;
    }
    
    const savedPrivacy = localStorage.getItem('privacySettings');
    if (savedPrivacy) {
      this.privacy = JSON.parse(savedPrivacy);
      
      const userData2 = this.userService.getCurrentUser();
      if (userData2) {
        this.userService.updateUserData({
          privacy: this.privacy.profileVisibility === 'publico' ? 'public' : 'private'
        });
      }
    } else {
      const userData3 = this.userService.getCurrentUser();
      if (userData3) {
        this.userService.updateUserData({
          privacy: 'public'
        });
      }
    }
  }

  async updatePrivacy() {
    localStorage.setItem('privacySettings', JSON.stringify(this.privacy));

    const userData = this.userService.getCurrentUser();
    if (userData) {
      const privacy = this.privacy.profileVisibility === 'publico' ? 'public' : 'private';
      this.userService.updateUserData({ privacy });
      await this.userService.updateProfile({ privacy });
    }

    console.log('Configurações guardadas:', this.privacy);
  }

  openTermosModal() {
    this.showTermosModal = true;
  }

  closeTermosModal() {
    this.showTermosModal = false;
  }

  closeTermosModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeTermosModal();
    }
  }

  openPrivacidadeModal() {
    this.showPrivacidadeModal = true;
  }

  closePrivacidadeModal() {
    this.showPrivacidadeModal = false;
  }

  closePrivacidadeModalOnBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closePrivacidadeModal();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}