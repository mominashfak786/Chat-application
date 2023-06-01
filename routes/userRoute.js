const express = require('express')
const path = require('path')
const multer = require('multer')
const user_route = express()
const userController = require('../controllers/userController')
const session = require('express-session')
const auth = require('../middlewares/auth')

const { SESSION_SECRET } = process.env
user_route.use(session({ secret: SESSION_SECRET }))


const cookieParser = require("cookie-parser");
user_route.use(cookieParser());

const bodyParser = require('body-parser')

user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({ extended: true }))


user_route.set('view engine', 'ejs');
user_route.set('views', './views');

user_route.use(express.static('public'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'))
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name)
  }
})

const upload = multer({ storage: storage })

user_route.get('/register', auth.isLogout, userController.registerLoad)
user_route.post('/register', upload.single('image'), userController.register)

user_route.get('/', auth.isLogout, userController.loadLogin);
user_route.post('/', userController.login);
user_route.get('/logout', auth.isLogin, userController.logout);

user_route.get('/dashboard', auth.isLogin, userController.loadDashboard);
user_route.post('/save-chat', userController.saveChat)

user_route.post('/delete-chat', userController.deleteChat)
user_route.post('/update-chat', userController.updateChat)

user_route.get('/groups', auth.isLogin, userController.loadGroups);
user_route.post('/groups', upload.single('image'), userController.createGroup);

user_route.post('/get-members', auth.isLogin, userController.getMembers);
user_route.post('/add-members', auth.isLogin, userController.addMembers);
user_route.post('/update-chat-group', upload.single('image'), userController.updateChatGroup);

user_route.post('/delete-chat-group', auth.isLogin, userController.deleteChatGroup);
user_route.get('/share-group/:id', userController.shareGroup);
user_route.post('/join-group', userController.joinGroup);
user_route.get('/group-chat', auth.isLogin, userController.groupChats);
user_route.post('/group-chat-save', userController.saveGroupChat);
user_route.post('/load-group-chats', userController.loadGroupChats);


user_route.get('*', function (req, res) {
  res.redirect('/')
})



module.exports = user_route
