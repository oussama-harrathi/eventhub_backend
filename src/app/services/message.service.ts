import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private message: string = '';

  setMessage(message: string) {
    this.message = message;
    // You can also implement logic to display the message here
  }

  getMessage(): string {
    return this.message;
  }

  clearMessage() {
    this.message = '';
  }
}
