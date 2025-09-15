import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, retry, delay } from 'rxjs';
import { Flight, FlightSearchParams, ReservationRequest, ReservationResponse } from '../models/flight.model';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  searchFlights(params: FlightSearchParams): Observable<Flight[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    let httpParams = new HttpParams();
    
    if (params.dateDepart) {
      httpParams = httpParams.set('dateDepart', params.dateDepart);
    }
    if (params.villeDepart) {
      httpParams = httpParams.set('villeDepart', params.villeDepart);
    }
    if (params.villeArrivee) {
      httpParams = httpParams.set('villeArrivee', params.villeArrivee);
    }
    if (params.tri) {
      httpParams = httpParams.set('tri', params.tri);
    }

    return this.http.get<Flight[]>(`${this.baseUrl}/vols`, { params: httpParams })
      .pipe(
        retry({ count: 2, delay: 1000 }),
        catchError(error => {
          this.errorSubject.next('Erreur lors de la recherche des vols. Veuillez réessayer.');
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  getAvailableSeats(flightId: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/vols/${flightId}/places`)
      .pipe(
        catchError(error => {
          console.error('Error fetching available seats:', error);
          throw error;
        })
      );
  }

  makeReservation(reservation: ReservationRequest): Observable<ReservationResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<ReservationResponse>(`${this.baseUrl}/reservations`, reservation)
      .pipe(
        catchError(error => {
          let errorMessage = 'Erreur lors de la réservation.';
          
          if (error.error?.code === 'INSUFFICIENT_SEATS') {
            errorMessage = 'Places insuffisantes pour ce vol.';
          } else if (error.error?.code === 'VOL_NOT_FOUND') {
            errorMessage = 'Vol non trouvé.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.errorSubject.next(errorMessage);
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }
}