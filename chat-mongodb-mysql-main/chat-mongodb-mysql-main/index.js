const express = require('express');
const ejs = require('ejs');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', ejs.renderFile);

app.use('/', (req, res) => {
    res.render('index.html');
});

function connectDB() {

    let dbUrl = '';

    mongoose.connect(dbUrl);
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
    mongoose.connection.once('open', function callback(){
        console.log("Atlas mongoDB conectado!");
    });
}

connectDB();

/* Define o model */
let Message = mongoose.model('Message',{ author : String, data_hora : String, message : String});

let messages = [];

/* Recupera as mensagens do banco de dados: */
Message.find({})
    .then(docs=>{
        console.log('DOCS: ' + docs);
        messages = docs;
        console.log('MESSAGES: ' + messages);
    }).catch(err=>{
        console.log(err);
});

/* Cria uma conexão com o socketIO que será usada pela aplicação de chat: */
io.on('connection', socket=>{

    /* Exibe a título de teste da conexão o id do socket do usuário conectado: */
    console.log(`Novo usuário conectado ${socket.id}`);

    /* Recupera e mantem as mensagens do front para back e vice-versa: */
    socket.emit('previousMessage', messages);

    /* Dispara ações quando recebe mensagens do frontend: */
    socket.on('sendMessage', data => {

    /* Adicona uma mensagem enviada no final do array de mensagens: */
    // messages.push(data);
    let message = new Message(data);
    message.save()
        .then(
            socket.broadcast.emit('receivedMessage', data)
        )
        .catch(err=>{
            console.log('ERRO: ' + err);
        });
    /* Propaga a mensagem enviada para todos os usuário conectados na aplicaçao de chat: */
    // socket.broadcast.emit('receivedMessage', data);
    });
})

server.listen(3000, () => {
    console.log('TA RODANDO CARALHO! => http://localhost:3000')
});