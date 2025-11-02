use std::{
    fs,
    path::PathBuf,
    sync::RwLock,
    time::{Duration, SystemTime},
};

use keyring::Entry;
use reqwest::{blocking::Client as HttpClient, header::AUTHORIZATION};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use tauri::Manager;
use thiserror::Error;

const SERVICE: &str = "org.instances.finder";
const USERNAME: &str = "instances_social_token";
const API_BASE_URL: &str = "https://instances.social/api/1.0";
const USER_AGENT: &str = concat!("instances-finder/", env!("CARGO_PKG_VERSION"));
const HTTP_TIMEOUT_SECS: u64 = 20;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("no token available")]
    NoToken,
}

#[derive(Debug, Default)]
pub struct AppState {
    pub token: RwLock<Option<String>>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct FetchParams {
    pub language: Option<String>,
    pub include_closed: Option<bool>,
    pub include_down: Option<bool>,
    pub max: Option<usize>,
    pub signups: Option<String>, // "open" | "approval"
    pub region: Option<String>,  // "eu" | "na" | "other"
    pub size: Option<String>,    // "small" | "medium" | "large"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JsInstance {
    pub domain: String,
    pub description: String,
    pub languages: Vec<String>,
    pub signups: String, // "open" | "approval"
    pub size: u8,
    #[serde(rename = "sizeLabel")]
    pub size_label: String,
    pub region: String,
    pub availability: f32,
}

#[derive(Serialize, Deserialize)]
struct CacheFile {
    saved_at: u64,
    params: FetchParams,
    items: Vec<JsInstance>,
}

struct InstancesSocialClient {
    http: HttpClient,
    token: String,
}

impl InstancesSocialClient {
    fn new(token: &str) -> Result<Self, String> {
        let http = HttpClient::builder()
            .user_agent(USER_AGENT)
            .timeout(Duration::from_secs(HTTP_TIMEOUT_SECS))
            .build()
            .map_err(|e| e.to_string())?;
        Ok(Self {
            http,
            token: token.to_string(),
        })
    }

    fn sample(&self, count: u64) -> Result<(), String> {
        let mut query = Vec::new();
        if count > 0 {
            query.push(("count", count.to_string()));
        }
        self.get::<serde_json::Value>("instances/sample", &query)
            .map(|_| ())
    }

    fn list(&self, params: &FetchParams, count: u64) -> Result<ListResponse, String> {
        let mut query = vec![("count", count.to_string())];
        if let Some(include_down) = params.include_down {
            query.push(("include_down", include_down.to_string()));
        }
        if let Some(include_closed) = params.include_closed {
            query.push(("include_closed", include_closed.to_string()));
        }
        if let Some(language) = &params.language {
            if !language.trim().is_empty() {
                query.push(("language", language.clone()));
            }
        }
        self.get("instances/list", &query)
    }

    fn get<T>(&self, path: &str, query: &[(&str, String)]) -> Result<T, String>
    where
        T: DeserializeOwned,
    {
        let url = format!("{API_BASE_URL}/{path}");
        let mut request = self.http.get(url);
        if !query.is_empty() {
            request = request.query(&query);
        }
        let response = request
            .header(AUTHORIZATION, format!("Bearer {}", self.token))
            .send()
            .map_err(|e| e.to_string())?;

        let status = response.status();
        if !status.is_success() {
            let body = response.text().unwrap_or_default();
            return Err(format!("instances.social returned {}: {}", status, body));
        }
        response.json().map_err(|e| e.to_string())
    }
}

#[derive(Debug, Deserialize)]
struct ListResponse {
    instances: Vec<Instance>,
}

#[derive(Clone, Debug, Deserialize)]
struct Instance {
    name: String,
    up: bool,
    users: String,
    open_registrations: bool,
    info: Option<InstanceInfo>,
}

#[derive(Clone, Debug, Deserialize)]
struct InstanceInfo {
    short_description: Option<String>,
    languages: Option<Vec<String>>,
}

fn cache_path(app: &tauri::AppHandle) -> PathBuf {
    let mut dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir());
    dir.push("instances-finder");
    let _ = fs::create_dir_all(&dir);
    dir.push("instances_cache.json");
    dir
}

#[tauri::command]
pub fn token_status(state: tauri::State<'_, AppState>) -> bool {
    if state.token.read().unwrap().is_some() {
        return true;
    }
    match Entry::new(SERVICE, USERNAME) {
        Ok(e) => e.get_password().is_ok(),
        Err(_) => false,
    }
}

#[tauri::command]
pub fn save_token(
    state: tauri::State<'_, AppState>,
    token: String,
    persist: bool,
) -> Result<(), String> {
    if persist {
        let entry = Entry::new(SERVICE, USERNAME).map_err(|e| e.to_string())?;
        entry.set_password(&token).map_err(|e| e.to_string())?;
    }
    // also keep in memory for this session
    *state.token.write().unwrap() = Some(token);
    Ok(())
}

#[tauri::command]
pub fn clear_token(state: tauri::State<'_, AppState>) -> Result<(), String> {
    if let Ok(entry) = Entry::new(SERVICE, USERNAME) {
        // keyring v3 uses `delete_credential` instead of `delete_password`
        let _ = entry.delete_credential();
    }
    *state.token.write().unwrap() = None;
    Ok(())
}

fn get_token(state: &tauri::State<'_, AppState>) -> Option<String> {
    if let Some(t) = state.token.read().unwrap().clone() {
        return Some(t);
    }
    if let Ok(entry) = Entry::new(SERVICE, USERNAME) {
        entry.get_password().ok()
    } else {
        None
    }
}

