/**
 * ChatMessage DTO
 * 채팅 메시지에 사용되는 데이터 전송 객체입니다.
 */

class ChatMessageDTO {
  /**
   * @param {string} messageId - 메시지 ID
   * @param {string} roomId - 방 ID
   * @param {string} senderId - 보낸 사람 ID
   * @param {string} content - 메시지 내용
   * @param {string} type - 메시지 타입 ('text' 또는 'image')
   * @param {Date} timestamp - 전송 시간
   */
  constructor(messageId, roomId, senderId, content, type, timestamp) {
    this.messageId = messageId;
    this.roomId = roomId;
    this.senderId = senderId;
    this.content = content;
    this.type = type;
    this.timestamp = timestamp;
  }
}

module.exports = ChatMessageDTO;