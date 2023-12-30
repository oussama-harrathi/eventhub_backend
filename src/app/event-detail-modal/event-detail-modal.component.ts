import { Component, Input, Output, EventEmitter, OnInit, Renderer2, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { EventService } from '../services/event.service';
import { ChatService } from '../services/chat.service';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { faShareNodes } from '@fortawesome/free-solid-svg-icons';



@Component({
  selector: 'app-event-detail-modal',
  templateUrl: './event-detail-modal.component.html',
  styleUrls: ['./event-detail-modal.component.scss'],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [style({ opacity: 0 }), animate('500ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('500ms', style({ opacity: 0 }))])
    ])
  ]
})
export class EventDetailModalComponent implements OnInit {
  faShareNodes=faShareNodes;
  hasTicket: boolean = false;
  showTooltip: boolean = false;
  showChat: boolean = false; // New property to control chat visibility
  showEmojiPicker: boolean = false;
  messages$!: Observable<any[]>; // To hold chat messages
  newMessage: string = ''; // For new message input
  isOrganizer: boolean = false;

  @Input() event: any;
  @Output() close = new EventEmitter<void>();

  private chatButton!: ElementRef<any>;

  constructor(
    private chatService: ChatService,
    private router: Router,
    private eventService: EventService,
    private renderer: Renderer2,
    private elRef: ElementRef,
    
  ) { }

  ngOnInit() {
    this.checkIfOrganizer();
    if (this.event && this.event.eventId) {
      this.eventService.hasUserPurchasedTicket(this.event.eventId).subscribe({
        next: (response) => {
          this.hasTicket = response.hasTicket;
        },
        error: (error) => console.error('Error checking ticket purchase:', error)
      });

      // Add the event listeners after a delay to ensure the chat button is rendered
      setTimeout(() => {
        this.chatButton = this.elRef.nativeElement.querySelector('.chat-button');
        this.renderer.listen(this.chatButton, 'mouseenter', () => {
          if (!this.hasTicket) {
            this.showTooltip = true;
            console.log('Tooltip should show:', this.showTooltip);
          }
        });
        this.renderer.listen(this.chatButton, 'mouseleave', () => {
          this.showTooltip = false;
          console.log('Tooltip should hide:', this.showTooltip);
        });
      }, 0);
    }
    console.log(this.event.organizerId);
  }

  toggleChat() {
    // Get the user information from the token
    const user = this.getUserFromToken();
    
  
    // Check if the user is not null and if the user is the organizer
    const isOrganizer = user ? this.event.organizerId === user.userId : false;
  
    if (this.hasTicket || isOrganizer) {
      this.showChat = !this.showChat;
      if (this.showChat) {
        // Fetch messages for the event
        this.messages$ = this.chatService.getMessages(this.event.eventId);
      }
    } else {
      this.showTooltip = true;
      console.log('Tooltip should show: ', this.showTooltip); // Log when tooltip is shown
      setTimeout(() => {
        this.showTooltip = false;
        console.log('Tooltip should hide: ', this.showTooltip); // Log when tooltip is hidden
      }, 3000);
    }
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    
  }

  checkIfOrganizer() {
    const user = this.getUserFromToken();
    if (user && this.event) {
      this.isOrganizer = user.userId === this.event.organizerId;
    }
  }
  sendMessage() {
    if (this.newMessage.trim()) {
      // Get the user information from the token
      const user = this.getUserFromToken();
  
      // Check if user is not null before proceeding
      if (user) {
        const role = this.event.organizerId === user.userId ? 'organizer' : 'attendee';
  
        this.chatService.sendMessage(this.event.eventId, this.newMessage, role)
          .then(() => this.newMessage = '')
          .catch(error => console.error('Error sending message:', error));
      } else {
        console.error('User information is not available.');
      }
    }
  }
  
  private getUserFromToken(): { userId: string } | null {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        // Replace 'user_id' and 'full_name' with the actual properties from your token
        return { userId: decodedToken?.user_id }; 
        
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  closeModal() {
    this.close.emit();
  }

  onGetTicket() {
    if (this.event && this.event.eventDate && this.event.eventTime) {
      // Since the dates are in ISO format, we can directly parse them
      const eventDateTime = new Date(this.event.eventDate);
      const now = new Date();
  
      // Compare the event date-time with the current date-time
      if (eventDateTime < now) {
        alert('Event expired');
      } else {
        this.router.navigate(['/ticket-details', this.event.eventId]);
      }
    } else {
      console.error('Invalid event data');
      // Handle invalid event data appropriately
    }
  }
  
  
  
 
  
  addEmoji(event: any) {
    this.newMessage += event.emoji.native;
    
  }
  shareEvent() {
    if (navigator.share) {
      navigator.share({
        title: this.event.eventName,
        text: `Check out this event: ${this.event.eventName}`,
        url: window.location.href  // or any other URL you want to share
      }).then(() => {
        console.log('Event shared successfully');
      }).catch((error) => {
        console.error('Error sharing event:', error);
      });
    } else {
      // Fallback for browsers that do not support the Web Share API
      console.log('Web Share API is not supported in this browser.');
    }
  }
}
