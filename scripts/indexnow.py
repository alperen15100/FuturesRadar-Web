#!/usr/bin/env python3
"""Submit FuturesRadar sitemap URLs to IndexNow after deployment."""
import json, urllib.request, xml.etree.ElementTree as ET
SITEMAP="https://futuresradar.org/sitemap.xml"
KEY="fradar2026indexnow7e4c91b3"
KEY_LOCATION=f"https://futuresradar.org/{KEY}.txt"
with urllib.request.urlopen(SITEMAP, timeout=20) as r:
    root=ET.fromstring(r.read())
urls=[e.text for e in root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc") if e.text]
payload=json.dumps({"host":"futuresradar.org","key":KEY,"keyLocation":KEY_LOCATION,"urlList":urls}).encode()
req=urllib.request.Request("https://api.indexnow.org/indexnow",data=payload,headers={"Content-Type":"application/json; charset=utf-8"},method="POST")
with urllib.request.urlopen(req,timeout=20) as r:
    print("IndexNow status:",r.status,"URLs:",len(urls))
