var React = require('react');
var ReactDOM = require('react-dom');

var Alert = require('react-bootstrap').Alert;
var Popover = require('react-bootstrap').Popover;
var Tooltip = require('react-bootstrap').Tooltip;
var Button = require('react-bootstrap').Button;
var Modal = require('react-bootstrap').Modal;
var OverlayTrigger = require('react-bootstrap').OverlayTrigger;
var FormControl = require('react-bootstrap').FormControl;

var socket = io();

var MessageInput = React.createClass({
    _notifyServer: function(event) {
        socket.emit('client event', {value: event.target.value});
    },
    render: function() {
        return (
            <div className="update-label">
                <input type="text" placeholder="Enter text" onChange={this._notifyServer}/>
            </div>
        );
    }
});

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
        return {showModal: true};
    },

    login() {
        // should check they really put a string in
        this.setState({showModal: false});
        socket.emit('login', {username: $("#nameinp").val()});
        console.log($("#nameinp").val());
    },

    open() {
        this.setState({showModal: true});
    },

    render() {

        return (
            <div>
                <Modal show={this.state.showModal} onHide={this.login} >
                    <Modal.Header closeButton>
                        <Modal.Title>Login!</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <FormControl type="text" value={this.state.value} placeholder="What's your name, kid?" id="nameinp" />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.login}>Login</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
});
ReactDOM.render(<LoginModal />, document.getElementById('login-modal'));

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

var input = ReactDOM.render(
    <div>
    <MessageInput/>
    <br/>
    <NameInput/>
</div>, document.getElementById('mount-point'));
var label = ReactDOM.render(
    <Label/>, document.getElementById('label-mount-point'));
socket.on('update label', function(data) {
    label._onUpdateLabel(data);
});

var Message = React.createClass({
    rawMarkup: function() {
        var md = new Remarkable();
        var rawMarkup = md.render(this.props.children.toString());
        return {__html: rawMarkup};
    },

    render: function() {
        return (
            <div className="message">
                <span className="messageAuthor">
                    {this.props.author}
                </span>
                <span dangerouslySetInnerHTML={this.rawMarkup()} className="messageBody"/>
            </div>
        );
    }
});

var MessageList = React.createClass({
    render() {
        return (
            <div className='messages'>
                <h2>
                    Conversation:
                </h2>
                {this.props.messages.map((message, i) => {
                    return (<Message key={i} user={message.user} text={message.text}/>);
                })
}
            </div>
        );
    }
});

var ChatApp = React.createClass({

    getInitialState() {
        return {users: [], messages: [], text: ''};
    },

    componentDidMount() {
        socket.on('init', this._initialize);
        socket.on('send:message', this._messageRecieve);
        socket.on('user:join', this._userJoined);
        socket.on('user:left', this._userLeft);
        socket.on('change:name', this._userChangedName);

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

    render() {
        return (
            <div>
                <MessageList messages={this.state.messages}/>
                <MessageForm onMessageSubmit={this.handleMessageSubmit} user={this.state.user}/>
                <ChangeNameForm onChangeName={this.handleChangeName}/>
            </div>
        );
    }
});

const alertInstance = (
    <Alert bsStyle="warning">
        <strong>Holy guacamole!</strong>
        Best check yo self, youre not looking too good.
    </Alert>
);
ReactDOM.render(alertInstance, document.getElementById('container'));
