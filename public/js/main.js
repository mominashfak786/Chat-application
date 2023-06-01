(function ($) {

	"use strict";

	var fullHeight = function () {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function () {
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
		$('#sidebar').toggleClass('active');
	});

})(jQuery);


// =========== start Dynamic chat app script ==================

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

const userData = JSON.parse(getCookie('user'));
// console.log('Cookie Data', userData);

var sender_id = userData._id;
var receiver_id;
var global_group_id;

var socket = io('/user-namespace', {
	auth: {
		token: userData._id
	}
})
$(document).ready(function () {


	$('.user-list').click(function () {

		var userId = $(this).attr('data-id')
		receiver_id = userId
		$('.start-head').hide();
		$('.chat-section').show();

		socket.emit('existsChat', { sender_id: sender_id, receiver_id: receiver_id });
	})

})

socket.on('getOnlineUser', function (data) {
	$('#' + data.user_id + '-status').text('Online');
	$('#' + data.user_id + '-status').removeClass('offline-status');
	$('#' + data.user_id + '-status').addClass('online-status');

})
socket.on('getOfflineUser', function (data) {
	$('#' + data.user_id + '-status').text('Offline');
	$('#' + data.user_id + '-status').addClass('offline-status');
	$('#' + data.user_id + '-status').removeClass('online-status');


})

$('#chat-form').submit(function (event) {
	console.log('hi')
	event.preventDefault();
	var message = $('#message').val();

	console.log(receiver_id);
	$.ajax({
		url: '/save-chat',
		type: 'POST',
		data: { sender_id: sender_id, receiver_id: receiver_id, message: message },
		success: function (response) {

			if (response.success) {
				$('#message').val('')
				let chat = response.data.message;
				let html = `<div class="current-user-chat" id='` + response.data._id + `'>
                         <h5><span>`+ chat + `</span>
                            <i class="fa fa-trash" aria-hidden="true"  data-id = '`+ response.data._id + `' data-toggle="modal" data-target="#deleteChatModal"></i>
                            <i class="fa fa-edit" aria-hidden="true"  data-id = '`+ response.data._id + `' data-msg=' ` + chat + `' data-toggle="modal" data-target="#editChatModal"></i> 
                            </h5>
                        </div>`
				$('#chat-container').append(html)
				socket.emit('newChat', response.data)
				scrollChat();

			} else {
				alert(data.message)
			}
		}

	})
	// scrollChat();

});

socket.on('loadNewChat', function (data) {
	if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
		let html = `<div class="distance-user-chat" id='` + data._id + `'>
                         <h5><span>`+ data.message + `</span></h5>
                        </div>`
		$('#chat-container').append(html)
	}
	scrollChat();
});

socket.on('loadChats', function (data) {

	$('#chat-container').html('')

	var chats = data.chats;

	let html = ''

	for (let x = 0; x < chats.length; x++) {
		let addClass = 'distance-user-chat'

		if (chats[x]['sender_id'] == sender_id) {
			addClass = 'current-user-chat'
		}

		html +=
			`<div class="` + addClass + `" id="` + chats[x]['_id'] + `">
                         <h5><span>`+ chats[x]['message'] + `</span>`;

		if (chats[x]['sender_id'] == sender_id) {
			html += `<i class="fa fa-trash" aria-hidden="true"  data-id = '` + chats[x]['_id'] + `' data-toggle="modal" data-target="#deleteChatModal"></i>
                    <i class="fa fa-edit" aria-hidden="true"  data-id = '`+ chats[x]['_id'] + `' data-msg=' ` + chats[x]['message'] + `' data-toggle="modal" data-target="#editChatModal"></i> 
                    `

		}

		html += `</h5>
                        </div>`
	}
	$('#chat-container').append(html);

	scrollChat()

})

