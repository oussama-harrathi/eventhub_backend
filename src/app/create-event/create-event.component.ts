import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { EventService } from '../services/event.service';

interface EventData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description: string;
  category: string;
  allowedTicketsNumber: number;
  price: number;
}

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss']
})
export class CreateEventComponent {
  @ViewChild('eventForm') eventForm!: NgForm;
  eventData: EventData = {
    eventName: '',
    eventDate: '',
    eventTime: '',
    location: '',
    description: '',
    category: '',
    allowedTicketsNumber: 1,
    price: 0
  };
  today: Date = new Date();
  selectedFile: File | null = null;
  message: string = '';
  submitted = false;  // Add a flag to track if form is submitted

  constructor(private eventService: EventService) {}

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit() {
    this.submitted = true; // Mark form as submitted

    // Check if form is valid
    if (!this.eventForm.valid) {
      return; // Prevent further processing if form is invalid
    }

    const formData = new FormData();
    formData.append('eventName', this.eventData.eventName);
    formData.append('eventDate', this.eventData.eventDate);
    formData.append('eventTime', this.eventData.eventTime);
    formData.append('location', this.eventData.location);
    formData.append('description', this.eventData.description);
    formData.append('category', this.eventData.category);
    formData.append('allowedTicketsNumber', this.eventData.allowedTicketsNumber.toString());
    formData.append('price', this.eventData.price.toString());
  
    if (this.selectedFile) {
      formData.append('eventPicture', this.selectedFile, this.selectedFile.name);
    }

    this.eventService.createEvent(formData).subscribe(
      response => {
        this.message = 'Event created successfully';
        this.eventForm.resetForm(); // Reset form after successful submission
        this.submitted = false; // Reset the submitted flag
      },
      error => {
        this.message = 'Failed to create event';
        this.submitted = false; // Reset the submitted flag
      }
    );
  }
}
