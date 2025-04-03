// StudentList.js

import React from 'react';

const StudentList = ({ students }) => {
  return (
    <div>
      {students.map((student) => (
        <div key={student.id}>
          <img src={student.profilePicture} alt={student.name} />
          <span>{student.name}</span>
        </div>
      ))}
    </div>
  );
};

export default StudentList;
