import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightSearchComponent } from './components/flight-search/flight-search.component';
import { FlightResultsComponent } from './components/flight-results/flight-results.component';
import { FlightService } from './services/flight.service';
import { Flight } from './models/flight.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FlightSearchComponent, FlightResultsComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <div class="header-content">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <span>FlightBooker</span>
          </div>
          <nav class="nav-links">
            <a href="#" class="nav-link active">Rechercher</a>
            <a href="#" class="nav-link">Mes réservations</a>
          </nav>
        </div>
      </header>

      <main class="main-content">
        <div class="search-section">
          <app-flight-search (searchResults)="onSearchResults($event)"></app-flight-search>
        </div>

        <div class="results-section" *ngIf="showResults()">
          <app-flight-results [flights]="searchResults()"></app-flight-results>
        </div>
      </main>

      <footer class="app-footer">
        <div class="footer-content">
          <p>&copy; 2025 FlightBooker. Système de réservation de vols.</p>
        </div>
      </footer>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private flightService = inject(FlightService);
  
  searchResults = signal<Flight[]>([]);
  showResults = signal(false);

  ngOnInit(): void {
    // Subscribe to flight service for search results
    this.flightService.searchFlights({}).subscribe({
      next: (flights) => {
        this.searchResults.set(flights);
        this.showResults.set(true);
      },
      error: (error) => {
        console.error('Search error:', error);
      }
    });
  }

  onSearchResults(flights: Flight[]): void {
    this.searchResults.set(flights);
    this.showResults.set(true);
  }
}