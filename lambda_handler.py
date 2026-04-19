# lambda_handler.py
from mangum import Mangum
from server import app   # imports from server.py at the project root

# Mangum translates Lambda's event/context format into ASGI requests
# that FastAPI understands. Without this, Lambda cannot invoke FastAPI.
handler = Mangum(app)
