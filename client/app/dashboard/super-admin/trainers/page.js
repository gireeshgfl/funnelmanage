"use client";
import { useState, useEffect } from "react";
import 'semantic-ui-css/semantic.min.css';
import { Button, Container, Header, Icon, Message, Table } from "semantic-ui-react";
import { API_ROUTES } from '@/config';

export default function Home() {
  const [trainers, setTrainers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ROUTES.SUPER_ADMIN_SERVICE.GET_TRAINERS, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Error fetching trainers: ${response.statusText}`);
      }
      const data = await response.json();
      setTrainers(data.data);
    } catch (error) {
      console.error("Error fetching trainers:", error);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (trainerId) => {
    try {
      console.log(`Deleting trainer with ID: ${trainerId}`);
      const response = await fetch(API_ROUTES.SUPER_ADMIN_SERVICE.DELETE_TRAINER, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _id: trainerId }),
      });
  
      if (!response.ok) {
        throw new Error(`Error deleting trainer: ${response.statusText}`);
      }
  
      await fetchTrainers();
    } catch (error) {
      console.error('Error deleting trainer:', error);
      setError('An error occurred. Please try again later.');
    }
  };
  
  const handleToggleStatus = async (trainerId, currentStatus) => {
    try {
      console.log(`${currentStatus === 'Active' ? 'Deactivating' : 'Activating'} trainer with ID: ${trainerId}`);
  
      // Prepare the updated trainer object with the new status
      const updatedTrainer = {
        _id: trainerId,
        status: currentStatus === 'Active' ? 'Deactivated' : 'Active',
      };
  
      const response = await fetch(API_ROUTES.SUPER_ADMIN_SERVICE.TRAINER_STATUS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTrainer),
      });
  
      if (!response.ok) {
        throw new Error(`${currentStatus === 'Active' ? 'Error deactivating' : 'Error activating'} trainer: ${response.statusText}`);
      }
  
      // We expect the API to return at least a message.
      const result = await response.json();
      console.log(result.message);
  
      // Update the local trainers state using the status from our updatedTrainer object.
      setTrainers((prevTrainers) =>
        prevTrainers.map((trainer) =>
          trainer._id === trainerId ? { ...trainer, status: updatedTrainer.status } : trainer
        )
      );
    } catch (error) {
      console.error(`${currentStatus === 'Active' ? 'Error deactivating' : 'Error activating'} trainer:`, error);
      setError(`An error occurred while ${currentStatus === 'Active' ? 'deactivating' : 'activating'} the trainer.`);
    }
  };
  
  return (
    <Container style={{ height: "100vh", display: "flex", alignItems: "center" }}>
      <div style={{ width: "50vw" }}>
        {error && (
          <Message negative>
            <Message.Header>Error</Message.Header>
            <p>{error}</p>
          </Message>
        )}
        {isLoading ? (
          <Header as="h3" icon textAlign="center">
            <Icon name="circle notch" loading />
            Loading trainers...
          </Header>
        ) : trainers.length > 0 ? (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {trainers.map((trainer) => (
                <Table.Row key={trainer._id}>
                  <Table.Cell>{trainer.username}</Table.Cell>
                  <Table.Cell>{trainer._id}</Table.Cell>
                  <Table.Cell>
                    <Button icon="trash" color="red" onClick={() => handleDelete(trainer._id)} />
                    <Button
                      icon={trainer.status === 'Active' ? 'ban' : 'check'}
                      color={trainer.status === 'Active' ? 'orange' : 'green'}
                      onClick={() => handleToggleStatus(trainer._id, trainer.status)}
                    >
                      {trainer.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <Message info>
            <Message.Header>No trainers found</Message.Header>
          </Message>
        )}
      </div>
    </Container>
  );
}
