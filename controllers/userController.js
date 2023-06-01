const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Group = require('../models/groupModel');
const Member = require('../models/memberModel');
const GroupChat = require('../models/groupChatModel');
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');
const { ObjectId } = require("mongodb");
const registerLoad = async (req, res) => {

    try {

        res.render('register')

    } catch (e) {
        console.log(e.message);
    }


}

const register = async (req, res) => {

    try {

        // console.log(req.body.password);
        const passwordHash = await bcrypt.hash(req.body.password, 10);
        // console.log(passwordHash)
        const user = new User({

            name: req.body.name,
            email: req.body.email,
            image: 'images/' + req.file.filename,
            password: passwordHash

        })

        await user.save()

        res.render('register', { message: 'Successfully register' })

    } catch (e) {
        console.log(e.message);
    }

}

const loadLogin = async (req, res) => {

    try {
        res.render('login')
    }
    catch (e) {
        console.log(e.message);
    }

}

const login = async (req, res) => {

    try {

        const email = req.body.email
        const password = req.body.password;

        const userData = await User.findOne({ email });

        if (userData) {
            const match = await bcrypt.compare(password, userData.password);

            if (match) {
                // console.log(userData)
                req.session.user = userData;
                res.cookie(`user`, JSON.stringify(userData));
                res.redirect('/dashboard');

            }
            else {
                res.render('login', { message: 'Email or Password is incorrect' })
            }


        }
        else {
            res.render('login', { message: 'Email or Password is incorrect' })
        }

    }
    catch (e) {
        console.log(e.message);
    }

}

const logout = async (req, res) => {

    try {
        res.clearCookie('user');
        req.session.destroy();
        res.redirect('/')
    }
    catch (e) {
        console.log(e.message);
    }

}

const loadDashboard = async (req, res) => {

    try {
        const users = await User.find({ _id: { $nin: [req.session.user._id] } })
        res.render('dashboard', { user: req.session.user, users: users });

    }
    catch (e) {
        console.log(e.message);
    }

}

const saveChat = async (req, res) => {
    try {

        var chat = new Chat({
            sender_id: req.body.sender_id,
            receiver_id: req.body.receiver_id,
            message: req.body.message

        })

        const newchat = await chat.save();
        res.status(200).send({ success: true, msg: 'chat inserted!', data: newchat })

    } catch (e) {
        res.status(400).send({ success: false, msg: error.message })
    }
}

const deleteChat = async (req, res) => {

    try {
        const c = await Chat.deleteOne({ _id: req.body.id })
        console.log(c)
        res.status(200).send({ success: true })

    } catch (e) {
        res.status(400).send({ success: false, msg: e.message })
    }

}

const updateChat = async (req, res) => {

    try {
        await Chat.findByIdAndUpdate({ _id: req.body.id }, {
            $set: {
                message: req.body.message
            }
        })
        res.status(200).send({ success: true })

    } catch (e) {
        res.status(400).send({ success: false, msg: e.message })
    }

}

const loadGroups = async (req, res) => {
    try {
        const groups = await Group.find({ creator_id: req.session.user._id });
        res.render('group', { groups: groups });
    }
    catch (e) {
        console.log(e.message);
    }
}

const createGroup = async (req, res) => {
    try {
        const group = new Group({
            creator_id: req.session.user._id,
            name: req.body.name,
            image: 'images/' + req.file.filename,
            limit: req.body.limit
        });

        await group.save();
        const groups = await Group.find({ creator_id: req.session.user._id });

        res.render('group', { message: req.body.name + " Group created successfully!", groups: groups });

    }
    catch (e) {
        console.log(e.message);
    }
}

const getMembers = async (req, res) => {

    try {
        // console.log('error')
        var users = await User.aggregate([
            {
                $lookup: {
                    from: "members",
                    localField: "_id",
                    foreignField: "user_id",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$group_id", new ObjectId(req.body.group_id)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "member"
                }
            },
            {
                $match: {
                    "_id": {
                        $nin: [new ObjectId(req.session.user._id)]
                    }
                }
            }
        ]);
        //var users = await User.find({_id:{$nin :[req.session.user._id]}})
        console.log(req.session.user._id)
        res.status(200).send({ success: true, data: users });

    } catch (e) {
        console.log(e)
        res.status(400).send({ success: false, msg: e.message })
    }

}

