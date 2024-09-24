const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')("https://multiplayer-xand-o.vercel.app/");
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

const games = new Map();

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('createRoom', (username) => {
        const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
        games.set(roomId, { players: [{ id: socket.id, username }], board: Array(9).fill(null), turn: 0 });
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', ({ roomId, username }) => {
        const game = games.get(roomId);
        if (game && game.players.length < 2) {
            game.players.push({ id: socket.id, username });
            socket.join(roomId);
            io.to(roomId).emit('gameStart', { players: game.players, board: game.board, turn: game.turn });
        } else {
            socket.emit('joinError', 'Room not found or full');
        }
    });

    socket.on('makeMove', ({ roomId, index }) => {
        const game = games.get(roomId);
        if (game && game.players[game.turn].id === socket.id && game.board[index] === null) {
            game.board[index] = game.turn === 0 ? 'X' : 'O';
            game.turn = 1 - game.turn;
            io.to(roomId).emit('updateBoard', { board: game.board, turn: game.turn });

            const winner = checkWinner(game.board);
            if (winner) {
                io.to(roomId).emit('gameOver', { winner });
                games.delete(roomId);
            } else if (!game.board.includes(null)) {
                io.to(roomId).emit('gameOver', { winner: 'draw' });
                games.delete(roomId);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        for (const [roomId, game] of games.entries()) {
            const playerIndex = game.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                io.to(roomId).emit('playerDisconnected');
                games.delete(roomId);
                break;
            }
        }
    });
});

function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));