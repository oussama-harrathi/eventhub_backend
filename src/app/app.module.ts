import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { HomeComponent } from './home/home.component';
import { FooterComponent } from './footer/footer.component';
import { AboutComponent } from './about/about.component';
import { TermsComponent } from './terms/terms.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { AngularFireModule } from '@angular/fire/compat';
import { EmailVerificationComponent } from './email-verification/email-verification.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { EventDetailModalComponent } from './event-detail-modal/event-detail-modal.component';
import { TicketDetailsComponent } from './ticket-details/ticket-details.component';
import { AuthGuard } from './auth.guard';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentComponent } from './payment/payment.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ManageEventsComponent } from './manage-events/manage-events.component';
import { provideNgxStripe } from 'ngx-stripe';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxStripeModule } from 'ngx-stripe';
import { TermsConditionsPopupComponent } from './terms-conditions-popup/terms-conditions-popup.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';


export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/languages/', '.json');
}


const firebaseConfig = {
  apiKey: "AIzaSyBc8fx6cPTtHu33uh5diCniDuzXh_tfuQA",
  authDomain: "eventhub-404818.firebaseapp.com",
  databaseURL: "https://eventhub-404818-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "eventhub-404818",
  storageBucket: "eventhub-404818.appspot.com",
  messagingSenderId: "1015325567556",
  appId: "1:1015325567556:web:633b631b7bf0a9d061aa11",
  measurementId: "G-B678HCN0G1"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    FooterComponent,
    AboutComponent,
    TermsComponent,
    LoginComponent,
    SignupComponent,
    EmailVerificationComponent,
    ResetPasswordComponent,
    ChangePasswordComponent,
    CreateEventComponent,
    EventDetailModalComponent,
    TicketDetailsComponent,
    PaymentComponent,
    ManageEventsComponent,
    TermsConditionsPopupComponent,
    
    
    
  
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule,
    BrowserAnimationsModule,
    MatMenuModule,
    HttpClientModule,
    FormsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    MatSnackBarModule,
    MatTooltipModule,
    PickerComponent,
    CommonModule,
    ReactiveFormsModule,
    NgxStripeModule.forRoot('pk_test_51OPotvDshEHShaBlxa62BmKpjPTOCm3zL8nuEEUbvfkWCtkXHV4zcaY8EfJ1NF8rDHq3MH65r18OVxpJg3XpSCVy00FbgmhEMv'),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
    
    
    
  ],
  providers: [AuthGuard,provideNgxStripe()],
  bootstrap: [AppComponent]
})
export class AppModule { }
