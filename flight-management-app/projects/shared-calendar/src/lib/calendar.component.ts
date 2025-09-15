import { Component, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'lib-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-container">
      <div class="calendar-header">
        <button class="nav-button" (click)="previousMonth()" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        <h2 class="month-year">{{ currentMonthYear() }}</h2>
        <button class="nav-button" (click)="nextMonth()" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>
      </div>
      
      <div class="calendar-grid">
        <div class="weekday-header" *ngFor="let day of weekdays">{{ day }}</div>
        
        <button 
          *ngFor="let day of calendarDays()" 
          class="calendar-day"
          [class.other-month]="!day.isCurrentMonth"
          [class.today]="day.isToday"
          [class.selected]="day.isSelected"
          [disabled]="!day.isCurrentMonth || isPastDate(day.date)"
          (click)="selectDate(day.date)"
          type="button">
          {{ day.date.getDate() }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent {
  @Output() dateSelected = new EventEmitter<string>();

  private currentDate = signal(new Date());
  private selectedDate = signal<Date | null>(null);
  private today = new Date();

  weekdays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  currentMonthYear = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed(() => {
    const current = this.currentDate();
    const year = current.getFullYear();
    const month = current.getMonth();
    const selected = this.selectedDate();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday of the calendar view
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // End at the last Saturday of the calendar view
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days: CalendarDay[] = [];
    const currentDateIter = new Date(startDate);

    while (currentDateIter <= endDate) {
      const isCurrentMonth = currentDateIter.getMonth() === month;
      const isToday = this.isSameDay(currentDateIter, this.today);
      const isSelected = selected ? this.isSameDay(currentDateIter, selected) : false;

      days.push({
        date: new Date(currentDateIter),
        isCurrentMonth,
        isToday,
        isSelected
      });

      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    return days;
  });

  previousMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  selectDate(date: Date): void {
    if (this.isPastDate(date)) return;
    
    this.selectedDate.set(date);
    const formattedDate = this.formatDate(date);
    this.dateSelected.emit(formattedDate);
  }

  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}