const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const communityAccessOnly = require("../middlewares/communityAccessMiddleware");
const communityCtrl = require("../controllers/communityController");
const dmCtrl = require("../controllers/communityDirectController");

router.use(auth);
router.use(communityAccessOnly);

router.get("/messages", communityCtrl.listMessages);
router.post("/messages", communityCtrl.postMessage);
router.post("/messages/:messageId/react", communityCtrl.setReaction);

router.get("/dm/conversations", dmCtrl.listConversations);
router.post("/dm/conversations", dmCtrl.getOrCreateConversation);
router.get("/dm/conversations/:conversationId/messages", dmCtrl.getMessages);
router.post("/dm/conversations/:conversationId/messages", dmCtrl.sendMessage);

module.exports = router;
