
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const chatsInput = document.getElementById('chats-input');
    const sendBtn = document.getElementById('sendBtn');
    const groupsList = document.getElementById('groups-list');
    const chatsForm = document.getElementById('chats-form')
    const createGroupBtn = document.getElementById('createGroupBtn');
    const groupNameElement = document.getElementById('group-name');
    const chatBox = document.getElementById('chat-box');
    const adminElement = document.getElementById('admin');
    const usersListElement = document.getElementById('users-list');
    const groupMembersListElement = document.getElementById('group-members-list');
    const deleteGroupBtn = document.getElementById('deleteGroupBtn'); 
    const uploadFileBtn = document.getElementById('uploadFile');


    let loggedInUser = '';
    let currentGroupId = localStorage.getItem('currentGroupId');

    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        loggedInUser = payload.name;
        adminElement.textContent = `Welcome, ${loggedInUser}`;
    } else {
        window.location.href = '../login/login.html';
        return;
    }
   

    if (currentGroupId) {
        fetchMessages(currentGroupId);
        fetchGroupMembers(currentGroupId);
    };

    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('newMessage', (message) => {
        console.log('New message received:', message);
        fetchMessages(currentGroupId);
    });
    
    async function fetchMessages(groupId) {
        try {
            const response = await axios.get(`http://localhost:3000/chat-app/get-chats?groupId=${groupId}`, {headers: { 'Authorization': token }});
            const messages = response.data.slice(-10);
            localStorage.setItem(`group-${groupId}-messages`, JSON.stringify(messages));
            updateChatBox(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            alert('An error occurred while fetching the messages');
        }
    };

    chatsForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const chats = chatsInput.value.trim();

        if (chats && currentGroupId) {
            try {
                const response = await axios.post(`http://localhost:3000/chat-app/add-chats`, { chats: chats, groupId: currentGroupId }, { headers: { 'Authorization': token }});
                const newMessage = response.data.newMessage;
                const messageObject = {
                    text: newMessage.chats,
                    sender: newMessage.User.username || loggedInUser,
                    type: 'text'
                };
                addMessageToChatUi(messageObject);
                saveMessagesToLocalStorage(messageObject, currentGroupId);
                chatsInput.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
                if (error.response && error.response.status === 403) {
                    alert('You are not a member of this group. Cannot send message.');
                } else if (error.response && error.response.status === 404) {
                    alert('Choose a group please..');
                }else{
                    alert('Failed to send message. Please try again.');
                }
            }
        }
    });

    function saveMessagesToLocalStorage(message, groupId) {
        let messages = JSON.parse(localStorage.getItem(`group-${groupId}-messages`)) || [];
        messages.push(message);
        if (messages.length > 10) {
            messages = messages.slice(messages.length - 10);
        }
        localStorage.setItem(`group-${groupId}-messages`, JSON.stringify(messages));
    }
    

    function loadMessagesFromLocalStorage(groupId) {
        const messages = JSON.parse(localStorage.getItem(`group-${groupId}-messages`)) || [];
        messages.forEach(message => addMessageToChatUi(message));
    }
    
    function addMessageToChatUi(message) {
        const messageElement = document.createElement('div');
        const bubbleElement = document.createElement('div');
        
        // Common bubble styles
        bubbleElement.classList.add('p-2', 'mb-2', 'rounded', 'text-white');
        bubbleElement.style.maxWidth = '60%'; // Limit bubble width
        bubbleElement.style.wordWrap = 'break-word'; // Handle long text
    
        if (message.sender === loggedInUser) {
            // Right-aligned message for "You"
            messageElement.classList.add('d-flex', 'justify-content-end'); // Align to right
            bubbleElement.classList.add('bg-secondary'); // Green bubble for "You"
            bubbleElement.innerHTML = `${message.text}<strong> :You</strong >`;
        } else {
            // Left-aligned message for others
            messageElement.classList.add('d-flex', 'justify-content-start'); // Align to left
            bubbleElement.classList.add('bg-primary'); // Blue bubble for others
            bubbleElement.innerHTML = `<strong class="text-capitalize">${message.sender}:</strong> ${message.text}`;
        }
    
        // Check for file messages
        if (message.type === 'file') {
            if (isImageUrl(message.text)) {
                bubbleElement.innerHTML += `
                    <img src="${message.text}" alt="Image" style="max-width: 100%; height: auto; margin-top: 5px;">
                `;
            } else {
                bubbleElement.innerHTML += `
                    <a href="${message.text}" target="_blank" class="text-white">Click to view file</a>
                `;
            }
        }
    
        // Append bubble to the message container
        messageElement.appendChild(bubbleElement);
        chatBox.appendChild(messageElement);
    
        // Scroll to the bottom of the chat
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    
    function isImageUrl(url) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
        return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
    }

    function updateChatBox(messages) {
        chatBox.innerHTML = '';
        const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
    
        function getChatType(chat) {
            if (urlPattern.test(chat)) {
                return 'file';
            } else {
                return 'text';
            }
        }
        
        messages.forEach(message => {
            const sender = message.User && message.User.username ? message.User.username : 'Unknown';
            let messageType = getChatType(message.chats);

            const messageObject = {
                text: message.chats,
                sender: sender,
                type: messageType,
                url: '',
                fileName: ''
            };
            if (messageType === 'url') {
                messageObject.url = message.chats;
            } else if (message.type === 'file') {
                messageObject.type = 'file';
                messageObject.url = message.chats;
                messageObject.fileName = message.fileName;
            }
            addMessageToChatUi(messageObject);
        });
    }


    uploadFileBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        const groupId = currentGroupId;
        const fileInput = document.getElementById('myFile');
        const file = fileInput.files[0];
        if (!file) {
            return alert('Please select a file to upload');
        }
        const formData = new FormData();
        formData.append('myFile', file);
        formData.append('groupId', groupId);
    
        try {
            const response = await axios.post('http://localhost:3000/chat-app/uploadFile', formData, {headers: {'Authorization': token,'Content-Type': 'multipart/form-data' } });
            fileInput.value = ''; 
            const url = response.data.url;
            const fileName = response.data.fileName;
            const messageObject = {
                sender: loggedInUser,
                type: 'file',
                url: url,
                fileName: fileName             
            };
            addMessageToChatUi(messageObject);
            saveMessagesToLocalStorage(messageObject, groupId);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    });
    

    async function fetchUsers() {
        try {
            const response = await axios.get(`http://localhost:3000/user/all-users`, {headers: { 'Authorization': token }});
            const users = response.data.users;
            if (Array.isArray(users)) {
                displayUsers(users);
            } else {
                console.error('Unexpected response format:', response.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            usersListElement.innerHTML = '<p>Failed to load users.</p>';
        }
    }
    

    function displayUsers(users) {
        usersListElement.innerHTML = '';
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.id=`user-${user.id}`;
            userElement.classList.add('text-capitalize')
            userElement.textContent = `${user.username } `;
            const isMember = user.groups ? user.groups.some(group => group.id === currentGroupId) : false;

            if (!isMember) {
                const addButton = document.createElement('button');
                addButton.textContent = 'Add to Group';
                addButton.classList.add('btn', 'btn-primary', 'btn-sm','m-2');
                addButton.addEventListener('click', () => addToGroup(user.id));
                userElement.appendChild(addButton);
            }              
            usersListElement.appendChild(userElement);
        });
    };

    async function addToGroup(userId){
        if(!currentGroupId){
            alert("please select a group");
            return;
        };

        try{
            const response = await axios.post(`http://localhost:3000/groups/add-user`, {groupId:Number(currentGroupId),userId}, {headers: { 'Authorization': token } });
            console.log(response.data)
            if(response.data.success){
                alert('User added to the group successfully.');
                const userElement = document.getElementById(`user-${userId}`);
                if (userElement) {
                    const addButton = userElement.querySelector('.add-to-group-btn');
                    if (addButton) {
                        addButton.remove();
                    }
                }
                fetchGroupMembers(currentGroupId);
            } else {
                alert('Failed to add user to the group.');         
            }
        } catch (error) {
            console.error('Error adding user to the group:', error);
            if (error.response && error.response.status === 403) {
                alert('Only admin can add users to group.');
            } else if (error.response && error.response.status === 400) {
                alert('You are already a member of group.');
            }else{
                alert('An error occurred while adding the user to the group.');
            }
        }
    }

    async function fetchGroupMembers(groupId){
        try{
            const response = await axios.get(`http://localhost:3000/groups/get-group-members/${groupId}`, {headers: { 'Authorization': token }});
            const members = response.data.members;
            displayGroupMembers(members);
        } catch (error) {
            console.error('Error fetching group members:', error);
            groupMembersListElement.innerHTML = '<p>Failed to load group members.</p>';
        }
    };

    function displayGroupMembers(members){
        groupMembersListElement.innerHTML='';
        members.forEach(member => {
            const memberElement = document.createElement('li');
            memberElement.classList.add('list-group-item','text-capitalize')
            memberElement.textContent = `${member.username} `;
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('btn', 'btn-danger','btn-sm','m-2');
            removeBtn.textContent = 'Remove member'; 
            removeBtn.addEventListener('click' , async() => {
                removeMembersFromGroup(currentGroupId,member.id);
            });
            memberElement.appendChild(removeBtn)
            groupMembersListElement.appendChild(memberElement);
        })
    };

    async function removeMembersFromGroup ( groupId , userId) {
        try{
            const response = await axios.delete('http://localhost:3000/groups/remove-member', {headers: { 'Authorization': token } , data:{ groupId,userId }});
            fetchGroupMembers(groupId)
        } catch (error) {
            console.error('Error removing user:', error);
            if (error.response && error.response.status === 403) {
                alert('Only admin can remove users from group.');
            }else if (error.response && error.response.status === 404) {
                alert(' not a member of this group.');
            }
            alert('Unable to removing members from group')
        }
    }

    async function fetchGroups() {
        try {
            const response = await axios.get('http://localhost:3000/groups/get-groups', { headers: { 'Authorization': token } });
            const groups = response.data;
            groupsList.innerHTML = '';
            groups.forEach(group => {
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item','rounded-3');
                listItem.textContent = group.groupName;
                listItem.classList.add('group-item');
                listItem.addEventListener('click', () => {


                    document.querySelectorAll('.group-item').forEach(item => {
                        item.classList.remove('active');
                    });
            
                    listItem.classList.add('active')
                    currentGroupId = group.id;
                    localStorage.setItem('currentGroupId', currentGroupId);
                    groupNameElement.textContent = group.groupName;
                    chatBox.innerHTML = '';
                    loadMessagesFromLocalStorage(group.id);
                    fetchMessages(group.id);
                });
                groupsList.appendChild(listItem);
            });
            if (currentGroupId) {
                const currentGroup = groups.find(group => group.id === parseInt(currentGroupId));
                if (currentGroup) {
                    groupNameElement.textContent = currentGroup.groupName;
                    loadMessagesFromLocalStorage(currentGroupId);
                    fetchMessages(currentGroupId);
                }
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            alert('An error occurred while fetching groups');
        }
    }


    createGroupBtn.addEventListener('click', async () => {
        try {
            const groupName = prompt("Enter group name");
            if (!groupName) return;
            const response = await axios.post('http://localhost:3000/groups/create-group', { groupName }, { headers: { 'Authorization': token } });
            fetchGroups();
        } catch (error) {
            console.error('Error creating group:', error);
            alert("Error creating group!");
        }
    });
    deleteGroupBtn.addEventListener('click', async () => {
        const groupId = currentGroupId;
        if (!groupId) {
            alert('Please select a group to delete.');
            return;
        }
        try{
            const response = await axios.delete(`http://localhost:3000/groups/delete-group/${groupId}`  ,  { headers: { 'Authorization': token } });
            currentGroupId=null;
            localStorage.removeItem('currentGroupId');
            groupNameElement.textContent='';
            groupMembersListElement.innerHTML='';
            chatBox.innerHTML='';
            fetchGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
            alert("Error delting group!");
        }
    })

    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentGroupId');
        window.location.href = '../login/login.html';
    });
    
    fetchGroups();
    fetchUsers()

});
