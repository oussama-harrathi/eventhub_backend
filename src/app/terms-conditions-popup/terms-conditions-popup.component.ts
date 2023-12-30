import { Component } from '@angular/core';


@Component({
  selector: 'app-terms-conditions-popup',
  templateUrl: './terms-conditions-popup.component.html',
  styleUrls: ['./terms-conditions-popup.component.scss']
})
export class TermsConditionsPopupComponent {
  showPopup = !localStorage.getItem('termsAccepted');

  acceptTerms() {
    localStorage.setItem('termsAccepted', 'true');
    this.showPopup = false;
  }
}
