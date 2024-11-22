class CreateChatRoomDTO {
  /**
   * @param {string} roomName - 방 이름
   * @param {string} type - 방 타입 ('group' 또는 'challenge')
   * @param {Array.<string>} participants - 참여자 ID 목록
   */
  constructor(roomName, type, participants) {
    this.roomName = roomName;
    this.type = type;
    this.participants = participants;
  }
}

module.exports = CreateChatRoomDTO;