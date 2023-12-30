import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { TermsComponent } from './terms/terms.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { EmailVerificationComponent } from './email-verification/email-verification.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { EventDetailModalComponent } from './event-detail-modal/event-detail-modal.component';
import { TicketDetailsComponent } from './ticket-details/ticket-details.component';
import { AuthGuard } from './auth.guard';
import { PaymentComponent } from './payment/payment.component';
import { ManageEventsComponent } from './manage-events/manage-events.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' }, 
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'terms', component: TermsComponent },
  
  { path: 'login', component: LoginComponent },
  {path: 'signup', component:SignupComponent},
  { path: 'verify-email', component: EmailVerificationComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  {path: 'create-event', component:CreateEventComponent},
  {path: 'event-detail-modal', component:EventDetailModalComponent},
  { path: 'payment', component: PaymentComponent },
  { path: 'manage-events', component: ManageEventsComponent, canActivate: [AuthGuard] },
  
    
    { path: 'ticket-details/:id', component: TicketDetailsComponent, canActivate: [AuthGuard] },
    
   
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
