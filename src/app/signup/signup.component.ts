import { Component } from '@angular/core';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';


// Define an interface for the response
interface RegistrationResponse {
  message: string;
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  userData = {
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    google_uid: '',
  };

  registrationError = '';
  registrationSuccess = '';

  constructor(private afAuth: AngularFireAuth ,private userService: UserService, private router: Router, library: FaIconLibrary) {library.addIcons(faGoogle);}

  registerUser() {
    this.registrationError = '';
    this.registrationSuccess = '';

    // Check password complexity
    if (!this.checkPasswordComplexity(this.userData.password)) {
      this.registrationError = 'Password is too weak. It should include uppercase, lowercase letters, numbers, and special characters.';
      return;
    }

    this.userService.registerUser(this.userData).subscribe(
      (response) => {
        const typedResponse = response as RegistrationResponse;
        this.registrationSuccess = typedResponse.message;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      (error) => {
        this.registrationError = error.error.message;
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
  signInWithGoogle() {
    this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(result => {
        // Check if user data exists
        if (result.user) {
          // Extract user info from result
          const userData = {
            full_name: result.user.displayName,
            email: result.user.email,
            google_uid: result.user.uid
          };
          

          // Send the user data to your backend
          this.userService.registerGoogleUser(userData).subscribe(response => {
            // Handle response, e.g., navigate to a dashboard
            this.userService.setLoggedInWithGoogle(true);
            this.router.navigate(['/home']);
          });
        } else {
          // Handle the case where result.user is null
          console.error('User data is null');
        }
        
      })
      .catch(error => {
        // Handle errors
        console.error('Google Sign-In error:', error);
      });
  }
}
