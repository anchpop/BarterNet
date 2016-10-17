var React = require('react');
var ReactDOM = require('react-dom');

var Alert = require('react-bootstrap').Alert;
var Popover = require('react-bootstrap').Popover;
var Tooltip = require('react-bootstrap').Tooltip;
var Button = require('react-bootstrap').Button;
var Modal = require('react-bootstrap').Modal;
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var InputGroup = require('react-bootstrap').InputGroup;
var InputGroupBtn = require('react-bootstrap').InputGroup.Button;
var Navbar = require('react-bootstrap').Navbar;

var socket = io();

var NameInput = React.createClass({
    _notifyServer: function(event) {
        socket.emit('changeName', {value: event.target.value});
    },
    render: function() {
        return (
            <div className="update-label">
                <input type="text" placeholder="Enter text" onChange={this._notifyServer}/>
            </div>
        );
    }
});

const LoginModal = React.createClass({
    getInitialState() {
        return {showModal: this.props.showModal, canLogin: this.props.show};
    },

    open() {
        this.setState({showModal: true});
    },

    render() {

        return (
            <div>
                <Modal show={this.props.showModal} onHide={this.props.loginHandler}>
                    <Modal.Header closeButton>
                        <Modal.Title>Enter the Barternet!</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form onSubmit={this.props.loginHandler}>
                            <InputGroup >
                                <FormControl type="text" id="nameinp" onChange={this.props.textChecker}/>
                                <InputGroupBtn>
                                    <Button type="submit" disabled={!this.props.canLogin}>Go!</Button>
                                </InputGroupBtn>
                            </InputGroup>
                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        Made by Andre Popovitch
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
});

const MessageForm = React.createClass({
    getInitialState() {
        return {canSubmit: false, message: ""};
    },

    checkTextEntered(e) {
        this.setState({
            message: e.target.value,
            canSubmit: e.target.value.length > 0
        });
    },

    sendMessage: function(event) {
        event.preventDefault();
        socket.emit('sendMessage', {message: $('#chattybar').val()});
        $('#chattybar').val("");
    },

    render() {
        return (
            <footer>
                <form id="chattychat" class="footer" onSubmit={this.sendMessage}>
                    <InputGroup>
                        <FormControl type="text" placeholder="Enter text" id="chattybar" onChange={this.checkTextEntered}/>
                        <InputGroupBtn>
                            <Button id="sendbutton" type="submit" disabled={!this.state.canSubmit}>Send</Button>
                        </InputGroupBtn>
                    </InputGroup>
                </form>
            </footer>
        )
    }
});

var Label = React.createClass({
    _onUpdateLabel: function(data) {
        this.setState({serverValue: data.value});
    },
    getInitialState: function() {
        return {serverValue: ''};
    },
    render: function() {
        return (
            <div class="my-label">
                <h2>{this.state.serverValue}</h2>
            </div>
        )
    }
});

var Message = React.createClass({

    componentDidMount() {
        /*$('html, body').animate({
            scrollTop: $(document).height() - $(window).height()
        }, 1400, "easeOutQuint");*/

    }

    rawMarkup: function() {
        var md = new Remarkable();
        var rawMarkup = md.render(this.props.text.toString());
        return {__html: rawMarkup};
    },

    render: function() {
        return (
            <div className="message">
                <span className="messageAuthor">
                    {this.props.sender}
                </span>
                <span dangerouslySetInnerHTML={this.rawMarkup()} className="messageBody"/>
            </div>
        );
    }
});

var MessageList = React.createClass({
    render() {
        mtoget = [];
        for (var message = 0; message < this.props.messages.length; message++) {
            mtoget.push(<Message key={message} sender={this.props.messages[message].sender} text={this.props.messages[message].text}/>);
        }
        return (
            <div className='messages'>
                {mtoget}
            </div>
        );
    }
});

var ChatApp = React.createClass({

    getInitialState() {
        return {users: [], messages: [], text: '', name: '', showModal: true};
    },

    componentDidMount() {
        socket.on('init', this._initialize);
        socket.on('send:message', this._messageRecieve);
        socket.on('user:join', this._userJoined);
        socket.on('user:left', this._userLeft);
        socket.on('change:name', this._userChangedName);
        socket.on('receiveMessage', this.handleRecieveMessage);

    },

    _initialize(data) {
        var {users, name} = data;
        this.setState({users, user: name});
    },

    _messageRecieve(message) {
        var {messages} = this.state;
        messages.push(message);
        this.setState({messages});
    },

    _userJoined(data) {
        var {users, messages} = this.state;
        var {name} = data;
        users.push(name);
        messages.push({
            user: 'APPLICATION BOT',
            text: name + ' Joined'
        });
        this.setState({users, messages});
    },

    _userLeft(data) {
        var {users, messages} = this.state;
        var {name} = data;
        var index = users.indexOf(name);
        users.splice(index, 1);
        messages.push({
            user: 'APPLICATION BOT',
            text: name + ' Left'
        });
        this.setState({users, messages});
    },

    _userChangedName(data) {
        var {oldName, newName} = data;
        var {users, messages} = this.state;
        var index = users.indexOf(oldName);
        users.splice(index, 1, newName);
        messages.push({
            user: 'APPLICATION BOT',
            text: 'Change Name : ' + oldName + ' ==> ' + newName
        });
        this.setState({users, messages});
    },

    handleMessageSubmit(message) {
        var {messages} = this.state;
        messages.push(message);
        this.setState({messages});
        socket.emit('send:message', message);
    },

    handleChangeName(newName) {
        var oldName = this.state.user;
        socket.emit('change:name', {
            name: newName
        }, (result) => {
            if (!result) {
                return alert('There was an error changing your name');
            }
            var {users} = this.state;
            var index = users.indexOf(oldName);
            users.splice(index, 1, newName);
            this.setState({users, user: newName});
        });
    },

    handleRecieveMessage(data) {
        console.log(data);
        this.setState({messages: this.state.messages.concat(data)});

    },

    login(event) {
        // should check they really put a string in
        this.setState({showModal: false});
        socket.emit('login', {username: this.state.name});
        event.preventDefault();
    },
    checkTextEnteredForLogin(e) {
        this.setState({
            name: $("#nameinp").val(),
            canLogin: $("#nameinp").val().length > 0 && !$("#nameinp").val().includes(" ")
        });
    },

    render() {
        return (
            <div>
                <LoginModal loginHandler={this.login} textChecker={this.checkTextEnteredForLogin} showModal={this.state.showModal} canLogin={this.state.canLogin}/>
                <MessageForm/>
                <MessageList messages={this.state.messages}/>
            </div>
        );
    }
});

ReactDOM.render(
    <ChatApp/>, document.getElementById('container'));