#[tauri::command]
pub fn test_token(state: tauri::State<'_, AppState>, token: Option<String>) -> Result<(), String> {
    let t = token
        .or_else(|| get_token(&state))
        .ok_or_else(|| ApiError::NoToken.to_string())?;
    let client = InstancesSocialClient::new(&t)?;
    client.sample(1)?;
    Ok(())
}

#[tauri::command]
pub fn clear_instances_cache(app: tauri::AppHandle) -> Result<(), String> {
    let p = cache_path(&app);
    if p.exists() {
        fs::remove_file(p).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn fetch_instances(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    params: FetchParams,
    bypass_cache: Option<bool>,
) -> Result<Vec<JsInstance>, String> {
    // cache 24h (skip in debug or when bypass_cache=true)
    let cache_file = cache_path(&app);
    let want_cache = !bypass_cache.unwrap_or(false) && !cfg!(debug_assertions);
    if want_cache {
        if let Ok(bytes) = fs::read(&cache_file) {
            if let Ok(cache) = serde_json::from_slice::<CacheFile>(&bytes) {
                let age = SystemTime::UNIX_EPOCH + Duration::from_secs(cache.saved_at);
                if age.elapsed().unwrap_or_default() < Duration::from_secs(24 * 3600)
                    && cache.params == params
                {
                    return Ok(cache.items);
                }
            }
        }
    }

    let t = get_token(&state).ok_or_else(|| ApiError::NoToken.to_string())?;
    let client = InstancesSocialClient::new(&t)?;
    let max = params.max.unwrap_or(200);
    let resp = client.list(&params, max as u64)?;

    fn map_region_from_domain(domain: &str) -> String {
        let d = domain.to_lowercase();
        let eu_tlds = [
            ".eu", ".fr", ".de", ".it", ".es", ".pt", ".pl", ".nl", ".be", ".lu", ".ie", ".se",
            ".fi", ".dk", ".cz", ".sk", ".si", ".hr", ".gr", ".bg", ".ro", ".hu", ".lt", ".lv",
            ".ee", ".cy", ".mt", ".is", ".no",
        ];
        if d.ends_with(".us") || d.ends_with(".ca") {
            return "na".into();
        }
        if eu_tlds.iter().any(|t| d.ends_with(t)) {
            return "eu".into();
        }
        "other".into()
    }

    let items: Vec<JsInstance> = resp
        .instances
        .into_iter()
        .filter_map(|i| {
            let users_i64 = i.users.parse::<i64>().unwrap_or(0);
            let size = if users_i64 <= 2000 {
                1
            } else if users_i64 <= 10000 {
                2
            } else {
                3
            } as u8;
            let size_label = if size == 1 {
                "Petite"
            } else if size == 2 {
                "Moyenne"
            } else {
                "Grande"
            };
            let langs = i
                .info
                .as_ref()
                .and_then(|inf| inf.languages.clone())
                .unwrap_or_default();
            let region = map_region_from_domain(&i.name);

            // Client-side filters
            if let Some(sig) = &params.signups {
                if (sig == "open" && !i.open_registrations)
                    || (sig == "approval" && i.open_registrations)
                {
                    return None;
                }
            }
            if let Some(reg) = &params.region {
                if &region != reg {
                    return None;
                }
            }
            if let Some(sz) = &params.size {
                let want = if sz == "small" {
                    1
                } else if sz == "medium" {
                    2
                } else {
                    3
                };
                // keep near target (allow +-1 only for medium)
                if sz == "medium" {
                    if !(size == 1 || size == 2) {
                        return None;
                    }
                } else if size != want {
                    return None;
                }
            }
            if let Some(lang) = &params.language {
                if !langs.iter().any(|l| l == lang) {
                    return None;
                }
            }

            Some(JsInstance {
                domain: i.name.clone(),
                description: i
                    .info
                    .as_ref()
                    .and_then(|inf| inf.short_description.clone())
                    .unwrap_or_default(),
                languages: langs,
                signups: if i.open_registrations {
                    "open".into()
                } else {
                    "approval".into()
                },
                size,
                size_label: size_label.into(),
                region,
                availability: if i.up { 0.999 } else { 0.4 },
            })
        })
        .collect();

    let cache = CacheFile {
        saved_at: SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        params,
        items: items.clone(),
    };
    if want_cache {
        if let Ok(bytes) = serde_json::to_vec(&cache) {
            let _ = fs::write(cache_file, bytes);
        }
    }

    Ok(items)
}

#[tauri::command]
pub fn fetch_languages(state: tauri::State<'_, AppState>) -> Result<Vec<String>, String> {
    let t = get_token(&state).ok_or_else(|| ApiError::NoToken.to_string())?;
    let client = InstancesSocialClient::new(&t)?;
    // Fetch a larger sample to discover languages
    let resp = client.list(
        &FetchParams {
            language: None,
            include_closed: None,
            include_down: None,
            max: None,
            signups: None,
            region: None,
            size: None,
        },
        500,
    )?;
    use std::collections::BTreeSet;
    let mut set = BTreeSet::new();
    for i in resp.instances {
        if let Some(info) = i.info {
            if let Some(langs) = info.languages {
                for l in langs {
                    if !l.trim().is_empty() {
                        set.insert(l.to_lowercase());
                    }
                }
            }
        }
    }
    Ok(set.into_iter().collect())
}
