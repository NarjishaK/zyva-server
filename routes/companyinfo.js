var express = require('express');
var router = express.Router();
const Controller = require('../controller/companyinfo')

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });

//create about
router.post(
    "/",
    upload.fields([
      { name: "visionimage", maxCount: 1 },
      { name: "missionimage", maxCount: 1 },
      { name: "goalimage", maxCount: 1 },
      {name:"historyimage",maxCount:1},
      {name:"brandimage",maxCount:2},
      {name:"founderimage",maxCount:1}
    ]),
    Controller.create
  );

  router.get("/", Controller.getAll);
  router.get("/:id", Controller.get);
  router.put("/:id", upload.fields([
    { name: "visionimage", maxCount: 1 },
    { name: "missionimage", maxCount: 1 },
    { name: "goalimage", maxCount: 1 },
    {name:"historyimage",maxCount:1},
    {name:"brandimage",maxCount:2},
    {name:"founderimage",maxCount:1}
  ]), Controller.update);
  router.delete("/:id", Controller.delete);
  //send email to contact us
  router.post("/send-email", Controller.sendEmail);
module.exports = router;
