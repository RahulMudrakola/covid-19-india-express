const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API1

const covertDbObjectToResponseObject = (eachStates) => {
  return {
    stateId: eachStates.state_id,
    stateName: eachStates.state_name,
    population: eachStates.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachStates) => covertDbObjectToResponseObject(eachStates))
  );
});

//API2

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state
    WHERE state_id=${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(covertDbObjectToResponseObject(state));
});

//API3

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API4

const covertDbDistrictObjectToResponseObject = (district) => {
  return {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
};

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district
    WHERE district_id=${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(covertDbDistrictObjectToResponseObject(district));
});

//API5

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};
  `;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API7

const covertDbDistrictStateObjectToResponseObject = (district) => {
  return {
    totalCases: district.totalCases,
    totalCured: district.totalCured,
    totalActive: district.totalActive,
    totalDeaths: district.totalDeaths,
  };
};

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictQuery = `
    SELECT SUM(cases) as totalCases,
    SUM(cured) as totalCured,SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
     FROM district
    WHERE state_id=${stateId};`;
  const district = await db.get(getDistrictQuery);
  response.send(covertDbDistrictStateObjectToResponseObject(district));
});

//API8

const covertDbDistrictOnlyObjectToResponseObject = (district) => {
  return {
    stateName: district.state_name,
  };
};

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT state_name FROM district INNER JOIN state ON district.state_id=state.state_id
    WHERE district_id=${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(covertDbDistrictOnlyObjectToResponseObject(district));
});

module.exports = app;
