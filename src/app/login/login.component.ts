import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../services/user.service'; // Import UserService
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { MessageService } from '../services/message.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  showResetForm = false;
  resetEmail = '';
  resetMessage = '';
  showPassword: boolean = false;
  message='';

  constructor(private http: HttpClient, private messageService: MessageService , private userService: UserService, private router: Router, private afAuth: AngularFireAuth, library: FaIconLibrary) {library.addIcons(faGoogle);library.addIcons(faEye, faEyeSlash);} // Inject UserService

  ngOnInit() {
    this.message = this.messageService.getMessage();
    this.messageService.clearMessage(); // Clear the message after displaying it
  }
  
  login() {
    this.userService.login(this.email, this.password).subscribe(
      response => {
        console.log(response);
        
        // Check for the returnUrl and navigate accordingly
        const returnUrl = this.router.getCurrentNavigation()?.extras.state?.['returnUrl'] || '/home';
        this.router.navigateByUrl(returnUrl);
      },
      error => {
        this.handleLoginError(error);
      }
    );
  }
  private handleLoginError(error: any) {
    console.error(error);
    if (error.status === 401) {
        this.errorMessage = 'Invalid email or password';
    } else if (error.status === 500) {
        this.errorMessage = 'Server error. Please try again later.';
    } else {
        this.errorMessage = 'An unexpected error occurred.';
    }
  }
  signInWithGoogle() {
    this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(result => {
        if (result.user) {
          const userData = {
            full_name: result.user.displayName,
            email: result.user.email,
            google_uid: result.user.uid,
          };
  
          this.userService.registerGoogleUser(userData).subscribe(
            response => {
              // Update authentication status
              this.userService.updateAuthenticationStatus(true);
              this.userService.setLoggedInWithGoogle(true);
  
              // Redirect based on returnUrl or to the default home page
              const returnUrl = this.router.getCurrentNavigation()?.extras.state?.['returnUrl'] || '/home';
              this.router.navigateByUrl(returnUrl);
            },
            error => {
              console.error('Error during Google login:', error);
              // Handle errors here, e.g., display a message
            }
          );
        } else {
          console.error('User data is null');
          // Handle null user data case
        }
      })
      .catch(error => {
        console.error('Google Sign-In error:', error);
        // Handle sign-in errors here
      });
  }
  
  requestResetPassword() {
    this.userService.requestResetPassword(this.resetEmail).subscribe(
      response => {
        this.resetMessage = 'If your email is registered, you will receive a password reset link.';
        this.showResetForm = false;
        // Optionally, hide the form and display a confirmation message
      },
      error => {
        console.error('Error requesting password reset:', error);
        this.resetMessage = 'Error requesting password reset.';
      }
    );
  }
  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }
  
}

