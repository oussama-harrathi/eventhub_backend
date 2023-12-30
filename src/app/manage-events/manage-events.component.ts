import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-manage-events',
  templateUrl: './manage-events.component.html',
  styleUrls: ['./manage-events.component.scss']
})
export class ManageEventsComponent implements OnInit {
  eventsCreatedByUser: any[] = [];

  constructor(private eventService: EventService, private http: HttpClient) {}

  ngOnInit(): void {
    this.eventService.getEventsCreatedByUser().subscribe(events => {
      console.log('Number of events:', events.length);
      this.eventsCreatedByUser = events.map(event => ({
        ...event,
        paypalEmail: '' // Initialize an empty string for PayPal email
      }));
    }, error => {
      console.error('Error fetching events:', error);
    });
  }

  canWithdraw(eventDate: string): boolean {
    console.log('Raw event date:', eventDate);
    if (!eventDate) {
      console.log('Event date is undefined or null.');
      return false;
    }
  
    // Parse the ISO 8601 date string to a Date object
    const eventDateObject = new Date(eventDate);
    console.log('Parsed event date:', eventDateObject);
  
    // Calculate three days after the event date
    const threeDaysAfterEvent = eventDateObject.getTime() + 3 * 24 * 60 * 60 * 1000;
  
    // Check if the current date and time is equal to or past three days after the event
    const canWithdraw = Date.now() >= threeDaysAfterEvent;
    console.log('Can withdraw:', canWithdraw);
    return canWithdraw;
  }
  

  initiatePayout(event: any): void {
    if (!event.paypalEmail) {
      alert('Please enter your PayPal email.');
      return;
    }

    const payoutData = {
      amount: event.totalEarnings,
      receiver: event.paypalEmail
    };

    this.eventService.createPayout(payoutData).subscribe(
      (response) => {
        console.log('Payout successful', response);
        alert('Payout successful!');
      },
      (error) => {
        console.error('Payout failed', error);
        alert('Payout failed. Please try again.');
      }
    );
  }
}
