from django.conf import settings
from boto.s3.connection import S3Connection
from boto.https_connection import CertValidatingHTTPSConnection
import socket
import ssl
import re
import time
import sys


class UnsafeHttpsConntection(CertValidatingHTTPSConnection):
    # !! Unsafe on Python < 2.7.9
    def __init__(self, *args, **kwargs):
        # No super, it's an old-style class
        CertValidatingHTTPSConnection.__init__(self, *args, **kwargs)

        # Defaults to cert validation
        self.ssl_ctx = ssl.create_default_context(cafile=self.ca_certs)
        if self.cert_file is not None:
            self.ssl_ctx.load_cert_chain(certfile=self.cert_file,
                                         keyfile=self.key_file)

    def connect(self):
        "Connect to a host on a given (SSL) port."
        if hasattr(self, "timeout"):
            sock = socket.create_connection(
                (self.host, self.port), self.timeout)
        else:
            sock = socket.create_connection(
                (self.host, self.port))

        if re.match(".*\.s3.*\.amazonaws\.com", self.host):
            patched_host = ".".join(self.host.rsplit(".", 4)[1:])
        self.sock = self.ssl_ctx.wrap_socket(
            sock, server_hostname=patched_host)


def get_s3_connection():
    """
    Returns an S3Connection object from boto s3 interface
    """
    connection_kwargs = {
        'aws_access_key_id': settings.AWS_ACCESS_KEY_ID,
        'aws_secret_access_key': settings.AWS_SECRET_ACCESS_KEY,
        'is_secure': True,
    }

    v = sys.version_info

    if v.micro >= 9 and v.major == 2 and v.minor == 7:
        connection_kwargs[
            'https_connection_factory'] = (UnsafeHttpsConntection, ())

    if hasattr(settings, 'AWS_S3_PROXY_HOST'):
        connection_kwargs['proxy'] = settings.AWS_S3_PROXY_HOST
    if hasattr(settings, 'AWS_S3_PROXY_PORT'):
        connection_kwargs['proxy_port'] = settings.AWS_S3_PROXY_PORT
    return S3Connection(**connection_kwargs)


def copy_object(src_bucket_name,
                src_key_name,
                dst_bucket_name,
                dst_key_name,
                metadata=None,
                preserve_acl=True):
    """
    Copy an existing object to another location.

    src_bucket_name   Bucket containing the existing object.
    src_key_name      Name of the existing object.
    dst_bucket_name   Bucket to which the object is being copied.
    dst_key_name      The name of the new object.
    metadata          A dict containing new metadata that you want
                      to associate with this object.  If this is None
                      the metadata of the original object will be
                      copied to the new object.
    preserve_acl      If True, the ACL from the original object
                      will be copied to the new object.  If False
                      the new object will have the default ACL.
    """
    s3 = get_s3_connection()
    bucket = s3.lookup(src_bucket_name)

    # Lookup the existing object in S3
    key = bucket.lookup(src_key_name)

    # Copy the key back on to itself, with new metadata
    if not key:
        # Sleep for half a second, sometimes it takes time for S3
        # keys to register that they exist
        time.sleep(0.5)
        key = bucket.lookup(src_key_name)

    if key:
        return key.copy(dst_bucket_name, dst_key_name,
                        metadata=metadata, preserve_acl=preserve_acl)

    return None
