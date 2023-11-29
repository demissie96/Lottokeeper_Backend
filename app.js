const express = require("express");
const mysql = require("mysql");
const port = 5173;
const cors = require("cors");
const app = express();

// For No 'Access-Control-Allow-Origin' error
app.use(cors());

app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: "u438188790_Lottokeeper_DB",
});

app.get("/", (req, res) => {
  res.json("Connected to the MySQL Database.");
});

app.get("/all_users", (req, res) => {
  let sql = "SELECT * FROM Users;";

  pool.query(sql, function(err, result, fields) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    console.log(result);
    res.json(result);
  });
});

app.get("/user", (req, res) => {
  let id = req.headers.id;
  let sql = `SELECT * FROM Users WHERE ID = ?;`;
  let values = [id];

  pool.query(sql, values, function(err, result, fields) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    console.log(result);
    res.json(result);
  });
});

app.get("/player_betting_list", (req, res) => {
  let userId = req.headers.user_id;
  let sql = `SELECT * FROM Bettings WHERE User_ID = ?;`;
  let values = [userId];

  pool.query(sql, values, function(err, result, fields) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    console.log(result);
    res.json(result);
  });
});

app.get("/all_bets_list", (req, res) => {
  let sql = `SELECT * FROM Bettings ORDER BY User_ID DESC, Betting_Date ASC;`;

  pool.query(sql, function(err, result, fields) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    console.log(result);
    res.json(result);
  });
});

app.get("/winner_numbers", (req, res) => {
  let sql = "SELECT * FROM WinnerNumbers;";

  pool.query(sql, function(err, result, fields) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    console.log(result);
    res.json(result);
  });
});

app.delete("/users", (req, res) => {
  // Get a connection from the pool
  pool.getConnection(function(err, connection) {
    if (err) throw err;

    // Start a transaction
    connection.beginTransaction(function(err) {
      if (err) {
        connection.release();
        throw err;
      }

      // Query to delete from Users table
      let deleteSql = "DELETE FROM Users WHERE ID > 1;";
      connection.query(deleteSql, function(err, deleteResult) {
        if (err) {
          // If error, rollback the transaction
          return connection.rollback(function() {
            connection.release();
            throw err;
          });
        }

        console.log(deleteResult);

        // Query to update a specific user's balance
        let updateSql = "UPDATE Users SET Balance = 0 WHERE ID = 1;";
        connection.query(updateSql, function(err, updateResult) {
          if (err) {
            // If error, rollback the transaction
            return connection.rollback(function() {
              connection.release();
              throw err;
            });
          }

          console.log(updateResult);

          // Commit the transaction
          connection.commit(function(err) {
            if (err) {
              // If error, rollback the transaction
              return connection.rollback(function() {
                connection.release();
                throw err;
              });
            }

            console.log("Transaction Complete.");
            connection.release();
            res.json("Number of users deleted: " + deleteResult.affectedRows);
          });
        });
      });
    });
  });
});


app.delete("/bettings", (req, res) => {
  var sql = "DELETE FROM Bettings;";

  pool.query(sql, function(err, result) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    console.log(result);
    res.json("Number of bettings deleted: " + result.affectedRows);
  });
})
  .post("/newuser", (req, res) => {
    // Add new user
    let name = req.headers.name;
    let balance = req.headers.balance;

    let sql = `INSERT INTO Users (Name, Balance) VALUES(?, ?)`;
    let values = [name, balance];

    pool.query(sql, values, function(err, result) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      console.log(result);
      res.json(result);
    });
  });

app.post("/newbet", (req, res) => {
  console.log("************ Triggered ************");

  // Get a connection from the pool
  pool.getConnection(function(err, connection) {
    if (err) throw err;

    // Start a transaction
    connection.beginTransaction(function(err) {
      if (err) {
        connection.release();
        throw err;
      }

      // Extract data from headers
      let userId = req.headers.user_id;
      let num1 = req.headers.num1;
      let num2 = req.headers.num2;
      let num3 = req.headers.num3;
      let num4 = req.headers.num4;
      let num5 = req.headers.num5;

      // Insert into Bettings table
      let sqlInsert = `INSERT INTO Bettings (User_ID, Num_1, Num_2, Num_3, Num_4, Num_5) 
                            VALUES(?, ?, ?, ?, ?, ?)`;
      let insertValues = [userId, num1, num2, num3, num4, num5];

      connection.query(sqlInsert, insertValues, function(err, result) {
        if (err) {
          // If error, rollback the transaction
          return connection.rollback(function() {
            connection.release();
            throw err;
          });
        }

        console.log(result);

        // Update Users table (first update)
        let sqlUpdate1 =
          userId === "1"
            ? `UPDATE Users SET Balance = Balance + 500 WHERE ID = ?`
            : `UPDATE Users SET Balance = Balance - 500 WHERE ID = ?`;
        let updateValues1 = [userId];

        connection.query(sqlUpdate1, updateValues1, function(err, result) {
          if (err) {
            // If error, rollback the transaction
            return connection.rollback(function() {
              connection.release();
              throw err;
            });
          }

          console.log(result);

          // Update Users table (second update)
          let sqlUpdate2 = `UPDATE Users SET Balance = Balance + 500 WHERE ID = 1;`;

          connection.query(sqlUpdate2, function(err, result) {
            if (err) {
              // If error, rollback the transaction
              return connection.rollback(function() {
                connection.release();
                throw err;
              });
            }

            console.log(result);

            // Commit the transaction
            connection.commit(function(err) {
              if (err) {
                // If error, rollback the transaction
                return connection.rollback(function() {
                  connection.release();
                  throw err;
                });
              }

              console.log("Transaction Complete.");
              connection.release();
              res.json(result);
            });
          });
        });
      });
    });
  });
})
  .post("/new_winner_nums", (req, res) => {
    // Add new bet
    let num1 = req.headers.num1;
    let num2 = req.headers.num2;
    let num3 = req.headers.num3;
    let num4 = req.headers.num4;
    let num5 = req.headers.num5;

    let sql = `INSERT INTO WinnerNumbers (Num_1, Num_2, Num_3, Num_4, Num_5) 
                VALUES(?, ?, ?, ?, ?)`;
    let values = [num1, num2, num3, num4, num5];

    pool.query(sql, values, function(err, result) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      console.log(result);
      res.json(result);
    });
  })
  .put("/reward_update", (req, res) => {
    // Update an element
    res.json("Test Run");
  });

app.listen(port, () => {
  console.log(`Example app run on http://localhost:${port}/`);
});
