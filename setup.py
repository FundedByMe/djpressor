from pip.req import parse_requirements
from setuptools import setup
from pip.download import PipSession

install_reqs = parse_requirements('requirements.txt', session=PipSession())

setup(
    name='djpressor',
    version='1.1.0',
    author='FundedByMe',
    author_email='dev@fundedbyme.com',
    maintainer='FBM',
    url='https://github.com/fundedbyme/djpressor/',
    install_requires=[str(ir.req) for ir in install_reqs],
    data_files=[('requirements.txt', ['requirements.txt'])],
    py_modules=['djpressor'],
)
