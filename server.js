const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

let db;
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

MongoClient.connect('', function (err, client) {
  if (err) { return console.log(err) }
  
  db = client.db('todoapp');

  // db.collection('post').insertOne({이름 : 'John', 나이 : 20, _id : 100}, function (err, res) {
  //   console.log('저장완료');
  // });

  app.listen(8080, function () {
    console.log('listening on 8080');
  });

  
})


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/pet', function (req, res) {
  res.send('펫 용품을 쇼핑할 수 있는 페이지입니다.');
});

app.get('/beauty', function (req, res) {
  res.send('뷰티용품을 쇼핑할 수 있는 페이지입니다.');
});

app.get('/write', function (req, res) {
  res.sendFile(__dirname + '/write.html')
});

app.post('/add', function (req, res) {
  res.send('전송완료');
  db.collection('post').insertOne({제목 : req.body.title, 날짜 : req.body.date }, function (err, res) {
    console.log('저장완료');
  });
});

app.get('/list', function (req, res) {

  db.collection('post').find().toArray(function (err, result) {
    console.log(result)
    res.render('./list.ejs', { posts : result })
  });

});