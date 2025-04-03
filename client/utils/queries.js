// // queries.js
// import { gql } from '@apollo/client';

// export const GET_COURSES = gql`
//   query GetCourses {
//     courses {
//       id
//       title
//       instructor
//       description
//       level
//       tags
//       price
//       rating
//       image
//     }
//   }
// `;

// export const GET_MENTORS = gql`
//   query GetMentors {
//     mentors {
//       id
//       name
//       field
//       experience
//       image
//     }
//   }
// `;


// export const GET_TRAINERS = gql`
//   query GetMentors {
//     trainers {
//       id
//       name
//       field
//       experience
//       image
//     }
//   }
// `;


// queries.js
import { gql } from '@apollo/client';

export const GET_HOME_PAGE_DATA = gql`
  query GetHomePageData {
    courses {
      id
      title
      instructor
      description
      level
      tags
      price
      rating
      image
    }
    mentors {
      id
      name
      field
      experience
      image
    }
    trainers {
      id
      name
      field
      experience
      image
    }
  }
`;
