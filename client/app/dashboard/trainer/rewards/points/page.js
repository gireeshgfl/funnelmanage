"use client";
import React, { useState, useEffect } from 'react';
import { Container, Header, Button, Loader, Table } from 'semantic-ui-react';

const PointsData = () => {
    const [pointsData, setPointsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPoints();
    }, []);

    const fetchPoints = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/trainer_dashboard/get_student_points');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            console.log('API Response:', result);
            if (result.points.status === 'success' && Array.isArray(result.points.data)) {
                setPointsData(result.points.data);
            } else {
                setError('Unexpected data format received');
            }
        } catch (e) {
            setError('Failed to fetch points');
            console.error('There was a problem with the fetch operation: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <Loader active>Loading points...</Loader>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <Container style={{ marginTop: '2em' }}>
            <Header as='h1'>Student Points Data</Header>
            <Button onClick={fetchPoints} primary>Refresh Points</Button>
            <Table celled style={{ marginTop: '2em' }}>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell textAlign='center'>User Name</Table.HeaderCell>
                        <Table.HeaderCell textAlign='center'>Points</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {pointsData.length > 0 ? (
                        pointsData.map((student, index) => (
                            <Table.Row key={index}>
                                <Table.Cell>{student.userName}</Table.Cell>
                                <Table.Cell>{student.totalPoints}</Table.Cell>
                            </Table.Row>
                        ))
                    ) : (
                        <Table.Row>
                            <Table.Cell colSpan="2" textAlign='center'>No Points Data Available</Table.Cell>
                        </Table.Row>
                    )}
                </Table.Body>
            </Table>
        </Container>
    );
};

export default PointsData;