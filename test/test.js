const socket = io('http://210.183.4.67:8080', {
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

let selectedRoom = '';
let rooms = [];
const userId = document.getElementById('user-id').textContent.trim();
console.log('User ID:', userId);

// 알림 메시지 설정 함수
function setAlertMessage(message, isError = false) {
    const alertMessageDiv = document.getElementById('alert-message');
    alertMessageDiv.textContent = message;
    alertMessageDiv.className = isError ? 'alert error' : 'alert';
    
    setTimeout(() => {
        alertMessageDiv.textContent = '';
        alertMessageDiv.className = 'alert';
    }, 3000);
}

// fetch 요청에 타임아웃 추가 함수
function fetchWithTimeout(url, options = {}, timeout = 10000) { // 타임아웃을 10초로 증가
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), timeout)
        )
    ]);
}

// 채팅방 생성 관련 요소 초기화
const createRoomBtn = document.getElementById('create-room-btn');
const createRoomForm = document.getElementById('create-room-form');
const roomForm = document.getElementById('room-form');
const cancelCreateBtn = document.getElementById('cancel-create');

// 채팅방 생성 버튼 클릭 이벤트
createRoomBtn.addEventListener('click', () => {
    createRoomForm.classList.add('show');
    createRoomBtn.style.display = 'none';
});

// 취소 버튼 클릭 이벤트
cancelCreateBtn.addEventListener('click', () => {
    createRoomForm.classList.remove('show');
    createRoomBtn.style.display = 'block';
    roomForm.reset();
});

// 채팅방 생성 폼 제출 이벤트
roomForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomName = document.getElementById('room-name').value;
    const participantsInput = document.getElementById('participants').value;
    const roomType = document.querySelector('input[name="roomType"]:checked').value;
    const participants = participantsInput.split(',').map(p => p.trim()).filter(p => p !== '');

    if (!participants.includes(userId)) {
        participants.push(userId);
    }

    try {
        const response = await fetchWithTimeout('http://210.183.4.67:8080/chat/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': userId
            },
            body: JSON.stringify({
                roomName,
                type: roomType,
                participants
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setAlertMessage('Room created successfully!', false);
        
        createRoomForm.classList.remove('show');
        createRoomBtn.style.display = 'block';
        roomForm.reset();
        
        await fetchChatRooms();

        loadMessages(result.roomId);
    } catch (error) {
        console.error('Error creating room:', error);
        setAlertMessage('Failed to create room. Please try again.', true);
    }
});

// 채팅방 리스트 아이템 생성 함수
function createRoomListItem(room) {
    const li = document.createElement('li');
    li.dataset.roomId = room.roomId;
    const roomInfo = document.createElement('div');
    roomInfo.className = 'room-info';

    const roomTitle = document.createElement('span');
    roomTitle.className = 'room-title';
    roomTitle.textContent = `${room.roomName} (${room.roomType})`;

    const lastMessage = document.createElement('span');
    lastMessage.className = 'last-message';
    if (room.lastMessage) {
        const timestamp = new Date(parseInt(room.lastTimestamp)).toLocaleTimeString();
        lastMessage.textContent = `${room.lastMessage} - ${timestamp}`;
    }

    roomInfo.appendChild(roomTitle);
    roomInfo.appendChild(lastMessage);
    li.appendChild(roomInfo);
    
    if (selectedRoom === room.roomId) {
        li.classList.add('active');
    }
    
    li.onclick = () => loadMessages(room.roomId);
    return li;
}

