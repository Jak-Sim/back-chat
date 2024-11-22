// dto/DeleteRoom.dto.js

/**
 * DeleteRoom DTO
 * 채팅방 삭제 요청에 사용되는 데이터 전송 객체입니다.
 */
class DeleteRoomDTO {
    /**
     * @param {string} roomId - 삭제할 방 ID (필수)
     */
    constructor(roomId) {
      this.roomId = roomId;
    }
  }
  
  module.exports = DeleteRoomDTO;