import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../services/event.service';


@Component({
  selector: 'app-ticket-details',
  templateUrl: './ticket-details.component.html',
  styleUrls: ['./ticket-details.component.scss']
})
export class TicketDetailsComponent implements OnInit {
  event: any; // Adjust this to match your event model
  numberOfTickets: number = 1;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    
    private router: Router
  ) {}

  ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.eventService.getEventById(eventId).subscribe(eventData => {
        this.event = eventData;
      });
    } else {
      console.error('Event ID is null');
    }
  }

  initiatePurchase(): void {
    // Calculate total price based on number of tickets and event price
    const totalPrice = this.event.price * this.numberOfTickets;

    // Redirect to payment component with the necessary information
    this.router.navigate(['/payment'], {
      queryParams: {
        eventId: this.event.eventId,
        ticketQuantity: this.numberOfTickets,
        totalPrice: totalPrice
      }
    });
  }
}
