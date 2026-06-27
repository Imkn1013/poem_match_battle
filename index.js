require("dotenv").config();//.env ファイルを読み込む
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
//const path = require('path');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://imkn1013.github.io"
  }
});

//.env から安全にURLを読み込んでDBに接続
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Neon接続用の必須セキュリティ設定
});

async function initDB() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS poems (
      id BIGINT PRIMARY KEY,
      author TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      explain TEXT,
      image TEXT,
      votes INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 自動で正確な日時が入る
      latitude DOUBLE PRECISION,   -- 位置情報：緯度（任意）
      longitude DOUBLE PRECISION   -- 位置情報：経度（任意）
      );
    `);
    console.log("データベースの準備が整いました。");
}
initDB().catch(console.error);

app.get('/', (req, res) => {
  res.send("Socket.IO server is running.");
});

io.on("connection", async (socket) => {
  console.log("A client connected:", socket.id);
  
  // 接続時にDBから最新の詩（投票数順）を取得して送る
    try {
        const result = await pool.query('SELECT * FROM poems ORDER BY votes DESC');
        socket.emit('get_poems', "hellow world"/*result.rows*/);
    } catch (err) {
        console.error('初期データ取得失敗:', err);
    }
  
    socket.on('submit', async (data)=>{
      const tosend={
        id: Date.now(),               // 例: 1719420000000 (超長い数字でIDにする)
        author: data.author,
        title: data.title,
        content: data.content,
        explain:data.explain
      };
      try {
        await pool.query(
            'INSERT INTO poems (id, author, title, content, explain) VALUES ($1, $2, $3, $4, $5)',
            [tosend.id, tosend.author, tosend.title, tosend.content, tosend.explain]
        );
        console.log("DBへの保存が成功しました！");
        const result = await pool.query('SELECT * FROM poems ORDER BY votes DESC');
        io.emit('get_poems', result.rows);
      } catch (err) {
        console.error("DBへの保存でエラーが発生しました:", err);
      }
    });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server listening on port 3000');
});
