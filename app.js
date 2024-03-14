const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertToCamelCase = (data) => ({
  movieId: data.movie_id,
  directorId: data.director_id,
  movieName: data.movie_name,
  leadActor: data.lead_actor,
  directorName: data.director_name,
});

// Get movies API
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name FROM movie;
    `;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(moviesArray.map((each) => convertToCamelCase(each)));
});

// Add Movie API
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, leadActor, movieName } = movieDetails;
  const addMovieQuery = `
  INSERT INTO movie (director_id,movie_name, lead_actor)
  VALUES (
    ${directorId},'${movieName}', '${leadActor}'
  );
  `;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

// Get Movie API
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovie = `
  SELECT * FROM movie WHERE movie_id=${movieId};
  `;
  const movie = await db.get(getMovie);
  if (movie === undefined) {
    response.send({});
  } else {
    response.send(convertToCamelCase(movie));
  }
});

// Update Book API
app.put("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateQuery = `
  UPDATE movie
  SET 
    director_id=${directorId},
    movie_name='${movieName}',
    lead_actor='${leadActor}'
  WHERE 
    movie_id=${movieId};
  `;
  await db.run(updateQuery);
  response.send("Movie Details Updated");
});

//Delete Movie API
app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
  DELETE FROM movie WHERE movie_id=${movieId};
  `;
  await db.run(deleteQuery);
  response.send("Movie Removed");
});

// Get Directors API
app.get("/directors/", async (request, response) => {
  const getQuery = `
    SELECT * FROM director;
    `;
  const directorsArray = await db.all(getQuery);
  response.send(directorsArray.map((each) => convertToCamelCase(each)));
});

// Get movies of a specific director API
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getQuery = `
    SELECT movie_name FROM movie WHERE director_id=${directorId};
    `;
  const moviesArray = await db.all(getQuery);
  response.send(moviesArray.map((each) => convertToCamelCase(each)));
});

module.exports = app;
