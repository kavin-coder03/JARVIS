import re
import ipaddress
import urllib.parse
from typing import Optional, Dict, Any, Tuple

TWO_PART_TLDS = {
    "co.uk", "org.uk", "gov.uk", "ac.uk", "com.au", "net.au", "org.au", "edu.au",
    "co.nz", "net.nz", "org.nz", "co.jp", "ne.jp", "ac.jp", "com.br", "org.br",
    "co.in", "net.in", "org.in", "gen.in", "firm.in", "ind.in", "com.sg", "edu.sg",
    "com.mx", "gob.mx", "co.za", "gov.za", "com.cn", "net.cn", "org.cn", "gov.cn"
}

SENSITIVE_PARAM_NAMES = {
    "token", "password", "passwd", "pwd", "auth", "secret", "api_key", "apikey",
    "access_token", "session", "jwt", "private_key", "pin", "credential", "auth_token"
}

DANGEROUS_SCHEMES = {
    "javascript", "data", "file", "blob", "vbscript", "about", "chrome", "intent"
}

NON_URL_SCHEMES = {
    "wifi", "tel", "sms", "smsto", "mailto", "geo", "otpauth", "vcard", "mecard"
}

def detect_payload_type(raw_input: str) -> str:
    cleaned = raw_input.strip()
    lower = cleaned.lower()
    
    if lower.startswith(("upi://", "upi:")) or lower.startswith(("paytmmp://", "phonepe://", "gpay://")):
        return "payment_uri"
    if lower.startswith("wifi:"):
        return "wifi"
    if lower.startswith("mailto:") or (re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", cleaned)):
        return "email"
    if lower.startswith(("tel:", "sms:", "smsto:")):
        return "phone"
    if lower.startswith("geo:"):
        return "location"
    if lower.startswith(("otpauth:", "vcard:", "begin:vcard")):
        return "contact_or_otp"
        
    scheme_match = re.match(r"^([a-zA-Z0-9+.-]+):", cleaned)
    if scheme_match:
        scheme = scheme_match.group(1).lower()
        if scheme in DANGEROUS_SCHEMES:
            return "unsupported_scheme"
        if scheme in ("http", "https"):
            return "url"
        return "custom_scheme"

    if re.match(r"^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(/.*)?$", cleaned):
        return "url"

    return "text"

def extract_domain_parts(hostname: str) -> Tuple[Optional[str], Optional[str]]:
    if not hostname:
        return None, None
    
    parts = hostname.lower().split(".")
    if len(parts) <= 1:
        return hostname, None

    if len(parts) >= 3:
        two_part = f"{parts[-2]}.{parts[-1]}"
        if two_part in TWO_PART_TLDS:
            reg_domain = f"{parts[-3]}.{two_part}"
            sub = ".".join(parts[:-3]) if len(parts) > 3 else None
            return reg_domain, sub

    reg_domain = f"{parts[-2]}.{parts[-1]}"
    sub = ".".join(parts[:-2]) if len(parts) > 2 else None
    return reg_domain, sub

def sanitize_url_for_storage(url_str: str) -> str:
    try:
        parsed = urllib.parse.urlsplit(url_str)
        netloc = parsed.netloc
        if "@" in netloc:
            netloc = netloc.split("@")[-1]
            
        query = parsed.query
        if query:
            params = urllib.parse.parse_qsl(query, keep_blank_values=True)
            sanitized_params = []
            for k, v in params:
                if k.lower() in SENSITIVE_PARAM_NAMES:
                    sanitized_params.append((k, "[REDACTED]"))
                else:
                    sanitized_params.append((k, v))
            query = urllib.parse.urlencode(sanitized_params)
            
        return urllib.parse.urlunsplit((parsed.scheme, netloc, parsed.path, query, parsed.fragment))
    except Exception:
        return url_str

def parse_destination(raw_input: str) -> Dict[str, Any]:
    cleaned = raw_input.strip()
    payload_type = detect_payload_type(cleaned)
    
    if payload_type == "payment_uri":
        payment_info: Dict[str, Any] = {}
        if "?" in cleaned:
            q_part = cleaned.split("?", 1)[1]
            params = dict(urllib.parse.parse_qsl(q_part, keep_blank_values=True))
            payment_info = {
                "payee_vpa": params.get("pa", ""),
                "payee_name": params.get("pn", ""),
                "amount": params.get("am"),
                "currency": params.get("cu", "INR"),
                "note": params.get("tn", ""),
                "merchant_code": params.get("mc", "")
            }
        scheme = "upi" if cleaned.lower().startswith("upi:") else "payment"
        vpa_host = payment_info.get("payee_vpa") or "UPI Payment Gateway"
        return {
            "original_input": cleaned,
            "normalized_url": cleaned,
            "payload_type": "payment_uri",
            "scheme": scheme,
            "hostname": vpa_host,
            "registered_domain": None,
            "subdomain": None,
            "port": None,
            "path": None,
            "query_params_count": len(payment_info),
            "has_credentials": False,
            "is_secure_transport": True,
            "is_ip_address": False,
            "is_shortener": False,
            "is_internationalized": False,
            "is_malformed": False,
            "payment_details": payment_info
        }

    if payload_type not in ("url", "unsupported_scheme", "custom_scheme"):
        return {
            "original_input": cleaned,
            "normalized_url": cleaned,
            "payload_type": payload_type,
            "scheme": None,
            "hostname": None,
            "registered_domain": None,
            "subdomain": None,
            "port": None,
            "path": None,
            "query_params_count": 0,
            "has_credentials": False,
            "is_secure_transport": False,
            "is_ip_address": False,
            "is_shortener": False,
            "is_internationalized": False,
            "is_malformed": False,
            "payment_details": None
        }

    # Handle dangerous or custom schemes without prepend
    scheme_match = re.match(r"^([a-zA-Z0-9+.-]+):", cleaned)
    if scheme_match:
        url_to_parse = cleaned
        extracted_scheme = scheme_match.group(1).lower()
    else:
        url_to_parse = "https://" + cleaned
        extracted_scheme = "https"

    try:
        parsed = urllib.parse.urlsplit(url_to_parse)
    except Exception:
        return {
            "original_input": cleaned,
            "normalized_url": cleaned,
            "payload_type": "malformed",
            "scheme": None,
            "hostname": None,
            "registered_domain": None,
            "subdomain": None,
            "port": None,
            "path": None,
            "query_params_count": 0,
            "has_credentials": False,
            "is_secure_transport": False,
            "is_ip_address": False,
            "is_shortener": False,
            "is_internationalized": False,
            "is_malformed": True,
        }

    scheme = parsed.scheme.lower() if parsed.scheme else extracted_scheme
    netloc = parsed.netloc
    
    has_credentials = "@" in netloc
    clean_host_port = netloc.split("@")[-1] if has_credentials else netloc
    
    hostname = None
    port = None
    if clean_host_port:
        if clean_host_port.startswith("["):
            v6_end = clean_host_port.find("]")
            if v6_end != -1:
                hostname = clean_host_port[1:v6_end].lower()
                port_part = clean_host_port[v6_end+1:]
                if port_part.startswith(":"):
                    try:
                        port = int(port_part[1:])
                    except ValueError:
                        pass
        elif ":" in clean_host_port:
            parts = clean_host_port.split(":")
            hostname = parts[0].lower()
            try:
                port = int(parts[1])
            except ValueError:
                pass
        else:
            hostname = clean_host_port.lower()

    is_ip = False
    if hostname:
        try:
            ipaddress.ip_address(hostname)
            is_ip = True
        except ValueError:
            is_ip = False

    is_idn = False
    if hostname:
        if "xn--" in hostname or any(ord(c) > 127 for c in hostname):
            is_idn = True

    registered_domain, subdomain = extract_domain_parts(hostname) if hostname and not is_ip else (None, None)
    query_count = len(urllib.parse.parse_qsl(parsed.query)) if parsed.query else 0

    return {
        "original_input": cleaned,
        "normalized_url": url_to_parse,
        "payload_type": "unsupported_scheme" if scheme in DANGEROUS_SCHEMES else ("url" if scheme in ("http", "https") else "custom_scheme"),
        "scheme": scheme,
        "hostname": hostname,
        "registered_domain": registered_domain,
        "subdomain": subdomain,
        "port": port,
        "path": parsed.path or "/",
        "query_params_count": query_count,
        "has_credentials": has_credentials,
        "is_secure_transport": scheme == "https",
        "is_ip_address": is_ip,
        "is_shortener": False,
        "is_internationalized": is_idn,
        "is_malformed": False,
    }
