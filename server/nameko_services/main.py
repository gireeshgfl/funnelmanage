# import yaml
# import logging
# import signal
# import sys
# import argparse
# from nameko.runners import ServiceRunner
# from nameko.cli.main import setup_yaml_parser
# from nameko.exceptions import ConfigurationError
# from services.v1.auth_service.auth_service import AuthServiceV1
# from services.v1.profile_service.profile_service import ProfileServiceV1
# from services.v1.academic_service.academic_service import AcademicServiceV1
# from services.v1.notification_activity_service.notification_activity_service import NotificationActivityServiceV1
# from services.v1.other_service.other_service import OtherServiceV1
# from services.v1.approval_service.approval_service import ApprovalServiceV1
# from services.v1.assignment_service.assignment_service import AssignmentServiceV1
# from services.v1.association_service.association_service import AssociationServiceV1
# from services.v1.category_service.category_service import CategoryServiceV1
# from services.v1.classroom_service.classroom_service import ClassroomServiceV1
# from services.v1.course_service.course_service import CourseServiceV1
# from services.v1.institute_service.institute_service import InstituteServiceV1
# from services.v1.meeting_service.meeting_service import MeetingServiceV1
# from services.v1.message_service.message_service import MessageServiceV1
# from services.v1.homepage_service.homepage_service import HomepageServiceV1

# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# def load_config(config_path):
#     """Load configuration from YAML file."""
#     setup_yaml_parser()
#     try:
#         with open(config_path, 'r') as file:
#             return yaml.safe_load(file)
#     except IOError as e:
#         logger.error(f"Error reading config file: {e}")
#         sys.exit(1)
#     except yaml.YAMLError as e:
#         logger.error(f"Error parsing YAML: {e}")
#         sys.exit(1)

# def run_services(config, services):
#     """Run the specified services using the provided configuration."""
#     runner = ServiceRunner(config=config)
    
#     for service in services:
#         runner.add_service(service)
#         logger.info(f"Added service: {service.__name__}")
    
#     def handle_shutdown(signum, frame):
#         logger.info("Received shutdown signal. Stopping services...")
#         runner.stop()
#         sys.exit(0)
    
#     signal.signal(signal.SIGINT, handle_shutdown)
#     signal.signal(signal.SIGTERM, handle_shutdown)
    
#     try:
#         runner.start()
#         logger.info("All services started. Press Ctrl+C to stop.")
#         runner.wait()
#     except ConfigurationError as e:
#         logger.error(f"Configuration error: {e}")
#     except Exception as e:
#         logger.exception(f"Unexpected error occurred: {e}")
#     finally:
#         runner.stop()
#         logger.info("All services stopped.")
    
# def main():
#     parser = argparse.ArgumentParser(description="Run Nameko services with advanced configuration.")
#     parser.add_argument('--config', default='config.yaml', help='Path to the configuration YAML file')
#     parser.add_argument('--debug', action='store_true', help='Enable debug logging')
#     args = parser.parse_args()
    
#     if args.debug:
#         logging.getLogger().setLevel(logging.DEBUG)
    
#     config = load_config(args.config)
    
#     # List of services to run
#     services = [
#         AuthServiceV1,
#         ProfileServiceV1,
#         AcademicServiceV1,
#         NotificationActivityServiceV1,
#         OtherServiceV1,
#         ApprovalServiceV1,
#         AssignmentServiceV1,
#         AssociationServiceV1,
#         CategoryServiceV1,
#         ClassroomServiceV1,
#         CourseServiceV1,
#         InstituteServiceV1,
#         MeetingServiceV1,
#         MessageServiceV1,
#         HomepageServiceV1
#     ]
    
#     run_services(config, services)
    
# if __name__ == '__main__':
#     main()



import eventlet
eventlet.monkey_patch()

import yaml
import logging
import signal
import sys
import argparse
import importlib
import os
import inspect
from nameko.runners import ServiceRunner
from nameko.cli.main import setup_yaml_parser
from nameko.exceptions import ConfigurationError

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_config(config_path):
    """Load configuration from YAML file."""
    setup_yaml_parser()
    try:
        with open(config_path, 'r') as file:
            return yaml.safe_load(file)
    except IOError as e:
        logger.error(f"Error reading config file: {e}")
        sys.exit(1)
    except yaml.YAMLError as e:
        logger.error(f"Error parsing YAML: {e}")
        sys.exit(1)

def run_services(config, services):
    """Run the specified services using the provided configuration."""
    logger.info(config)
    runner = ServiceRunner(config=config)

    for service in services:
        runner.add_service(service)
        logger.info(f"Added service: {service.__name__}")

    def handle_shutdown(signum, frame):
        logger.info("Received shutdown signal. Stopping services...")
        runner.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    try:
        runner.start()
        logger.info("All services started. Press Ctrl+C to stop.")
        runner.wait()
    except ConfigurationError as e:
        logger.error(f"Configuration error: {e}")
    except Exception as e:
        logger.exception(f"Unexpected error occurred: {e}")
    finally:
        runner.stop()
        logger.info("All services stopped.")

def main():
    parser = argparse.ArgumentParser(description="Run Nameko services with advanced configuration.")
    parser.add_argument('--config', default='config.yaml', help='Path to the configuration YAML file')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--version', default='v1', help='Version of the services to run (e.g., v1)')
    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    config = load_config(args.config)

    # Directory where services are located
    services_dir = os.path.join('services', args.version)

    if not os.path.isdir(services_dir):
        logger.error(f"Services directory does not exist: {services_dir}")
        sys.exit(1)

    # Dynamically discover and import services
    services = []
    for service_name in os.listdir(services_dir):
        service_path = os.path.join(services_dir, service_name)
        if os.path.isdir(service_path):
            # Construct the module import path
            module_import_path = f'services.{args.version}.{service_name}.{service_name}'
            try:
                module = importlib.import_module(module_import_path)
                # Find all classes in the module that are Nameko services
                for name, obj in inspect.getmembers(module, inspect.isclass):
                    if obj.__module__ == module.__name__:
                        # Optionally, check if the class is a Nameko service
                        if hasattr(obj, 'name'):
                            services.append(obj)
                            logger.info(f"Dynamically imported {name} from {module_import_path}")
                # Handle cases where the service module doesn't have any classes
                if not any(obj.__module__ == module.__name__ for name, obj in inspect.getmembers(module, inspect.isclass)):
                    logger.warning(f"No service classes found in {module_import_path}")
            except Exception as e:
                logger.error(f"Failed to import services from {module_import_path}: {e}")
                sys.exit(1)
        else:
            logger.warning(f"{service_path} is not a directory, skipping.")

    if not services:
        logger.error(f"No services found in directory {services_dir}")
        sys.exit(1)

    run_services(config, services)

if __name__ == '__main__':
    main()