function scrollChat() {
	$('#chat-container').animate({
		scrollTop: $('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
	}, 0)
}


$(document).on('click', '.fa-trash', function () {
	let msg = $(this).parent().text();
	console.log('jai')
	$('#delete-message').text(msg)
	console.log($(this).attr('data-id'))
	$('#delete-message-id').val($(this).attr('data-id'));


})
$('#delete-chat-form').submit(function (event) {
	event.preventDefault();

	var id = $('#delete-message-id').val()
	console.log('hello')
	$.ajax({
		url: '/delete-chat',
		type: 'POST',
		data: { id: id },
		success: function (res) {
			if (res.success) {
				$('#' + id).remove();
				$('#deleteChatModal').modal('hide')
				socket.emit('chatDeleted', id);

			} else {
				alert(res.msg)
			}
		}
	})

})
socket.on('chatMessageDeleted', function (id) {
	$('#' + id).remove();
})

$(document).on('click', '.fa-edit', function () {


	$('#edit-message-id').val($(this).attr('data-id'));
	$('#update-message').val($(this).attr('data-msg'));


})
$('#update-chat-form').submit(function (event) {
	event.preventDefault();

	var id = $('#edit-message-id').val()
	var msg = $('#update-message').val()
	console.log(id)
	$.ajax({
		url: '/update-chat',
		type: 'POST',
		data: { id: id, message: msg },
		success: function (res) {
			if (res.success) {
				$('#editChatModal').modal('hide')
				$('#' + id).find('span').text(msg)
				$('#' + id).find('.fa-edit').attr('data-msg', msg)
				socket.emit('chatUpdated', { id: id, message: msg });


			} else {
				alert(res.msg)
			}
		}
	})

})
socket.on('chatMessageUpdated', function (data) {
	$('#' + data.id).find('span').text(data.message)
});


//========= add members ==========
$('.addMember').click(function () {
	var id = $(this).attr('data-id');
	var limit = $(this).attr('data-limit');

	$('#group_id').val(id);
	$('#limit').val(limit);

	$.ajax({
		url: '/get-members',
		type: "POST",
		data: { group_id: id },
		success: function (res) {
			if (res.success == true) {
				let users = res.data;
				let html = '';
				for (let i = 0; i < users.length; i++) {
					let isMemberOfGroup = users[i]['member'].length > 0 ? true : false;

					html += `
					<tr>
					   <td>
					      <input type="checkbox" `+ (isMemberOfGroup ? 'checked' : '') + `  name="members[]" value = "` + users[i]['_id'] + `" />
					   </td >
						<td>`+ users[i]['name'] + `</td>
					</tr >
						`;
				}
				$('.addMembersInTable').html(html);
			}
			else {
				alert(res.msg);
			}
		}
	})
})

// ======== add member form ========
$('#add-member-form').submit(function (event) {
	event.preventDefault();

	var formData = $(this).serialize();

	$.ajax({
		url: "/add-members",
		type: "POST",
		data: formData,
		success: function (res) {
			if (res.success) {
				$('#memberModal').modal('hide');
				$('#add-member-form')[0].reset();
				alert(res.msg);
			}
			else {
				$('#add-member-error').text(res.msg);
				setTimeout(() => {
					$('#add-member-error').text('');
				}, 3000);
			}
		}
	})
});

//update group

$('.updateMember').click(function () {
	var obj = JSON.parse($(this).attr('data-obj'));
	$('#update_group_id').val(obj._id)
	$('#last_limit').val(obj.limit)
	$('#group_name').val(obj.name)
	$('#group_limit').val(obj.limit)

})

$('#updateChatGroupForm').submit(function (e) {
	e.preventDefault();
	console.log(this)
	$.ajax({
		url: '/update-chat-group',
		type: 'POST',
		data: new FormData(this),
		contentType: false,
		cache: false,
		processData: false,
		success: function (res) {
			alert(res.msg)
			if (res.success) {
				location.reload();
			}

		}
	})
})

$('.deleteGroup').click(function () {

	$('#delete_group_id').val($(this).attr('data-id'));
	$('#delete_group_name').text($(this).attr('data-name'));

})


$('#deleteChatGroupForm').submit(function (e) {

	e.preventDefault();

	var fromData = $(this).serialize();
	console.log('HI')
	$.ajax({
		url: '/delete-chat-group',
		type: 'POST',
		data: fromData,
		success: function (res) {
			alert(res.msg);
			if (res.success) {
				location.reload();
			}
		}




	})

})

$('.copy').click(function () {

	$(this).prepend('<span class ="copied_text">Copied</span>');

	var group_id = $(this).attr('data-id')
	var url = window.location.host + '/share-group/' + group_id;

	var temp = $("<input>")
	$("body").append(temp)
	temp.val(url).select()
	document.execCommand('copy')
	temp.remove();
	setTimeout(() => {
		$('.copied_text').remove();
	}, 2000)

})

// join group script ==============
$('.join-now').click(function () {
	$(this).text('Joining....');
	$(this).attr('disabled', 'disabled');

	var group_id = $(this).attr('data-id');

	$.ajax({
		url: "/join-group",
		type: "POST",
		data: { group_id: group_id },
		success: function (res) {
			alert(res.msg);
			if (res.success) {
				location.reload();
			}
			else {

				$(this).text('Join Now');
				$(this).removeAttr('disabled');
			}
		}
	})
});

// ============ group chat script ===========
function scrollGroupChat() {
	$('#group-chat-container').animate({
		scrollTop: $('#group-chat-container').offset().top + $('#group-chat-container')[0].scrollHeight
	}, 0)
}

$('.group-list').click(function () {
	$('.group-start-head').hide();
	$('.group-chat-section').show();

	global_group_id = $(this).attr('data-id');

	loadGroupChats();
})

$('#group-chat-form').submit(function (event) {
	console.log('hi')
	event.preventDefault();
	var message = $('#group-message').val();

	console.log(receiver_id);
	$.ajax({
		url: '/group-chat-save',
		type: 'POST',
		data: { sender_id: sender_id, group_id: global_group_id, message: message },
		success: function (response) {

			if (response.success) {
				$('#group-message').val('')
				let message = response.chat.message;
				let html = `<div class="current-user-chat" id='` + response.chat._id + `'>
                         <h5><span>`+ message + `</span>
                             
                            </h5>`;

				var date = new Date(response.chat.createdAt);
				let cDate = date.getDate();
				let cMonth = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1);
				let cYear = date.getFullYear();
				let fullDate = cDate + '/' + cMonth + '/' + cYear;

				html += `
				<div class="user-data"><b>Me </b>`+ fullDate + `</div>
                        </div>`;
				$('#group-chat-container').append(html)
				socket.emit('newGroupChat', response.chat)

				scrollGroupChat();
			} else {
				alert(data.message)
			}
		}

	})
	// scrollChat();

});


