export interface Doctor {
  firstName: string;
  lastName: string;
  appointmentsByLocation: ApptLocation[];
}

export interface ApptLocation {
  locationName: string;
  appointments: Appointment[];
}

export interface Appointment {
  appointmentId: string;
  startDateTime: string;
  duration: string;
  service: {
    serviceName: string;
    price: string;
  };
}

export interface ApptError {
  errorType: ErrorType;
  apptIds: string[];
}

export interface ApptResponse {
  doctors: Doctor[];
  errors: ApptError[];
}

export enum ErrorType {
  DuplicateId = "DUPLICATE ID",
  InvalidPrice = "INVALID PRICE",
  InvalidLocation = "INVALID LOCATION",
  DoubleBooked = "DOUBLE BOOKED",
}
