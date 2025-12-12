# Importing services from v1 modules

from nameko_services.services.v1.auth_service_fun.auth_service_fun import AuthServiceV1
from nameko_services.services.v1.chat_service.chat_service import ChatService
from nameko_services.services.v1.funnel_service.funnel_service import FunnelService
from nameko_services.services.v1.media_service.media_service import MediaService
from nameko_services.services.v1.question_bank_generation.question_bank_generation import QuestionService
from nameko_services.services.v1.sessions_management.sessions_management import SessionService
from nameko_services.services.v1.super_admin.super_admin import SuperAdminService

# List of all services
services = [
    AuthServiceV1,
    ChatService,
    FunnelService,
    MediaService,
    QuestionService,
    SessionService,
    SuperAdminService,
]