// 채팅방 목록 가져오기
function fetchChatRooms() {
    const roomType = document.querySelector('input[name="roomType"]:checked').value;
    console.log('Fetching chat rooms for type:', roomType);

    return fetchWithTimeout(`http://210.183.4.67:8080/chat/list/${roomType}`, {
        headers: {
            'user-id': userId
            // 'Content-Type' 헤더 제거
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received chat rooms:', data);
        rooms = data;
        const roomList = document.getElementById('room-list');
        roomList.innerHTML = '';

        if (rooms.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No chat rooms available';
            roomList.appendChild(emptyMessage);
        } else {
            rooms.forEach(room => {
                roomList.appendChild(createRoomListItem(room));
            });
        }
    })
    .catch(error => {
        console.error('Error fetching chat rooms:', error);
        setAlertMessage('Failed to fetch chat rooms. Please try again.', true);
    });
}

// 메시지 표시 함수
function displayMessage(msg, isOwn = false) {
    const messageList = document.getElementById('messages');
    const li = document.createElement('li');
    li.className = isOwn ? 'message own' : 'message';
    li.dataset.messageId = msg.id;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const sender = document.createElement('span');
    sender.className = 'sender';
    sender.textContent = isOwn ? 'You' : msg.userId;

    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = msg.message;

    const time = document.createElement('span');
    time.className = 'time';
    const messageTime = new Date(typeof msg.timestamp === 'string' ? 
        Date.parse(msg.timestamp) : msg.timestamp);
    time.textContent = messageTime.toLocaleTimeString();

    messageContent.appendChild(sender);
    messageContent.appendChild(text);
    messageContent.appendChild(time);
    li.appendChild(messageContent);
    messageList.appendChild(li);

    messageList.scrollTop = messageList.scrollHeight;
}

// 메시지 로드
async function loadMessages(roomId) {
    selectedRoom = roomId;
    
    try {
        const response = await fetchWithTimeout(`http://210.183.4.67:8080/chat/message/${roomId}`, {
            headers: {
                'user-id': userId
                // 'Content-Type' 헤더 제거
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const messages = await response.json();
        const messageList = document.getElementById('messages');
        messageList.innerHTML = '';
        
        if (Array.isArray(messages)) {
            messages.forEach(msg => {
                displayMessage(msg, msg.userId === userId);
            });
        }

        socket.emit('joinRoom', roomId);

        document.querySelectorAll('#room-list li').forEach(li => {
            li.classList.remove('active');
            if (li.dataset.roomId === roomId) {
                li.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        setAlertMessage('Failed to load messages. Please try again.', true);
    }
}

// 메시지 전송 이벤트 리스너
document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    const messageInput = document.getElementById('input');
    const message = messageInput.value.trim();

    if (!message) return;

    if (selectedRoom) {
        const messageData = {
            roomId: selectedRoom,
            userId,
            message,
            timestamp: new Date().toISOString(),
            type: 'text'
        };

        socket.emit('chat message', messageData);
        
        displayMessage({
            ...messageData,
            id: Date.now().toString()
        }, true);
        
        messageInput.value = '';
    } else {
        setAlertMessage('Please select a chat room first!', true);
    }
});

// 소켓 이벤트 리스너
socket.on('chat message', function(msg) {
    if (msg.roomId === selectedRoom && msg.userId !== userId) {
        if (!msg.id) {
            msg.id = Date.now().toString();
        }
        displayMessage(msg);
    }
});

socket.on('connect', () => {
    console.log('Connected to server');
    fetchChatRooms();
    
    if (selectedRoom) {
        socket.emit('joinRoom', selectedRoom);
        loadMessages(selectedRoom);
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    setAlertMessage('Connection lost. Reconnecting...', true);
});

socket.on('reconnecting', (attempt) => {
    console.log(`Reconnection attempt ${attempt}`);
    setAlertMessage(`Reconnecting... (Attempt ${attempt})`);
});

socket.on('reconnect_failed', () => {
    console.error('Reconnection failed');
    setAlertMessage('Failed to reconnect. Please refresh the page.', true);
});

// 초기화
window.addEventListener('load', fetchChatRooms);

// 채팅방 타입 변경 이벤트
document.getElementById('group').addEventListener('change', fetchChatRooms);
document.getElementById('challenge').addEventListener('change', fetchChatRooms);