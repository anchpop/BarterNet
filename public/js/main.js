'use strict';

var Alert = require('react-bootstrap').Alert;

var ExampleApplication = React.createClass({
  render: function() {
    var elapsed = Math.round(this.props.elapsed  / 100);
    var seconds = elapsed / 10 + (elapsed % 10 ? '' : '.0' );
    var message =
      'React has been successfully running for ' + seconds + ' seconds.';

    return <p>{message}</p>;
  }
});

var start = new Date().getTime();

setInterval(function() {
  ReactDOM.render(
    <ExampleApplication elapsed={new Date().getTime() - start} />,
    document.getElementById('container')
  );
}, 100);

ReactDOM.render(
  <Alert bsStyle="warning">
    <strong>Holy guacamole!</strong> Best check yo self, you're not looking too good.
  </Alert>,
  document.getElementById('mount-point')
);
