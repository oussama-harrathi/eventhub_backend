import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { EventService } from '../services/event.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  @ViewChild('cardElement') cardElementRef!: ElementRef;
  private stripe!: Stripe;
  private card!: StripeCardElement;
  public amount: number = 0;
  public eventId: string = '';
  public ticketQuantity: number = 0;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.amount = params['totalPrice'];
      this.eventId = params['eventId'];
      this.ticketQuantity = params['ticketQuantity'];
    });

    const stripe = await loadStripe('pk_test_51OPotvDshEHShaBlxa62BmKpjPTOCm3zL8nuEEUbvfkWCtkXHV4zcaY8EfJ1NF8rDHq3MH65r18OVxpJg3XpSCVy00FbgmhEMv');
    if (stripe) {
      this.stripe = stripe;
      const elements = stripe.elements();
      const style = {
        base: {
          color: "#32325d",
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: "antialiased",
          fontSize: "16px",
          "::placeholder": {
            color: "#aab7c4"
          },
          margin: '0 0 20px 0' // Add space below each input
        },
        invalid: {
          color: "#fa755a",
          iconColor: "#fa755a"
        }
      };
      this.card = elements.create('card', { style: style });
      this.card.mount(this.cardElementRef.nativeElement);
    } else {
      console.error("Stripe failed to initialize");
      // Handle Stripe initialization failure
    }
  }

  async handlePayment() {
    try {
      this.eventService.createPaymentIntent(this.amount).subscribe({
        next: (data) => {
          this.confirmPaymentWithStripe(data.clientSecret);
        },
        error: (error) => {
          console.error('Error creating payment intent:', error);
          this.showError('Error processing payment. Please try again.');
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      this.showError('Payment failed. Please try again.');
    }
  }

  private async confirmPaymentWithStripe(clientSecret: string) {
    const result = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: this.card,
        billing_details: {
          // Include any required billing details here
        }
      }
    });

    if (result.error) {
      console.error(result.error.message);
      this.showError('Your card number is not valid');
    } else {
      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded!');
        this.purchaseTickets();
      }
    }
  }

  private purchaseTickets() {
    const ticketData = {
      eventId: this.eventId,
      ticketQuantity: this.ticketQuantity
    };
  
    this.eventService.purchaseTickets(ticketData).subscribe({
      next: (response) => {
        console.log('Tickets purchased successfully');
        this.showSuccess('Payment successful! Please check your email for the tickets.');
        setTimeout(() => {
          this.router.navigate(['/home']); // Navigate to home after 5 seconds
        }, 5000);
      },
      error: (error) => {
        console.error('Error purchasing tickets:', error);
        let errorMessage = 'Failed to purchase tickets. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message; // Use the backend-provided error message
        }
        this.showError(errorMessage);
      }
    });
  }

  showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000 // Duration in milliseconds after which the snackbar will be dismissed
    });
  }

  showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000 // Duration in milliseconds after which the snackbar will be dismissed
    });
  }
}
