const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const sendDiscordNotification = async () => {
    try {
      const fetch = (await import('node-fetch')).default;

      const openingMessages = [
        '채팅 서버: 오세요 오세요 다 오세요 백명 천명 다 오셔도 됩니다',
        '채팅 서버 오픈 중 ( ˘ω˘ )',
        '채팅 서버 오픈했어요! 작업 빠세 (ง •̀_•́)ง',
        '이거 어디까지 열어둬야 하는 거예요?',
        '채팅 서버 ㅇㅈ? ㅇㅇㅈ~',
        '어? 금지',
        '(대충 채팅 서버 열었다는 알림 문구)',
        '채팅 서버 오픈 테스트입니다. 무시해 주세요.',
        '[ERROR] 채팅 서버 오픈했지롱 한국말은 끝까지 읽어주세요',
        '채팅서버 오픈: 백명 천명 다 올 수 있는 거... 죠?',
        '동네 구멍가게(채팅) 서버 오픈'
      ];
  
      const randomMessage = openingMessages[Math.floor(Math.random() * openingMessages.length)];
  
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `${randomMessage} \nDEV-CHAT-SERVER-URI(be): http://210.183.4.67:8080 \nDEV-CHAT-SERVER-API-DOCS: http://210.183.4.67:8080/api-docs
                   `
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to send Discord notification');
      }
      console.log('Discord notification sent successfully');
    } catch (error) {
      console.error('Error sending Discord notification:', error);
    }
  };

  const sendDiscordShutdownNotification = async () => {
    try {
      const fetch = (await import('node-fetch')).default;
  
      const closingMessages = [
        '채팅 서버 샤따 내림',
        '채팅 서버 내림',
        'DEV 채팅 서버 종료',
        '민첩한 하루 보내세요',
        '채팅 서버 오프라인',
        '끝~'
      ];
  
      const randomMessage = closingMessages[Math.floor(Math.random() * closingMessages.length)];
  
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `${randomMessage}
                   `
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to send Discord shutdown notification');
      }
      console.log('Discord shutdown notification sent successfully');
    } catch (error) {
      console.error('Error sending Discord shutdown notification:', error);
    }
  };


module.exports = {
  sendDiscordNotification,
  sendDiscordShutdownNotification
};