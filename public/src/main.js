document.addEventListener('DOMContentLoaded', function () {
    const socket = io("https://multiplayer-xand-o.vercel.app:3000/");
    let username = '';
    let roomId = '';
    let playerSymbol = '';

    // Setup phase elements
    const setupDiv = document.querySelector('.setup');
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.placeholder = 'Enter your username';

    const createUsernameBtn = document.createElement('button');
    createUsernameBtn.textContent = 'Create Username';

    const roomButtons = document.createElement('div');
    roomButtons.style.display = 'none';

    const createRoomBtn = document.createElement('button');
    createRoomBtn.textContent = 'Create Room';

    const joinRoomBtn = document.createElement('button');
    joinRoomBtn.textContent = 'Join Room';

    const roomIdInput = document.createElement('input');
    roomIdInput.type = 'text';
    roomIdInput.placeholder = 'Enter Room ID';
    roomIdInput.style.display = 'none';

    const joinGameBtn = document.createElement('button');
    joinGameBtn.textContent = 'Join Game';
    joinGameBtn.style.display = 'none';

    setupDiv.appendChild(usernameInput);
    setupDiv.appendChild(createUsernameBtn);
    setupDiv.appendChild(roomButtons);
    roomButtons.appendChild(createRoomBtn);
    roomButtons.appendChild(joinRoomBtn);
    setupDiv.appendChild(roomIdInput);
    setupDiv.appendChild(joinGameBtn);

    // Game phase elements
    const main = document.querySelector('.main');
    const tiles = document.querySelector('.tiles');
    const gameModal = document.querySelector('.game-modal');
    const turnIndicator = document.querySelector('.turn-indicator');

    // Create tiles
    for (let i = 0; i < 9; i++) {
        const tile = document.createElement('button');
        tile.classList.add('tile');
        tiles.appendChild(tile);
    }

    createUsernameBtn.addEventListener('click', () => {
        username = usernameInput.value.trim();
        if (username) {
            usernameInput.style.display = 'none';
            createUsernameBtn.style.display = 'none';
            roomButtons.style.display = 'block';
        }
    });

    createRoomBtn.addEventListener('click', () => {
        socket.emit('createRoom', username);
    });

    joinRoomBtn.addEventListener('click', () => {
        roomIdInput.style.display = 'inline-block';
        joinGameBtn.style.display = 'inline-block';
        createRoomBtn.style.display = 'none';
        joinRoomBtn.style.display = 'none';
    });

    joinGameBtn.addEventListener('click', () => {
        roomId = roomIdInput.value.trim().toUpperCase();
        if (roomId) {
            socket.emit('joinRoom', { roomId, username });
        }
    });

    socket.on('roomCreated', (createdRoomId) => {
        roomId = createdRoomId;
        alert(`Room created! Your room ID is: ${roomId}`);
        setupDiv.style.display = 'none';
        main.style.display = 'flex';
    });

    socket.on('joinError', (message) => {
        alert(message);
    });

    socket.on('gameStart', ({ players, board, turn }) => {
        setupDiv.style.display = 'none';
        main.style.display = 'flex';
        playerSymbol = players[0].id === socket.id ? 'X' : 'O';
        updateBoard(board);
        updateTurnIndicator(turn);
    });

    socket.on('updateBoard', ({ board, turn }) => {
        updateBoard(board);
        updateTurnIndicator(turn);
    });

    socket.on('gameOver', ({ winner }) => {
        let message;
        if (winner === 'draw') {
            message = "It's a draw!";
        } else {
            message = winner === playerSymbol ? 'You win!' : 'You lose!';
        }
        showGameOver(message);
    });

    socket.on('playerDisconnected', () => {
        showGameOver('Opponent disconnected. You win!');
    });

    function updateBoard(board) {
        tiles.querySelectorAll('.tile').forEach((tile, index) => {
            if (board[index] === 'X') {
                tile.innerHTML = '<img class="card-face image-back" src="./assets/face.png" alt="card" />';
            } else if (board[index] === 'O') {
                tile.innerHTML = '<img class="card-face image-back" src="./assets/apple.png" alt="card" />';
            } else {
                tile.innerHTML = '';
            }
            tile.disabled = board[index] !== null;
        });
    }

    function updateTurnIndicator(turn) {
        const turnSymbol = turn === 0 ? 'X' : 'O';
        turnIndicator.textContent = `Current turn: ${turnSymbol}`;
    }

    function showGameOver(message) {
        gameModal.querySelector('h4').textContent = 'Game Over!';
        gameModal.querySelector('p').textContent = message;
        gameModal.style.display = 'flex';
    }

    tiles.addEventListener('click', (e) => {
        if (e.target.classList.contains('tile')) {
            const index = Array.from(tiles.children).indexOf(e.target);
            socket.emit('makeMove', { roomId, index });
        }
    });

    gameModal.querySelector('.play-again').addEventListener('click', () => {
        location.reload();
    });
});