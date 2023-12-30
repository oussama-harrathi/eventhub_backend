import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsConditionsPopupComponent } from './terms-conditions-popup.component';

describe('TermsConditionsPopupComponent', () => {
  let component: TermsConditionsPopupComponent;
  let fixture: ComponentFixture<TermsConditionsPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsConditionsPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TermsConditionsPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
