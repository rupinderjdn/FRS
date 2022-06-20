const express = require("express");
const fileupload = require("express-fileupload");
const cors = require("cors");
const app = express();
const port = 3007;
app.use(express.json());
app.use(fileupload());
app.use(cors());


const admin = require("./routes/admin");


app.get("/", (req, res) => res.send("hello"));
app.use("/admin", admin);


app.listen(port, console.log(`Server listening at http://localhost:${port}`));