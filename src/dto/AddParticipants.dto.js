class AddParticipantsDTO {
    /**
     * @param {string} roomId
     * @param {Array<string>} participants
     */
    constructor(roomId, participants) {
      if (!roomId || typeof roomId !== "string") {
        throw new Error("Invalid roomId: must be a non-empty string");
      }
  
      if (!Array.isArray(participants) || participants.length === 0) {
        throw new Error("Invalid participants: must be a non-empty array");
      }
  
      participants.forEach((participant) => {
        if (typeof participant !== "string") {
          throw new Error(`Invalid participant ID: ${participant}`);
        }
      });
  
      this.roomId = roomId;
      this.participants = participants;
    }
  }
  
  module.exports = AddParticipantsDTO;