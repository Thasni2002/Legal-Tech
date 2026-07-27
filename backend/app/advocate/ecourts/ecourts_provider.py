import os
from datetime import datetime
from typing import Optional, List

from .schemas import (
    eCourtsCaseDetails,
    TimelineEvent,
    OrderDocumentItem,
    CauseListItem,
    CaseSearchRequest,
)


class BaseeCourtsProvider:
    def lookup_by_cnr(self, cnr_number: str) -> Optional[eCourtsCaseDetails]:
        raise NotImplementedError

    def search_cases(self, params: CaseSearchRequest) -> List[eCourtsCaseDetails]:
        raise NotImplementedError

    def get_cause_list(
        self, court_name: Optional[str], date_str: Optional[str], advocate_name: Optional[str]
    ) -> List[CauseListItem]:
        raise NotImplementedError


class LiveeCourtsProvider(BaseeCourtsProvider):
    """
    Live API adapter for official eCourts India REST API (webapi.ecourtsindia.com).
    Fetches live court data using official partner endpoints:
      - GET /api/partner/case/{cnr}
      - GET /api/partner/search
      - GET /api/partner/causelist/search
    """

    def __init__(self):
        self.api_url = os.getenv("ECOURTS_API_URL", "https://webapi.ecourtsindia.com").rstrip("/")
        self.api_key = os.getenv("ECOURTS_API_KEY", "")

    def lookup_by_cnr(self, cnr_number: str) -> Optional[eCourtsCaseDetails]:
        if not self.api_key:
            print("[eCourts] ECOURTS_API_KEY is not set.")
            return None
        
        clean_cnr = cnr_number.strip().upper()
        
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Endpoints to attempt (official eCourtsIndia REST API v4 spec)
            urls_to_try = [
                ("GET", f"{self.api_url}/api/partner/case/{clean_cnr}", None),
                ("GET", f"{self.api_url}/case/{clean_cnr}", None),
                ("POST", f"{self.api_url}/api/partner/case-detail", {"cnr_number": clean_cnr, "cnrNumber": clean_cnr}),
                ("POST", f"{self.api_url}/case-detail", {"cnr_number": clean_cnr, "cnrNumber": clean_cnr}),
            ]
            
            resp = None
            for method, url, body in urls_to_try:
                try:
                    print(f"[eCourts] Trying {method} {url} ...")
                    if method == "GET":
                        r = requests.get(url, headers=headers, timeout=12)
                    else:
                        r = requests.post(url, json=body, headers=headers, timeout=12)
                    
                    print(f"[eCourts] {method} {url} → HTTP {r.status_code}")
                    if r.status_code == 200:
                        resp = r
                        break
                    elif r.status_code not in (404, 405, 501):
                        print(f"[eCourts] Response body ({r.status_code}): {r.text[:300]}")
                        resp = r
                        break
                except Exception as path_err:
                    print(f"[eCourts] Request to {url} failed: {path_err}")
                    continue
            
            if resp is None or resp.status_code != 200:
                return None

            payload = resp.json()
            raw_data = payload.get("data") or payload.get("result") or payload.get("case") or payload
            
            if isinstance(raw_data, dict) and "courtCaseData" in raw_data:
                raw_data = raw_data["courtCaseData"]

            if not isinstance(raw_data, dict):
                return None

            def _to_str(val):
                if isinstance(val, list):
                    return ", ".join(str(x) for x in val if x)
                if isinstance(val, dict):
                    return str(val.get("name") or val.get("title") or val)
                return str(val) if val is not None else ""

            petitioner_str = _to_str(raw_data.get("petitioners") or raw_data.get("petitioner") or raw_data.get("petitioner_name") or raw_data.get("appellant"))
            respondent_str = _to_str(raw_data.get("respondents") or raw_data.get("respondent") or raw_data.get("respondent_name"))
            case_title = (
                raw_data.get("caseTitle")
                or raw_data.get("case_title")
                or raw_data.get("title")
                or raw_data.get("case_name")
                or (f"{petitioner_str} vs. {respondent_str}" if petitioner_str or respondent_str else "Court Case")
            )

            pet_adv = _to_str(raw_data.get("petitionerAdvocates") or raw_data.get("petitionerAdvocate") or raw_data.get("petitioner_advocate") or raw_data.get("pet_adv"))
            res_adv = _to_str(raw_data.get("respondentAdvocates") or raw_data.get("respondentAdvocate") or raw_data.get("respondent_advocate") or raw_data.get("res_adv"))

            timeline_items = []
            hearings = raw_data.get("historyOfCaseHearings") or raw_data.get("timeline") or raw_data.get("history") or []
            for idx, h in enumerate(hearings):
                if isinstance(h, dict):
                    purpose = h.get("purposeOfListing") or h.get("purpose") or h.get("stage") or "Hearing"
                    h_date = h.get("hearingDate") or h.get("businessOnDate") or h.get("date") or ""
                    judge_n = _to_str(h.get("judge") or raw_data.get("judges") or "Presiding Judge")
                    timeline_items.append(TimelineEvent(
                        id=str(idx + 1),
                        eventStage=purpose,
                        eventDate=h_date,
                        title=purpose,
                        description=f"Listed for {purpose} before {judge_n}",
                        benchName=judge_n,
                        courtHall=str(raw_data.get("courtNo") or raw_data.get("court_hall") or "Court Hall"),
                        documentUrl=h.get("order_url") or h.get("documentUrl") or h.get("order_link"),
                        status="Completed" if h.get("businessOnDate") else "Scheduled",
                    ))

            order_items = []
            orders = raw_data.get("judgmentOrders") or raw_data.get("interimOrders") or raw_data.get("orders") or []
            for idx, o in enumerate(orders):
                if isinstance(o, dict):
                    order_items.append(OrderDocumentItem(
                        id=str(o.get("id") or idx + 1),
                        orderDate=o.get("orderDate") or o.get("date") or "",
                        orderType=o.get("orderType") or o.get("type") or "Order",
                        judgeName=_to_str(o.get("judge") or raw_data.get("judges")),
                        summary=o.get("summary") or o.get("subject") or "Court Order",
                        fileUrl=o.get("file_url") or o.get("fileUrl") or o.get("order_url") or "",
                        fileSize=o.get("file_size") or o.get("fileSize") or "1.0 MB"
                    ))

            court_hall_val = str(raw_data.get("courtNo") or raw_data.get("courtHall") or "")
            if court_hall_val and not court_hall_val.lower().startswith("court"):
                court_hall_val = f"Court {court_hall_val}"

            return eCourtsCaseDetails(
                cnrNumber=raw_data.get("cnr") or raw_data.get("cnrNumber") or raw_data.get("cnr_number") or clean_cnr,
                caseTitle=case_title,
                caseType=raw_data.get("caseType") or raw_data.get("caseTypeSub") or raw_data.get("case_type") or "",
                caseNo=raw_data.get("registrationNumber") or raw_data.get("filingNumber") or raw_data.get("caseNumber") or raw_data.get("case_no") or "",
                filingDate=raw_data.get("filingDate") or raw_data.get("filing_date") or "",
                registrationDate=raw_data.get("registrationDate") or raw_data.get("registration_date") or "",
                petitioner=petitioner_str,
                respondent=respondent_str,
                petitionerAdvocate=pet_adv,
                respondentAdvocate=res_adv,
                courtName=raw_data.get("courtName") or raw_data.get("court_name") or raw_data.get("court") or "",
                courtType=raw_data.get("courtType") or raw_data.get("court_type") or "Magistrate",
                district=raw_data.get("district") or raw_data.get("district_name") or "",
                state=raw_data.get("state") or raw_data.get("state_name") or "",
                presidingJudge=_to_str(raw_data.get("judges") or raw_data.get("presidingJudge") or raw_data.get("judge")),
                courtHall=court_hall_val,
                caseStage=raw_data.get("purpose") or raw_data.get("stageOfCaseRaw") or raw_data.get("caseStage") or raw_data.get("stage") or "",
                status=raw_data.get("caseStatus") or raw_data.get("status") or "",
                nextHearingDate=raw_data.get("nextHearingDate") or raw_data.get("next_hearing_date") or raw_data.get("next_date") or "",
                timeline=timeline_items,
                orders=order_items,
            )
        except Exception as err:
            print(f"[eCourts] Live API call error: {err}")
            
        return None
            
        return None

    def search_cases(self, params: CaseSearchRequest) -> List[eCourtsCaseDetails]:
        if not self.api_key:
            return []
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            # GET /api/partner/search endpoint
            query_params = {
                "query": params.caseNumber or params.caseType or "",
                "pageSize": 50
            }
            resp = requests.get(
                f"{self.api_url}/api/partner/search",
                params=query_params,
                headers=headers,
                timeout=12
            )
            if resp.status_code == 200:
                payload = resp.json()
                data_obj = payload.get("data", {})
                results = data_obj.get("results") or payload.get("results") or []
                parsed_list = []
                for item in results:
                    parsed_list.append(eCourtsCaseDetails(
                        cnrNumber=item.get("cnr") or item.get("cnr_number") or "",
                        caseTitle=item.get("caseTitle") or item.get("case_title") or "",
                        caseType=item.get("caseType") or item.get("case_type") or "",
                        caseNo=item.get("caseNo") or item.get("case_no") or "",
                        filingDate=item.get("filingDate") or item.get("filing_date") or "",
                        registrationDate=item.get("registrationDate") or item.get("registration_date") or "",
                        petitioner=", ".join(item.get("petitioners", [])) if isinstance(item.get("petitioners"), list) else str(item.get("petitioner", "")),
                        respondent=", ".join(item.get("respondents", [])) if isinstance(item.get("respondents"), list) else str(item.get("respondent", "")),
                        petitionerAdvocate=item.get("petitioner_advocate") or "",
                        respondentAdvocate=item.get("respondent_advocate") or "",
                        courtName=item.get("courtName") or item.get("court_name") or "",
                        courtType=item.get("court_type") or "",
                        district=item.get("district") or "",
                        state=item.get("state") or "",
                        presidingJudge=item.get("judge") or "",
                        courtHall=item.get("court_hall") or "",
                        caseStage=item.get("stage") or "",
                        status=item.get("caseStatus") or item.get("status") or "",
                        nextHearingDate=item.get("next_hearing_date") or "",
                        timeline=[],
                        orders=[]
                    ))
                return parsed_list
        except Exception as err:
            print(f"eCourts Live Search error: {err}")
        return []

    def get_cause_list(
        self, court_name: Optional[str], date_str: Optional[str], advocate_name: Optional[str]
    ) -> List[CauseListItem]:
        if not self.api_key:
            return []
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            params = {}
            if court_name:
                params["courtName"] = court_name
            if date_str:
                params["date"] = date_str
            if advocate_name:
                params["advocateName"] = advocate_name

            resp = requests.get(f"{self.api_url}/api/partner/causelist/search", params=params, headers=headers, timeout=12)
            if resp.status_code == 200:
                payload = resp.json()
                data_obj = payload.get("data", {})
                items = data_obj.get("results") or payload.get("items") or []
                parsed_cause_list = []
                for item in items:
                    parsed_cause_list.append(CauseListItem(
                        id=str(item.get("id") or ""),
                        itemNo=item.get("item_no") or item.get("itemNo") or 0,
                        caseNo=item.get("case_no") or "",
                        caseTitle=item.get("case_title") or "",
                        petitioner=item.get("petitioner") or "",
                        respondent=item.get("respondent") or "",
                        stage=item.get("stage") or "",
                        courtHall=item.get("court_hall") or "",
                        judgeName=item.get("judge") or "",
                        cnrNumber=item.get("cnr_number") or item.get("cnr") or "",
                        timeSlot=item.get("time_slot") or "",
                    ))
                return parsed_cause_list
        except Exception as err:
            print(f"eCourts Live Cause List error: {err}")
        return []


def get_ecourts_provider() -> BaseeCourtsProvider:
    return LiveeCourtsProvider()

