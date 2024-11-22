/**
 * CreateChallengeRoom DTO
 * 챌린지 채팅방 생성 요청 DTO
 */

class CreateChallengeRoomDTO {
  /**
   * @param {string} roomName - 방 이름
   * @param {string} type - 방 타입
   * @param {string} owner - 방 소유자 ID
   */
  constructor(roomName, type, owner) {
    this.roomName = roomName;
    this.type = type;
    this.owner = owner;
  }
}

module.exports = CreateChallengeRoomDTO;