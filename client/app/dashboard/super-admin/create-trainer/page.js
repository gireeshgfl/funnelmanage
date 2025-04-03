'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Header, Button, Form, Message } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css';
import { useFormik } from 'formik';
import * as Yup from 'yup';

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverErrorMessage, setServerErrorMessage] = useState('');

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().required('Password is required'),
      phone: Yup.string().matches(/^[0-9]*$/, 'Phone number should only contain digits').max(10, 'Phone number should be 10 digits').min(10, 'Phone number should be 10 digits').required('Phone number is required'),
    }),
    onSubmit: async (values) => {
      // Hardcode role as 'trainer'
      values.role = 'trainer';

      // Set status to 'Active'
      values.status = 'Active';

      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/sign_up', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        if (response.ok) {
          // Redirect the user to the desired page after successful sign up
          router.push('/super-admin/dashboard');
        } else {
          const errorData = await response.json();
          setServerErrorMessage(errorData.data);
        }
      } catch (error) {
        console.error(error);
        setServerErrorMessage('An unexpected error occurred while creating user. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
     <Container text style={{ marginTop: '7em' }}>
      <Header as="h1">Create Trainer</Header>
      {serverErrorMessage && (
        <Message negative>
          <Message.Header>Error</Message.Header>
          <p>{serverErrorMessage}</p>
        </Message>
      )}
      <Form onSubmit={formik.handleSubmit}>
        <Form.Field>
          <label>Name</label>
          <input
            id="name"
            name="name"
            placeholder="Name"
            value={formik.values.name}
            onChange={formik.handleChange}
          />
          {formik.touched.name && formik.errors.name && (
            <Message negative>{formik.errors.name}</Message>
          )}
        </Form.Field>
        <Form.Field>
          <label>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
          />
          {formik.touched.email && formik.errors.email && (
            <Message negative>{formik.errors.email}</Message>
          )}
        </Form.Field>
        <Form.Field>
          <label>Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            value={formik.values.password}
            onChange={formik.handleChange}
          />
          {formik.touched.password && formik.errors.password && (
            <Message negative>{formik.errors.password}</Message>
          )}
        </Form.Field>
        <Form.Field>
          <label>Phone</label>
          <input
            id="phone"
            name="phone"
            placeholder="Phone number"
            value={formik.values.phone}
            onChange={formik.handleChange}
          />
          {formik.touched.phone && formik.errors.phone && (
            <Message negative>{formik.errors.phone}</Message>
          )}
        </Form.Field>
        <Button type="submit" loading={isLoading} disabled={isLoading}>
          Create Trainer
        </Button>
      </Form>
    </Container>
  );
}
