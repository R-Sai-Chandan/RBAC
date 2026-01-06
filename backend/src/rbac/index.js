const roleRoutes = require("./routes/role.routes");
const checkPermission = require("./middleware/checkPermission");

module.exports = {
  roleRoutes,
  checkPermission,
};
