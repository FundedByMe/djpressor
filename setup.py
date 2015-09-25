from pip.req import parse_requirements
from setuptools import setup
import uuid

install_reqs = parse_requirements('requirements.txt', session=uuid.uuid1())

setup(
    name='djpressor',
    version='0.0.3',
    author='FundedByMe',
    author_email='dev@fundedbyme.com',
    maintainer='FBM',
    url='https://github.com/fundedbyme/djpressor/',
    install_requires=[str(ir.req) for ir in install_reqs],
    data_files=[('requirements.txt', ['requirements.txt'])],
    py_modules=['djpressor'],
)
