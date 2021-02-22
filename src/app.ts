import express, { Application, Request, Response } from "express";
import got from "got";
import { DateTime, Duration, Interval } from "luxon";
import {
  Doctor,
  Appointment,
  ApptLocation,
  ApptError,
  ApptResponse,
  ErrorType,
} from "./types";

const app: Application = express();
const port: number = 3001;

app.get("/appointments", async (req: Request, res: Response) => {
  const response = await got(
    "https://us-central1-sesame-care-dev.cloudfunctions.net/sesame_programming_test_api"
  );

  let body = JSON.parse(response.body);
  let doctors: Doctor[] = [];
  let errors: ApptError[] = [
    {
      errorType: ErrorType.DuplicateId,
      apptIds: [],
    },
    {
      errorType: ErrorType.InvalidPrice,
      apptIds: [],
    },
    {
      errorType: ErrorType.InvalidLocation,
      apptIds: [],
    },
    {
      errorType: ErrorType.DoubleBooked,
      apptIds: [],
    },
  ];
  let newResponse: ApptResponse = {
    doctors: doctors,
    errors: errors,
  };
  let moneyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // for each appointment in response, assign to doctor
  for (let i = 0; i < body.length; i++) {
    let appt: any = body[i];

    let isoDateTime: string = DateTime.fromSQL(appt["time"], {
      zone: appt["location"]["timeZoneCode"],
    }).toISO();

    let isoDuration: string = Duration.fromObject({
      minutes: appt["durationInMinutes"],
    }).toISO();

    if (appt["service"]["price"] == -1) {
      errors[1].apptIds.push(appt["id"]);
    }

    let appointment: Appointment = {
      appointmentId: appt["id"],
      startDateTime: isoDateTime,
      duration: isoDuration,
      service: {
        serviceName: appt["service"]["name"],
        price: moneyFormatter.format(appt["service"]["price"] * 0.01),
      },
    };

    let location: ApptLocation = {
      locationName: appt["location"]["name"],
      appointments: [],
    };

    if (location.locationName == null) {
      errors[2].apptIds.push(appointment.appointmentId);
    }

    let doctor: Doctor = {
      firstName: appt["doctor"]["firstName"],
      lastName: appt["doctor"]["lastName"],
      appointmentsByLocation: [],
    };

    let doctorExists: boolean = false;
    let locationExists: boolean = false;

    // check doctors list to see if this doctor/location already exists
    // if so, add appointment to existing doctor/location
    // otherwise, push a new doctor into the doctors list
    for (let j = 0; j < doctors.length; j++) {
      let dr: Doctor = doctors[j];

      if (doctor.firstName == dr.firstName && doctor.lastName == dr.lastName) {
        doctorExists = true;

        for (let k = 0; k < dr.appointmentsByLocation.length; k++) {
          let loc: ApptLocation = dr.appointmentsByLocation[k];

          if (location.locationName == loc.locationName) {
            locationExists = true;

            for (let m = 0; m < loc.appointments.length; m++) {
              let existingAppt: Appointment = loc.appointments[m];

              // check for duplicate appointment id
              if (appointment.appointmentId == existingAppt.appointmentId) {
                errors[0].apptIds.push(appointment.appointmentId);
                break;
              }

              // check to see if appointment time overlaps with existing appointments
              let newInterval = Interval.fromISO(
                appointment.startDateTime + "/" + appointment.duration
              );
              let existingInterval = Interval.fromISO(
                existingAppt.startDateTime + "/" + existingAppt.duration
              );

              if (newInterval.overlaps(existingInterval)) {
                errors[3].apptIds.push(appointment.appointmentId);
              }

              loc.appointments.push(appointment);
              break;
            }
          }
        }

        // if location doesn't exist, add a new location to doctor
        if (!locationExists) {
          location.appointments.push(appointment);
          dr.appointmentsByLocation.push(location);
        }
      }
    }

    // if doctor doesn't exist, add a new doctor to response
    if (!doctorExists) {
      location.appointments.push(appointment);
      doctor.appointmentsByLocation.push(location);
      doctors.push(doctor);
    }
  }

  res.send(newResponse);
});

app.listen(port, () => {
  console.log(`App is listening on port ${port} !`);
});
