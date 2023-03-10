const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
const methodsOverride = require('method-override');
app.use(methodsOverride('_method'));

let db;
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

require('dotenv').config();


MongoClient.connect(process.env.DB_URL, function (err, client) {
  if (err) { return console.log(err) }
  db = client.db('todoapp');

  // db.collection('post').insertOne({이름 : 'John', 나이 : 20, _id : 100}, function (err, res) {
  //   console.log('저장완료');
  // });

  app.listen(process.env.PORT, function () {
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

app.get('/list', function (req, res) {

  db.collection('post').find().toArray(function (err, result) {
    console.log(result)
    res.render('./list.ejs', { posts : result })
  });

});

app.get('/edit/:id', function (req, res) {

  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, result) {
    console.log(result)
    res.render('edit.ejs', { data: result });
  });
});

app.get('/detail/:id', function (req, res) {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, result) {
    console.log(result)
    res.render('detail.ejs', { data: result });
  });
});


app.put('/edit', function (req, res) {
  db.collection('post').updateOne({_id : parseInt(req.body.id)}, { $set: {제목:req.body.title, 날짜:req.body.date}}, function (err, result) {
    res.redirect('/list')
  })
})


const passport = require('passport');
const LocalStratgy = require('passport-local');
const session = require('express-session');
const { Passport } = require('passport');

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function (req, res) {
  res.render('login.ejs');
});
app.post('/login', passport.authenticate('local', {
  failureRedirect : '/fail'
}), function(req, res) {
  res.redirect('/')
});

app.get('/mypage', 로그인했니, function (req, res) {
  res.render('mypage.ejs', {사용자 : req.user});
});

function 로그인했니(req, res, next) {
  if (req.user) {
    next()
  } else {
    res.send('로그인안했음')
  }
}

passport.use(new LocalStratgy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

passport.serializeUser(function (user, done) {
  done(null, user.id)
});
passport.deserializeUser(function (아이디, done) {
  db.collection('login').findOne({ id : 아이디 }, function (error, result) {
    done(null, result)
  })
});


app.get('/search', (req, res) => {
  console.log(req.query.value);
  var 검색조건 = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: req.query.value,
          path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 10 },
    // { $project : {제목 : 1, _id: 0, score: {$meta : "searchScore"}}}
  ] 
  db.collection('post').aggregate(검색조건).toArray((err, result) => {
    console.log(result)
    res.render('search.ejs', { posts: result })
  });
});

app.post('/add', function (req, res) {
  let 총게시물갯수 = 0;
  db.collection('counter').findOne({ name: '게시물갯수' }, function (err, result) {
    총게시물갯수 = result.totalPost;

    let 저장할거 = { _id : 총게시물갯수 + 1, 제목 : req.body.title, 날짜 : req.body.date, 작성자 : req.user._id }

    db.collection('post').insertOne(저장할거, function (err, res) {
      console.log('저장완료');
      db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (err, result) {
        if(err){return console.log(err)}
      });
    });
  });
  res.send('전송완료');
});

app.post('/register', (req, res) => {
  db.collection('login').insertOne({ id: req.body.id, pw: req.body.pw }, function (error, result) {
    res.redirect('/')
  });
});

app.delete('/delete', function (req, res) {
  // console.log(req.body)
  req.body._id = parseInt(req.body._id);

  let 삭제할데이터 = {_id : req.body._id, 작성자 : req.user._id}

  db.collection('post').deleteOne(삭제할데이터, function (err, result) {
    console.log('삭제완료');
    res.status(200).send({message : '성공했습니다'});
  })
});

app.use('/shop', require('./routes/shop.js'));
app.use('/board/sub', require('./routes/board.js'));