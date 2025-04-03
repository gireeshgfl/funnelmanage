import os
from setuptools import setup
from Cython.Build import cythonize

# Build the Cython extension
setup(
    ext_modules=cythonize("bson_serialization.pyx", compiler_directives={'language_level': "3"}),
)
