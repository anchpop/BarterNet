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
var NavItem = require('react-bootstrap').NavItem;
var Nav = require('react-bootstrap').Nav;
var moment = require('moment');

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
            <div className="static-modal">
                <Modal show={this.props.showModal} onHide={this.props.loginHandler}>
                    <Modal.Header>
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
        var mes = $('#chattybar').val()
        if (mes != "") {
            socket.emit('sendMessage', {message: mes});
            $('#chattybar').val("");
        }
    },

    render() {
        return (
            <footer id="MessageForm">
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

var Message = React.createClass({

    getInitialState() {
        return ({time: moment().format('h:mm:ss a').toString()})
    },

    withinScrollThreshold() {
        return ($('html, body').scrollTop() + $('html, body').height() + 200 >= $('html, body')[0].scrollHeight);
    },

    componentDidMount() {
        if (this.withinScrollThreshold()) {
            var page = $('html, body');
            //page.stop(true,true).animate({ scrollTop: page[0].scrollHeight}, 100);
            page.animate({
                scrollTop: page.prop("scrollHeight")
            }, 100);
        }
    },

    rawMarkup: function() {
        var md = new Remarkable({linkify: true, typographer: true});
        var rawMarkup = md.render(this.props.text);
        return {__html: rawMarkup};
    },

    render: function() {
        var classn = "message " + (this.props.readerName == this.props.sender ? "messageFromYou" : "");
        console.log(this.props.sender);
        return (
            <div className={classn}>
                <span className="messageAuthor">
                    <span className="time">{this.state.time}</span>&nbsp; {this.props.sender}: &nbsp;
                </span>
                <span className="messageBody" dangerouslySetInnerHTML={this.rawMarkup()}/>
            </div>
        );
    }
});

var MessageList = React.createClass({
    render() {
        mtoget = [];
        for (var message = 0; message < this.props.messages.length; message++) {
            mtoget.push(<Message key={message} sender={this.props.messages[message].sender} text={this.props.messages[message].text} readerName={this.props.name}/>);
        }
        return (
            <div className='messages' id="MessageList">
                {mtoget}
            </div>
        );
    }
});

var Topbar = React.createClass({
    render() {

        return (
            <Navbar>
                <Navbar.Header>
                     <Navbar.Brand>
                        <img src="/imgs/barter.png" /><a href="#">Barternet!</a>
                    </Navbar.Brand>
                    <Navbar.Toggle/>
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        <NavItem eventKey={1} href="http://owossohigh.mi.oph.schoolinsites.com/?PageName=%27Teachers%27">School staff</NavItem>
                        <NavItem eventKey={2} href="https://ps.owosso.k12.mi.us/public/">Powerschool</NavItem>
                        <Navbar.Text>Current Barterbux: {this.props.bux}</Navbar.Text>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
});

var ChatApp = React.createClass({

    getInitialState() {
        return {
            users: [],
            messages: [],
            text: '',
            name: '',
            showModal: true,
            Barterbux: 0
        };
    },

    componentDidMount() {
        socket.on('init', this._initialize);
        socket.on('send:message', this._messageRecieve);
        socket.on('user:join', this._userJoined);
        socket.on('user:left', this._userLeft);
        socket.on('change:name', this._userChangedName);
        socket.on('receiveMessage', this.handleRecieveMessage);

        $('#MessageList').css("padding-bottom", $('#MessageForm').height() + "px");
    },

    _initialize(data) {
        var {users, name} = data;
        this.setState({users, user: name});
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
                <Topbar bux={this.state.Barterbux}/>
                <LoginModal loginHandler={this.login} textChecker={this.checkTextEnteredForLogin} showModal={this.state.showModal} canLogin={this.state.canLogin}  />
                <MessageForm/>
                <MessageList messages={this.state.messages} name={this.state.name} />
            </div>
        );
    }
});

ReactDOM.render(
    <ChatApp/>, document.getElementById('container'));
