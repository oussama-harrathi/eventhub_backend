import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import {jwtDecode} from 'jwt-decode'; 

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private db: AngularFireDatabase) {}

  getMessages(eventId: string): Observable<any[]> {
    return this.db.list(`chats/${eventId}`).valueChanges();
  }

  async sendMessage(eventId: string, message: string, role: string): Promise<void> {
    const user = this.getUserFromToken();
    if (!user) {
      console.error('User details not found in token');
      throw new Error('User details not found');
    }

    const timestamp = new Date().getTime();
    try {
      await this.db.list(`chats/${eventId}`).push({ userId: user.userId, fullName: user.fullName, message, timestamp, role });
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
        // Replace 'user_id' and 'full_name' with the actual properties from your token
        return { userId: decodedToken?.user_id, fullName: decodedToken?.full_name }; 
        
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }
}
