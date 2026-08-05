import os
# pyrefly: ignore [missing-import]
from google_auth_oauthlib.flow import Flow

SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_google_auth_flow(redirect_uri: str, state: str = None) -> Flow:
    """Initialize Google OAuth 2.0 Flow using client ID and client secret."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise ValueError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables.")
        
    client_config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    
    return Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=redirect_uri,
        state=state
    )

def get_authorization_url(redirect_uri: str, state: str) -> str:
    """
    Generate Google Consent Screen redirect URL manually to bypass PKCE requirements.
    We request offline access and force consent prompt to guarantee a Refresh Token is returned.
    """
    import urllib.parse
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true"
    }
    
    auth_base_url = "https://accounts.google.com/o/oauth2/auth"
    auth_url = f"{auth_base_url}?{urllib.parse.urlencode(params)}"
    return auth_url

def get_refresh_token_from_code(redirect_uri: str, code: str) -> str:
    """Exchange authorization code for token credentials and retrieve the refresh token."""
    import requests
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    
    try:
        response = requests.post(token_url, data=payload)
        response_data = response.json()
        if response.status_code == 200:
            return response_data.get("refresh_token")
        else:
            error_desc = response_data.get("error_description") or response_data.get("error", "Unknown error")
            raise Exception(f"{error_desc}")
    except Exception as e:
        raise Exception(f"Failed to exchange code: {str(e)}")
