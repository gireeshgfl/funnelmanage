import os
from setuptools import setup, find_packages

BASE_DIR = os.path.dirname(__file__)
REQ_FILE = os.path.join(BASE_DIR, "requirements.txt")

with open(REQ_FILE) as f:
    requirements = [
        line.strip()
        for line in f.readlines()
        if line.strip() and not line.startswith("#")
    ]

setup(
    name="funnel_server",
    version="1.0.0",
    packages=find_packages(include=["api_gateway*", "nameko_services*"]),
    include_package_data=True,
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "funnel-api=api_gateway.main:main",
            "funnel-nameko=nameko_services.main:main",
        ]
    }
)
