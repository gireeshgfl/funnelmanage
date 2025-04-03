"use client";

import React from 'react';
import Link from 'next/link';
import 'semantic-ui-css/semantic.min.css';
import { Container, Menu, Segment, Header, Button } from 'semantic-ui-react';

const DashboardPage = () => {
  return (
    <div>
      <Container textAlign="center" style={{ marginTop: '3rem' }}>
        <Segment raised style={{ boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)' }}>
          <Header as="h1" style={{ color: 'white', backgroundColor: '#1b1c1d', padding: '1rem' }}>
            Super Admin Dashboard
          </Header>
        </Segment>
      </Container>

      <Container textAlign="center" style={{ marginTop: '3rem' }}>
          <Menu.Menu position="center">
            <Link href="/dashboard/super-admin/trainers" passHref>
              <Button primary style={{ marginRight: '2rem' }}>
                Trainers
              </Button>
            </Link>
            <Link href="/dashboard/super-admin/sub-admin" passHref>
              <Button primary style={{ marginRight: '2rem' }}>
                Sub-Admin
              </Button>
            </Link>
            <Link href="/dashboard/super-admin/trainer-auth" passHref>
              <Button primary style={{ marginRight: '2rem' }}>
                New-Request
              </Button>
            </Link>
            <Link href="/dashboard/super-admin/create-trainer" passHref>
              <Button primary style={{ marginRight: '2rem' }}>
                Create-Trainer
              </Button>
            </Link>
            <Link href="/dashboard/super-admin/settings" passHref>
              <Button primary>Settings</Button>
            </Link>
          </Menu.Menu>
      </Container>
    </div>
  );
};

export default DashboardPage;