import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightService } from '../../services/flight.service';
import { Flight } from '../../models/flight.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-flight-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="results-container" *ngIf="flights().length > 0 || (flightService.loading$ | async)">
      <div class="results-header">
        <h2>Résultats de recherche</h2>
        <p *ngIf="flights().length > 0">{{ flights().length }} vol(s) trouvé(s)</p>
      </div>

      <div *ngIf="flightService.loading$ | async" class="loading-container">
        <div class="loading-spinner">
          <svg class="spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="31.416" stroke-dashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </animate>
          </svg>
        </div>
        <p>Recherche en cours...</p>
      </div>

      <div class="flights-grid" *ngIf="!(flightService.loading$ | async) && flights().length > 0">
        <div class="flight-card" *ngFor="let flight of flights(); trackBy: trackByFlightId">
          <div class="flight-header">
            <div class="route">
              <span class="city">{{ flight.villeDepart }}</span>
              <div class="arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
              <span class="city">{{ flight.villeArrivee }}</span>
            </div>
            <div class="price">{{ flight.prix }}€</div>
          </div>

          <div class="flight-details">
            <div class="detail-item">
              <span class="label">Départ:</span>
              <span class="value">{{ formatDateTime(flight.dateDepart) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Arrivée:</span>
              <span class="value">{{ formatDateTime(flight.dateArrivee) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Durée:</span>
              <span class="value">{{ formatDuration(flight.tempsTrajet) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Places disponibles:</span>
              <span class="value" [class.low-availability]="getAvailableSeats(flight) < 10">
                {{ getAvailableSeats(flight) }} / {{ flight.capaciteMaximale }}
              </span>
            </div>
          </div>

          <div class="flight-actions">
            <button 
              class="reserve-button"
              [disabled]="getAvailableSeats(flight) === 0"
              (click)="selectFlight(flight)">
              <span *ngIf="getAvailableSeats(flight) > 0">Réserver</span>
              <span *ngIf="getAvailableSeats(flight) === 0">Complet</span>
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="!(flightService.loading$ | async) && flights().length === 0 && hasSearched()" class="no-results">
        <div class="no-results-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="7.5,4.21 12,6.81 16.5,4.21"/>
            <polyline points="7.5,19.79 7.5,14.6 3,12"/>
            <polyline points="21,12 16.5,14.6 16.5,19.79"/>
          </svg>
        </div>
        <h3>Aucun vol trouvé</h3>
        <p>Essayez de modifier vos critères de recherche</p>
      </div>
    </div>
  `,
  styleUrls: ['./flight-results.component.scss']
})
export class FlightResultsComponent implements OnInit, OnDestroy {
  public flightService = inject(FlightService);
  
  flights = signal<Flight[]>([]);
  hasSearched = signal(false);
  
  private subscription?: Subscription;

  ngOnInit(): void {
    // Subscribe to search results
    this.subscription = this.flightService.searchFlights({}).subscribe({
      next: (flights) => {
        this.flights.set(flights);
        this.hasSearched.set(true);
      },
      error: (error) => {
        console.error('Error loading flights:', error);
        this.hasSearched.set(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  trackByFlightId(index: number, flight: Flight): string {
    return flight.id;
  }

  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}min`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins.toString().padStart(2, '0')}min`;
    }
  }

  getAvailableSeats(flight: Flight): number {
    return flight.capaciteMaximale - flight.placesReservees;
  }

  selectFlight(flight: Flight): void {
    // Emit event or navigate to reservation form
    console.log('Selected flight:', flight);
    // This could emit an event to parent component or use router to navigate
  }
}