class DeleteRoomDTO {
    /**
     * @param {string} roomId - 삭제할 방 ID
     */
    constructor(roomId) {
      this.roomId = roomId;
    }
  }
  
  module.exports = DeleteRoomDTO;