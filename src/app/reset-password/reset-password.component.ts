import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = '';
  resetToken: string = '';

  constructor(private userService: UserService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Extract the reset token from the URL
    // Add logic to extract the reset token from the URL query parameters
    this.resetToken = this.route.snapshot.queryParamMap.get('token') || '';
  }

  resetPassword() {
    if (!this.checkPasswordComplexity(this.newPassword)) {
      this.message = 'Password is too weak. It should include uppercase, lowercase letters, numbers, and special characters.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.message = 'Passwords do not match';
      return;
    }

    this.userService.resetPassword(this.resetToken, this.newPassword).subscribe(
      response => {
        this.message = 'Password has been reset successfully';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error => {
        this.message = 'Failed to reset password. Please try again.';
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
