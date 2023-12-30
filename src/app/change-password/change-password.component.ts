import { Component } from '@angular/core';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = '';

  constructor(private userService: UserService, private router: Router) {}

  changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.message = 'New passwords do not match';
      return;
    }

    if (!this.checkPasswordComplexity(this.newPassword)) {
      this.message = 'Password is too weak. It should include uppercase, lowercase letters, numbers, and special characters.';
      return;
    }

    this.userService.changePassword(this.oldPassword, this.newPassword).subscribe(
      response => {
        this.message = 'Password changed successfully';
        setTimeout(() => this.router.navigate(['/login']), 2000);
        this.userService.logout();
      },
      error => {
        this.message = 'Failed to change password';
      }
    );
  }

  private checkPasswordComplexity(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }
}


