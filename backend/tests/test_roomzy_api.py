"""Roomzy backend API tests."""
import os
import time
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://roomzy-discover.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ============== Health ==============
class TestHealth:
    def test_health_ok(self):
        r = requests.get(f"{API}/health", timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert body.get("ok") is True
        assert "time" in body

    def test_root(self):
        r = requests.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ============== Auth ==============
class TestAuth:
    def test_login_demo_tenant(self):
        r = requests.post(f"{API}/auth/login", json={"email": "tenant@roomzy.in", "password": "tenant123"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and len(data["token"]) > 20
        assert data["user"]["email"] == "tenant@roomzy.in"
        assert data["user"]["role"] == "tenant"

    def test_login_demo_owner(self):
        r = requests.post(f"{API}/auth/login", json={"email": "owner@roomzy.in", "password": "owner123"}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user"]["role"] == "owner"

    def test_login_bad_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": "tenant@roomzy.in", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_register_tenant(self):
        email = f"TEST_t_{int(time.time()*1000)}@roomzy.test"
        r = requests.post(f"{API}/auth/register", json={
            "name": "TEST Tenant", "email": email, "password": "secret123", "role": "tenant"
        }, timeout=15)
        assert r.status_code == 201, r.text
        data = r.json()
        assert "token" in data
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "tenant"

    def test_register_owner(self):
        email = f"TEST_o_{int(time.time()*1000)}@roomzy.test"
        r = requests.post(f"{API}/auth/register", json={
            "name": "TEST Owner", "email": email, "password": "secret123", "role": "owner", "phone": "9111111111"
        }, timeout=15)
        assert r.status_code == 201
        assert r.json()["user"]["role"] == "owner"

    def test_register_validation(self):
        r = requests.post(f"{API}/auth/register", json={"email": "x@y.z", "password": "abcdef"}, timeout=15)
        assert r.status_code == 400

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register", json={
            "name": "Dup", "email": "tenant@roomzy.in", "password": "secret123", "role": "tenant"
        }, timeout=15)
        assert r.status_code == 409

    def test_me_with_token(self, tenant_token):
        h = {"Authorization": f"Bearer {tenant_token}"}
        r = requests.get(f"{API}/auth/me", headers=h, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == "tenant@roomzy.in"

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code in (401, 403)


# ============== Listings ==============
class TestListings:
    def test_list_active(self):
        r = requests.get(f"{API}/listings", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "results" in data
        assert isinstance(data["results"], list)
        assert len(data["results"]) >= 1

    def test_filter_city(self):
        r = requests.get(f"{API}/listings", params={"city": "Bengaluru"}, timeout=15)
        assert r.status_code == 200
        for l in r.json()["results"]:
            assert "bengaluru" in l["city"].lower()

    def test_filter_property_type(self):
        for pt in ["flat", "pg", "bed"]:
            r = requests.get(f"{API}/listings", params={"propertyType": pt}, timeout=15)
            assert r.status_code == 200
            for l in r.json()["results"]:
                assert l["propertyType"] == pt

    def test_filter_furnishing(self):
        r = requests.get(f"{API}/listings", params={"furnishing": "fully_furnished"}, timeout=15)
        assert r.status_code == 200

    def test_filter_amenities(self):
        r = requests.get(f"{API}/listings", params={"wifi": "true", "ac": "true"}, timeout=15)
        assert r.status_code == 200
        for l in r.json()["results"]:
            assert l["amenities"]["wifi"] is True
            assert l["amenities"]["ac"] is True

    def test_get_single_increments_visits(self):
        r1 = requests.get(f"{API}/listings", timeout=15).json()["results"]
        assert r1, "no listings to test"
        lid = r1[0]["id"] if "id" in r1[0] else r1[0]["_id"]
        r = requests.get(f"{API}/listings/{lid}", timeout=15)
        assert r.status_code == 200
        first = r.json()["profileVisits"]
        r = requests.get(f"{API}/listings/{lid}", timeout=15)
        assert r.json()["profileVisits"] == first + 1

    def test_get_single_404(self):
        r = requests.get(f"{API}/listings/000000000000000000000000", timeout=15)
        assert r.status_code == 404


# ============== Owner-scoped ==============
class TestOwnerScoped:
    def test_create_listing_owner(self, owner_token):
        h = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}
        body = {
            "title": "TEST Listing 2BHK",
            "description": "Test listing for automated tests",
            "propertyType": "flat",
            "city": "Bengaluru", "area": "Indiranagar", "pincode": "560038",
            "monthlyRent": 25000, "securityDeposit": 50000, "securityDepositRequired": True,
            "furnishing": "fully_furnished",
            "preferredTenant": "any",
            "amenities": {"wifi": True, "ac": True, "parking": False, "foodAvailable": False, "attachedBathroom": True, "roommateAllowed": False},
            "availableNow": True,
        }
        r = requests.post(f"{API}/listings", headers=h, json=body, timeout=15)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["title"] == body["title"]
        assert data.get("freeUntil") is not None
        assert data["status"] == "active"
        # verify by fetching
        lid = data.get("id") or data.get("_id")
        g = requests.get(f"{API}/listings/{lid}", timeout=15)
        assert g.status_code == 200
        assert g.json()["title"] == body["title"]
        TestOwnerScoped.created_id = lid

    def test_create_listing_forbidden_for_tenant(self, tenant_token):
        h = {"Authorization": f"Bearer {tenant_token}", "Content-Type": "application/json"}
        r = requests.post(f"{API}/listings", headers=h, json={"title": "x"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_my_listings(self, owner_token):
        h = {"Authorization": f"Bearer {owner_token}"}
        r = requests.get(f"{API}/listings/mine/list", headers=h, timeout=15)
        assert r.status_code == 200
        results = r.json()["results"]
        assert len(results) >= 1
        for l in results:
            assert "isLive" in l

    def test_my_leads(self, owner_token):
        h = {"Authorization": f"Bearer {owner_token}"}
        r = requests.get(f"{API}/listings/mine/leads", headers=h, timeout=15)
        assert r.status_code == 200
        assert "results" in r.json()


# ============== Favorites ==============
class TestFavorites:
    def test_favorites_toggle(self, tenant_token):
        h = {"Authorization": f"Bearer {tenant_token}", "Content-Type": "application/json"}
        listings = requests.get(f"{API}/listings", timeout=15).json()["results"]
        assert listings
        lid = listings[0].get("id") or listings[0].get("_id")

        # ensure clean state: get current favorites
        cur = requests.get(f"{API}/users/favorites", headers=h, timeout=15).json()["results"]
        existing = {(x.get("id") or x.get("_id")) for x in cur}

        r1 = requests.post(f"{API}/users/favorites/{lid}", headers=h, timeout=15)
        assert r1.status_code == 200
        favorited_after_first = r1.json()["favorited"]
        # After toggle, state should differ from baseline
        if lid in existing:
            assert favorited_after_first is False
        else:
            assert favorited_after_first is True

        # Verify GET reflects new state
        cur2 = requests.get(f"{API}/users/favorites", headers=h, timeout=15).json()["results"]
        ids2 = {(x.get("id") or x.get("_id")) for x in cur2}
        assert (lid in ids2) == favorited_after_first

        # Toggle back
        r2 = requests.post(f"{API}/users/favorites/{lid}", headers=h, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["favorited"] != favorited_after_first


# ============== Lead/Report ==============
class TestLeadsAndReport:
    def test_lead_create(self, tenant_token):
        h = {"Authorization": f"Bearer {tenant_token}", "Content-Type": "application/json"}
        listings = requests.get(f"{API}/listings", timeout=15).json()["results"]
        lid = listings[0].get("id") or listings[0].get("_id")
        before = listings[0].get("leads", 0)
        r = requests.post(f"{API}/listings/{lid}/lead", headers=h, json={"type": "call"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True
        # Verify counter incremented via single fetch
        l = requests.get(f"{API}/listings/{lid}", timeout=15).json()
        assert l.get("leads", 0) >= before + 1

    def test_lead_invalid_type(self, tenant_token):
        h = {"Authorization": f"Bearer {tenant_token}", "Content-Type": "application/json"}
        listings = requests.get(f"{API}/listings", timeout=15).json()["results"]
        lid = listings[0].get("id") or listings[0].get("_id")
        r = requests.post(f"{API}/listings/{lid}/lead", headers=h, json={"type": "invalid"}, timeout=15)
        assert r.status_code == 400

    def test_report_create(self, tenant_token):
        h = {"Authorization": f"Bearer {tenant_token}", "Content-Type": "application/json"}
        listings = requests.get(f"{API}/listings", timeout=15).json()["results"]
        lid = listings[0].get("id") or listings[0].get("_id")
        r = requests.post(f"{API}/listings/{lid}/report", headers=h, json={"reason": "fake", "details": "TEST"}, timeout=15)
        assert r.status_code == 200


# ============== Payments (Mock mode) ==============
class TestPayments:
    def test_create_order_renewal_mock(self, owner_token):
        h = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}
        # fetch own listing
        mine = requests.get(f"{API}/listings/mine/list", headers=h, timeout=15).json()["results"]
        assert mine, "Owner must have at least one listing"
        lid = mine[0].get("id") or mine[0].get("_id")

        r = requests.post(f"{API}/payments/create-order", headers=h, json={"purpose": "listing_renewal", "listingId": lid}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["mock"] is True
        assert data["amount"] == 99
        assert "paymentId" in data
        TestPayments.renew_payment_id = data["paymentId"]
        TestPayments.renew_listing_id = lid

    def test_verify_renewal(self, owner_token):
        h = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}
        pid = TestPayments.renew_payment_id
        lid = TestPayments.renew_listing_id
        before = requests.get(f"{API}/listings/{lid}", timeout=15).json().get("paidUntil")
        r = requests.post(f"{API}/payments/verify", headers=h, json={"paymentId": pid, "mock": True}, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True
        assert r.json()["payment"]["status"] == "paid"
        after = requests.get(f"{API}/listings/{lid}", timeout=15).json().get("paidUntil")
        assert after is not None and after != before

    def test_create_and_verify_featured(self, owner_token):
        h = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}
        mine = requests.get(f"{API}/listings/mine/list", headers=h, timeout=15).json()["results"]
        lid = mine[0].get("id") or mine[0].get("_id")
        r = requests.post(f"{API}/payments/create-order", headers=h, json={"purpose": "featured_listing", "listingId": lid}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["amount"] == 299 and d["mock"] is True
        v = requests.post(f"{API}/payments/verify", headers=h, json={"paymentId": d["paymentId"], "mock": True}, timeout=15)
        assert v.status_code == 200
        l = requests.get(f"{API}/listings/{lid}", timeout=15).json()
        assert l["isFeatured"] is True

    def test_create_and_verify_owner_verification(self, owner_token):
        h = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}
        r = requests.post(f"{API}/payments/create-order", headers=h, json={"purpose": "owner_verification"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["amount"] == 199 and d["mock"] is True
        v = requests.post(f"{API}/payments/verify", headers=h, json={"paymentId": d["paymentId"], "mock": True}, timeout=15)
        assert v.status_code == 200
        me = requests.get(f"{API}/auth/me", headers=h, timeout=15).json()
        assert me.get("isVerifiedOwner") is True

    def test_create_order_invalid_purpose(self, owner_token):
        h = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}
        r = requests.post(f"{API}/payments/create-order", headers=h, json={"purpose": "invalid"}, timeout=15)
        assert r.status_code == 400

    def test_prices_endpoint(self):
        r = requests.get(f"{API}/payments/prices", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["listing_renewal"] == 99
        assert d["featured_listing"] == 299
        assert d["owner_verification"] == 199
