import { Component, OnInit } from '@angular/core';
import { EventService } from '../services/event.service';
import { Subscription } from 'rxjs';
import { faDollarSign, faTicketAlt } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  faDollarSign = faDollarSign;
  faTicketAlt = faTicketAlt;
  events: any[] = [];
  selectedEvent: any = null;
  private searchSubscription!: Subscription;
  isExpired(eventDate: string): boolean {
    const eventDateTime = new Date(eventDate);
    console.log('Event Date:', eventDate, 'Event DateTime:', eventDateTime);
  
    const now = new Date();
    return eventDateTime < now;
  }

  constructor(private eventService: EventService) {}

  ngOnInit() {
    // Subscribe to get all events initially
    this.eventService.getEvents().subscribe(
      (data) => {
        this.events = data;
      },
      (error) => {
        console.error('Failed to fetch events', error);
      }
    );
    

    // Subscribe to the search results
    this.searchSubscription = this.eventService.searchedEvents$.subscribe(
      searchedEvents => {
        console.log('Received Searched Events in HomeComponent:', searchedEvents);
        this.events = searchedEvents;
      }
    );
  }

  ngOnDestroy() {
    // Unsubscribe to prevent memory leaks
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  openModal(event: any) {
    this.selectedEvent = event;
  }
  
  closeModal() {
    this.selectedEvent = null;
  }
}
