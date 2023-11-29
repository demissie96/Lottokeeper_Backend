const express = require("express");
const mysql = require('mysql');
const port = 5173;
const cors = require("cors");
const app = express();

// for No 'Access-Control-Allow-Origin' error
app.use(cors());

app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const con = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: "u438188790_Lottokeeper_DB"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected To Lottokeeper MySQL");
});

app
  .get("/", (req, res) => {

    res.json("Connected to the MySQL Database.");

  })
  .get("/all_users", (req, res) => {

    let sql = "SELECT * FROM Users;";

    con.query(sql, function(err, result, fields) {
      if (err) throw err;
      console.log(result);
      res.json(result);
    });

  })
  .get("/user", (req, res) => {

    let id = req.headers.id;
    let sql = `SELECT * FROM Users WHERE ID = ${id};`;

    con.query(sql, function(err, result, fields) {
      if (err) throw err;
      console.log(result);
      res.json(result);
    });

  })
  .get("/player_betting_list", (req, res) => {
    let userId = req.headers.user_id;

    let sql = `SELECT * FROM Bettings WHERE User_ID = ${userId};`;

    con.query(sql, function(err, result, fields) {
      if (err) throw err;
      console.log(result);
      res.json(result);
    });
  })
  .get("/all_bets_list", (req, res) => {

    let sql = `SELECT * FROM Bettings ORDER BY User_ID DESC, Betting_Date ASC;`;

    con.query(sql, function(err, result, fields) {
      if (err) throw err;
      console.log(result);
      res.json(result);
    });
  })
  .get("/winner_numbers", (req, res) => {

    let sql = "SELECT * FROM WinnerNumbers;";

    con.query(sql, function(err, result, fields) {
      if (err) throw err;
      console.log(result);
      res.json(result);
    });

  })
  .delete("/users", (req, res) => {
    // Start a transaction
    con.beginTransaction(function(err) {
      if (err) throw err;

      // Query to delete from Users table
      let deleteSql = "DELETE FROM Users WHERE ID > 1;";
      con.query(deleteSql, function(err, deleteResult) {
        if (err) {
          // If error, rollback the transaction
          return con.rollback(function() {
            throw err;
          });
        }

        console.log(deleteResult);

        // Query to update a specific user's balance
        let updateSql = "UPDATE Users SET Balance = 0 WHERE ID = 1;";
        con.query(updateSql, function(err, updateResult) {
          if (err) {
            // If error, rollback the transaction
            return con.rollback(function() {
              throw err;
            });
          }

          console.log(updateResult);

          // Commit the transaction
          con.commit(function(err) {
            if (err) {
              // If error, rollback the transaction
              return con.rollback(function() {
                throw err;
              });
            }

            console.log("Transaction Complete.");
            res.json("Number of users deleted: " + deleteResult.affectedRows);
          });
        });
      });
    });
  })
  .delete("/bettings", (req, res) => {

    var sql = "DELETE FROM Bettings;";

    con.query(sql, function(err, result) {
      if (err) throw err;
      console.log(result);
      res.json("Number of bettings deleted: " + result.affectedRows);
    });

  })
  .post("/newuser", (req, res) => {
    // Add new user
    let name = req.headers.name;
    let balance = req.headers.balance;

    let sql = `INSERT INTO Users (Name, Balance) VALUES('${name}', ${balance})`;
    con.query(sql, function(err, result) {
      if (err) throw err;
      console.log(result);
      res.json(result);
    });

  })
  .post("/newbet", (req, res) => {
    console.log("************ Triggered ************");

    // Extract data from headers
    let userId = req.headers.user_id;
    let num1 = req.headers.num1;
    let num2 = req.headers.num2;
    let num3 = req.headers.num3;
    let num4 = req.headers.num4;
    let num5 = req.headers.num5;

    // Start a transaction
    con.beginTransaction(function(err) {
      if (err) throw err;

      // Insert into Bettings table
      let sqlInsert = `INSERT INTO Bettings (User_ID, Num_1, Num_2, Num_3, Num_4, Num_5) 
                          VALUES(${userId}, ${num1}, ${num2}, ${num3}, ${num4}, ${num5});`;

      con.query(sqlInsert, function(err, result) {
        if (err) {
          // If error, rollback the transaction
          return con.rollback(function() {
            throw err;
          });
        }

        console.log(result);

        // Update Users table (first update)
        if (userId === "1") {
          var sqlUpdate1 = `UPDATE Users SET Balance = Balance + 500 WHERE ID = ${userId};`;
        }
        else {
          var sqlUpdate1 = `UPDATE Users SET Balance = Balance - 500 WHERE ID = ${userId};`;
        }


        con.query(sqlUpdate1, function(err, result) {
          if (err) {
            // If error, rollback the transaction
            return con.rollback(function() {
              throw err;
            });
          }

          console.log(result);

          // Update Users table (second update)
          let sqlUpdate2 = `UPDATE Users SET Balance = Balance + 500 WHERE ID = 1;`;

          con.query(sqlUpdate2, function(err, result) {
            if (err) {
              // If error, rollback the transaction
              return con.rollback(function() {
                throw err;
              });
            }

            console.log(result);

            // Commit the transaction
            con.commit(function(err) {
              if (err) {
                // If error, rollback the transaction
                return con.rollback(function() {
                  throw err;
                });
              }
              console.log("Transaction Complete.");
              res.json(result);
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
                VALUES(${num1}, ${num2}, ${num3}, ${num4}, ${num5})`;

    con.query(sql, function(err, result) {
      if (err) throw err;
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
