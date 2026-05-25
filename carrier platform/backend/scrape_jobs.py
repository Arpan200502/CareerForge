#!/usr/bin/env python3
"""
Job scraper using Adzuna API only.
Outputs JSON to stdout for the Node.js backend to consume.
"""
import json
import sys
import requests

SEARCH_TERMS = [
    "software engineer", "full stack developer",
    "backend developer", "frontend developer", "internship",
    "data scientist", "devops engineer", "web developer",
]

EXPERIENCE_KEYWORDS = {
    "entry": ["entry", "junior", "fresher", "graduate", "trainee", "0 year", "1 year", "intern"],
    "mid": ["mid", "2 year", "3 year", "4 year", "associate", "intermediate"],
    "senior": ["senior", "lead", "principal", "staff", "architect", "manager", "head", "5 year", "6 year", "7 year", "8 year", "9 year", "10 year"],
}

TECH_KEYWORDS = [
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node.js", "nodejs", "express", "django", "flask", "spring", "go", "rust",
    "c++", "c#", "ruby", "php", "sql", "mongodb", "postgresql", "mysql",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "git",
    "html", "css", "sass", "tailwind", "bootstrap", "redux", "graphql",
    "rest api", "api", "microservices", "agile", "scrum", "jenkins",
    "ci/cd", "linux", "redis", "kafka", "hadoop", "spark", "machine learning",
    "tensorflow", "pytorch", "nlp", "deep learning", "data science",
    "nosql", "elasticsearch", "rabbitmq", "grpc", "websocket",
    "swift", "kotlin", "dart", "flutter", "react native",
    "shell", "bash", "powershell", "nginx", "apache", "ansible", "puppet",
    "tableau", "power bi", "excel", "looker", "snowflake", "bigquery",
]

ADZUNA_COUNTRY_MAP = {
    "india": "in", "usa": "us", "united states": "us", "uk": "gb",
    "united kingdom": "gb", "canada": "ca", "australia": "au",
    "germany": "de", "france": "fr", "netherlands": "nl",
    "singapore": "sg", "uae": "ae", "united arab emirates": "ae",
}


def infer_experience_level(title, description):
    text = (title + " " + description).lower()
    for level, keywords in EXPERIENCE_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return level
    return "mid"


def extract_skills(title, description):
    text = (title + " " + description).lower()
    skills = []
    for kw in TECH_KEYWORDS:
        if kw in text:
            display_map = {
                "node.js": "Node.js", "nodejs": "Node.js", "ci/cd": "CI/CD",
                "rest api": "REST API", "c++": "C++", "c#": "C#",
            }
            display = display_map.get(kw, kw.title())
            skills.append(display)
    return list(dict.fromkeys(skills))[:10]


def adzuna_location(location_name):
    loc = location_name.strip().lower()
    for name, code in ADZUNA_COUNTRY_MAP.items():
        if name in loc:
            return code, loc.replace(name, "").strip().rstrip(",").strip()
    return "in", ""


def fetch_adzuna(search_term, location, app_id, api_key, max_results=50):
    if not app_id or not api_key:
        return []
    country_code, city = adzuna_location(location)
    if not country_code:
        return []
    base = f"https://api.adzuna.com/v1/api/jobs/{country_code}/search"
    per_page = min(50, max_results)
    pages = (max_results + per_page - 1) // per_page
    all_jobs = []
    for page in range(1, pages + 1):
        try:
            resp = requests.get(
                f"{base}/{page}",
                params={
                    "app_id": app_id,
                    "app_key": api_key,
                    "results_per_page": per_page,
                    "what": search_term,
                    "where": city or location,
                    "content-type": "application/json",
                },
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            for job in results:
                norm = {
                    "title": job.get("title", ""),
                    "company": job.get("company", {}).get("display_name", ""),
                    "location": job.get("location", {}).get("display_name", ""),
                    "city": "",
                    "state": "",
                    "country": country_code.upper(),
                    "description": (job.get("description") or "")[:20000],
                    "url": job.get("redirect_url", ""),
                    "salary": "",
                    "skills": extract_skills(job.get("title", ""), job.get("description", "") or ""),
                    "jobType": "full_time",
                    "isRemote": False,
                    "datePosted": (job.get("created") or "")[:10],
                    "source": "adzuna",
                    "experienceLevel": infer_experience_level(job.get("title", ""), job.get("description", "") or ""),
                }
                ctime = (job.get("contract_time") or "").lower()
                if ctime == "part_time":
                    norm["jobType"] = "part_time"
                elif ctime == "contract":
                    norm["contract_type"] = "contract"
                sal_min = job.get("salary_min")
                sal_max = job.get("salary_max")
                if sal_min is not None and sal_max is not None:
                    try:
                        mn, mx = int(sal_min), int(sal_max)
                        norm["salary"] = f"${mn:,} - ${mx:,}/yr"
                    except (ValueError, TypeError):
                        pass
                desc_lower = (job.get("description") or "").lower()
                if any(kw in desc_lower for kw in ["remote", "work from home", "wfh", "telecommute"]):
                    norm["isRemote"] = True
                all_jobs.append(norm)
        except requests.RequestException as e:
            print(f"[Adzuna] Error for '{search_term}' page {page}: {e}", file=sys.stderr)
            break
    return all_jobs


def main():
    try:
        args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
        location = args.get("location", "India")
        results_wanted = args.get("results_wanted", 500)
        search_terms = args.get("search_terms", SEARCH_TERMS)
        adzuna_app_id = args.get("adzuna_app_id", "")
        adzuna_key = args.get("adzuna_key", "")
        has_adzuna = bool(adzuna_app_id and adzuna_key)

        if not has_adzuna:
            print(json.dumps({"success": False, "error": "Adzuna API credentials not configured"}))
            sys.exit(1)

        all_results = []
        seen_titles = set()

        for i, term in enumerate(search_terms):
            term_results = []

            print(f"[Adzuna] Fetching '{term}'...", file=sys.stderr)
            try:
                adzuna_jobs = fetch_adzuna(term, location, adzuna_app_id, adzuna_key, max_results=50)
                term_results.extend(adzuna_jobs)
                print(f"[Adzuna] '{term}': got {len(adzuna_jobs)} jobs", file=sys.stderr)
            except Exception as e:
                print(f"[Adzuna] Error for term '{term}': {e}", file=sys.stderr)

            new_for_term = 0
            for job in term_results:
                key = (job["title"].lower(), job["company"].lower(), job["location"].lower())
                if key not in seen_titles:
                    seen_titles.add(key)
                    all_results.append(job)
                    new_for_term += 1

            print(f"[Adzuna] '{term}': {new_for_term} new jobs (total: {len(all_results)})", file=sys.stderr)

            partial = {"success": True, "jobs": all_results[:results_wanted], "_partial": True, "_completed": i + 1, "_total": len(search_terms)}
            print(json.dumps(partial))
            sys.stdout.flush()

            if len(all_results) >= results_wanted:
                break

        print(json.dumps({"success": True, "jobs": all_results[:results_wanted], "_partial": False}))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
