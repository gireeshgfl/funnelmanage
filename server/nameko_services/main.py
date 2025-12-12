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
from dotenv import load_dotenv

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
    import subprocess
    
    # Load .env file
    dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    load_dotenv(dotenv_path)

    env = os.environ.copy()
    # Add nameko_services to PYTHONPATH so that 'common' can be imported directly
    # This is needed because bson_serialization matches imports assuming it is in path
    nameko_services_path = os.path.dirname(os.path.abspath(__file__))
    current_pythonpath = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = f"{nameko_services_path}:{current_pythonpath}"

    # Calculate absolute path for config.yaml
    config_path = os.path.join(nameko_services_path, "config.yaml")

    subprocess.call([
        "nameko", "run",
        "--config", config_path,
        "nameko_services.services"
    ], env=env)

if __name__ == '__main__':
    main()
