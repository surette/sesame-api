# sesame-api
Simple API for restructuring doctor/appointment data and logging errors in the results

# Installation and Usage

Run `npm install` from root directory to download dependencies. Run `npm run dev` from root directory to start the application on `localhost:3001`. You can call the API to retrieve restructured appointment data at `localhost:3001/appointments`. The JSON response will have `doctors` with their associated appointments, and `errors` with an `errorType` and an array of appointment IDs, for the appointments found with that error.
