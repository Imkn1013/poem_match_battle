const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// CORS設定（Render等にデプロイした際、どこからでも接続できるようにする設定）
const io = new Server(server, {
    cors: { origin: "*" }
});

// 静的ファイルの提供（フロントエンドのHTMLを配置する場合）
app.use(express.static(path.join(__dirname, 'public')));

// メモリ上に詩のデータを保持（サーバーを再起動するとリセットされます）
let poems = [
    { id: 1, area: '兵庫・但馬エリア', author: '北国トラベラー', title: '霧の町', content: '朝もやに 消えゆく円山\n人知れず\nそっと目覚める 白い街並み', votes: 5, timestamp: '2026-06-20 10:00' },
    { id: 2, area: '東京・下町エリア', author: '路地裏猫', title: '夕焼けと路地', content: '西日差す 長い影踏み\n下町の\n豆腐のラッパ 遠く響けり', votes: 3, timestamp: '2026-06-20 11:30' }
];

io.on('connection', (socket) => {
    console.log('ユーザーが接続しました:', socket.id);

    // 接続した瞬間に、現在のすべての詩のデータをその人に送る
    socket.emit('init_poems', poems);

    // 新しい詩が投稿されたときの処理
    socket.on('new_poem', (data) => {
        const newPoem = {
            id: Date.now(),
            area: data.area,
            author: data.author,
            title: data.title,
            content: data.content,
            votes: 0,
            timestamp: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        };
        poems.push(newPoem);
        // 接続している「全員」に新しい詩のリストをブロードキャスト
        io.emit('update_poems', poems);
    });

    // 投票（逸品なり！）されたときの処理
    socket.on('vote_poem', (id) => {
        const target = poems.find(p => p.id === id);
        if (target) {
            target.votes += 1;
            // 接続している「全員」に最新のリスト（投票数更新済み）をブロードキャスト
            io.emit('update_poems', poems);
        }
    });

    socket.on('disconnect', () => {
        console.log('ユーザーが切断しました:', socket.id);
    });
});

// ポート番号の設定（Renderなどの環境変数に対応）
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
});