import sys
import time
import logging
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from subprocess import Popen, PIPE
import threading

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ChangeHandler(FileSystemEventHandler):
    def __init__(self, command):
        self.command = command
        self.process = None
        self.restart_timer = None
        super().__init__()
    
    def on_any_event(self, event):
        if event.event_type in ('modified', 'created', 'moved'):
            logger.info(f"File change detected: {event.src_path}. Scheduling Nameko restart...")
            self.schedule_restart()
    
    def schedule_restart(self):
        if self.restart_timer is not None:
            self.restart_timer.cancel()
        self.restart_timer = threading.Timer(15, self.restart_process)
        self.restart_timer.start()
    
    def restart_process(self):
        if self.process:
            logger.info("Terminating old Nameko process...")
            self.process.terminate()
            self.process.wait()
        logger.info("Starting new Nameko process...")
        self.process = Popen(self.command, shell=True, stdout=PIPE, stderr=PIPE)
        self.log_output()
    
    def log_output(self):
        def log_stream(stream, log_func):
            for line in iter(stream.readline, b''):
                log_func(f"Nameko: {line.decode().strip()}")
        
        threading.Thread(target=log_stream, args=(self.process.stdout, logger.info)).start()
        threading.Thread(target=log_stream, args=(self.process.stderr, logger.info)).start()

    def start_initial_process(self):
        logger.info("Starting initial Nameko process...")
        self.process = Popen(self.command, shell=True, stdout=PIPE, stderr=PIPE)
        self.log_output()

if __name__ == "__main__":
    command = "nameko run --config config.yaml main"  # Replace with your Nameko run command
    event_handler = ChangeHandler(command)
    
    # Start Nameko initially
    event_handler.start_initial_process()
    
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=True)
    observer.start()
    logger.info("Watching for file changes...")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        if event_handler.process:
            event_handler.process.terminate()
    observer.join()