const addMembers = async (req, res) => {

    try {
        if (!req.body.members) {
            res.status(200).send({ success: false, msg: "Please select member" });
        }
        else if (req.body.members.length > parseInt(req.body.limit)) {
            res.status(200).send({ success: false, msg: "You can select maximum " + req.body.limit + " members" });
        }
        else {
            await Member.deleteMany({ group_id: req.body.group_id });

            var data = [];
            const members = req.body.members;
            for (let i = 0; i < members.length; i++) {
                data.push({
                    group_id: req.body.group_id,
                    user_id: members[i]
                })
            }

            await Member.insertMany(data);

            res.status(200).send({ success: true, msg: "Members updated successfully!" });
        }


    } catch (e) {
        res.status(400).send({ success: false, msg: e.message })
    }

}

const updateChatGroup = async (req, res) => {

    try {
        console.log(req.body);
        if (parseInt(req.body.limit) < parseInt(req.body.last_limit)) {

            await Member.deleteMany({ group_id: req.body.id })

        }

        var updateObj;
        if (req.file != undefined) {
            updateObj = {
                name: req.body.name,
                image: 'images/' + req.file.filename,
                limit: req.body.limit
            }
        }
        else {
            updateObj = {
                name: req.body.name,
                limit: req.body.limit
            }
        }

        await Group.findByIdAndUpdate({ _id: req.body.id }, {
            $set: updateObj
        })
        res.status(200).send({ success: true, msg: "Group updated successfully!" });
    } catch (e) {
        res.status(400).send({ success: false, msg: e.message })
    }

}

const deleteChatGroup = async (req, res) => {

    try {
        await Group.deleteOne({ _id: req.body.id })
        await Member.deleteMany({ group_id: req.body.id });

        res.status(200).send({ success: true, msg: "Chat Group delete successfully!" });
    }
    catch (e) {
        res.status(400).send({ success: false, msg: e.message })
    }
}

const shareGroup = async (req, res) => {

    try {

        groupData = await Group.findOne({ _id: req.params.id });
        if (!groupData) {
            res.render('error', { message: '404 not found!' })
        }
        else if (req.session.user == undefined) {
            res.render('error', { message: 'you need to login to access the share URL!' })
        }
        else {

            var totalMembers = await Member.find({ group_id: req.params.id }).count();
            var available = groupData.limit - totalMembers;
            var isOwner = groupData.creator_id == req.session.user._id ? true : false;

            var isJoined = await Member.find({ group_id: req.params.id, user_id: req.session.user._id }).count();

            res.render('shareLink', { group: groupData, available: available, totalMembers: totalMembers, isOwner: isOwner, isJoined: isJoined });
        }

    } catch (e) {
        console.log(e.message)
    }


}

const joinGroup = async (req, res) => {

    try {
        const member = new Member({
            group_id: req.body.group_id,
            user_id: req.session.user._id
        });
        await member.save();

        res.status(200).send({ success: true, msg: "You have successfully joined the group." });
    }
    catch (e) {
        res.status(400).send({ success: false, msg: e.message })
    }
}

const groupChats = async (req, res) => {

    try {
        const myGroups = await Group.find({ creator_id: req.session.user._id });
        const joinedGroups = await Member.find({ user_id: req.session.user._id }).populate('group_id');

        res.render('chat-group', { myGroups: myGroups, joinedGroups: joinedGroups });

    }
    catch (e) {
        res.status(400).send({ success: false, msg: e.message })
    }
}

const saveGroupChat = async (req, res) => {

    try {
        var chat = new GroupChat({
            sender_id: req.body.sender_id,
            group_id: req.body.group_id,
            message: req.body.message
        })

        var newChat = await chat.save();

        var cChat = await GroupChat.findOne({ _id: newChat._id }).populate('sender_id');

        res.send({ success: true, chat: cChat });
    }
    catch (e) {
        res.send({ success: false, msg: e.message })
    }
}

const loadGroupChats = async (req, res) => {

    try {
        const groupChats = await GroupChat.find({ group_id: req.body.group_id }).populate('sender_id');

        res.send({ success: true, chats: groupChats });
    }
    catch (e) {
        res.send({ success: false, msg: e.message })
    }
}

module.exports = {
    registerLoad,
    register,
    loadDashboard,
    loadLogin,
    login,
    logout,
    saveChat,
    deleteChat,
    updateChat,
    loadGroups,
    createGroup,
    getMembers,
    addMembers,
    updateChatGroup,
    deleteChatGroup,
    shareGroup,
    joinGroup,
    groupChats,
    saveGroupChat,
    loadGroupChats
}
