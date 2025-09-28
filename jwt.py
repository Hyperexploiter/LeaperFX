from datetime import datetime, timedelta, timezone
import os
import jwt  # pip install PyJWT

# 1) Never hardcode secrets; set JWT_SECRET in your env/hosting
SECRET = os.environ["JWT_SECRET"]

now = datetime.now(timezone.utc)

payload = {
    "sub": "LeaperFx2025!",
    "iat": now,                 # issued-at
    "nbf": now,                 # not before
    "exp": now + timedelta(minutes=15),  # short TTL
    "iss": "leaperfx-contracts",        # issuer
    "aud": "leaperfx-admin"             # audience
}

token = jwt.encode(payload, SECRET, algorithm="HS256")
print(token)  # PyJWT>=2 returns str; if bytes, do token.decode()

# On verification (e.g., in your API route):
decoded = jwt.decode(
    token,
    SECRET,
    algorithms=["HS256"],       # prevent alg confusion
    audience="leaperfx-admin",
    issuer="leaperfx-contracts",
    options={"require": ["exp", "iat", "nbf"]}
)