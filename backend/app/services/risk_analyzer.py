import re
import urllib.parse
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.core.config import settings
from app.services.url_parser import parse_destination, detect_payload_type

# Maintained list of common URL shortener domains
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "adf.ly",
    "bit.do", "tiny.cc", "lnkd.in", "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy",
    "qr.ae", "trib.al", "v.gd", "bl.ink", "snip.ly", "shorte.st", "hyperurl.co",
    "clck.ru", "s.id", "soo.gd", "bc.vc", "linktr.ee"
}

# Known high-abuse TLDs
HIGH_ABUSE_TLDS = {
    "top", "xyz", "click", "gq", "cf", "tk", "ml", "country", "stream",
    "buzz", "surf", "fit", "work", "loan", "men", "date", "racing", "zip", "mov"
}

# Monitored brands for impersonation detection
MONITORED_BRANDS: Dict[str, List[str]] = {
    "paypal": ["paypal.com", "paypal.me"],
    "apple": ["apple.com", "icloud.com"],
    "google": ["google.com", "google.co.in", "google.co.uk", "youtube.com", "gmail.com"],
    "microsoft": ["microsoft.com", "live.com", "office.com", "outlook.com", "sharepoint.com", "bing.com"],
    "amazon": ["amazon.com", "amazon.co.uk", "amazon.de", "aws.amazon.com"],
    "netflix": ["netflix.com"],
    "chase": ["chase.com"],
    "wellsfargo": ["wellsfargo.com"],
    "bankofamerica": ["bankofamerica.com"],
    "facebook": ["facebook.com", "fb.com", "messenger.com"],
    "instagram": ["instagram.com"],
    "whatsapp": ["whatsapp.com"],
    "telegram": ["telegram.org", "t.me"],
    "coinbase": ["coinbase.com"],
    "binance": ["binance.com"],
    "github": ["github.com"],
    "dropbox": ["dropbox.com"],
    "usps": ["usps.com"],
    "fedex": ["fedex.com"],
    "dhl": ["dhl.com"]
}

OPEN_REDIRECT_PARAM_NAMES = {"url", "redirect", "dest", "destination", "next", "target", "r", "link", "goto"}

