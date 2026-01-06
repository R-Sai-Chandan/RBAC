const express = require("express");
const cors = require("cors");
const { roleRoutes } = require("./rbac");



const app = express();
app.use("/rbac/roles", roleRoutes);
app.use(cors());
app.use(express.json());

module.exports = app;
