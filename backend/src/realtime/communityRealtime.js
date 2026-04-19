/** Socket.IO `/community` namespace — set at server bootstrap */
let communityNs = null;

function setCommunityNamespace(namespace) {
  communityNs = namespace;
}

function emitCommunity(event, payload) {
  if (communityNs) communityNs.to("community-global").emit(event, payload);
}

function emitDm(conversationId, event, payload) {
  if (!conversationId || !communityNs) return;
  communityNs.to(`dm-${String(conversationId)}`).emit(event, payload);
}

module.exports = { setCommunityNamespace, emitCommunity, emitDm };
