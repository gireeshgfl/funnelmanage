// Define the API version to allow easy upgrades in the future
const API_VERSION = 'v1';

// Base URL for the API
const BASE_URL = `/funnel-management/api/${API_VERSION}`;

// Environment variables
const HOST_ENDPOINT = process.env.NEXT_PUBLIC_HOST_ENDPOINT;
const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET;

// Exported object containing all API routes organized by service
export const API_ROUTES = {

  // ===========================
  // 1. Host Service
  // ===========================
  HOST: {
    ENDPOINT: HOST_ENDPOINT,
  },
  S3BUCKET: S3_BUCKET,

  // ===========================
  // 2. Authentication Service
  // ===========================
  AUTH_SERVICE: {
    SIGNIN: `${BASE_URL}/auth_service_fun/signin/`,
    SIGNOUT: `${BASE_URL}/auth_service_fun/signout/`,
    REGISTER: `${BASE_URL}/auth_service_fun/register/`,
    USER: `${BASE_URL}/auth_service_fun/user/`,
    GENERATE_OTP: `${BASE_URL}/auth_service_fun/generate_otp/`,
    REFRESH_TOKEN: `${BASE_URL}/auth_service_fun/refresh_token/`,
    VERIFY: `${BASE_URL}/auth_service_fun/verify/`,
    VERIFY_OTP_AND_CHANGE_PASSWORD: `${BASE_URL}/auth_service_fun/verify_otp_and_change_password/`,
    PARTICIPANTS_TOKEN: `${BASE_URL}/auth_service_fun/participants_token/`,
  },

  // ===========================
  // 3. WebSocket Service
  // ===========================
  WEBSOCKET: {
    ENDPOINT: `/api/fv1/socket/`,
  },

  // ===========================
  // 4. Session Service
  // ===========================
  SESSION_SERVICE: {
    GET_SESSIONS: `${BASE_URL}/session_service/get_sessions/`,
    SAVE_SESSIONS: `${BASE_URL}/session_service/save_session/`,
    UPDATE_SESSIONS: `${BASE_URL}/session_service/update_session/`,
    DELETE_SESSIONS: `${BASE_URL}/session_service/delete_session/`,
    GET_POINTS: `${BASE_URL}/session_service/get_points/`,
    SAVE_POINTS: `${BASE_URL}/session_service/save_points/`,
    GET_QUESTION_TOPICS: `${BASE_URL}/session_service/get_question_topics/`,
    GET_QUESTIONS: `${BASE_URL}/session_service/get_questions/`,
    SAVE_PUSHED_QUESTIONS: `${BASE_URL}/session_service/save_pushed_questions/`,
    GET_PUSHED_QUESTIONS: `${BASE_URL}/session_service/get_pushed_questions/`,
    GET_SESSION_STATUS: `${BASE_URL}/session_service/get_session_status/`,
    GET_ACTIVE_SESSION_ID: `${BASE_URL}/session_service/get_active_session_id/`,
    SAVE_MCQ: `${BASE_URL}/session_service/save_mcq/`,
    ADD_PARTICIPANTS: `${BASE_URL}/session_service/add_participants/`,
    GET_PARTICIPANT_SESSIONS: `${BASE_URL}/session_service/get_participant_sessions/`,
    SAVE_SESSION_POINTS: `${BASE_URL}/session_service/save_session_points/`,
    GET_SESSIONS_WITH_QUESTIONS: `${BASE_URL}/session_service/get_sessions_with_questions/`,
    GET_IN_SESSION_QUESTIONS: `${BASE_URL}/session_service/get_in_session_questions/`,
  },

  // ===========================
  // 5. Question Service
  // ===========================
  QUESTION_SERVICE: {
    GET_QUESTIONS: `${BASE_URL}/question_service/get_questions/`,
    SAVE_QUESTIONS: `${BASE_URL}/question_service/save_questions/`,
    DELETE_QUESTION: `${BASE_URL}/question_service/delete_question/`,
    UPDATE_QUESTION: `${BASE_URL}/question_service/update_question/`,
    GET_TOPICS: `${BASE_URL}/question_service/get_topics/`,
    SAVE_TOPIC: `${BASE_URL}/question_service/save_topic/`,
    DELETE_TOPIC: `${BASE_URL}/question_service/delete_topic/`,
    UPDATE_TOPIC: `${BASE_URL}/question_service/update_topic/`,
    GET_PARTICIPANTS: `${BASE_URL}/question_service/get_participants/`,
  },

  // ===========================
  // 6. Chat Service
  // ===========================
  CHAT_SERVICE: {
    SAVE_CHAT: `${BASE_URL}/chat_service/save_chat/`,
    FETCH_CHAT: `${BASE_URL}/chat_service/fetch_chat/`,
    DELETE_CHAT: `${BASE_URL}/chat_service/delete_chat/`,
  },

  // ===========================
  // 7. Super Admin Service
  // ===========================
  SUPER_ADMIN_SERVICE: {
    GET_TRAINERS: `${BASE_URL}/super_admin_service/get_trainers/`,
    DELETE_TRAINER: `${BASE_URL}/super_admin_service/delete_trainer/`,
    TRAINER_STATUS: `${BASE_URL}/super_admin_service/trainer_status/`,
  },

  // ===========================
  // 8. Funnel Service
  // ===========================
  FUNNEL_SERVICE: {
    SAVE_PARTICIPANTS: `${BASE_URL}/funnel_service/save_participants/`,
    GET_PARTICIPANTS: `${BASE_URL}/funnel_service/get_participants/`,
    FUNNELLING: `${BASE_URL}/funnel_service/funnelling/`,
    GET_GROUPS: `${BASE_URL}/funnel_service/get_groups/`,
    SAVE_GROUP: `${BASE_URL}/funnel_service/save_group/`,
  },

  // ===========================
  // 9. Media Service
  // ===========================
  MEDIA_SERVICE: {
    UPLOAD: `${BASE_URL}/media_service/upload/`,
    REPLACE_COURSE_IMAGE: `${BASE_URL}/media_service/replace_course_image/`,
  },

  // ===========================
  // 10. Video Service
  // ===========================
  VIDEO_SERVICE: {
    CONVERT_TO_HLS: `${BASE_URL}/video_service/convert_to_hls/`,
  },
};
