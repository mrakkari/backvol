export interface Flight {
  id: string;
  dateDepart: string;
  dateArrivee: string;
  villeDepart: string;
  villeArrivee: string;
  prix: number;
  tempsTrajet: number;
  capaciteMaximale: number;
  placesReservees: number;
  placesDisponibles?: number;
}

export interface FlightSearchParams {
  dateDepart?: string;
  villeDepart?: string;
  villeArrivee?: string;
  tri?: 'prix' | 'temps_trajet';
}

export interface Passenger {
  nom: string;
  prenom: string;
  email: string;
}

export interface ReservationRequest {
  volId: string;
  passager: Passenger;
  nombrePlaces: number;
}

export interface ReservationResponse {
  numeroReservation: string;
  volId: string;
  passager: Passenger;
  nombrePlaces: number;
  dateReservation: string;
}