socket.on('loadNewGroupChat', function (data) {
	if (global_group_id == data.group_id) {
		let html = `<div class="distance-user-chat" id='` + data._id + `'>
                         <h5><span>`+ data.message + `</span>
                           </h5>`;

		var date = new Date(data.createdAt);
		let cDate = date.getDate();
		let cMonth = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1);
		let cYear = date.getFullYear();
		let fullDate = cDate + '/' + cMonth + '/' + cYear;


		html += `
		    <div class="user-data">
				<img src="`+ data.sender_id.image + `" class="user-chat-image"/>
				<b>`+ data.sender_id.name + `  </b>` + fullDate + `
			</div>
        </div>`;
		$('#group-chat-container').append(html)
		scrollGroupChat();
	}
})

function loadGroupChats() {
	$.ajax({
		url: '/load-group-chats',
		type: "POST",
		data: { group_id: global_group_id },
		success: function (res) {
			if (res.success) {
				var chats = res.chats;
				var html = '';
				for (let i = 0; i < chats.length; i++) {
					let className = 'distance-user-chat';

					if (chats[i]['sender_id']._id == sender_id) {
						className = 'current-user-chat';
					}
					html += `<div class='` + className + `' id='` + chats[i]['_id'] + `'>
                         <h5><span>`+ chats[i]['message'] + `</span>`;
					html += `
						 </h5>`;

					var date = new Date(chats[i]['createdAt']);
					let cDate = date.getDate();
					let cMonth = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1);
					let cYear = date.getFullYear();
					let fullDate = cDate + '/' + cMonth + '/' + cYear;

					if (chats[i]['sender_id']._id == sender_id) {
						html += `
							  <div class="user-data"><b>Me </b>`+ fullDate + `</div>
							`
					}
					else {
						html += `
							  <div class="user-data">
							  <img src="`+ chats[i]['sender_id'].image + `" class="user-chat-image"/>
							  <b>`+ chats[i]['sender_id'].name + `  </b>` + fullDate + `
							  </div>
							`
					}

					html += `

                        </div>`;
				}
				$('#group-chat-container').html(html);
				scrollGroupChat();
			}
			else {
				alert(res.msg);
			}
		}
	})
}