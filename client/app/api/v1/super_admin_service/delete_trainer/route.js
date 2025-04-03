import { NextResponse } from 'next/server';

export async function DELETE(req) {
  try {
    const { _id } = await req.json();

    if (!_id) {
      return NextResponse.json({
        status: 'error',
        data: 'Missing required field: _id',
      }, {
        status: 400,
      });
    }

    const flaskApiUrl = `${process.env.API_PATH}/delete_trainer`;
    const response = await fetch(flaskApiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ _id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          status: 'error',
          data: errorData.message || 'Failed to delete trainer',
        },
        {
          status: response.status,
        }
      );
    }

    return NextResponse.json({ message: 'Trainer deleted successfully' });
  } catch (error) {
    console.error('Error deleting trainer:', error);
    return NextResponse.json(
      {
        status: 'error',
        data: 'An unexpected error occurred while deleting the trainer',
      },
      {
        status: 500,
      }
    );
  }
}
