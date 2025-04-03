import React from 'react';
import { Grid, Card, Button, Input, Message } from 'semantic-ui-react';

const SessionList = ({ sessions, filterType, onEdit, onDelete, onArchive, onUnarchive, onJoin, onActivate }) => {
  if (!sessions || sessions.length === 0) {
    return (
      <Message info>
        <Message.Header>
         {filterType === 'archived' ? "No sessions archived" : "No sessions to display"}
      </Message.Header>
      {filterType !== 'archived' && <p>Please create a new session.</p>}
      </Message>
    );
  }

  return (
    <Grid stackable doubling style={{ margin: '0', padding: '0', width: '100vw' }}>
      {sessions.map((session, index) => (
        <Grid.Column key={index} width={5}>
          <Card
            fluid
            style={{ minHeight: '300px', backgroundColor: session.status === 'Activate' ? '#e0e0e0' : 'white' }}
          >
            <Card.Content>
              <Card.Header>{session.sessionName}</Card.Header>
              <Card.Meta>{session.date} - {session.time}</Card.Meta>
              <Card.Description>
                <strong>Topic:</strong> {session.topic}
                <br />
                <strong>Questions:</strong> {session.questions ? session.questions.map(q => q.name).join(', ') : 'None'}
                <br />
                <strong>Additional Info:</strong> {session.additionalInfo}
              </Card.Description>
            </Card.Content>
            <Card.Content extra>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <Button.Group>
                  <Button icon="edit" color="blue" onClick={() => onEdit(session)} />
                  {session.archive_eligibility === "True" ? (
                    session.archived === "True" ? (
                      <Button icon="reply" color="green" content="Unarchive" onClick={() => onUnarchive(session._id)} />
                    ) : (
                      <Button icon="archive" color="orange" content="Archive" onClick={() => onArchive(session._id)} />
                    )
                  ) : (
                    <Button icon="trash" color="red" onClick={() => onDelete(session._id)} />
                  )}
                  <Button content="Join Session" color="green" onClick={() => onJoin(session._id)} />
                  <Button
                    content={session.status === 'Activate' ? 'Deactivate' : 'Activate'}
                    color={session.status === 'Activate' ? 'red' : 'green'}
                    onClick={() => onActivate(session._id)}
                  />
                </Button.Group>
              </div>
              <Input
                fluid
                value={`http://localhost:3000/funnel-management/dashboard/student/${session._id}`}
                readOnly
                action={{
                  color: 'blue',
                  icon: 'copy',
                  content: 'Copy',
                  onClick: (event) => {
                    navigator.clipboard.writeText(`http://localhost:3000/funnel-management/dashboard/student/${session._id}`);
                    const button = event.target.closest('button');
                    const originalContent = button.textContent;
                    button.textContent = 'Copied!';
                    setTimeout(() => {
                      button.textContent = originalContent;
                    }, 2000);
                  },
                }}
              />
            </Card.Content>
          </Card>
        </Grid.Column>
      ))}
    </Grid>
  );
};

export default SessionList;