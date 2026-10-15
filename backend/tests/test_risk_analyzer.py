import pytest
from app.services.risk_analyzer import analyze_url_risk
from app.services.url_parser import parse_destination, detect_payload_type

def test_valid_https_url():
    res = analyze_url_risk("https://www.wikipedia.org/wiki/Main_Page")
    assert res["risk_category"] == "LOW RISK"
    assert res["risk_score"] <= 24
    assert res["destination"]["is_secure_transport"] is True
    assert res["destination"]["hostname"] == "www.wikipedia.org"
    # Ensure transport check is passed in untriggered checks
    untriggered_ids = [c["id"] for c in res["untriggered_checks"]]
    assert "transport_encryption" in untriggered_ids

def test_unencrypted_http():
    res = analyze_url_risk("http://example.org/test")
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "unencrypted_http" in signal_ids
    assert res["risk_score"] >= 15

def test_dangerous_javascript_scheme():
    res = analyze_url_risk("javascript:alert(document.cookie)")
    assert res["risk_category"] == "HIGH RISK"
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "dangerous_scheme" in signal_ids
    assert res["risk_score"] >= 70

def test_embedded_credentials():
    res = analyze_url_risk("https://paypal.com:secret@attacker-domain.com/login")
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "embedded_credentials" in signal_ids
    assert res["risk_score"] >= 60
    assert res["risk_category"] == "HIGH RISK"

def test_raw_ipv4_host():
    res = analyze_url_risk("http://192.168.1.100/admin")
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "raw_ip_address" in signal_ids
    assert res["risk_score"] >= 30

def test_url_shortener():
    res = analyze_url_risk("https://bit.ly/special-offer")
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "url_shortener" in signal_ids
    assert res["risk_category"] in ("SUSPICIOUS", "HIGH RISK")

def test_punycode_idn():
    res = analyze_url_risk("https://xn--pple-43d.com/store")
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "idn_punycode" in signal_ids

def test_brand_impersonation_subdomain():
    res = analyze_url_risk("https://login.paypal.com.verify-billing.site/account")
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "brand_impersonation" in signal_ids
    assert res["risk_category"] == "HIGH RISK"

def test_destination_mismatch():
    res = analyze_url_risk("https://evil-bank.com/login", reference_domain="chase.com")
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "destination_mismatch" in signal_ids
    assert res["risk_category"] in ("SUSPICIOUS", "HIGH RISK")

def test_destination_match_subdomain():
    res = analyze_url_risk("https://auth.chase.com/login", reference_domain="chase.com")
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "destination_mismatch" not in signal_ids
    untriggered_ids = [c["id"] for c in res["untriggered_checks"]]
    assert "destination_match_check" in untriggered_ids

def test_non_standard_port():
    res = analyze_url_risk("https://safe-looking.com:8443/portal")
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "non_standard_port" in signal_ids

def test_chained_redirect_query():
    res = analyze_url_risk("https://legit-site.com/out?redirect=https://malicious-page.xyz")
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "chained_redirect_query" in signal_ids

def test_non_web_wifi_payload():
    res = analyze_url_risk("WIFI:S:Guest-Network;T:WPA;P:secret123;;")
    assert res["destination"]["payload_type"] == "wifi"
    assert res["risk_score"] == 0
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "non_web_payload" in signal_ids

def test_plain_text_payload():
    res = analyze_url_risk("Meeting room 4B code: 8842")
    assert res["destination"]["payload_type"] == "text"
    assert res["risk_score"] == 0

def test_payment_upi_payload():
    res = analyze_url_risk("upi://pay?pa=merchant@okaxis&pn=CampusStore&am=250.00&cu=INR&tn=Stationery")
    assert res["destination"]["payload_type"] == "payment_uri"
    assert res["risk_category"] == "SUSPICIOUS"
    assert res["risk_score"] >= 25
    assert res["destination"]["payment_details"]["payee_name"] == "CampusStore"
    assert res["destination"]["payment_details"]["amount"] == "250.00"
    signal_ids = [s["id"] for s in res["triggered_signals"]]
    assert "payment_uri_detected" in signal_ids
