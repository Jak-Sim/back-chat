/**
 * ChatRoom DTO
 * 채팅방 DTO
 */

class ChatRoomDTO {
    /**
     * @param {string} roomId - 방 ID
     * @param {string} roomName - 방 이름
     * @param {string} roomType - 방 타입 ('group' 또는 'challenge')
     */
    constructor(roomId, roomName, roomType) {
      this.roomId = roomId;
      this.roomName = roomName;
      this.roomType = roomType;
    }
  }
  
  module.exports = ChatRoomDTO;