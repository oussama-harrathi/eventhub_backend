import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-email-verification',
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss']
})
export class EmailVerificationComponent implements OnInit {
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.verifyEmail(token);
    } else {
      this.message = 'Invalid verification link.';
    }
  }

  verifyEmail(token: string) {
    this.userService.verifyEmail(token).subscribe(
      response => {
        this.message = 'Your email has been successfully verified.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error => {
        this.message = 'Failed to verify email. The link may have expired or already been used.';
      }
    );
  }
}
