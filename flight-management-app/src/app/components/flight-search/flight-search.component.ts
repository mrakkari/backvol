import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarComponent } from 'shared-calendar';
import { FlightService } from '../../services/flight.service';
import { Flight, FlightSearchParams } from '../../models/flight.model';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CalendarComponent],
  template: `
    <div class="search-container">
      <div class="search-header">
        <h1>Recherche de vols</h1>
        <p>Trouvez le vol parfait pour votre voyage</p>
      </div>

      <form [formGroup]="searchForm" (ngSubmit)="onSearch()" class="search-form">
        <div class="form-row">
          <div class="form-group">
            <label for="villeDepart">Ville de départ</label>
            <input 
              id="villeDepart"
              type="text" 
              formControlName="villeDepart"
              placeholder="Ex: Paris"
              class="form-input">
          </div>

          <div class="form-group">
            <label for="villeArrivee">Ville d'arrivée</label>
            <input 
              id="villeArrivee"
              type="text" 
              formControlName="villeArrivee"
              placeholder="Ex: Lyon"
              class="form-input">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Date de départ</label>
            <div class="calendar-wrapper" [class.show-calendar]="showCalendar()">
              <input 
                type="text" 
                [value]="selectedDate() || 'Sélectionner une date'"
                (click)="toggleCalendar()"
                readonly
                class="form-input calendar-input"
                placeholder="Sélectionner une date">
              
              <div class="calendar-dropdown" *ngIf="showCalendar()">
                <lib-calendar (dateSelected)="onDateSelected($event)"></lib-calendar>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="tri">Trier par</label>
            <select id="tri" formControlName="tri" class="form-select">
              <option value="">Aucun tri</option>
              <option value="prix">Prix</option>
              <option value="temps_trajet">Temps de trajet</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          class="search-button"
          [disabled]="flightService.loading$ | async">
          <span *ngIf="!(flightService.loading$ | async)">Rechercher</span>
          <span *ngIf="flightService.loading$ | async" class="loading-spinner">
            <svg class="spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
              </circle>
            </svg>
            Recherche...
          </span>
        </button>
      </form>

      <div *ngIf="flightService.error$ | async as error" class="error-message">
        {{ error }}
        <button (click)="flightService.clearError()" class="close-error">×</button>
      </div>
    </div>
  `,
  styleUrls: ['./flight-search.component.scss']
})
export class FlightSearchComponent implements OnInit {
  private fb = inject(FormBuilder);
  public flightService = inject(FlightService);

  searchForm!: FormGroup;
  showCalendar = signal(false);
  selectedDate = signal<string | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.setupClickOutside();
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      villeDepart: [''],
      villeArrivee: [''],
      tri: ['']
    });
  }

  private setupClickOutside(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const calendarWrapper = target.closest('.calendar-wrapper');
      if (!calendarWrapper && this.showCalendar()) {
        this.showCalendar.set(false);
      }
    });
  }

  toggleCalendar(): void {
    this.showCalendar.set(!this.showCalendar());
  }

  onDateSelected(date: string): void {
    this.selectedDate.set(date);
    this.showCalendar.set(false);
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      const params: FlightSearchParams = {
        ...this.searchForm.value,
        dateDepart: this.selectedDate() || undefined
      };

      // Remove empty values
      Object.keys(params).forEach(key => {
        if (!params[key as keyof FlightSearchParams]) {
          delete params[key as keyof FlightSearchParams];
        }
      });

      this.flightService.searchFlights(params).subscribe({
        next: (flights) => {
          this.flightService.setLoading(false);
          // Results will be handled by the parent component or flight-results component
        },
        error: (error) => {
          console.error('Search error:', error);
          this.flightService.setLoading(false);
        }
      });
    }
  }
}