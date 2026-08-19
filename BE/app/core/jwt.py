from functools import lru_cache

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey


class InvalidRSAPublicKeyError(ValueError):
    """Raised when authentication is configured with an invalid RSA public key."""


@lru_cache(maxsize=8)
def load_rsa_public_key(public_key_pem: str) -> RSAPublicKey:
    """Parse and cache a normalized PEM-encoded RSA public key."""
    try:
        public_key = serialization.load_pem_public_key(public_key_pem.encode())
    except (TypeError, ValueError):
        raise InvalidRSAPublicKeyError from None

    if not isinstance(public_key, RSAPublicKey):
        raise InvalidRSAPublicKeyError

    return public_key
