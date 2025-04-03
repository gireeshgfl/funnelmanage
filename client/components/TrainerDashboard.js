import React from 'react';
import { Container, Button, Grid, Header, Icon } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';

const TrainerDashboard = () => {
  return (
    <Container style={{ paddingTop: '20px' }}>
      <Header as="h2" icon textAlign="center">
        <Icon name="user" circular />
        <Header.Content>Trainer Dashboard</Header.Content>
      </Header>
      <Grid columns={3} stackable textAlign="center">
        <Grid.Row>
          <Grid.Column>
            <Button primary fluid size="large">
              Registration as a Trainer
            </Button>
          </Grid.Column>
          <Grid.Column>
            <Button primary fluid size="large">
              Generation of Session Links
            </Button>
          </Grid.Column>
          <Grid.Column>
            <Button primary fluid size="large">
              Creating and Assigning MCQs
            </Button>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Button primary fluid size="large">
              Assigning Points to Correct Answers
            </Button>
          </Grid.Column>
          <Grid.Column>
            <Button primary fluid size="large">
              Sending Course Offers
            </Button>
          </Grid.Column>
          <Grid.Column>
            <Button primary fluid size="large">
              Managing Courses and Offers
            </Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
};

export default TrainerDashboard;
