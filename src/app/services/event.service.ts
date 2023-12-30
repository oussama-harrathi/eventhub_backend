import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, catchError, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private baseUrl = 'http://localhost:3000/events'; 
  private searchedEventsSource = new Subject<any[]>();
  searchedEvents$ = this.searchedEventsSource.asObservable();

  constructor(private http: HttpClient) {}

  
  

  createEvent(eventData: FormData): Observable<any> {
    // Retrieve the authToken directly from local storage
    const authToken = localStorage.getItem('authToken');
    console.log('Auth Token:', authToken);

    // Create headers with the retrieved token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${authToken}`
    });
    console.log('Request:', {
      url: `${this.baseUrl}/create`,
      method: 'POST',
      headers,
      body: eventData
    });
    
    return this.http.post(`${this.baseUrl}/create`, eventData, { headers })
    .pipe(
      catchError(error => {
        console.error('Error creating event:', error);
        throw error; // Rethrow the error to propagate it to the caller
      })
    );

  }

  getEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/all`);
  }
  getEventById(eventId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${eventId}`);
  }
  // Add this method to EventService
  searchEvents(searchTerm: string): Observable<any[]> {
    if (!searchTerm.trim()) {
      return this.getEvents().pipe(tap(events => this.emitSearchedEvents(events)));
    }
    return this.http.get<any[]>(`${this.baseUrl}/search?term=${searchTerm}`)
      .pipe(
        tap(events => this.emitSearchedEvents(events)), // Ensure this line is emitting the results
        catchError(error => {
          console.error('Error searching events:', error);
          throw error;
        })
      );
  }
  

emitSearchedEvents(events: Event[]) {
  console.log('Searched Events:', events);
    this.searchedEventsSource.next(events);
}
// In your event.service.ts
purchaseTickets(ticketData: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/purchaseTicket`, ticketData, {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    })
  });
}
createPaymentIntent(totalPrice: number): Observable<any> {
  const url = `${this.baseUrl}/create-payment-intent`;
  const amount = totalPrice * 100;
  return this.http.post(url, { amount });
}


hasUserPurchasedTicket(eventId: string): Observable<any> {
  return this.http.get(`${this.baseUrl}/hasTicket/${eventId}`, {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    })
  });
}
getEventsCreatedByUser(): Observable<any[]> {
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  });
  return this.http.get<any[]>(`${this.baseUrl}/created-by-user`, { headers });
}

createPayout(payoutData: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/create-payout`, payoutData, {
    headers: new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      'Content-Type': 'application/json'
    })
  }).pipe(
    catchError(error => {
      console.error('Error creating payout:', error);
      throw error;
    })
  );
}

}