def analyze_url_risk(
    raw_payload: str,
    reference_domain: Optional[str] = None,
    source_type: str = "manual"
) -> Dict[str, Any]:
    """
    Executes explainable, deterministic heuristic security analysis on a QR payload.
    """
    parsed = parse_destination(raw_payload)
    triggered_signals: List[Dict[str, Any]] = []
    untriggered_checks: List[Dict[str, Any]] = []
    
    score = 0
    payload_type = parsed["payload_type"]

    # 1. Non-web payload handling
    if payload_type == "payment_uri":
        details = parsed.get("payment_details") or {}
        payee = details.get("payee_name") or details.get("payee_vpa") or "Unknown Payee"
        amount_str = f"{details.get('currency', 'INR')} {details.get('amount')}" if details.get("amount") else "Unspecified Amount"
        
        triggered_signals.append({
            "id": "payment_uri_detected",
            "name": "Financial Payment Request (UPI)",
            "severity": "warning",
            "score_impact": 25,
            "description": f"This QR code triggers a financial transfer to '{payee}' ({amount_str}). Payee identity is encoded in the QR and is NOT verified by TrueQR.",
            "actionable_advice": "Never scan a QR code or enter your UPI PIN to receive money. Verify the recipient name and VPA with the merchant before completing payment in your payment app."
        })
        
        return {
            "risk_score": 25,
            "risk_category": "SUSPICIOUS",
            "destination": parsed,
            "triggered_signals": triggered_signals,
            "untriggered_checks": [
                {"id": "payment_format_check", "name": "Payment URI Protocol", "status": "passed", "description": "Conforms to standard UPI payment intent specification"}
            ],
            "verdict_headline": "Direct Payment Intent Detected",
            "verdict_explanation": f"This QR code initiates a financial payment to {payee}. TrueQR does not independently verify the payee's physical identity or authorization.",
            "suggested_action": "Review the payee VPA, name, and requested amount carefully before proceeding to your banking app.",
            "security_limitations": "TrueQR cannot check bank account balances, merchant legitimacy, or intercept scans inside third-party payment apps.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    if payload_type in ("wifi", "email", "phone", "location", "contact_or_otp", "text"):
        type_names = {
            "wifi": "Wi-Fi Configuration Network",
            "email": "Email Address / Mailto",
            "phone": "Telephone Number / SMS",
            "location": "Geographic Coordinates",
            "contact_or_otp": "Contact Card (vCard) / OTP",
            "text": "Plain Text Note"
        }
        human_name = type_names.get(payload_type, payload_type.title())
        triggered_signals.append({
            "id": "non_web_payload",
            "name": f"Non-Web QR Code Payload ({human_name})",
            "severity": "info",
            "score_impact": 0,
            "description": f"This QR code encodes {human_name} rather than an ordinary web URL.",
            "actionable_advice": "Review the decoded content directly. Standard web browser protections and phishing filters do not apply to offline data."
        })
        
        return {
            "risk_score": 0,
            "risk_category": "LOW RISK",
            "destination": parsed,
            "triggered_signals": triggered_signals,
            "untriggered_checks": [
                {"id": "web_url_check", "name": "Web URL Format", "status": "n/a", "description": "Offline non-web payload"}
            ],
            "verdict_headline": f"Decoded {human_name}",
            "verdict_explanation": f"The scanned QR code contains an offline {human_name} payload. It does not direct to an external website.",
            "suggested_action": "Inspect the raw text or details before taking action on your device.",
            "security_limitations": "TrueQR does not validate offline configuration strings against local device settings.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    # 2. Unsupported or Dangerous Schemes
    scheme = parsed.get("scheme")
    if payload_type == "unsupported_scheme" or scheme in ("javascript", "data", "file", "blob", "vbscript", "about"):
        impact = 75
        score += impact
        triggered_signals.append({
            "id": "dangerous_scheme",
            "name": "High-Risk URI Scheme Detected",
            "severity": "danger",
            "score_impact": impact,
            "description": f"Dangerous scheme '{scheme}:' detected. This is not a standard web destination and can trigger local code execution or security context bypass.",
            "actionable_advice": "Do NOT open or execute this payload. It should be treated as dangerous untrusted input."
        })
    else:
        untriggered_checks.append({
            "id": "safe_scheme_check",
            "name": "Web Protocol Scheme",
            "status": "passed",
            "description": f"Uses standard web protocol '{scheme or 'http/https'}' rather than dangerous local execution schemes."
        })

    # 3. HTTP vs HTTPS Transport
    if scheme == "http":
        impact = 15
        score += impact
        triggered_signals.append({
            "id": "unencrypted_http",
            "name": "Unencrypted Connection (HTTP)",
            "severity": "warning",
            "score_impact": impact,
            "description": "The destination uses unencrypted HTTP. Data exchanged with this site is transmitted in cleartext and is vulnerable to eavesdropping and on-path tampering.",
            "actionable_advice": "Never input passwords, personal details, or financial credentials on an unencrypted HTTP page. Note: HTTPS encrypts transit but does NOT guarantee the site owner is trustworthy."
        })
    elif scheme == "https":
        untriggered_checks.append({
            "id": "transport_encryption",
            "name": "Transport Layer Security (TLS/HTTPS)",
            "status": "passed",
            "description": "Traffic is encrypted via HTTPS. (Reminder: encryption ensures privacy in transit, not innocence of intent)."
        })

    # 4. Embedded Credentials / Userinfo Confusion
    if parsed.get("has_credentials"):
        impact = 60
        score += impact
        triggered_signals.append({
            "id": "embedded_credentials",
            "name": "Deceptive Embedded Credentials in URL",
            "severity": "danger",
            "score_impact": impact,
            "description": "The URL contains an '@' symbol in the authority component. Browsers discard characters before '@', making it appear like a trusted brand while secretly directing you to the host following '@'.",
            "actionable_advice": "This is a classic credential-confusion trick. Do not open this destination."
        })
    else:
        untriggered_checks.append({
            "id": "credentials_check",
            "name": "Userinfo Ambiguity Check",
            "status": "passed",
            "description": "No '@' character userinfo confusion detected."
        })

    hostname = parsed.get("hostname") or ""
    reg_domain = parsed.get("registered_domain") or ""
    subdomain = parsed.get("subdomain") or ""

    # 5. Raw IP Address Host
    if parsed.get("is_ip_address"):
        impact = 30
        score += impact
        triggered_signals.append({
            "id": "raw_ip_address",
            "name": "Raw IP Address Host",
            "severity": "warning",
            "score_impact": impact,
            "description": f"Direct IP address host ('{hostname}') used instead of a registered domain name. Legitimate public services use branded domain names with valid SSL certificates.",
            "actionable_advice": "Raw IP destinations are commonly associated with temporary phishing kits, compromised IoT devices, or malicious control nodes. Avoid visiting."
        })
    elif hostname:
        untriggered_checks.append({
            "id": "ip_host_check",
            "name": "Domain Host Representation",
            "status": "passed",
            "description": f"Host is a registered domain name ('{hostname}'), not a raw numerical IP address."
        })

    # 6. URL Shortener Detection
    is_shortener = False
    if reg_domain in URL_SHORTENERS or hostname in URL_SHORTENERS:
        is_shortener = True
        parsed["is_shortener"] = True
        impact = 25
        score += impact
        triggered_signals.append({
            "id": "url_shortener",
            "name": "Concealed URL Shortener Service",
            "severity": "warning",
            "score_impact": impact,
            "description": f"URL shortener '{hostname}' detected. The true destination is concealed behind an HTTP redirect and cannot be evaluated from the QR code alone.",
            "actionable_advice": "QR codes do not need shorteners because humans do not type them. Shorteners in QR codes frequently mask malicious redirects. Proceed with extreme caution."
        })
    elif hostname:
        untriggered_checks.append({
            "id": "shortener_check",
            "name": "Destination Transparency Check",
            "status": "passed",
            "description": "Destination is direct, not masked through a known public URL shortener."
        })

    # 7. Punycode & Confusable Internationalized Characters
    if parsed.get("is_internationalized"):
        impact = 25
        score += impact
        triggered_signals.append({
            "id": "idn_punycode",
            "name": "Punycode / Internationalized Domain (IDN)",
            "severity": "warning",
            "score_impact": impact,
            "description": "The domain name contains Punycode ('xn--') or non-ASCII characters. Attackers use visually identical characters from other alphabets (such as Cyrillic 'а' replacing Latin 'a') to impersonate well-known services.",
            "actionable_advice": "Scrutinize the decoded characters. Verify if the domain is genuinely intended for a non-Latin language community or spoofing a Latin brand."
        })
    elif hostname:
        untriggered_checks.append({
            "id": "idn_check",
            "name": "Character Homograph Check",
            "status": "passed",
            "description": "Standard ASCII character set used. No Punycode or foreign script confusables detected."
        })

    # 8. Excessive Subdomain Depth
    if subdomain:
        dot_count = subdomain.count(".")
        if dot_count >= 2: # e.g. a.b.c.example.com -> 3+ subdomain levels
            impact = 20
            score += impact
            triggered_signals.append({
                "id": "excessive_subdomains",
                "name": "Excessive Subdomain Depth",
                "severity": "warning",
                "score_impact": impact,
                "description": f"Suspiciously deep subdomain structure ('{subdomain}'). Phishers frequently stack subdomains to push the real registered domain off-screen on smartphones.",
                "actionable_advice": f"Verify the actual parent domain: '{reg_domain}'. Disregard any brand names appearing earlier in the subdomain prefix."
            })

    # 9. Brand Impersonation in Subdomain or Host Labels
    if reg_domain and not is_shortener:
        matched_impersonation = None
        for brand, legitimate_domains in MONITORED_BRANDS.items():
            # Check if brand appears in hostname
            if brand in hostname:
                # Is it an official domain for that brand?
                is_legitimate = any(reg_domain == leg or reg_domain.endswith("." + leg) for leg in legitimate_domains)
                if not is_legitimate:
                    matched_impersonation = (brand, legitimate_domains[0])
                    break
        
        if matched_impersonation:
            brand_name, official_example = matched_impersonation
            impact = 40
            score += impact
            triggered_signals.append({
                "id": "brand_impersonation",
                "name": f"Potential Brand Impersonation: '{brand_name.title()}'",
                "severity": "danger",
                "score_impact": impact,
                "description": f"The domain mentions '{brand_name.title()}', but belongs to '{reg_domain}' rather than the official domain (e.g. '{official_example}').",
                "actionable_advice": f"Never provide login credentials or financial information here. If you intended to visit {brand_name.title()}, open the official site directly."
            })
        elif hostname:
            untriggered_checks.append({
                "id": "brand_impersonation_check",
                "name": "Brand Squatting & Impersonation",
                "status": "passed",
                "description": "No recognized high-target brand names found misaligned with their official registered domains."
            })

    # 10. High-Abuse / Suspicious TLD
    if reg_domain:
        tld_part = reg_domain.split(".")[-1]
        if tld_part in HIGH_ABUSE_TLDS:
            impact = 10
            score += impact
            triggered_signals.append({
                "id": "high_abuse_tld",
                "name": f"High-Abuse Top-Level Domain (.{tld_part})",
                "severity": "warning",
                "score_impact": impact,
                "description": f"The domain uses the '.{tld_part}' extension. This TLD experiences high abuse ratios in phishing and malware campaigns due to minimal registration vetting.",
                "actionable_advice": "Check whether you were expecting to visit a site using this specific TLD extension."
            })

    # 11. Destination Mismatch (User Reference Domain)
    if reference_domain and reference_domain.strip():
        ref_cleaned = reference_domain.strip().lower()
        if ref_cleaned.startswith(("http://", "https://")):
            ref_parsed = urllib.parse.urlsplit(ref_cleaned)
            ref_cleaned = ref_parsed.netloc or ref_cleaned
        if ":" in ref_cleaned:
            ref_cleaned = ref_cleaned.split(":")[0]

        matches = False
        if hostname:
            matches = (hostname == ref_cleaned or hostname.endswith("." + ref_cleaned))

        if not matches:
            impact = 40
            score += impact
            triggered_signals.append({
                "id": "destination_mismatch",
                "name": "Expected Destination Mismatch",
                "severity": "danger",
                "score_impact": impact,
                "description": f"Destination mismatch! The QR code points to '{hostname or 'unknown'}', which does NOT match your expected domain '{ref_cleaned}'.",
                "actionable_advice": f"If this QR code was supposed to lead to '{ref_cleaned}', the physical poster, sticker, or display may have been replaced or manipulated (quishing attack)."
            })
        else:
            untriggered_checks.append({
                "id": "destination_match_check",
                "name": "Expected Destination Match",
                "status": "passed",
                "description": f"Destination matches your expected domain reference ('{ref_cleaned}')."
            })

    # 12. Non-standard Port
    port = parsed.get("port")
    if port and port not in (80, 443):
        impact = 15
        score += impact
        triggered_signals.append({
            "id": "non_standard_port",
            "name": f"Non-Standard Web Port (:{port})",
            "severity": "warning",
            "score_impact": impact,
            "description": f"The URL specifies port {port} instead of standard web ports (80 for HTTP, 443 for HTTPS).",
            "actionable_advice": "Non-standard ports are frequently used for development, backdoors, or non-commercial infrastructure."
        })

    # 13. Chained Redirect in Query Parameters
    orig = parsed.get("normalized_url", "")
    if "?" in orig:
        query_part = orig.split("?", 1)[1].lower()
        has_chained_url = any(
            f"{param}=http" in query_part or f"{param}=https" in query_part or f"{param}=%2f%2f" in query_part
            for param in OPEN_REDIRECT_PARAM_NAMES
        )
        if has_chained_url:
            impact = 15
            score += impact
            triggered_signals.append({
                "id": "chained_redirect_query",
                "name": "Chained Redirect Target in Query",
                "severity": "warning",
                "score_impact": impact,
                "description": "The URL's query parameters contain a nested secondary web address. This pattern is commonly used for open-redirect attacks that bypass perimeter filters.",
                "actionable_advice": "Inspect the parameter value to identify where the final redirect leads before clicking."
            })

    # 14. Unusual URL Length
    total_len = len(parsed.get("original_input", ""))
    if total_len > 180:
        impact = 10
        score += impact
        triggered_signals.append({
            "id": "excessive_length",
            "name": f"Unusually Long URL ({total_len} characters)",
            "severity": "info",
            "score_impact": impact,
            "description": "The URL is abnormally long. Phishing attacks and exploit kits sometimes pad URLs with long tokens or base64 blobs to conceal payload structure.",
            "actionable_advice": "Check whether the URL contains unreadable base64 or obfuscated character sequences."
        })

    # Clamp final score between 0 and 100
    final_score = min(max(score, 0), 100)

    # Classify according to configurable thresholds
    if final_score <= settings.LOW_RISK_MAX:
        category = "LOW RISK"
        headline = "Low Risk Detected"
        explanation = "No strong warning signal was found by the current checks. This does not prove that the website is safe."
        action = "You may review the destination hostname and proceed with standard security precautions."
    elif final_score <= settings.SUSPICIOUS_MAX:
        category = "SUSPICIOUS"
        headline = "Suspicious Signals Identified"
        explanation = "One or more URL patterns deserve attention. Review the detected signals before deciding whether to proceed."
        action = "Examine the specific warnings below. If the destination is unfamiliar, do not enter sensitive credentials."
    else:
        category = "HIGH RISK"
        headline = "High-Risk Indicators Detected"
        explanation = "Multiple strong warning signals may be present. Avoid opening this destination unless you independently verify it."
        action = "Opening this destination is strongly discouraged. It exhibits known phishing or obfuscation characteristics."

    return {
        "risk_score": final_score,
        "risk_category": category,
        "destination": parsed,
        "triggered_signals": triggered_signals,
        "untriggered_checks": untriggered_checks,
        "verdict_headline": headline,
        "verdict_explanation": explanation,
        "suggested_action": action,
        "security_limitations": "TrueQR uses transparent heuristic checks. It does NOT follow redirects, execute JavaScript, or guarantee that a site is harmless. Always practice defensive browsing.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
