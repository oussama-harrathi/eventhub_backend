import { Injectable } from '@angular/core';
import { getDatabase, ref, push, onValue, query, limitToLast } from 'firebase/database';
import { Observable, BehaviorSubject } from 'rxjs';
import {jwtDecode} from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor() {}

  getMessages(eventId: string): Observable<any[]> {
    const messages = new BehaviorSubject<any[]>([]);
    const db = getDatabase();
    const messagesRef = query(ref(db, `chats/${eventId}`), limitToLast(100)); // Adjust the limit as needed

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedMessages = Object.keys(data).map(key => ({ ...data[key], key }));
        messages.next(formattedMessages);
      }
    }, {
      onlyOnce: false
    });

    return messages.asObservable();
  }

  async sendMessage(eventId: string, message: string, role: string): Promise<void> {
    const user = this.getUserFromToken();
    if (!user) {
      console.error('User details not found in token');
      throw new Error('User details not found');
    }

    const timestamp = new Date().getTime();
    const db = getDatabase();
    try {
      await push(ref(db, `chats/${eventId}`), { userId: user.userId, fullName: user.fullName, message, timestamp, role });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  private getUserFromToken(): { userId: string, fullName: string } | null {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        return { userId: decodedToken?.user_id, fullName: decodedToken?.full_name };
        
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }
}










