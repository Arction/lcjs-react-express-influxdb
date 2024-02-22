## Setup

- Following InfluxDB guide on setting up a local InfluxDB server
- https://docs.influxdata.com/influxdb/v2/get-started/setup/
- Extract InfluxDB executable to machine, run it with powershell
- Open InfluxDB UI at http://localhost:8086/
- Finish the database setup to get organization name, initial bucket name and API key
- Here we'll just go with `test-organization` and `test-bucket`
- Copy the "operator API token" directly to the repository's `.env` file under as `INFLUXDB_API_TOKEN`
- Place your LightningChart JS trial or developer license to `frontend/src/App.js`
- Install project dependencies with `npm i`
- Run the project with `npm start`
  - This will first build the React frontend into `public` folder
  - and afterwards launch Express server that hosts everything needed (frontend, server endpoints and websocket server)

## Result

This is a minimal showcase of functional combination of:

- LightningChart JS (data visualization library on frontend)
- React (frontend development framework, created with `create-react-app`)
- Express (Node.JS backend framework)
- InfluxDB (time series database)

1. In the application, the server continuously spawns new data points and pushes them to the database.
2. When a client is opened, the last 5 minutes of data are requested through a GET endpoint on the backend.
3. Afterwards, the client establishes a websocket connection to the server to listen to new data points as they arrive.
4. When new data points are spawned on server, it also broadcasts them to all active websocket clients.

Result = real-time visualization of 1 data source with 1000 Hz frequency.

## Extra mentions

- Opening application rapidly may not show recent data points stored from database. This is some strange InfluxDB behavior, as the query is done totally right. There seems to be some delay between new data points being written and them being returned by queries. Write batching?
